import { initialPlayback, positionAt, type PlaybackState } from './playbackState.ts';

type Target = { src: string | null; state: PlaybackState | null; shared: boolean; follower: boolean; identity: string };

/** Owns the one media element, including permission probing and non-echoing remote application. */
export class PlaybackController {
  private video: HTMLVideoElement;
  private now: () => number;
  private onAction: (state: PlaybackState) => void;
  private onGate: (gated: boolean) => void;
  private onError: (message: string) => void;
  private sender: string;
  private actionRevision = 0;
  private pendingRevisions = new Set<number>();
  private target: Target = { src: null, state: null, shared: false, follower: false, identity: '' };
  private desired: PlaybackState;
  private remoteSignature = '';
  private gated = true;
  private generation = 0;
  private loaded = false;
  private expectedSeek: number | null = null;
  private disposed = false;
  private interval: ReturnType<typeof setInterval>;

  constructor(video: HTMLVideoElement, now: () => number, onAction: (state: PlaybackState) => void,
    onGate: (gated: boolean) => void, onError: (message: string) => void, sender = '') {
    this.video = video;
    this.now = now;
    this.onAction = onAction;
    this.onGate = onGate;
    this.onError = onError;
    this.sender = sender;
    this.desired = initialPlayback(now());
    for (const event of ['play', 'pause', 'ratechange', 'seeked']) video.addEventListener(event, this.mediaAction);
    video.addEventListener('loadedmetadata', this.metadata);
    video.addEventListener('error', this.mediaError);
    this.interval = setInterval(() => {
      if (this.target.shared && !this.gated) this.apply(false);
    }, 1500);
  }

  setTarget(target: Target) {
    const changed = target.src !== this.target.src || target.identity !== this.target.identity;
    const enabling = target.shared && !this.target.shared;
    const signature = JSON.stringify(target.state);
    if (changed || !target.shared) this.pendingRevisions.clear();
    const ownAcknowledgment = !!this.sender && target.state?.sender === this.sender;
    const revision = target.state?.actionRevision;
    const olderThanPending = ownAcknowledgment && revision !== undefined &&
      [...this.pendingRevisions].some(pending => pending > revision);
    if (ownAcknowledgment && revision !== undefined) {
      for (const pending of this.pendingRevisions) {
        if (pending <= revision) this.pendingRevisions.delete(pending);
      }
    }
    // Only an earlier acknowledgment with a newer local action still pending is suppressed.
    // The latest own action can legitimately supersede an intervening remote action.
    const newState = signature !== this.remoteSignature && !olderThanPending;
    this.remoteSignature = signature;
    this.target = target;
    if (changed || enabling || (target.shared && newState)) this.desired = target.state || initialPlayback(this.now());
    if (this.gated) return;
    if (changed) this.loadActual();
    else if (enabling || (target.shared && newState)) this.apply(true);
  }

  // Invoked directly in the Enter click handler: play() runs before any await or microtask.
  enter = () => {
    if (this.disposed) return;
    const video = this.video;
    const probe = new URL('/silent-entry.mp4', location.href).href;
    this.gated = true;
    this.loaded = false;
    const generation = ++this.generation;
    if (video.src !== probe) {
      video.src = probe;
      video.load();
    }
    video.muted = false;
    video.volume = 1;
    video.playbackRate = 1;
    const promise = video.play();
    void promise.then(() => {
      if (this.disposed || generation !== this.generation) return;
      this.gated = false;
      this.onGate(false);
      this.loadActual();
    }).catch(() => {
      if (!this.disposed && generation === this.generation) this.onGate(true);
    });
  };

  private loadActual() {
    this.generation++;
    this.loaded = false;
    this.expectedSeek = null;
    this.video.pause();
    if (this.target.src) this.video.src = this.target.src;
    else this.video.removeAttribute('src');
    this.video.load();
    this.onError('');
  }

  private metadata = () => {
    if (this.gated || !this.target.src || this.video.src !== new URL(this.target.src, location.href).href) return;
    this.loaded = true;
    this.apply(true);
  };

  private mediaError = () => {
    if (!this.gated && this.target.src) this.onError(`Media load failed${this.video.error ? ` (code ${this.video.error.code})` : ''}. Check the source URL and format.`);
  };

  private apply(force: boolean) {
    const video = this.video;
    if (this.gated || !this.loaded || !this.target.src) return;
    const position = positionAt(this.desired, this.now(), video.duration);
    const difference = Math.abs(video.currentTime - position);
    if (!video.seeking && difference > (force ? 0.08 : 0.75)) {
      this.expectedSeek = position;
      video.currentTime = position;
    }
    if (video.playbackRate !== this.desired.playbackRate) video.playbackRate = this.desired.playbackRate;
    if (this.desired.paused) {
      if (!video.paused) video.pause();
    } else if (video.paused && !video.ended) {
      const generation = this.generation;
      void video.play().catch(error => {
        if (this.disposed || generation !== this.generation || this.desired.paused) return;
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          this.gated = true;
          this.onGate(true);
        } else if (!(error instanceof DOMException && error.name === 'AbortError')) {
          this.onError(`Playback failed: ${String(error)}`);
        }
      });
    }
  }

  private mediaAction = (event: Event) => {
    const video = this.video;
    if (this.gated || !this.loaded || !this.target.src || video.readyState === 0) return;
    // Media events are queued tasks. A newer action may have already reversed the
    // element's state before an older play/pause notification reaches this handler.
    if (event.type === 'play' && video.paused) return;
    if (event.type === 'pause' && (!video.paused || video.ended)) return;
    // An explicit seek to duration is still an intentional action, even though
    // it sets ended. Natural completion's pause is excluded above instead.
    if (event.type === 'seeked' && this.expectedSeek !== null) {
      const expected = this.expectedSeek;
      this.expectedSeek = null;
      if (Math.abs(video.currentTime - expected) < 0.4) return;
    }
    if (event.type === 'play' && !this.desired.paused) return;
    if (event.type === 'pause' && this.desired.paused) return;
    if (event.type === 'ratechange' && video.playbackRate === this.desired.playbackRate) return;
    if (this.target.follower) { this.apply(true); return; }
    this.desired = {
      paused: video.paused, currentTime: video.currentTime,
      playbackRate: video.playbackRate, updatedAt: this.now(), sender: '',
    };
    if (this.target.shared) {
      this.desired.actionRevision = ++this.actionRevision;
      this.desired.sender = this.sender;
      this.pendingRevisions.add(this.actionRevision);
      this.onAction(this.desired);
    }
  };

  actionFailed(revision: number | undefined) {
    if (revision === undefined || !this.pendingRevisions.delete(revision)) return;
    if (this.target.shared && this.pendingRevisions.size === 0) {
      this.desired = this.target.state || initialPlayback(this.now());
      this.apply(true);
    }
  }

  dispose() {
    this.disposed = true;
    this.generation++;
    clearInterval(this.interval);
    for (const event of ['play', 'pause', 'ratechange', 'seeked']) this.video.removeEventListener(event, this.mediaAction);
    this.video.removeEventListener('loadedmetadata', this.metadata);
    this.video.removeEventListener('error', this.mediaError);
  }
}
