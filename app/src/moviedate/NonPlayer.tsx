import { useRef } from "react";
import _firebase from "./_firebase";
import type { PlayerConfig } from "./Player";
import { rootPath } from "./Root";

export type Data = {
  library: { [key: string]: string };
};

export default function NonPlayer({
  data,
  setPlayerConfig,
}: {
  data: Data;
  setPlayerConfig: (playerConfig: PlayerConfig) => void;
}) {
  const pathInputRef = useRef<HTMLInputElement>(null);
  const srcInputRef = useRef<HTMLInputElement>(null);
  function submit() {
    const path = pathInputRef.current?.value;
    const src = srcInputRef.current?.value;
    if (path && src) {
      _firebase._set(libraryPath(path), src);
    }
  }
  return (
    <div>
      <ul>
        {Object.entries(data.library).map(([key, src]) => (
          <li key={key}>
            <button onClick={() => _firebase._set(libraryPath(key), null)}>
              ❌
            </button>
            <button onClick={() => setPlayerConfig({ src })}>{key}</button>
          </li>
        ))}
      </ul>
      <div>
        <input ref={pathInputRef} onSubmit={submit} />
        <input ref={srcInputRef} onSubmit={submit} />
        <button onClick={submit}>💾</button>
      </div>
    </div>
  );
}

function libraryPath(key: string) {
  return `${rootPath}/library/${key}`;
}
