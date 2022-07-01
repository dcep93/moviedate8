import React from "react";
import { LibraryType, VideoType } from "./firebase";
import css from "./index.module.css";

const urlRef = React.createRef<HTMLInputElement>();
const selectRef = React.createRef<HTMLSelectElement>();

function Selector(props: {
  defaultUrl: string | undefined;
  library: LibraryType;
  submit: (urls: string[]) => void;
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
            .then(props.submit)
            .catch((err) => {
              alert(err);
              throw err;
            })
        }
      >
        <div>
          Library:{" "}
          <select
            className={css.library_select}
            ref={selectRef}
            onChange={() => (urlRef.current!.value = "")}
          >
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
          url:{" "}
          <input
            ref={urlRef}
            className={css.url_input}
            defaultValue={props.defaultUrl}
          />
        </div>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default Selector;
