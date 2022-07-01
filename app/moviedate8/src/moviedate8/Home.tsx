import React from "react";
import { EverythingType, FirebaseWrapper } from "./firebase";
import Info from "./Info";
import Lead from "./Lead";
import User from "./User";
import Watch from "./Watch";

class Home extends FirebaseWrapper<EverythingType, { lead?: boolean }> {
  getFirebasePath(): string {
    return "/";
  }

  render() {
    if (!this.state) return <>Loading...</>;
    return (
      <SubHome
        everything={this.state.state || {}}
        isLead={Boolean(this.props.lead)}
      />
    );
  }
}

type SubHomePropsType = { isLead: boolean; everything: EverythingType };
class SubHome extends React.Component<
  SubHomePropsType,
  { leaderProps?: { resolve: () => void; url: string } }
> {
  render() {
    const leader = (this.props.everything.watchers || {})[
      this.props.everything.leader
    ];
    return (
      <div>
        {this.props.isLead && (
          <Lead
            url={leader?.url}
            update={(url: string) =>
              new Promise((resolve, reject) =>
                this.setState({ leaderProps: { resolve, url } })
              )
            }
            finishUpdate={() => this.setState({ leaderProps: undefined })}
          />
        )}
        <User watchers={this.props.everything?.watchers || {}} />
        <Info leader={leader} everything={this.props.everything} />
        <Watch leader={leader} leaderProps={this.state?.leaderProps} />
      </div>
    );
  }
}

export default Home;
