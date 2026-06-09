
export interface BracketSlot {
  matchId: number;
  stage: 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace' | 'final';
  homeSource: { type: 'group_winner' | 'group_runnerup' | 'group_third' | 'match_winner' | 'match_loser'; value: string };
  awaySource: { type: 'group_winner' | 'group_runnerup' | 'group_third' | 'match_winner' | 'match_loser'; value: string };
  order: number;
  label: string;
  date?: string;
}

export const bracketSlots: BracketSlot[] = [
  // --- Round of 32 (Matches 73 - 88) ---
  {
    matchId: 73,
    stage: 'r32',
    homeSource: { type: 'group_runnerup', value: 'A' },
    awaySource: { type: 'group_runnerup', value: 'B' },
    order: 73,
    label: 'M73: A2 vs B2',
    date: '2026-06-28'
  },
  {
    matchId: 74,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'E' },
    awaySource: { type: 'group_third', value: 'E' }, // Opponent for Winner E: A/B/C/D/F
    order: 74,
    label: 'M74: E1 vs 3rd A/B/C/D/F',
    date: '2026-06-29'
  },
  {
    matchId: 75,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'F' },
    awaySource: { type: 'group_runnerup', value: 'C' },
    order: 75,
    label: 'M75: F1 vs C2',
    date: '2026-06-29'
  },
  {
    matchId: 76,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'C' },
    awaySource: { type: 'group_runnerup', value: 'F' },
    order: 76,
    label: 'M76: C1 vs F2',
    date: '2026-06-29'
  },
  {
    matchId: 77,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'I' },
    awaySource: { type: 'group_third', value: 'I' }, // Opponent for Winner I: C/D/F/G/H
    order: 77,
    label: 'M77: I1 vs 3rd C/D/F/G/H',
    date: '2026-06-30'
  },
  {
    matchId: 78,
    stage: 'r32',
    homeSource: { type: 'group_runnerup', value: 'E' },
    awaySource: { type: 'group_runnerup', value: 'I' },
    order: 78,
    label: 'M78: E2 vs I2',
    date: '2026-06-30'
  },
  {
    matchId: 79,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'A' },
    awaySource: { type: 'group_third', value: 'A' }, // Opponent for Winner A: C/E/F/H/I
    order: 79,
    label: 'M79: A1 vs 3rd C/E/F/H/I',
    date: '2026-06-30'
  },
  {
    matchId: 80,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'L' },
    awaySource: { type: 'group_third', value: 'L' }, // Opponent for Winner L: E/H/I/J/K
    order: 80,
    label: 'M80: L1 vs 3rd E/H/I/J/K',
    date: '2026-07-01'
  },
  {
    matchId: 81,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'D' },
    awaySource: { type: 'group_third', value: 'D' }, // Opponent for Winner D: B/E/F/I/J
    order: 81,
    label: 'M81: D1 vs 3rd B/E/F/I/J',
    date: '2026-07-01'
  },
  {
    matchId: 82,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'G' },
    awaySource: { type: 'group_third', value: 'G' }, // Opponent for Winner G: A/E/H/I/J
    order: 82,
    label: 'M82: G1 vs 3rd A/E/H/I/J',
    date: '2026-07-01'
  },
  {
    matchId: 83,
    stage: 'r32',
    homeSource: { type: 'group_runnerup', value: 'K' },
    awaySource: { type: 'group_runnerup', value: 'L' },
    order: 83,
    label: 'M83: K2 vs L2',
    date: '2026-07-02'
  },
  {
    matchId: 84,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'H' },
    awaySource: { type: 'group_runnerup', value: 'J' },
    order: 84,
    label: 'M84: H1 vs J2',
    date: '2026-07-02'
  },
  {
    matchId: 85,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'B' },
    awaySource: { type: 'group_third', value: 'B' }, // Opponent for Winner B: E/F/G/I/J
    order: 85,
    label: 'M85: B1 vs 3rd E/F/G/I/J',
    date: '2026-07-02'
  },
  {
    matchId: 86,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'J' },
    awaySource: { type: 'group_runnerup', value: 'H' },
    order: 86,
    label: 'M86: J1 vs H2',
    date: '2026-07-03'
  },
  {
    matchId: 87,
    stage: 'r32',
    homeSource: { type: 'group_winner', value: 'K' },
    awaySource: { type: 'group_third', value: 'K' }, // Opponent for Winner K: D/E/I/J/L
    order: 87,
    label: 'M87: K1 vs 3rd D/E/I/J/L',
    date: '2026-07-03'
  },
  {
    matchId: 88,
    stage: 'r32',
    homeSource: { type: 'group_runnerup', value: 'D' },
    awaySource: { type: 'group_runnerup', value: 'G' },
    order: 88,
    label: 'M88: D2 vs G2',
    date: '2026-07-03'
  },

  // --- Round of 16 (Matches 89 - 96) ---
  {
    matchId: 89,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '74' },
    awaySource: { type: 'match_winner', value: '77' },
    order: 89,
    label: 'M89: M74 Galibi vs M77 Galibi',
    date: '2026-07-04'
  },
  {
    matchId: 90,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '73' },
    awaySource: { type: 'match_winner', value: '75' },
    order: 90,
    label: 'M90: M73 Galibi vs M75 Galibi',
    date: '2026-07-04'
  },
  {
    matchId: 91,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '76' },
    awaySource: { type: 'match_winner', value: '78' },
    order: 91,
    label: 'M91: M76 Galibi vs M78 Galibi',
    date: '2026-07-05'
  },
  {
    matchId: 92,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '79' },
    awaySource: { type: 'match_winner', value: '80' },
    order: 92,
    label: 'M92: M79 Galibi vs M80 Galibi',
    date: '2026-07-05'
  },
  {
    matchId: 93,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '83' },
    awaySource: { type: 'match_winner', value: '84' },
    order: 93,
    label: 'M93: M83 Galibi vs M84 Galibi',
    date: '2026-07-06'
  },
  {
    matchId: 94,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '81' },
    awaySource: { type: 'match_winner', value: '82' },
    order: 94,
    label: 'M94: M81 Galibi vs M82 Galibi',
    date: '2026-07-06'
  },
  {
    matchId: 95,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '86' },
    awaySource: { type: 'match_winner', value: '88' },
    order: 95,
    label: 'M95: M86 Galibi vs M88 Galibi',
    date: '2026-07-07'
  },
  {
    matchId: 96,
    stage: 'r16',
    homeSource: { type: 'match_winner', value: '85' },
    awaySource: { type: 'match_winner', value: '87' },
    order: 96,
    label: 'M96: M85 Galibi vs M87 Galibi',
    date: '2026-07-07'
  },

  // --- Quarter-finals (Matches 97 - 100) ---
  {
    matchId: 97,
    stage: 'qf',
    homeSource: { type: 'match_winner', value: '89' },
    awaySource: { type: 'match_winner', value: '90' },
    order: 97,
    label: 'M97 (ÇF1): M89 Galibi vs M90 Galibi',
    date: '2026-07-09'
  },
  {
    matchId: 98,
    stage: 'qf',
    homeSource: { type: 'match_winner', value: '91' },
    awaySource: { type: 'match_winner', value: '92' },
    order: 98,
    label: 'M98 (ÇF2): M91 Galibi vs M92 Galibi',
    date: '2026-07-10'
  },
  {
    matchId: 99,
    stage: 'qf',
    homeSource: { type: 'match_winner', value: '93' },
    awaySource: { type: 'match_winner', value: '94' },
    order: 99,
    label: 'M99 (ÇF3): M93 Galibi vs M94 Galibi',
    date: '2026-07-11'
  },
  {
    matchId: 100,
    stage: 'qf',
    homeSource: { type: 'match_winner', value: '95' },
    awaySource: { type: 'match_winner', value: '96' },
    order: 100,
    label: 'M100 (ÇF4): M95 Galibi vs M96 Galibi',
    date: '2026-07-11'
  },

  // --- Semi-finals (Matches 101 - 102) ---
  {
    matchId: 101,
    stage: 'sf',
    homeSource: { type: 'match_winner', value: '97' },
    awaySource: { type: 'match_winner', value: '98' },
    order: 101,
    label: 'M101 (YF1): M97 Galibi vs M98 Galibi',
    date: '2026-07-14'
  },
  {
    matchId: 102,
    stage: 'sf',
    homeSource: { type: 'match_winner', value: '99' },
    awaySource: { type: 'match_winner', value: '100' },
    order: 102,
    label: 'M102 (YF2): M99 Galibi vs M100 Galibi',
    date: '2026-07-15'
  },

  // --- Third-place Play-off (Match 103) ---
  {
    matchId: 103,
    stage: 'thirdPlace',
    homeSource: { type: 'match_loser', value: '101' },
    awaySource: { type: 'match_loser', value: '102' },
    order: 103,
    label: 'M103: Üçüncülük Maçı',
    date: '2026-07-18'
  },

  // --- Final (Match 104) ---
  {
    matchId: 104,
    stage: 'final',
    homeSource: { type: 'match_winner', value: '101' },
    awaySource: { type: 'match_winner', value: '102' },
    order: 104,
    label: 'M104: Final',
    date: '2026-07-19'
  }
];

export const getNextMatchesForWinner = (matchId: number): number[] => {
  // Returns which match(es) receive the winner of matchId
  const targets: number[] = [];
  bracketSlots.forEach(slot => {
    if (slot.homeSource.type === 'match_winner' && slot.homeSource.value === String(matchId)) {
      targets.push(slot.matchId);
    }
    if (slot.awaySource.type === 'match_winner' && slot.awaySource.value === String(matchId)) {
      targets.push(slot.matchId);
    }
  });
  return targets;
};

export const getNextMatchesForLoser = (matchId: number): number[] => {
  // Returns which match(es) receive the loser of matchId (only for semifinals -> 3rd place)
  const targets: number[] = [];
  bracketSlots.forEach(slot => {
    if (slot.homeSource.type === 'match_loser' && slot.homeSource.value === String(matchId)) {
      targets.push(slot.matchId);
    }
    if (slot.awaySource.type === 'match_loser' && slot.awaySource.value === String(matchId)) {
      targets.push(slot.matchId);
    }
  });
  return targets;
};
