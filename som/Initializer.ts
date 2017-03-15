import Model from "./Model";
import Dataset from "./Dataset";

import PCA from "./utils/PCA";


/** Used to initialize a `Model`. */
export abstract class Initializer {
  abstract performInitialization(dataset: Dataset, model: Model): void;
}

export default Initializer

/** Initializes all neuron weights to random positions. */
export class RandomInitializer extends Initializer {
  performInitialization(dataset: Dataset, model: Model) {
    for (let neuronIndex = 0; neuronIndex < model.neuronCount; ++neuronIndex)
      for (let dim = 0; dim < model.dataDimension; ++dim)
        model.weightMatrix.set(neuronIndex, dim, Math.random());
  }
}

/** Initializes all neuron weights using a PCA dimension reduction. */
export class PCAInitializer extends Initializer {
  performInitialization(dataset: Dataset, model: Model) {
    let pca: PCA;
    try {
      pca = new PCA(dataset.getAllSamples(), 2);
    } catch (e) {
      console.warn(e);
      // no PCA convergence
      return;
    }

    for (let x = 0; x < model.width; ++x)
      for (let y = 0; y < model.height; ++y) {
        let weights = pca.recover([ (x + 0.5) / model.width, (y + 0.5) / model.height ]);
        weights.forEach((weight, dim) => model.weightMatrix.set(
          model.getNeuronIndex(x, y),
          dim,
          weight
        ));
      }
  }
}
