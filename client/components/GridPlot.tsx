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
  protected colorForNeuron(neuronIndex: number, model: Model) {
    return "rgb(" +
      model.weightMatrix.getRow(neuronIndex)
        .map(v => Math.max(0, Math.min(Math.floor(v * 255), 255)))
        .join(", ") +
    ")";
  }

  protected avgDistForNeuron(neuronIndex: number, model: Model) {
    let weights = model.weightMatrix.getRow(neuronIndex);
    let distances = [];
    for (let i = 0; i < model.neuronCount; ++i)
      if (i !== neuronIndex && model.distanceMatrix.get(neuronIndex, i) <= 1) {
        let w = model.weightMatrix.getRow(i);
        let dist = weights.reduce((sum, v, i) => sum + (v - w[i]) ** 2, 0);
        distances.push(Math.sqrt(dist));
      }
    
    return distances.reduce((sum, v) => sum + v) / distances.length;
  }

  protected redraw(props: IProps) {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    canvas.width = 2 * props.width * props.tileWidth;
    canvas.height = props.height * props.tileHeight;
    
    let ctx = canvas.getContext("2d")!;

    let umatrix = new Map<number, number>();
    for (let i = 0; i < props.model.neuronCount; ++i)
      umatrix.set(i, this.avgDistForNeuron(i, props.model));
    
    let v = [ ...umatrix.values() ].sort((a, b) => a - b);
    let minDist = v.shift()!;
    let maxDist = v.pop()!;

    // redraw canvas
    for (let neuronIndex = 0; neuronIndex < props.model.neuronCount; ++neuronIndex) {
      let [ x, y ] = props.model.neuronPositionInLattice(neuronIndex);
      ctx.fillStyle = this.colorForNeuron(neuronIndex, props.model);
      ctx.fillRect(
        x * props.tileWidth,
        y * props.tileHeight,
        props.tileWidth,
        props.tileHeight
      );

      let normDist = (umatrix.get(neuronIndex)! - minDist) / (maxDist - minDist);
      let shade = Math.floor(normDist * 255);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fillRect(
        (x + props.width) * props.tileWidth,
        y * props.tileHeight,
        props.tileWidth,
        props.tileHeight
      );
    }
  }

  componentDidMount() {
    this.redraw(this.props);
  }

  componentWillReceiveProps(props: IProps) {
    this.redraw(props);
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
