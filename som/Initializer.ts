import Model from "./Model";
import Dataset from "./Dataset";

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
    throw new Error("ToDo");
  }
}
