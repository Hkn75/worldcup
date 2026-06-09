import type { Team, Match } from '../types';

export interface GroupStanding {
  teamId: string;
  teamName: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  seed: number;
}

/**
 * Calculates standings for a single group based on matches and their results (predictions or actual)
 */
export const calculateGroupStandings = (
  groupLetter: string,
  groupTeams: Team[],
  matches: Match[],
  scoresMap: Record<number, { homeGoals: number | null; awayGoals: number | null }>
): { standings: GroupStanding[]; isComplete: boolean } => {
  // Initialize standings for each team
  const standingsMap: Record<string, GroupStanding> = {};
  groupTeams.forEach((team) => {
    standingsMap[team.id] = {
      teamId: team.id,
      teamName: team.name,
      flag: team.flag,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      seed: team.seed
    };
  });

  const groupMatches = matches.filter((m) => m.group === groupLetter);
  let isComplete = true;

  groupMatches.forEach((match) => {
    const scores = scoresMap[match.id];
    if (!scores || scores.homeGoals === null || scores.awayGoals === null) {
      isComplete = false;
      return; // Skip match as it is not played/predicted yet
    }

    const home = standingsMap[match.homeTeamId];
    const away = standingsMap[match.awayTeamId];

    if (!home || !away) return;

    home.played += 1;
    away.played += 1;

    const hg = scores.homeGoals;
    const ag = scores.awayGoals;

    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;

    if (hg > ag) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (hg < ag) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  // Calculate goal differences
  const standings = Object.values(standingsMap).map((team) => ({
    ...team,
    goalDifference: team.goalsFor - team.goalsAgainst
  }));

  // Sort standings
  const sortedStandings = standings.sort((a, b) => {
    // 1. Points (Puan)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Goal Difference (Averaj)
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // 3. Goals Scored (Atılan Gol)
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    // 4. Head-to-Head (İkili Averaj)
    // Find the match played between these two teams
    const h2hMatch = groupMatches.find(
      (m) =>
        (m.homeTeamId === a.teamId && m.awayTeamId === b.teamId) ||
        (m.homeTeamId === b.teamId && m.awayTeamId === a.teamId)
    );
    if (h2hMatch) {
      const scores = scoresMap[h2hMatch.id];
      if (scores && scores.homeGoals !== null && scores.awayGoals !== null) {
        const isHomeA = h2hMatch.homeTeamId === a.teamId;
        const aGoals = isHomeA ? scores.homeGoals : scores.awayGoals;
        const bGoals = isHomeA ? scores.awayGoals : scores.homeGoals;

        if (aGoals !== bGoals) {
          return bGoals - aGoals; // The winner of the H2H match is ranked higher
        }
      }
    }

    // 5. Seed rank fallback (Lower seed value is better: 1 beats 2)
    return a.seed - b.seed;
  });

  return { standings: sortedStandings, isComplete };
};
