import {
  useEffect,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type RefObject,
} from "react";

export default function Chromecast({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  useEffect(() => void initializeScript(videoRef), [videoRef]);
  return (
    <google-cast-launcher
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        width: 32,
        height: 32,
      }}
    />
  );
}

type CastMediaInfo = {
  contentId: string;
  contentType: string;
};

type CastLoadRequest = {
  mediaInfo: CastMediaInfo;
};

declare global {
  interface Window {
    cast?: {
      framework?: {
        CastContext: {
          getInstance(): {
            setOptions(options: {
              receiverApplicationId: string;
              autoJoinPolicy: string;
            }): void;
            getCurrentSession(): {
              loadMedia(request: CastLoadRequest): Promise<void>;
            } | null;
            addEventListener(
              eventType: string,
              listener: (event: { sessionState?: string }) => void,
            ): void;
            requestSession?: () => Promise<void>;
          };
        };
        CastContextEventType?: {
          SESSION_STATE_CHANGED: string;
        };
        SessionState?: {
          SESSION_STARTED: string;
          SESSION_RESUMED: string;
        };
        RemotePlayer: new () => {
          isConnected: boolean;
          isPaused: boolean;
          currentTime: number;
          duration: number;
        };
        RemotePlayerController: new (player: {
          isConnected: boolean;
          isPaused: boolean;
          currentTime: number;
          duration: number;
        }) => {
          playOrPause: () => void;
          seek: () => void;
          stop: () => void;
          addEventListener: (eventType: string, listener: () => void) => void;
        };
        RemotePlayerEventType?: {
          IS_CONNECTED_CHANGED: string;
        };
      };
    };
  }
}

declare const chrome: {
  cast: {
    AutoJoinPolicy: {
      ORIGIN_SCOPED: string;
    };
    media: {
      DEFAULT_MEDIA_RECEIVER_APP_ID: string;
      MediaInfo: new (contentId: string, contentType: string) => CastMediaInfo;
      LoadRequest: new (mediaInfo: CastMediaInfo) => CastLoadRequest;
    };
  };
};

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "google-cast-launcher": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

const initializeScript = (videoRef: RefObject<HTMLVideoElement | null>) => {
  const script = document.createElement("script");
  script.src =
    "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
  script.async = true;
  document.body.appendChild(script);

  script.onload = () => {
    if (window.cast && window.cast.framework) {
      const context = window.cast.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });
    }
    initializeVideo(videoRef);
  };
};

const initializeVideo = (videoRef: RefObject<HTMLVideoElement | null>) => {
  const current = videoRef.current;
  if ("mediaSession" in navigator && current) {
    const castFramework = window.cast?.framework;
    const castContext = castFramework?.CastContext.getInstance();
    const remotePlayer = castFramework
      ? new castFramework.RemotePlayer()
      : null;
    const remotePlayerController =
      castFramework && remotePlayer
        ? new castFramework.RemotePlayerController(remotePlayer)
        : null;

    const loadRemoteMedia = () => {
      if (!castContext || !current) {
        return;
      }

      const session = castContext.getCurrentSession();
      const source = current.currentSrc || current.src;
      if (!session || !source) {
        return;
      }

      const mediaInfo = new chrome.cast.media.MediaInfo(source, "video/mp4");
      const request = new chrome.cast.media.LoadRequest(mediaInfo);

      session.loadMedia(request).then(
        () => {
          current.pause();
          console.log("Media loaded successfully to Chromecast");
        },
        (error) => console.error("Error loading media to Chromecast", error),
      );
    };

    if (castFramework?.RemotePlayerEventType && remotePlayerController) {
      remotePlayerController.addEventListener(
        castFramework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
        () => {
          if (remotePlayer?.isConnected) {
            current.pause();
          }
        },
      );
    }

    if (
      castFramework?.CastContextEventType &&
      castFramework?.SessionState &&
      castContext
    ) {
      castContext.addEventListener(
        castFramework.CastContextEventType.SESSION_STATE_CHANGED,
        (event) => {
          if (
            event.sessionState ===
              castFramework.SessionState?.SESSION_STARTED ||
            event.sessionState === castFramework.SessionState?.SESSION_RESUMED
          ) {
            loadRemoteMedia();
          }
        },
      );
    }

    const applyRemoteOrLocal = (
      localAction: () => void,
      remoteAction: () => void,
    ) => {
      if (remotePlayer?.isConnected) {
        remoteAction();
      } else {
        localAction();
      }
    };

    navigator.mediaSession.setActionHandler("play", () =>
      applyRemoteOrLocal(
        () => current.play(),
        () => {
          if (!remotePlayerController || !remotePlayer) {
            return;
          }
          if (remotePlayer.isPaused) {
            remotePlayerController.playOrPause();
          }
        },
      ),
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      applyRemoteOrLocal(
        () => current.pause(),
        () => {
          if (!remotePlayerController || !remotePlayer) {
            return;
          }
          if (!remotePlayer.isPaused) {
            remotePlayerController.playOrPause();
          }
        },
      ),
    );
    navigator.mediaSession.setActionHandler("seekbackward", (details) =>
      applyRemoteOrLocal(
        () => {
          current.currentTime = Math.max(
            current.currentTime - (details.seekOffset || 10),
            0,
          );
        },
        () => {
          if (!remotePlayer || !remotePlayerController) {
            return;
          }
          remotePlayer.currentTime = Math.max(
            remotePlayer.currentTime - (details.seekOffset || 10),
            0,
          );
          remotePlayerController.seek();
        },
      ),
    );
    navigator.mediaSession.setActionHandler("seekforward", (details) =>
      applyRemoteOrLocal(
        () => {
          current.currentTime = Math.min(
            current.currentTime + (details.seekOffset || 10),
            current.duration,
          );
        },
        () => {
          if (!remotePlayer || !remotePlayerController) {
            return;
          }
          remotePlayer.currentTime = Math.min(
            remotePlayer.currentTime + (details.seekOffset || 10),
            remotePlayer.duration,
          );
          remotePlayerController.seek();
        },
      ),
    );
    navigator.mediaSession.setActionHandler("seekto", (details) =>
      applyRemoteOrLocal(
        () => {
          if (details.seekTime !== undefined) {
            if (details.fastSeek && "fastSeek" in current) {
              current.fastSeek(details.seekTime);
            } else {
              current.currentTime = details.seekTime;
            }
          }
        },
        () => {
          if (
            details.seekTime === undefined ||
            !remotePlayer ||
            !remotePlayerController
          ) {
            return;
          }
          remotePlayer.currentTime = details.seekTime;
          remotePlayerController.seek();
        },
      ),
    );
    navigator.mediaSession.setActionHandler("stop", () =>
      applyRemoteOrLocal(
        () => current.pause(),
        () => remotePlayerController?.stop(),
      ),
    );
    navigator.mediaSession.setActionHandler("previoustrack", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
  }
};
