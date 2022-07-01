import React from "react";
import firebase from "./firebase";
import { getUsername } from "./User";

const urlRef = React.createRef<HTMLInputElement>();
function Lead(props: {
  url: string | undefined;
  update: (url: string) => Promise<void>;
  finishUpdate: () => void;
}) {
  return (
    <>
      <form
        onSubmit={(e) =>
          Promise.resolve(e.preventDefault())
            .then(() => props.update(urlRef.current!.value))
            .then(submit)
            .then(props.finishUpdate)
            .catch((err) => {
              alert(err);
              throw err;
            })
        }
      >
        <div>
          url: <input ref={urlRef} defaultValue={props.url} />
        </div>
        <input type="submit" value="Submit" />
      </form>
    </>
  );
}

function submit() {
  const userName = getUsername()!;
  firebase.writeLeader(userName);
}

export default Lead;
