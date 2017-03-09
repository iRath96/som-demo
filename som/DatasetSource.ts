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
