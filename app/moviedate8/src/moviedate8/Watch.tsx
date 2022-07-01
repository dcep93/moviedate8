import React from "react";
import firebase, { StateEnum, WatcherType } from "./firebase";
import css from "./index.module.css";
import { getUsername } from "./User";

const ALIGN_INTERVAL_MS = 10000;
const OFFSET_MS_CUTOFF_SMALL = 100;
const OFFSET_MS_CUTOFF_BIG = 2000;

const videoRef = React.createRef<HTMLVideoElement>();

type PropsType = {
  leader?: WatcherType;
  leaderProps?: {
    resolve: () => void;
    url: string;
  };
};

type StateType = { start?: number };

class Watch extends React.Component<PropsType, StateType> {
  static interval?: NodeJS.Timer;

  constructor(props: PropsType) {
    super(props);

    this.componentDidUpdate({}, {});
  }

  componentDidUpdate(prevProps: PropsType, prevState: StateType) {
    const leader = this.props.leader;
    if (this.props.leaderProps) {
      if (!prevProps.leaderProps) {
        Promise.resolve()
          .then(() => clearInterval(Watch.interval))
          .then(() => this.setUrl(this.props.leaderProps!.url))
          .then(() => this.send(Date.now()))
          .then(this.props.leaderProps.resolve);
      }
    } else if (leader) {
      if (leader.start !== this.state?.start) {
        Promise.resolve()
          .then(() => clearInterval(Watch.interval))
          .then(() => this.setUrl(leader.url))
          .then(() => this.setState({ start: leader.start }));
      } else if (this.state.start !== prevState?.start) {
        Promise.resolve()
          .then(() => clearInterval(Watch.interval))
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
    return new Promise((resolve, reject) => {
      videoRef.current!.oncanplay = resolve;
      videoRef.current!.onerror = () => {
        reject(videoRef.current!.error!.message);
      };
      // videoRef.current!.onplay = videoRef.current!.onpause = () =>
      //   this.send(Date.now());
      videoRef.current!.src = url;
    }).catch((err) => {
      alert(err);
      throw err;
    });
  }

  send(start?: number) {
    const user_name = getUsername()!;
    return firebase.writeWatcher(user_name, {
      user_name,
      start: start || this.state.start!,
      timestamp: Date.now(),
      url: videoRef.current!.src,
      progress: videoRef.current!.currentTime,
      speed: videoRef.current!.playbackRate,
      state: videoRef.current!.paused ? StateEnum.paused : StateEnum.playing,
    });
  }

  align() {
    const leader = this.props.leader!;
    if (leader.user_name !== getUsername()) {
      const video = videoRef.current!;
      if (leader.state === StateEnum.paused) {
        if (!video.paused) video.pause();
        video.currentTime = leader.progress;
      } else {
        if (video.paused) video.play();
        const now = Date.now();
        const leaderNormalizedTime = leader.progress * 1000 - leader.timestamp;
        const myNormalizedTime = video.currentTime * 1000 - now;
        const diffMs = leaderNormalizedTime - myNormalizedTime;
        if (Math.abs(diffMs) < OFFSET_MS_CUTOFF_SMALL) {
          video.playbackRate = leader.speed;
        } else if (Math.abs(diffMs) < OFFSET_MS_CUTOFF_BIG) {
          video.playbackRate = diffMs / ALIGN_INTERVAL_MS + leader.speed;
        } else {
          video.currentTime = leader.progress + (now - leader.timestamp) / 1000;
          video.playbackRate = leader.speed;
        }
      }
    }
    this.send();
  }

  render() {
    return (
      <div>
        <video controls className={css.video} ref={videoRef} />
      </div>
    );
  }
}

export default Watch;
