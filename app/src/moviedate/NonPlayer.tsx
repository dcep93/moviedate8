import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import _firebase from "./_firebase";
import type { PlayerConfig } from "./Player";
import { rootPath } from "./Root";

export type Data = {
  library: { [key: string]: string };
} | null;

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
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  console.log({ key });
  useEffect(() => {
    if (!key) return;
    const src = data?.library?.[key];
    if (!src) return;
    setPlayerConfig({ src });
  }, [data?.library, key, setPlayerConfig]);
  return (
    <div>
      <ul>
        {Object.keys(data?.library ?? []).map((key) => (
          <li key={key}>
            <button onClick={() => _firebase._set(libraryPath(key), null)}>
              ❌
            </button>
            <button onClick={() => searchParams.set("key", key)}>{key}</button>
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
