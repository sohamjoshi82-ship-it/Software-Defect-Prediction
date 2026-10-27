import React, { useRef, useEffect, useState } from 'react';
import type { SoftwareModuleRecord } from '../ml/types.ts';
import { cyberSound } from '../utils/cyberSound.ts';

interface RadarNode {
  x: number;
  y: number;
  z: number; // 3D coordinate for orbital mode
  angle: number;
  dist: number; // 0 to 1
  defective: boolean;
  prob: number;
  name: string;
  loc: number;
  vg: number;
  volume: number;
  pingTime: number;
}

interface CyberRadarCanvasProps {
  records?: SoftwareModuleRecord[];
  width?: number;
  height?: number;
  className?: string;
  interactive?: boolean;
}

export type RadarDisplayMode = 'radar' | 'orbit3d' | 'phasespace';

export const CyberRadarCanvas: React.FC<CyberRadarCanvasProps> = ({
  records = [],
  width = 240,
  height = 240,
  className = '',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [displayMode, setDisplayMode] = useState<RadarDisplayMode>('radar');
  const [hoveredNode, setHoveredNode] = useState<RadarNode | null>(null);
  const nodesRef = useRef<RadarNode[]>([]);
  const sweepAngleRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // 3D Orbital rotation state
  const rotXRef = useRef<number>(0.2);
  const rotYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastSoundTimeRef = useRef<number>(0);

  // Initialize or map nodes from records
  useEffect(() => {
    const sampleRecords = records.length > 0 ? records.slice(0, 48) : [];
    const count = Math.max(36, sampleRecords.length);
    const newNodes: RadarNode[] = [];

    for (let i = 0; i < count; i++) {
      const rec = sampleRecords[i % sampleRecords.length];
      const isDefect = rec ? rec.defective === 1 : i % 5 === 0;
      const vg = rec ? rec.metrics['v_g'] || rec.metrics['wmc'] || 5 : isDefect ? 14 : 3;
      const loc = rec ? rec.metrics['loc'] || 30 : 45;
      const volume = rec ? rec.metrics['v'] || 250 : isDefect ? 800 : 150;

      // Base radius correlated with defect probability / complexity
      const baseDist = isDefect ? 0.45 + (i % 5) * 0.1 : 0.15 + (i % 7) * 0.08;
      const dist = Math.min(0.92, Math.max(0.12, baseDist));
      const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.2;

      // Spherical coordinates for 3D Orbit
      const phi = (i / count) * Math.PI * 2;
      const theta = Math.acos(2 * (i / count) - 1);
      const sphereRadius = 0.85;
      const x3d = sphereRadius * Math.sin(theta) * Math.cos(phi);
      const y3d = sphereRadius * Math.sin(theta) * Math.sin(phi);
      const z3d = sphereRadius * Math.cos(theta);

      newNodes.push({
        x: 0,
        y: 0,
        z: z3d,
        angle,
        dist,
        defective: isDefect,
        prob: isDefect ? 0.72 + (i % 4) * 0.06 : 0.12 + (i % 3) * 0.05,
        name: rec ? rec.name : `module_sub_${i}`,
        loc,
        vg,
        volume,
        pingTime: 0,
      });
    }

    nodesRef.current = newNodes;
  }, [records]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const centerX = (width * dpr) / 2;
    const centerY = (height * dpr) / 2;
    const maxRadius = (Math.min(width, height) * dpr) / 2 - 14 * dpr;

    const render = (timestamp: number) => {
      if (!isMounted) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radial background gradient
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
      bgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      bgGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.5)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      if (displayMode === 'radar') {
        // --- MODE 1: TACTICAL RADAR SWEEP ---

        // Concentric Range Rings
        const ringSteps = [0.25, 0.5, 0.75, 1.0];
        ringSteps.forEach((step, idx) => {
          ctx.beginPath();
          ctx.arc(centerX, centerY, maxRadius * step, 0, Math.PI * 2);
          ctx.strokeStyle = idx === 3 ? 'rgba(6, 182, 212, 0.45)' : 'rgba(148, 163, 184, 0.14)';
          ctx.lineWidth = (idx === 3 ? 1.5 : 0.8) * dpr;
          if (idx < 3) ctx.setLineDash([3 * dpr, 4 * dpr]);
          else ctx.setLineDash([]);
          ctx.stroke();

          // Distance label
          ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.font = `${8 * dpr}px monospace`;
          ctx.fillText(`${Math.round(step * 100)}%`, centerX + 4 * dpr, centerY - maxRadius * step + 10 * dpr);
        });
        ctx.setLineDash([]);

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(centerX - maxRadius, centerY);
        ctx.lineTo(centerX + maxRadius, centerY);
        ctx.moveTo(centerX, centerY - maxRadius);
        ctx.lineTo(centerX, centerY + maxRadius);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
        ctx.lineWidth = 0.8 * dpr;
        ctx.stroke();

        // Advance radar sweep angle
        sweepAngleRef.current = (sweepAngleRef.current + 0.024) % (Math.PI * 2);
        const currentAngle = sweepAngleRef.current;

        // Draw sweeping beam (gradient cone)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, currentAngle - 0.5, currentAngle);
        ctx.closePath();
        const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.38)');
        sweepGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.12)');
        sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        // Sharp leading sweep edge
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(currentAngle) * maxRadius, centerY + Math.sin(currentAngle) * maxRadius);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
        ctx.lineWidth = 1.6 * dpr;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
        ctx.shadowBlur = 6 * dpr;
        ctx.stroke();
        ctx.restore();

        // Draw Nodes
        nodesRef.current.forEach((node) => {
          const nx = centerX + Math.cos(node.angle) * (node.dist * maxRadius);
          const ny = centerY + Math.sin(node.angle) * (node.dist * maxRadius);
          node.x = nx;
          node.y = ny;

          // Check if radar sweep just passed this node's angle
          const angleDiff = (currentAngle - node.angle + Math.PI * 4) % (Math.PI * 2);
          if (angleDiff < 0.08) {
            node.pingTime = timestamp;
            if (node.defective && timestamp - lastSoundTimeRef.current > 800) {
              cyberSound.playRadarPing(880);
              lastSoundTimeRef.current = timestamp;
            }
          }

          const timeSincePing = timestamp - node.pingTime;
          const isPingedRecently = timeSincePing < 1200;
          const pingAlpha = isPingedRecently ? Math.max(0, 1 - timeSincePing / 1200) : 0;

          // Expanding ping ripple ring
          if (isPingedRecently) {
            const rippleRadius = (3 + (timeSincePing / 1200) * 18) * dpr;
            ctx.beginPath();
            ctx.arc(nx, ny, rippleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = node.defective
              ? `rgba(244, 63, 94, ${pingAlpha * 0.85})`
              : `rgba(34, 211, 238, ${pingAlpha * 0.75})`;
            ctx.lineWidth = 1 * dpr;
            ctx.stroke();
          }

          // Draw node dot
          ctx.beginPath();
          const baseRadius = (node.defective ? 3.5 : 2.5) * dpr;
          ctx.arc(nx, ny, baseRadius, 0, Math.PI * 2);
          if (node.defective) {
            ctx.fillStyle = isPingedRecently ? '#fda4af' : '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = isPingedRecently ? 9 * dpr : 2 * dpr;
          } else {
            ctx.fillStyle = isPingedRecently ? '#a5f3fc' : '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = isPingedRecently ? 6 * dpr : 1 * dpr;
          }
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      } else if (displayMode === 'orbit3d') {
        // --- MODE 2: 3D ORBITAL CONSTELLATION ---
        if (!isDraggingRef.current) {
          rotYRef.current += 0.008; // auto orbit
        }

        const cosY = Math.cos(rotYRef.current);
        const sinY = Math.sin(rotYRef.current);
        const cosX = Math.cos(rotXRef.current);
        const sinX = Math.sin(rotXRef.current);

        // Perspective projection & depth sort
        interface Projected3DNode {
          node: RadarNode;
          px: number;
          py: number;
          depth: number;
          scale: number;
        }

        const projectedList: Projected3DNode[] = nodesRef.current.map((node) => {
          // Base sphere coords from initial angle & dist
          const basePhi = node.angle;
          const baseTheta = (node.dist * Math.PI) - Math.PI / 2;
          const r = maxRadius * 0.85;

          const x0 = r * Math.cos(baseTheta) * Math.cos(basePhi);
          const y0 = r * Math.sin(baseTheta);
          const z0 = r * Math.cos(baseTheta) * Math.sin(basePhi);

          // Apply rotation Y
          const x1 = x0 * cosY - z0 * sinY;
          const z1 = x0 * sinY + z0 * cosY;

          // Apply rotation X
          const y2 = y0 * cosX - z1 * sinX;
          const z2 = y0 * sinX + z1 * cosX;

          // Perspective projection
          const fov = 350 * dpr;
          const cameraZ = 320 * dpr;
          const depth = z2 + cameraZ;
          const scale = Math.max(0.2, fov / (depth || 1));

          const px = centerX + x1 * scale;
          const py = centerY + y2 * scale;
          node.x = px;
          node.y = py;

          return { node, px, py, depth: z2, scale };
        });

        // Depth sort: back to front
        projectedList.sort((a, b) => a.depth - b.depth);

        // Draw subtle connecting constellation lines between nearest neighbors
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 0.7 * dpr;
        for (let i = 0; i < projectedList.length; i++) {
          const a = projectedList[i];
          for (let j = i + 1; j < Math.min(i + 4, projectedList.length); j++) {
            const b = projectedList[j];
            const distSq = (a.px - b.px) ** 2 + (a.py - b.py) ** 2;
            if (distSq < (50 * dpr) ** 2) {
              ctx.beginPath();
              ctx.moveTo(a.px, a.py);
              ctx.lineTo(b.px, b.py);
              ctx.stroke();
            }
          }
        }

        // Draw 3D nodes with depth fog
        projectedList.forEach(({ node, px, py, depth, scale }) => {
          const depthAlpha = Math.max(0.25, Math.min(1, 0.6 + depth / (maxRadius * 1.5)));
          const radius = (node.defective ? 4 : 2.8) * scale * dpr;

          ctx.beginPath();
          ctx.arc(px, py, Math.max(1.2, radius), 0, Math.PI * 2);
          if (node.defective) {
            ctx.fillStyle = `rgba(244, 63, 94, ${depthAlpha})`;
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = (node.defective ? 8 : 4) * dpr;
          } else {
            ctx.fillStyle = `rgba(34, 211, 238, ${depthAlpha})`;
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 4 * dpr;
          }
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // 3D Orbit hint label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = `${8 * dpr}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('DRAG TO ROTATE 3D ORBIT', centerX, centerY + maxRadius - 6 * dpr);
        ctx.textAlign = 'start';
      } else {
        // --- MODE 3: PHASE-SPACE METRIC SCATTER (v(G) vs Halstead Volume) ---
        // Axes
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        // X-axis: Cyclomatic Complexity v(G)
        ctx.moveTo(centerX - maxRadius * 0.8, centerY + maxRadius * 0.7);
        ctx.lineTo(centerX + maxRadius * 0.8, centerY + maxRadius * 0.7);
        // Y-axis: Halstead Volume
        ctx.moveTo(centerX - maxRadius * 0.8, centerY + maxRadius * 0.7);
        ctx.lineTo(centerX - maxRadius * 0.8, centerY - maxRadius * 0.7);
        ctx.stroke();

        // High-risk boundary threshold line (v(G) = 10)
        const thresholdX = centerX - maxRadius * 0.8 + (10 / 25) * (maxRadius * 1.6);
        ctx.beginPath();
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.moveTo(thresholdX, centerY + maxRadius * 0.7);
        ctx.lineTo(thresholdX, centerY - maxRadius * 0.7);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';
        ctx.font = `${7.5 * dpr}px monospace`;
        ctx.fillText('v(G)>10 RISK ZONE', thresholdX + 4 * dpr, centerY - maxRadius * 0.55);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillText('v(G) Complexity →', centerX + 10 * dpr, centerY + maxRadius * 0.85);

        // Plot scatter points
        nodesRef.current.forEach((node) => {
          const normVg = Math.min(1, (node.vg || 1) / 25);
          const normVol = Math.min(1, (node.volume || 100) / 1200);

          const px = centerX - maxRadius * 0.8 + normVg * (maxRadius * 1.6);
          const py = centerY + maxRadius * 0.7 - normVol * (maxRadius * 1.4);
          node.x = px;
          node.y = py;

          ctx.beginPath();
          ctx.arc(px, py, (node.defective ? 3.5 : 2.5) * dpr, 0, Math.PI * 2);
          ctx.fillStyle = node.defective ? '#f43f5e' : '#06b6d4';
          ctx.fill();
        });
      }

      // Outer Bezel Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [width, height, displayMode]);

  // Mouse interaction: Hover & Drag for 3D rotation
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingRef.current && displayMode === 'orbit3d') {
      const dx = mx - lastMouseRef.current.x;
      const dy = my - lastMouseRef.current.y;
      rotYRef.current += dx * 0.012;
      rotXRef.current = Math.max(-1.2, Math.min(1.2, rotXRef.current - dy * 0.012));
    }
    lastMouseRef.current = { x: mx, y: my };

    if (!interactive) return;

    // Hit test hovered node
    const dpr = window.devicePixelRatio || 1;
    const hitRadius = 14;
    const hit = nodesRef.current.find((node) => {
      const dist = Math.hypot(node.x / dpr - mx, node.y / dpr - my);
      return dist < hitRadius;
    });

    setHoveredNode(hit || null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      lastMouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Mode Switcher Bar */}
      <div className="flex items-center gap-1 mb-2 bg-slate-950/80 border border-slate-800/80 p-0.5 rounded-lg text-[10px] font-mono">
        <button
          onClick={() => {
            setDisplayMode('radar');
            cyberSound.playClick();
          }}
          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
            displayMode === 'radar'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sweep Radar
        </button>
        <button
          onClick={() => {
            setDisplayMode('orbit3d');
            cyberSound.playClick();
          }}
          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
            displayMode === 'orbit3d'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          3D Orbit
        </button>
        <button
          onClick={() => {
            setDisplayMode('phasespace');
            cyberSound.playClick();
          }}
          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
            displayMode === 'phasespace'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          v(G) Scatter
        </button>
      </div>

      {/* Canvas container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{ width, height }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setHoveredNode(null);
          }}
          className="rounded-full shadow-2xl cursor-grab active:cursor-grabbing border border-slate-800/80"
        />

        {/* Hover HUD Tooltip */}
        {hoveredNode && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-950/95 border border-slate-700/80 text-white rounded-lg p-2.5 shadow-2xl backdrop-blur-md min-w-[150px] text-xs"
            style={{
              left: `${hoveredNode.x / (window.devicePixelRatio || 1)}px`,
              top: `${hoveredNode.y / (window.devicePixelRatio || 1)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
              <span className="font-mono text-[10px] font-bold text-slate-300 truncate max-w-[100px]">
                {hoveredNode.name}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  hoveredNode.defective
                    ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                }`}
              >
                {hoveredNode.defective ? 'DEFECT' : 'CLEAN'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400 font-mono">
              <span>Risk:</span>
              <span className={hoveredNode.defective ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {(hoveredNode.prob * 100).toFixed(0)}%
              </span>
              <span>v(G):</span>
              <span className="text-white">{hoveredNode.vg}</span>
              <span>LOC:</span>
              <span className="text-white">{hoveredNode.loc}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend / Status line */}
      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          <span>Clean Module</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
          <span>Defect Detected</span>
        </span>
      </div>
    </div>
  );
};
