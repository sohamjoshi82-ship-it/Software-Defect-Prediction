import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Bug,
  ShieldCheck,
  Code2,
  Wand2,
  Play,
} from 'lucide-react';

interface QuickStartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSample: () => void;
}

export const QuickStartWizardModal: React.FC<QuickStartWizardModalProps> = ({
  isOpen,
  onClose,
  onStartSample,
}) => {
  const [step, setStep] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-cyan-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">
                Beginner&apos;s Quick Guide: Software Defect Prediction
              </h3>
              <p className="text-[11px] text-slate-400">
                Step {step} of 3 &bull; Master bug prediction in 60 seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Wizard"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          {step === 1 && (
            <div className="space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mx-auto mb-2">
                <Bug className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white text-center">
                What is Software Defect Prediction?
              </h4>
              <p className="text-center text-slate-300 text-xs leading-relaxed max-w-md mx-auto">
                Just like a grammar checker warns you when a sentence is awkward or confusing,
                <strong> Machine Learning models analyze your code structure</strong> (branches, loops, and math)
                to warn you if code has a high risk of hiding bugs before you even run it.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Complex &amp; Risky
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Lots of nested if/else statements and deep indentations confuse developers and breed bugs.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Clean &amp; Safe
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Straightforward steps and guard clauses are easy to test and rarely fail in production.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 mx-auto mb-2">
                <Code2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white text-center">
                How to Check Any Code in 5 Seconds
              </h4>
              <p className="text-center text-slate-300 text-xs leading-relaxed max-w-md mx-auto">
                You don&apos;t need to know complex math formulas! Here is all you have to do:
              </p>

              <div className="space-y-2 pt-1 max-w-md mx-auto">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="h-5 w-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-white">Paste your code or pick a sample</span>
                    <p className="text-[11px] text-slate-400">Works with C++, Java, Python, and JavaScript.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="h-5 w-5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-white">Look at the Bug Risk Meter &amp; Grade</span>
                    <p className="text-[11px] text-slate-400">
                      Instantly see if your code is <strong>Grade A (Safe)</strong> or <strong>Grade D/F (Buggy)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-white">Fix the code with 1 Click</span>
                    <p className="text-[11px] text-slate-400">
                      The AI will write clean, simplified code that eliminates the defect risk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white text-center">
                Ready to Try Your First Code Scan?
              </h4>
              <p className="text-center text-slate-300 text-xs leading-relaxed max-w-md mx-auto">
                We have prepared a sample of actual NASA flight control code. Watch the AI instantly detect the bug hotspots, then see how a simple refactor turns it into Grade A clean code!
              </p>

              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-800/80 text-center space-y-2">
                <div className="text-cyan-300 font-semibold text-xs">
                  Pro-Tip: Keep &quot;Beginner Friendly&quot; mode enabled
                </div>
                <p className="text-[11px] text-slate-400">
                  You can toggle between Beginner Mode (plain English) and Expert Mode (raw formulas) anytime using the switch in the top header.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Skip
            </button>
          )}

          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  step === s ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-800'
                }`}
              />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onStartSample();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Scan Sample Code Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
