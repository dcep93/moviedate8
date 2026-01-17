import { useRef } from "react";
import Chromecast from "./Chromecast";

export type LibraryValue = { src: string; subs?: string };

export type PlayerConfig = LibraryValue & {};

export default function Player(playerConfig: PlayerConfig) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div>
      <div style={{ width: "100vW", height: "100vH", position: "relative" }}>
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
        <Chromecast videoRef={videoRef} />
      </div>
    </div>
  );
}
