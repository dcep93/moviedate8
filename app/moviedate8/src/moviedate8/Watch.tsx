import React from "react";
import firebase, { WatcherType } from "./firebase";
import { getUsername } from "./User";

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

    this.componentDidUpdate({});
  }

  componentDidUpdate(prevProps: PropsType) {
    const leader = this.props.leader;
    if (this.props.leaderProps) {
      if (!prevProps.leaderProps) {
        Promise.resolve()
          .then(() => clearInterval(Watch.interval))
          .then(() => this.setUrl(this.props.leaderProps!.url))
          .then(() => this.send(Date.now()))
          .then(this.props.leaderProps.resolve);
      }
    } else if (leader && leader.start !== this.state?.start) {
      Promise.resolve()
        .then(() => this.setState({ start: leader.start }))
        .then(() => this.setUrl(leader.url))
        .then(() => clearInterval(Watch.interval))
        .then(
          () =>
            (Watch.interval = setInterval(
              () => this.align(leader.start),
              ALIGN_INTERVAL_MS
            ))
        );
    }
  }

  setUrl(url: string) {}

  align(start: number) {
    this.send(start);
  }

  send(start: number) {
    return firebase.writeWatcher(getUsername()!, {
      start,
      timestamp: Date.now(),
      url: "",
      progress: 0,
      speed: 0,
      state: 0,
    });
  }

  render() {
    return (
      <div>
        <video ref={videoRef} />
      </div>
    );
  }
}

export default Watch;
