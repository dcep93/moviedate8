import React, { useState } from "react";
import { EverythingType, FirebaseWrapper } from "./firebase";
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
        everything={this.state.state}
        isLead={Boolean(this.props.lead)}
      />
    );
  }
}

type SubHomePropsType = { isLead: boolean; everything: EverythingType };
class SubHome extends React.Component<
  SubHomePropsType,
  { resolve: () => void; url?: string }
> {
  constructor(props: SubHomePropsType) {
    super(props);

    const url = (props.everything.watchers || {})[props.everything.leader]?.url;

    this.state = { resolve: () => null, url };
  }

  render() {
    return (
      <>
        {this.props.isLead && (
          <Lead
            url={this.state.url}
            update={(url: string) =>
              new Promise((resolve, reject) => this.setState({ resolve, url }))
            }
            finishUpdate={() =>
              this.setState({ resolve: () => null, url: undefined })
            }
          />
        )}
        <Watch
          everything={this.props.everything}
          cb={this.state.resolve}
          url={this.state.url}
        />
      </>
    );
  }
}

function SubHomex(props: { everything: EverythingType; lead: boolean }) {
  const [url, updateUrl] = useState<string | null>(null);
  const [cb, updateCb] = useState<() => void>(() => null);
}

export default Home;
