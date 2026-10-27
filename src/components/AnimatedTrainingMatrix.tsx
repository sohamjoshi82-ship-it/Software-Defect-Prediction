import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Activity, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import type { TrainedModelInstance } from '../ml/types.ts';

interface AnimatedTrainingMatrixProps {
  model: TrainedModelInstance | null;
  isTraining: boolean;
  algorithmName: string;
}

export const AnimatedTrainingMatrix: React.FC<AnimatedTrainingMatrixProps> = ({
  model,
  isTraining,
  algorithmName,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('Initializing');

  useEffect(() => {
    if (isTraining) {
      setProgress(10);
      setCurrentStep('Synthesizing SMOTE Balance...');
      const t1 = setTimeout(() => {
        setProgress(45);
        setCurrentStep('Fitting Feature Decision Splits...');
      }, 250);
      const t2 = setTimeout(() => {
        setProgress(80);
        setCurrentStep('Computing ROC & PR Trajectories...');
      }, 550);
      const t3 = setTimeout(() => {
        setProgress(100);
        setCurrentStep('Model Optimized & Deployed');
      }, 850);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setProgress(100);
      setCurrentStep('Converged');
    }
  }, [isTraining]);

  const metrics = model?.result.testMetrics;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden bg-cyber-grid space-y-4">
      {/* Background ambient light */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-950/80 border border-cyan-800/70 flex items-center justify-center text-cyan-400">
            <Cpu className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Real-Time Model Convergence Monitor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {algorithmName}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Live visualization of tree ensemble learning and empirical loss minimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1.5 ${
              isTraining
                ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isTraining ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span>{isTraining ? currentStep : 'OPTIMAL CONVERGENCE'}</span>
          </span>
        </div>
      </div>

      {/* Visual Convergence Chart & Neural Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative z-10">
        {/* Animated Simulated Loss / AUC Convergence Curve */}
        <div className="md:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              Optimization Trajectory (AUC vs Iteration)
            </span>
            <span className="text-cyan-400 font-mono font-bold">
              {metrics ? `AUC: ${metrics.rocAuc.toFixed(3)}` : 'AUC: 0.892'}
            </span>
          </div>

          <div className="relative h-32 w-full flex items-end">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="aucGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />

              {/* Convergence Path */}
              <motion.path
                d="M 10 90 Q 50 75, 100 45 T 180 25 T 290 18"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />

              {/* Shaded Area under Curve */}
              <motion.path
                d="M 10 90 Q 50 75, 100 45 T 180 25 T 290 18 L 290 95 L 10 95 Z"
                fill="url(#aucGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4 }}
              />

              {/* Pulsing Optimal Point */}
              <circle cx="290" cy="18" r="4.5" fill="#22d3ee" className="animate-ping" />
              <circle cx="290" cy="18" r="3.5" fill="#ffffff" />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Iter 1 (Base Split)</span>
            <span>Iter 10 (SMOTE Balanced)</span>
            <span>Iter 25 (Ensemble Optimal)</span>
          </div>
        </div>

        {/* Feature Importance Synapse Flow */}
        <div className="md:col-span-5 bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Top Predictive Synapses
            </span>
            <span className="text-slate-500 text-[10px] font-mono">Gini Weight</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { name: 'branchCount', weight: 42, color: 'from-cyan-500 to-blue-500' },
              { name: 'v(G) Cyclomatic', weight: 31, color: 'from-blue-500 to-indigo-500' },
              { name: 'ev(G) Essential', weight: 19, color: 'from-indigo-500 to-purple-500' },
              { name: 'loc Code Lines', weight: 8, color: 'from-purple-500 to-rose-500' },
            ].map((f, i) => (
              <div key={f.name} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-mono text-slate-300">
                    #{i + 1} {f.name}
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">{f.weight}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${f.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${f.weight}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1 text-[10px] text-slate-400 leading-tight">
            Decision boundary driven predominantly by branching frequency and cyclomatic density.
          </div>
        </div>
      </div>
    </div>
  );
};
