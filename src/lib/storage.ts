import type { Prediction, ActualResult, ActualBonus } from '../types';

const PREDICTIONS_KEY = 'wc2026_predictions';
const ACTUAL_RESULTS_KEY = 'wc2026_actual_results';
const ACTUAL_BONUS_KEY = 'wc2026_actual_bonus';
const DRAFT_PREDICTION_KEY = 'wc2026_draft_prediction';

/**
 * Initializes a clean set of actual results for all 104 matches.
 */
export const initializeActualResults = (): Record<number, ActualResult> => {
  const results: Record<number, ActualResult> = {};
  for (let id = 1; id <= 104; id++) {
    results[id] = {
      matchId: id,
      homeGoals: 0,
      awayGoals: 0,
      played: false
    };
  }
  return results;
};

/**
 * Service layer for saving/loading data. Can be replaced with Firestore/Supabase calls later.
 */
export const storageService = {
  getPredictions: (): Prediction[] => {
    try {
      const data = localStorage.getItem(PREDICTIONS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Predictions parse error, resetting...', e);
      return [];
    }
  },

  savePredictions: (predictions: Prediction[]): void => {
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(predictions));
  },

  getActualResults: (): Record<number, ActualResult> => {
    try {
      const data = localStorage.getItem(ACTUAL_RESULTS_KEY);
      if (!data) {
        const initial = initializeActualResults();
        localStorage.setItem(ACTUAL_RESULTS_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(data);
      // Ensure all 104 matches exist
      for (let i = 1; i <= 104; i++) {
        if (!parsed[i]) {
          parsed[i] = { matchId: i, homeGoals: 0, awayGoals: 0, played: false };
        }
      }
      return parsed;
    } catch (e) {
      console.error('Actual results parse error, resetting...', e);
      const initial = initializeActualResults();
      localStorage.setItem(ACTUAL_RESULTS_KEY, JSON.stringify(initial));
      return initial;
    }
  },

  saveActualResults: (results: Record<number, ActualResult>): void => {
    localStorage.setItem(ACTUAL_RESULTS_KEY, JSON.stringify(results));
  },

  getActualBonus: (): ActualBonus => {
    try {
      const data = localStorage.getItem(ACTUAL_BONUS_KEY);
      if (!data) return {};
      return JSON.parse(data);
    } catch (e) {
      console.error('Actual bonus parse error, resetting...', e);
      return {};
    }
  },

  saveActualBonus: (bonus: ActualBonus): void => {
    localStorage.setItem(ACTUAL_BONUS_KEY, JSON.stringify(bonus));
  },

  getDraftPrediction: (): Prediction | null => {
    try {
      const data = localStorage.getItem(DRAFT_PREDICTION_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('Draft prediction parse error...', e);
      return null;
    }
  },

  saveDraftPrediction: (draft: Prediction): void => {
    localStorage.setItem(DRAFT_PREDICTION_KEY, JSON.stringify(draft));
  },

  clearDraftPrediction: (): void => {
    localStorage.removeItem(DRAFT_PREDICTION_KEY);
  },

  clearAll: (): void => {
    localStorage.removeItem(PREDICTIONS_KEY);
    localStorage.removeItem(ACTUAL_RESULTS_KEY);
    localStorage.removeItem(ACTUAL_BONUS_KEY);
    localStorage.removeItem(DRAFT_PREDICTION_KEY);
  },

  loadDemoData: (): void => {
    // Generate some mock results
    const actualResults = initializeActualResults();

    // Create 3 mock participants
    const now = new Date().toISOString();
    
    const p1: Prediction = {
      participantName: 'Ahmet Yılmaz',
      groupPredictions: {},
      knockoutPredictions: {},
      bonus: { champion: 'ARG', runnerUp: 'FRA', third: 'BRA', fourth: 'ENG' },
      createdAt: now,
      updatedAt: now
    };
    
    const p2: Prediction = {
      participantName: 'Zeynep Kaya',
      groupPredictions: {},
      knockoutPredictions: {},
      bonus: { champion: 'BRA', runnerUp: 'ESP', third: 'FRA', fourth: 'GER' },
      createdAt: now,
      updatedAt: now
    };

    const p3: Prediction = {
      participantName: 'Mehmet Demir',
      groupPredictions: {},
      knockoutPredictions: {},
      bonus: { champion: 'FRA', runnerUp: 'ARG', third: 'GER', fourth: 'POR' },
      createdAt: now,
      updatedAt: now
    };

    // Fill standard empty group predictions for all 72 matches
    for (let id = 1; id <= 72; id++) {
      p1.groupPredictions[id] = { homeGoals: 1, awayGoals: 1 };
      p2.groupPredictions[id] = { homeGoals: 2, awayGoals: 1 };
      p3.groupPredictions[id] = { homeGoals: 0, awayGoals: 0 };
    }

    storageService.savePredictions([p1, p2, p3]);
    storageService.saveActualResults(actualResults);
    storageService.saveActualBonus({});
  }
};
