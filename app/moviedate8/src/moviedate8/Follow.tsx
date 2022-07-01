import { EverythingType, FirebaseWrapper } from "./firebase";
import User from "./User";

class Follow extends FirebaseWrapper<EverythingType> {
  getFirebasePath(): string {
    return "/";
  }

  componentDidUpdate() {}

  render() {
    if (!this.state) return <>Loading...</>;
    return <User allFollow={this.state.state?.follow || {}} />;
  }
}

export default Follow;
