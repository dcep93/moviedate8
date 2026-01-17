import Player from "./Player";

import static_path from "./static_path.txt";

export default function Static() {
  return <Player src={static_path} />;
}
