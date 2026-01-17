import { useSearchParams } from "react-router-dom";
import Player from "./Player";

import static_path from "./static_path.txt?raw";

export default function Static() {
  const [searchParams] = useSearchParams();
  const src = searchParams.get("src") || static_path;
  const playerConfig = { src };
  return <Player {...playerConfig} />;
}
