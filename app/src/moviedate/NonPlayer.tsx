import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import _firebase from "./_firebase";
import type { PlayerConfig } from "./Player";
import { rootPath } from "./Root";

const K_QUERY_PARAM = "k";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const key = searchParams.get(K_QUERY_PARAM);
  const src = data?.library?.[key ?? ""];
  useEffect(() => {
    if (!src) return;
    setPlayerConfig({ src });
  }, [data?.library, src, setPlayerConfig]);
  useEffect(() => {
    if (!key) return;
    if (!pathInputRef.current) return;
    pathInputRef.current!.value = key;
    if (!src) return;
    if (!srcInputRef.current) return;
    srcInputRef.current!.value = src;
  }, [pathInputRef, srcInputRef, src]);
  return (
    <div>
      {!data ? null : (
        <ul>
          {Object.keys(data.library ?? []).map((key) => (
            <li key={key}>
              <button onClick={() => _firebase._set(libraryPath(key), null)}>
                ❌
              </button>
              <button
                onClick={() =>
                  setSearchParams((p) => (p.set(K_QUERY_PARAM, key), p))
                }
              >
                {key}
              </button>
            </li>
          ))}
        </ul>
      )}
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
