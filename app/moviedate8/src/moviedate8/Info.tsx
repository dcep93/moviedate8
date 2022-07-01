import React from "react";
import { Link } from "react-router-dom";
import { StateEnum, WatchersType, WatcherType } from "./firebase";
import css from "./index.module.css";

const RENDER_INTERVAL_MS = 10;

class Info extends React.Component<{
  leader?: string;
  watchers: WatchersType;
}> {
  static interval?: NodeJS.Timer;
  componentDidMount() {
    clearInterval(Info.interval);
    Info.interval = setInterval(() => this.forceUpdate(), RENDER_INTERVAL_MS);
  }

  render() {
    const leaderW = this.props.watchers[this.props.leader!];
    const sortedNonLeaders = Object.values(this.props.watchers)
      .filter((w) => w.userName !== this.props.leader)
      .sort((a, b) => (a.userName < b.userName ? -1 : 1));
    return (
      <div className={css.inline}>
        {leaderW && (
          <div>
            <SubInfo w={leaderW} />
          </div>
        )}
        <div>
          {sortedNonLeaders.map((w) => (
            <SubInfo key={w.userName} w={w} url={leaderW?.url || null} />
          ))}
        </div>
      </div>
    );
  }
}

function SubInfo(props: { w: WatcherType; url?: string | null }) {
  const progress =
    props.w.progress +
    ((Date.now() - props.w.timestamp) *
      (props.w.state === StateEnum.playing ? props.w.speed : 0)) /
      1000;
  return (
    <Link to={`/follow/${props.url === undefined ? "" : props.w.userName}`}>
      <div
        title={JSON.stringify(props, null, 2)}
        className={[
          css.subinfo,
          props.url && props.w.url !== props.url && css.brokensubinfo,
        ].join(" ")}
      >
        <div>
          {props.w.userName} {props.w.speed.toFixed(2)}x
        </div>
        <div>{progress.toFixed(2)}</div>
      </div>
    </Link>
  );
}

export default Info;
