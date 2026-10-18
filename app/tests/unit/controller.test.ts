import test from 'node:test';
import assert from 'node:assert/strict';
import { PlaybackController } from '../../src/moviedate/PlaybackController.ts';
import { initialPlayback, type PlaybackState } from '../../src/moviedate/playbackState.ts';

Object.defineProperty(globalThis, 'location', { value: { href: 'http://localhost/' }, configurable: true });
class Video extends EventTarget {
  src = '';
  currentTime = 0;
  duration = 120;
  paused = true;
  playbackRate = 1;
  muted = true;
  volume = 0;
  seeking = false;
  ended = false;
  readyState = 1;
  error = null;
  plays: { src: string; muted: boolean; volume: number }[] = [];
  playResult: () => Promise<void> = () => Promise.resolve();
  play() { this.plays.push({ src: this.src, muted: this.muted, volume: this.volume }); this.paused = false; return this.playResult(); }
  pause() { this.paused = true; }
  load() { this.currentTime = 0; this.readyState = 0; }
  removeAttribute() { this.src = ''; }
  metadata() { this.readyState = 1; this.dispatchEvent(new Event('loadedmetadata')); }
  event(name: string) { this.dispatchEvent(new Event(name)); }
}
const settle = () => new Promise(resolve => setImmediate(resolve));
function setup(sender = '', video = new Video()) {
  const actions: PlaybackState[] = [];
  const gates: boolean[] = [];
  const controller = new PlaybackController(video as unknown as HTMLVideoElement, () => 5000, state => actions.push(state), gate => gates.push(gate), () => {}, sender);
  return { video, actions, gates, controller };
}
const target = (state = initialPlayback(5000), src = 'http://localhost/movie.mp4') => ({ state, src, identity: src, shared: true, follower: false });

test('entry probes unmuted at normal volume synchronously and restores latest paused target without writes', async () => {
  const { video, actions, gates, controller } = setup();
  try {
    controller.setTarget(target({ ...initialPlayback(5000), currentTime: 12 }));
    controller.enter();
    assert.deepEqual(video.plays[0], { src: 'http://localhost/silent-entry.mp4', muted: false, volume: 1 });
    video.event('play');
    await settle();
    video.metadata(); video.event('seeked'); video.event('pause');
    assert.deepEqual(gates, [false]);
    assert.equal(video.currentTime, 12);
    assert.equal(video.paused, true);
    assert.equal(actions.length, 0);
  } finally { controller.dispose(); }
});

test('remote play, seek, pause and speed never echo; local action publishes once', async () => {
  const { video, actions, controller } = setup();
  try {
    controller.setTarget(target()); controller.enter(); await settle(); video.metadata();
    controller.setTarget(target({ paused: false, currentTime: 20, playbackRate: 2, updatedAt: 4000, sender: 'remote' }));
    video.event('play'); video.event('seeked'); video.event('ratechange');
    assert.equal(video.currentTime, 22); assert.equal(actions.length, 0);
    video.pause(); video.event('pause');
    assert.equal(actions.length, 1); assert.equal(actions[0].paused, true);
  } finally { controller.dispose(); }
});

test('follower local controls revert and never publish', async () => {
  const { video, actions, controller } = setup();
  try {
    controller.setTarget({ ...target(), follower: true }); controller.enter(); await settle(); video.metadata();
    await video.play(); video.event('play');
    assert.equal(video.paused, true); assert.equal(actions.length, 0);
  } finally { controller.dispose(); }
});

test('rejected probe keeps gate and synchronous retry succeeds', async () => {
  const { video, gates, controller } = setup();
  try {
    video.playResult = () => Promise.reject(new DOMException('blocked', 'NotAllowedError'));
    controller.enter(); await settle(); assert.deepEqual(gates, [true]);
    video.playResult = () => Promise.resolve();
    controller.enter(); assert.equal(video.plays.length, 2); await settle();
    assert.deepEqual(gates, [true, false]);
  } finally { controller.dispose(); }
});

test('old playback rejection cannot gate a newly selected source', async () => {
  const { video, gates, controller } = setup();
  try {
    controller.setTarget(target()); controller.enter(); await settle(); video.metadata();
    let reject!: (error: Error) => void;
    video.playResult = () => new Promise((_, fail) => { reject = fail; });
    controller.setTarget(target({ ...initialPlayback(5000), paused: false }));
    controller.setTarget(target(initialPlayback(5000), 'http://localhost/new.mp4'));
    reject(new DOMException('blocked', 'NotAllowedError')); await settle();
    assert.deepEqual(gates, [false]); assert.equal(video.src, 'http://localhost/new.mp4');
  } finally { controller.dispose(); }
});

test('later autoplay rejection restores gate', async () => {
  const { video, gates, controller } = setup();
  try {
    controller.setTarget(target()); controller.enter(); await settle(); video.metadata();
    video.playResult = () => Promise.reject(new DOMException('blocked', 'NotAllowedError'));
    controller.setTarget(target({ ...initialPlayback(5000), paused: false })); await settle();
    assert.deepEqual(gates, [false, true]);
  } finally { controller.dispose(); }
});


test('earlier own acknowledgments do not undo a newer local action', async () => {
  const { video, actions, controller } = setup('this-tab');
  try {
    controller.setTarget(target()); controller.enter(); await settle(); video.metadata();
    await video.play(); video.event('play');
    video.pause(); video.event('pause');
    assert.equal(actions.length, 2);
    controller.setTarget(target({ ...actions[0], updatedAt: 5001 }));
    assert.equal(video.paused, true);
    assert.equal(actions.length, 2);
  } finally { controller.dispose(); }
});


test('latest own accepted action supersedes an intervening remote action', async () => {
  const { video, actions, controller } = setup('this-tab');
  try {
    controller.setTarget(target()); controller.enter(); await settle(); video.metadata();
    await video.play(); video.event('play');
    assert.equal(actions[0].actionRevision, 1);
    controller.setTarget(target({ ...initialPlayback(5001), sender: 'other-tab' }));
    video.event('pause');
    assert.equal(video.paused, true);
    controller.setTarget(target({ ...actions[0], updatedAt: 5002 }));
    video.event('play');
    assert.equal(video.paused, false);
    assert.equal(actions.length, 1);
  } finally { controller.dispose(); }
});

test('failed newer action releases suppression and restores accepted previous action', async () => {
  const { video, actions, controller } = setup('this-tab');
  try {
    controller.setTarget(target()); controller.enter(); await settle(); video.metadata();
    await video.play(); video.event('play');
    video.pause(); video.event('pause');
    controller.setTarget(target({ ...actions[0], updatedAt: 5001 }));
    assert.equal(video.paused, true);
    controller.actionFailed(actions[1].actionRevision);
    assert.equal(video.paused, false);
    video.event('play');
    assert.equal(actions.length, 2);
  } finally { controller.dispose(); }
});

test('reenabling sync adopts unchanged own server state after offline local controls', async () => {
  const { video, actions, controller } = setup('this-tab');
  try {
    controller.setTarget(target()); controller.enter(); await settle(); video.metadata();
    await video.play(); video.event('play');
    const accepted = target({ ...actions[0], updatedAt: 5001 });
    controller.setTarget(accepted);
    controller.setTarget({ ...accepted, shared: false });
    video.pause(); video.event('pause');
    controller.setTarget(accepted);
    assert.equal(video.paused, false);
    assert.equal(actions.length, 1);
  } finally { controller.dispose(); }
});


// Browser media events are dispatched as later tasks, after subsequent play/pause calls
// may already have changed the element. These tests preserve that ordering.
class QueuedVideo extends Video {
  play() {
    const result = super.play();
    setTimeout(() => this.event('play'), 0);
    return result;
  }
  pause() {
    const wasPlaying = !this.paused;
    super.pause();
    if (wasPlaying) setTimeout(() => this.event('pause'), 0);
  }
  queue(name: string) { setTimeout(() => this.event(name), 0); }
}
const flushMediaTasks = () => new Promise(resolve => setTimeout(resolve, 10));

test('queued play event superseded by remote pause never echoes', async () => {
  const { video, actions, controller } = setup('this-tab', new QueuedVideo());
  try {
    controller.setTarget(target()); controller.enter(); await flushMediaTasks(); video.metadata();
    controller.setTarget(target({ ...initialPlayback(5001), paused: false, sender: 'remote' }));
    controller.setTarget(target({ ...initialPlayback(5002), paused: true, sender: 'remote' }));
    await flushMediaTasks();
    assert.equal(video.paused, true);
    assert.equal(actions.length, 0);
  } finally { controller.dispose(); }
});

test('queued pause event superseded by remote play never echoes', async () => {
  const { video, actions, controller } = setup('this-tab', new QueuedVideo());
  try {
    controller.setTarget(target({ ...initialPlayback(5000), paused: false, sender: 'remote' }));
    controller.enter(); await flushMediaTasks(); video.metadata(); await flushMediaTasks();
    controller.setTarget(target({ ...initialPlayback(5001), paused: true, sender: 'remote' }));
    controller.setTarget(target({ ...initialPlayback(5002), paused: false, sender: 'remote' }));
    await flushMediaTasks();
    assert.equal(video.paused, false);
    assert.equal(actions.length, 0);
  } finally { controller.dispose(); }
});

test('intentional seek to exact duration publishes even when media is ended', async () => {
  const media = new QueuedVideo();
  const { video, actions, controller } = setup('this-tab', media);
  try {
    controller.setTarget(target()); controller.enter(); await flushMediaTasks(); video.metadata();
    video.currentTime = video.duration;
    video.ended = true;
    media.queue('seeked'); await flushMediaTasks();
    assert.equal(actions.length, 1);
    assert.equal(actions[0].currentTime, video.duration);
    assert.equal(actions[0].paused, true);
  } finally { controller.dispose(); }
});

test('natural completion pause and remote seek to duration do not publish', async () => {
  const media = new QueuedVideo();
  const { video, actions, controller } = setup('this-tab', media);
  try {
    controller.setTarget(target({ ...initialPlayback(5000), paused: false, sender: 'remote' }));
    controller.enter(); await flushMediaTasks(); video.metadata(); await flushMediaTasks();
    video.currentTime = video.duration;
    video.ended = true;
    video.paused = true;
    media.queue('pause'); media.queue('ended'); await flushMediaTasks();
    assert.equal(actions.length, 0);
    video.currentTime = 0;
    video.ended = false;
    controller.setTarget(target({ ...initialPlayback(5001), currentTime: video.duration, sender: 'remote' }));
    video.ended = true;
    media.queue('seeked'); await flushMediaTasks();
    assert.equal(actions.length, 0);
  } finally { controller.dispose(); }
});
