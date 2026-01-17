import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import _firebase from "./_firebase";
import type { LibraryValue, PlayerConfig } from "./Player";
import { rootPath } from "./Root";

const K_QUERY_PARAM = "k";

export type Data = {
  library: { [key: string]: LibraryValue };
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
  const subsInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  function submit() {
    const path = pathInputRef.current?.value;
    const src = srcInputRef.current?.value;
    const subs = subsInputRef.current?.value;
    if (path) {
      searchParams.set(K_QUERY_PARAM, path);
      if (src) {
        _firebase._set(libraryPath(path), !subs ? { src } : { src, subs });
      }
    }
  }
  const key = searchParams.get(K_QUERY_PARAM);
  const libraryConfig = data?.library?.[key ?? ""];
  useEffect(() => {
    if (!libraryConfig) return;
    setPlayerConfig(libraryConfig);
  }, [data?.library, libraryConfig, setPlayerConfig]);
  useEffect(() => {
    if (!key) return;
    if (!pathInputRef.current) return;
    pathInputRef.current!.value = key;
    if (!libraryConfig) return;
    if (!srcInputRef.current) return;
    srcInputRef.current!.value = libraryConfig.src;
  }, [pathInputRef, srcInputRef, key, libraryConfig]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        submit();
      }
    };

    const pathInput = pathInputRef.current;
    const srcInput = srcInputRef.current;
    const subsInput = subsInputRef.current;

    pathInput?.addEventListener("keydown", handleKeyDown);
    srcInput?.addEventListener("keydown", handleKeyDown);
    subsInput?.addEventListener("keydown", handleKeyDown);

    return () => {
      pathInput?.removeEventListener("keydown", handleKeyDown);
      srcInput?.removeEventListener("keydown", handleKeyDown);
      subsInput?.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathInputRef, srcInputRef, subsInputRef, submit]);
  return (
    <div>
      {!data ? null : (
        <ul>
          {Object.entries(data.library ?? {}).map(([key, value]) => (
            <li key={key}>
              <button
                onClick={() => _firebase._set(libraryPath(key), null)}
                title={JSON.stringify({ key, value }, null, 2)}
              >
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
      <div style={{ display: "flex" }}>
        <div>
          <div>path</div>
          <input ref={pathInputRef} onSubmit={submit} />
        </div>
        <div>
          <div>src</div>
          <input ref={srcInputRef} onSubmit={submit} />
        </div>
        <div>
          <div>subs</div>
          <input ref={subsInputRef} onSubmit={submit} />
        </div>
        <div>
          <div>save</div>
          <button onClick={submit}>💾</button>
        </div>
      </div>
    </div>
  );
}

function libraryPath(key: string) {
  return `${rootPath}/library/${key}`;
}
