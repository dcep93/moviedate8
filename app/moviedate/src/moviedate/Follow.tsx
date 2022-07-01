import { FirebaseWrapper } from "./firebase";

class Follow extends FirebaseWrapper<{}> {
  getFirebasePath(): string {
    return "/";
  }
}

export default Follow;
