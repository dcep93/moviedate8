import { useState } from "react";
import _firebase from "./_firebase";
import Library, { type LibraryType } from "./Library";
import Player from "./Player";

export default function Root() {
  const [src, setSrc] = useState<string | null>(null);
  return (
    <div>
      {src && <Player src={src} />}
      <LibraryWrapper setSrc={setSrc} />
    </div>
  );
}

class LibraryWrapper extends _firebase._FirebaseWrapper<
  LibraryType,
  { setSrc: (src: string) => void }
> {
  render() {
    return !this.state?.state ? <></> : <Library library={this.state?.state} />;
  }
  getFirebasePath(): string {
    return "/root";
  }
}
