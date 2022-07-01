import React from "react";
import firebase, { StateEnum, WatcherType } from "./firebase";
import css from "./index.module.css";
import { getUsername } from "./User";

// https://nw6.seedr.cc/ff_get_premium/1193760934/Schitts%20Creek.S03E12%20Friends%20and%20Family.mkv?st=rDYBhpf5-ydEf0ZkzhLbNA&e=1656839231

const ALIGN_INTERVAL_MS = 1000;

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
      videoRef.current!.onchange = (event) => console.log(event);
      videoRef.current!.src = url;
    }).catch((err) => {
      alert(err);
      throw err;
    });
  }

  send(start?: number) {
    const state = this.getState();
    return firebase.writeWatcher(getUsername()!, {
      start: start || this.state.start!,
      timestamp: Date.now(),
      url: videoRef.current!.src,
      progress: videoRef.current!.currentTime,
      speed: videoRef.current!.playbackRate,
      state,
    });
  }

  align() {
    this.send();
  }

  getState(): StateEnum {
    return StateEnum.errored;
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
