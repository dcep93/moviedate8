import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NonPlayer from './NonPlayer';
import Player from './Player';
import { SyncConnection, libraryValue, type LibraryValue, type SharedData } from './sync';
import { parsePlayback, validKey } from './playbackState';
import { PlaybackController } from './PlaybackController';
import staticPath from './static_path.txt?raw';

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const follower = location.pathname === '/f';
  const staticRoute = location.pathname === '/s';
  const params = new URLSearchParams(location.search);
  const requestedKey = params.get('k');
  const [data, setData] = useState<SharedData>({});
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [gate, setGate] = useState(true);
  const [error, setError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [local, setLocal] = useState<LibraryValue | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<SyncConnection | null>(null);
  const controllerRef = useRef<PlaybackController | null>(null);
  const selectionIntent = useRef({ navigation: '', pending: false, everConnected: false });
  const key = follower ? data.active?.key || null : staticRoute ? null : requestedKey;
  const safeKey = key && validKey(key) ? key : null;
  const config = staticRoute ? { src: params.get('src') || staticPath.trim() } : safeKey ? libraryValue(data.library?.[safeKey]) : follower ? null : local;
  const src = config?.src || null;
  const state = safeKey ? parsePlayback(data.playback?.[safeKey]) : null;
  const stateString = JSON.stringify(state);
  const shared = !!safeKey && !!config && ready && connected && (follower || syncEnabled);
  const actionRef = useRef({ safeKey, shared, follower });

  useEffect(() => { actionRef.current = { safeKey, shared, follower }; }, [safeKey, shared, follower]);
  useEffect(() => {
    const connection = new SyncConnection(value => { setData(value); setReady(true); }, setConnected, setError);
    connectionRef.current = connection;
    const controller = new PlaybackController(videoRef.current!, () => connection.now(), value => {
      const current = actionRef.current;
      if (!current.shared || current.follower || !current.safeKey) { controller.actionFailed(value.actionRevision); return; }
      void connection.publish(current.safeKey, value).then(() => setError('')).catch(error => {
        controller.actionFailed(value.actionRevision);
        setError(String(error));
      });
    }, setGate, setMediaError, connection.id);
    controllerRef.current = controller;
    controller.enter();
    return () => { controller.dispose(); connection.dispose(); };
  }, []);

  useEffect(() => {
    controllerRef.current?.setTarget({
      src, state: JSON.parse(stateString), shared, follower,
      identity: `${location.pathname}:${safeKey || src || ''}`,
    });
  }, [src, stateString, shared, follower, safeKey, location.pathname]);

  useEffect(() => { connectionRef.current?.setPresence({ key: safeKey, follower }); }, [safeKey, follower]);

  useEffect(() => {
    const source = local?.src;
    return () => { if (source?.startsWith('blob:')) URL.revokeObjectURL(source); };
  }, [local?.src]);

  useEffect(() => {
    const intent = selectionIntent.current;
    if (intent.navigation !== location.key) {
      intent.navigation = location.key;
      intent.pending = !follower && !staticRoute && syncEnabled && !!safeKey;
    }
    // A navigation while offline is local only, never replayed when connectivity returns.
    if (connected) intent.everConnected = true;
    if (!connected && intent.everConnected) intent.pending = false;
    if (!syncEnabled) intent.pending = false;
    if (intent.pending && connected && ready && safeKey && src) {
      intent.pending = false;
      void connectionRef.current?.select(safeKey).then(() => setError('')).catch(error => setError(String(error)));
    }
  }, [location.key, safeKey, src, connected, ready, syncEnabled, follower, staticRoute]);

  function select(key: string) {
    if (!validKey(key)) { setError('Invalid movie key.'); return; }
    setLocal(null);
    navigate(`/?k=${encodeURIComponent(key)}`);
  }
  const presence = Object.values(data.presence || {});
  const viewers = safeKey ? presence.filter(value => value?.key === safeKey).length : 0;
  const followers = presence.filter(value => value?.follower === true).length;
  const missing = key && !safeKey ? 'Invalid movie key.' : ready && safeKey && !config ? `Missing or invalid source for “${safeKey}”.` : '';
  return <>
    <main inert={gate}>
    <Player videoRef={videoRef} follower={follower} subs={config?.subs} />
    <div className="statusbar">
      <nav><Link to="/">Library</Link> · <Link to="/f">Follow</Link></nav>
      <span role="status">{connected ? 'Connected' : 'Disconnected — changes are local'}{follower ? ' · Following' : ''}{safeKey ? ` · ${safeKey}` : ''}</span>
      {!follower && <label><input type="checkbox" checked={syncEnabled} onChange={event => setSyncEnabled(event.target.checked)} /> Sync</label>}
      <span>{viewers} viewers · {followers} followers</span>
      {follower && !safeKey && ready && <span>Waiting for a movie selection.</span>}
      {(error || mediaError || missing) && <p role="alert">{error || mediaError || missing}</p>}
    </div>
    {!staticRoute && !follower && <NonPlayer library={data.library || {}} currentKey={safeKey}
      onSelect={select} onError={setError}
      onLocal={value => { setLocal(value); navigate('/'); }}
      onLocalFile={file => { setLocal({ src: URL.createObjectURL(file) }); navigate('/'); }}
      onSave={(key, value) => connectionRef.current!.patch({ [`library/${key}`]: value })}
      onDelete={key => validKey(key) ? connectionRef.current!.patch({ [`library/${key}`]: null }) : Promise.reject(new Error('Invalid movie key'))} />}
    </main>
    {gate && <div className="entry-overlay" role="dialog" aria-modal="true" aria-label="Enter"><button autoFocus onClick={() => controllerRef.current?.enter()}>Enter</button></div>}
  </>;
}
