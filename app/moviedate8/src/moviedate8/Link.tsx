import { createRef } from "react";
import attachSubtitles from "./attachSubtitles";

const URL =
  "https://rs12.seedr.cc/ff_get_premium/5568410140/Y2K.2024.1080p.WEBRip.x264.AAC5.1-LAMA.mp4?st=Dj5UcQMrjtH6nAcP6ngibg&e=1735272131";

export default function Link() {
  return (
    <Video
      url={URL}
      // subtitlesUrl="https://my-subs.co/download/film-623559.srt"
    />
  );
}

function Video(props: { url: string; subtitlesUrl?: string }) {
  const ref = createRef<HTMLVideoElement>();
  return (
    <video
      ref={ref}
      style={{ width: "100%" }}
      controls
      onError={(e) => alert(`error: ${JSON.stringify(e)}`)}
      onCanPlay={() =>
        props.subtitlesUrl && attachSubtitles(ref.current!, props.subtitlesUrl)
      }
      src={props.url}
    />
  );
}
