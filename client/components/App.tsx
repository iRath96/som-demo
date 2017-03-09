import * as React from "react";

import IconButton from "material-ui/IconButton";
import Slider from "material-ui/Slider";
import { Tabs, Tab } from "material-ui/Tabs";
import FontIcon from "material-ui/FontIcon";
import LinearProgress from "material-ui/LinearProgress";

import ScatterPlot from "./ScatterPlot";
import GridPlot from "./GridPlot";

import SOMController from "../src/SOM";

const style = require("./App.scss");

class LogSlider extends React.Component<{
  [key: string]: any;

  value: number;
  onChange(e: React.MouseEvent<{}>, value: number): void;
}, void> {
  render() {
    let { value, onChange, ...props } = this.props;
    return <Slider
      value={Math.log10(value)}
      onChange={(event, value) => onChange(event, Math.pow(10, value))}
      {...props}
    />;
  }
}

class TrainTab extends React.Component<{
  iterationIndex: number;
  iterationTotal: number;

  learningFactor: number;
  neighborSize: number;
  isTraining: boolean;
  hasFinishedTraining: boolean;

  animationSpeed: number;
  setAnimationSpeed(value: number): void;

  startTraining(): void;
  endTraining(): void;
  iterateSingle(): void;

  reset(): void;
}, void> {
  protected renderProgress() {
    let percentCompleted = Math.round(this.props.iterationIndex * 100 / this.props.iterationTotal);
    
    return <div className="progress">
      <LinearProgress
        mode="determinate"
        value={percentCompleted}
      />
      <div style={{
        marginTop: 5,
        textAlign: "center"
      }}>
        #{this.props.iterationIndex}
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
        disabled={this.props.hasFinishedTraining}
      >
        {this.props.isTraining ? "pause" : "play_arrow"}
      </IconButton>
      <IconButton
        iconClassName="material-icons"
        tooltip="One iteration"
        onClick={this.props.iterateSingle}
        disabled={this.props.hasFinishedTraining}
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
    return <div className="status">
      <b>LF:</b> {this.props.learningFactor.toFixed(5)}<br />
      <b>NS:</b> {this.props.neighborSize.toFixed(5)}
    </div>;
  }

  render() {
    return <div className={style["train-tab"]}>
      {this.renderControls()}
      {this.renderSpeedControl()}

      {this.renderProgress()}

      <hr />

      {this.renderStatus()}
    </div>;
  }
}

interface IState {
  animationInterval: number | null;
  stepAnimationInterval: number | null;
  animationSpeed: number;
}

export default class App extends React.Component<void, IState> {
  som: SOMController = new SOMController();
  
  constructor() {
    super();

    this.state = {
      animationInterval: null,
      stepAnimationInterval: null,
      animationSpeed: 1
    };

    this.som.initialize();
  }

  protected startAnimating() {
    if (this.isAnimating || this.som.trainer.hasFinished)
      return;
    
    let animationCounter = 0;
    this.setState({
      animationInterval: setInterval(() => {
        if (this.som.trainer.hasFinished) {
          this.stopAnimating();
          return;
        }

        animationCounter += this.state.animationSpeed;

        let iterationCount = Math.floor(animationCounter);
        
        this.som.iterate(iterationCount);
        this.forceUpdate();

        animationCounter -= iterationCount;
      }, 1000 / 30) as any
    })
  }

  protected stopAnimating() {
    clearInterval(this.state.animationInterval as any);
    this.setState({
      animationInterval: null
    });
  }

  protected iterateSingle() {
    if (this.state.stepAnimationInterval !== null)
      // already animating
      return;
    
    let targetWeightMatrix = this.som.model.weightMatrix.cloneWithoutData();
    this.som.trainer.iterate(1, targetWeightMatrix);

    // perform animation

    let t = 0;
    let prevE = 0;

    this.setState({
      stepAnimationInterval: setInterval(() => {
        // calculate interpolation parameters
        let e = t < 0.5 ? 4 * Math.pow(t, 3) : 4 * Math.pow(t - 1, 3) + 1;
        let aFactor = (1 - e) / (1 - prevE);
        let bFactor = (e - prevE) / (1 - prevE);
        prevE = e;

        // update neuron weights
        for (let neuronIndex = 0; neuronIndex < this.som.model.neuronCount; ++neuronIndex) {
          let target = targetWeightMatrix.getRow(neuronIndex);
          target.forEach((b, dim) => {
            let a = this.som.model.weightMatrix.get(neuronIndex, dim);
            this.som.model.weightMatrix.set(neuronIndex, dim, a * aFactor + b * bFactor);
          });
        };

        if (t >= 1) {
          clearInterval(this.state.stepAnimationInterval as any);
          this.setState({
            stepAnimationInterval: null
          });

          return;
        } else
          this.forceUpdate();

        t += 0.05; // @todo Magic constant
      }, 1000 / 30) as any
    });
  }

/*
  protected iterateAnimated() {
    let t = 0;
    this.setState({
      stepAnimationInterval: setInterval(() => {
        positions.forEach(([ a, b ], neuron) => {
          let e = t < 0.5 ? 4 * Math.pow(t, 3) : 4 * Math.pow(t - 1, 3) + 1;
          
          neuron.weights
            .zero()
            .add(a, 1 - e)
            .add(b, e);
        });

        this.forceUpdate();
        if (t >= 1) {
          clearInterval(this.state.stepAnimationInterval as any);
          this.setState({
            stepAnimationInterval: null
          });

          return;
        }

        t += 0.05; // @todo Magic constant
      }, 1000 / 30) as any
    });
  }
*/

  get isAnimating() {
    return this.state.animationInterval !== null;
  }

  protected reset() {
    this.stopAnimating();

    this.som.initialize();
    this.forceUpdate();
  }

  render() {
    return <div>
      <div className={style["main-view"]}>
        <ScatterPlot
          dataset={this.som.dataset}
          model={this.som.model}
          animating={
            this.state.animationInterval !== null ||
            this.state.stepAnimationInterval !== null
          }
        />
      </div>
      <div className={style["grid-plot"]}>
        <GridPlot
          model={this.som.model}
          tileWidth={8}
          tileHeight={8}
          width={this.som.model.width}
          height={this.som.model.height}
        />
      </div>
      <div className={style["sidebar"]}>
        <Tabs>
          <Tab
            icon={<FontIcon className="material-icons">pie_chart</FontIcon>}
            label="DATA"
          >
            
          </Tab>
          <Tab
            icon={<FontIcon className="material-icons">apps</FontIcon>}
            label="MODEL"
          >
            
          </Tab>
          <Tab
            icon={<FontIcon className="material-icons">last_page</FontIcon>}
            label="TRAIN"
          >
            
          </Tab>
          <Tab
            icon={<FontIcon className="material-icons">remove_red_eye</FontIcon>}
            label="VIEW"
          >
            
          </Tab>
          <Tab
            icon={<FontIcon className="material-icons">info</FontIcon>}
            label="ABOUT"
          >
            
          </Tab>
        </Tabs>
        <TrainTab
          iterationIndex={this.som.trainer.currentIteration}
          iterationTotal={this.som.trainer.maxIteration}

          learningFactor={this.som.trainer.learningRate}
          neighborSize={this.som.trainer.neighborSize}
          isTraining={this.isAnimating}
          hasFinishedTraining={this.som.trainer.hasFinished}

          animationSpeed={this.state.animationSpeed}
          setAnimationSpeed={animationSpeed => this.setState({ animationSpeed })}

          startTraining={() => this.startAnimating()}
          endTraining={() => this.stopAnimating()}
          iterateSingle={() => this.iterateSingle()}

          reset={() => this.reset()}
        />
      </div>
    </div>;
  }
}
