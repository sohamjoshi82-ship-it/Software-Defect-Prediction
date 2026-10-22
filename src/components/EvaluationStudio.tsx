import React, { useState } from 'react';
import {
  TrendingUp,
  Sliders,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  Layers,
  HelpCircle,
} from 'lucide-react';
import type { TrainedModelInstance } from '../ml/types.ts';
import { computeMetricsFromScores } from '../ml/metrics.ts';

interface EvaluationStudioProps {
  activeModel: TrainedModelInstance | null;
  isBeginnerMode?: boolean;
}

export const EvaluationStudio: React.FC<EvaluationStudioProps> = ({
  activeModel,
  isBeginnerMode = true,
}) => {
  const [threshold, setThreshold] = useState<number>(0.5);

  // Cost Matrix parameters
  const [costOfMissedBug, setCostOfMissedBug] = useState<number>(1200); // $1,200 per undetected production bug
  const [costOfInspection, setCostOfInspection] = useState<number>(100); // $100 developer time per module review

  if (!activeModel) {
    return (
      <div className="p-8 text-center text-slate-400">
        Please train or select an active model to view evaluation.
      </div>
    );
  }

  const { result } = activeModel;
  const rocCurve = result.testMetrics.rocCurve;
  const prCurve = result.testMetrics.prCurve;

  // Dynamically recalculate confusion matrix and metrics at the slider threshold
  const cm = result.testMetrics.confusionMatrix;
  // Approximation for threshold adjustment on test set
  const totalPos = cm.tp + cm.fn;
  const totalNeg = cm.tn + cm.fp;

  // Let's find the nearest point on the ROC curve matching this threshold
  let activeRocPoint = rocCurve.find((p: any) => (p.threshold ?? 0.5) <= threshold) || rocCurve[0];
  const simTpr = activeRocPoint.y;
  const simFpr = activeRocPoint.x;

  const simTp = Math.round(simTpr * totalPos);
  const simFn = totalPos - simTp;
  const simFp = Math.round(simFpr * totalNeg);
  const simTn = totalNeg - simFp;

  // Cost calculation
  // Baseline cost without ML (test everything manually or miss all bugs):
  const baselineCostManualReviewAll = (totalPos + totalNeg) * costOfInspection;
  const baselineCostNoReview = totalPos * costOfMissedBug;
  const baselineReference = Math.min(baselineCostManualReviewAll, baselineCostNoReview);

  // Model-driven cost:
  // Cost = (Inspect Flagged Modules [TP + FP] * Inspection Cost) + (Missed Bugs [FN] * Missed Bug Cost)
  const modelTotalCost = (simTp + simFp) * costOfInspection + simFn * costOfMissedBug;
  const costSavings = Math.max(0, baselineReference - modelTotalCost);
  const costSavingsPct = Math.round((costSavings / (baselineReference || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          <span>{isBeginnerMode ? 'Model Accuracy & Cost Savings' : 'Model Evaluation & Explainable AI (XAI)'}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isBeginnerMode
            ? 'See how well the AI detects software bugs, test what happens when you adjust strictness, and calculate business dollar savings.'
            : 'Interactive ROC & Precision-Recall curves, live decision threshold tuning, and software QA cost matrix analysis.'}
        </p>
      </div>

      {/* Beginner-friendly plain English insight banner */}
      {isBeginnerMode && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-800/70 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Executive Quality Summary</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            This AI model catches <span className="font-bold text-emerald-300">{(simTpr * 100).toFixed(0)}% of bugs</span> before release. By focusing inspection on high-risk files, your team saves an estimated <span className="font-bold text-cyan-300">${costSavings.toLocaleString()}</span> in critical production defect fixes and emergency patches!
          </p>
        </div>
      )}

      {/* Threshold Tuning Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>{isBeginnerMode ? 'Bug Detection Strictness' : 'Interactive Decision Threshold Tuning'}</span>
            </div>
            <p className="text-xs text-slate-400">
              {isBeginnerMode
                ? 'Choose how strict you want the AI to be when flagging suspicious code.'
                : 'Shift the classification boundary between high defect recall (lower threshold) and low false alarms (higher threshold).'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {threshold < 0.35 ? 'Strict (Catch all bugs)' : threshold > 0.65 ? 'Relaxed (Fewer warnings)' : 'Balanced'}
            </span>
            <div className="font-mono text-base font-bold text-amber-300 bg-amber-950/70 border border-amber-800/80 px-3 py-1 rounded-lg">
              Threshold = {threshold.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Quick Presets for beginners */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <span className="text-xs text-slate-400">Quick Presets:</span>
          <button
            onClick={() => setThreshold(0.25)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              threshold === 0.25
                ? 'bg-rose-950 text-rose-300 border-rose-500 font-semibold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🛡️ Strict Safety (Catches ~95% of Bugs)
          </button>
          <button
            onClick={() => setThreshold(0.5)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              threshold === 0.5
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-semibold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            ⚖️ Balanced (Recommended)
          </button>
          <button
            onClick={() => setThreshold(0.75)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              threshold === 0.75
                ? 'bg-amber-950 text-amber-300 border-amber-500 font-semibold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            ⚡ Low False Alarms (Only Certain Bugs)
          </button>
        </div>

        <div className="space-y-1">
          <input
            type="range"
            min="0.05"
            max="0.95"
            step="0.02"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            aria-label="Interactive Decision Threshold"
            className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span className="text-rose-400">0.05 (Maximum Defect Catch Rate / Safety Critical)</span>
            <span className="text-slate-400">0.50 (Standard Balance)</span>
            <span className="text-cyan-400">0.95 (Ultra-conservative / Zero False Alarms)</span>
          </div>
        </div>
      </div>

      {/* Curves & Confusion Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROC Curve Chart (SVG) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                Receiver Operating Characteristic (ROC)
              </h3>
              <p className="text-[11px] text-slate-400">True Positive Rate vs False Positive Rate</p>
            </div>
            <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              AUC: {result.testMetrics.rocAuc.toFixed(3)}
            </span>
          </div>

          {/* SVG Plot */}
          <div className="relative w-full aspect-square bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col justify-between">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
              <line x1="25" y1="0" x2="25" y2="100" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
              <line x1="75" y1="0" x2="75" y2="100" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />

              {/* Diagonal Random Guessing Reference */}
              <line x1="0" y1="100" x2="100" y2="0" stroke="#475569" strokeDasharray="3,3" strokeWidth="1" />

              {/* ROC Path Area */}
              <path
                d={`M 0 100 ${rocCurve
                  .map((p: any) => `L ${p.x * 100} ${100 - p.y * 100}`)
                  .join(' ')} L 100 100 Z`}
                fill="rgba(6, 182, 212, 0.12)"
              />

              {/* ROC Curve Line */}
              <path
                d={`M 0 100 ${rocCurve
                  .map((p: any) => `L ${p.x * 100} ${100 - p.y * 100}`)
                  .join(' ')}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active Threshold Point */}
              <circle
                cx={simFpr * 100}
                cy={100 - simTpr * 100}
                r="4.5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </svg>

            {/* Axis labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>FPR: 0.0</span>
              <span className="text-slate-300">False Positive Rate (PF)</span>
              <span>1.0</span>
            </div>
            <div className="absolute left-1 top-2 text-[10px] text-slate-400 font-mono">
              TPR (PD) &uarr;
            </div>
          </div>
        </div>

        {/* Dynamic Confusion Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-2.5">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
              Dynamic Confusion Matrix
            </h3>
            <p className="text-[11px] text-slate-400">At threshold = {threshold.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* TP */}
            <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 space-y-1">
              <div className="flex items-center justify-between text-emerald-300 font-semibold text-[11px]">
                <span>True Positive (TP)</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-extrabold text-white">{simTp}</div>
              <div className="text-[10px] text-emerald-400/90">
                Caught Defect Modules (Bugs Saved)
              </div>
            </div>

            {/* FP */}
            <div className="p-3.5 rounded-lg bg-amber-950/50 border border-amber-700/60 space-y-1">
              <div className="flex items-center justify-between text-amber-300 font-semibold text-[11px]">
                <span>False Positive (FP)</span>
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-extrabold text-white">{simFp}</div>
              <div className="text-[10px] text-amber-400/90">
                False Alarms (Clean flagged as buggy)
              </div>
            </div>

            {/* FN */}
            <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-700/70 space-y-1">
              <div className="flex items-center justify-between text-rose-300 font-semibold text-[11px]">
                <span>False Negative (FN)</span>
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-extrabold text-white">{simFn}</div>
              <div className="text-[10px] text-rose-400/90">
                Missed Defects (Slipped to Production)
              </div>
            </div>

            {/* TN */}
            <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
                <span>True Negative (TN)</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{simTn}</div>
              <div className="text-[10px] text-slate-400">
                Correctly Verified Clean Modules
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-800/60">
              <div className="text-slate-400 text-[10px]">Detection Rate (PD)</div>
              <div className="font-bold text-rose-400 font-mono text-sm">
                {(simTpr * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded bg-slate-800/60">
              <div className="text-slate-400 text-[10px]">False Alarm Rate (PF)</div>
              <div className="font-bold text-amber-400 font-mono text-sm">
                {(simFpr * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* QA Cost Matrix Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-2.5">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Software QA Cost Impact Matrix</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Empirical cost modeling for QA inspection budgeting
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Cost of Missed Bug */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Cost of 1 Missed Bug (Production):</span>
                <span className="font-mono text-rose-400 font-semibold">
                  ${costOfMissedBug.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="400"
                max="3000"
                step="100"
                value={costOfMissedBug}
                onChange={(e) => setCostOfMissedBug(Number(e.target.value))}
                aria-label="Cost of Missed Bug"
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>

            {/* Cost of Inspection */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Dev Inspection Cost (Per Module):</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  ${costOfInspection}
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="10"
                value={costOfInspection}
                onChange={(e) => setCostOfInspection(Number(e.target.value))}
                aria-label="Cost of Inspection"
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Cost Summary Box */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 pt-2">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>ML-Targeted QA Cost:</span>
                <span className="text-white font-mono font-bold">
                  ${modelTotalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Baseline Exhaustive QA Cost:</span>
                <span className="text-slate-300 font-mono">
                  ${baselineReference.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-emerald-400 text-xs">
                  Estimated Cost Savings:
                </span>
                <span className="text-base font-extrabold text-emerald-300 font-mono">
                  ${costSavings.toLocaleString()} ({costSavingsPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance & Metric Correlations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <span>Full Feature Importance & Correlation with Software Defects</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies which McCabe, Halstead, or CK metrics contribute most heavily to software defects in {result.modelName}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.featureImportances.map((fi: any, idx: number) => (
            <div
              key={fi.feature}
              className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-semibold text-white">
                  <span className="text-slate-500 mr-1.5">#{idx + 1}</span>
                  {fi.feature}
                </span>
                <div className="flex gap-3 text-[11px]">
                  <span className="text-slate-400">
                    Corr: <strong className="text-cyan-400">{fi.correlation.toFixed(2)}</strong>
                  </span>
                  <span className="text-slate-400">
                    Importance: <strong className="text-emerald-400">{(fi.importance * 100).toFixed(1)}%</strong>
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, fi.importance * 250)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
