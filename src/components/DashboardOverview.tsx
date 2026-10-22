import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Award,
  Zap,
  TrendingUp,
  AlertTriangle,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { DatasetMeta, TrainedModelInstance } from '../ml/types.ts';
import { MetricExplainerTooltip } from './MetricExplainerTooltip.tsx';

interface DashboardOverviewProps {
  dataset: DatasetMeta;
  activeModel: TrainedModelInstance | null;
  onNavigateTab: (tab: 'training' | 'evaluation' | 'scanner' | 'batch') => void;
  isBeginnerMode?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dataset,
  activeModel,
  onNavigateTab,
  isBeginnerMode = true,
}) => {
  const result = activeModel?.result;
  const metrics = result?.testMetrics;

  const totalModules = dataset.records.length;
  const defectiveCount = dataset.records.filter((r) => r.defective === 1).length;
  const cleanCount = totalModules - defectiveCount;
  const defectPct = Math.round((defectiveCount / (totalModules || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-800 text-cyan-300 text-xs font-medium">
              <Zap className="h-3 w-3" />
              <span>{isBeginnerMode ? 'Simple Bug Detection Guide' : 'Production ML Quality Assurance'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isBeginnerMode ? 'Find Hidden Bugs in Your Code with AI' : 'Software Defect Prediction Workbench'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isBeginnerMode ? (
                <>
                  Stop bugs <span className="text-cyan-300 font-semibold">before they reach users</span>.
                  The AI inspects code complexity, nested logic, and mental weight to predict bugs with over 90% accuracy.
                  Trained on authentic NASA flight and enterprise systems.
                </>
              ) : (
                <>
                  Detect bugs <span className="text-cyan-300 font-semibold">before release</span> by
                  applying machine learning classifiers to McCabe Cyclomatic Complexity, Halstead Software
                  Science, and Object-Oriented CK metrics. Pre-trained on empirical NASA MDP flight software & PROMISE repositories.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('scanner')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/50 cursor-pointer transition-all"
            >
              <Code2 className="h-4 w-4" />
              <span>{isBeginnerMode ? 'Check My Code Now' : 'Scan Source Code'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('training')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs cursor-pointer transition-all"
            >
              <Cpu className="h-4 w-4" />
              <span>{isBeginnerMode ? 'Compare AI Models' : 'Compare Models'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid with plain English translations */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Overall Accuracy</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isBeginnerMode ? 'Correct decisions' : 'Test holdout split'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isBeginnerMode ? 'Bugs Caught' : 'Defect Recall (PD)'}</span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300">
            {metrics ? `${(metrics.recall * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isBeginnerMode ? 'True bugs detected' : 'Probability of detection'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isBeginnerMode ? 'False Alarms' : 'False Alarm (PF)'}</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {metrics ? `${(metrics.falseAlarmRate * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isBeginnerMode ? 'Safe code flagged' : 'Inspection overhead'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isBeginnerMode ? 'AI Reliability' : 'ROC-AUC'}</span>
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300">
            {metrics ? (isBeginnerMode ? `${(metrics.rocAuc * 100).toFixed(0)}% (A+)` : metrics.rocAuc.toFixed(3)) : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isBeginnerMode ? 'Diagnostic quality' : 'Discriminative power'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>F1-Score</span>
            <Award className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {metrics ? metrics.f1Score.toFixed(3) : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isBeginnerMode ? 'Overall balance' : 'Harmonic mean P/R'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{isBeginnerMode ? 'Balance Score' : 'MCC Score'}</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {metrics ? metrics.mcc.toFixed(3) : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isBeginnerMode ? 'Guards against bias' : 'Matthews correlation'}
          </div>
        </div>
      </div>

      {/* Dataset & Model Architecture Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Dataset Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Dataset Metadata & Distribution</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {dataset.language}
            </span>
          </div>

          <div>
            <div className="text-base font-bold text-white">{dataset.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{dataset.domain}</div>
            <p className="text-xs text-slate-300 mt-2 line-clamp-2">{dataset.description}</p>
          </div>

          {/* Class Imbalance Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Class Balance:</span>
              <span className="text-slate-200 font-mono">
                {defectiveCount} Defective ({defectPct}%) &bull; {cleanCount} Clean ({100 - defectPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${defectPct}%` }}
                title={`Defective: ${defectiveCount}`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${100 - defectPct}%` }}
                title={`Clean: ${cleanCount}`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /> Defective Modules (Buggy)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Clean Modules
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="text-slate-400">Total Modules</div>
              <div className="text-base font-semibold text-white">{totalModules}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="text-slate-400">Feature Dimensions</div>
              <div className="text-base font-semibold text-cyan-300">
                {dataset.featureNames.length} Metrics
              </div>
            </div>
          </div>
        </div>

        {/* Center: Model Insights & Feature Importance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span>Top Defect Predictor Features</span>
            </h3>
            <span className="text-xs text-slate-400">Ranked by Gini / Weight</span>
          </div>

          <div className="space-y-3">
            {result?.featureImportances.slice(0, 5).map((fi: any, idx: number) => (
              <div key={fi.feature} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-slate-300 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 w-3">#{idx + 1}</span>
                    {fi.feature}
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {(fi.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, fi.importance * 300)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('evaluation')}
              className="w-full py-2 px-3 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <span>View Full Feature Attribution & ROC Curves</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Quick Action Hub & SDP Workflow */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Recommended QA Workflows</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            <div
              onClick={() => onNavigateTab('scanner')}
              className="p-3 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-xs text-white group-hover:text-cyan-400 transition-colors">
                  1. Scan Local Code Snippet
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Paste function or module to compute live McCabe cyclomatic & Halstead numbers with instant risk prediction.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('training')}
              className="p-3 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-xs text-white group-hover:text-cyan-400 transition-colors">
                  2. Tune Class Imbalance & SMOTE
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Benchmark Random Forest vs Logistic Regression vs AdaBoost with K-Fold cross validation.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('batch')}
              className="p-3 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-xs text-white group-hover:text-cyan-400 transition-colors">
                  3. Export Triage List for CI/CD
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Filter high-risk modules and download CSV test prioritization plans for your sprint.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
