import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PredictionPage } from './routes/PredictionPage';
import { TrackingPage } from './routes/TrackingPage';
import type { Prediction, ActualResult, ActualBonus } from './types';
import { storageService } from './lib/storage';

function App() {
  const [activeTab, setActiveTab] = useState<'prediction' | 'tracking'>('prediction');

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [actualResults, setActualResults] = useState<Record<number, ActualResult>>({});
  const [actualBonus, setActualBonus] = useState<ActualBonus>({});

  // Bootstrap data on mount
  useEffect(() => {
    const DATA_VERSION = 'v2_correct_groups_clean';
    const currentVersion = localStorage.getItem('wc2026_data_version');
    if (currentVersion !== DATA_VERSION) {
      storageService.clearAll();
      localStorage.setItem('wc2026_data_version', DATA_VERSION);
    }

    // Check if we need to seed data
    const existingPreds = storageService.getPredictions();
    const existingResults = storageService.getActualResults();
    const existingBonus = storageService.getActualBonus();

    setPredictions(existingPreds);
    setActualResults(existingResults);
    setActualBonus(existingBonus);

    // Background cloud sync on mount
    storageService.fetchGlobalPredictions().then((globalPreds) => {
      if (globalPreds && globalPreds.length > 0) {
        // Merge global with local (preferring global updates since they represent submissions)
        const map = new Map<string, Prediction>();
        existingPreds.forEach(p => map.set(p.participantName.trim().toLowerCase(), p));
        globalPreds.forEach(p => map.set(p.participantName.trim().toLowerCase(), p));
        const merged = Array.from(map.values());
        storageService.savePredictions(merged);
        setPredictions(merged);
      }
    });

    storageService.fetchGlobalActualResults().then((globalResults) => {
      if (globalResults) {
        storageService.saveActualResults(globalResults);
        setActualResults(globalResults);
      }
    });

    storageService.fetchGlobalActualBonus().then((globalBonus) => {
      if (globalBonus) {
        storageService.saveActualBonus(globalBonus);
        setActualBonus(globalBonus);
      }
    });
  }, []);

  const handleDataUpdate = (
    updatedPredictions: Prediction[],
    updatedResults: Record<number, ActualResult>,
    updatedBonus: ActualBonus
  ) => {
    setPredictions(updatedPredictions);
    setActualResults(updatedResults);
    setActualBonus(updatedBonus);

    // Save locally
    storageService.savePredictions(updatedPredictions);
    storageService.saveActualResults(updatedResults);
    storageService.saveActualBonus(updatedBonus);

    // Push updates to cloud in background
    storageService.saveGlobalPredictions(updatedPredictions);
    storageService.saveGlobalActualResults(updatedResults);
    storageService.saveGlobalActualBonus(updatedBonus);
  };

  const handleTabChange = (tab: 'prediction' | 'tracking') => {
    setActiveTab(tab);
    setPredictions(storageService.getPredictions());
    setActualResults(storageService.getActualResults());
    setActualBonus(storageService.getActualBonus());
  };

  const handlePredictionSaved = () => {
    setPredictions(storageService.getPredictions());
    setActiveTab('tracking');
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'prediction' ? (
        <PredictionPage onSaveSuccess={handlePredictionSaved} />
      ) : (
        <TrackingPage
          predictions={predictions}
          actualResults={actualResults}
          actualBonus={actualBonus}
          onDataUpdate={handleDataUpdate}
        />
      )}
    </Layout>
  );
}

export default App;
