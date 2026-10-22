import React, { useState } from 'react';
import { HelpCircle, X, Sparkles } from 'lucide-react';
import { BEGINNER_METRIC_GLOSSARY } from '../ml/beginnerFriendly.ts';

interface MetricExplainerTooltipProps {
  metricKey: string;
  label?: string;
  children?: React.ReactNode;
}

export const MetricExplainerTooltip: React.FC<MetricExplainerTooltipProps> = ({
  metricKey,
  label,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = BEGINNER_METRIC_GLOSSARY[metricKey];

  if (!info) {
    return <>{children || label || metricKey}</>;
  }

  return (
    <span className="relative inline-flex items-center gap-1 group">
      <span>{children || label || info.plainName}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={`What does ${info.plainName} mean?`}
        className="text-slate-400 hover:text-cyan-400 focus:outline-none p-0.5 rounded cursor-pointer transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={info.plainName}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 border border-cyan-500/80 rounded-xl shadow-2xl text-left text-xs animate-in fade-in zoom-in-95 pointer-events-auto"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1 text-[11px]">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              {info.plainName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">
            {info.simpleExplanation}
          </p>

          <div className="mt-2 p-2 bg-slate-950/80 rounded border border-slate-800/80 text-[10px] text-cyan-300">
            <strong className="text-slate-200">Real-world analogy:</strong> {info.analogy}
          </div>
        </div>
      )}
    </span>
  );
};
