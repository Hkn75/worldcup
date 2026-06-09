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

    // Check if we need to seed demo data
    const existingPreds = storageService.getPredictions();
    const existingResults = storageService.getActualResults();
    const existingBonus = storageService.getActualBonus();

    // If there are no predictions and no actual results played, load demo data automatically
    const isNewUser = existingPreds.length === 0 && !Object.values(existingResults).some(r => r.played);

    if (isNewUser) {
      storageService.loadDemoData();
      setPredictions(storageService.getPredictions());
      setActualResults(storageService.getActualResults());
      setActualBonus(storageService.getActualBonus());
      // Start in tracking view so user immediately sees the beautiful leaderboard demo
      setActiveTab('tracking');
    } else {
      setPredictions(existingPreds);
      setActualResults(existingResults);
      setActualBonus(existingBonus);
    }
  }, []);

  const handleDataUpdate = (
    updatedPredictions: Prediction[],
    updatedResults: Record<number, ActualResult>,
    updatedBonus: ActualBonus
  ) => {
    setPredictions(updatedPredictions);
    setActualResults(updatedResults);
    setActualBonus(updatedBonus);
  };

  const handleTabChange = (tab: 'prediction' | 'tracking') => {
    setActiveTab(tab);
    // Refresh state from storage to sync updates
    setPredictions(storageService.getPredictions());
    setActualResults(storageService.getActualResults());
    setActualBonus(storageService.getActualBonus());
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'prediction' ? (
        <PredictionPage />
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
