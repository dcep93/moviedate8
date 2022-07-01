import { EverythingType, FirebaseWrapper } from "./firebase";

class Follow extends FirebaseWrapper<EverythingType> {
  getFirebasePath(): string {
    return "/";
  }

  componentDidUpdate() {}
}

export default Follow;
