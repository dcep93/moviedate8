function Stream() {
  return (
    <video
      controls
      onError={(e) => alert(`error: ${JSON.stringify(e)}`)}
      src="https://rs16.seedr.cc/ff_get_premium/5450367353/Talk%20to%20Me%20(2023)%20(1080p%20BluRay%20x265%2010bit).mp4?st=S0Yo3k8zy7pWPbkNrQVAiQ&e=1718943560"
    />
  );
}

export default Stream;
