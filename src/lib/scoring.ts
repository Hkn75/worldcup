import type { Prediction, ActualResult, ActualBonus, ParticipantScore, PredictionBonus } from '../types';
import { teams } from '../data/teams';
import { groupMatches } from '../data/groupMatches';
import { calculateGroupStandings } from './groupStandings';
import { buildKnockoutMatches } from './bracket';

/**
 * Determines the outcome of a match.
 */
export const getMatchOutcome = (homeGoals: number, awayGoals: number): 'home' | 'away' | 'draw' => {
  if (homeGoals > awayGoals) return 'home';
  if (homeGoals < awayGoals) return 'away';
  return 'draw';
};

/**
 * Scores a group stage prediction (1-72).
 * Tam skor birebir doğruysa: 3 puan
 * Sonuç doğruysa (Galip veya Beraberlik): 1 puan
 * Yanlışsa: 0 puan
 */
export const scoreGroupPrediction = (
  prediction: { homeGoals: number | null; awayGoals: number | null },
  actual: { homeGoals: number | null; awayGoals: number | null }
): number => {
  if (
    prediction.homeGoals === null ||
    prediction.awayGoals === null ||
    actual.homeGoals === null ||
    actual.awayGoals === null
  ) {
    return 0;
  }

  const exactScore = prediction.homeGoals === actual.homeGoals && prediction.awayGoals === actual.awayGoals;
  if (exactScore) return 3;

  const predOutcome = getMatchOutcome(prediction.homeGoals, prediction.awayGoals);
  const actualOutcome = getMatchOutcome(actual.homeGoals, actual.awayGoals);

  if (predOutcome === actualOutcome) return 1;

  return 0;
};

/**
 * Scores a knockout prediction (73-104).
 * Eşleşme yanlışsa: 0 puan
 * Eşleşme doğruysa:
 * - Tam skor doğruysa + Kazanan doğruysa: 3 puan
 * - Sadece Kazanan (Tur atlayan) doğruysa: 1 puan
 * - Aksi halde: 0 puan
 */
export const scoreKnockoutPrediction = (
  prediction: { homeTeamId: string; awayTeamId: string; homeGoals: number | null; awayGoals: number | null; winnerTeamId: string },
  actual: { homeTeamId: string; awayTeamId: string; homeGoals: number | null; awayGoals: number | null; winnerTeamId?: string }
): number => {
  // Check if the matchups are the same (order-independent)
  const predTeams = [prediction.homeTeamId, prediction.awayTeamId].sort();
  const actualTeams = [actual.homeTeamId, actual.awayTeamId].sort();

  if (predTeams[0] !== actualTeams[0] || predTeams[1] !== actualTeams[1]) {
    return 0; // Wrong match-up
  }

  // If match-up is correct but no scores entered yet, score is 0
  if (
    prediction.homeGoals === null ||
    prediction.awayGoals === null ||
    actual.homeGoals === null ||
    actual.awayGoals === null ||
    !actual.winnerTeamId
  ) {
    return 0;
  }

  // Align goals if team order is reversed
  const isReversed = prediction.homeTeamId !== actual.homeTeamId;
  const actualHomeGoals = isReversed ? actual.awayGoals : actual.homeGoals;
  const actualAwayGoals = isReversed ? actual.homeGoals : actual.awayGoals;
  
  const exactScore = prediction.homeGoals === actualHomeGoals && prediction.awayGoals === actualAwayGoals;
  const correctWinner = prediction.winnerTeamId === actual.winnerTeamId;

  if (exactScore && correctWinner) return 3;
  if (correctWinner) return 1;

  return 0;
};

/**
 * Scores bonus predictions (champion, runner-up, 3rd, 4th).
 * Şampiyon doğru: +10
 * İkinci doğru: +5
 * Üçüncü doğru: +4
 * Dördüncü doğru: +3
 */
export const scoreBonus = (predictedBonus: PredictionBonus, actualBonus: ActualBonus): number => {
  let score = 0;
  if (actualBonus.champion && predictedBonus.champion === actualBonus.champion) score += 10;
  if (actualBonus.runnerUp && predictedBonus.runnerUp === actualBonus.runnerUp) score += 5;
  if (actualBonus.third && predictedBonus.third === actualBonus.third) score += 4;
  if (actualBonus.fourth && predictedBonus.fourth === actualBonus.fourth) score += 3;
  return score;
};

/**
 * Calculates scores for a single participant.
 */
export const calculateParticipantScore = (
  participant: Prediction,
  actualResults: Record<number, ActualResult>,
  actualBonus: ActualBonus,
  actualKnockoutMap?: Record<number, { homeTeamId: string; awayTeamId: string }>
): ParticipantScore => {
  let groupScore = 0;
  let knockoutScore = 0;
  let exactScoresCount = 0;
  let correctResultsCount = 0;

  // 1. Score Group stage (matches 1 to 72)
  for (let matchId = 1; matchId <= 72; matchId++) {
    const pred = participant.groupPredictions[matchId];
    const actual = actualResults[matchId];

    if (pred && actual && actual.played) {
      const matchScore = scoreGroupPrediction(pred, actual);
      groupScore += matchScore;

      if (matchScore === 3) {
        exactScoresCount += 1;
        correctResultsCount += 1;
      } else if (matchScore === 1) {
        correctResultsCount += 1;
      }
    }
  }

  // 2. Score Knockout stage (matches 73 to 104)
  for (let matchId = 73; matchId <= 104; matchId++) {
    const pred = participant.knockoutPredictions[matchId];
    const actual = actualResults[matchId];

    if (pred && actual && actual.played) {
      let matchScore = 0;
      const resolvedMatch = actualKnockoutMap?.[matchId];
      if (resolvedMatch) {
        matchScore = scoreKnockoutPrediction(pred, {
          homeTeamId: resolvedMatch.homeTeamId,
          awayTeamId: resolvedMatch.awayTeamId,
          homeGoals: actual.homeGoals,
          awayGoals: actual.awayGoals,
          winnerTeamId: actual.winnerTeamId || ''
        });
      }
      knockoutScore += matchScore;

      if (matchScore === 3) {
        exactScoresCount += 1;
        correctResultsCount += 1;
      } else if (matchScore === 1) {
        correctResultsCount += 1;
      }
    }
  }

  // 3. Score Bonus
  const bonusScore = scoreBonus(participant.bonus, actualBonus);
  const totalScore = groupScore + knockoutScore + bonusScore;

  return {
    participantName: participant.participantName,
    totalScore,
    groupScore,
    knockoutScore,
    bonusScore,
    exactScoresCount,
    correctResultsCount
  };
};

/**
 * Computes and sorts the leaderboard list based on criteria:
 * 1. Total score desc
 * 2. Exact score count desc
 * 3. Knockout score desc
 * 4. Bonus score desc
 * 5. Participant name alphabetically (Turkish locale)
 */
export const calculateLeaderboard = (
  participants: Prediction[],
  actualResults: Record<number, ActualResult>,
  actualBonus: ActualBonus
): ParticipantScore[] => {
  // Resolve actual knockout matches to find their correct team IDs
  const standingsMap: Record<string, any> = {};
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  let isComplete = true;

  groups.forEach((gLetter) => {
    const groupTeams = teams.filter((t) => t.group === gLetter);
    const res = calculateGroupStandings(gLetter, groupTeams, groupMatches, actualResults);
    standingsMap[gLetter] = res.standings;
    if (!res.isComplete) isComplete = false;
  });

  const { matches } = buildKnockoutMatches(standingsMap, isComplete, actualResults);
  const actualKnockoutMap: Record<number, { homeTeamId: string; awayTeamId: string }> = {};
  matches.forEach((m) => {
    actualKnockoutMap[m.id] = { homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId };
  });

  const scores = participants.map(p => calculateParticipantScore(p, actualResults, actualBonus, actualKnockoutMap));

  return scores.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.exactScoresCount !== a.exactScoresCount) {
      return b.exactScoresCount - a.exactScoresCount;
    }
    if (b.knockoutScore !== a.knockoutScore) {
      return b.knockoutScore - a.knockoutScore;
    }
    if (b.bonusScore !== a.bonusScore) {
      return b.bonusScore - a.bonusScore;
    }
    return a.participantName.localeCompare(b.participantName, 'tr');
  });
};
