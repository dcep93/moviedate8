import { EverythingType, WatcherType } from "./firebase";

const RENDER_INTERVAL_MS = 10;

function Info(props: { everything: EverythingType; leader: WatcherType }) {
  return <>{JSON.stringify(props)}</>;
}

export default Info;
