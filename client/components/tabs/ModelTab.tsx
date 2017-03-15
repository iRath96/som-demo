import * as React from "react";

import NumberInput from "../NumberInput";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

import Model from "som/Model";
import { Initializer, RandomInitializer, PCAInitializer } from "som/Initializer";
import Trainer from "som/Trainer";

const style = require("./ModelTab.scss");


export interface IProps {
  model: Model;
  initializer: Initializer;
  trainer: Trainer;

  modelRevision: number;

  onChangeInitializer(initializer: Initializer): void;
  onUpdateModel(): void;
}

export default class DataTab extends React.Component<IProps, void> {
  protected renderModelControls() {
    return <div>
      <div className={style["control-with-label"]}>
        <span>Size</span>
        <NumberInput
          min={1}
          step={1}
          onChange={width => {
            this.props.model.setDimensions(width, this.props.model.height);
            this.props.onUpdateModel();
          }}
          value={this.props.model.width}
        />
        &times;
        <NumberInput
          min={1}
          step={1}
          onChange={height => {
            this.props.model.setDimensions(this.props.model.width, height);
            this.props.onUpdateModel();
          }}
          value={this.props.model.height}
        />
      </div>
    </div>;
  }

  protected renderInitializationControls() {
    return <SelectField
      floatingLabelText="Method"
      value={this.props.initializer.constructor}
      onChange={(e, index, klass) => {
        this.props.onChangeInitializer(new klass());
      }}
      style={{
        marginTop: -20
      }}
    >
      <MenuItem value={RandomInitializer} primaryText="Random" />
      <MenuItem value={PCAInitializer} primaryText="PCA" />
    </SelectField>;
  }

  protected renderTrainingControls() {
    return <div>
      <div className={style["control-with-label"]}>
        <span># iterations</span>
        <NumberInput
          min={0}
          step={1000}
          value={this.props.trainer.maxIteration}
          onChange={v => this.props.trainer.maxIteration = v}
        />
      </div>
      <div className={style["control-with-label"]}>
        <span>Learning rate</span>
        <NumberInput
          step={0.01}
          value={this.props.trainer.learningRateBounds.start}
          onChange={v => this.props.trainer.learningRateBounds.start = v}
        /> to
        <NumberInput
          step={0.001}
          value={this.props.trainer.learningRateBounds.end}
          onChange={v => this.props.trainer.learningRateBounds.end = v}
        />
      </div>
      <div className={style["control-with-label"]}>
        <span>Neighbor size</span>
        <NumberInput
          step={1}
          value={this.props.trainer.neighborSizeBounds.start}
          onChange={v => this.props.trainer.neighborSizeBounds.start = v}
        /> to
        <NumberInput
          step={0.01}
          value={this.props.trainer.neighborSizeBounds.end}
          onChange={v => this.props.trainer.neighborSizeBounds.end = v}
        />
      </div>
    </div>;
  }

  render() {
    return <div className={style["tab"]}>
      <h2>Model</h2>
      {this.renderModelControls()}
      <hr />
      <h2>Initialization</h2>
      {this.renderInitializationControls()}
      <hr />
      <h2>Training</h2>
      {this.renderTrainingControls()}
    </div>;
  }
}
