import { useState } from "react";
import _firebase from "./_firebase";
import NonPlayer, { type Data } from "./NonPlayer";
import Player from "./Player";

export default function Root() {
  const [src, setSrc] = useState<string | null>(null);
  return (
    <div>
      {src && <Player src={src} />}
      <NonPlayerWrapper setSrc={setSrc} />
    </div>
  );
}

class NonPlayerWrapper extends _firebase._FirebaseWrapper<
  Data,
  { setSrc: (src: string) => void }
> {
  render() {
    return !this.state?.state ? (
      <></>
    ) : (
      <NonPlayer data={this.state?.state} setSrc={this.props.setSrc} />
    );
  }
  getFirebasePath(): string {
    return "/root";
  }
}
