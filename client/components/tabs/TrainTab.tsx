import * as React from "react";

import IconButton from "material-ui/IconButton";
import LinearProgress from "material-ui/LinearProgress";

import LogSlider from "../LogSlider";
import IterationPlot from "../IterationPlot";
import LearningRatePreview from "../LearningRatePreview";

import Trainer from "som/Trainer";

const style = require("./TrainTab.scss");


export interface IProps {
  trainer: Trainer;

  quantizationError: number;
  topographicError: number;

  isTraining: boolean;

  animationSpeed: number;
  setAnimationSpeed(value: number): void;

  startTraining(): void;
  endTraining(): void;
  iterateSingle(): void;

  reset(): void;
}

export default class TrainTab extends React.Component<IProps, void> {
  protected resizeHandler = () => {
    this.forceUpdate();
  };

  protected renderProgress() {
    let percentCompleted = Math.round(this.props.trainer.progress * 100);
    
    return <div className="progress">
      <LinearProgress
        mode="determinate"
        value={percentCompleted}
      />
      <div style={{
        marginTop: 5,
        textAlign: "center"
      }}>
        #{this.props.trainer.currentIteration}
        <span style={{
          paddingLeft: 5,
          opacity: 0.5
        }}>
          ({percentCompleted} %)
        </span>
      </div>
    </div>;
  }

  protected renderControls() {
    let toggleTraining = this.props.isTraining ? this.props.endTraining : this.props.startTraining;
    
    return <div className="controls">
      <IconButton
        iconClassName="material-icons"
        tooltip={this.props.isTraining ? "Stop training" : "Start training"}
        onClick={toggleTraining}
        disabled={this.props.trainer.hasFinished}
      >
        {this.props.isTraining ? "pause" : "play_arrow"}
      </IconButton>
      <IconButton
        iconClassName="material-icons"
        tooltip="One iteration"
        onClick={this.props.iterateSingle}
        disabled={this.props.trainer.hasFinished}
      >
        skip_next
      </IconButton>
      <IconButton
        iconClassName="material-icons"
        tooltip="Reset"
        onClick={this.props.reset}
      >
        replay
      </IconButton>
    </div>;
  }

  protected renderSpeedControl() {
    return <div className="speed-control">
      <LogSlider
        step={1}
        min={-1}
        max={3}
        value={this.props.animationSpeed}
        sliderStyle={{
          margin: 0
        }}
        onChange={(event, animationSpeed) =>
          this.props.setAnimationSpeed(animationSpeed)
        }
      />
      <b>Speed:</b> {this.props.animationSpeed}&times;
    </div>;
  }

  protected renderStatus() {
    let parentWidth = this.refs["tab"] ? (this.refs["tab"] as HTMLElement).clientWidth - 30 : 200;

    return <div className="status">
      <IterationPlot
        width={parentWidth}
        height={50}
        min={0}
        max={0.2}
        iteration={this.props.trainer.currentIteration}
        maxIteration={this.props.trainer.maxIteration}
        title={"Eq"}
        value={this.props.quantizationError}
      />
      <IterationPlot
        width={parentWidth}
        height={50}
        min={0}
        max={0.5}
        iteration={this.props.trainer.currentIteration}
        maxIteration={this.props.trainer.maxIteration}
        title={"Et"}
        value={this.props.topographicError}
      />
      <LearningRatePreview
        learningRate={this.props.trainer.learningRate}
        neighborSize={this.props.trainer.neighborSize}
        width={parentWidth}
        height={150}
      />
    </div>;
  }

  componentDidMount() {
    window.addEventListener("resize", this.resizeHandler);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeHandler);
  }

  render() {
    return <div className={style["tab"]} ref={"tab"}>
      {this.renderControls()}
      {this.renderSpeedControl()}

      {this.renderProgress()}

      <hr />

      <h2>Status</h2>
      {this.renderStatus()}
    </div>;
  }
}