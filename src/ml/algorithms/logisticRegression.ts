export class LogisticRegressionClassifier {
  weights: number[] = [];
  bias = 0;
  learningRate: number;
  iterations: number;
  lambda: number; // L2 regularization

  constructor(learningRate = 0.05, iterations = 300, lambda = 0.01) {
    this.learningRate = learningRate;
    this.iterations = iterations;
    this.lambda = lambda;
  }

  private sigmoid(z: number): number {
    if (z > 20) return 1.0;
    if (z < -20) return 0.0;
    return 1 / (1 + Math.exp(-z));
  }

  fit(X: number[][], y: (0 | 1)[], sampleWeights?: number[]): void {
    const numSamples = X.length;
    if (numSamples === 0) return;
    const numFeatures = X[0].length;

    // Xavier/random initial weights
    this.weights = new Array(numFeatures)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 0.1);
    this.bias = 0;

    const weightsArr =
      sampleWeights || new Array(numSamples).fill(1 / numSamples);

    for (let iter = 0; iter < this.iterations; iter++) {
      const gradW = new Array(numFeatures).fill(0);
      let gradB = 0;

      for (let i = 0; i < numSamples; i++) {
        let z = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          z += this.weights[j] * X[i][j];
        }
        const prob = this.sigmoid(z);
        const error = (prob - y[i]) * weightsArr[i];

        for (let j = 0; j < numFeatures; j++) {
          gradW[j] += error * X[i][j];
        }
        gradB += error;
      }

      // Update weights with L2 regularization
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -=
          this.learningRate * (gradW[j] + this.lambda * this.weights[j]);
      }
      this.bias -= this.learningRate * gradB;
    }
  }

  predictProbabilities(X: number[][]): number[] {
    return X.map((row) => {
      let z = this.bias;
      for (let j = 0; j < row.length; j++) {
        z += (this.weights[j] || 0) * row[j];
      }
      return this.sigmoid(z);
    });
  }

  predict(X: number[][], threshold = 0.5): (0 | 1)[] {
    return this.predictProbabilities(X).map((p) => (p >= threshold ? 1 : 0));
  }

  getFeatureWeights(): number[] {
    return this.weights.map((w) => Math.abs(w));
  }
}
