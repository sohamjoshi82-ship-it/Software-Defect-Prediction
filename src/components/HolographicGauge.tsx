import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface HolographicGaugeProps {
  probability: number; // 0 to 1
  threshold?: number;
  grade?: string;
  size?: number;
}

export const HolographicGauge: React.FC<HolographicGaugeProps> = ({
  probability,
  threshold = 0.5,
  grade = 'A+',
  size = 220,
}) => {
  const pct = Math.round(probability * 100);
  const isHighRisk = probability >= threshold;

  // Arc math: 240 degree arc from -120 to +120 degrees
  const startAngle = -120;
  const endAngle = 120;
  const totalAngle = endAngle - startAngle; // 240
  const needleAngle = startAngle + probability * totalAngle;

  // Color selection
  let glowColor = '#10b981'; // emerald
  let strokeGradId = 'gaugeGradSafe';
  let statusText = 'SAFE & CLEAN';

  if (probability >= 0.75) {
    glowColor = '#f43f5e';
    strokeGradId = 'gaugeGradCritical';
    statusText = 'CRITICAL DEFECT RISK';
  } else if (probability >= 0.5) {
    glowColor = '#fb7185';
    strokeGradId = 'gaugeGradHigh';
    statusText = 'HIGH RISK';
  } else if (probability >= 0.25) {
    glowColor = '#f59e0b';
    strokeGradId = 'gaugeGradWarning';
    statusText = 'MODERATE RISK';
  }

  // Circular stroke dash calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (pct / 100) * arcLength;

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      <div className="relative" style={{ width: size, height: size * 0.88 }}>
        <svg
          viewBox="0 0 200 175"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="gaugeGradSafe" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="gaugeGradWarning" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="60%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="gaugeGradHigh" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <linearGradient id="gaugeGradCritical" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Outer Ring Track */}
          <path
            d="M 30.7 140 A 80 80 0 1 1 169.3 140"
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const angle = (startAngle + t * totalAngle) * (Math.PI / 180);
            const x1 = 100 + Math.cos(angle) * 66;
            const y1 = 100 + Math.sin(angle) * 66;
            const x2 = 100 + Math.cos(angle) * 72;
            const y2 = 100 + Math.sin(angle) * 72;

            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={t === 0.5 ? '#f59e0b' : '#64748b'}
                strokeWidth={t === 0.5 ? '2.5' : '1.5'}
              />
            );
          })}

          {/* Active Colored Progress Arc with Spring Motion */}
          <motion.path
            d="M 30.7 140 A 80 80 0 1 1 169.3 140"
            fill="none"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', damping: 20, stiffness: 65 }}
            filter="url(#neonGlow)"
          />

          {/* Threshold Marker Indicator */}
          {(() => {
            const threshRad = (startAngle + threshold * totalAngle) * (Math.PI / 180);
            const tx = 100 + Math.cos(threshRad) * 88;
            const ty = 100 + Math.sin(threshRad) * 88;
            return (
              <circle
                cx={tx}
                cy={ty}
                r="3"
                fill="#f59e0b"
                className="animate-pulse"
              />
            );
          })()}

          {/* Rotating Needle with Spring */}
          <motion.g
            initial={{ rotate: startAngle }}
            animate={{ rotate: needleAngle }}
            transition={{ type: 'spring', damping: 14, stiffness: 85 }}
            style={{ originX: '100px', originY: '100px' }}
          >
            {/* Needle Body */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))"
            />
            {/* Needle Tip Glow Point */}
            <circle cx="100" cy="28" r="3" fill={glowColor} />
          </motion.g>

          {/* Center Hub Pip */}
          <circle cx="100" cy="100" r="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="100" cy="100" r="4" fill={glowColor} />
        </svg>

        {/* Big Probability Counter in Center */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center">
          <motion.div
            key={pct}
            initial={{ scale: 0.85, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-baseline gap-0.5"
          >
            <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
              {pct}
            </span>
            <span className="text-lg font-bold text-cyan-400 font-mono">%</span>
          </motion.div>
          <span
            className="text-[10px] font-bold tracking-wider uppercase font-mono mt-0.5"
            style={{ color: glowColor }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Grade Stamp Badge */}
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-slate-400">Health Rating:</span>
        <span
          className={`px-2 py-0.5 rounded font-black font-mono text-xs border shadow-sm ${
            grade.startsWith('A')
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-emerald-950/50'
              : grade === 'B'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 shadow-cyan-950/50'
              : grade === 'C'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-amber-950/50'
              : 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-rose-950/50'
          }`}
        >
          GRADE {grade}
        </span>
      </div>
    </div>
  );
};
