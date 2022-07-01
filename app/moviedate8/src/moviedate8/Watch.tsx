import React from "react";
import firebase, { EverythingType } from "./firebase";
import { getUsername } from "./User";

const SEND_INTERVAL_MS = 1000;
const RENDER_INTERVAL_MS = 10;

type PropsType = {
  everything: EverythingType;
  cb: () => void;
  url?: string;
};

class Watch extends React.Component<PropsType> {
  static cb: () => void = () => null;

  componentDidMount() {
    setInterval(() => this.send(), SEND_INTERVAL_MS);
  }

  componentDidUpdate(prevProps: PropsType) {
    Watch.cb = this.props.cb;
    if (this.props.url) {
    }
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
      .then(Watch.cb);
  }

  render() {
    return <></>;
  }
}

export default Watch;
