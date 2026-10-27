import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, ShieldAlert, ShieldCheck, Zap, Info, Eye } from 'lucide-react';
import type { SoftwareModuleRecord } from '../ml/types.ts';
import { cyberSound } from '../utils/cyberSound.ts';

interface InteractiveTreemapMatrixProps {
  records: (SoftwareModuleRecord & {
    predictedProbability?: number;
    predictedClass?: 0 | 1;
  })[];
  onSelectModule?: (record: SoftwareModuleRecord) => void;
  isBeginnerMode?: boolean;
}

export const InteractiveTreemapMatrix: React.FC<InteractiveTreemapMatrixProps> = ({
  records,
  onSelectModule,
  isBeginnerMode = true,
}) => {
  const [hoveredRecord, setHoveredRecord] = useState<(SoftwareModuleRecord & { predictedProbability?: number }) | null>(null);

  // Take a representative sample (up to 72 modules) for clear visual density
  const displayRecords = records.slice(0, 72);

  const getHeatmapColor = (prob: number) => {
    if (prob >= 0.7) return 'bg-rose-600/90 hover:bg-rose-500 border-rose-400/80 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
    if (prob >= 0.45) return 'bg-amber-600/80 hover:bg-amber-500 border-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
    if (prob >= 0.25) return 'bg-cyan-700/70 hover:bg-cyan-600 border-cyan-400/60';
    return 'bg-emerald-700/60 hover:bg-emerald-600 border-emerald-400/50';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-950/80 border border-indigo-700/70 flex items-center justify-center text-cyan-400">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>Interactive Defect Heatmap Matrix</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {displayRecords.length} modules visualized
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isBeginnerMode
                ? 'Color indicates bug risk (Green = Safe, Red = Urgent Review). Tile size indicates code length.'
                : 'Module surface map color-coded by predicted posterior probability P(Defect | X).'}
            </p>
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">&lt;25% Low</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="text-slate-400">25-45% Guard</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">45-70% Med</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-300 font-bold">&gt;70% Critical</span>
          </span>
        </div>
      </div>

      {/* Grid of Interactive Animated Tiles */}
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2 min-h-[160px] p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 bg-cyber-grid">
        {displayRecords.map((rec, idx) => {
          const prob = rec.predictedProbability ?? (rec.defective === 1 ? 0.78 : 0.15);
          const isHigh = prob >= 0.7;
          const loc = rec.metrics['loc'] || 30;
          const vg = rec.metrics['v_g'] || rec.metrics['wmc'] || 2;

          return (
            <motion.div
              key={rec.id || idx}
              whileHover={{ scale: 1.15, zIndex: 20 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => {
                setHoveredRecord(rec);
                if (isHigh) cyberSound.playDefectAlert();
                else cyberSound.playClick();
              }}
              onMouseLeave={() => setHoveredRecord(null)}
              onClick={() => onSelectModule && onSelectModule(rec)}
              className={`h-10 sm:h-11 rounded-lg border p-1 flex flex-col justify-between cursor-pointer transition-all ${getHeatmapColor(
                prob
              )}`}
            >
              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-white/90">
                <span className="truncate max-w-[28px]">{rec.id.replace('m', '')}</span>
                {isHigh && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
              </div>
              <div className="text-[8.5px] font-mono text-white/80 flex justify-between">
                <span>{(prob * 100).toFixed(0)}%</span>
                <span className="opacity-70">v{vg}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hover Inspection HUD Bar */}
      <AnimatePresence>
        {hoveredRecord && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="p-3 bg-slate-950 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                  (hoveredRecord.predictedProbability ?? 0) >= 0.7
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}
              >
                {((hoveredRecord.predictedProbability ?? 0) * 100).toFixed(0)}%
              </div>
              <div>
                <div className="font-mono font-bold text-white flex items-center gap-2">
                  <span>{hoveredRecord.name}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">
                    (ID: {hoveredRecord.id})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono mt-0.5">
                  <span>LOC: {hoveredRecord.metrics['loc'] || 0}</span>
                  <span>v(G): {hoveredRecord.metrics['v_g'] || hoveredRecord.metrics['wmc'] || 0}</span>
                  <span>Halstead Vol: {Math.round(hoveredRecord.metrics['v'] || 0)}</span>
                  <span>Actual: {hoveredRecord.defective === 1 ? 'DEFECTIVE' : 'CLEAN'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2.5 py-1 rounded font-semibold ${
                  (hoveredRecord.predictedProbability ?? 0) >= 0.6
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                }`}
              >
                {(hoveredRecord.predictedProbability ?? 0) >= 0.6
                  ? 'High Priority QA Testing Needed'
                  : 'Low Risk Verification Pass'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
