import React from "react";
import { WatchersType } from "./firebase";

const RENDER_INTERVAL_MS = 10;

class Info extends React.Component<{ leader: string; watchers: WatchersType }> {
  static interval?: NodeJS.Timer;
  componentDidMount() {
    clearInterval(Info.interval);
    Info.interval = setInterval(() => this.forceUpdate(), RENDER_INTERVAL_MS);
  }

  render() {
    return (
      <div>
        <pre>{JSON.stringify(this.props, null, 2)}</pre>
      </div>
    );
  }
}

export default Info;
