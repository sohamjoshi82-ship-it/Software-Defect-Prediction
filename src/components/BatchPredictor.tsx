import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import type { DatasetMeta, SoftwareModuleRecord, TrainedModelInstance } from '../ml/types.ts';
import { InteractiveTreemapMatrix } from './InteractiveTreemapMatrix.tsx';
import { cyberSound } from '../utils/cyberSound.ts';

interface BatchPredictorProps {
  dataset: DatasetMeta;
  activeModel: TrainedModelInstance | null;
  onCustomDatasetLoaded?: (dataset: DatasetMeta) => void;
  isBeginnerMode?: boolean;
}

export const BatchPredictor: React.FC<BatchPredictorProps> = ({
  dataset,
  activeModel,
  onCustomDatasetLoaded,
  isBeginnerMode = true,
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'defective' | 'clean'>('all');
  const [sortBy, setSortBy] = useState<'prob' | 'loc' | 'vg' | 'name'>('prob');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Compute predictions for all records using active model
  const recordsWithPred = dataset.records.map((rec) => {
    let prob = 0.2;
    if (activeModel) {
      const vec = activeModel.featureNames.map((f: string) => rec.metrics[f] ?? 0);
      const scaled = activeModel.scaler.transformVector(vec);
      const pArr = (activeModel.model as any).predictProbabilities([scaled]);
      prob = pArr[0] ?? 0.2;
    } else {
      prob = rec.defective === 1 ? 0.75 : 0.15;
    }
    const isPredDefect = prob >= (activeModel?.result.testMetrics.threshold || 0.5);
    return {
      ...rec,
      predictedProbability: prob,
      predictedClass: isPredDefect ? (1 as const) : (0 as const),
    };
  });

  // Filter
  const filtered = recordsWithPred.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterRisk === 'high' && (r.predictedProbability ?? 0) < 0.6) return false;
    if (filterRisk === 'defective' && r.defective !== 1) return false;
    if (filterRisk === 'clean' && r.defective !== 0) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (sortBy === 'prob') {
      valA = a.predictedProbability ?? 0;
      valB = b.predictedProbability ?? 0;
    } else if (sortBy === 'loc') {
      valA = a.metrics['loc'] ?? 0;
      valB = b.metrics['loc'] ?? 0;
    } else if (sortBy === 'vg') {
      valA = a.metrics['v_g'] ?? a.metrics['wmc'] ?? 0;
      valB = b.metrics['v_g'] ?? b.metrics['wmc'] ?? 0;
    } else {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleExportCSV = () => {
    const headers = ['ModuleID', 'ModuleName', 'ActualDefective', 'PredictedProbability', 'PredictedClass', 'LOC', 'CyclomaticComplexity'];
    const rows = filtered.map((r) => [
      r.id,
      r.name,
      r.defective,
      (r.predictedProbability ?? 0).toFixed(4),
      r.predictedClass,
      r.metrics['loc'] ?? '',
      r.metrics['v_g'] ?? r.metrics['wmc'] ?? '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${dataset.id}_predictions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${dataset.id}_predictions.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (rawLines.length < 2) {
          console.warn('CSV file must contain at least a header row and one data row.');
          return;
        }
        const headers = rawLines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const newRecords: SoftwareModuleRecord[] = [];

        for (let i = 1; i < rawLines.length; i++) {
          const cols = rawLines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

          const metrics: { [key: string]: number } = {};
          let isDefective: 0 | 1 = 0;

          headers.forEach((h, colIdx) => {
            const val = parseFloat(cols[colIdx]);
            if (h.toLowerCase().includes('defect') || h.toLowerCase() === 'class') {
              const lowerVal = (cols[colIdx] || '').toLowerCase();
              isDefective = val > 0 || lowerVal === 'true' || lowerVal === 'y' || lowerVal === 'yes' ? 1 : 0;
            } else if (!isNaN(val)) {
              metrics[h] = val;
            }
          });

          // Ensure at least LOC or a metric exists
          if (Object.keys(metrics).length === 0) {
            metrics['loc'] = 10;
          }

          newRecords.push({
            id: `CUSTOM_${i}`,
            name: `module_${i}`,
            metrics,
            defective: isDefective,
          });
        }

        const customDataset: DatasetMeta = {
          id: `custom_${Date.now()}`,
          name: file.name.replace('.csv', '') || 'Custom Uploaded Dataset',
          source: 'User CSV Upload',
          domain: 'User Application',
          language: 'Mixed',
          description: `Imported ${newRecords.length} software module records from ${file.name}.`,
          totalModules: newRecords.length,
          defectRate: newRecords.filter((r) => r.defective === 1).length / (newRecords.length || 1),
          featureNames: Object.keys(newRecords[0]?.metrics || {}),
          records: newRecords,
        };

        if (onCustomDatasetLoaded) {
          onCustomDatasetLoaded(customDataset);
        }
      } catch (err) {
        console.error('Failed to parse uploaded CSV:', err);
      }
    };
    reader.readAsText(file);
  };

  const highRiskCount = recordsWithPred.filter((r) => (r.predictedProbability ?? 0) >= 0.6).length;
  const defectiveCount = recordsWithPred.filter((r) => r.defective === 1).length;
  const cleanCount = recordsWithPred.filter((r) => r.defective === 0).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <span>{isBeginnerMode ? 'Project Codebase Files & Bug Risk Explorer' : 'Batch Module Predictor & CSV Dataset Importer'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBeginnerMode
              ? `Evaluate defect risks across all ${dataset.records.length} files in ${dataset.name} to see where bugs hide.`
              : `Evaluate defect risks across all modules in ${dataset.name}, triage testing priorities, or upload your own CSV metrics.`}
          </p>
        </div>

        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5 text-cyan-400" />
            <span>Upload CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 cursor-pointer transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Beginner Guide Banner */}
      {isBeginnerMode && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-800/60 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            <span>How Testing Teams Use This</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In real software engineering, you don't have time to write tests for every single file. Filter by <strong>High Risk</strong> to target the top suspicious functions first. Historical data shows that <strong>80% of software defects</strong> are concentrated in the 20% most complex modules (Pareto Principle)!
          </p>
        </div>
      )}

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setFilterRisk('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            filterRisk === 'all'
              ? 'bg-slate-800 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-950/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          All Files ({recordsWithPred.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setFilterRisk('high')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            filterRisk === 'high'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-md shadow-rose-950/40'
              : 'bg-slate-900 text-rose-400/80 border-slate-800 hover:text-rose-300'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>High Risk Only ({highRiskCount})</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setFilterRisk('defective')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            filterRisk === 'defective'
              ? 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-md shadow-amber-950/40'
              : 'bg-slate-900 text-amber-400/80 border-slate-800 hover:text-amber-300'
          }`}
        >
          <span>Known Bugs ({defectiveCount})</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setFilterRisk('clean')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            filterRisk === 'clean'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/40'
              : 'bg-slate-900 text-emerald-400/80 border-slate-800 hover:text-emerald-300'
          }`}
        >
          <span>Clean & Safe ({cleanCount})</span>
        </motion.button>
      </div>

      {/* Visual Heatmap Treemap Matrix */}
      <InteractiveTreemapMatrix
        records={filtered}
        isBeginnerMode={isBeginnerMode}
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search module name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Risk Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="h-3.5 w-3.5 text-cyan-400 mr-2" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Modules ({recordsWithPred.length})</option>
              <option value="high" className="bg-slate-900">High Risk Prob &gt; 60%</option>
              <option value="defective" className="bg-slate-900">Actual Defective Only</option>
              <option value="clean" className="bg-slate-900">Actual Clean Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400 mr-1.5">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="prob" className="bg-slate-900">Defect Probability</option>
              <option value="vg" className="bg-slate-900">Cyclomatic Complexity v(G)</option>
              <option value="loc" className="bg-slate-900">Lines of Code (LOC)</option>
              <option value="name" className="bg-slate-900">Module Name</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="ml-2 text-cyan-400 hover:text-cyan-300 font-bold"
              title="Toggle sort direction"
            >
              {sortAsc ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950">
                <th className="py-3 px-3">Module ID & Name</th>
                <th className="py-3 px-3">Predicted Defect Risk</th>
                <th className="py-3 px-3">Actual Status</th>
                <th className="py-3 px-3">McCabe v(G)</th>
                <th className="py-3 px-3">Halstead Vol (V)</th>
                <th className="py-3 px-3">LOC</th>
                <th className="py-3 px-3 text-right">Testing Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.slice(0, 50).map((r) => {
                const prob = r.predictedProbability ?? 0;
                const isHighRisk = prob >= 0.6;
                const isModerate = prob >= 0.35 && prob < 0.6;
                const vg = r.metrics['v_g'] ?? r.metrics['wmc'] ?? 1;
                const vol = Math.round(r.metrics['v'] ?? 0);
                const loc = r.metrics['loc'] ?? 0;

                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-white font-medium">{r.name}</div>
                      <div className="text-[10px] text-slate-400">{r.id}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isHighRisk ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {(prob * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isHighRisk ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {r.defective === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-950/70 border border-rose-800 text-rose-300">
                          <ShieldAlert className="h-3 w-3" />
                          Defective
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Clean
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      <span className={vg > 10 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {vg}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {vol > 0 ? vol.toLocaleString() : '--'}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-300">{loc}</td>

                    <td className="py-2.5 px-3 text-right">
                      {isHighRisk ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          P0 - Immediate Inspection
                        </span>
                      ) : isModerate ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          P1 - Automated Tests
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-400">
                          P2 - Standard Pass
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 50 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-400">
            Showing first 50 of {filtered.length} matching software modules. Export CSV to inspect full dataset.
          </div>
        )}
      </div>
    </div>
  );
};
