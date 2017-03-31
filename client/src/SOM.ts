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
    this.trainer.learningRateBounds = { start: 0.2, end: 0.02 };
    this.trainer.neighborSizeBounds = { start: 4, end: 0.1 };
    this.trainer.maxIteration = 5000;
  }

  initialize() {
    this.initializer.performInitialization(this.dataset, this.model);
    this.trainer.reset();
  }

  iterate(count: number) {
    this.trainer.iterate(count);
  }

  getErrors(sampleCount: number = 100) {
    let stride = Math.max(1, Math.floor(this.dataset.sampleCount / sampleCount));

    let eQ = 0, eT = 0, count = 0;
    for (let i = 0; i < this.dataset.sampleCount; i += stride) {
      let point = this.dataset.getSample(i);
      let [ bmu, bmu2 ] = this.model.findBestMatchingUnits(point, 2);
      let point2 = this.model.weightMatrix.getRow(bmu);

      eQ += Math.sqrt(point.map((a, i) => (a - point2[i]) ** 2).reduce((sum, v) => sum + v, 0));
      eT += this.model.distanceMatrix.get(bmu, bmu2) <= 1 ? 0 : 1;
      ++count;
    }

    eQ /= sampleCount;
    eT /= sampleCount;

    return {
      eQ, eT
    };
  }
}
