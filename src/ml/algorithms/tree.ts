export interface TreeNode {
  isLeaf: boolean;
  prediction?: 0 | 1;
  probability?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  gain?: number;
}

export class DecisionTreeClassifier {
  maxDepth: number;
  minSamplesSplit: number;
  root: TreeNode | null = null;
  featureImportances: number[] = [];

  constructor(maxDepth = 6, minSamplesSplit = 4) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: (0 | 1)[], featureIndices?: number[]): void {
    const numFeatures = X[0]?.length || 0;
    this.featureImportances = new Array(numFeatures).fill(0);
    this.root = this.buildTree(X, y, 0, featureIndices);
    const totalImportance = this.featureImportances.reduce((a, b) => a + b, 0);
    if (totalImportance > 0) {
      this.featureImportances = this.featureImportances.map(
        (v) => v / totalImportance
      );
    }
  }

  private gini(y: (0 | 1)[]): number {
    if (y.length === 0) return 0;
    const p1 = y.filter((val) => val === 1).length / y.length;
    const p0 = 1 - p1;
    return 1 - (p0 * p0 + p1 * p1);
  }

  private buildTree(
    X: number[][],
    y: (0 | 1)[],
    depth: number,
    featureSubset?: number[]
  ): TreeNode {
    const numSamples = y.length;
    const count1 = y.filter((val) => val === 1).length;
    const prob1 = numSamples > 0 ? count1 / numSamples : 0;
    const majorityClass: 0 | 1 = prob1 >= 0.5 ? 1 : 0;

    // Check stopping criteria
    if (
      depth >= this.maxDepth ||
      numSamples < this.minSamplesSplit ||
      count1 === 0 ||
      count1 === numSamples
    ) {
      return {
        isLeaf: true,
        prediction: majorityClass,
        probability: prob1,
      };
    }

    const currentGini = this.gini(y);
    const featuresToTry =
      featureSubset || Array.from({ length: X[0].length }, (_, i) => i);

    let bestGain = -1;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    for (const f of featuresToTry) {
      const values = X.map((row) => row[f]);
      const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
      if (uniqueValues.length <= 1) continue;

      // Sample a subset of thresholds for efficiency
      const step = Math.max(1, Math.floor(uniqueValues.length / 15));
      for (let i = 0; i < uniqueValues.length - 1; i += step) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const leftIdx: number[] = [];
        const rightIdx: number[] = [];

        for (let j = 0; j < numSamples; j++) {
          if (X[j][f] <= threshold) {
            leftIdx.push(j);
          } else {
            rightIdx.push(j);
          }
        }

        if (leftIdx.length === 0 || rightIdx.length === 0) continue;

        const leftY = leftIdx.map((idx) => y[idx]);
        const rightY = rightIdx.map((idx) => y[idx]);

        const weightedGini =
          (leftIdx.length / numSamples) * this.gini(leftY) +
          (rightIdx.length / numSamples) * this.gini(rightY);
        const gain = currentGini - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
          bestLeftIndices = leftIdx;
          bestRightIndices = rightIdx;
        }
      }
    }

    if (bestGain <= 0.0001 || bestFeature === -1) {
      return {
        isLeaf: true,
        prediction: majorityClass,
        probability: prob1,
      };
    }

    this.featureImportances[bestFeature] =
      (this.featureImportances[bestFeature] || 0) + bestGain * numSamples;

    const leftX = bestLeftIndices.map((i) => X[i]);
    const leftY = bestLeftIndices.map((i) => y[i]);
    const rightX = bestRightIndices.map((i) => X[i]);
    const rightY = bestRightIndices.map((i) => y[i]);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      gain: bestGain,
      probability: prob1,
      left: this.buildTree(leftX, leftY, depth + 1, featureSubset),
      right: this.buildTree(rightX, rightY, depth + 1, featureSubset),
    };
  }

  predictRowProbability(row: number[]): number {
    let curr = this.root;
    while (curr && !curr.isLeaf) {
      const f = curr.featureIndex!;
      const th = curr.threshold!;
      if (row[f] <= th) {
        curr = curr.left || null;
      } else {
        curr = curr.right || null;
      }
    }
    return curr ? curr.probability ?? 0.5 : 0.5;
  }

  predictProbabilities(X: number[][]): number[] {
    return X.map((row) => this.predictRowProbability(row));
  }

  predict(X: number[][], threshold = 0.5): (0 | 1)[] {
    return this.predictProbabilities(X).map((p) => (p >= threshold ? 1 : 0));
  }
}
