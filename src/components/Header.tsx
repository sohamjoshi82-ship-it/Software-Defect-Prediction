import React from 'react';
import {
  Bug,
  Database,
  Cpu,
  BookOpen,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import type { DatasetMeta, TrainedModelInstance } from '../ml/types.ts';
import { BENCHMARK_DATASETS } from '../ml/datasets.ts';

interface HeaderProps {
  currentDataset: DatasetMeta;
  onSelectDataset: (dataset: DatasetMeta) => void;
  activeModel: TrainedModelInstance | null;
  onRetrain: () => void;
  onOpenGuide: () => void;
  onOpenWizard: () => void;
  activeTab: 'dashboard' | 'training' | 'evaluation' | 'scanner' | 'batch';
  setActiveTab: (tab: 'dashboard' | 'training' | 'evaluation' | 'scanner' | 'batch') => void;
  isTraining: boolean;
  isBeginnerMode: boolean;
  setIsBeginnerMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDataset,
  onSelectDataset,
  activeModel,
  onRetrain,
  onOpenGuide,
  onOpenWizard,
  activeTab,
  setActiveTab,
  isTraining,
  isBeginnerMode,
  setIsBeginnerMode,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-rose-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bug className="h-5 w-5 text-rose-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                DefectPredict <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">ML</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-medium hidden sm:inline-block">
                {isBeginnerMode ? 'Bug Detection Made Easy' : 'Software QA Intelligence'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isBeginnerMode
                ? 'Scan code, estimate bug risk, and auto-fix complex logic'
                : 'McCabe \u2022 Halstead \u2022 CK Metrics \u2022 Empirical Machine Learning'}
            </p>
          </div>
        </div>

        {/* Dataset & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Beginner vs Expert Toggle */}
          <button
            onClick={() => setIsBeginnerMode(!isBeginnerMode)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-sm ${
              isBeginnerMode
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70 hover:bg-emerald-900/80'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle between simple plain-English view and advanced data science metrics"
          >
            <span className={`h-2 w-2 rounded-full ${isBeginnerMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isBeginnerMode ? 'Beginner Friendly' : 'Expert View'}</span>
          </button>

          {/* 60-Second Quick Tour */}
          <button
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-200 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Quick Tour</span>
          </button>

          {/* Dataset Selector with human-friendly names */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200">
            <Database className="h-3.5 w-3.5 text-cyan-400 mr-2 shrink-0" />
            <span className="text-slate-400 mr-1.5 hidden sm:inline">
              {isBeginnerMode ? 'Software:' : 'Benchmark:'}
            </span>
            <select
              aria-label="Benchmark Dataset"
              value={currentDataset.id}
              onChange={(e) => {
                const found = BENCHMARK_DATASETS.find((d) => d.id === e.target.value);
                if (found) onSelectDataset(found);
              }}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              {BENCHMARK_DATASETS.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name} ({Math.round(d.defectRate * 100)}% defects)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Retrain */}
          <button
            onClick={onRetrain}
            disabled={isTraining}
            aria-label="Retrain Active Model"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTraining ? 'animate-spin' : ''}`} />
            <span>{isTraining ? 'Training...' : 'Retrain'}</span>
          </button>

          {/* Reference Guide */}
          <button
            onClick={onOpenGuide}
            aria-label="Open Software Metrics Encyclopedia"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Metrics Guide</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto border-t border-slate-800/80 scrollbar-none">
        <nav className="flex space-x-1 py-1" aria-label="Main Navigation">
          {[
            {
              id: 'dashboard',
              label: isBeginnerMode ? 'Dashboard & Summary' : 'Dashboard & Telemetry',
            },
            {
              id: 'scanner',
              label: isBeginnerMode ? 'Scan Code & Fix Bugs' : 'Live Code Scanner & XAI',
            },
            {
              id: 'training',
              label: isBeginnerMode ? 'Train & Compare AI Models' : 'Model Training & Benchmarks',
            },
            {
              id: 'evaluation',
              label: isBeginnerMode ? 'Accuracy & Cost Savings' : 'Evaluation & ROC Analysis',
            },
            {
              id: 'batch',
              label: isBeginnerMode ? 'View Project Files (CSV)' : 'Batch Modules & CSV Upload',
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
