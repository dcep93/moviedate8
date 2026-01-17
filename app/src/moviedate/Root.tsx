import { useState } from "react";
import Library from "./Library";
import Player from "./Player";

export default function Root() {
  const [src, setSrc] = useState<string | null>(null);
  return (
    <div>
      {src && <Player src={src} />}
      <Library setSrc={setSrc} />
    </div>
  );
}
