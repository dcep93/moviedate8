# MovieD8

A browser video library with Firebase playback synchronization. Run `npm install` and `npm run dev` from this directory.

## Playback

- Open `/?k=movie-key` or select a library movie to make it the globally selected movie. Sync is on by default. Clients on the same key share intentional play, pause, seek, and playback-rate changes; the latest action wins. Joining resumes the saved state instead of resetting the movie. Selecting an existing movie retains its state; new movies start paused at zero.
- `/f` follows the global selection and its playback in a full-viewport player, without navigation, status text, or counts. Followers never choose the global key or publish playback.
- Turn **Sync** off to use local playback. Turning it back on adopts the shared state. Background playback, received changes, and drift correction never change the global selection.
- `/s?src=https://example.com/movie.mp4` and local file selection remain available without shared playback. An empty path in the library form plays an unsaved URL. Existing `/s` without a source uses the bundled default URL.
- A fullscreen **Enter** overlay initially covers every route. The same persistent video element first attempts a short bundled silent clip with a real AAC audio track, unmuted at normal volume. Only a successful `play()` promise dismisses the overlay; otherwise Enter retries directly from the click. The latest movie state is then restored, including paused state. Later browser autoplay denial restores Enter. There is no stored permission flag.
- Counts show connected tabs watching the current key and all connected `/f` tabs, including your own. Counts can lag abrupt network disconnection. No account is required.
- Outside `/f`, connection, database permissions/write failures, invalid or missing sources, and media-load failures appear below the player. Offline playback stays local. Offline actions are discarded rather than replayed on reconnect; reconnection adopts the current shared state.

The video DOM element stays mounted across library, source, and route changes. Chromecast launching remains available; synchronization of an actual cast receiver is outside this feature. Browser autoplay rules still vary by browser and device; a successful desktop test does not establish Safari/iOS behavior on physical hardware.

## Data and tests

Firebase uses `https://movied8-default-rtdb.firebaseio.com` and `/root` by default:

- `library/{key}`: `{ src, subs? }`, with remotely accessible HTTP(S) video URLs.
- `playback/{key}`: `{ paused, currentTime, playbackRate, updatedAt, sender, actionRevision? }`.
- `active`: `{ key, updatedAt, sender }`.
- `presence/{tabId}`: `{ key, follower }`, registered with Firebase disconnect cleanup and renewed on reconnect.

Intentional actions atomically PATCH playback and active selection using server timestamps. REST writes are serialized in action order; disconnect aborts in-flight requests and invalidates queued actions, with no SDK offline replay queue. SDK realtime subscriptions receive state and server-clock offset. Running position is extrapolated from the server timestamp and rate; drift above 0.75 seconds is corrected locally every 1.5 seconds. No playback ticks are written.

Set `VITE_DATABASE_ROOT=/your-isolated-test-root` before starting Vite to isolate all app data from `/root`. This is a build-time configuration. Database security rules must permit the reads and writes; the app adds no authentication or backend. Existing security rules are unchanged.

```sh
npm run build
npm run lint
npm run test:unit
npx playwright install chromium webkit
npm run test:e2e
```

Focused unit tests cover validation, bounded position math, entry playback and retry, remote-event echo suppression, read-only followers, later autoplay denial, stale source-play promise rejection, acknowledgment ordering, and offline write cancellation. Browser integration tests in `tests/playback.spec.ts` exercise real Firebase with an isolated root; use the Playwright configuration supplied in this directory.

The browser suite uses a unique `/codex-sync-tests/run-*` namespace, generated local video fixtures, and Chromium/WebKit. It deletes its namespace after each test and never changes `/root`. It requires internet access to Firebase. The automatic-entry test explicitly enables Chromium autoplay; rejection tests simulate denied playback until a click. WebKit automation is not a substitute for a physical iPhone check.
