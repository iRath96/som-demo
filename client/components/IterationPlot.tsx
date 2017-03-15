import * as React from "react";

interface IPoint {
  iteration: number;
  value: number;
}

export interface IProps {
  maxIteration: number;
  iteration: number;

  value: number;
  min: number;
  max: number;

  width: number;
  height: number;
}

export default class IterationPlot extends React.Component<IProps, void> {
  points: IPoint[] = [];

  protected redraw(props: IProps) {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    canvas.width = props.width * 2;
    canvas.height = props.height * 2;
    canvas.style.width = props.width + "px";
    canvas.style.height = props.height + "px";
    
    let ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);

    const x = (iteration: number) => iteration / props.maxIteration * props.width;
    const y = (value: number) => (1 - (value - props.min) / (props.max - props.min)) * props.height;

    // redraw canvas
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, props.height);
    ctx.lineTo(props.width, props.height);
    ctx.stroke();
    ctx.closePath();
    
    if (this.points.length > 1) {
      ctx.beginPath();
      this.points.reduce((lastPoint, point) => {
        ctx.moveTo(x(lastPoint.iteration), y(lastPoint.value));
        ctx.lineTo(x(point.iteration), y(point.value));
        return point;
      });
      ctx.stroke();
      ctx.closePath();
    }
  }

  componentDidMount() {
    this.redraw(this.props);
  }

  componentWillReceiveProps(props: IProps) {
    this.points = this.points.filter(point => point.iteration < props.iteration);
    this.points.push({
      iteration: props.iteration,
      value: props.value
    });

    this.redraw(props);
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <canvas
      ref="canvas"
    />;
  }
}
