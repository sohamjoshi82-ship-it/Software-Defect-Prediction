import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, AlertTriangle, CheckCircle2, Zap, Info, Play, RefreshCw } from 'lucide-react';
import type { LivePredictionResult } from '../ml/types.ts';

interface CFGNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'entry' | 'condition' | 'action' | 'loop' | 'exit';
  x: number;
  y: number;
  cyclomaticWeight: number;
  isHighRisk?: boolean;
  codeSnippet: string;
}

interface CFGEdge {
  from: string;
  to: string;
  label?: string;
  isDefectPath?: boolean;
}

interface InteractiveControlFlowGraphProps {
  prediction: LivePredictionResult | null;
  code: string;
  isBeginnerMode?: boolean;
}

export const InteractiveControlFlowGraph: React.FC<InteractiveControlFlowGraphProps> = ({
  prediction,
  code,
  isBeginnerMode = true,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('cond1');
  const [highlightMode, setHighlightMode] = useState<'all' | 'critical' | 'clean'>('critical');
  const [isSimulatingExecution, setIsSimulatingExecution] = useState<boolean>(true);

  // Derive whether current code snippet is the buggy attitude control or clean/refactored
  const isBuggyAttitude = code.includes('calculateThrustVector') && code.includes('failsafeCounter');
  const isCleanRefactored = code.includes('calculateThrustVectorClean') || code.includes('std::clamp');

  // Dynamic CFG Nodes for the current code sample
  const nodes: CFGNode[] = isBuggyAttitude
    ? [
        {
          id: 'entry',
          label: 'Entry: calculateThrustVector()',
          sublabel: 'Function initialization',
          type: 'entry',
          x: 260,
          y: 35,
          cyclomaticWeight: 1,
          codeSnippet: 'int calculateThrustVector(float pitch, float airspeed...)',
        },
        {
          id: 'cond1',
          label: 'Branch 1: sensorStatus != 0 ?',
          sublabel: 'Primary sensor health check',
          type: 'condition',
          x: 260,
          y: 110,
          cyclomaticWeight: 2,
          isHighRisk: true,
          codeSnippet: 'if (sensorStatus != 0) { ... }',
        },
        {
          id: 'cond2',
          label: 'Branch 2: failsafeCounter > 5 ?',
          sublabel: 'Failsafe threshold gate',
          type: 'condition',
          x: 150,
          y: 195,
          cyclomaticWeight: 3,
          isHighRisk: true,
          codeSnippet: 'if (failsafeCounter > 5) { ... }',
        },
        {
          id: 'cond3',
          label: 'Branch 3: emergencyOverride ?',
          sublabel: 'Emergency pilot manual control',
          type: 'condition',
          x: 90,
          y: 280,
          cyclomaticWeight: 4,
          isHighRisk: true,
          codeSnippet: 'if (emergencyOverride) { ... }',
        },
        {
          id: 'loop1',
          label: 'Loop: for (int i = 0; i < 4; i++)',
          sublabel: 'Iterative attitude smoothing',
          type: 'loop',
          x: 230,
          y: 280,
          cyclomaticWeight: 3,
          isHighRisk: true,
          codeSnippet: 'for (int i = 0; i < 4; i++) { ... }',
        },
        {
          id: 'cond4',
          label: 'Branch 4: airspeed > 250.0f ?',
          sublabel: 'Supersonic velocity check',
          type: 'condition',
          x: 90,
          y: 365,
          cyclomaticWeight: 2,
          isHighRisk: true,
          codeSnippet: 'if (airspeed > 250.0f) thrustAdjustment = -20;',
        },
        {
          id: 'act1',
          label: 'Action: thrustAdjustment = -20',
          sublabel: 'Negative pitch damping',
          type: 'action',
          x: 90,
          y: 440,
          cyclomaticWeight: 0,
          isHighRisk: true,
          codeSnippet: 'thrustAdjustment = -20;',
        },
        {
          id: 'act2',
          label: 'Action: failsafe counter clamp',
          sublabel: 'Fallback pitch offset',
          type: 'action',
          x: 380,
          y: 200,
          cyclomaticWeight: 1,
          codeSnippet: 'thrustAdjustment = (currentPitch > targetPitch) ? -10 : 10;',
        },
        {
          id: 'cond5',
          label: 'Boundary Guard: thrust > 100 ?',
          sublabel: 'Range saturation guard',
          type: 'condition',
          x: 260,
          y: 515,
          cyclomaticWeight: 2,
          isHighRisk: true,
          codeSnippet: 'if (thrustAdjustment > 100 || thrustAdjustment < -100)',
        },
        {
          id: 'exit',
          label: 'Exit: return thrustAdjustment',
          sublabel: 'Output flight control command',
          type: 'exit',
          x: 260,
          y: 590,
          cyclomaticWeight: 0,
          codeSnippet: 'return thrustAdjustment;',
        },
      ]
    : [
        {
          id: 'entry',
          label: 'Entry: cleanFunction()',
          sublabel: 'Input parameter validation',
          type: 'entry',
          x: 260,
          y: 45,
          cyclomaticWeight: 1,
          codeSnippet: 'calculateThrustVectorClean(...)',
        },
        {
          id: 'guard1',
          label: 'Guard 1: airspeed <= 0 || > 500 ?',
          sublabel: 'Early return on invalid range',
          type: 'condition',
          x: 260,
          y: 140,
          cyclomaticWeight: 1,
          codeSnippet: 'if (airspeed <= 0.0f || airspeed > 500.0f) return 0;',
        },
        {
          id: 'guard2',
          label: 'Guard 2: |pitchDelta| < 1.0 ?',
          sublabel: 'Early return on steady state',
          type: 'condition',
          x: 260,
          y: 245,
          cyclomaticWeight: 1,
          codeSnippet: 'if (std::abs(pitchDelta) < 1.0f) return 0;',
        },
        {
          id: 'calc',
          label: 'Linear Proportional Clamp',
          sublabel: 'Single linear transformation',
          type: 'action',
          x: 260,
          y: 350,
          cyclomaticWeight: 0,
          codeSnippet: 'return std::clamp(baseAdjustment, -50, 50);',
        },
        {
          id: 'exit',
          label: 'Exit: return thrust',
          sublabel: 'Deterministic bounded command',
          type: 'exit',
          x: 260,
          y: 450,
          cyclomaticWeight: 0,
          codeSnippet: 'return clampedThrust;',
        },
      ];

  const edges: CFGEdge[] = isBuggyAttitude
    ? [
        { from: 'entry', to: 'cond1' },
        { from: 'cond1', to: 'cond2', label: 'True [Healthy]', isDefectPath: true },
        { from: 'cond1', to: 'act2', label: 'False [Degraded]' },
        { from: 'cond2', to: 'cond3', label: 'True [Unstable]', isDefectPath: true },
        { from: 'cond2', to: 'loop1', label: 'False [Normal]' },
        { from: 'cond3', to: 'cond4', label: 'True [Manual]', isDefectPath: true },
        { from: 'cond4', to: 'act1', label: 'True [V > 250]', isDefectPath: true },
        { from: 'act1', to: 'cond5', isDefectPath: true },
        { from: 'loop1', to: 'cond5' },
        { from: 'act2', to: 'cond5' },
        { from: 'cond5', to: 'exit', isDefectPath: true },
      ]
    : [
        { from: 'entry', to: 'guard1' },
        { from: 'guard1', to: 'exit', label: 'Invalid [Return 0]' },
        { from: 'guard1', to: 'guard2', label: 'Valid Range' },
        { from: 'guard2', to: 'exit', label: 'Stable [Return 0]' },
        { from: 'guard2', to: 'calc', label: 'Needs Thrust' },
        { from: 'calc', to: 'exit' },
      ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1];

  const getNodeColor = (node: CFGNode) => {
    if (highlightMode === 'critical' && node.isHighRisk) {
      return {
        fill: '#4c0519',
        border: '#f43f5e',
        text: '#fda4af',
        glow: 'rgba(244, 63, 94, 0.4)',
      };
    }
    switch (node.type) {
      case 'entry':
      case 'exit':
        return {
          fill: '#022c22',
          border: '#10b981',
          text: '#6ee7b7',
          glow: 'rgba(16, 185, 129, 0.3)',
        };
      case 'loop':
        return {
          fill: '#3b0764',
          border: '#a855f7',
          text: '#d8b4fe',
          glow: 'rgba(168, 85, 247, 0.3)',
        };
      case 'condition':
        return node.isHighRisk
          ? {
              fill: '#450a0a',
              border: '#ef4444',
              text: '#fca5a5',
              glow: 'rgba(239, 68, 68, 0.4)',
            }
          : {
              fill: '#082f49',
              border: '#0284c7',
              text: '#7dd3fc',
              glow: 'rgba(2, 132, 199, 0.3)',
            };
      default:
        return {
          fill: '#0f172a',
          border: '#475569',
          text: '#cbd5e1',
          glow: 'rgba(71, 85, 105, 0.2)',
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-cyan-400 shadow-sm">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>Interactive Control Flow Graph (CFG)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-800/80">
                v(G) = {prediction?.metrics.cyclomaticComplexity || 11}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isBeginnerMode
                ? 'Visual map showing every decision path the computer must evaluate.'
                : 'Directed graph G = (V, E) mapping McCabe Cyclomatic decision complexity.'}
            </p>
          </div>
        </div>

        {/* Highlight Path Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setHighlightMode('critical')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
              highlightMode === 'critical'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/70 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔥 High Risk Path
          </button>
          <button
            onClick={() => setHighlightMode('all')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
              highlightMode === 'all'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/70 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Branches
          </button>
          <button
            onClick={() => setIsSimulatingExecution(!isSimulatingExecution)}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              isSimulatingExecution ? 'text-amber-300 bg-amber-950/40' : 'text-slate-500'
            }`}
            title="Toggle animated data packet flow"
          >
            <Zap className={`h-3 w-3 ${isSimulatingExecution ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingExecution ? 'Active Pulse' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Main Graph Viewport + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* SVG Flowchart Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-3 relative overflow-hidden flex justify-center bg-cyber-grid min-h-[460px]">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/4 w-48 h-48 bg-cyan-500/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-rose-500/5 blur-3xl pointer-events-none" />

          <svg
            viewBox="0 0 520 650"
            className="w-full max-w-[500px] h-auto select-none overflow-visible"
          >
            <defs>
              {/* Arrowhead marker */}
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
              </marker>
              <marker
                id="arrow-defect"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
              </marker>

              {/* Glowing animated pulse gradient */}
              <linearGradient id="flowPulse" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Edge Lines */}
            {edges.map((edge, idx) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const isDefect = edge.isDefectPath && highlightMode === 'critical';
              const strokeColor = isDefect ? '#f43f5e' : '#475569';
              const strokeWidth = isDefect ? 2.5 : 1.5;

              // Path calculation: Bezier curve for smooth flow
              const midY = (fromNode.y + toNode.y) / 2;
              const pathD =
                fromNode.x === toNode.x
                  ? `M ${fromNode.x} ${fromNode.y + 16} L ${toNode.x} ${toNode.y - 16}`
                  : `M ${fromNode.x} ${fromNode.y + 16} C ${fromNode.x} ${midY}, ${toNode.x} ${midY}, ${toNode.x} ${toNode.y - 16}`;

              return (
                <g key={`edge-${idx}`}>
                  {/* Background Edge Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isDefect ? 'none' : '4, 4'}
                    markerEnd={isDefect ? 'url(#arrow-defect)' : 'url(#arrow)'}
                    className="transition-colors duration-300"
                  />

                  {/* Animated glowing particle packet */}
                  {isSimulatingExecution && (
                    <circle r={isDefect ? 3.5 : 2.5} fill={isDefect ? '#f43f5e' : '#22d3ee'}>
                      <animateMotion
                        dur={isDefect ? '1.8s' : '2.6s'}
                        repeatCount="indefinite"
                        path={pathD}
                        keyPoints="0;1"
                        keyTimes="0;1"
                      />
                    </circle>
                  )}

                  {/* Edge Label */}
                  {edge.label && (
                    <text
                      x={(fromNode.x + toNode.x) / 2 + 10}
                      y={midY - 4}
                      fill={isDefect ? '#fda4af' : '#94a3b8'}
                      fontSize={9}
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="bg-slate-950 px-1"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const style = getNodeColor(node);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <rect
                      x={-98}
                      y={-20}
                      width={196}
                      height={40}
                      rx={8}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )}

                  {/* Node Body */}
                  <rect
                    x={-92}
                    y={-16}
                    width={184}
                    height={32}
                    rx={6}
                    fill={style.fill}
                    stroke={style.border}
                    strokeWidth={1.5}
                    style={{ filter: `drop-shadow(0 0 6px ${style.glow})` }}
                  />

                  {/* Node Type Indicator Dot */}
                  <circle
                    cx={-78}
                    cy={0}
                    r={3.5}
                    fill={style.border}
                    className={node.isHighRisk ? 'animate-ping' : ''}
                  />

                  {/* Node Label Text */}
                  <text
                    x={-68}
                    y={-2}
                    fill={style.text}
                    fontSize={9.5}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.label.length > 24 ? node.label.slice(0, 24) + '...' : node.label}
                  </text>
                  <text
                    x={-68}
                    y={9}
                    fill="#94a3b8"
                    fontSize={7.5}
                    fontFamily="sans-serif"
                  >
                    {node.sublabel || node.type}
                  </text>

                  {/* Cyclomatic Weight Pill */}
                  {node.cyclomaticWeight > 0 && (
                    <g transform="translate(74, 0)">
                      <circle
                        r={7}
                        fill={node.isHighRisk ? '#e11d48' : '#0284c7'}
                      />
                      <text
                        x={0}
                        y={2.5}
                        fill="#ffffff"
                        fontSize={7.5}
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        +{node.cyclomaticWeight}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspector Panel */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Node Inspector
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  selectedNode.isHighRisk
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                }`}
              >
                {selectedNode.type}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white font-mono">{selectedNode.label}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedNode.sublabel}</p>
            </div>

            {/* Code Snippet Box */}
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-500 font-mono mb-1">Source Statement:</div>
              <code className="text-xs text-cyan-300 font-mono break-all block">
                {selectedNode.codeSnippet}
              </code>
            </div>

            {/* Impact Metric */}
            <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
              <span className="text-slate-400">Cyclomatic Decision Load:</span>
              <span
                className={`font-mono font-bold ${
                  selectedNode.cyclomaticWeight > 2 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                +{selectedNode.cyclomaticWeight} linearly independent path(s)
              </span>
            </div>

            {/* Explanation */}
            <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50">
              {selectedNode.isHighRisk ? (
                <div className="flex items-start gap-1.5 text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cognitive Danger:</strong> Deep nesting forces the software engineer to hold{' '}
                    {selectedNode.cyclomaticWeight * 2} separate mental conditions concurrently. High correlation
                    with off-by-one errors and null dereferences.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Linear Flow:</strong> Deterministic single-path execution. Easy to write unit tests for
                    and verify boundary coverage.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tip Card */}
          <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">McCabe Rule of Thumb:</span> Any single method where{' '}
              <span className="font-mono text-cyan-300">v(G) &gt; 10</span> statistically accounts for 80% of
              post-release software defects. Click <em>"Apply Clean Guard Clauses"</em> above to see the graph
              collapse into flat, linear pathways!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
