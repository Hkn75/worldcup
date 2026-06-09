import type { GroupStanding } from './groupStandings';
import { bracketSlots } from '../data/bracketSlots';
import { findThirdPlaceMapping } from '../data/thirdPlaceScenarios';
import type { Match } from '../types';

export interface ThirdPlaceCandidate {
  groupLetter: string;
  teamId: string;
  teamName: string;
  flag: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  seed: number; // For tie-breaking
}

/**
 * Extracts and ranks third-placed teams from all 12 groups to select the best 8.
 */
export const getBestThirdPlacedTeams = (
  allGroupStandings: Record<string, GroupStanding[]>
): { qualified: ThirdPlaceCandidate[]; ranked: ThirdPlaceCandidate[] } => {
  const candidates: ThirdPlaceCandidate[] = [];

  Object.entries(allGroupStandings).forEach(([groupLetter, standings]) => {
    // A group must have 4 teams to have a 3rd place team
    if (standings.length >= 3) {
      const thirdTeam = standings[2]; // 3rd team (index 2)
      candidates.push({
        groupLetter,
        teamId: thirdTeam.teamId,
        teamName: thirdTeam.teamName,
        flag: thirdTeam.flag,
        points: thirdTeam.points,
        goalDifference: thirdTeam.goalDifference,
        goalsFor: thirdTeam.goalsFor,
        seed: thirdTeam.seed
      });
    }
  });

  // Sort candidates by FIFA rules: points, GD, GF, seed rank
  const ranked = [...candidates].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return a.seed - b.seed; // Lower seed is better (e.g. 1 beats 2)
  });

  // The top 8 qualify
  const qualified = ranked.slice(0, 8);

  return { qualified, ranked };
};

/**
 * Resolves a team ID for a specific source in a bracket slot.
 */
export const resolveTeamForSlotSource = (
  source: { type: 'group_winner' | 'group_runnerup' | 'group_third' | 'match_winner' | 'match_loser'; value: string },
  allGroupStandings: Record<string, GroupStanding[]>,
  thirdPlaceMapping: Record<string, string> | null,
  resolvedMatches: Record<number, { homeTeamId: string; awayTeamId: string; winnerTeamId?: string }>
): string => {
  const { type, value } = source;

  if (type === 'group_winner') {
    const standings = allGroupStandings[value];
    if (!standings || standings.length < 1) return `Winner_${value}`;
    return standings[0].teamId;
  }

  if (type === 'group_runnerup') {
    const standings = allGroupStandings[value];
    if (!standings || standings.length < 2) return `RunnerUp_${value}`;
    return standings[1].teamId;
  }

  if (type === 'group_third') {
    // Here, 'value' is the group winner name (e.g. 'E', 'I', 'A', 'L', 'G', 'D', 'B', 'K')
    if (!thirdPlaceMapping) return `3rd_Opponent_For_${value}`;
    const thirdPlaceGroup = thirdPlaceMapping[value];
    if (!thirdPlaceGroup) return `3rd_Opponent_For_${value}`;

    const standings = allGroupStandings[thirdPlaceGroup];
    if (!standings || standings.length < 3) return `3rd_${thirdPlaceGroup}`;
    return standings[2].teamId;
  }

  if (type === 'match_winner') {
    const matchId = parseInt(value, 10);
    const match = resolvedMatches[matchId];
    if (!match || !match.winnerTeamId) return `Winner_M${matchId}`;
    return match.winnerTeamId;
  }

  if (type === 'match_loser') {
    const matchId = parseInt(value, 10);
    const match = resolvedMatches[matchId];
    if (!match || !match.winnerTeamId || !match.homeTeamId || !match.awayTeamId) return `Loser_M${matchId}`;
    return match.winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  }

  return 'TBD';
};

/**
 * Dynamically resolves all knockout matches based on group standings and previous knockout match winners.
 * Throws an error if third-placed combinations cannot be matched to a scenario in Annex C.
 */
export const buildKnockoutMatches = (
  allGroupStandings: Record<string, GroupStanding[]>,
  isGroupStageComplete: boolean,
  knockoutPredictionsOrActual: Record<number, { homeGoals: number | null; awayGoals: number | null; winnerTeamId?: string }>
): { matches: Match[]; error: string | null } => {
  if (!isGroupStageComplete) {
    return { matches: [], error: 'Tüm grup maçları tamamlanmadan eleme aşaması oluşturulamaz.' };
  }

  // 1. Get best third-placed groups
  const { qualified } = getBestThirdPlacedTeams(allGroupStandings);
  const qualifiedGroupLetters = qualified.map(q => q.groupLetter);

  // 2. Look up the third place mapping scenario
  const thirdPlaceMapping = findThirdPlaceMapping(qualifiedGroupLetters);
  if (!thirdPlaceMapping) {
    return {
      matches: [],
      error: `Bu üçüncüler kombinasyonu (${qualifiedGroupLetters.sort().join(', ')}) için eşleşme tablosu eksik.`
    };
  }

  // 3. Resolve matches round by round to build the list
  const matches: Match[] = [];
  const resolvedMatches: Record<number, { homeTeamId: string; awayTeamId: string; winnerTeamId?: string }> = {};

  // Sort slots by matchId/order so we resolve R32, then R16, then QF, SF, 3rd, Final
  const sortedSlots = [...bracketSlots].sort((a, b) => a.matchId - b.matchId);

  for (const slot of sortedSlots) {
    const homeTeamId = resolveTeamForSlotSource(slot.homeSource, allGroupStandings, thirdPlaceMapping, resolvedMatches);
    const awayTeamId = resolveTeamForSlotSource(slot.awaySource, allGroupStandings, thirdPlaceMapping, resolvedMatches);

    // Get winner if it has been predicted or played
    let winnerTeamId: string | undefined;
    const scoreInfo = knockoutPredictionsOrActual[slot.matchId];

    if (scoreInfo && scoreInfo.homeGoals !== null && scoreInfo.awayGoals !== null) {
      if (scoreInfo.homeGoals > scoreInfo.awayGoals) {
        winnerTeamId = homeTeamId;
      } else if (scoreInfo.homeGoals < scoreInfo.awayGoals) {
        winnerTeamId = awayTeamId;
      } else {
        // Tie: must use the provided winnerTeamId
        winnerTeamId = scoreInfo.winnerTeamId;
      }
    }

    resolvedMatches[slot.matchId] = {
      homeTeamId,
      awayTeamId,
      winnerTeamId
    };

    matches.push({
      id: slot.matchId,
      stage: slot.stage,
      homeTeamId,
      awayTeamId,
      date: slot.date,
      order: slot.order
    });
  }

  return { matches, error: null };
};
