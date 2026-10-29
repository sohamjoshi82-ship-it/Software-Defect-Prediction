import React from 'react';
import { motion } from 'motion/react';
import {
  Bug,
  Database,
  Cpu,
  BookOpen,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Radar,
  Volume2,
  VolumeX,
  Rocket,
} from 'lucide-react';
import type { DatasetMeta, TrainedModelInstance } from '../ml/types.ts';
import { BENCHMARK_DATASETS } from '../ml/datasets.ts';
import { cyberSound } from '../utils/cyberSound.ts';

interface HeaderProps {
  currentDataset: DatasetMeta;
  onSelectDataset: (dataset: DatasetMeta) => void;
  activeModel: TrainedModelInstance | null;
  onRetrain: () => void;
  onOpenGuide: () => void;
  onOpenWizard: () => void;
  onOpenDeploy: () => void;
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
  onOpenDeploy,
  activeTab,
  setActiveTab,
  isTraining,
  isBeginnerMode,
  setIsBeginnerMode,
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(cyberSound.isEnabled());

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    cyberSound.setEnabled(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      cyberSound.playCleanChime();
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => cyberSound.playCleanChime()}
            className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 p-0.5 shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-cyber-dots opacity-40" />
              <Bug className="h-5 w-5 text-rose-400 relative z-10" />
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                DefectPredict <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-800/80 shadow-sm">AI ML</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 font-medium hidden sm:inline-block">
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
          {/* Cyber Audio Synthesizer Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleSound}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-600/80 shadow-sm shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={soundEnabled ? 'Acoustic UI Audio Enabled (Click to Mute)' : 'Enable Cyber Acoustic Feedback'}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
          </motion.button>

          {/* Beginner vs Expert Toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              cyberSound.playClick();
              setIsBeginnerMode(!isBeginnerMode);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-sm ${
              isBeginnerMode
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70 hover:bg-emerald-900/80'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle between simple plain-English view and advanced data science metrics"
          >
            <span className={`h-2 w-2 rounded-full ${isBeginnerMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isBeginnerMode ? 'Beginner Friendly' : 'Expert View'}</span>
          </motion.button>

          {/* 60-Second Quick Tour */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              cyberSound.playClick();
              onOpenWizard();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-200 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>Quick Tour</span>
          </motion.button>

          {/* 1-Click Deploy Guide */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              cyberSound.playClick();
              onOpenDeploy();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/80 text-cyan-200 shadow-sm shadow-cyan-950/60 transition-colors cursor-pointer"
            title="Deploy to Vercel, Netlify, or Docker in 1 click"
          >
            <Rocket className="h-3.5 w-3.5 text-cyan-400" />
            <span>Deploy</span>
          </motion.button>

          {/* Dataset Selector with human-friendly names */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 shadow-sm">
            <Database className="h-3.5 w-3.5 text-cyan-400 mr-2 shrink-0" />
            <span className="text-slate-400 mr-1.5 hidden sm:inline">
              {isBeginnerMode ? 'Software:' : 'Benchmark:'}
            </span>
            <select
              aria-label="Benchmark Dataset"
              value={currentDataset.id}
              onChange={(e) => {
                const found = BENCHMARK_DATASETS.find((d) => d.id === e.target.value);
                if (found) {
                  cyberSound.playClick();
                  onSelectDataset(found);
                }
              }}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              {BENCHMARK_DATASETS.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-950 text-white">
                  {d.name} ({Math.round(d.defectRate * 100)}% defects)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Retrain */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              cyberSound.playLaserScan();
              onRetrain();
            }}
            disabled={isTraining}
            aria-label="Retrain Active Model"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-950/60 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTraining ? 'animate-spin' : ''}`} />
            <span>{isTraining ? 'Training...' : 'Retrain'}</span>
          </motion.button>

          {/* Reference Guide */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              cyberSound.playClick();
              onOpenGuide();
            }}
            aria-label="Open Software Metrics Encyclopedia"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Metrics Guide</span>
          </motion.button>
        </div>
      </div>

      {/* Navigation Tabs with Silky Sliding Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto border-t border-slate-800/80 scrollbar-none py-1">
        <nav className="flex space-x-1.5" aria-label="Main Navigation">
          {[
            {
              id: 'dashboard',
              label: isBeginnerMode ? 'Dashboard & Summary' : 'Dashboard & Telemetry',
            },
            {
              id: 'scanner',
              label: isBeginnerMode ? 'Scan Code & Fix Bugs' : 'Live Code Scanner & CFG',
            },
            {
              id: 'training',
              label: isBeginnerMode ? 'Train & Compare AI Models' : 'Model Training & Matrix',
            },
            {
              id: 'evaluation',
              label: isBeginnerMode ? 'Accuracy & Cost Savings' : 'Evaluation & ROC Analysis',
            },
            {
              id: 'batch',
              label: isBeginnerMode ? 'View Project Files (CSV)' : 'Batch Modules & Heatmap',
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  cyberSound.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`relative px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-slate-900 border border-cyan-500/40 rounded-lg shadow-sm shadow-cyan-950/50"
                    transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
