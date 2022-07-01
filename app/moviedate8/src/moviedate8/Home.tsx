import React from "react";
import { EverythingType, FirebaseWrapper } from "./firebase";
import css from "./index.module.css";
import Info from "./Info";
import Lead from "./Lead";
import User from "./User";
import Watch from "./Watch";

const OLD_WATCHER_CUTOFF_MS = 30000;

class Home extends FirebaseWrapper<
  EverythingType,
  { lead?: boolean; follow?: string | null }
> {
  getFirebasePath(): string {
    return "/";
  }

  render() {
    if (!this.state) return <>Loading...</>;
    const everything = { ...this.state.state } || {};
    everything.leader =
      this.props.follow === undefined
        ? everything.leader
        : this.props.follow || undefined;
    return <SubHome {...everything} isLead={Boolean(this.props.lead)} />;
  }
}

type SubHomePropsType = EverythingType & {
  isLead: boolean;
};
class SubHome extends React.Component<
  SubHomePropsType,
  { leaderProps?: { resolve: () => void; urls: string[] } }
> {
  render() {
    const now = Date.now();
    const filteredWatchers = Object.fromEntries(
      Object.entries(this.props.watchers || {}).filter(
        ([_, watcher]) => now - watcher.timestamp < OLD_WATCHER_CUTOFF_MS
      )
    );
    const leaderW = filteredWatchers[this.props.leader!];
    return (
      <div>
        <Watch leaderW={leaderW} leaderProps={this.state?.leaderProps} />
        <div className={css.padding}>
          <div className={css.inline}>
            <User watchers={filteredWatchers} />
            {this.props.isLead && (
              <Lead
                library={this.props.library || {}}
                url={leaderW?.url}
                update={(urls: string[]) =>
                  new Promise((resolve, reject) =>
                    this.setState({ leaderProps: { resolve, urls } })
                  )
                }
                finishUpdate={() => this.setState({ leaderProps: undefined })}
              />
            )}
          </div>
          <Info leader={this.props.leader} watchers={filteredWatchers} />
        </div>
      </div>
    );
  }
}

export default Home;
