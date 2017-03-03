import * as React from "react";

import IconButton from "material-ui/IconButton";
import Slider from "material-ui/Slider";
import { Tabs, Tab } from "material-ui/Tabs";
import FontIcon from "material-ui/FontIcon";
import LinearProgress from "material-ui/LinearProgress";

import ScatterPlot from "./ScatterPlot";
import GridPlot from "./GridPlot";

import PCA from "src/PCA";
import Neuron from "src/Neuron";
import { Vector3D, Vector2D } from "src/Vector";

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
      >
        {this.props.isTraining ? "pause" : "play_arrow"}
      </IconButton>
      <IconButton
        iconClassName="material-icons"
        tooltip="One iteration"
        onClick={this.props.iterateSingle}
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

  learningFactor: number;
  neighborSize: number;
  animationSpeed: number;
}

export default class App extends React.Component<void, IState> {
  dataset: Vector3D[] = [];
  neurons: Neuron<Vector2D, Vector3D>[] = [];
  
  constructor() {
    super();

    this.state = {
      animationInterval: null,
      stepAnimationInterval: null,

      learningFactor: 0.1,
      neighborSize: 24 / 2 * 0.5,
      animationSpeed: 1
    };

    const rnd = () => {
      let u1 = 1.0 - Math.random();
      let u2 = 1.0 - Math.random();
      
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    };

    /*
    let centers = [
      [ 0, 0, 0 ],
      [ 0, 1, 0 ],
      [ 0, 0, 1 ],
      [ 1, 0, 0 ],
      [ 0.2, 0.5, 0.7 ],
      [ 0.7, 0.1, 0.8 ],
      [ 0.5, 0.6, 0.4 ]
    ];*/

    let centers = [];
    for (let i = 0; i < 6; ++i)
      centers.push([
        Math.random(),
        Math.random(),
        Math.random()
      ]);

    for (let i = 0; i < 10000; ++i) {
      /*if (0 < 1) {
        let a = rnd();
        let b = rnd();

        this.dataset.push(new Vector3D(
          a * 0.5 + b * 0.2,
          a * 0.2 + b,
          b * 0.8
        ));
      } else */if (0 > 1) {
        let a = rnd() * 0.4;
        let b = rnd() * 0.4;

        this.dataset.push(new Vector3D(
          Math.sin(1.5 * a) + rnd() * 0.02 + 0.5,
          (Math.cos(1.5 * a) + Math.sin(2.5 * b)) * 0.5 + rnd() * 0.02 + 0.2,
          Math.cos(2.5 * b) + rnd() * 0.02 + 0.2 
        ));
      } else {
        let [ cx, cy, cz ] = centers[Math.floor(Math.random() * centers.length)];

        this.dataset.push(new Vector3D(
          rnd() * 0.01 + cx,
          rnd() * 0.01 + cy,
          rnd() * 0.01 + cz
        ));
      }
    }

    let pca = new PCA(
      this.dataset
        .filter((v, index) => index % 10 === 0)
        .map(vector => vector.toArray()),
      2
    );

    for (let x = 0; x < 16; ++x)
      for (let y = 0; y < 16; ++y) {
        let [ wx, wy, wz ] = pca.recover([ (x + 0.5) / 16, (y + 0.5) / 16 ]);
        this.neurons.push(new Neuron(
          new Vector2D(x, y),
          new Vector3D(
            wx, wy, wz
            // Math.random(),
            // Math.random(),
            // Math.random()
          )
        ));
      }
  }

  protected startAnimating() {
    if (this.isAnimating)
      return;
    
    let animationCounter = 0;
    this.setState({
      animationInterval: setInterval(() => {
        animationCounter += this.state.animationSpeed;

        let iterationCount = Math.floor(animationCounter);
        this.iterate(iterationCount);
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

  protected iterate(count: number = 1) {
    let learningFactor = this.state.learningFactor;
    let neighborSize = this.state.neighborSize;
    
    for (let i = 0; i < count; ++i) {
      let input = this.dataset[Math.floor(Math.random() * this.dataset.length)];
      let bmu = this.neurons.reduce((bmu, neuron) => {
        let dist = neuron.weights.euclideanDistance(input);

        if (dist < bmu.dist) {
          bmu.neuron = neuron;
          bmu.dist = dist;
        }

        return bmu;
      }, { neuron: this.neurons[0], dist: Infinity }).neuron!;

      this.neurons.forEach(neuron => {
        let bmuDistance = bmu.position.euclideanDistance(neuron.position);

        let exponent = -bmuDistance * bmuDistance / (2 * neighborSize * neighborSize);
        let df = exponent < -4 ? 0 : Math.exp(exponent);

        let lf = 1.0 - learningFactor * df;
        neuron.weights.scalarMultiply(lf);
        neuron.weights.add(input, 1.0 - lf);
      });

      learningFactor *= 0.99995;
      neighborSize *= 0.99995;
    }

    this.setState({
      learningFactor,
      neighborSize
    });
  }

  protected iterateAnimated() {
    if (this.state.stepAnimationInterval !== null)
      return;
    
    let input = this.dataset[Math.floor(Math.random() * this.dataset.length)];
    let bmu = this.neurons.reduce((bmu, neuron) =>
      bmu.weights.euclideanDistance(input) <= neuron.weights.euclideanDistance(input)
      ? bmu
      : neuron
    );

    let positions = new Map<Neuron<Vector2D, Vector3D>, [ Vector3D, Vector3D ]>();

    this.neurons.forEach(neuron => {
      let bmuDistance = bmu.position.euclideanDistance(neuron.position);

      let df = Math.exp(
        -bmuDistance * bmuDistance /
        (2 * this.state.neighborSize * this.state.neighborSize)
      );

      let lf = 1.0 - this.state.learningFactor * df;
      let newPos = neuron.weights.clone();
      newPos.scalarMultiply(lf);
      newPos.add(input, 1.0 - lf);
      positions.set(neuron, [ neuron.weights.clone(), newPos ]);
    });

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

  get isAnimating() {
    return this.state.animationInterval !== null;
  }

  protected reset() {
    this.stopAnimating();

    this.setState({
      learningFactor: 0.1,
      neighborSize: 24 / 2
    });

    this.neurons.forEach(neuron => {
      neuron.weights.x = Math.random();
      neuron.weights.y = Math.random();
      neuron.weights.z = Math.random();
    });
  }

  render() {
    return <div>
      <div className={style["main-view"]}>
        <ScatterPlot
          dataset={this.dataset}
          neurons={this.neurons}
          animating={
            this.state.animationInterval !== null ||
            this.state.stepAnimationInterval !== null
          }
        />
      </div>
      <div className={style["grid-plot"]}>
        <GridPlot
          neurons={this.neurons.concat([])}
          tileWidth={8}
          tileHeight={8}
          width={16}
          height={16}
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
          iterationIndex={23}
          iterationTotal={100}

          learningFactor={this.state.learningFactor}
          neighborSize={this.state.neighborSize}
          isTraining={this.isAnimating}

          animationSpeed={this.state.animationSpeed}
          setAnimationSpeed={animationSpeed => this.setState({ animationSpeed })}

          startTraining={() => this.startAnimating()}
          endTraining={() => this.stopAnimating()}
          iterateSingle={() => this.iterateAnimated()}

          reset={() => this.reset()}
        />
      </div>
    </div>;
  }
}
