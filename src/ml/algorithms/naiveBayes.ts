export class GaussianNaiveBayesClassifier {
  mean0: number[] = [];
  var0: number[] = [];
  mean1: number[] = [];
  var1: number[] = [];
  prior0 = 0.5;
  prior1 = 0.5;

  fit(X: number[][], y: (0 | 1)[]): void {
    const numSamples = X.length;
    if (numSamples === 0) return;
    const numFeatures = X[0].length;

    const class0 = X.filter((_, i) => y[i] === 0);
    const class1 = X.filter((_, i) => y[i] === 1);

    this.prior0 = (class0.length || 1) / numSamples;
    this.prior1 = (class1.length || 1) / numSamples;

    this.mean0 = this.calcMean(class0, numFeatures);
    this.mean1 = this.calcMean(class1, numFeatures);

    this.var0 = this.calcVar(class0, this.mean0, numFeatures);
    this.var1 = this.calcVar(class1, this.mean1, numFeatures);
  }

  private calcMean(data: number[][], numFeatures: number): number[] {
    const mean = new Array(numFeatures).fill(0);
    if (data.length === 0) return mean;
    for (const row of data) {
      for (let j = 0; j < numFeatures; j++) {
        mean[j] += row[j];
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      mean[j] /= data.length;
    }
    return mean;
  }

  private calcVar(data: number[][], mean: number[], numFeatures: number): number[] {
    const variance = new Array(numFeatures).fill(0);
    if (data.length <= 1) return new Array(numFeatures).fill(1e-4);
    for (const row of data) {
      for (let j = 0; j < numFeatures; j++) {
        const diff = row[j] - mean[j];
        variance[j] += diff * diff;
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      variance[j] = variance[j] / (data.length - 1) + 1e-4; // Epsilon for numerical stability
    }
    return variance;
  }

  private logGaussian(x: number, mean: number, variance: number): number {
    const v = Math.max(variance, 1e-6);
    return -0.5 * Math.log(2 * Math.PI * v) - ((x - mean) * (x - mean)) / (2 * v);
  }

  predictProbabilities(X: number[][]): number[] {
    return X.map((row) => {
      let logProb0 = Math.log(this.prior0 || 1e-6);
      let logProb1 = Math.log(this.prior1 || 1e-6);

      for (let j = 0; j < row.length; j++) {
        logProb0 += this.logGaussian(row[j], this.mean0[j] ?? 0, this.var0[j] ?? 1);
        logProb1 += this.logGaussian(row[j], this.mean1[j] ?? 0, this.var1[j] ?? 1);
      }

      // Softmax to avoid overflow
      const maxLog = Math.max(logProb0, logProb1);
      const exp0 = Math.exp(logProb0 - maxLog);
      const exp1 = Math.exp(logProb1 - maxLog);
      return exp1 / (exp0 + exp1 + 1e-12);
    });
  }

  predict(X: number[][], threshold = 0.5): (0 | 1)[] {
    return this.predictProbabilities(X).map((p) => (p >= threshold ? 1 : 0));
  }
}
