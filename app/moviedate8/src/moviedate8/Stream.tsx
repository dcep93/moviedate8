import { useState } from "react";
import { FirebaseWrapper, LibraryType } from "./firebase";
import css from "./index.module.css";
import Selector from "./Selector";

class Stream extends FirebaseWrapper<LibraryType, { rawToStream?: string }> {
  getFirebasePath(): string {
    return "/library";
  }

  render() {
    if (!this.state) return <>Loading...</>;
    const rawToStream =
      this.state.state[this.props.rawToStream || ""]
        ?.map(({ url }) => url)
        ?.join(",") || this.props.rawToStream;
    return (
      <SubStream
        library={this.state.state}
        toStream={(rawToStream || "").split(",").filter((s) => s !== "")}
      />
    );
  }
}

function SubStream(props: { library: LibraryType; toStream: string[] }) {
  const [urls, update] = useState(props.toStream);
  return (
    <>
      <Player url={urls[0]} onEnded={() => update(urls.slice(1))} />{" "}
      <Menu library={props.library} update={update} />
    </>
  );
}

function Menu(props: {
  library: LibraryType;
  update: (urls: string[]) => void;
}) {
  return (
    <div className={css.padding}>
      <Selector
        defaultUrl={""}
        library={props.library}
        submit={(urls) => Promise.resolve(urls).then(props.update)}
      />
    </div>
  );
}

function Player(props: { url: string | undefined; onEnded: () => void }) {
  return (
    <video
      controls
      className={css.video}
      src={props.url}
      onCanPlay={(e) => e.currentTarget.play()}
      onEnded={props.onEnded}
    />
  );
}

export default Stream;
