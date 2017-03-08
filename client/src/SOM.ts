/** Can be Float32ArrayConstructor or Float64ArrayConstructor. */
interface FloatArrayConstructor<T> {
  new (buffer: ArrayBuffer): T;
  BYTES_PER_ELEMENT: number;
}

class Matrix<T extends Float64Array | Float32Array> {
  /** Buffer for the ArrayBufferView. */
  readonly buffer: ArrayBuffer;
  /** Contains all elements of the matrix. */
  readonly data: T;
  
  constructor(
    /** The constructor for the kind of ArrayBufferView to be used with this Matrix. */
    readonly arrayConstructor: FloatArrayConstructor<T>,
    /** The vertical dimension of the matrix. */
    readonly rows: number,
    /** The horizontal dimension of the matrix. */
    readonly columns: number,
  ) {
    this.buffer = new ArrayBuffer(arrayConstructor.BYTES_PER_ELEMENT * columns * rows);
    this.data = new arrayConstructor(this.buffer);
  }

  /** Sets a single element in the matrix. */
  set(row: number, col: number, value: number) {
    this.data[col + row * this.columns] = value;
  }

  /** Returns a single element from the matrix. */
  get(row: number, col: number) {
    return this.data[col + row * this.columns];
  }

  /** Returns a row vector from the matrix. */
  getRow(row: number): T {
    return this.data.slice(row * this.columns, (row + 1) * this.columns) as T;
  }
}

export abstract class Lattice {
  abstract calculatePosition(x: number, y: number): number[];
}

export class SquareLattice extends Lattice {
  calculatePosition(x: number, y: number) {
    return [ x, y ];
  }
}

export class HexagonalLattice extends Lattice {
  static readonly X_OFFSET = Math.cos(Math.PI / 3);
  static readonly Y_OFFSET = Math.sin(Math.PI / 3);

  calculatePosition(x: number, y: number) {
    return [
      x + (y % 2) * HexagonalLattice.X_OFFSET,
      y * HexagonalLattice.Y_OFFSET
    ]
  }
}

class Model {
  /** The dimension the dataset and therefore the neurons' weights have. */
  readonly dataDimension: number = 3;

  private _distanceMatrix: Matrix<Float64Array>;
  private _weightMatrix: Matrix<Float64Array>;

  constructor(
    private _width: number,
    private _height: number,
    private _lattice: Lattice
  ) {
    this.setDimensions(_width, _height);
  }

  /** Contains the squared euclidean distance from a neuron to another neuron. */
  get distanceMatrix() { return this._distanceMatrix; }
  get weightMatrix() { return this._weightMatrix; }

  get width() { return this._width; }
  get height() { return this._height; }
  get lattice() { return this._lattice; }

  /**
   * Resizes the model.
   * Warning: This will reset the weight matrix.
   */
  setDimensions(width: number, height: number) {
    // initialize distance matrix
    this._distanceMatrix = new Matrix(Float64Array, this.neuronCount, this.neuronCount);
    this.calculateDistanceMatrix();

    // allocate weight matrix
    this._weightMatrix = new Matrix(Float64Array, this.neuronCount, this.dataDimension);
  }

  set lattice(lattice: Lattice) {
    this._lattice = lattice;
    this.calculateDistanceMatrix();
  }

  private calculateDistanceMatrix() {
    // from each neuron
    for (let i = 0; i < this.neuronCount; ++i)
      // to each other neuron
      for (let j = i; j < this.neuronCount; ++j) {
        // calculate the distance
        let [ posI, posJ ] = [ i, j ].map(index =>
          this.lattice.calculatePosition(index % this.width, Math.floor(index / this.width))
        );

        let dist = (posJ[0] - posI[0]) ** 2 + (posJ[1] - posJ[0]) ** 2;

        this.distanceMatrix.set(i, j, dist);
        this.distanceMatrix.set(j, i, dist);
      }
  }

  get neuronCount() {
    return this.width * this.height;
  }

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

abstract class Initializer {
  abstract performInitialization(dataset: Dataset, model: Model): void;
}

export class RandomInitializer {
  performInitialization(dataset: Dataset, model: Model) {
    for (let neuronIndex = 0; neuronIndex < model.neuronCount; ++neuronIndex)
      for (let dim = 0; dim < model.dataDimension; ++dim)
        model.weightMatrix.set(neuronIndex, dim, Math.random());
  }
}

export class PCAInitializer {
  performInitialization(dataset: Dataset, model: Model) {
    throw new Error("ToDo");
  }
}

abstract class DatasetSampler {
  constructor(
    readonly dataset: Dataset
  ) {

  }

  abstract nextSample(): number[];
}

export class BootstrapDatasetSampler extends DatasetSampler {
  nextSample() {
    return this.dataset.getSample(Math.floor(Math.random() * this.dataset.sampleCount));
  }
}

interface DecayingValue {
  start: number;
  end: number;
}

const exponentialDecay = (value: DecayingValue, t: number) =>
  value.start * Math.pow(value.end / value.start, t)
;

class Trainer {
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
  
  iterate(count: number) {
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
        let df = exponent < -4 ? 0 : Math.exp(exponent);

        let lf = 1.0 - learningRate * df;
        for (let dim = 0; dim < this.model.dataDimension; ++dim)
          this.model.weightMatrix.set(i, dim,
            // blend between previous value and input vector
            this.model.weightMatrix.get(i, dim) * lf + input[i] * (1 - lf)
          );
      }

      // advance to next iteration
      ++this.currentIteration;
    }
  }

  get hasFinished() {
    return this.currentIteration >= this.maxIteration;
  }
}

abstract class DatasetSource {
  constructor(
    public sampleCount: number
  ) {
  }

  abstract getSample(sampleIndex: number): number[];
}

class Dataset {
  constructor(
    public sources: DatasetSource[]
  ) {
  }

  get sampleCount() {
    return this.sources.reduce((sum, source) => sum + source.sampleCount, 0);
  }

  getSample(sampleIndex: number) {
    let sourceIndex = 0;
    while (sourceIndex < this.sources.length) {
      let source = this.sources[sourceIndex++];
      if (source.sampleCount > sampleIndex)
        return source.getSample(sampleIndex);
      sampleIndex -= source.sampleCount;
    }

    throw new Error("Sample index out of bounds");
  }
}

export class SOM {
  readonly model: Model;
  readonly trainer: Trainer;
  readonly dataset: Dataset;
  initializer: Initializer;

  constructor() {
    this.model = new Model(4, 4, new SquareLattice());
    this.initializer = new PCAInitializer();
    this.dataset = new Dataset([]);
    this.trainer = new Trainer(this.model, new BootstrapDatasetSampler(this.dataset));
  }
}
