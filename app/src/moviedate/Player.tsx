import { useEffect, useRef, useState } from "react";
import Chromecast from "./Chromecast";

export type LibraryValue = { src: string; subs?: string };

export type PlayerConfig = LibraryValue & {};

export default function Player(playerConfig: PlayerConfig) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [chromecastInitialized, setChromecastInitialized] = useState(false);
  useEffect(
    () =>
      void (
        !chromecastInitialized &&
        Chromecast.initializeScript(setChromecastInitialized)
      ),
    [],
  );
  useEffect(
    () => void (chromecastInitialized && Chromecast.initializeVideo(videoRef)),
    [chromecastInitialized, videoRef],
  );

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
        <google-cast-launcher
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            width: 32,
            height: 32,
          }}
        />
      </div>
    </div>
  );
}
