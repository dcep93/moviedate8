import { createRef } from "react";
import attachSubtitles from "./attachSubtitles";

const URL =
  "https://nw4.seedr.cc/ff_get_premium/5452650545/The.Cable.Guy.1996.1080p.BluRay.x264-[YTS.AM].mp4?st=y7_jhHlE5REmDUW_sDNFxg&e=1719385961";

export default function Link() {
  return (
    <Video
      url={URL}
      subtitlesUrl="https://my-subs.co/download/film-623559.srt"
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
