const numeric = require("numericjs");

export default class PCA {
  public readonly U: number[][];
  public readonly means: number[];
  public readonly stddevs: number[];
  public readonly data: number[][];

  public readonly min: number[];
  public readonly max: number[];

  constructor(
    data: number[][],
    public readonly k: number // reduction
  ) {
    // normalize data
    this.means = PCA.mean(data);
    data = data.map(row => row.map((v, i) => v - this.means[i]));
    this.stddevs = PCA.squareMean(data).map(Math.sqrt);
    data.forEach(row =>
      row.forEach((v, i) => row[i] /= this.stddevs[i])
    );
    this.data = data;

    // do PCA
    let m = data.length;
    let sigma = numeric.div(numeric.dot(numeric.transpose(data), data), m);
    this.U = (numeric.svd(sigma).U as number[][]).map(row =>
      row.slice(0, k)
    );

    // find min/max
    let projected = numeric.dot(this.data, this.U) as number[][];
    this.min = [ ...projected[0] ];
    this.max = [ ...projected[0] ];
    projected.forEach(row =>
      row.forEach((v, i) => {
        if (this.min[i] > v)
          this.min[i] = v;
        else if (this.max[i] < v)
          this.max[i] = v;
      })
    );
  }

  static mean(data: number[][]) {
    return data
      .reduce((sum, row) => {
        for (let i = 0; i < sum.length; ++i)
          sum[i] += row[i];
        return sum;
      }, data[0].map(v => 0))
      .map(v => v / data.length);
  }

  static squareMean(data: number[][]) {
    return data
      .reduce((sum, row) => {
        for (let i = 0; i < sum.length; ++i)
          sum[i] += row[i] * row[i];
        return sum;
      }, data[0].map(v => 0))
      .map(v => v / data.length);
  }

  recover(vector: number[]) {
    vector = vector.map((v, i) => v * (this.max[i] - this.min[i]) + this.min[i]);
    let raw = numeric.dot(vector, numeric.transpose(this.U)) as number[];
    return raw.map((v, i) => v * this.stddevs[i] + this.means[i]);
  }
}
