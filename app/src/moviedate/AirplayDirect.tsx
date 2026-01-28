import { useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export default function AirplayDirect() {
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = useMemo(() => searchParams.get("src") ?? "", [searchParams]);

  const handleAirplayPicker = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const airplayVideo = video as HTMLVideoElement & {
      webkitShowPlaybackTargetPicker?: () => void;
    };
    airplayVideo.webkitShowPlaybackTargetPicker?.();
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>AirPlay Direct</h2>
      <p>
        Use a publicly reachable HLS/MP4 URL. When AirPlay is enabled, compatible
        receivers can fetch the URL directly.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button onClick={handleAirplayPicker}>Choose AirPlay device</button>
        <span>{src ? "Ready to cast" : "Provide a src param to begin"}</span>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          x-webkit-airplay="allow"
          style={{ width: "100%", maxHeight: "70vh" }}
        />
      </div>
      <p style={{ marginTop: "0.75rem" }}>
        Tip: If the TV cannot reach the URL, AirPlay will fall back to streaming
        from this device.
      </p>
    </div>
  );
}
