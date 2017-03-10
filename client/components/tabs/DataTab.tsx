import * as React from "react";

import Popover from "material-ui/Popover";
import Slider from "material-ui/Slider";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import FontIcon from "material-ui/FontIcon";

import Dataset from "som/Dataset";
import { DatasetSource, ClusterDatasetSource } from "som/DatasetSource";

import LogSlider from "../LogSlider";

const style = require("./DataTab.scss");


class WeightEditor extends React.Component<{
  weights: number[];
  onChange(weights: number[]): void;
}, {
  open: boolean;
  anchorElement: HTMLElement | undefined;
}> {
  constructor() {
    super();
    this.state = {
      open: false,
      anchorElement: undefined
    };
  }

  render() {
    return <div className={style["weight-editor"]}>
      <div
        className="color"
        style={{
          backgroundColor: `rgb(${this.props.weights.map(v => Math.round(v * 255)).join(", ")})`
        }}
        onClick={e => this.setState({ open: true, anchorElement: e.currentTarget })}
      />
      <Popover
        open={this.state.open}
        anchorEl={this.state.anchorElement}
        anchorOrigin={{ horizontal: "left", vertical: "center" }}
        targetOrigin={{ horizontal: "right", vertical: "center" }}
        onRequestClose={() => this.setState({ open: false })}
        style={{
          padding: "12px 0",
          overflow: "hidden"
        }}
      >
        <div className={style["we-popover-content"]}>
          <span className="title">
            {this.props.weights.map(w => w.toFixed(2)).join("/")}
          </span>
          {this.props.weights.map((weight, dim) =>
            <div key={dim} style={{ paddingLeft: 20 }} className="coordinate">
              <b className="caption">
                {[ "X", "Y", "Z" ][dim]}
              </b>
              <Slider
                defaultValue={weight}
                onChange={(e, newValue) =>
                  this.props.onChange(this.props.weights.map((prev, i) => i === dim ? newValue : prev))
                }
                style={{
                  display: "inline-block",
                  width: 200,
                  verticalAlign: "middle",
                  marginRight: 30
                }}
                sliderStyle={{
                  margin: 4
                }}
              />
            </div>
          )}
        </div>
      </Popover>
    </div>;
  }
}

export interface IProps {
  revision: number;
  dataset: Dataset;
  onUpdate(): void;
  onSelect(datasource: DatasetSource | null): void;
}

export default class DataTab extends React.Component<IProps, void> {
  protected renderClusterSource(source: ClusterDatasetSource, key: number) {
    return <div key={key} className={style["datasource"]}>
      <WeightEditor
        weights={source.center}
        onChange={weights => {
          source.center = weights;
          this.props.onUpdate();
        }}
      />
      <div className="content">
        <span className="cluster-type">Cluster</span>
        <div>
          <span>
            &sigma;
          </span>
          <LogSlider
            min={-4}
            max={0}
            step={0.1}
            value={source.stddev}
            onChange={(e, newValue) => {
              source.stddev = newValue;
              this.props.onUpdate();
            }}
            style={{
              display: "inline-block",
              width: "calc(100% - 60px)",
              verticalAlign: "middle",
              marginRight: 0
            }}
            sliderStyle={{
              margin: 4
            }}
          />
        </div>
      </div>
    </div>;
  }

  protected renderSource(source: DatasetSource, key: number) {
    let interior = <b>Unknown datasource</b>;
    if (source instanceof ClusterDatasetSource)
      interior = this.renderClusterSource(source, key);
    
    return <div>
      <FontIcon
        className="material-icons"
        style={{ float: "right", zIndex: 1000 }}
        onClick={() => this.removeSource(source)}
      >
        remove
      </FontIcon>

      {interior}
    </div>;
  }

  protected addSource(source: DatasetSource) {
    this.props.dataset.sources.push(source);
    this.props.onUpdate();
  }

  protected removeSource(source: DatasetSource) {
    let { dataset } = this.props;
    dataset.sources = dataset.sources.filter(s => s !== source);
    this.props.onUpdate();
  }

  render() {
    return <div>
      <div style={{ lineHeight: "24px" }}>
        <span>
          {this.props.dataset.sources.length} sources
        </span>
        <IconMenu
          iconButtonElement={<FontIcon className="material-icons">add</FontIcon>}
          style={{
            float: "right"
          }}
        >
          <MenuItem value="1" primaryText="Cluster" onClick={() =>
            this.addSource(new ClusterDatasetSource(1000, [ 0, 0, 0 ], 0.1))
          } />
        </IconMenu>
      </div>
      <div style={{ clear: "both" }} />
      <div className="sources">
        {this.props.dataset.sources.map((source, key) => this.renderSource(source, key))}
      </div>
    </div>;
  }
}
