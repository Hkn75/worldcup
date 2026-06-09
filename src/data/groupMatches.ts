import type { Match } from '../types';
import { teams } from './teams';

const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
export const groupMatches: Match[] = [];

let matchId = 1;
groups.forEach((groupName) => {
  const groupTeams = teams.filter((t) => t.group === groupName);
  if (groupTeams.length === 4) {
    // 6 matches per group
    // standard round-robin order
    const pairings = [
      { home: 0, away: 1, dayOffset: 0 },
      { home: 2, away: 3, dayOffset: 0 },
      { home: 0, away: 2, dayOffset: 4 },
      { home: 3, away: 1, dayOffset: 4 },
      { home: 3, away: 0, dayOffset: 8 },
      { home: 1, away: 2, dayOffset: 8 }
    ];

    pairings.forEach((p) => {
      const baseDate = new Date('2026-06-11T12:00:00+03:00');
      const groupIndex = groups.indexOf(groupName);
      // Group matches are played over 17 days
      const dayOffset = Math.floor(groupIndex / 2) + p.dayOffset;
      baseDate.setDate(baseDate.getDate() + dayOffset);
      const dateString = baseDate.toISOString().split('T')[0];

      groupMatches.push({
        id: matchId,
        stage: 'group',
        group: groupName,
        homeTeamId: groupTeams[p.home].id,
        awayTeamId: groupTeams[p.away].id,
        date: dateString,
        order: matchId
      });
      matchId++;
    });
  }
});
