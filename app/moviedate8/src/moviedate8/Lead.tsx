import React from "react";
import firebase, { LibraryType, VideoType } from "./firebase";
import { getUsername } from "./User";

const urlRef = React.createRef<HTMLInputElement>();
function Lead(props: {
  library: LibraryType;
  url: string | undefined;
  update: (url: string) => Promise<void>;
  finishUpdate: () => void;
}) {
  return (
    <div>
      <form
        onSubmit={(e) =>
          Promise.resolve(e.preventDefault())
            .then(() => props.update(urlRef.current!.value))
            .then(getUsername)
            .then(firebase.writeLeader)
            .then(props.finishUpdate)
            .catch((err) => {
              alert(err);
              throw err;
            })
        }
      >
        <div>
          Library:{" "}
          <select>
            <option></option>
            {Object.entries(props.library)
              .flatMap(([folderName, videos]) =>
                [
                  {
                    url: undefined,
                    videoName: decodeURIComponent(folderName),
                    folderName,
                  } as VideoType & { folderName: string },
                ].concat(
                  videos.map(({ videoName, url }) => ({
                    folderName,
                    videoName,
                    url,
                  }))
                )
              )
              .map((obj) => (
                <option
                  disabled={obj.url === undefined}
                  key={obj.url || obj.videoName}
                  data-folder={obj.folderName}
                >
                  {obj.videoName}
                </option>
              ))}
          </select>
        </div>
        <div>
          url: <input ref={urlRef} defaultValue={props.url} />
        </div>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default Lead;
