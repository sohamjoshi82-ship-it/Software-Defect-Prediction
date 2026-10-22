import type { ConfusionMatrix, CurvePoint, EvaluationMetrics } from './types.ts';

export function calculateConfusionMatrix(
  yTrue: (0 | 1)[],
  yPred: (0 | 1)[]
): ConfusionMatrix {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;

  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1 && yPred[i] === 1) tp++;
    else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
    else if (yTrue[i] === 1 && yPred[i] === 0) fn++;
    else if (yTrue[i] === 0 && yPred[i] === 0) tn++;
  }

  return { tp, fp, fn, tn };
}

export function computeMetricsFromScores(
  yTrue: (0 | 1)[],
  yProb: number[],
  threshold = 0.5
): EvaluationMetrics {
  const yPred: (0 | 1)[] = yProb.map((p) => (p >= threshold ? 1 : 0));
  const cm = calculateConfusionMatrix(yTrue, yPred);

  const total = yTrue.length || 1;
  const accuracy = (cm.tp + cm.tn) / total;

  // Precision: TP / (TP + FP)
  const precision = cm.tp + cm.fp > 0 ? cm.tp / (cm.tp + cm.fp) : 0;

  // Recall / Probability of Detection (PD): TP / (TP + FN)
  const recall = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : 0;

  // Specificity / True Negative Rate: TN / (TN + FP)
  const specificity = cm.tn + cm.fp > 0 ? cm.tn / (cm.tn + cm.fp) : 0;

  // Probability of False Alarm (PF): FP / (FP + TN) = 1 - Specificity
  const falseAlarmRate = cm.fp + cm.tn > 0 ? cm.fp / (cm.fp + cm.tn) : 0;

  // F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Matthews Correlation Coefficient (MCC)
  const mccDenominator = Math.sqrt(
    (cm.tp + cm.fp) * (cm.tp + cm.fn) * (cm.tn + cm.fp) * (cm.tn + cm.fn)
  );
  const mcc =
    mccDenominator > 0 ? (cm.tp * cm.tn - cm.fp * cm.fn) / mccDenominator : 0;

  // Generate ROC and PR curves across thresholds
  const { rocCurve, rocAuc, prCurve, prAuc } = computeRocAndPrCurves(yTrue, yProb);

  return {
    accuracy,
    precision,
    recall,
    falseAlarmRate,
    specificity,
    f1Score,
    mcc,
    rocAuc,
    prAuc,
    confusionMatrix: cm,
    rocCurve,
    prCurve,
    threshold,
  };
}

export function computeRocAndPrCurves(
  yTrue: (0 | 1)[],
  yProb: number[]
): {
  rocCurve: CurvePoint[];
  rocAuc: number;
  prCurve: CurvePoint[];
  prAuc: number;
} {
  const numSteps = 50;
  const thresholds: number[] = [];
  for (let i = 0; i <= numSteps; i++) {
    thresholds.push(i / numSteps);
  }

  const rocPoints: CurvePoint[] = [];
  const prPoints: CurvePoint[] = [];

  const totalPositive = yTrue.filter((y) => y === 1).length;
  const totalNegative = yTrue.filter((y) => y === 0).length;

  for (const th of thresholds) {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;

    for (let i = 0; i < yTrue.length; i++) {
      const pred = yProb[i] >= th ? 1 : 0;
      if (yTrue[i] === 1 && pred === 1) tp++;
      else if (yTrue[i] === 0 && pred === 1) fp++;
      else if (yTrue[i] === 1 && pred === 0) fn++;
      else if (yTrue[i] === 0 && pred === 0) tn++;
    }

    const tpr = totalPositive > 0 ? tp / totalPositive : 0;
    const fpr = totalNegative > 0 ? fp / totalNegative : 0;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = tpr;

    rocPoints.push({ x: fpr, y: tpr, threshold: th });
    prPoints.push({ x: recall, y: precision, threshold: th });
  }

  // Ensure ROC endpoints (0,0) and (1,1)
  const sortedRoc = [...rocPoints].sort((a, b) => a.x - b.x || a.y - b.y);
  let rocAuc = 0;
  for (let i = 1; i < sortedRoc.length; i++) {
    const dx = sortedRoc[i].x - sortedRoc[i - 1].x;
    const avgY = (sortedRoc[i].y + sortedRoc[i - 1].y) / 2;
    if (dx > 0) {
      rocAuc += dx * avgY;
    }
  }

  // PR AUC
  const sortedPr = [...prPoints].sort((a, b) => a.x - b.x);
  let prAuc = 0;
  for (let i = 1; i < sortedPr.length; i++) {
    const dx = sortedPr[i].x - sortedPr[i - 1].x;
    const avgY = (sortedPr[i].y + sortedPr[i - 1].y) / 2;
    if (dx > 0) {
      prAuc += dx * avgY;
    }
  }

  // Bound within [0, 1]
  rocAuc = Math.min(1, Math.max(0, rocAuc));
  prAuc = Math.min(1, Math.max(0, prAuc));

  // If edge case where totalPositive == 0 or totalNegative == 0
  if (totalPositive === 0 || totalNegative === 0) {
    rocAuc = 0.5;
  }

  return {
    rocCurve: sortedRoc,
    rocAuc,
    prCurve: sortedPr,
    prAuc,
  };
}
