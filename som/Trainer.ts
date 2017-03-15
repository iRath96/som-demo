import Model from "./Model";
import Matrix from "./Matrix";
import DatasetSampler from "./DatasetSampler";


/** Represents the bounds for a decaying value (one that changes over time). */
export interface DecayingValue {
  /** The initial value of this variable (at `t = 0`). */
  start: number;
  /** The final value of this variable (at `t = 1`). */
  end: number;
}

const exponentialDecay = (value: DecayingValue, t: number) =>
  value.start * Math.pow(value.end / value.start, t)
;

/** Used to train a `Model`. */
export default class Trainer {
  currentIteration: number = 0;
  maxIteration: number;

  learningRateBounds: DecayingValue;
  neighborSizeBounds: DecayingValue;

  constructor(
    readonly model: Model,
    public datasetSampler: DatasetSampler
  ) {

  }

  /** Returns the learning rate for the current iteration. */
  get learningRate() {
    return exponentialDecay(this.learningRateBounds, this.progress);
  }

  /** Returns the neighbor size for the current iteration. */
  get neighborSize() {
    return exponentialDecay(this.neighborSizeBounds, this.progress);
  }

  /** Returns a number between [0;1] to denote current training progress. */
  get progress() {
    return this.currentIteration / this.maxIteration;
  }
  
  iterate(count: number, targetWeightMatrix: Matrix<any> = this.model.weightMatrix) {
    count = Math.min(count, this.maxIteration - this.currentIteration);
    
    let input: number[];
    for (let iteration = 0; iteration < count; ++iteration) {
      // get a datapoint for this iteration
      input = this.datasetSampler.nextSample();
      
      // get learning properties
      let learningRate = this.learningRate;
      let neighborSizeSqr = this.neighborSize ** 2;

      // find best matching unit
      let bmu = this.model.findBestMatchingUnit(input);
      for (let i = 0; i < this.model.neuronCount; ++i) {
        // adjust every neuron's weights
        let distSqr = this.model.distanceMatrix.get(bmu, i);
        let exponent = -distSqr / (2 * neighborSizeSqr);
        let df = exponent < -2.3 ? 0 : Math.exp(exponent);

        let lf = 1.0 - learningRate * df;
        for (let dim = 0; dim < this.model.dataDimension; ++dim)
          targetWeightMatrix.set(i, dim,
            // blend between previous value and input vector
            this.model.weightMatrix.get(i, dim) * lf + input[dim] * (1 - lf)
          );
      }

      // advance to next iteration
      ++this.currentIteration;
    }
  }

  get hasFinished() {
    return this.currentIteration >= this.maxIteration;
  }

  reset() {
    this.currentIteration = 0;
  }
}
