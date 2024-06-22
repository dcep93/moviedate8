const URL =
  "https://de25.seedr.cc/ff_get_premium/5452648787/Friday.the.13th.1980.720p.BluRay.x264.YIFY.mp4?st=pPFHh_78Y4a9_Yi5npDsrA&e=1719255536";

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
