export function applySMOTE(
  X: number[][],
  y: (0 | 1)[],
  targetMinorityRatio = 0.5, // Ratio of minority to total or balanced
  kNeighbors = 5
): { X_resampled: number[][]; y_resampled: (0 | 1)[] } {
  const minorityIndices: number[] = [];
  const majorityIndices: number[] = [];

  for (let i = 0; i < y.length; i++) {
    if (y[i] === 1) minorityIndices.push(i);
    else majorityIndices.push(i);
  }

  // If already balanced or minority is empty/too small
  if (minorityIndices.length === 0 || majorityIndices.length === 0) {
    return { X_resampled: [...X], y_resampled: [...y] };
  }

  const minorityCount = minorityIndices.length;
  const majorityCount = majorityIndices.length;

  // If minority is already bigger or equal to majority
  if (minorityCount >= majorityCount) {
    return { X_resampled: [...X], y_resampled: [...y] };
  }

  const desiredMinorityCount = Math.min(
    majorityCount,
    Math.round(minorityCount * (1 + targetMinorityRatio * 2))
  );
  const syntheticNeeded = Math.max(0, desiredMinorityCount - minorityCount);

  if (syntheticNeeded <= 0) {
    return { X_resampled: [...X], y_resampled: [...y] };
  }

  const minoritySamples = minorityIndices.map((idx) => X[idx]);
  const numFeatures = X[0].length;
  const syntheticSamples: number[][] = [];

  const euclideanDistance = (a: number[], b: number[]): number => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  };

  const actualK = Math.min(kNeighbors, minoritySamples.length - 1);

  for (let s = 0; s < syntheticNeeded; s++) {
    // Pick a random minority sample
    const randMinIdx = Math.floor(Math.random() * minoritySamples.length);
    const sample = minoritySamples[randMinIdx];

    // Find its k-nearest neighbors in minority class
    const distList = minoritySamples
      .map((other, idx) => ({
        idx,
        dist: idx === randMinIdx ? Infinity : euclideanDistance(sample, other),
      }))
      .sort((a, b) => a.dist - b.dist);

    if (actualK <= 0 || distList[0].dist === Infinity) {
      // Duplicate with slight noise
      const synthetic = sample.map((val) => val + (Math.random() - 0.5) * 0.05 * val);
      syntheticSamples.push(synthetic);
      continue;
    }

    const neighborIdx =
      distList[Math.floor(Math.random() * Math.min(actualK, distList.length))].idx;
    const neighbor = minoritySamples[neighborIdx];

    // Linear interpolation: sample + gap * (neighbor - sample)
    const gap = Math.random();
    const synthetic = new Array(numFeatures);
    for (let f = 0; f < numFeatures; f++) {
      synthetic[f] = sample[f] + gap * (neighbor[f] - sample[f]);
    }
    syntheticSamples.push(synthetic);
  }

  const X_resampled = [...X, ...syntheticSamples];
  const y_resampled = [
    ...y,
    ...new Array(syntheticSamples.length).fill(1 as 0 | 1),
  ];

  return { X_resampled, y_resampled };
}
