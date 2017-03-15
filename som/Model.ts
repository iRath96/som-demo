import Matrix from "./Matrix";
import Lattice from "./Lattice";

/** Represents the model of a self-organizing map. */
export default class Model {
  /** The dimension the dataset and therefore the neurons' weights have. */
  readonly dataDimension: number = 3;

  private _distanceMatrix: Matrix<Float64Array>;
  private _weightMatrix: Matrix<Float64Array>;

  private _width: number;
  private _height: number;
  private _lattice: Lattice;

  constructor(
    width: number,
    height: number,
    lattice: Lattice
  ) {
    this._lattice = lattice;
    this.setDimensions(width, height);
  }

  /** Contains the squared euclidean distance from a neuron to another neuron. */
  get distanceMatrix() { return this._distanceMatrix; }
  /** Contains the weight vectors (as row vectors) of all neurons. */
  get weightMatrix() { return this._weightMatrix; }

  get width() { return this._width; }
  get height() { return this._height; }
  get lattice() { return this._lattice; }

  /**
   * Resizes the model.
   * Warning: This will reset the weight matrix.
   */
  setDimensions(width: number, height: number) {
    this._width = width;
    this._height = height;

    // initialize distance matrix
    this._distanceMatrix = new Matrix(Float64Array, this.neuronCount, this.neuronCount);
    this.calculateDistanceMatrix();

    // allocate weight matrix
    this._weightMatrix = new Matrix(Float64Array, this.neuronCount, this.dataDimension);
  }

  /** Updates the lattice and causes the distanceMatrix to be recalculated. */
  set lattice(lattice: Lattice) {
    this._lattice = lattice;
    this.calculateDistanceMatrix();
  }

  neuronPositionInLattice(neuronIndex: number) {
    return this.lattice.calculatePosition(
      neuronIndex % this.width,
      Math.floor(neuronIndex / this.width)
    );
  }

  /** Populates the distanceMatrix. */
  private calculateDistanceMatrix() {
    // from each neuron
    for (let i = 0; i < this.neuronCount; ++i) {
      let posI = this.neuronPositionInLattice(i);
      // to each other neuron
      for (let j = i; j < this.neuronCount; ++j) {
        // calculate the distance
        let posJ = this.neuronPositionInLattice(j);

        let distSqr = (posJ[0] - posI[0]) ** 2 + (posJ[1] - posI[1]) ** 2;
        
        this.distanceMatrix.set(i, j, distSqr);
        this.distanceMatrix.set(j, i, distSqr);
      }
    }
  }

  /** Returns the count of neurons in this model. */
  get neuronCount() {
    return this.width * this.height;
  }

  /**
   * Returns the index of the neuron (used as row index in matrices) at a given position.
   * The position is the grid index (i. e. not processed by Lattice.calculatePosition).
   */
  getNeuronIndex(x: number, y: number) {
    return x + y * this.width;
  }

  /** Returns the index of the neuron whose weights are closest to a given weight vector. */
  findBestMatchingUnit(weights: number[]): number {
    let bmu = 0, dist = Infinity;
    for (let i = 0; i < this.neuronCount; ++i) {
      let d = this._weightMatrix.getRow(i).reduce((sum, v, i) => sum + (weights[i] - v) ** 2, 0);
      if (d < dist) {
        dist = d;
        bmu = i;
      }
    }

    return bmu;
  }
}
