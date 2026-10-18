import { onDisconnect, onValue, ref, remove, set, serverTimestamp } from 'firebase/database';
import { database, databaseURL, rootPath } from './_firebase';
import { WriteQueue } from './WriteQueue';
import { positionAt, validKey, type PlaybackState } from './playbackState';

export type LibraryValue = { src: string; subs?: string };
export type Presence = { key: string | null; follower: boolean };
export type SharedData = {
  library?: Record<string, unknown>;
  playback?: Record<string, unknown>;
  active?: { key?: string };
  presence?: Record<string, Presence>;
};

export function libraryValue(value: unknown): LibraryValue | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.src !== 'string') return null;
  try {
    const url = new URL(v.src);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return { src: url.href, ...(typeof v.subs === 'string' ? { subs: v.subs } : {}) };
  } catch { return null; }
}

/** REST writes deliberately have no offline retry queue. SDK listeners still provide realtime updates. */
export class SyncConnection {
  readonly id = crypto.randomUUID();
  connected = false;
  offset = 0;
  private disposed = false;
  private presence: Presence = { key: null, follower: false };
  private cleanups: (() => void)[] = [];
  private presenceVersion = 0;
  private presenceReady = false;
  private writes = new WriteQueue();
  private onStatus: (connected: boolean) => void;
  private onError: (error: string) => void;

  constructor(onData: (value: SharedData) => void, onStatus: (connected: boolean) => void, onError: (error: string) => void) {
    this.onStatus = onStatus;
    this.onError = onError;
    const failure = (error: Error) => onError(`Database permission/read error: ${error.message}`);
    this.cleanups.push(onValue(ref(database, rootPath), snap => onData(snap.val() || {}), failure));
    this.cleanups.push(onValue(ref(database, '.info/serverTimeOffset'), snap => { this.offset = Number(snap.val()) || 0; }));
    this.cleanups.push(onValue(ref(database, '.info/connected'), snap => {
      this.connected = snap.val() === true;
      this.presenceReady = false;
      this.writes.setConnected(this.connected);
      onStatus(this.connected);
      if (this.connected) void this.registerPresence();
      else {
        this.presenceVersion++;
      }
    }));
    window.addEventListener('pagehide', this.leave);
  }

  now() { return Date.now() + this.offset; }

  setPresence(presence: Presence) {
    this.presence = presence;
    if (this.connected) void this.registerPresence();
  }

  private async registerPresence() {
    const version = ++this.presenceVersion;
    const presenceRef = ref(database, `${rootPath}/presence/${this.id}`);
    try {
      await onDisconnect(presenceRef).remove();
      if (this.disposed || !this.connected || version !== this.presenceVersion) return;
      // set only after the disconnect handler is acknowledged; no stale registration on reconnect.
      await set(presenceRef, this.presence);
      if (this.disposed) { await remove(presenceRef); return; }
      this.presenceReady = true;
    } catch (error) { if (!this.disposed) this.onError(`Presence error: ${String(error)}`); }
  }

  patch(values: Record<string, unknown> | (() => Record<string, unknown>)): Promise<void> {
    return this.writes.run(async signal => {
      const response = await fetch(`${databaseURL}${rootPath}.json`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeof values === 'function' ? values() : values), signal,
      });
      if (!response.ok) throw new Error(`Database write failed (${response.status}): ${await response.text()}`);
    });
  }

  publish(key: string, state: PlaybackState) {
    if (!validKey(key)) return Promise.reject(new Error('Invalid movie key'));
    return this.patch(() => ({
      [`playback/${key}`]: { ...state, currentTime: positionAt(state, this.now()), sender: this.id, updatedAt: serverTimestamp() },
      active: { key, sender: this.id, updatedAt: serverTimestamp() },
    }));
  }

  select(key: string) {
    if (!validKey(key)) return Promise.reject(new Error('Invalid movie key'));
    return this.patch({ active: { key, sender: this.id, updatedAt: serverTimestamp() } });
  }

  private leave = () => {
    if (this.presenceReady && this.connected) void remove(ref(database, `${rootPath}/presence/${this.id}`));
  };

  dispose() {
    this.disposed = true;
    this.presenceVersion++;
    this.cleanups.forEach(cleanup => cleanup());
    this.writes.setConnected(false);
    this.leave();
    window.removeEventListener('pagehide', this.leave);
    this.onStatus(false);
  }
}
