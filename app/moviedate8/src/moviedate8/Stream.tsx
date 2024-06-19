import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Selector from "./Selector";
import { FirebaseWrapper, LibraryType } from "./firebase";
import css from "./index.module.css";

function Stream() {
  return (
    <video
      controls
      onError={(e) => alert(`error: ${JSON.stringify(e)}`)}
      src="https://rs16.seedr.cc/ff_get_premium/5450367353/Talk%20to%20Me%20(2023)%20(1080p%20BluRay%20x265%2010bit).mp4?st=S0Yo3k8zy7pWPbkNrQVAiQ&e=1718943560"
    />
  );
}

class StreamX extends FirebaseWrapper<
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
      onError={(e) => {
        alert(`error: ${(e.target as HTMLMediaElement).error!.message}`);
        window.open(`vlc://${props.url}`);
      }}
      onCanPlay={(e) => e.currentTarget.play()}
      onEnded={props.onEnded}
    />
  );
}

export default Stream;
