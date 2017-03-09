import Model from "../../som/Model";
import Trainer from "../../som/Trainer";
import Dataset from "../../som/Dataset";
import { RandomDatasetSource, Distribution } from "../../som/DatasetSource";
import { SquareLattice } from "../../som/Lattice";
import { BootstrapDatasetSampler } from "../../som/DatasetSampler";
import { Initializer, RandomInitializer } from "../../som/Initializer";


class ClusterDatasetSource extends RandomDatasetSource {
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

/** Controller for self-organizing maps. */
export default class SOMController {
  readonly model: Model;
  readonly trainer: Trainer;
  readonly dataset: Dataset;
  initializer: Initializer;

  constructor() {
    this.model = new Model(12, 12, new SquareLattice());
    this.initializer = new RandomInitializer();
    this.dataset = new Dataset([
      new ClusterDatasetSource(1000, [ 0.5, 0.5, 0.5 ], 0.02),
      new ClusterDatasetSource(1000, [ 0.1, 0.8, 0.5 ], 0.02),
      new ClusterDatasetSource(1000, [ 0.1, 0.1, 0.5 ], 0.02)
    ]);
    
    this.trainer = new Trainer(this.model, new BootstrapDatasetSampler(this.dataset));
    this.trainer.learningRateBounds = { start: 0.1, end: 0.005 };
    this.trainer.neighborSizeBounds = { start: 12 / 2, end: 0.1 };
    this.trainer.maxIteration = 10000;
  }

  initialize() {
    this.initializer.performInitialization(this.dataset, this.model);
    this.trainer.reset();
  }

  iterate(count: number) {
    this.trainer.iterate(count);
  }
}
