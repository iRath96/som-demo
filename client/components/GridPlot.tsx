import * as React from "react";

import Neuron from "src/Neuron";
import { Vector2D, Vector3D } from "src/Vector";

export interface IProps {
  neurons: Neuron<Vector2D, Vector3D>[];
  tileWidth: number;
  tileHeight: number;
  width: number;
  height: number;
}

export default class GridPlot extends React.Component<IProps, void> {
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
    let minDist = v.shift()!;
    let maxDist = v.pop()!;

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
