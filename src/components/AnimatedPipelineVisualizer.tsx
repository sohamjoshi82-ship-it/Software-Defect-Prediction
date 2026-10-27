import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  Cpu,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';

interface PipelineStep {
  id: string;
  title: string;
  subtitle: string;
  metric: string;
  icon: React.ElementType;
  color: string;
  description: string;
  details: string[];
}

export const AnimatedPipelineVisualizer: React.FC = () => {
  const [activeStepId, setActiveStepId] = useState<string>('metrics');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'tree'>('pipeline');

  const steps: PipelineStep[] = [
    {
      id: 'source',
      title: '1. Source Parsing',
      subtitle: 'Lexical Tokenizer',
      metric: 'AST Nodes',
      icon: Code2,
      color: 'from-cyan-500 to-blue-600',
      description: 'Deconstructs source code into operators, operands, keyword tokens, and syntax trees.',
      details: [
        'Extracts comments, blanks, and executable lines (SLOC)',
        'Detects conditional branches: if, else, switch, loops, catch',
        'Multi-language parser: C/C++, Java, JavaScript, Python',
      ],
    },
    {
      id: 'metrics',
      title: '2. Metrics Extraction',
      subtitle: 'McCabe & Halstead',
      metric: '21 Features',
      icon: Layers,
      color: 'from-blue-500 to-indigo-600',
      description: 'Calculates structural complexity metrics that quantify cognitive load and mental friction.',
      details: [
        'Cyclomatic Complexity v(G) = Edges - Nodes + 2P',
        'Halstead Science: Volume (V), Difficulty (D), Effort (E)',
        'Essential Complexity ev(G) & Design Complexity iv(G)',
      ],
    },
    {
      id: 'smote',
      title: '3. Imbalance Handling',
      subtitle: 'SMOTE Resampling',
      metric: '50:50 Balance',
      icon: Zap,
      color: 'from-indigo-500 to-purple-600',
      description: 'Addresses the rare-class problem in software defects where bugs are typically only 15-20% of code.',
      details: [
        'Synthesizes minority defect samples along k-nearest neighbor vectors',
        'Prevents model from guessing "clean" for everything',
        'Significantly boosts defect recall without hurting precision',
      ],
    },
    {
      id: 'ensemble',
      title: '4. Model Ensemble',
      subtitle: 'Random Forest (CART)',
      metric: '18 Decision Trees',
      icon: Cpu,
      color: 'from-purple-500 to-pink-600',
      description: 'Bagging ensemble of decorrelated decision trees voting on module risk probability.',
      details: [
        'Subspace feature sampling reduces metric collinearity',
        'Gini impurity splitting minimizes risk classification error',
        'Outputs continuous probability score [0.0 - 1.0]',
      ],
    },
    {
      id: 'verdict',
      title: '5. Quality Verdict',
      subtitle: 'Risk & Triage',
      metric: 'Actionable QA',
      icon: ShieldAlert,
      color: 'from-pink-500 to-rose-600',
      description: 'Threshold-tuned prediction with root cause hotspots and automated refactoring guidelines.',
      details: [
        'Assigns Code Health Grade (A+ to F)',
        'Flags nested branches, runaway functions, and cognitive debt',
        '1-click AI refactoring instructions for developer fix',
      ],
    },
  ];

  const currentStep = steps.find((s) => s.id === activeStepId) || steps[1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Interactive Machine Learning Dataflow</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-time visual architecture showing how raw code transforms into defect predictions
          </p>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === 'pipeline'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ML Pipeline Flow
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === 'tree'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Decision Tree
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <div className="space-y-4">
          {/* Animated Pipeline Nodes */}
          <div className="relative py-2">
            {/* Background connecting track */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-800 rounded-full overflow-hidden">
              {/* Animated energy pulses flowing through the track */}
              <motion.div
                className="h-full w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                animate={{
                  x: ['-100%', '600%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: 'linear',
                }}
              />
            </div>

            {/* Nodes Grid */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {steps.map((step) => {
                const Icon = step.icon;
                const isSelected = activeStepId === step.id;

                return (
                  <motion.div
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/95 border-cyan-400 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${step.color} p-0.5 shadow-md flex items-center justify-center`}
                      >
                        <div className="h-full w-full bg-slate-950/70 rounded-[6px] flex items-center justify-center">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                        {step.metric}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-white truncate">{step.title}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{step.subtitle}</p>

                    {isSelected && (
                      <motion.div
                        layoutId="activePipelineIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-cyan-400 shadow-md shadow-cyan-400"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Active Step Details Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold text-xs font-mono">{currentStep.title}</span>
                  <span className="text-slate-400 text-xs">&bull;</span>
                  <span className="text-slate-300 text-xs font-medium">{currentStep.subtitle}</span>
                </div>
                <span className="text-[11px] text-indigo-400 font-mono">Stage {currentStep.id.toUpperCase()}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{currentStep.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {currentStep.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Live Animated Decision Tree Visualizer */
        <div className="space-y-3">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <svg viewBox="0 0 700 240" className="w-full h-auto max-w-2xl overflow-visible">
              <defs>
                <linearGradient id="treePulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Connecting Lines with animated pulses */}
              {/* Root -> Left & Right */}
              <path d="M 350,42 L 200,105" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
              <path d="M 350,42 L 500,105" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />

              {/* Left -> Leaves */}
              <path d="M 200,135 L 120,195" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
              <path d="M 200,135 L 260,195" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />

              {/* Right -> Leaves */}
              <path d="M 500,135 L 430,195" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
              <path d="M 500,135 L 580,195" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />

              {/* Animated Flow Packet traveling through tree */}
              <motion.circle
                r="4"
                fill="#22d3ee"
                animate={{
                  cx: [350, 500, 580],
                  cy: [42, 105, 195],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: 'easeInOut',
                }}
              />
              <motion.circle
                r="4"
                fill="#10b981"
                animate={{
                  cx: [350, 200, 120],
                  cy: [42, 105, 195],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  delay: 0.8,
                  ease: 'easeInOut',
                }}
              />

              {/* Root Node */}
              <g transform="translate(350, 30)">
                <rect x="-85" y="-18" width="170" height="36" rx="8" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                <text textAnchor="middle" y="4" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  v(G) &gt; 10 ?
                </text>
              </g>

              {/* Branch Labels */}
              <text x="250" y="70" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">&le; 10 (Low)</text>
              <text x="430" y="70" fill="#f43f5e" fontSize="10" fontFamily="sans-serif">&gt; 10 (High)</text>

              {/* Left Decision Node */}
              <g transform="translate(200, 120)">
                <rect x="-80" y="-16" width="160" height="32" rx="8" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                <text textAnchor="middle" y="4" fill="#e2e8f0" fontSize="10" fontFamily="monospace">
                  Volume (V) &gt; 500 ?
                </text>
              </g>

              {/* Right Decision Node */}
              <g transform="translate(500, 120)">
                <rect x="-85" y="-16" width="170" height="32" rx="8" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.2" />
                <text textAnchor="middle" y="4" fill="#fda4af" fontSize="10" fontFamily="monospace">
                  Nesting &gt; 3 levels ?
                </text>
              </g>

              {/* Leaf 1: Clean */}
              <g transform="translate(120, 205)">
                <rect x="-55" y="-14" width="110" height="28" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1.2" />
                <text textAnchor="middle" y="4" fill="#a7f3d0" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  CLEAN (94%)
                </text>
              </g>

              {/* Leaf 2: Low Risk */}
              <g transform="translate(260, 205)">
                <rect x="-55" y="-14" width="110" height="28" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
                <text textAnchor="middle" y="4" fill="#bae6fd" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  MODERATE (35%)
                </text>
              </g>

              {/* Leaf 3: High Risk */}
              <g transform="translate(430, 205)">
                <rect x="-55" y="-14" width="110" height="28" rx="6" fill="#451a03" stroke="#f59e0b" strokeWidth="1.2" />
                <text textAnchor="middle" y="4" fill="#fde68a" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  HIGH (68%)
                </text>
              </g>

              {/* Leaf 4: Defective */}
              <g transform="translate(580, 205)">
                <rect x="-55" y="-14" width="110" height="28" rx="6" fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
                <text textAnchor="middle" y="4" fill="#fecdd3" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  DEFECT (91%)
                </text>
              </g>
            </svg>
          </div>
          <p className="text-[11px] text-slate-400 text-center font-mono">
            &bull; Animated data particles simulate real code traversal down CART tree branches &bull;
          </p>
        </div>
      )}
    </div>
  );
};
