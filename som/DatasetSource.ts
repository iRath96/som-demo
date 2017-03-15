export abstract class DatasetSource {
  constructor(
    public sampleCount: number
  ) {
  }

  abstract getSample(sampleIndex: number): number[];
}

export default DatasetSource;

export enum Distribution {
  UNIFORM,
  GAUSSIAN
}

export abstract class RandomDatasetSource extends DatasetSource {
  private randomValues = new Map<number, number>();
  protected getRandomValue(index: number, distribution: Distribution = Distribution.GAUSSIAN) {
    if (!this.randomValues.has(index))
      this.randomValues.set(index, this.generateRandomValue(distribution));
    return this.randomValues.get(index)!;
  }

  private generateRandomValue(distribution: Distribution) {
    switch (distribution) {
      case Distribution.UNIFORM: return Math.random();
      case Distribution.GAUSSIAN: { // Box-Muller
        let u1 = 1.0 - Math.random();
        let u2 = 1.0 - Math.random();
        
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
      }
    }
  }
}

export class ClusterDatasetSource extends RandomDatasetSource {
  constructor(
    sampleCount: number,
    public center: number[],
    public stddev: number
  ) {
    super(sampleCount);
  }

  getSample(index: number) {
    return this.center.map((v, i) =>
      v + this.getRandomValue(index * this.center.length + i, Distribution.GAUSSIAN) * this.stddev
    );
  }
}

export class CallbackDatasetSource extends RandomDatasetSource {
  private _code: string;
  private _callback: (index: number) => number[];

  constructor(
    sampleCount: number,
    code: string
  ) {
    super(sampleCount);

    this.code = code;
  }

  set code(code: string) {
    // we provide "source" because there seems to be no way to specify the "this"-context for monaco-editor
    // we provide "Distribution"" because there seems to be no other way to add something to the context of a function
    this._callback = new Function("index", "source", "Distribution", code) as any;
    this._code = code;
  }

  get code() {
    return this._code;
  }

  getSample(index: number) {
    return (this._callback as any)(index, this, Distribution);
  }
}
