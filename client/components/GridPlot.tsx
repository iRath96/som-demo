import * as React from "react";
import Model from "som/Model";


export interface IProps {
  model: Model;
  tileWidth: number;
  tileHeight: number;
  width: number;
  height: number;
}

export default class GridPlot extends React.Component<IProps, void> {
  protected colorForNeuron(neuronIndex: number) {
    return "rgb(" +
      this.props.model.weightMatrix.getRow(neuronIndex)
        .map(v => Math.max(0, Math.min(Math.floor(v * 255), 255)))
        .join(", ") +
    ")";
  }

  protected avgDistForNeuron(neuronIndex: number) {
    let weights = this.props.model.weightMatrix.getRow(neuronIndex);
    let distances = [];
    for (let i = 0; i < this.props.model.neuronCount; ++i)
      if (i !== neuronIndex && this.props.model.distanceMatrix.get(neuronIndex, i) <= 1) {
        let w = this.props.model.weightMatrix.getRow(i);
        let dist = weights.reduce((sum, v, i) => sum + (v - w[i]) ** 2, 0);
        distances.push(Math.sqrt(dist));
      }
    
    return distances.reduce((sum, v) => sum + v) / distances.length;
  }

  componentWillReceiveProps(props: IProps) {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    let ctx = canvas.getContext("2d")!;

    let umatrix = new Map<number, number>();
    for (let i = 0; i < this.props.model.neuronCount; ++i)
      umatrix.set(i, this.avgDistForNeuron(i));
    
    let v = [ ...umatrix.values() ].sort((a, b) => a - b);
    let minDist = v.shift()!;
    let maxDist = v.pop()!;

    // redraw canvas
    for (let neuronIndex = 0; neuronIndex < this.props.model.neuronCount; ++neuronIndex) {
      let [ x, y ] = this.props.model.neuronPositionInLattice(neuronIndex);
      ctx.fillStyle = this.colorForNeuron(neuronIndex);
      ctx.fillRect(
        x * this.props.tileWidth,
        y * this.props.tileHeight,
        this.props.tileWidth,
        this.props.tileHeight
      );

      let normDist = (umatrix.get(neuronIndex)! - minDist) / (maxDist - minDist);
      let shade = Math.floor(normDist * 255);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fillRect(
        (x + this.props.width) * this.props.tileWidth,
        y * this.props.tileHeight,
        this.props.tileWidth,
        this.props.tileHeight
      );
    }
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
