import { AdaBoostClassifier } from './algorithms/adaboost.ts';
import { KNNClassifier } from './algorithms/knn.ts';
import { LogisticRegressionClassifier } from './algorithms/logisticRegression.ts';
import { GaussianNaiveBayesClassifier } from './algorithms/naiveBayes.ts';
import { RandomForestClassifier } from './algorithms/randomForest.ts';
import { applySMOTE } from './algorithms/smote.ts';
import { DecisionTreeClassifier } from './algorithms/tree.ts';
import { computeMetricsFromScores } from './metrics.ts';
import { StandardScaler } from './scaler.ts';
import type {
  CodeAnalysisHotspot,
  CodeMetrics,
  DatasetMeta,
  FeatureImportance,
  LivePredictionResult,
  MLModelType,
  ModelHyperparameters,
  ModelTrainingResult,
  TrainedModelInstance,
} from './types.ts';

export interface TrainConfig {
  dataset: DatasetMeta;
  modelType: MLModelType;
  testSplitRatio: number; // e.g. 0.25 (25% test, 75% train)
  useSmote: boolean;
  threshold: number;
  hyperparameters?: ModelHyperparameters;
}

export class MLModelManager {
  activeModel: TrainedModelInstance | null = null;
  modelHistory: Map<string, ModelTrainingResult> = new Map();

  getModelDisplayName(type: MLModelType): string {
    switch (type) {
      case 'random_forest':
        return 'Random Forest Ensemble';
      case 'decision_tree':
        return 'CART Decision Tree';
      case 'logistic_regression':
        return 'Logistic Regression (L2)';
      case 'naive_bayes':
        return 'Gaussian Naive Bayes';
      case 'adaboost':
        return 'AdaBoost M1 (Adaptive Boosting)';
      case 'knn':
        return 'K-Nearest Neighbors (k-NN)';
    }
  }

  trainModel(config: TrainConfig): TrainedModelInstance {
    const startTime = performance.now();
    const { dataset, modelType, testSplitRatio, useSmote, threshold, hyperparameters } =
      config;

    const featureNames = dataset.featureNames;
    const records = dataset.records;

    // Extract X and y
    const rawX: number[][] = records.map((r) =>
      featureNames.map((feat) => r.metrics[feat] ?? 0)
    );
    const rawY: (0 | 1)[] = records.map((r) => r.defective);

    // Stratified Train/Test split
    const { trainIndices, testIndices } = this.stratifiedSplit(rawY, testSplitRatio);

    const trainX_raw = trainIndices.map((i) => rawX[i]);
    const trainY_raw = trainIndices.map((i) => rawY[i]);
    const testX_raw = testIndices.map((i) => rawX[i]);
    const testY_raw = testIndices.map((i) => rawY[i]);

    // Handle SMOTE on training set only (prevent data leakage!)
    let trainX = trainX_raw;
    let trainY = trainY_raw;
    if (useSmote) {
      const smoteResult = applySMOTE(trainX_raw, trainY_raw, 0.7, 5);
      trainX = smoteResult.X_resampled;
      trainY = smoteResult.y_resampled;
    }

    // Fit StandardScaler on trainX
    const scaler = new StandardScaler();
    const trainX_scaled = scaler.fitTransform(trainX);
    const testX_scaled = scaler.transform(testX_raw);

    // Initialize algorithm
    let modelInstance: any;
    let rawImportances: number[] = new Array(featureNames.length).fill(0);

    const maxDepth = hyperparameters?.maxDepth ?? 6;
    const nEstimators = hyperparameters?.nEstimators ?? 18;
    const learningRate = hyperparameters?.learningRate ?? 0.05;
    const kNeighbors = hyperparameters?.kNeighbors ?? 5;

    switch (modelType) {
      case 'random_forest': {
        const rf = new RandomForestClassifier(nEstimators, maxDepth, 4);
        rf.fit(trainX_scaled, trainY);
        modelInstance = rf;
        rawImportances = rf.featureImportances;
        break;
      }
      case 'decision_tree': {
        const dt = new DecisionTreeClassifier(maxDepth, 4);
        dt.fit(trainX_scaled, trainY);
        modelInstance = dt;
        rawImportances = dt.featureImportances;
        break;
      }
      case 'logistic_regression': {
        const lr = new LogisticRegressionClassifier(learningRate, 300, 0.01);
        lr.fit(trainX_scaled, trainY);
        modelInstance = lr;
        rawImportances = lr.getFeatureWeights();
        break;
      }
      case 'naive_bayes': {
        const nb = new GaussianNaiveBayesClassifier();
        nb.fit(trainX_scaled, trainY);
        modelInstance = nb;
        // Proxy importance from absolute mean differences between classes
        rawImportances = featureNames.map((_, j) => {
          const diff = Math.abs((nb.mean1[j] ?? 0) - (nb.mean0[j] ?? 0));
          return diff;
        });
        break;
      }
      case 'adaboost': {
        const ada = new AdaBoostClassifier(nEstimators);
        ada.fit(trainX_scaled, trainY);
        modelInstance = ada;
        rawImportances = ada.featureImportances;
        break;
      }
      case 'knn': {
        const knn = new KNNClassifier(kNeighbors);
        knn.fit(trainX_scaled, trainY);
        modelInstance = knn;
        rawImportances = this.calculateCorrelationWithDefects(trainX_scaled, trainY);
        break;
      }
    }

    // Predictions
    const trainProb = modelInstance.predictProbabilities(trainX_scaled);
    const testProb = modelInstance.predictProbabilities(testX_scaled);

    const trainMetrics = computeMetricsFromScores(trainY, trainProb, threshold);
    const testMetrics = computeMetricsFromScores(testY_raw, testProb, threshold);

    // Feature Importances normalized
    const correlations = this.calculateCorrelationWithDefects(rawX, rawY);
    const totalImp = rawImportances.reduce((a, b) => a + Math.abs(b), 0) || 1;
    const featureImportances: FeatureImportance[] = featureNames
      .map((name, idx) => ({
        feature: name,
        importance: Number((Math.abs(rawImportances[idx] || 0) / totalImp).toFixed(4)),
        correlation: Number((correlations[idx] || 0).toFixed(4)),
      }))
      .sort((a, b) => b.importance - a.importance);

    const trainingTimeMs = Math.round(performance.now() - startTime);

    const result: ModelTrainingResult = {
      modelType,
      modelName: this.getModelDisplayName(modelType),
      trainingTimeMs,
      trainMetrics,
      testMetrics,
      featureImportances,
      datasetId: dataset.id,
      hyperparameters: {
        maxDepth,
        nEstimators,
        learningRate,
        kNeighbors,
      },
    };

    const trained: TrainedModelInstance = {
      type: modelType,
      name: result.modelName,
      datasetId: dataset.id,
      featureNames,
      scaler,
      model: modelInstance,
      result,
    };

    this.activeModel = trained;
    this.modelHistory.set(`${dataset.id}_${modelType}`, result);

    return trained;
  }

  // Cross-Validation (K-Fold)
  crossValidate(
    dataset: DatasetMeta,
    modelType: MLModelType,
    kFolds = 5,
    useSmote = true
  ): {
    foldScores: { fold: number; rocAuc: number; recall: number; f1Score: number }[];
    meanRocAuc: number;
    meanRecall: number;
    meanF1: number;
  } {
    const featureNames = dataset.featureNames;
    const records = dataset.records;
    const rawX = records.map((r) => featureNames.map((f) => r.metrics[f] ?? 0));
    const rawY = records.map((r) => r.defective);

    const foldSize = Math.floor(records.length / kFolds);
    const foldScores: { fold: number; rocAuc: number; recall: number; f1Score: number }[] = [];

    for (let fold = 0; fold < kFolds; fold++) {
      const testStart = fold * foldSize;
      const testEnd = fold === kFolds - 1 ? records.length : (fold + 1) * foldSize;

      const trainIndices: number[] = [];
      const testIndices: number[] = [];

      for (let i = 0; i < records.length; i++) {
        if (i >= testStart && i < testEnd) {
          testIndices.push(i);
        } else {
          trainIndices.push(i);
        }
      }

      let trainX = trainIndices.map((i) => rawX[i]);
      let trainY = trainIndices.map((i) => rawY[i]);
      const testX = testIndices.map((i) => rawX[i]);
      const testY = testIndices.map((i) => rawY[i]);

      if (useSmote) {
        const smote = applySMOTE(trainX, trainY, 0.7, 5);
        trainX = smote.X_resampled;
        trainY = smote.y_resampled;
      }

      const scaler = new StandardScaler();
      const trainXScaled = scaler.fitTransform(trainX);
      const testXScaled = scaler.transform(testX);

      let model: any;
      if (modelType === 'random_forest') {
        model = new RandomForestClassifier(12, 5, 4);
      } else if (modelType === 'decision_tree') {
        model = new DecisionTreeClassifier(5, 4);
      } else if (modelType === 'logistic_regression') {
        model = new LogisticRegressionClassifier(0.05, 200, 0.01);
      } else if (modelType === 'naive_bayes') {
        model = new GaussianNaiveBayesClassifier();
      } else if (modelType === 'adaboost') {
        model = new AdaBoostClassifier(15);
      } else {
        model = new KNNClassifier(5);
      }

      model.fit(trainXScaled, trainY);
      const testProbs = model.predictProbabilities(testXScaled);
      const metrics = computeMetricsFromScores(testY, testProbs, 0.5);

      foldScores.push({
        fold: fold + 1,
        rocAuc: metrics.rocAuc,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
      });
    }

    const meanRocAuc =
      foldScores.reduce((a, b) => a + b.rocAuc, 0) / foldScores.length;
    const meanRecall =
      foldScores.reduce((a, b) => a + b.recall, 0) / foldScores.length;
    const meanF1 =
      foldScores.reduce((a, b) => a + b.f1Score, 0) / foldScores.length;

    return { foldScores, meanRocAuc, meanRecall, meanF1 };
  }

  // Predict on Live Code Metrics
  predictFromCodeMetrics(
    metrics: CodeMetrics,
    hotspots: CodeAnalysisHotspot[]
  ): LivePredictionResult {
    if (!this.activeModel) {
      // Fallback heuristic if no model is trained yet
      const baseRisk =
        (metrics.cyclomaticComplexity > 10 ? 0.35 : 0.05) +
        (metrics.halsteadBugs > 0.08 ? 0.3 : 0.05) +
        (metrics.maxNestingDepth > 4 ? 0.2 : 0.05);
      const prob = Math.min(0.96, Math.max(0.04, baseRisk));
      return {
        probability: Number(prob.toFixed(3)),
        isDefective: prob >= 0.5,
        riskLevel: this.getRiskCategory(prob),
        confidence: Number((Math.abs(prob - 0.5) * 2).toFixed(2)),
        metrics,
        hotspots,
        modelUsed: 'Heuristic Baseline',
      };
    }

    const { model, scaler, featureNames, result } = this.activeModel;

    // Map extracted code metrics to dataset features
    const featureVector: number[] = featureNames.map((name) => {
      switch (name) {
        case 'loc':
          return metrics.loc;
        case 'v_g':
        case 'wmc':
          return metrics.cyclomaticComplexity;
        case 'ev_g':
          return metrics.essentialComplexity;
        case 'iv_g':
        case 'rfc':
          return metrics.designComplexity;
        case 'n':
          return metrics.halsteadLength;
        case 'v':
          return metrics.halsteadVolume;
        case 'l':
          return metrics.halsteadLength > 0 ? 1 / (metrics.halsteadDifficulty + 1) : 0.1;
        case 'd':
          return metrics.halsteadDifficulty;
        case 'e':
          return metrics.halsteadEffort;
        case 'b':
          return metrics.halsteadBugs;
        case 't':
          return metrics.halsteadTime;
        case 'lOComment':
          return metrics.commentLoc;
        case 'lOBlank':
          return metrics.blankLoc;
        case 'uniq_Op':
          return metrics.uniqueOperators;
        case 'uniq_Opnd':
          return metrics.uniqueOperands;
        case 'branchCount':
          return metrics.branchCount;
        case 'cbo':
          return Math.round(metrics.designComplexity * 1.5);
        case 'lcom':
          return Math.round(metrics.cyclomaticComplexity * 3.5);
        case 'dit':
          return Math.min(6, metrics.maxNestingDepth);
        case 'noc':
          return 1;
        case 'ca':
          return 2;
        case 'ce':
          return metrics.designComplexity;
        case 'npm':
          return Math.max(1, Math.round(metrics.cyclomaticComplexity * 0.4));
        default:
          return 0;
      }
    });

    const scaledVector = scaler.transformVector(featureVector);
    const probArr = (model as any).predictProbabilities([scaledVector]);
    const probability = Number((probArr[0] ?? 0.5).toFixed(4));
    const isDefective = probability >= (result.testMetrics.threshold || 0.5);

    return {
      probability,
      isDefective,
      riskLevel: this.getRiskCategory(probability),
      confidence: Number((Math.abs(probability - 0.5) * 2).toFixed(2)),
      metrics,
      hotspots,
      modelUsed: result.modelName,
    };
  }

  private getRiskCategory(prob: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
    if (prob < 0.25) return 'Low';
    if (prob < 0.55) return 'Moderate';
    if (prob < 0.8) return 'High';
    return 'Critical';
  }

  private stratifiedSplit(
    y: (0 | 1)[],
    testRatio = 0.25
  ): { trainIndices: number[]; testIndices: number[] } {
    const idx0: number[] = [];
    const idx1: number[] = [];

    for (let i = 0; i < y.length; i++) {
      if (y[i] === 1) idx1.push(i);
      else idx0.push(i);
    }

    // Shuffle
    idx0.sort(() => Math.random() - 0.5);
    idx1.sort(() => Math.random() - 0.5);

    const testCount0 = Math.max(1, Math.round(idx0.length * testRatio));
    const testCount1 = Math.max(1, Math.round(idx1.length * testRatio));

    const testIndices = [...idx0.slice(0, testCount0), ...idx1.slice(0, testCount1)];
    const trainIndices = [...idx0.slice(testCount0), ...idx1.slice(testCount1)];

    return { trainIndices, testIndices };
  }

  private calculateCorrelationWithDefects(X: number[][], y: (0 | 1)[]): number[] {
    const numFeatures = X[0]?.length || 0;
    const n = X.length || 1;
    const meanY = y.reduce<number>((a, b) => a + b, 0) / n;
    const varY = y.reduce<number>((a, b) => a + (b - meanY) ** 2, 0);

    const correlations: number[] = [];

    for (let f = 0; f < numFeatures; f++) {
      const col = X.map((r) => r[f]);
      const meanX = col.reduce((a, b) => a + b, 0) / n;
      let cov = 0;
      let varX = 0;

      for (let i = 0; i < n; i++) {
        const dx = col[i] - meanX;
        const dy = y[i] - meanY;
        cov += dx * dy;
        varX += dx * dx;
      }

      const denom = Math.sqrt(varX * varY);
      correlations.push(denom > 0 ? cov / denom : 0);
    }

    return correlations;
  }
}
