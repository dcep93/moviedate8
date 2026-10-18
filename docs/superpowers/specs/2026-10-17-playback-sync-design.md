# Playback sync and following

Approved by the user with `yesi` on 2026-10-17. Implement and verify without further design approval. Work on master, commit, and push as required by the workspace instructions.

## Behavior

- Existing `/?k=example` URLs share playback by key, enabled by default. Sync has an opt-out toggle. Last intentional action wins. Joining adopts saved playback without resetting it.
- New `/f` receives the global active key and its playback. Selecting a keyed video or intentionally controlling one selects it globally. Any keyed controller may change this selection. `/f` never publishes playback or selects the global key.
- Share paused state, currentTime, playbackRate, server timestamp, and sender identity. Calculate running position from elapsed server time and speed; correct drift locally. Received changes, media loading, initialization and drift corrections must not echo back. Do not continuously write playback ticks.
- Selecting a previously played key resumes that key's stored state; a new key starts paused at zero. Explicit movie selection announces the selected key even before play. Playback and active-key changes should be written atomically when publishing an action.
- Keep a single video DOM element mounted across route and source changes.
- Initially cover every route with a full viewport overlay whose only visible text is `Enter`. Play a short bundled clip containing an actual silent audio track, unmuted at normal volume, using that same video element. Successful playback dismisses the overlay. On failure the button retries playback directly in the click handler. After success apply the latest actual playback state, including paused states. Never publish probe events. On later autoplay rejection show the overlay again. Do not claim success based on a saved permission flag.
- Add anonymous connected-tab presence: viewers watching the current key and total active `/f` followers. Use disconnect cleanup and re-register on reconnect. No sign-in, names, or accounts.
- Report disconnected, permission/write, missing-source and media-load conditions clearly. Do not replay stale offline actions over new remote playback on reconnect.
- Existing `/s` and unsaved/local-file playback remain available with the entry overlay; shared sync is for keyed, remotely accessible URLs. Chromecast synchronization is outside this browser-player change.

## Implementation boundaries

Use the existing Firebase Realtime Database and `/root/library/{key}`. Add separate playback, active-selection, and presence records. Introduce a persistent app shell, focused playback controller and a small Firebase sync module. Replace the singleton class listener where necessary with cleaned-up subscriptions. Preserve the library editing and local-file functions. Do not introduce accounts or a new backend.

## Verification

Build and lint, focused state calculation/validation tests, and browser tests with isolated database data. Verify two keyed clients plus `/f`: play/pause/seek/rate in both directions; follower source switches; saved-state join; no echoes; sync off/on; presence connect/disconnect; no global selection changes from background drift; entry probe success and forced autoplay rejection; persistent video identity across switches; route `/s` and local playback. Observe actual playback promises and browser console errors. Cross-browser autoplay behavior must be reported honestly if not tested on physical Safari/iOS.

## Review

No unresolved design questions. Counts represent connected tabs, include the current tab, and can lag network disconnect detection. The full viewport entry screen is an overlay, not a navigation or the browser Fullscreen API.
