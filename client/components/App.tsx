import * as React from "react";
import { IVector, Vector3D, Vector2D, Vector1D } from "./Vector";

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

export default class App extends React.Component<void, IState> {
  dataset: Vector3D[] = [];
  neurons: Neuron<Vector1D, Vector3D>[] = [];
  
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

    /*let centers = [
      [ 0, 0, 0 ],
      [ 0, 1, 0 ],
      [ 0, 0, 1 ],
      [ 1, 0, 0 ]
    ];*/

    for (let i = 0; i < 10000; ++i) {
      let a = rnd() * 0.2;
      let b = rnd() * 0.2;

      this.dataset.push(new Vector3D(
        Math.sin(1.5 * a) + rnd() * 0.02,
        (Math.cos(1.5 * a) + Math.sin(2.5 * b)) * 0.5 + rnd() * 0.02,
        Math.cos(2.5 * b) + rnd() * 0.02
      ));

      /*let [ cx, cy, cz ] = centers[Math.floor(Math.random() * centers.length)];

      this.dataset.push(new Vector3D(
        rnd() * 0.1 + cx,
        rnd() * 0.1 + cy,
        rnd() * 0.1 + cz
      ));*/
    }

    for (let x = 0; x < 24; ++x)
      for (let y = 0; y < 24; ++y)
        this.neurons.push(new Neuron(
          new Vector2D(x, y),
          new Vector3D(
            Math.random() * 0.2,
            Math.random() * 0.2,
            Math.random() * 0.2
          )
        ));
  }

  protected startAnimating() {
    if (this.state.animationInterval !== null)
      // already animating
      return;
    
    this.setState({
      animationInterval: setInterval(() => {
        for (let i = 0; i < 100; ++i)
          this.iteration();
      }, 1000 / 10) as any
    })
  }

  protected stopAnimating() {
    clearInterval(this.state.animationInterval as any);
    this.setState({
      animationInterval: null
    });
  }

  protected iteration() {
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

    this.setState({
      learningFactor: this.state.learningFactor * 0.9995,
      neighborSize: this.state.neighborSize * 0.999
    })
  }

  protected reset() {
    this.setState({
      learningFactor: 0.1,
      neighborSize: 24 / 2
    });
    
    this.neurons.forEach(neuron => {
      neuron.weights.x = Math.random() * 0.2;
      neuron.weights.y = Math.random() * 0.2;
      neuron.weights.z = Math.random() * 0.2;
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
      <input type="button" value="Iteration" onClick={() => this.iteration()} />
      <input type="button" value="Reset" onClick={() => this.reset()} />
    </div>;
  }
}
