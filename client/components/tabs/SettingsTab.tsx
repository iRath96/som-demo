import * as React from "react";

import { List, ListItem } from "material-ui/List";
import Subheader from "material-ui/Subheader";
import Checkbox from "material-ui/Checkbox";


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
      <List>
        <Subheader>View settings</Subheader>
        <ListItem
          leftCheckbox={<Checkbox
            checked={this.props.displayMap}
            onCheck={(e, checked) => this.props.onUpdateDisplayMap(checked)}
          />}
          primaryText="Display color-coded map"
          secondaryText="Visualizes positions of neurons"
        />
        <ListItem
          leftCheckbox={<Checkbox
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
    return <div>
      {this.renderSettings()}
      <hr />
      {this.renderAbout()}
    </div>;
  }
}
