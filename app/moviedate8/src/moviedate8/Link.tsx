import { createRef } from "react";
import attachSubtitles from "./attachSubtitles";

const URL =
  "https://rs16.seedr.cc/ff_get_premium/5568409521/Y2K.2024.720p.WEB.H264-SLOT.mkv?st=WjyTx3fUObLRGCiGXPe8Jg&e=1735271943";

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
