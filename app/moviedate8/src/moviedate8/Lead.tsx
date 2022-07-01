import React from "react";
import firebase, { LibraryType, VideoType } from "./firebase";
import { getUsername } from "./User";

const urlRef = React.createRef<HTMLInputElement>();
const selectRef = React.createRef<HTMLSelectElement>();

function Lead(props: {
  library: LibraryType;
  url: string | undefined;
  update: (urls: string[]) => Promise<void>;
  finishUpdate: () => void;
}) {
  return (
    <div>
      <form
        onSubmit={(e) =>
          Promise.resolve(e.preventDefault())
            .then(() => {
              const current = urlRef.current!.value;
              if (current) return [current];
              if (selectRef.current!.selectedIndex === 0)
                throw Error("no url selected");
              const selected = selectRef.current!.selectedOptions[0];
              const folder =
                props.library[selected.getAttribute("data-folder")!];
              return folder
                .slice(parseInt(selected.getAttribute("data-index")!))
                .map((v) => v.url!);
            })
            .then(props.update)
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
          <select ref={selectRef}>
            <option></option>
            {Object.entries(props.library)
              .flatMap(([folderName, videos]) =>
                [
                  {
                    url: undefined,
                    videoName: decodeURIComponent(folderName),
                    folderName,
                  } as VideoType & { folderName: string; index: number },
                ].concat(
                  videos.map(({ videoName, url }, index) => ({
                    folderName,
                    videoName,
                    url,
                    index,
                  }))
                )
              )
              .map((obj) => (
                <option
                  disabled={obj.url === undefined}
                  key={obj.url || obj.videoName}
                  data-folder={obj.folderName}
                  data-index={obj.index}
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
