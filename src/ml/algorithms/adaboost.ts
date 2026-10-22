interface DecisionStump {
  featureIndex: number;
  threshold: number;
  polarity: 1 | -1;
  alpha: number;
}

export class AdaBoostClassifier {
  nEstimators: number;
  stumps: DecisionStump[] = [];
  featureImportances: number[] = [];

  constructor(nEstimators = 20) {
    this.nEstimators = nEstimators;
  }

  fit(X: number[][], y: (0 | 1)[]): void {
    const numSamples = X.length;
    if (numSamples === 0) return;
    const numFeatures = X[0].length;

    this.stumps = [];
    this.featureImportances = new Array(numFeatures).fill(0);

    // Initial equal weights
    let weights = new Array(numSamples).fill(1 / numSamples);

    for (let t = 0; t < this.nEstimators; t++) {
      let minError = Infinity;
      let bestStump: DecisionStump = {
        featureIndex: 0,
        threshold: 0,
        polarity: 1,
        alpha: 1,
      };

      for (let f = 0; f < numFeatures; f++) {
        const values = X.map((r) => r[f]);
        const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
        const step = Math.max(1, Math.floor(uniqueValues.length / 20));

        for (let i = 0; i < uniqueValues.length; i += step) {
          const threshold = uniqueValues[i];

          for (const polarity of [1, -1] as (1 | -1)[]) {
            let error = 0;
            for (let j = 0; j < numSamples; j++) {
              const pred =
                polarity === 1
                  ? X[j][f] > threshold
                    ? 1
                    : 0
                  : X[j][f] < threshold
                  ? 1
                  : 0;
              if (pred !== y[j]) {
                error += weights[j];
              }
            }

            if (error < minError) {
              minError = error;
              bestStump = {
                featureIndex: f,
                threshold,
                polarity,
                alpha: 0,
              };
            }
          }
        }
      }

      const eps = 1e-10;
      minError = Math.max(eps, Math.min(1 - eps, minError));
      const alpha = 0.5 * Math.log((1 - minError) / minError);
      bestStump.alpha = alpha;

      this.stumps.push(bestStump);
      this.featureImportances[bestStump.featureIndex] += alpha;

      // Update sample weights
      let weightSum = 0;
      for (let j = 0; j < numSamples; j++) {
        const pred =
          bestStump.polarity === 1
            ? X[j][bestStump.featureIndex] > bestStump.threshold
              ? 1
              : 0
            : X[j][bestStump.featureIndex] < bestStump.threshold
            ? 1
            : 0;
        const factor = pred === y[j] ? Math.exp(-alpha) : Math.exp(alpha);
        weights[j] *= factor;
        weightSum += weights[j];
      }

      // Normalize weights
      if (weightSum > 0) {
        weights = weights.map((w) => w / weightSum);
      }
    }

    const totalImp = this.featureImportances.reduce((a, b) => a + b, 0);
    if (totalImp > 0) {
      this.featureImportances = this.featureImportances.map((v) => v / totalImp);
    }
  }

  predictProbabilities(X: number[][]): number[] {
    const totalAlpha = this.stumps.reduce((a, s) => a + s.alpha, 0) || 1;

    return X.map((row) => {
      let score = 0;
      for (const stump of this.stumps) {
        const pred =
          stump.polarity === 1
            ? row[stump.featureIndex] > stump.threshold
              ? 1
              : 0
            : row[stump.featureIndex] < stump.threshold
            ? 1
            : 0;
        score += stump.alpha * (pred === 1 ? 1 : -1);
      }
      // Sigmoid mapping of raw ensemble score
      return 1 / (1 + Math.exp(-score / Math.max(1, totalAlpha / 2)));
    });
  }

  predict(X: number[][], threshold = 0.5): (0 | 1)[] {
    return this.predictProbabilities(X).map((p) => (p >= threshold ? 1 : 0));
  }
}
