
/**
 * Validates a participant's name.
 */
export const validateParticipantName = (name: string): string | null => {
  if (!name || name.trim() === '') {
    return 'Ad Soyad alanı boş bırakılamaz.';
  }
  if (name.trim().length < 3) {
    return 'Ad Soyad en az 3 karakter olmalıdır.';
  }
  return null;
};

/**
 * Validates a goal score input (must be non-negative integer <= 99).
 */
export const validateScoreInput = (val: number | null): string | null => {
  if (val === null) return 'Skor alanı boş bırakılamaz.';
  if (val < 0) return 'Skor negatif olamaz.';
  if (val > 99) return 'Skor en fazla 99 olabilir.';
  if (!Number.isInteger(val)) return 'Skor tam sayı olmalıdır.';
  return null;
};

/**
 * Checks which group matches (1-72) are missing prediction inputs.
 */
export const getMissingGroupPredictions = (
  groupPredictions: Record<number, { homeGoals: number | null; awayGoals: number | null }>
): number[] => {
  const missingMatchIds: number[] = [];
  for (let matchId = 1; matchId <= 72; matchId++) {
    const pred = groupPredictions[matchId];
    if (!pred || pred.homeGoals === null || pred.awayGoals === null) {
      missingMatchIds.push(matchId);
    }
  }
  return missingMatchIds;
};

/**
 * Checks which knockout matches (73-104) are missing prediction inputs or a winner choice for draws.
 */
export const getMissingKnockoutPredictions = (
  knockoutPredictions: Record<number, { homeGoals: number | null; awayGoals: number | null; winnerTeamId: string }>
): number[] => {
  const missingMatchIds: number[] = [];
  for (let matchId = 73; matchId <= 104; matchId++) {
    const pred = knockoutPredictions[matchId];
    if (!pred || pred.homeGoals === null || pred.awayGoals === null) {
      missingMatchIds.push(matchId);
    } else if (pred.homeGoals === pred.awayGoals && !pred.winnerTeamId) {
      // In case of a draw in normal time, a winner must be selected
      missingMatchIds.push(matchId);
    }
  }
  return missingMatchIds;
};

/**
 * Validates if the LocalStorage structure is corrupt.
 */
export const isStorageDataCorrupt = (): boolean => {
  try {
    const data = localStorage.getItem('wc2026_predictions');
    if (data) {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return true;
    }
    return false;
  } catch {
    return true;
  }
};
