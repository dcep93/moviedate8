import { useState } from "react";
import _firebase from "./_firebase";
import NonPlayer, { type Data } from "./NonPlayer";
import Player, { type PlayerConfig } from "./Player";

export const rootPath = "/root";

export default function Root() {
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig | null>(null);
  return (
    <div>
      {playerConfig && <Player {...playerConfig} />}
      <NonPlayerWrapper setPlayerConfig={setPlayerConfig} />
    </div>
  );
}

class NonPlayerWrapper extends _firebase._FirebaseWrapper<
  Data,
  { setPlayerConfig: (playerConfig: PlayerConfig) => void }
> {
  render() {
    return !this.state?.state ? (
      <></>
    ) : (
      <NonPlayer
        data={this.state.state}
        setPlayerConfig={this.props.setPlayerConfig}
      />
    );
  }
  getFirebasePath(): string {
    return rootPath;
  }
}
