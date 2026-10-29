import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  Play,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Terminal,
  FileCode,
  Zap,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import type { LivePredictionResult, TrainedModelInstance } from '../ml/types.ts';
import { analyzeSourceCode } from '../ml/codeAnalyzer.ts';
import { MLModelManager } from '../ml/modelManager.ts';
import { computeBeginnerHealthScore } from '../ml/beginnerFriendly.ts';
import { MetricExplainerTooltip } from './MetricExplainerTooltip.tsx';
import { HolographicGauge } from './HolographicGauge.tsx';
import { InteractiveControlFlowGraph } from './InteractiveControlFlowGraph.tsx';
import { cyberSound } from '../utils/cyberSound.ts';

interface LiveCodeScannerProps {
  activeModel: TrainedModelInstance | null;
  modelManager: MLModelManager;
  isBeginnerMode?: boolean;
}

const SAMPLE_CODES: {
  id: string;
  name: string;
  language: string;
  expectedRisk: string;
  code: string;
}[] = [
  {
    id: 'flight_control_buggy',
    name: 'Legacy Flight Control Subsystem (C/C++)',
    language: 'C++',
    expectedRisk: 'Critical High Risk',
    code: `// Flight Guidance Subsystem - Attitude Control Loop
int calculateThrustVector(float currentPitch, float targetPitch, 
                          float airspeed, int sensorStatus, 
                          bool emergencyOverride, int failsafeCounter) {
    int thrustAdjustment = 0;
    
    // Deeply nested branching control flow
    if (sensorStatus != 0) {
        if (failsafeCounter > 5) {
            if (emergencyOverride) {
                if (airspeed > 250.0f) {
                    thrustAdjustment = -20;
                } else if (airspeed < 100.0f && currentPitch > 45.0f) {
                    thrustAdjustment = 80;
                } else {
                    thrustAdjustment = 15;
                }
            } else {
                for (int i = 0; i < 4; i++) {
                    if (currentPitch - targetPitch > 10.0f && airspeed > 150.0f) {
                        thrustAdjustment -= 5;
                    } else if (targetPitch - currentPitch > 10.0f && airspeed < 300.0f) {
                        thrustAdjustment += 5;
                    }
                }
            }
        } else {
            thrustAdjustment = (currentPitch > targetPitch) ? -10 : 10;
        }
    } else {
        if (emergencyOverride && failsafeCounter > 2) {
            thrustAdjustment = 50;
        } else {
            thrustAdjustment = 0;
        }
    }
    
    // Unchecked boundary conditions
    if (thrustAdjustment > 100 || thrustAdjustment < -100) {
        if (airspeed > 400.0f && !emergencyOverride) {
            thrustAdjustment = 0;
        }
    }
    
    return thrustAdjustment;
}`,
  },
  {
    id: 'clean_refactored',
    name: 'Clean Guard Clauses (Modern C++)',
    language: 'C++',
    expectedRisk: 'Low Risk',
    code: `// Modern Refactored Thrust Calculator with Guard Clauses
int calculateThrustVectorClean(float currentPitch, float targetPitch, float airspeed) {
    // Guard clause 1: Speed validation
    if (airspeed <= 0.0f || airspeed > 500.0f) {
        return 0;
    }

    const float pitchDelta = currentPitch - targetPitch;
    
    // Guard clause 2: Stable pitch
    if (std::abs(pitchDelta) < 1.0f) {
        return 0;
    }

    // Direct proportional adjustment
    const int baseAdjustment = static_cast<int>(pitchDelta * 1.5f);
    return std::clamp(baseAdjustment, -50, 50);
}`,
  },
  {
    id: 'java_transaction',
    name: 'E-Commerce Order Processor (Java)',
    language: 'Java',
    expectedRisk: 'Moderate Risk',
    code: `public class OrderProcessor {
    public boolean processOrder(Order order, User user, PaymentGateway gateway, InventoryService inventory) {
        if (order == null || user == null) {
            return false;
        }
        
        if (!user.isActive() || user.isSuspended()) {
            return false;
        }
        
        boolean hasStock = true;
        for (OrderItem item : order.getItems()) {
            if (!inventory.checkAvailability(item.getProductId(), item.getQuantity())) {
                hasStock = false;
                break;
            }
        }
        
        if (!hasStock) {
            return false;
        }
        
        TransactionResult result = gateway.charge(user.getCardToken(), order.getTotalAmount());
        if (result != null && result.isSuccessful()) {
            inventory.deductStock(order.getItems());
            order.setStatus(OrderStatus.CONFIRMED);
            return true;
        }
        
        return false;
    }
}`,
  },
  {
    id: 'python_etl',
    name: 'Python ETL Ingestion Pipeline (Python)',
    language: 'Python',
    expectedRisk: 'High Risk',
    code: `def ingest_batch_records(records, retry_limit=3, strict_schema=False):
    """Parses and ingests telemetry data with nested retry loops and fallbacks."""
    processed = []
    failed_count = 0
    
    for record in records:
        success = False
        attempt = 0
        
        while attempt < retry_limit and not success:
            try:
                if not record or not isinstance(record, dict):
                    failed_count += 1
                    break
                
                payload_type = record.get("type", "standard")
                if payload_type == "telemetry":
                    if "voltage" in record and record["voltage"] < 0:
                        raise ValueError("Negative voltage anomalous reading")
                    processed.append(record["data"])
                    success = True
                elif payload_type == "command":
                    if strict_schema:
                        if "checksum" not in record or not record["checksum"]:
                            raise KeyError("Missing critical auth checksum")
                    processed.append(record["command"])
                    success = True
                else:
                    failed_count += 1
                    break
            except (ValueError, KeyError) as err:
                attempt += 1
                if attempt >= retry_limit:
                    failed_count += 1
                    
    return {"processed": len(processed), "failed": failed_count}`,
  },
];

export const LiveCodeScanner: React.FC<LiveCodeScannerProps> = ({
  activeModel,
  modelManager,
  isBeginnerMode = true,
}) => {
  const [code, setCode] = useState<string>(SAMPLE_CODES[0].code);
  const [selectedSample, setSelectedSample] = useState<string>(SAMPLE_CODES[0].id);
  const [prediction, setPrediction] = useState<LivePredictionResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerVisualTab, setScannerVisualTab] = useState<'cfg' | 'hotspots'>('cfg');

  // AI Review state
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiHeuristicData, setAiHeuristicData] = useState<any | null>(null);

  const runAnalysis = () => {
    setIsScanning(true);
    cyberSound.playLaserScan();
    const { metrics, hotspots } = analyzeSourceCode(code);
    const pred = modelManager.predictFromCodeMetrics(metrics, hotspots);
    setPrediction(pred);
    setAiReport(null);
    setAiHeuristicData(null);
    setTimeout(() => {
      setIsScanning(false);
      if (pred.probability >= 0.5) {
        cyberSound.playDefectAlert();
      } else {
        cyberSound.playCleanChime();
      }
    }, 700);
  };

  useEffect(() => {
    runAnalysis();
  }, [code, activeModel]);

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_CODES.find((s) => s.id === sampleId);
    if (sample) {
      cyberSound.playClick();
      setSelectedSample(sampleId);
      setCode(sample.code);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCleanFix = () => {
    const cleanSample = SAMPLE_CODES.find((s) => s.id === 'clean_refactored');
    if (cleanSample) {
      setCode(cleanSample.code);
      setSelectedSample('clean_refactored');
    }
  };

  const handleRequestAiReview = async () => {
    if (!prediction) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/review-defect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          metrics: prediction.metrics,
          hotspots: prediction.hotspots,
          riskLevel: prediction.riskLevel,
          probability: prediction.probability,
        }),
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.mode === 'gemini') {
        setAiReport(data.report);
      } else {
        setAiHeuristicData(data);
      }
    } catch (err) {
      console.warn('API review endpoint unavailable or timed out, using client-side QA diagnostics:', err);
      // Guaranteed client-side fallback so user always gets a rich explanation
      setAiHeuristicData({
        success: true,
        mode: 'heuristic',
        summary: `Empirical QA Analysis: Defect risk evaluated at ${prediction.riskLevel} (${(prediction.probability * 100).toFixed(1)}%). Cyclomatic complexity is ${prediction.metrics.cyclomaticComplexity} with max nesting depth of ${prediction.metrics.maxNestingDepth}.`,
        rootCauses: prediction.hotspots.length > 0
          ? prediction.hotspots.map((h) => `${h.metric}: ${h.recommendation}`)
          : ['High branching density increases test state explosion exponentially.'],
        refactoredCode: `// Suggested Clean Architecture Refactoring:
// 1. Invert nested if/else blocks to return early (guard clauses)
// 2. Extract nested loops or switch statements into dedicated helpers
// 3. Keep method complexity v(G) <= 10 for complete branch testing.`,
        qualityChecklist: [
          'Enforce cyclomatic complexity v(G) <= 10 per method',
          'Avoid nesting deeper than 3 indentation levels',
          'Add automated unit test assertions covering each conditional branch',
        ],
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const beginnerHealth = prediction
    ? computeBeginnerHealthScore(prediction.probability, prediction.metrics)
    : null;

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/80';
      case 'High':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
      case 'Moderate':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-700/80';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="h-5 w-5 text-cyan-400" />
            <span>
              {isBeginnerMode ? 'Instant Code Health & Bug Risk Scanner' : 'Live Source Code Scanner & AST Metric Extractor'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBeginnerMode
              ? 'Paste any function below. The AI will instantly measure its bug risk, explain the tricky parts, and help you fix it.'
              : 'Paste code in C/C++, Java, JS, or Python to extract McCabe cyclomatic complexity and Halstead metrics with real-time ML defect risk scoring.'}
          </p>
        </div>

        {/* Preset Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">
            {isBeginnerMode ? 'Try A Sample:' : 'Presets:'}
          </span>
          {SAMPLE_CODES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSample(s.id)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedSample === s.id
                  ? 'bg-slate-800 text-cyan-300 border-cyan-500 font-medium'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {s.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Editor */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <FileCode className="h-4 w-4 text-cyan-400" />
              <span>module_under_test.cpp</span>
            </div>
            <div className="flex items-center gap-2">
              {isBeginnerMode && selectedSample !== 'clean_refactored' && (
                <button
                  onClick={handleApplyCleanFix}
                  className="text-[11px] text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 font-medium flex items-center gap-1 px-2.5 py-0.5 rounded transition-colors cursor-pointer"
                  title="Replace code with clean, safe version"
                >
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span>Compare Clean Version</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={runAnalysis}
                className="text-[11px] text-white bg-indigo-600 hover:bg-indigo-500 font-medium flex items-center gap-1 px-2.5 py-0.5 rounded transition-colors cursor-pointer"
              >
                <Play className="h-3 w-3 fill-white" />
                <span>Scan Code</span>
              </button>
            </div>
          </div>

          <div className="relative p-3 bg-slate-950 flex-1 overflow-hidden">
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_#22d3ee] pointer-events-none animate-laser z-20" />
            )}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={18}
              aria-label="Source code under test"
              className="w-full h-full bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-y border-0 selection:bg-cyan-900 selection:text-white"
              placeholder="// Paste C, C++, Java, JS, or Python code here..."
            />
          </div>

          <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Model: {activeModel?.name || 'Random Forest'}</span>
            <div className="flex items-center gap-3">
              {isScanning && (
                <span className="text-cyan-400 font-mono text-[10px] animate-pulse flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                  AST Scanning...
                </span>
              )}
              <span>Lines: {code.split('\n').length}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction & Metric Gauge */}
        <div className="lg:col-span-5 space-y-4">
          {/* Beginner-Friendly Code Health Card with Holographic Gauge */}
          {prediction && isBeginnerMode && beginnerHealth && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Defect Risk & Health Speedometer
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskBadgeColor(
                    prediction.riskLevel
                  )}`}
                >
                  {beginnerHealth.riskLevelText}
                </span>
              </div>

              {/* Holographic Speedometer Gauge */}
              <HolographicGauge
                probability={prediction.probability}
                threshold={activeModel?.result.testMetrics.threshold || 0.5}
                grade={beginnerHealth.grade}
              />

              {/* Readability & Testability Bars */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">📖 Readability (Clarity)</span>
                    <span className="font-semibold text-white font-mono">{beginnerHealth.readabilityScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        beginnerHealth.readabilityScore > 75
                          ? 'bg-emerald-500'
                          : beginnerHealth.readabilityScore > 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${beginnerHealth.readabilityScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">🧪 Testability (Simplicity)</span>
                    <span className="font-semibold text-white font-mono">{beginnerHealth.testabilityScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        beginnerHealth.testabilityScore > 75
                          ? 'bg-emerald-500'
                          : beginnerHealth.testabilityScore > 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${beginnerHealth.testabilityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Plain English Summary */}
              <div className="p-3 bg-slate-950 rounded-lg text-xs text-slate-300 border border-slate-800/80 leading-relaxed">
                {beginnerHealth.quickSummary}
              </div>

              {/* AI Button */}
              <button
                onClick={handleRequestAiReview}
                disabled={isAiLoading}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{isAiLoading ? 'Analyzing Code with AI...' : 'Explain Root Causes & Refactor'}</span>
              </button>
            </div>
          )}

          {/* Expert Prediction Gauge Card */}
          {prediction && !isBeginnerMode && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Defect Probability Score
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskBadgeColor(
                    prediction.riskLevel
                  )}`}
                >
                  {prediction.riskLevel} Defect Risk
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {(prediction.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Defect Likelihood &bull; Model: {prediction.modelUsed}
                  </div>
                </div>

                <div className="h-16 w-16 relative flex items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        prediction.probability > 0.6
                          ? 'text-rose-500'
                          : prediction.probability > 0.35
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }
                      strokeDasharray={`${prediction.probability * 100}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-bold text-xs text-white">
                    {Math.round(prediction.probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    prediction.probability > 0.6
                      ? 'bg-rose-500'
                      : prediction.probability > 0.35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${prediction.probability * 100}%` }}
                />
              </div>

              {/* AI Assistant button */}
              <button
                onClick={handleRequestAiReview}
                disabled={isAiLoading}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{isAiLoading ? 'Analyzing Code with AI...' : 'Explain Root Causes & Refactor'}</span>
              </button>
            </div>
          )}

          {/* Beginner: What to Fix First */}
          {prediction && isBeginnerMode && beginnerHealth && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>What To Fix First (Simple Checklist)</span>
              </h4>

              <div className="space-y-2.5">
                {beginnerHealth.simpleHotspots.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      item.iconType === 'danger'
                        ? 'bg-rose-950/40 border-rose-800/60'
                        : item.iconType === 'warning'
                        ? 'bg-amber-950/40 border-amber-800/60'
                        : 'bg-emerald-950/40 border-emerald-800/60'
                    }`}
                  >
                    <div className="font-semibold text-white flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-slate-400">Step {idx + 1}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.description}</p>
                    <div className="text-[11px] text-cyan-300 font-medium pt-0.5">
                      💡 <strong>Fix:</strong> {item.simpleFix}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Metrics Grid (with Explainer Tooltips) */}
          {prediction && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>{isBeginnerMode ? 'Code Complexity Measurements' : 'Extracted Software Metrics'}</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60">
                  <div className="text-slate-400 text-[11px]">
                    <MetricExplainerTooltip metricKey="cyclomaticComplexity" label="Branching Paths v(G)" />
                  </div>
                  <div
                    className={`font-mono text-base font-bold ${
                      prediction.metrics.cyclomaticComplexity > 10
                        ? 'text-rose-400'
                        : 'text-white'
                    }`}
                  >
                    {prediction.metrics.cyclomaticComplexity}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isBeginnerMode ? 'Safe limit: \u2264 10' : 'Cyclomatic branches'}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60">
                  <div className="text-slate-400 text-[11px]">
                    <MetricExplainerTooltip metricKey="maxNestingDepth" label="Max Nesting Depth" />
                  </div>
                  <div
                    className={`font-mono text-base font-bold ${
                      prediction.metrics.maxNestingDepth > 3
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {prediction.metrics.maxNestingDepth} levels
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isBeginnerMode ? 'Russian dolls \u2264 3' : 'Indentation depth'}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60">
                  <div className="text-slate-400 text-[11px]">
                    <MetricExplainerTooltip metricKey="sloc" label="Active Code Lines" />
                  </div>
                  <div className="font-mono text-base font-bold text-white">
                    {prediction.metrics.sloc} lines
                  </div>
                  <div className="text-[10px] text-slate-400">Total: {prediction.metrics.loc} lines</div>
                </div>

                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60">
                  <div className="text-slate-400 text-[11px]">
                    <MetricExplainerTooltip metricKey="halsteadEffort" label="Mental Review Effort" />
                  </div>
                  <div className="font-mono text-base font-bold text-white">
                    {prediction.metrics.halsteadEffort.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isBeginnerMode ? 'Brain fatigue factor' : 'Halstead effort (E)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expert Hotspots (Only shown in expert mode or if no beginner card) */}
          {prediction && !isBeginnerMode && prediction.hotspots.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="font-semibold text-rose-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Detected Code Metric Hotspots</span>
              </h4>

              <div className="space-y-2">
                {prediction.hotspots.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-semibold text-rose-300">
                      <span>{h.metric}</span>
                      <span className="font-mono">
                        {h.value} (Safe: &le; {h.safeThreshold})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{h.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Control Flow Graph (CFG) Visualizer */}
      <InteractiveControlFlowGraph
        prediction={prediction}
        code={code}
        isBeginnerMode={isBeginnerMode}
      />

      {/* AI Review Output Container */}
      {(aiReport || aiHeuristicData) && (
        <div className="bg-slate-900 border border-indigo-800/80 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span>AI Software Quality & Refactoring Diagnosis</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
              {aiReport ? 'Gemini 3.8 Flash' : 'Static QA Heuristic'}
            </span>
          </div>

          {aiReport ? (
            <div className="prose prose-invert prose-sm max-w-none text-slate-200 space-y-3 whitespace-pre-line font-sans leading-relaxed">
              {aiReport}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg text-slate-300">
                <strong>Executive Summary:</strong> {aiHeuristicData.summary}
              </div>

              <div>
                <strong className="text-slate-200">Root Causes:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-300">
                  {aiHeuristicData.rootCauses?.map((rc: string, i: number) => (
                    <li key={i}>{rc}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-200">Refactored Clean Code Recommendation:</strong>
                <pre className="p-3 bg-slate-950 rounded-lg text-cyan-300 font-mono text-[11px] overflow-x-auto">
                  {aiHeuristicData.refactoredCode}
                </pre>
              </div>

              <div>
                <strong className="text-slate-200">QA Checklist for Unit Tests:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-300">
                  {aiHeuristicData.qualityChecklist?.map((qc: string, i: number) => (
                    <li key={i}>{qc}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

