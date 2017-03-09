import DatasetSource from "./DatasetSource";

/** Represents a set of datapoints. */
export default class Dataset {
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

  getAllSamples() {
    let matrix = [];
    for (let i = 0; i < this.sampleCount; ++i)
      matrix[i] = this.getSample(i);
    return matrix;
  }
}
