import * as React from "react";

import Popover from "material-ui/Popover";
import Slider from "material-ui/Slider";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import FontIcon from "material-ui/FontIcon";
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";

import Dataset from "som/Dataset";
import { DatasetSource, ClusterDatasetSource } from "som/DatasetSource";

import LogSlider from "../LogSlider";
import NumberInput from "../NumberInput";

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

abstract class Example {
  public name: string;
  abstract generate(): DatasetSource[];
}

export interface IProps {
  revision: number;
  dataset: Dataset;
  onUpdate(): void;
  onSelect(datasource: DatasetSource | null): void;
}

export default class DataTab extends React.Component<IProps, void> {
  static examples: Example[] = [];

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
        <span className="title">
          <span className="cluster-type">
            Cluster
          </span>
          {" "}with
          <NumberInput
            value={source.sampleCount}
            onChange={value => {
              source.sampleCount = value;
              this.props.onUpdate();
            }}
          /> datapoints
        </span>
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

  protected removeAllSources() {
    this.props.dataset.sources = [];
    this.props.onUpdate();
  }

  protected renderToolbar() {
    return <Toolbar style={{
      height: 28,
      padding: "6px 8px"
    }}>
      <ToolbarGroup firstChild={true} style={{ marginLeft: 0 }}>
        <ToolbarTitle
          text={`${this.props.dataset.sources.length} sources`}
          style={{
            fontSize: 12,
            lineHeight: "20px"
          }}
        />
      </ToolbarGroup>
      <ToolbarGroup>
        <IconMenu
          iconButtonElement={<FontIcon style={{ fontSize: 20 }} className="material-icons">add</FontIcon>}
        >
          <MenuItem value="1" primaryText="Cluster" onClick={() =>
            this.addSource(new ClusterDatasetSource(1000, [ 0, 0, 0 ], 0.1))
          } />
        </IconMenu>
        <IconMenu
          iconButtonElement={<FontIcon style={{ fontSize: 20 }} className="material-icons">expand_more</FontIcon>}
        >
          <MenuItem primaryText="Remove all" onClick={() => this.removeAllSources()} />
          <Divider />
          <Subheader>Examples</Subheader>
          {DataTab.examples.map(example =>
            <MenuItem value="1" primaryText={example.name} onClick={() => {
              this.props.dataset.sources = example.generate();
              this.props.onUpdate();
            }} />
          )}
        </IconMenu>
      </ToolbarGroup>
    </Toolbar>;
  }

  render() {
    return <div>
      {this.renderToolbar()}
      <div className="sources">
        {this.props.dataset.sources.map((source, key) => this.renderSource(source, key))}
      </div>
    </div>;
  }
}

DataTab.examples.push(new class extends Example {
  name = "Clusters";
  generate() {
    return [
      new ClusterDatasetSource( 400, [ 0.80, 0.10, 0.10 ], 0.01),
      new ClusterDatasetSource(1000, [ 0.88, 0.50, 0.10 ], 0.02),
      new ClusterDatasetSource(1000, [ 1.00, 0.88, 0.39 ], 0.04),
      new ClusterDatasetSource(2000, [ 0.40, 0.30, 0.50 ], 0.08),
      new ClusterDatasetSource(1000, [ 0.35, 0.45, 0.75 ], 0.03),
      new ClusterDatasetSource( 200, [ 0.49, 0.69, 0.21 ], 0.005)
    ];
  }
});
