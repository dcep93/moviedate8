import React from "react";
import { EverythingType, FirebaseWrapper } from "./firebase";
import Info from "./Info";
import Lead from "./Lead";
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
  { resolve?: () => void; url?: string }
> {
  render() {
    const leader = (this.props.everything.watchers || {})[
      this.props.everything.leader
    ];
    return (
      <>
        {this.props.isLead && (
          <Lead
            url={leader?.url}
            update={(url: string) =>
              new Promise((resolve, reject) => this.setState({ resolve, url }))
            }
            finishUpdate={() =>
              this.setState({ resolve: undefined, url: undefined })
            }
          />
        )}
        <Info leader={leader} everything={this.props.everything} />
        <Watch leader={leader} cb={this.state.resolve} url={this.state.url} />
      </>
    );
  }
}

export default Home;
