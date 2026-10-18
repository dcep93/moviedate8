import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

const root = process.env.MOVIED8_TEST_ROOT;
if (!root?.startsWith('/codex-sync-tests/')) throw new Error('An isolated test database root is required');
const database = `https://movied8-default-rtdb.firebaseio.com${root}`;
const origin = 'http://127.0.0.1:4173';
const contexts: BrowserContext[] = [];
const errors: string[] = [];

async function read(path = '') {
  const response = await fetch(`${database}${path}.json`);
  if (!response.ok) throw new Error(`Firebase read failed: ${response.status}`);
  return response.json();
}

async function write(path: string, value: unknown) {
  const response = await fetch(`${database}${path}.json`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
  });
  if (!response.ok) throw new Error(`Firebase write failed: ${response.status}`);
}

async function client(browser: Browser, route: string, requireClick = false) {
  const context = await browser.newContext();
  contexts.push(context);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  if (requireClick) {
    await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      let clicked = false;
      document.addEventListener('click', () => { clicked = true; }, { capture: true, once: true });
      HTMLMediaElement.prototype.play = function () {
        if (!clicked) {
          return Promise.reject(new DOMException('Gesture required by test', 'NotAllowedError'));
        }
        return play.call(this);
      };
    });
  }
  await page.goto(`${origin}${route}`);
  return page;
}

async function enter(page: Page) {
  const button = page.getByRole('button', { name: 'Enter', exact: true });
  // Either the probe succeeds automatically, or the browser requests a gesture.
  await expect(page.locator('video')).toHaveCount(1);
  if (await button.isVisible()) {
    await button.click({ timeout: 1500 }).catch(async error => {
      // The automatic probe may finish between visibility checking and the click.
      if (await button.isVisible()) throw error;
    });
  }
  await expect(button).toBeHidden();
}

async function loaded(page: Page, movie: string) {
  await expect.poll(() => page.locator('video').evaluate((video: HTMLVideoElement) =>
    ({ source: video.currentSrc, ready: video.readyState >= 2 })),
  ).toEqual({ source: `${origin}/tests/fixtures/movie.mp4?movie=${movie}`, ready: true });
}

async function playing(page: Page, value: boolean) {
  await expect.poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => !video.paused)).toBe(value);
}

test.beforeEach(async () => {
  errors.length = 0;
  await write('', { library: {
    example1: { src: `${origin}/tests/fixtures/movie.mp4?movie=one` },
    example2: { src: `${origin}/tests/fixtures/movie.mp4?movie=two` },
  } });
});

test.afterEach(async () => {
  await Promise.all(contexts.splice(0).map(context => context.close()));
  await write('', null);
  expect(errors).toEqual([]);
});

test('two keyed viewers and a follower share controls without echoing', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  const second = await client(browser, '/?k=example1');
  await enter(second);
  await loaded(second, 'one');
  const follower = await client(browser, '/f');
  await enter(follower);
  await loaded(follower, 'one');

  await first.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await playing(second, true);
  await playing(follower, true);
  await second.locator('video').evaluate((v: HTMLVideoElement) => v.pause());
  await playing(first, false);
  await playing(follower, false);
  await second.locator('video').evaluate((v: HTMLVideoElement) => { v.playbackRate = 1.5; v.currentTime = 20; });
  for (const page of [first, follower]) {
    await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(1.5);
    await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => Math.abs(v.currentTime - 20))).toBeLessThan(0.5);
  }
  const saved = await read('/playback/example1');
  await follower.locator('video').evaluate((v: HTMLVideoElement) => { v.currentTime = 5; });
  await first.waitForTimeout(2200);
  expect(await read('/playback/example1')).toEqual(saved);

  await first.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await playing(follower, true);
  const late = await client(browser, '/?k=example1');
  await enter(late);
  await loaded(late, 'one');
  await playing(late, true);
  const firstTime = await first.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect.poll(() => late.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(firstTime - 2);
});

test('follower switches movies while preserving its video element', async ({ browser }) => {
  const controller = await client(browser, '/?k=example1');
  await enter(controller);
  await loaded(controller, 'one');
  const follower = await client(browser, '/f');
  await enter(follower);
  await loaded(follower, 'one');
  const element = await follower.locator('video').elementHandle();
  await controller.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await playing(follower, true);
  await controller.getByRole('button', { name: 'example2', exact: true }).click();
  await loaded(controller, 'two');
  await loaded(follower, 'two');
  await playing(follower, false);
  expect(await element!.evaluate(v => v === document.querySelector('video'))).toBe(true);
  await controller.locator('video').evaluate((v: HTMLVideoElement) => { v.currentTime = 12; v.playbackRate = 2; });
  await controller.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await playing(follower, true);
  await expect.poll(() => follower.locator('video').evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(2);
  await controller.locator('video').evaluate((v: HTMLVideoElement) => v.pause());
  await playing(follower, false);
});

test('presence counts connected tabs and removes a closed follower', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  const second = await client(browser, '/?k=example1');
  await enter(second);
  const follower = await client(browser, '/f');
  await enter(follower);
  await loaded(follower, 'one');
  await expect.poll(async () => Object.keys((await read('/presence')) ?? {}).length).toBe(3);
  await expect.poll(async () => Object.values((await read('/presence')) ?? {}).filter(v => (v as { follower?: boolean }).follower).length).toBe(1);
  await follower.context().close();
  contexts.splice(contexts.indexOf(follower.context()), 1);
  await expect.poll(async () => Object.keys((await read('/presence')) ?? {}).length, { timeout: 30000 }).toBe(2);
});

test('sync off isolates playback and re-enabling adopts the shared state', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  const second = await client(browser, '/?k=example1');
  await enter(second);
  await loaded(second, 'one');
  await second.getByRole('checkbox', { name: 'Sync', exact: true }).uncheck();
  await first.locator('video').evaluate((v: HTMLVideoElement) => { v.currentTime = 25; v.playbackRate = 1.5; });
  await first.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await first.waitForTimeout(1200);
  await playing(second, false);
  await second.getByRole('checkbox', { name: 'Sync', exact: true }).check();
  await playing(second, true);
  await expect.poll(() => second.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(25);
});

test('blocked entry is one word, retries on click, and never publishes the probe', async ({ browser, browserName }) => {
  const page = await client(browser, '/?k=example1', true);
  const button = page.getByRole('button', { name: 'Enter', exact: true });
  await expect(button).toBeVisible();
  await expect(page.locator('.entry-overlay')).toHaveText('Enter');
  expect(await page.locator('.entry-overlay').boundingBox()).toMatchObject({ x: 0, y: 0, width: 1280, height: 720 });
  await page.screenshot({ path: `test-results/entry-${browserName}.png` });
  const before = await read('/playback/example1');
  await page.waitForTimeout(500);
  expect(await read('/playback/example1')).toEqual(before);
  await button.click();
  await expect(button).toBeHidden();
  await loaded(page, 'one');
  await playing(page, false);
  await page.waitForTimeout(500);
  expect(await read('/playback/example1')).toEqual(before);
});

test('allowed autoplay dismisses entry without a click', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'This project explicitly enables Chromium autoplay');
  const page = await client(browser, '/?k=example1');
  await expect(page.getByRole('button', { name: 'Enter', exact: true })).toBeHidden();
  await loaded(page, 'one');
  expect(await page.locator('video').evaluate((v: HTMLVideoElement) => ({ muted: v.muted, volume: v.volume })))
    .toEqual({ muted: false, volume: 1 });
  expect(await read('/playback/example1')).toBeNull();
});

test('later autoplay rejection restores Enter and resumes latest shared state', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  const follower = await client(browser, '/f');
  await enter(follower);
  await loaded(follower, 'one');
  await follower.evaluate(() => {
    const play = HTMLMediaElement.prototype.play;
    let blocked = true;
    document.addEventListener('click', () => { blocked = false; }, { capture: true, once: true });
    HTMLMediaElement.prototype.play = function () {
      if (blocked) return Promise.reject(new DOMException('Later autoplay blocked', 'NotAllowedError'));
      return play.call(this);
    };
  });
  await first.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await expect(follower.getByRole('button', { name: 'Enter', exact: true })).toBeVisible();
  await first.locator('video').evaluate((v: HTMLVideoElement) => { v.currentTime = 30; });
  await expect.poll(async () => (await read('/playback/example1'))?.currentTime).toBeGreaterThanOrEqual(30);
  const state = await read('/playback/example1');
  await follower.getByRole('button', { name: 'Enter', exact: true }).click();
  await expect(follower.getByRole('button', { name: 'Enter', exact: true })).toBeHidden();
  await playing(follower, true);
  await expect.poll(() => follower.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThanOrEqual(30);
  expect(await read('/playback/example1')).toEqual(state);
});

test('standalone route keeps the entry gate and plays its supplied source', async ({ browser }) => {
  const src = `${origin}/tests/fixtures/movie.mp4?movie=standalone`;
  const page = await client(browser, `/s?src=${encodeURIComponent(src)}`);
  await enter(page);
  await loaded(page, 'standalone');
  expect(await read('/active')).toBeNull();
  expect(await read('/playback')).toBeNull();
});

test('background playback does not steal the global selection', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  await first.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  const second = await client(browser, '/?k=example2');
  await enter(second);
  await loaded(second, 'two');
  const follower = await client(browser, '/f');
  await enter(follower);
  await loaded(follower, 'two');
  await first.waitForTimeout(3500);
  expect((await read('/active')).key).toBe('example2');
  await loaded(follower, 'two');
  // An explicit action on the old key should select it again.
  await first.locator('video').evaluate((v: HTMLVideoElement) => v.pause());
  await loaded(follower, 'one');
  await playing(follower, false);
});

test('an offline action cannot overwrite newer playback after reconnect', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  const second = await client(browser, '/?k=example1');
  await enter(second);
  await loaded(second, 'one');
  await second.context().setOffline(true);
  await second.locator('video').evaluate((v: HTMLVideoElement) => { v.currentTime = 6; });
  await first.locator('video').evaluate((v: HTMLVideoElement) => { v.currentTime = 40; });
  await expect.poll(async () => (await read('/playback/example1'))?.currentTime).toBe(40);
  const newest = await read('/playback/example1');
  await second.context().setOffline(false);
  await expect.poll(() => second.locator('video').evaluate((v: HTMLVideoElement) => Math.abs(v.currentTime - 40)), { timeout: 30000 }).toBeLessThan(0.5);
  expect(await read('/playback/example1')).toEqual(newest);
});

test('local files survive client-side route changes on the same video element', async ({ browser }) => {
  const page = await client(browser, '/');
  await enter(page);
  const element = await page.locator('video').elementHandle();
  await page.getByLabel('Local video').setInputFiles('tests/fixtures/movie.mp4');
  await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentSrc.startsWith('blob:') && v.readyState >= 2)).toBe(true);
  await page.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await playing(page, true);
  await page.getByRole('link', { name: 'Follow', exact: true }).click();
  await expect(page.locator('.statusbar')).toHaveCount(0);
  await expect(page.locator('video')).not.toHaveAttribute('src');
  await page.goBack();
  await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentSrc.startsWith('blob:') && v.readyState >= 2)).toBe(true);
  expect(await element!.evaluate(v => v === document.querySelector('video'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Enter', exact: true })).toBeHidden();
  expect(await read('/active')).toBeNull();
  expect(await read('/playback')).toBeNull();
});

test('a server-accepted own update wins after an intervening remote update', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  const follower = await client(browser, '/f');
  await enter(follower);
  await loaded(follower, 'one');
  let release!: () => void;
  let capture!: (value: Record<string, unknown>) => void;
  const released = new Promise<void>(resolve => { release = resolve; });
  const captured = new Promise<Record<string, unknown>>(resolve => { capture = resolve; });
  await first.route(`${database}.json`, async route => {
    const request = route.request();
    const values = request.method() === 'PATCH' ? request.postDataJSON() : null;
    if (values?.['playback/example1']?.paused === false) {
      capture(values['playback/example1']);
      await released;
    }
    await route.continue();
  });
  try {
    await first.locator('video').evaluate((v: HTMLVideoElement) => v.play());
    const pending = await captured;
    await write('/playback/example1', { ...pending, paused: true, currentTime: 14, updatedAt: Date.now(), sender: 'other-viewer' });
    await playing(first, false);
    release();
    await expect.poll(async () => (await read('/playback/example1'))?.paused).toBe(false);
    await playing(first, true);
    await playing(follower, true);
  } finally { release(); }
});

test('seeking to the end is shared and remains at the end', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  const follower = await client(browser, '/f');
  await enter(follower);
  await loaded(follower, 'one');
  await first.locator('video').evaluate((v: HTMLVideoElement) => { v.currentTime = v.duration; });
  await expect.poll(async () => (await read('/playback/example1'))?.currentTime).toBe(90);
  await expect.poll(() => follower.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBe(90);
  await first.waitForTimeout(2000);
  expect(await first.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBe(90);
});

test('write rejection is visible and restores authoritative playback', async ({ browser }) => {
  const page = await client(browser, '/?k=example1');
  await enter(page);
  await loaded(page, 'one');
  await page.route(`${database}.json`, async route => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"Permission denied"}' });
    } else await route.continue();
  });
  await page.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await expect(page.getByRole('alert')).toContainText('Database write failed (403)');
  await playing(page, false);
  expect(await read('/playback/example1')).toBeNull();
});

test('write count is local, counts successful requests, and survives reloads', async ({ browser }) => {
  const first = await client(browser, '/?k=example1');
  await enter(first);
  await loaded(first, 'one');
  const second = await client(browser, '/?k=example1');
  await enter(second);
  await loaded(second, 'one');
  const count = async (page: Page) => Number((await page.getByText(/^\d+ writes$/).innerText()).split(' ')[0]);
  // Each tab registers presence and announces its initial key selection.
  await expect.poll(() => count(first)).toBeGreaterThanOrEqual(2);
  await expect.poll(() => count(second)).toBeGreaterThanOrEqual(2);
  const firstBefore = await count(first);
  const secondBefore = await count(second);

  await first.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await playing(second, true);
  await expect.poll(() => count(first)).toBe(firstBefore + 1);
  expect(await count(second)).toBe(secondBefore);

  await first.route(`${database}.json`, async route => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"Permission denied"}' });
    } else await route.continue();
  });
  await first.locator('video').evaluate((v: HTMLVideoElement) => v.pause());
  await expect(first.getByRole('alert')).toContainText('Database write failed (403)');
  expect(await count(first)).toBe(firstBefore + 1);
  await first.unroute(`${database}.json`);

  await first.reload();
  await enter(first);
  await loaded(first, 'one');
  await expect.poll(() => count(first)).toBeGreaterThanOrEqual(firstBefore + 3);
});
