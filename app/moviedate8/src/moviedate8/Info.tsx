import React from "react";
import { StateEnum, WatchersType, WatcherType } from "./firebase";
import css from "./index.module.css";

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
        {leaderW && (
          <div>
            <SubInfo w={leaderW} />
          </div>
        )}
        <div>
          {sortedNonLeaders.map((w) => (
            <SubInfo key={w.user_name} w={w} url={leaderW?.url} />
          ))}
        </div>
      </div>
    );
  }
}

function SubInfo(props: { w: WatcherType; url?: string }) {
  const progress =
    props.w.progress +
    ((Date.now() - props.w.timestamp) *
      (props.w.state === StateEnum.playing ? props.w.speed : 0)) /
      1000;
  return (
    <div
      title={JSON.stringify(props, null, 2)}
      className={[
        css.subinfo,
        props.url && props.w.url !== props.url && css.brokensubinfo,
      ].join(" ")}
    >
      <div>
        {props.w.user_name} {props.w.speed.toFixed(2)}x
      </div>
      <div>{progress.toFixed(2)}</div>
    </div>
  );
}

export default Info;
