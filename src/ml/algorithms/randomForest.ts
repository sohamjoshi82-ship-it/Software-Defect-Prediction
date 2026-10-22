import { DecisionTreeClassifier } from './tree.ts';

export class RandomForestClassifier {
  nEstimators: number;
  maxDepth: number;
  minSamplesSplit: number;
  trees: DecisionTreeClassifier[] = [];
  featureImportances: number[] = [];

  constructor(nEstimators = 15, maxDepth = 6, minSamplesSplit = 4) {
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: (0 | 1)[]): void {
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    this.trees = [];
    this.featureImportances = new Array(numFeatures).fill(0);

    // Number of features to consider per tree split (sqrt(n))
    const maxFeaturesPerTree = Math.max(
      2,
      Math.min(numFeatures, Math.round(Math.sqrt(numFeatures)))
    );

    for (let t = 0; t < this.nEstimators; t++) {
      // Bootstrap sampling (with replacement)
      const bootX: number[][] = [];
      const bootY: (0 | 1)[] = [];
      for (let i = 0; i < numSamples; i++) {
        const randIdx = Math.floor(Math.random() * numSamples);
        bootX.push(X[randIdx]);
        bootY.push(y[randIdx]);
      }

      // Random feature subset
      const allFeatureIndices = Array.from({ length: numFeatures }, (_, i) => i);
      const shuffledFeatures = allFeatureIndices.sort(() => Math.random() - 0.5);
      const selectedFeatures = shuffledFeatures.slice(0, maxFeaturesPerTree);

      const tree = new DecisionTreeClassifier(this.maxDepth, this.minSamplesSplit);
      tree.fit(bootX, bootY, selectedFeatures);
      this.trees.push(tree);

      // Accumulate feature importances
      for (let f = 0; f < numFeatures; f++) {
        this.featureImportances[f] += tree.featureImportances[f] || 0;
      }
    }

    const totalImportance = this.featureImportances.reduce((a, b) => a + b, 0);
    if (totalImportance > 0) {
      this.featureImportances = this.featureImportances.map(
        (v) => v / totalImportance
      );
    }
  }

  predictProbabilities(X: number[][]): number[] {
    if (this.trees.length === 0) return X.map(() => 0.5);
    return X.map((row) => {
      let sumProb = 0;
      for (const tree of this.trees) {
        sumProb += tree.predictRowProbability(row);
      }
      return sumProb / this.trees.length;
    });
  }

  predict(X: number[][], threshold = 0.5): (0 | 1)[] {
    return this.predictProbabilities(X).map((p) => (p >= threshold ? 1 : 0));
  }
}
