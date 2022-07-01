import React from "react";
import firebase, { WatcherType } from "./firebase";
import { getUsername } from "./User";

const SEND_INTERVAL_MS = 1000;

type PropsType = {
  leader?: WatcherType;
  cb?: () => void;
  url?: string;
};

class Watch extends React.Component<PropsType> {
  static cb?: () => void;
  static interval?: NodeJS.Timer;

  constructor(props: PropsType) {
    super(props);

    if (this.props.url) this.init();
  }

  componentDidUpdate(prevProps: PropsType) {
    if (this.props.url && !prevProps.url) this.init();
  }

  init() {
    Watch.cb = this.props.cb;
    clearInterval(Watch.interval);
    Watch.interval = setInterval(() => this.send(), SEND_INTERVAL_MS);
  }

  send() {
    firebase
      .writeWatcher(getUsername()!, {
        timestamp: Date.now(),
        url: "",
        progress: 0,
        speed: 0,
        state: 0,
      })
      .then(() => (Watch.cb ? Watch.cb() : null));
  }

  render() {
    return <></>;
  }
}

export default Watch;
