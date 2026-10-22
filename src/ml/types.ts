export interface CodeMetrics {
  loc: number; // Lines of Code
  sloc: number; // Source Lines of Code
  commentLoc: number; // Comment lines
  blankLoc: number; // Blank lines
  cyclomaticComplexity: number; // McCabe v(G)
  essentialComplexity: number; // ev(G)
  designComplexity: number; // iv(G)
  halsteadLength: number; // N
  halsteadVocabulary: number; // n
  halsteadVolume: number; // V
  halsteadDifficulty: number; // D
  halsteadEffort: number; // E
  halsteadBugs: number; // B (Halstead predicted bugs)
  halsteadTime: number; // T
  maxNestingDepth: number;
  branchCount: number;
  operatorCount: number;
  operandCount: number;
  uniqueOperators: number;
  uniqueOperands: number;
}

export interface SoftwareModuleRecord {
  id: string;
  name: string;
  metrics: { [key: string]: number };
  defective: 0 | 1; // 0 = Clean, 1 = Defective
  predictedProbability?: number;
  predictedClass?: 0 | 1;
}

export interface DatasetMeta {
  id: string;
  name: string;
  source: string;
  domain: string;
  language: string;
  description: string;
  totalModules: number;
  defectRate: number;
  featureNames: string[];
  records: SoftwareModuleRecord[];
}

export type MLModelType =
  | 'random_forest'
  | 'decision_tree'
  | 'logistic_regression'
  | 'naive_bayes'
  | 'adaboost'
  | 'knn';

export interface ModelHyperparameters {
  maxDepth?: number;
  nEstimators?: number;
  learningRate?: number;
  kNeighbors?: number;
  regularization?: number;
  balanceClassWeights?: boolean;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export interface CurvePoint {
  x: number;
  y: number;
  threshold?: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number; // Probability of Detection (PD)
  falseAlarmRate: number; // Probability of False Alarm (PF)
  specificity: number;
  f1Score: number;
  mcc: number; // Matthews Correlation Coefficient
  rocAuc: number;
  prAuc: number;
  confusionMatrix: ConfusionMatrix;
  rocCurve: CurvePoint[];
  prCurve: CurvePoint[];
  threshold: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number; // Normalized to 0..1
  correlation: number;
}

export interface ModelTrainingResult {
  modelType: MLModelType;
  modelName: string;
  trainingTimeMs: number;
  trainMetrics: EvaluationMetrics;
  testMetrics: EvaluationMetrics;
  featureImportances: FeatureImportance[];
  datasetId: string;
  hyperparameters: ModelHyperparameters;
}

export interface CostSimulationConfig {
  costOfMissedDefect: number; // High cost of bug slipping into production
  costOfInspection: number; // Developer time cost to inspect a flagged module
  costOfCleanPass: number; // Baseline verification
}

export interface CodeAnalysisHotspot {
  metric: string;
  value: number;
  safeThreshold: number;
  severity: 'low' | 'warning' | 'critical';
  recommendation: string;
}

export interface TrainedModelInstance {
  type: MLModelType;
  name: string;
  datasetId: string;
  featureNames: string[];
  scaler: any;
  model: any;
  result: ModelTrainingResult;
}

export interface LivePredictionResult {
  probability: number;
  isDefective: boolean;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  confidence: number;
  metrics: CodeMetrics;
  hotspots: CodeAnalysisHotspot[];
  modelUsed: string;
}
