import test from 'node:test';
import assert from 'node:assert/strict';
import { StandardScaler } from './scaler.ts';
import { calculateConfusionMatrix, computeMetricsFromScores } from './metrics.ts';
import { DecisionTreeClassifier } from './algorithms/tree.ts';
import { RandomForestClassifier } from './algorithms/randomForest.ts';
import { LogisticRegressionClassifier } from './algorithms/logisticRegression.ts';
import { GaussianNaiveBayesClassifier } from './algorithms/naiveBayes.ts';
import { applySMOTE } from './algorithms/smote.ts';
import { analyzeSourceCode } from './codeAnalyzer.ts';
import { BENCHMARK_DATASETS } from './datasets.ts';
import { MLModelManager } from './modelManager.ts';

test('StandardScaler scales data to zero mean and unit variance', () => {
  const data = [
    [10, 100],
    [20, 200],
    [30, 300],
  ];
  const scaler = new StandardScaler();
  const scaled = scaler.fitTransform(data);

  assert.equal(scaled.length, 3);
  assert.equal(scaled[0].length, 2);
  // Mean of column 0 should be 20, so [20, 200] maps to ~0
  assert.ok(Math.abs(scaled[1][0]) < 1e-6);
  assert.ok(Math.abs(scaled[1][1]) < 1e-6);
});

test('calculateConfusionMatrix counts TP, FP, FN, TN correctly', () => {
  const yTrue: (0 | 1)[] = [1, 1, 0, 0, 1];
  const yPred: (0 | 1)[] = [1, 0, 0, 1, 1];
  const cm = calculateConfusionMatrix(yTrue, yPred);

  assert.equal(cm.tp, 2); // items 0, 4
  assert.equal(cm.fn, 1); // item 1
  assert.equal(cm.tn, 1); // item 2
  assert.equal(cm.fp, 1); // item 3
});

test('computeMetricsFromScores outputs valid ROC and PR metrics', () => {
  const yTrue: (0 | 1)[] = [1, 1, 0, 0, 1, 0, 0, 1];
  const yProb = [0.9, 0.8, 0.2, 0.1, 0.85, 0.3, 0.4, 0.75];
  const metrics = computeMetricsFromScores(yTrue, yProb, 0.5);

  assert.ok(metrics.accuracy > 0.8);
  assert.ok(metrics.rocAuc >= 0.8);
  assert.ok(metrics.rocCurve.length > 0);
  assert.ok(metrics.prCurve.length > 0);
});

test('DecisionTreeClassifier fits and predicts on separable data', () => {
  const X = [
    [1, 2],
    [1, 3],
    [9, 8],
    [8, 9],
  ];
  const y: (0 | 1)[] = [0, 0, 1, 1];

  const tree = new DecisionTreeClassifier(4, 2);
  tree.fit(X, y);
  const preds = tree.predict(X);

  assert.deepEqual(preds, y);
});

test('RandomForestClassifier predicts probabilities between 0 and 1', () => {
  const X = [
    [1, 2],
    [2, 3],
    [8, 8],
    [9, 9],
  ];
  const y: (0 | 1)[] = [0, 0, 1, 1];

  const rf = new RandomForestClassifier(8, 3, 2);
  rf.fit(X, y);
  const probs = rf.predictProbabilities(X);

  assert.equal(probs.length, 4);
  probs.forEach((p) => {
    assert.ok(p >= 0 && p <= 1);
  });
  // High confidence on separable extremes
  assert.ok(probs[0] < probs[3]);
});

test('LogisticRegressionClassifier trains and separates classes', () => {
  const X = [
    [-2, -2],
    [-1, -1],
    [2, 2],
    [3, 3],
  ];
  const y: (0 | 1)[] = [0, 0, 1, 1];

  const lr = new LogisticRegressionClassifier(0.1, 200, 0.01);
  lr.fit(X, y);
  const probs = lr.predictProbabilities(X);

  assert.ok(probs[0] < 0.3);
  assert.ok(probs[3] > 0.7);
});

test('GaussianNaiveBayes calculates valid class probabilities', () => {
  const X = [
    [1, 1],
    [2, 1],
    [10, 10],
    [11, 10],
  ];
  const y: (0 | 1)[] = [0, 0, 1, 1];

  const nb = new GaussianNaiveBayesClassifier();
  nb.fit(X, y);
  const probs = nb.predictProbabilities(X);

  assert.ok(probs[0] < 0.2);
  assert.ok(probs[2] > 0.8);
});

test('SMOTE balances minority class without mutating original distribution unexpectedly', () => {
  const X = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 6],
    [7, 7],
    [8, 8],
    [20, 20], // only 1 minority sample
  ];
  const y: (0 | 1)[] = [0, 0, 0, 0, 0, 0, 0, 0, 1];

  const result = applySMOTE(X, y, 0.5, 2);
  assert.ok(result.X_resampled.length > X.length);
  assert.ok(result.y_resampled.filter((v) => v === 1).length > 1);
});

test('analyzeSourceCode calculates McCabe and Halstead metrics correctly', () => {
  const sampleCode = `
    function calculateDiscount(price, userType, isMember) {
      if (price <= 0) {
        return 0;
      }
      let discount = 0;
      if (userType === 'VIP') {
        discount = 0.2;
      } else if (userType === 'REGULAR' && isMember) {
        discount = 0.1;
      } else {
        discount = 0.05;
      }
      return price * (1 - discount);
    }
  `;

  const { metrics, hotspots } = analyzeSourceCode(sampleCode);

  assert.ok(metrics.loc > 10);
  assert.ok(metrics.sloc > 8);
  // Branches: if (price <= 0), if (VIP), else if (REGULAR), && (isMember) => v(G) >= 4
  assert.ok(metrics.cyclomaticComplexity >= 4);
  assert.ok(metrics.halsteadLength > 0);
  assert.ok(metrics.halsteadVolume > 0);
  assert.ok(Array.isArray(hotspots));
});

test('MLModelManager trains on benchmark dataset and predicts on code metrics', () => {
  const manager = new MLModelManager();
  const dataset = BENCHMARK_DATASETS[0]; // NASA JM1

  const trained = manager.trainModel({
    dataset,
    modelType: 'random_forest',
    testSplitRatio: 0.25,
    useSmote: true,
    threshold: 0.5,
  });

  assert.equal(trained.type, 'random_forest');
  assert.ok(trained.result.testMetrics.accuracy > 0.6);
  assert.ok(trained.result.featureImportances.length > 0);

  // Test code prediction
  const { metrics, hotspots } = analyzeSourceCode('function test() { return 1; }');
  const prediction = manager.predictFromCodeMetrics(metrics, hotspots);

  assert.ok(prediction.probability >= 0 && prediction.probability <= 1);
  assert.ok(['Low', 'Moderate', 'High', 'Critical'].includes(prediction.riskLevel));
});

test('computeBeginnerHealthScore grades clean vs complex code appropriately', async () => {
  const { computeBeginnerHealthScore } = await import('./beginnerFriendly.ts');

  // Clean code metrics
  const cleanMetrics = {
    loc: 15,
    sloc: 10,
    commentLoc: 3,
    blankLoc: 2,
    cyclomaticComplexity: 2,
    essentialComplexity: 1,
    designComplexity: 1,
    halsteadLength: 30,
    halsteadVocabulary: 15,
    halsteadVolume: 120,
    halsteadDifficulty: 2,
    halsteadEffort: 240,
    halsteadBugs: 0.04,
    halsteadTime: 13,
    maxNestingDepth: 1,
    branchCount: 1,
    operatorCount: 15,
    operandCount: 15,
    uniqueOperators: 8,
    uniqueOperands: 7,
  };

  const cleanScore = computeBeginnerHealthScore(0.08, cleanMetrics);
  assert.ok(['A+', 'A'].includes(cleanScore.grade));
  assert.ok(cleanScore.readabilityScore >= 80);
  assert.equal(cleanScore.riskLevelText, 'Safe & Clean');

  // Buggy complex code metrics
  const buggyMetrics = {
    ...cleanMetrics,
    sloc: 80,
    cyclomaticComplexity: 18,
    essentialComplexity: 12,
    maxNestingDepth: 6,
  };

  const buggyScore = computeBeginnerHealthScore(0.78, buggyMetrics);
  assert.ok(['C', 'D', 'F'].includes(buggyScore.grade));
  assert.ok(buggyScore.simpleHotspots.length >= 2);
  assert.equal(buggyScore.riskLevelText, 'Critical Danger');
});

