import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryValue, type LibraryValue } from './sync';
import { validKey } from './playbackState';

export default function NonPlayer({ library, currentKey, onSelect, onLocal, onLocalFile, onSave, onDelete, onError }: {
  library: Record<string, unknown>;
  currentKey: string | null;
  onSelect: (key: string) => void;
  onLocal: (value: LibraryValue) => void;
  onLocalFile: (file: File) => void;
  onSave: (key: string, value: LibraryValue) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onError: (error: string) => void;
}) {
  const selected = currentKey ? libraryValue(library[currentKey]) : null;
  const selection = JSON.stringify([currentKey, selected]);
  const [lastSelection, setLastSelection] = useState(selection);
  const [path, setPath] = useState(currentKey || '');
  const [src, setSrc] = useState(selected?.src || '');
  const [subs, setSubs] = useState(selected?.subs || '');
  if (selection !== lastSelection) {
    setLastSelection(selection);
    setPath(currentKey || ''); setSrc(selected?.src || ''); setSubs(selected?.subs || '');
  }
  const fileInput = useRef<HTMLInputElement>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!src.trim()) { fileInput.current?.click(); return; }
    const value = libraryValue({ src: src.trim(), subs: subs.trim() });
    if (!value) { onError('Source must be an http or https video URL.'); return; }
    if (!path.trim()) { onLocal(value); return; }
    if (!validKey(path.trim())) { onError('Movie keys cannot contain . # $ [ ] / or control characters.'); return; }
    try { await onSave(path.trim(), value); onSelect(path.trim()); }
    catch (error) { onError(String(error)); }
  }
  return <section className="library">
    <form onSubmit={event => void submit(event)}>
      <label>path<input value={path} onChange={event => setPath(event.target.value)} /></label>
      <label>src<input value={src} onChange={event => setSrc(event.target.value)} /></label>
      <label>subs<input value={subs} onChange={event => setSubs(event.target.value)} /></label>
      <button type="submit">Submit</button>
    </form>
    <label>Local video<input ref={fileInput} type="file" accept="video/*" onChange={event => {
      const file = event.target.files?.[0];
      if (!file) return;
      onLocalFile(file);
    }} /></label>
    <div><Link to="/f">Follow</Link></div>
    <ul>{Object.entries(library).map(([key, value]) => <li key={key}>
      <button aria-label={`Delete ${key}`} onClick={() => void onDelete(key).catch(error => onError(String(error)))}>❌</button>{' '}
      <button onClick={() => {
        const movie = libraryValue(value);
        setPath(key); setSrc(movie?.src || ''); setSubs(movie?.subs || ''); onSelect(key);
      }}>{key}</button>
    </li>)}</ul>
  </section>;
}
