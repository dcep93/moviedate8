const initializeScript = () => {
  const script = document.createElement("script");
  script.src =
    "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
  script.async = true;
  document.body.appendChild(script);

  script.onload = () => {
    if (window.cast && window.cast.framework) {
      const context = cast.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });
    }
  };
};

const initializeVideo = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
) => {
  const current = videoRef.current;
  if ("mediaSession" in navigator && current) {
    navigator.mediaSession.setActionHandler("play", () => current.play());
    navigator.mediaSession.setActionHandler("pause", () => current.pause());
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      current.currentTime = Math.max(
        current.currentTime - (details.seekOffset || 10),
        0,
      );
    });
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      current.currentTime = Math.min(
        current.currentTime + (details.seekOffset || 10),
        current.duration,
      );
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        if (details.fastSeek && "fastSeek" in current) {
          current.fastSeek(details.seekTime);
        } else {
          current.currentTime = details.seekTime;
        }
      }
    });
    navigator.mediaSession.setActionHandler("stop", () =>
      videoRef.current?.pause(),
    );
    navigator.mediaSession.setActionHandler("previoustrack", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);

    navigator.mediaSession.setActionHandler("cast", () => {
      if (!window.cast || !window.cast.framework) {
        console.error("Google Cast SDK not loaded.");
        return;
      }

      const context = cast.framework.CastContext.getInstance();
      const session = context.getCurrentSession();

      if (session && videoRef.current) {
        const mediaInfo = new chrome.cast.media.MediaInfo(
          current.src,
          "video/mp4",
        );
        const request = new chrome.cast.media.LoadRequest(mediaInfo);

        session.loadMedia(request).then(
          () => console.log("Media loaded successfully to Chromecast"),
          (error) => console.error("Error loading media to Chromecast", error),
        );
      } else {
        console.error("No active Chromecast session");
      }
    });
  }
};

const ex = {
  initializeScript,
  initializeVideo,
};
export default ex;
