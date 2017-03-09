/** Can be Float32ArrayConstructor or Float64ArrayConstructor. */
export interface FloatArrayConstructor<T> {
  new (buffer: ArrayBuffer): T;
  BYTES_PER_ELEMENT: number;
}

export default class Matrix<T extends Float64Array | Float32Array> {
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
