export interface Team {
  id: string; // e.g., "USA"
  name: string; // e.g., "ABD"
  group: string; // e.g., "A" - "L"
  flag: string; // e.g., "us", "mx", "ca" (for flagcdn.com) or emoji flag
  seed: number; // rank/seed for tie-breakers
}

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace' | 'final';

export interface Match {
  id: number; // 1 to 104
  stage: Stage;
  group?: string; // "A" - "L" for group stage
  homeTeamId: string; // team ID or placeholder e.g., "W_A" (Winner Group A) or "3_ABCDEF"
  awayTeamId: string; // team ID or placeholder
  date?: string;
  order: number;
}

export interface GroupPrediction {
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface KnockoutPrediction {
  homeTeamId: string; // Resolved team ID
  awayTeamId: string; // Resolved team ID
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: string; // Must be homeTeamId or awayTeamId (no draws allowed in knockout)
}

export interface PredictionBonus {
  champion: string;
  runnerUp: string;
  third: string;
  fourth: string;
}

export interface Prediction {
  participantName: string;
  groupPredictions: Record<number, GroupPrediction>; // matchId (1-72) -> prediction
  knockoutPredictions: Record<number, KnockoutPrediction>; // matchId (73-104) -> prediction
  bonus: PredictionBonus;
  createdAt: string;
  updatedAt: string;
}

export interface ActualResult {
  matchId: number;
  homeGoals: number;
  awayGoals: number;
  winnerTeamId?: string; // Required for knockout if homeGoals === awayGoals after extra time/penalties
  played: boolean;
}

export interface ActualBonus {
  champion?: string;
  runnerUp?: string;
  third?: string;
  fourth?: string;
}

export interface ParticipantScore {
  participantName: string;
  totalScore: number;
  groupScore: number;
  knockoutScore: number;
  bonusScore: number;
  exactScoresCount: number;
  correctResultsCount: number;
}
