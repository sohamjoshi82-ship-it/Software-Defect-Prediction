export class KNNClassifier {
  k: number;
  trainX: number[][] = [];
  trainY: (0 | 1)[] = [];

  constructor(k = 5) {
    this.k = k;
  }

  fit(X: number[][], y: (0 | 1)[]): void {
    this.trainX = X;
    this.trainY = y;
  }

  private distance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  predictProbabilities(X: number[][]): number[] {
    if (this.trainX.length === 0) return X.map(() => 0.5);

    return X.map((testRow) => {
      // Find distances to all training points
      const distances = this.trainX.map((trainRow, idx) => ({
        dist: this.distance(testRow, trainRow),
        label: this.trainY[idx],
      }));

      distances.sort((a, b) => a.dist - b.dist);
      const topK = distances.slice(0, Math.min(this.k, distances.length));

      // Weighted or unweighted fraction of defectives
      let weightedDefects = 0;
      let totalWeight = 0;

      for (const neighbor of topK) {
        const weight = 1 / (neighbor.dist + 1e-4);
        totalWeight += weight;
        if (neighbor.label === 1) {
          weightedDefects += weight;
        }
      }

      return totalWeight > 0 ? weightedDefects / totalWeight : 0.5;
    });
  }

  predict(X: number[][], threshold = 0.5): (0 | 1)[] {
    return this.predictProbabilities(X).map((p) => (p >= threshold ? 1 : 0));
  }
}
