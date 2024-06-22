const URL =
  "https://de25.seedr.cc/ff_get_premium/5452648787/Friday.the.13th.1980.720p.BluRay.x264.YIFY.mp4?st=pPFHh_78Y4a9_Yi5npDsrA&e=1719255536https://nw4.seedr.cc/ff_get_premium/5452650545/The.Cable.Guy.1996.1080p.BluRay.x264-[YTS.AM].mp4?st=6i6K6TV03MRhXd7jvjWvcw&e=1719255759";

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
