import * as React from "react";

import Model from "som/Model";
import Trainer from "som/Trainer";
import Matrix from "som/Matrix";
import DatasetSampler from "som/DatasetSampler";
import { SquareLattice } from "som/Lattice";


class SimpleDatasetSampler extends DatasetSampler {
  constructor() {
    super(null);
  }

  nextSample() {
    return [ 0.5, 1, 0.5 ];
  }
}

export interface IProps {
  learningRate: number;
  neighborSize: number;

  width: number;
  height: number;
}

export default class LearningRatePreview extends React.Component<IProps, void> {
  private readonly model: Model;
  private readonly trainer: Trainer;
  private readonly weightMatrix: Matrix<any>;

  constructor(props: IProps) {
    super(props);

    // setup model and trainer
    this.model = new Model(15, 15, new SquareLattice());
    this.trainer = new Trainer(this.model, new SimpleDatasetSampler());
    this.trainer.maxIteration = 1;

    // initialize model to square
    for (let i = 0; i < this.model.neuronCount; ++i) {
      let [ x, z ] = this.model.neuronPositionInLattice(i);

      this.model.weightMatrix.set(i, 0, x / (this.model.width - 1));
      // dim 1 stays zero
      this.model.weightMatrix.set(i, 2, z / (this.model.height - 1));
    }

    // clone weight matrix
    this.weightMatrix = this.model.weightMatrix.clone();
  }

  protected updateWeightMatrix() {
    // setup trainer
    this.trainer.learningRateBounds = { start: this.props.learningRate, end: 0 };
    this.trainer.neighborSizeBounds = { start: this.props.neighborSize, end: 0 };

    // iterate
    this.trainer.currentIteration = 0;
    this.trainer.iterate(1, this.weightMatrix);
  }

  protected project(vec: number[]) {
    return [
      ((vec[0] + (vec[2] - 0.5) * 0.5) * 0.6 + 0.2) * this.props.width,
      (0.8 - (vec[1] + vec[2] * 0.5) * 0.6) * this.props.height
    ];
  }

  render() {
    this.updateWeightMatrix();

    let projections = new Map<number, [ number, number ]>();

    let interior: any = [];

    // add dataset circle and dashed line
    {
      let [ cx, cy ] = this.project([ 0.5, 1, 0.5 ]);
      let [ cx2, cy2 ] = this.project([ 0.5, 0, 0.5 ]);

      interior.push(
        <circle
          cx={cx}
          cy={cy}
          r={1}
          fill="#000"
        />,
        <line
          x1={cx}
          y1={cy}
          x2={cx2}
          y2={cy2}
          strokeDasharray="5, 5"
          style={{
            stroke: "#ccc",
            strokeWidth: 1
          }}
        />
      );
    }

    // add model grid
    for (let i = 0; i < this.weightMatrix.rows; ++i) {
      let projection = this.project(this.weightMatrix.getRow(i));
      let [ x, y ] = projection;
      projections.set(i, [ x, y ]);

      // find connections to previous neurons
      for (let j = 0; j < i; ++j)
        if (this.model.distanceMatrix.get(i, j) <= 1) {
          // connect these neighboring neurons
          let [ x2, y2 ] = projections.get(j)!;
          interior.push(
            <line x1={x} y1={y} x2={x2} y2={y2} style={{
              stroke: `rgb(255, 0, 0)`,
              strokeWidth: 1
            }} />
          );
        }
    }

    // render
    return <svg width={this.props.width} height={this.props.height}>
      {interior}
    </svg>;
  }
}
