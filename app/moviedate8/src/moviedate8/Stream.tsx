import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Selector from "./Selector";
import attachSubtitles, { attachSubtitlesString } from "./attachSubtitles";
import { FirebaseWrapper, LibraryType } from "./firebase";
import css from "./index.module.css";

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
  const [subtitlesString, updateSubtitlesString] = useState<
    string | undefined
  >();
  return (
    <>
      <Player
        url={urls[0]}
        subtitlesString={subtitlesString}
        onEnded={() => update(urls.slice(1))}
      />{" "}
      <Menu
        library={props.library}
        update={update}
        updateSubtitlesString={updateSubtitlesString}
      />
    </>
  );
}

function Menu(props: {
  library: LibraryType;
  update: (urls: string[]) => void;
  updateSubtitlesString: (subtitlesString: string) => void;
}) {
  return (
    <div className={css.padding}>
      <Selector
        defaultUrl={""}
        library={props.library}
        submit={(urls) => Promise.resolve(urls).then(props.update)}
        updateSubtitlesString={props.updateSubtitlesString}
      />
    </div>
  );
}

function Player(props: {
  subtitlesString: string | undefined;
  url: string | undefined;
  onEnded: () => void;
}) {
  const urlParts = props.url?.split("&subs=");
  return (
    <video
      controls
      className={css.video}
      src={urlParts?.[0]}
      onError={(e) => {
        alert(`error: ${(e.target as HTMLMediaElement).error!.message}`);
        // window.open(`vlc://${props.url}`);
      }}
      onCanPlay={(e) =>
        Promise.resolve({
          e: e.target as HTMLVideoElement,
          subtitlesUrl: urlParts?.[1],
        }).then(({ e, subtitlesUrl }) =>
          Promise.resolve()
            .then(() =>
              props.subtitlesString !== undefined
                ? attachSubtitlesString(e, props.subtitlesString)
                : subtitlesUrl
                ? attachSubtitles(e, subtitlesUrl)
                : null
            )
            .then(() => e.play())
        )
      }
      onEnded={props.onEnded}
    />
  );
}

export default Stream;
