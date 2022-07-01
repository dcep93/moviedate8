import { EverythingType, WatcherType } from "./firebase";

const RENDER_INTERVAL_MS = 10;

function Info(props: { everything: EverythingType; leader: WatcherType }) {
  return (
    <div>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default Info;
