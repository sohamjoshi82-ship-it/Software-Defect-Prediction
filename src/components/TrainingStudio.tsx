import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  Layers,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  Play,
  RotateCcw,
  Info,
} from 'lucide-react';
import type {
  DatasetMeta,
  MLModelType,
  ModelHyperparameters,
  ModelTrainingResult,
  TrainedModelInstance,
} from '../ml/types.ts';
import { MLModelManager } from '../ml/modelManager.ts';
import { AnimatedTrainingMatrix } from './AnimatedTrainingMatrix.tsx';
import { cyberSound } from '../utils/cyberSound.ts';

interface TrainingStudioProps {
  dataset: DatasetMeta;
  activeModel: TrainedModelInstance | null;
  modelManager: MLModelManager;
  onModelTrained: (model: TrainedModelInstance) => void;
  isTraining: boolean;
  setIsTraining: (val: boolean) => void;
  isBeginnerMode?: boolean;
}

const ALGORITHMS: {
  id: MLModelType;
  name: string;
  badge: string;
  description: string;
  strengths: string;
}[] = [
  {
    id: 'random_forest',
    name: 'Random Forest Ensemble',
    badge: 'Recommended',
    description: 'Ensemble of decorrelated decision trees using bagging and random feature subspaces.',
    strengths: 'Highest AUC-ROC in SDP literature; robust to metric collinearity.',
  },
  {
    id: 'decision_tree',
    name: 'CART Decision Tree',
    badge: 'Transparent Rules',
    description: 'Recursive partitioning using Gini impurity with configurable tree depth.',
    strengths: 'Completely interpretable decision rules for QA engineering teams.',
  },
  {
    id: 'logistic_regression',
    name: 'Logistic Regression (L2)',
    badge: 'Interpretable Odds',
    description: 'Linear probabilistic model fitted with gradient descent and L2 penalty.',
    strengths: 'Direct odds ratios for code metrics like cyclomatic complexity and LOC.',
  },
  {
    id: 'naive_bayes',
    name: 'Gaussian Naive Bayes',
    badge: 'NASA Baseline',
    description: 'Probabilistic classifier applying Bayes theorem under feature independence.',
    strengths: 'Classic empirical benchmark model used in original NASA MDP studies.',
  },
  {
    id: 'adaboost',
    name: 'AdaBoost M1',
    badge: 'Boosting',
    description: 'Sequential ensemble focusing adaptive sample weights on hard-to-classify defect modules.',
    strengths: 'High sensitivity to subtle code metric defect signatures.',
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    badge: 'Instance-Based',
    description: 'Classifies code modules based on Euclidean distance to k-nearest metric neighbors.',
    strengths: 'Identifies software modules sharing historical metric profiles.',
  },
];

export const TrainingStudio: React.FC<TrainingStudioProps> = ({
  dataset,
  activeModel,
  modelManager,
  onModelTrained,
  isTraining,
  setIsTraining,
  isBeginnerMode = true,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<MLModelType>(
    activeModel ? activeModel.type : 'random_forest'
  );
  const [showAdvanced, setShowAdvanced] = useState<boolean>(!isBeginnerMode);

  const handleAutoTrainBest = () => {
    setSelectedAlgo('random_forest');
    setUseSmote(true);
    setTestSplit(25);
    setIsTraining(true);
    cyberSound.playLaserScan();
    setTimeout(() => {
      try {
        const trained = modelManager.trainModel({
          dataset,
          modelType: 'random_forest',
          testSplitRatio: 0.25,
          useSmote: true,
          threshold: 0.5,
          hyperparameters: {
            maxDepth: 6,
            nEstimators: 20,
            learningRate: 0.05,
            kNeighbors: 5,
          },
        });
        onModelTrained(trained);
        cyberSound.playCleanChime();
      } finally {
        setIsTraining(false);
      }
    }, 450);
  };
  const [testSplit, setTestSplit] = useState<number>(25); // 25% test
  const [useSmote, setUseSmote] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(0.5);

  // Hyperparameters
  const [maxDepth, setMaxDepth] = useState<number>(6);
  const [nEstimators, setEstimators] = useState<number>(18);
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [kNeighbors, setKNeighbors] = useState<number>(5);

  // Cross-Validation Results state
  const [cvResults, setCvResults] = useState<{
    foldScores: { fold: number; rocAuc: number; recall: number; f1Score: number }[];
    meanRocAuc: number;
    meanRecall: number;
    meanF1: number;
  } | null>(null);
  const [isCrossValidating, setIsCrossValidating] = useState<boolean>(false);

  // Multi-model Benchmark status
  const [benchmarkStatus, setBenchmarkStatus] = useState<string | null>(null);

  const handleTrain = () => {
    setIsTraining(true);
    cyberSound.playLaserScan();
    setTimeout(() => {
      try {
        const trained = modelManager.trainModel({
          dataset,
          modelType: selectedAlgo,
          testSplitRatio: testSplit / 100,
          useSmote,
          threshold,
          hyperparameters: {
            maxDepth,
            nEstimators,
            learningRate,
            kNeighbors,
          },
        });
        onModelTrained(trained);
        cyberSound.playCleanChime();
      } finally {
        setIsTraining(false);
      }
    }, 450);
  };

  const handleRunAllBenchmark = async () => {
    setIsTraining(true);
    setBenchmarkStatus('Benchmarking all models...');
    setTimeout(() => {
      try {
        const allTypes: MLModelType[] = [
          'random_forest',
          'decision_tree',
          'logistic_regression',
          'naive_bayes',
          'adaboost',
          'knn',
        ];
        let lastTrained: TrainedModelInstance | null = null;
        for (const type of allTypes) {
          lastTrained = modelManager.trainModel({
            dataset,
            modelType: type,
            testSplitRatio: testSplit / 100,
            useSmote,
            threshold,
            hyperparameters: {
              maxDepth,
              nEstimators,
              learningRate,
              kNeighbors,
            },
          });
        }
        if (lastTrained) {
          onModelTrained(lastTrained);
        }
        setBenchmarkStatus('Benchmark complete! See Leaderboard below.');
      } finally {
        setIsTraining(false);
      }
    }, 100);
  };

  const handleRunCrossValidation = () => {
    setIsCrossValidating(true);
    setTimeout(() => {
      try {
        const result = modelManager.crossValidate(dataset, selectedAlgo, 5, useSmote);
        setCvResults(result);
      } finally {
        setIsCrossValidating(false);
      }
    }, 60);
  };

  // Collect all trained results in history for the current dataset
  const currentDatasetHistory: ModelTrainingResult[] = [];
  modelManager.modelHistory.forEach((res, key) => {
    if (key.startsWith(dataset.id)) {
      currentDatasetHistory.push(res);
    }
  });

  // Sort leaderboard by ROC-AUC
  const leaderboard = [...currentDatasetHistory].sort(
    (a, b) => b.testMetrics.rocAuc - a.testMetrics.rocAuc
  );

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <span>{isBeginnerMode ? 'Train & Compare AI Models' : 'Model Training & Algorithm Comparison Studio'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBeginnerMode
              ? 'Choose an AI algorithm to learn bug patterns from the active software project.'
              : 'Train, tune hyperparameters, test SMOTE resampling, and benchmark 6 machine learning classifiers.'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRunAllBenchmark}
            disabled={isTraining}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-md transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isBeginnerMode ? 'Compare All 6 Models' : 'Run Multi-Model Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Beginner Friendly Quick Action Banner */}
      {isBeginnerMode && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-800/60 shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Beginner Recommendation: Start with Random Forest</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You don't need to be a data scientist. <strong>Random Forest</strong> combines dozens of mini-decision trees to accurately catch subtle bug patterns. We'll automatically balance rare bugs using SMOTE.
              </p>
            </div>
            <button
              onClick={handleAutoTrainBest}
              disabled={isTraining}
              className="shrink-0 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-slate-950" />
              <span>{isTraining ? 'Training...' : '1-Click Auto-Train (Recommended)'}</span>
            </button>
          </div>
        </div>
      )}

      {benchmarkStatus && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-700/60 rounded-xl text-xs text-indigo-200 flex items-center justify-between">
          <span>{benchmarkStatus}</span>
          <button
            onClick={() => setBenchmarkStatus(null)}
            className="text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Algorithm Selection Grid */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Select Classification Algorithm
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALGORITHMS.map((algo) => {
            const isSelected = selectedAlgo === algo.id;
            return (
              <motion.div
                key={algo.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAlgo(algo.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-800/95 border-cyan-400 shadow-xl shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
                    {algo.name}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      algo.id === 'random_forest'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {algo.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{algo.description}</p>
                <div className="mt-2 text-[11px] text-cyan-400/90 font-mono">
                  {algo.strengths}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hyperparameter & Training Configuration Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dataset Partition & Resampling */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span>Partitioning & Imbalance</span>
          </h3>

          {/* Train/Test Split Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Test Split Ratio:</span>
              <span className="text-cyan-400 font-mono font-semibold">
                {testSplit}% Test / {100 - testSplit}% Train
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="5"
              value={testSplit}
              onChange={(e) => setTestSplit(Number(e.target.value))}
              aria-label="Test Split Ratio"
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Stratified split preserves exact defective/clean proportions in both sets.
            </p>
          </div>

          {/* SMOTE Resampling Toggle */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-200">
                  SMOTE Oversampling
                </div>
                <div className="text-[11px] text-slate-400">
                  Synthetic Minority Over-sampling
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSmote}
                  onChange={(e) => setUseSmote(e.target.checked)}
                  aria-label="Toggle SMOTE Oversampling"
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
              </label>
            </div>
            <div className="p-2.5 rounded bg-slate-800/60 text-[11px] text-slate-300 leading-relaxed">
              Software defect datasets are inherently imbalanced (typically 10-20% bugs). SMOTE generates synthetic minority instances in training data to boost recall and eliminate bias.
            </div>
          </div>

          {/* Decision Threshold */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Decision Threshold:</span>
              <span className="text-amber-400 font-mono font-semibold">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              aria-label="Decision Threshold"
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>High Sensitivity (Recall)</span>
              <span>High Precision</span>
            </div>
          </div>
        </div>

        {/* Algorithm Hyperparameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" />
            <span>Algorithm Hyperparameters</span>
          </h3>

          {(selectedAlgo === 'random_forest' || selectedAlgo === 'decision_tree') && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Max Tree Depth:</span>
                <span className="text-indigo-400 font-mono font-semibold">{maxDepth}</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                aria-label="Max Tree Depth"
                className="w-full accent-indigo-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Prevents overfitting on complex code metrics.
              </p>
            </div>
          )}

          {(selectedAlgo === 'random_forest' || selectedAlgo === 'adaboost') && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Number of Estimators:</span>
                <span className="text-indigo-400 font-mono font-semibold">{nEstimators}</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="5"
                value={nEstimators}
                onChange={(e) => setEstimators(Number(e.target.value))}
                aria-label="Number of Estimators"
                className="w-full accent-indigo-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Number of trees or weak learners in the ensemble.
              </p>
            </div>
          )}

          {selectedAlgo === 'logistic_regression' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Learning Rate:</span>
                <span className="text-indigo-400 font-mono font-semibold">{learningRate}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                aria-label="Learning Rate"
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>
          )}

          {selectedAlgo === 'knn' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">K Neighbors:</span>
                <span className="text-indigo-400 font-mono font-semibold">{kNeighbors}</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="2"
                value={kNeighbors}
                onChange={(e) => setKNeighbors(Number(e.target.value))}
                aria-label="K Neighbors"
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>
          )}

          {selectedAlgo === 'naive_bayes' && (
            <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-slate-300">
              Gaussian Naive Bayes is non-parametric; it analytically fits class conditional means and variances for each feature without hyperparameter search.
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{isTraining ? 'Training Model...' : `Train ${selectedAlgo.replace('_', ' ').toUpperCase()}`}</span>
            </button>
          </div>
        </div>

        {/* 5-Fold Cross Validation Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>5-Fold Cross-Validation</span>
            </h3>
            <button
              onClick={handleRunCrossValidation}
              disabled={isCrossValidating}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
            >
              {isCrossValidating ? 'Evaluating...' : 'Run 5-Fold'}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            K-Fold ensures metrics are not artifacts of a single split by cycling 5 distinct test folds across the full dataset.
          </p>

          {cvResults ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-800">
                  <div className="text-slate-400 text-[10px]">Mean AUC</div>
                  <div className="font-bold text-cyan-300 text-sm">
                    {cvResults.meanRocAuc.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-800">
                  <div className="text-slate-400 text-[10px]">Mean Recall</div>
                  <div className="font-bold text-rose-300 text-sm">
                    {(cvResults.meanRecall * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-800">
                  <div className="text-slate-400 text-[10px]">Mean F1</div>
                  <div className="font-bold text-emerald-300 text-sm">
                    {cvResults.meanF1.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Fold List */}
              <div className="space-y-1.5 text-xs">
                {cvResults.foldScores.map((f) => (
                  <div
                    key={f.fold}
                    className="flex justify-between items-center py-1 px-2 rounded bg-slate-800/40 text-[11px]"
                  >
                    <span className="text-slate-300">Fold {f.fold}</span>
                    <span className="font-mono text-cyan-400">AUC: {f.rocAuc.toFixed(3)}</span>
                    <span className="font-mono text-rose-400">
                      Recall: {(f.recall * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-800/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              Click &quot;Run 5-Fold&quot; to test cross-validation on {dataset.name}.
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Animated Convergence Matrix HUD */}
      <AnimatedTrainingMatrix
        model={activeModel}
        isTraining={isTraining}
        algorithmName={selectedAlgo.replace('_', ' ').toUpperCase()}
      />

      {/* Model Benchmark Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <span>Model Performance Leaderboard ({dataset.name})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by Test Set Area Under the ROC Curve (AUC-ROC)
            </p>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Rank & Model</th>
                  <th className="py-2.5 px-3">ROC-AUC</th>
                  <th className="py-2.5 px-3">Recall (PD)</th>
                  <th className="py-2.5 px-3">Precision</th>
                  <th className="py-2.5 px-3">False Alarm (PF)</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                  <th className="py-2.5 px-3">Train Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.map((item, idx) => {
                  const isCurrentActive = activeModel?.type === item.modelType;
                  return (
                    <tr
                      key={item.modelType}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrentActive ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              idx === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : idx === 1
                                ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-white">{item.modelName}</span>
                          {isCurrentActive && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {item.testMetrics.rocAuc.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 font-mono text-rose-300">
                        {(item.testMetrics.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {(item.testMetrics.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300">
                        {(item.testMetrics.falseAlarmRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-300">
                        {item.testMetrics.f1Score.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {item.trainingTimeMs}ms
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isCurrentActive ? (
                          <button
                            onClick={() => {
                              setSelectedAlgo(item.modelType);
                              handleTrain();
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          >
                            Set Active
                          </button>
                        ) : (
                          <span className="text-[11px] text-cyan-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs">
            No models benchmarked yet. Click &quot;Train&quot; or &quot;Run Multi-Model Benchmark&quot; to populate.
          </div>
        )}
      </div>
    </div>
  );
};
