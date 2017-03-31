declare enum Distribution {
  GAUSSIAN,
  UNIFORM
}

/** Source */
declare var source: {
  /** Generates a random value. */
  getRandomValue(index: number, distribution: Distribution): number;

  /** The total count of samples to be generated. */
  sampleCount: number;
};

/**
 * The index of the sample currently being generated.
 * Ranges from 0 to \`source.sampleCount - 1\`
 */
declare var index: number;
