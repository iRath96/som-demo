import * as React from "react";
import { IVector, Vector3D, Vector2D } from "./Vector";

interface IProps {
  dataset: Vector3D[];
  neurons: Neuron<any, Vector3D>[];
  animating: boolean;
}

import { scatter3D } from "./scatter3d";

export class ScatterPlot extends React.Component<IProps, void> {
  protected renderElement: HTMLCanvasElement;
  protected ref: any;

  componentDidMount() {
    this.ref = scatter3D(
      this.refs["canvas"] as any,
      this.props.dataset.map(v => v.toArray()),
      this.props.neurons.map(n => ({
        weights: n.weights,
        position: n.position.toArray()
      }))
    );
  }

  componentWillReceiveProps(props: IProps) {
    this.ref.animating = props.animating;
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <canvas
      ref="canvas"
      style={{
        width: 800,
        height: 600
      }}
      width="1600"
      height="1200"
    />;
  }
}

class Neuron<TPosition extends IVector, TWeights extends IVector> {
  constructor(
    public position: TPosition,
    public weights: TWeights
  ) {
  }
}

interface IState {
  animationInterval: number | null;
  learningFactor: number;
  neighborSize: number;
}

class GridPlot extends React.Component<{
  neurons: Neuron<Vector2D, Vector3D>[],
  tileWidth: number,
  tileHeight: number,
  width: number,
  height: number
}, void> {
  protected colorForNeuron(neuron: Neuron<Vector2D, Vector3D>) {
    return "rgb(" +
      neuron.weights
        .toArray()
        .map(v => Math.max(0, Math.min(Math.floor(v * 255), 255)))
        .join(", ") +
    ")";
  }

  protected avgDistForNeuron(neuron: Neuron<Vector2D, Vector3D>) {
    let neighbors = this.props.neurons
      .filter(neighbor => neuron.position.manhattenDistance(neighbor.position) === 1)
      .map(neighbor => neuron.weights.euclideanDistance(neighbor.weights));
    return neighbors.reduce((sum, v) => sum + v) / neighbors.length;
  }

  componentWillReceiveProps(props: IProps) {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    let ctx = canvas.getContext("2d")!;

    let umatrix = new Map<Neuron<Vector2D, Vector3D>, number>();
    props.neurons.forEach(neuron =>
      umatrix.set(neuron, this.avgDistForNeuron(neuron))
    );

    let v = [ ...umatrix.values() ].sort((a, b) => a - b);
    let minDist = v.shift();
    let maxDist = v.pop();

    // redraw canvas
    props.neurons.forEach(neuron => {
      ctx.fillStyle = this.colorForNeuron(neuron);
      ctx.fillRect(
        neuron.position.x * this.props.tileWidth,
        neuron.position.y * this.props.tileHeight,
        this.props.tileWidth,
        this.props.tileHeight
      );

      let normDist = (umatrix.get(neuron)! - minDist) / (maxDist - minDist);
      let shade = Math.floor(normDist * 255);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fillRect(
        (neuron.position.x + this.props.width) * this.props.tileWidth,
        neuron.position.y * this.props.tileHeight,
        this.props.tileWidth,
        this.props.tileHeight
      );
    });
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <canvas
      ref="canvas"
      width={2 * this.props.width * this.props.tileWidth}
      height={this.props.height * this.props.tileHeight}
    />;
  }
}

export default class App extends React.Component<void, IState> {
  dataset: Vector3D[] = [];
  neurons: Neuron<Vector2D, Vector3D>[] = [];
  
  constructor() {
    super();

    this.state = {
      animationInterval: null,
      learningFactor: 0.1,
      neighborSize: 24 / 2
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
      if (0 > 1) {
        let a = rnd() * 0.2;
        let b = rnd() * 0.2;

        this.dataset.push(new Vector3D(
          Math.sin(1.5 * a) + rnd() * 0.02 + 0.5,
          (Math.cos(1.5 * a) + Math.sin(2.5 * b)) * 0.5 + rnd() * 0.02 + 0.2,
          Math.cos(2.5 * b) + rnd() * 0.02 + 0.2 
        ));
      } else {
        let [ cx, cy, cz ] = centers[Math.floor(Math.random() * centers.length)];

        this.dataset.push(new Vector3D(
          rnd() * 0.02 + cx,
          rnd() * 0.02 + cy,
          rnd() * 0.02 + cz
        ));
      }
    }

    for (let x = 0; x < 24; ++x)
      for (let y = 0; y < 24; ++y)
        this.neurons.push(new Neuron(
          new Vector2D(x, y),
          new Vector3D(
            Math.random(),
            Math.random(),
            Math.random()
          )
        ));
  }

  protected startAnimating() {
    if (this.state.animationInterval !== null)
      // already animating
      return;
    
    this.setState({
      animationInterval: setInterval(() => {
        this.iterate(10);
      }, 1000 / 10) as any
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
      let bmu = this.neurons.reduce((bmu, neuron) =>
        bmu.weights.euclideanDistance(input) <= neuron.weights.euclideanDistance(input)
        ? bmu
        : neuron
      );

      this.neurons.forEach(neuron => {
        let bmuDistance = bmu.position.euclideanDistance(neuron.position);

        let df = Math.exp(
          -bmuDistance * bmuDistance /
          (2 * this.state.neighborSize * this.state.neighborSize)
        );

        let lf = 1.0 - this.state.learningFactor * df;
        neuron.weights.scalarMultiply(lf);
        neuron.weights.add(input, 1.0 - lf);
      });

      learningFactor *= 0.9995;
      neighborSize *= 0.999;
    }

    this.setState({
      learningFactor,
      neighborSize
    });
  }

  protected reset() {
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
      <ScatterPlot
        dataset={this.dataset}
        neurons={this.neurons}
        animating={this.state.animationInterval !== null}
      />
      <b>LF:</b> {this.state.learningFactor.toFixed(5)}, <b>NS:</b> {this.state.neighborSize.toFixed(5)}
      <input type="button" value="Start animation" onClick={() => this.startAnimating()} />
      <input type="button" value="Stop animation" onClick={() => this.stopAnimating()} />
      <input type="button" value="Iteration" onClick={() => this.iterate()} />
      <input type="button" value="Reset" onClick={() => this.reset()} />
      <GridPlot
        neurons={this.neurons.concat([])}
        tileWidth={10}
        tileHeight={10}
        width={24}
        height={24}
      />
    </div>;
  }
}
