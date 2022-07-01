import React from "react";
import { StateEnum, WatchersType, WatcherType } from "./firebase";

const RENDER_INTERVAL_MS = 10;

class Info extends React.Component<{ leader: string; watchers: WatchersType }> {
  static interval?: NodeJS.Timer;
  componentDidMount() {
    clearInterval(Info.interval);
    Info.interval = setInterval(() => this.forceUpdate(), RENDER_INTERVAL_MS);
  }

  render() {
    const leaderW = this.props.watchers[this.props.leader];
    const sortedNonLeaders = Object.values(this.props.watchers)
      .filter((w) => w.user_name !== this.props.leader)
      .sort((a, b) => (a.user_name < b.user_name ? -1 : 1));
    return (
      <div>
        <div>
          <SubInfo w={leaderW} />
        </div>
        <div>
          {sortedNonLeaders.map((w) => (
            <SubInfo key={w.user_name} w={w} />
          ))}
        </div>
      </div>
    );
  }
}

function SubInfo(props: { w: WatcherType }) {
  const progress =
    props.w.progress +
    ((Date.now() - props.w.timestamp) *
      (props.w.state === StateEnum.playing ? props.w.speed : 0)) /
      1000;
  return (
    <div>
      {props.w.user_name} {progress.toFixed(2)} {props.w.speed}
    </div>
  );
}

export default Info;
