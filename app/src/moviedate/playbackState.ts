export type PlaybackState = {
  paused: boolean;
  currentTime: number;
  playbackRate: number;
  updatedAt: number;
  sender: string;
  actionRevision?: number;
};

export function validKey(key: string): boolean {
  return key.length > 0 && !Array.from(key).some(character => '.#$[]/'.includes(character) || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
}

export function parsePlayback(value: unknown): PlaybackState | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.paused !== 'boolean' || typeof v.sender !== 'string' ||
      typeof v.currentTime !== 'number' || !Number.isFinite(v.currentTime) || v.currentTime < 0 ||
      typeof v.playbackRate !== 'number' || !Number.isFinite(v.playbackRate) || v.playbackRate <= 0 || v.playbackRate > 16 ||
      typeof v.updatedAt !== 'number' || !Number.isFinite(v.updatedAt) || v.updatedAt < 0) return null;
  if (v.actionRevision !== undefined && (typeof v.actionRevision !== 'number' || !Number.isSafeInteger(v.actionRevision) || v.actionRevision < 1)) return null;
  return { ...(v.actionRevision !== undefined ? { actionRevision: v.actionRevision as number } : {}), paused: v.paused, currentTime: v.currentTime, playbackRate: v.playbackRate, updatedAt: v.updatedAt, sender: v.sender };
}

export function positionAt(state: PlaybackState, now: number, duration = Infinity): number {
  const elapsed = state.paused ? 0 : Math.max(0, now - state.updatedAt) / 1000 * state.playbackRate;
  return Math.max(0, Math.min(state.currentTime + elapsed, Number.isFinite(duration) ? duration : Infinity));
}

export function initialPlayback(now: number): PlaybackState {
  return { paused: true, currentTime: 0, playbackRate: 1, updatedAt: now, sender: '' };
}
