const URL =
  "https://rs9.seedr.cc/ff_get_premium/5453374179/The.Equalizer.2.2018.1080p.BluRay.x264-[YTS.AM].mp4?st=at6x8dcVtfEdLZfCgJIjDg&e=1719374487";

export default function Link() {
  return (
    <video
      style={{ width: "100%" }}
      controls
      onError={(e) => alert(`error: ${JSON.stringify(e)}`)}
      src={URL}
    />
  );
}
