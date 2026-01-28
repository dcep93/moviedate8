import { useEffect, useRef, useState } from "react";
import Chromecast from "./Chromecast";

export type LibraryValue = { src: string; subs?: string };

export type PlayerConfig = LibraryValue & {};

export default function Player(playerConfig: PlayerConfig) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockError, setWakeLockError] = useState<string | null>(null);

  const requestWakeLock = async () => {
    if (!("wakeLock" in navigator)) {
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      wakeLockRef.current.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
      setWakeLockError(null);
    } catch (error) {
      setWakeLockError(
        error instanceof Error
          ? error.message
          : "Unable to enable wake lock.",
      );
    }
  };

  const releaseWakeLock = async () => {
    if (!wakeLockRef.current) {
      return;
    }

    await wakeLockRef.current.release();
    wakeLockRef.current = null;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handlePlay = () => {
      void requestWakeLock();
    };

    const handlePause = () => {
      void releaseWakeLock();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !video.paused) {
        void requestWakeLock();
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handlePause);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handlePause);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void releaseWakeLock();
    };
  }, []);

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
      <p style={{ marginTop: "0.5rem" }}>
        Keep this tab active to maintain AirPlay. We enable a wake lock during
        playback to prevent sleep, but closing the lid can still stop playback.
      </p>
      {wakeLockError ? (
        <p style={{ color: "tomato" }}>
          Wake lock unavailable: {wakeLockError}
        </p>
      ) : null}
    </div>
  );
}
