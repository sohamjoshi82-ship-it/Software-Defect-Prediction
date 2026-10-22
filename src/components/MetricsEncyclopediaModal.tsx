import React from 'react';
import { BookOpen, X, Code2, Layers, Cpu, ShieldCheck } from 'lucide-react';

interface MetricsEncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricsEncyclopediaModal: React.FC<MetricsEncyclopediaModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Software Defect Prediction & Code Metrics Encyclopedia
              </h2>
              <p className="text-xs text-slate-400">
                Theoretical foundations of McCabe, Halstead, CK metrics, and Machine Learning for QA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Encyclopedia Modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* Section 1: McCabe Metrics */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>1. McCabe Cyclomatic Complexity Suite (IEEE 1976)</span>
            </h3>
            <p>
              Invented by Thomas J. McCabe in 1976, cyclomatic complexity measures the number of linearly independent paths through a program&apos;s control flow graph G = (V, E).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-white font-mono">v(G) = E - N + 2P</span>
                <div className="text-[11px] text-slate-400 font-medium">Cyclomatic Complexity</div>
                <p className="text-[10px] text-slate-400">
                  Calculated as: (decision points + 1). Safe threshold &le; 10. Values &gt; 20 correspond to high defect risk.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-white font-mono">ev(G)</span>
                <div className="text-[11px] text-slate-400 font-medium">Essential Complexity</div>
                <p className="text-[10px] text-slate-400">
                  Measures unstructured logic (unstructured jumps, break-out cascades). ev(G) = 1 represents fully structured code.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-white font-mono">iv(G)</span>
                <div className="text-[11px] text-slate-400 font-medium">Design (Module) Complexity</div>
                <p className="text-[10px] text-slate-400">
                  Quantifies coupling and integration testing requirements by counting execution branches that invoke external modules.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Halstead Software Science */}
          <section className="space-y-3 border-t border-slate-800 pt-5">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>2. Halstead Software Science (Maurice Halstead 1977)</span>
            </h3>
            <p>
              Measures the physical volume of computational tokens based on distinct operators &eta;&sub1;, distinct operands &eta;&sub2;, total operators N&sub1;, and total operands N&sub2;.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="font-bold text-white font-mono">Vocabulary &amp; Length</div>
                <div className="text-[10px] text-slate-400 mt-1">&eta; = &eta;&sub1; + &eta;&sub2;, N = N&sub1; + N&sub2;</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="font-bold text-white font-mono">Volume (V)</div>
                <div className="text-[10px] text-slate-400 mt-1">V = N &times; log&sub2;(&eta;) (bits of mental space)</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="font-bold text-white font-mono">Difficulty &amp; Effort (E)</div>
                <div className="text-[10px] text-slate-400 mt-1">D = (&eta;&sub1; / 2) &times; (N&sub2; / &eta;&sub2;), E = D &times; V</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="font-bold text-white font-mono">Predicted Bugs (B)</div>
                <div className="text-[10px] text-slate-400 mt-1">B = V / 3000 (empirical defect count)</div>
              </div>
            </div>
          </section>

          {/* Section 3: Chidamber-Kemerer (CK) Metrics */}
          <section className="space-y-3 border-t border-slate-800 pt-5">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>3. Chidamber &amp; Kemerer Object-Oriented Metrics</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-semibold text-white">WMC (Weighted Methods)</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Sum of cyclomatic complexity across all member methods in a class. High WMC implies high fault proneness.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-semibold text-white">CBO (Coupling Between Objects)</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Number of other classes to which a class is coupled. Excessive CBO prevents isolated unit testing and spreads bugs.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-semibold text-white">LCOM (Lack of Cohesion)</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Measures whether methods operate on disparate fields. High LCOM signals Single Responsibility Principle violations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Class Imbalance & Evaluation */}
          <section className="space-y-3 border-t border-slate-800 pt-5">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>4. Class Imbalance, SMOTE, and Cost Matrix in Software QA</span>
            </h3>
            <p>
              In real-world software repositories (like NASA MDP), only 10% to 20% of modules contain defects. Traditional models that maximize accuracy tend to predict &ldquo;Clean&rdquo; 100% of the time, missing all bugs with 90% naive accuracy!
            </p>
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="font-semibold text-white">Why SMOTE and ROC-AUC are Mandatory:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong className="text-slate-200">SMOTE:</strong> Interpolates synthetic defect instances along k-NN vectors in metric space during training.</li>
                <li><strong className="text-slate-200">Probability of Detection (PD / Recall):</strong> Fraction of true bugs caught.</li>
                <li><strong className="text-slate-200">Probability of False Alarm (PF):</strong> Inspection budget wasted reviewing non-buggy code.</li>
                <li><strong className="text-slate-200">Matthews Correlation Coefficient (MCC):</strong> True measure of quality on imbalanced binary classes.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
