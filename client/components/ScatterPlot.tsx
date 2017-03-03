import * as React from "react";

import Neuron from "src/Neuron";
import { Vector3D } from "src/Vector";

import { scatter3D } from "./scatter3d";

export interface IProps {
  dataset: Vector3D[];
  neurons: Neuron<any, Vector3D>[];
  animating: boolean;
}

export default class ScatterPlot extends React.Component<IProps, void> {
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

    let resizeTimeout: any;
    window.addEventListener("resize", e => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log("resize");
        this.resizeCanvas();
      }, 500);
    });

    this.resizeCanvas();
  }

  protected resizeCanvas() {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    let rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;

    this.ref.needsResize = true;
  }

  componentWillReceiveProps(props: IProps) {
    this.ref.animating = props.animating;
    this.ref.needsRender = true;
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <canvas ref="canvas" />;
  }
}
