import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FirebaseWrapper, LibraryType } from "./firebase";
import css from "./index.module.css";
import Selector from "./Selector";

class Stream extends FirebaseWrapper<
  LibraryType | undefined,
  { rawToStream?: string }
> {
  getFirebasePath(): string {
    return "/library";
  }

  render() {
    if (!this.state) return <>Loading...</>;
    return <SubStream library={this.state.state || {}} />;
  }
}

function SubStream(props: { library: LibraryType }) {
  const [searchParams] = useSearchParams();
  const rawToStream = searchParams.get("s");
  const toStream =
    Object.values(props.library[rawToStream || ""] || {}).map(
      ({ url }) => url
    ) ||
    rawToStream?.split(",") ||
    [];
  const [urls, update] = useState(toStream);
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
      onClick={() => window.open(`vlc://${props.url}`)}
      onCanPlay={(e) => e.currentTarget.play()}
      onEnded={props.onEnded}
    />
  );
}

export default Stream;
