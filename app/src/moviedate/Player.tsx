import { useEffect, useRef } from "react";
import Chromecast from "./Chromecast";

export type LibraryValue = { src: string; subs?: string };

export type PlayerConfig = LibraryValue & {};

export default function Player(playerConfig: PlayerConfig) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => Chromecast.initializeScript, []);
  useEffect(() => Chromecast.initializeVideo(videoRef), [videoRef]);

  return (
    <div>
      <div style={{ width: "100vW", height: "100vH" }}>
        <video
          ref={videoRef}
          src={playerConfig.src}
          controls
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          x-webkit-airplay="allow"
        />
      </div>
    </div>
  );
}
