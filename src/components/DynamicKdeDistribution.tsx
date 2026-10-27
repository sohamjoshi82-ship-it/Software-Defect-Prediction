import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface DynamicKdeDistributionProps {
  threshold: number; // 0 to 1
  onThresholdChange?: (val: number) => void;
  rocAuc?: number;
}

export const DynamicKdeDistribution: React.FC<DynamicKdeDistributionProps> = ({
  threshold,
  onThresholdChange,
  rocAuc = 0.94,
}) => {
  // Generate smooth Gaussian KDE curves
  // Clean distribution centered around 0.18, std 0.12
  // Defective distribution centered around 0.78, std 0.14
  const points = 60;
  const cleanCurve: { x: number; y: number }[] = [];
  const defectCurve: { x: number; y: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const x = i / points;
    // Gaussian formula: exp(-0.5 * ((x - mu) / sigma)^2)
    const cleanY = Math.exp(-0.5 * Math.pow((x - 0.18) / 0.11, 2)) * 75;
    const defectY = Math.exp(-0.5 * Math.pow((x - 0.76) / 0.13, 2)) * 72;
    cleanCurve.push({ x: x * 100, y: 90 - cleanY });
    defectCurve.push({ x: x * 100, y: 90 - defectY });
  }

  const cleanPath = `M 0,90 ` + cleanCurve.map((p) => `L ${p.x},${p.y}`).join(' ') + ` L 100,90 Z`;
  const defectPath = `M 0,90 ` + defectCurve.map((p) => `L ${p.x},${p.y}`).join(' ') + ` L 100,90 Z`;

  const thresholdX = threshold * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>Dual Density Distribution (Clean vs Buggy Modules)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Interactive decision boundary shows how threshold splits safe code from defective code
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
            Model Separation (AUC): {rocAuc.toFixed(3)}
          </span>
        </div>
      </div>

      {/* SVG Plot */}
      <div className="relative w-full aspect-[2.4/1] bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-hidden select-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            {/* Clean gradient fill */}
            <linearGradient id="cleanFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>

            {/* Defect gradient fill */}
            <linearGradient id="defectFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
            </linearGradient>

            {/* Clip paths for True/False Positives & Negatives */}
            <clipPath id="leftOfThreshold">
              <rect x="0" y="0" width={thresholdX} height="100" />
            </clipPath>
            <clipPath id="rightOfThreshold">
              <rect x={thresholdX} y="0" width={100 - thresholdX} height="100" />
            </clipPath>
          </defs>

          {/* Background Grid Lines */}
          <line x1="0" y1="90" x2="100" y2="90" stroke="#334155" strokeWidth="0.8" />
          <line x1="25" y1="10" x2="25" y2="90" stroke="#1e293b" strokeDasharray="1,2" strokeWidth="0.5" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="#1e293b" strokeDasharray="1,2" strokeWidth="0.5" />
          <line x1="75" y1="10" x2="75" y2="90" stroke="#1e293b" strokeDasharray="1,2" strokeWidth="0.5" />

          {/* Clean Curves */}
          <path d={cleanPath} fill="url(#cleanFillGrad)" />
          <path
            d={`M 0,90 ` + cleanCurve.map((p) => `L ${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.2"
          />

          {/* Defect Curves */}
          <path d={defectPath} fill="url(#defectFillGrad)" />
          <path
            d={`M 0,90 ` + defectCurve.map((p) => `L ${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.2"
          />

          {/* False Alarms highlighted (Clean modules to the right of threshold) */}
          <path
            d={cleanPath}
            fill="#f59e0b"
            fillOpacity="0.3"
            clipPath="url(#rightOfThreshold)"
          />

          {/* Missed Bugs highlighted (Defective modules to the left of threshold) */}
          <path
            d={defectPath}
            fill="#f43f5e"
            fillOpacity="0.55"
            clipPath="url(#leftOfThreshold)"
          />

          {/* Dynamic Animated Threshold Line */}
          <motion.line
            x1={thresholdX}
            y1="5"
            x2={thresholdX}
            y2="92"
            stroke="#f59e0b"
            strokeWidth="1.8"
            animate={{ x1: thresholdX, x2: thresholdX }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
            filter="drop-shadow(0 0 3px #f59e0b)"
          />

          {/* Boundary Marker Handle */}
          <motion.circle
            cx={thresholdX}
            cy="12"
            r="3.5"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1"
            animate={{ cx: thresholdX }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          />
        </svg>

        {/* Labels on SVG */}
        <div className="absolute bottom-1 left-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
          <span>Clean Code Density</span>
        </div>
        <div className="absolute bottom-1 right-2 text-[10px] text-rose-400 font-mono flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
          <span>Defective Code Density</span>
        </div>
      </div>

      {/* Legend showing what the 4 regions mean */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex flex-col">
          <span className="text-emerald-400 font-bold">True Negatives (TN)</span>
          <span className="text-slate-400 text-[10px]">Clean code correctly approved</span>
        </div>
        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/50 flex flex-col">
          <span className="text-amber-400 font-bold">False Alarms (FP)</span>
          <span className="text-slate-400 text-[10px]">Clean code flagged by mistake</span>
        </div>
        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 flex flex-col">
          <span className="text-rose-400 font-bold">Missed Bugs (FN)</span>
          <span className="text-slate-400 text-[10px]">Bugs that slipped through</span>
        </div>
        <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 flex flex-col">
          <span className="text-cyan-400 font-bold">Caught Bugs (TP)</span>
          <span className="text-slate-400 text-[10px]">Defects intercepted before launch</span>
        </div>
      </div>
    </div>
  );
};
