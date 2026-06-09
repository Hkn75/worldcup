import type { Team } from '../types';

export const teams: Team[] = [
  // Group A
  { id: 'MEX', name: 'Meksika', group: 'A', flag: 'mx', seed: 1 },
  { id: 'RSA', name: 'Güney Afrika', group: 'A', flag: 'za', seed: 2 },
  { id: 'KOR', name: 'Güney Kore', group: 'A', flag: 'kr', seed: 3 },
  { id: 'CZE', name: 'Çekya', group: 'A', flag: 'cz', seed: 4 },

  // Group B
  { id: 'CAN', name: 'Kanada', group: 'B', flag: 'ca', seed: 1 },
  { id: 'BIH', name: 'Bosna Hersek', group: 'B', flag: 'ba', seed: 2 },
  { id: 'QAT', name: 'Katar', group: 'B', flag: 'qa', seed: 3 },
  { id: 'SUI', name: 'İsviçre', group: 'B', flag: 'ch', seed: 4 },

  // Group C
  { id: 'BRA', name: 'Brezilya', group: 'C', flag: 'br', seed: 1 },
  { id: 'MAR', name: 'Fas', group: 'C', flag: 'ma', seed: 2 },
  { id: 'HAI', name: 'Haiti', group: 'C', flag: 'ht', seed: 3 },
  { id: 'SCO', name: 'İskoçya', group: 'C', flag: 'gb-sct', seed: 4 },

  // Group D
  { id: 'USA', name: 'ABD', group: 'D', flag: 'us', seed: 1 },
  { id: 'PAR', name: 'Paraguay', group: 'D', flag: 'py', seed: 2 },
  { id: 'AUS', name: 'Avustralya', group: 'D', flag: 'au', seed: 3 },
  { id: 'TUR', name: 'Türkiye', group: 'D', flag: 'tr', seed: 4 },

  // Group E
  { id: 'GER', name: 'Almanya', group: 'E', flag: 'de', seed: 1 },
  { id: 'CUW', name: 'Curaçao', group: 'E', flag: 'cw', seed: 2 },
  { id: 'CIV', name: 'Fildişi Sahili', group: 'E', flag: 'ci', seed: 3 },
  { id: 'ECU', name: 'Ekvador', group: 'E', flag: 'ec', seed: 4 },

  // Group F
  { id: 'NED', name: 'Hollanda', group: 'F', flag: 'nl', seed: 1 },
  { id: 'JPN', name: 'Japonya', group: 'F', flag: 'jp', seed: 2 },
  { id: 'SWE', name: 'İsveç', group: 'F', flag: 'se', seed: 3 },
  { id: 'TUN', name: 'Tunus', group: 'F', flag: 'tn', seed: 4 },

  // Group G
  { id: 'BEL', name: 'Belçika', group: 'G', flag: 'be', seed: 1 },
  { id: 'EGY', name: 'Mısır', group: 'G', flag: 'eg', seed: 2 },
  { id: 'IRN', name: 'İran', group: 'G', flag: 'ir', seed: 3 },
  { id: 'NZL', name: 'Yeni Zelanda', group: 'G', flag: 'nz', seed: 4 },

  // Group H
  { id: 'ESP', name: 'İspanya', group: 'H', flag: 'es', seed: 1 },
  { id: 'CPV', name: 'Yeşil Burun Adaları', group: 'H', flag: 'cv', seed: 2 },
  { id: 'KSA', name: 'Suudi Arabistan', group: 'H', flag: 'sa', seed: 3 },
  { id: 'URU', name: 'Uruguay', group: 'H', flag: 'uy', seed: 4 },

  // Group I
  { id: 'FRA', name: 'Fransa', group: 'I', flag: 'fr', seed: 1 },
  { id: 'SEN', name: 'Senegal', group: 'I', flag: 'sn', seed: 2 },
  { id: 'IRQ', name: 'Irak', group: 'I', flag: 'iq', seed: 3 },
  { id: 'NOR', name: 'Norveç', group: 'I', flag: 'no', seed: 4 },

  // Group J
  { id: 'ARG', name: 'Arjantin', group: 'J', flag: 'ar', seed: 1 },
  { id: 'ALG', name: 'Cezayir', group: 'J', flag: 'dz', seed: 2 },
  { id: 'AUT', name: 'Avusturya', group: 'J', flag: 'at', seed: 3 },
  { id: 'JOR', name: 'Ürdün', group: 'J', flag: 'jo', seed: 4 },

  // Group K
  { id: 'POR', name: 'Portekiz', group: 'K', flag: 'pt', seed: 1 },
  { id: 'COD', name: 'Demokratik Kongo', group: 'K', flag: 'cd', seed: 2 },
  { id: 'UZB', name: 'Özbekistan', group: 'K', flag: 'uz', seed: 3 },
  { id: 'COL', name: 'Kolombiya', group: 'K', flag: 'co', seed: 4 },

  // Group L
  { id: 'ENG', name: 'İngiltere', group: 'L', flag: 'gb', seed: 1 },
  { id: 'CRO', name: 'Hırvatistan', group: 'L', flag: 'hr', seed: 2 },
  { id: 'GHA', name: 'Gana', group: 'L', flag: 'gh', seed: 3 },
  { id: 'PAN', name: 'Panama', group: 'L', flag: 'pa', seed: 4 }
];

export const teamsMap = teams.reduce((acc, team) => {
  acc[team.id] = team;
  return acc;
}, {} as Record<string, Team>);
