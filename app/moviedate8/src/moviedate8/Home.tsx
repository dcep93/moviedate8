import React from "react";
import { EverythingType, FirebaseWrapper, WatchersType } from "./firebase";
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
    const everything = this.state.state || {};
    const leader =
      this.props.follow === undefined
        ? everything.leader
        : this.props.follow || undefined;
    return (
      <SubHome
        isLead={Boolean(this.props.lead)}
        leader={leader}
        watchers={everything.watchers || {}}
      />
    );
  }
}

type SubHomePropsType = {
  isLead: boolean;
  leader?: string;
  watchers: WatchersType;
};
class SubHome extends React.Component<
  SubHomePropsType,
  { leaderProps?: { resolve: () => void; url: string } }
> {
  render() {
    const now = Date.now();
    const filteredWatchers = Object.fromEntries(
      Object.entries(this.props.watchers).filter(
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
                url={leaderW?.url}
                update={(url: string) =>
                  new Promise((resolve, reject) =>
                    this.setState({ leaderProps: { resolve, url } })
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
