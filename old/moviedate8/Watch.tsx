import React from "react";
import firebase, { StateEnum, WatcherType } from "./firebase";
import css from "./index.module.css";
import { getUsername } from "./User";

const ALIGN_INTERVAL_MS = 10000;
const OFFSET_MS_CUTOFF_SMALL = 100;
const OFFSET_MS_CUTOFF_BIG = 2000;

const videoRef = React.createRef<HTMLVideoElement>();

type PropsType = {
  leaderW?: WatcherType;
  leaderProps?: {
    resolve: () => void;
    urls: string[];
  };
};

type StateType = { start?: number; opened?: boolean; nextUrls?: string[] };

class Watch extends React.Component<PropsType, StateType> {
  static interval?: NodeJS.Timer;

  componentDidMount() {
    this.componentDidUpdate({}, {});
  }

  componentDidUpdate(prevProps: PropsType, prevState: StateType) {
    const leaderW = this.props.leaderW;
    if (this.props.leaderProps) {
      if (!prevProps.leaderProps) {
        Promise.resolve()
          .then(() => clearInterval(Watch.interval))
          .then(() => this.setUrl(this.props.leaderProps!.urls[0]))
          .then(() =>
            this.setState({
              opened: true,
              nextUrls: this.props.leaderProps!.urls.slice(1),
            })
          )
          .then(() => this.send(Date.now()))
          .then(this.props.leaderProps.resolve);
      }
    } else if (leaderW) {
      if (this.state?.opened && leaderW.start !== this.state?.start) {
        Promise.resolve()
          .then(() => clearInterval(Watch.interval))
          .then(() => this.setUrl(leaderW.url))
          .then(() => this.setState({ start: leaderW.start }));
      } else if (this.state?.start !== prevState?.start) {
        Promise.resolve()
          .then(() => clearInterval(Watch.interval))
          .then(() => this.align())
          .then(
            () =>
              (Watch.interval = setInterval(
                () => this.align(),
                ALIGN_INTERVAL_MS
              ))
          );
      }
    }
  }

  setUrl(url: string) {
    if (videoRef.current!.src === url) return;
    return new Promise((resolve, reject) => {
      videoRef.current!.oncanplay = resolve;
      videoRef.current!.onerror = () => {
        reject(videoRef.current!.error!.message);
      };
      videoRef.current!.onplay = videoRef.current!.onpause = () =>
        this.send(Date.now());
      videoRef.current!.onended = () => {
        if ((this.state?.nextUrls || []).length > 0) {
          Promise.resolve()
            .then(() => clearInterval(Watch.interval))
            .then(() =>
              this.setState({ nextUrls: this.state!.nextUrls!.slice(1) })
            )
            .then(() => this.setUrl(this.state!.nextUrls![0]))
            .then(() => this.send(Date.now()));
        }
      };
      videoRef.current!.src = url;
    }).catch((err) => {
      alert(err || "unknown error");
      throw err;
    });
  }

  send(start?: number) {
    const userName = getUsername()!;
    return firebase.writeWatcher(userName, {
      userName,
      start: start || this.state.start!,
      timestamp: Date.now(),
      url: videoRef.current!.src,
      progress: videoRef.current!.currentTime,
      speed: videoRef.current!.playbackRate,
      state: videoRef.current!.paused ? StateEnum.paused : StateEnum.playing,
    });
  }

  align() {
    Promise.resolve()
      .then(() => {
        const leader = this.props.leaderW!;
        if (leader && leader.userName !== getUsername()) {
          const video = videoRef.current!;
          if (leader.state === StateEnum.paused) {
            if (!video.paused) video.pause();
            video.currentTime = leader.progress;
          } else {
            return Promise.resolve()
              .then(() => (video.paused ? video.play() : null))
              .then(() => {
                if (video.paused) video.play();
                const now = Date.now();
                const leaderNormalizedTime =
                  leader.progress * 1000 - leader.timestamp;
                const myNormalizedTime = video.currentTime * 1000 - now;
                const diffMs = leaderNormalizedTime - myNormalizedTime;
                if (Math.abs(diffMs) < OFFSET_MS_CUTOFF_SMALL) {
                  video.playbackRate = leader.speed;
                } else if (Math.abs(diffMs) < OFFSET_MS_CUTOFF_BIG) {
                  video.playbackRate =
                    diffMs / ALIGN_INTERVAL_MS + leader.speed;
                } else {
                  video.currentTime =
                    leader.progress + (now - leader.timestamp) / 1000;
                  video.playbackRate = leader.speed;
                }
              });
          }
        }
      })
      .then(() => this.send());
  }

  render() {
    return (
      <div>
        {!this.state?.opened && (
          <button
            className={css.openbutton}
            onClick={() => this.setState({ opened: true })}
          >
            Open Video Player
          </button>
        )}
        <video
          hidden={!this.state?.opened}
          controls={this.props.leaderW?.userName === getUsername()}
          className={css.video}
          ref={videoRef}
        />
      </div>
    );
  }
}

export default Watch;
