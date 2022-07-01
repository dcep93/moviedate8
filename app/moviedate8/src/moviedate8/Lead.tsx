import firebase, { LibraryType } from "./firebase";
import Selector from "./Selector";
import { getUsername } from "./User";

function Lead(props: {
  library: LibraryType;
  url: string | undefined;
  update: (urls: string[]) => Promise<void>;
  finishUpdate: () => void;
}) {
  return (
    <Selector
      defaultUrl={props.url}
      library={props.library}
      submit={(urls) =>
        Promise.resolve(urls)
          .then(props.update)
          .then(getUsername)
          .then(firebase.writeLeader)
          .then(props.finishUpdate)
      }
    />
  );
}

export default Lead;
