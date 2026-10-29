import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { TrainingStudio } from './components/TrainingStudio.tsx';
import { EvaluationStudio } from './components/EvaluationStudio.tsx';
import { LiveCodeScanner } from './components/LiveCodeScanner.tsx';
import { BatchPredictor } from './components/BatchPredictor.tsx';
import { QuickStartWizardModal } from './components/QuickStartWizardModal.tsx';
import { MetricsEncyclopediaModal } from './components/MetricsEncyclopediaModal.tsx';
import { DeployGuideModal } from './components/DeployGuideModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { BENCHMARK_DATASETS } from './ml/datasets.ts';
import { MLModelManager } from './ml/modelManager.ts';
import type { DatasetMeta, TrainedModelInstance } from './ml/types.ts';

export default function App() {
  const modelManager = useMemo(() => new MLModelManager(), []);

  const [currentDataset, setCurrentDataset] = useState<DatasetMeta>(BENCHMARK_DATASETS[0]);
  const [activeModel, setActiveModel] = useState<TrainedModelInstance | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'training' | 'evaluation' | 'scanner' | 'batch'>('dashboard');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isDeployOpen, setIsDeployOpen] = useState<boolean>(false);
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Train initial model when dataset changes or on mount
  useEffect(() => {
    setIsTraining(true);
    try {
      const trained = modelManager.trainModel({
        dataset: currentDataset,
        modelType: 'random_forest',
        testSplitRatio: 0.25,
        useSmote: true,
        threshold: 0.5,
      });
      setActiveModel(trained);
      showNotification(`Loaded ${currentDataset.name} & initialized Random Forest model.`);
    } catch (e) {
      console.error('Failed to train baseline model:', e);
    } finally {
      setIsTraining(false);
    }
  }, [currentDataset, modelManager]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Scroll to top on tab switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const handleRetrain = () => {
    if (!activeModel) return;
    setIsTraining(true);
    setTimeout(() => {
      try {
        const trained = modelManager.trainModel({
          dataset: currentDataset,
          modelType: activeModel.type,
          testSplitRatio: 0.25,
          useSmote: true,
          threshold: activeModel.result.testMetrics.threshold || 0.5,
        });
        setActiveModel(trained);
        showNotification(`Retrained ${trained.name} on ${currentDataset.name}!`);
      } finally {
        setIsTraining(false);
      }
    }, 40);
  };

  const handleCustomDatasetLoaded = (newDataset: DatasetMeta) => {
    setCurrentDataset(newDataset);
    showNotification(`Imported custom dataset: ${newDataset.name} with ${newDataset.totalModules} modules.`);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-900 selection:text-white">
        {/* Top Header */}
        <Header
          currentDataset={currentDataset}
          onSelectDataset={setCurrentDataset}
          activeModel={activeModel}
          onRetrain={handleRetrain}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenWizard={() => setIsWizardOpen(true)}
          onOpenDeploy={() => setIsDeployOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isTraining={isTraining}
          isBeginnerMode={isBeginnerMode}
          setIsBeginnerMode={setIsBeginnerMode}
        />

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/60 shadow-xl shadow-cyan-950/50 rounded-xl px-4 py-2.5 text-xs text-cyan-200 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <DashboardOverview
                dataset={currentDataset}
                activeModel={activeModel}
                onNavigateTab={setActiveTab}
                isBeginnerMode={isBeginnerMode}
              />
            )}

            {activeTab === 'training' && (
              <TrainingStudio
                dataset={currentDataset}
                activeModel={activeModel}
                modelManager={modelManager}
                onModelTrained={(model) => {
                  setActiveModel(model);
                  showNotification(`Active model updated: ${model.name}`);
                }}
                isTraining={isTraining}
                setIsTraining={setIsTraining}
                isBeginnerMode={isBeginnerMode}
              />
            )}

            {activeTab === 'evaluation' && (
              <EvaluationStudio
                activeModel={activeModel}
                isBeginnerMode={isBeginnerMode}
              />
            )}

            {activeTab === 'scanner' && (
              <LiveCodeScanner
                activeModel={activeModel}
                modelManager={modelManager}
                isBeginnerMode={isBeginnerMode}
              />
            )}

            {activeTab === 'batch' && (
              <BatchPredictor
                dataset={currentDataset}
                activeModel={activeModel}
                onCustomDatasetLoaded={handleCustomDatasetLoaded}
                isBeginnerMode={isBeginnerMode}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>DefectPredict AI &bull; Empirical Software Quality Engineering</span>
            <button
              onClick={() => setIsBeginnerMode(!isBeginnerMode)}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              Mode: {isBeginnerMode ? 'Beginner Friendly' : 'Expert'}
            </button>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="hover:text-cyan-400 underline underline-offset-2 cursor-pointer"
            >
              60-Second Quick Tour
            </button>
            <button
              onClick={() => setIsDeployOpen(true)}
              className="hover:text-cyan-400 text-cyan-300 font-medium underline underline-offset-2 cursor-pointer"
            >
              Deploy to Vercel
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-cyan-400 underline underline-offset-2 cursor-pointer"
            >
              Metrics Documentation
            </button>
          </div>
        </div>
      </footer>

      {/* Beginner Quick Guide Modal */}
      <QuickStartWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onStartSample={() => {
          setIsWizardOpen(false);
          setActiveTab('scanner');
        }}
      />

      {/* Reference Encyclopedia Modal */}
      <MetricsEncyclopediaModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* 1-Click Vercel / Cloud Deployment Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
      />
    </div>
    </ErrorBoundary>
  );
}
