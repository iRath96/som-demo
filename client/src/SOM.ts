import Model from "som/Model";
import Trainer from "som/Trainer";
import Dataset from "som/Dataset";
import { ClusterDatasetSource } from "som/DatasetSource";
import { SquareLattice } from "som/Lattice";
import { BootstrapDatasetSampler } from "som/DatasetSampler";
import { Initializer, PCAInitializer } from "som/Initializer";


/** Controller for self-organizing maps. */
export default class SOMController {
  readonly model: Model;
  readonly trainer: Trainer;
  readonly dataset: Dataset;
  initializer: Initializer;

  constructor() {
    this.model = new Model(12, 12, new SquareLattice());
    this.initializer = new PCAInitializer();

    let sources: ClusterDatasetSource[] = [];
    for (let i = 0; i < 6; ++i)
      sources.push(new ClusterDatasetSource(1000, [0,0,0].map(Math.random), 0.02));
    
    this.dataset = new Dataset(sources);
    
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
