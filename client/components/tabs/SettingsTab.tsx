import * as React from "react";

import { List, ListItem } from "material-ui/List";
import Checkbox from "material-ui/Checkbox";

const style = require("./SettingsTab.scss");


export interface IProps {
  displayMap: boolean;
  displayUMatrix: boolean;

  onUpdateDisplayMap(value: boolean): void;
  onUpdateDisplayUMatrix(value: boolean): void;
}

interface IState {
}

export default class SettingsTab extends React.Component<IProps, IState> {
  protected renderSettings() {
    return (
      <List style={{
        padding: 0
      }}>
        <ListItem
          style={{
            padding: "10px 0 10px 60px"
          }}
          leftCheckbox={<Checkbox
            style={{ top: 14 }}
            checked={this.props.displayMap}
            onCheck={(e, checked) => this.props.onUpdateDisplayMap(checked)}
          />}
          primaryText="Display color-coded map"
          secondaryText="Visualizes positions of neurons"
        />
        <ListItem
          style={{
            padding: "10px 0 10px 60px"
          }}
          leftCheckbox={<Checkbox
            style={{ top: 14 }}
            checked={this.props.displayUMatrix}
            onCheck={(e, checked) => this.props.onUpdateDisplayUMatrix(checked)}
          />}
          primaryText="Display U-Matrix"
          secondaryText="Visualizes weight distance of adjacent neurons"
        />
      </List>
    );
  }

  protected renderAbout() {
    return (
      <div>
        Developed by Alexander Rath.<br />
        Fork me on <a href="https://github.com/iRath96/som-demo">Github</a>.
      </div>
    )
  }

  render() {
    return <div className={style["tab"]}>
      <h2>Settings</h2>
      {this.renderSettings()}
      <hr />
      <h2>About</h2>
      {this.renderAbout()}
    </div>;
  }
}
