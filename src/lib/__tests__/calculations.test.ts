import { describe, it, expect } from 'vitest';
import type { Team, Match, Prediction, ActualResult, ActualBonus } from '../../types';
import { calculateGroupStandings, type GroupStanding } from '../groupStandings';
import { getBestThirdPlacedTeams } from '../bracket';
import {
  scoreGroupPrediction,
  scoreKnockoutPrediction,
  scoreBonus,
  calculateLeaderboard
} from '../scoring';
import { exportPredictionToString, importPredictionFromString } from '../predictionExport';

describe('Dünya Kupası 2026 Tahmin Oyunu Testleri', () => {
  // Test 1 & 2: Grup Puan Tablosu, Galibiyet, Beraberlik, Mağlubiyet, Puanlar
  describe('Grup Puan Tablosu Hesaplamaları', () => {
    const mockTeams: Team[] = [
      { id: 'TEAM1', name: 'Takım 1', group: 'A', flag: 't1', seed: 1 },
      { id: 'TEAM2', name: 'Takım 2', group: 'A', flag: 't2', seed: 2 },
      { id: 'TEAM3', name: 'Takım 3', group: 'A', flag: 't3', seed: 3 },
      { id: 'TEAM4', name: 'Takım 4', group: 'A', flag: 't4', seed: 4 }
    ];

    const mockMatches: Match[] = [
      { id: 1, stage: 'group', group: 'A', homeTeamId: 'TEAM1', awayTeamId: 'TEAM2', order: 1 },
      { id: 2, stage: 'group', group: 'A', homeTeamId: 'TEAM3', awayTeamId: 'TEAM4', order: 2 },
      { id: 3, stage: 'group', group: 'A', homeTeamId: 'TEAM1', awayTeamId: 'TEAM3', order: 3 },
      { id: 4, stage: 'group', group: 'A', homeTeamId: 'TEAM4', awayTeamId: 'TEAM2', order: 4 },
      { id: 5, stage: 'group', group: 'A', homeTeamId: 'TEAM4', awayTeamId: 'TEAM1', order: 5 },
      { id: 6, stage: 'group', group: 'A', homeTeamId: 'TEAM2', awayTeamId: 'TEAM3', order: 6 }
    ];

    it('Grup puan durumları ve galibiyet, beraberlik, mağlubiyet puanları doğru hesaplanmalı', () => {
      const scoresMap = {
        1: { homeGoals: 2, awayGoals: 0 }, // TEAM1 won (3 pts), TEAM2 lost (0 pts)
        2: { homeGoals: 1, awayGoals: 1 }, // TEAM3 drawn (1 pt), TEAM4 drawn (1 pt)
        3: { homeGoals: 1, awayGoals: 2 }, // TEAM1 lost (3 pts total), TEAM3 won (4 pts total)
        4: { homeGoals: 0, awayGoals: 0 }, // TEAM4 drawn (2 pts total), TEAM2 drawn (1 pt total)
        5: { homeGoals: 1, awayGoals: 2 }, // TEAM4 lost (2 pts total), TEAM1 won (6 pts total)
        6: { homeGoals: 3, awayGoals: 0 }  // TEAM2 won (4 pts total), TEAM3 lost (4 pts total)
      };

      const { standings } = calculateGroupStandings('A', mockTeams, mockMatches, scoresMap);

      // Verify TEAM1: Won 2, Lost 1, Points = 6. Goals For = 5, Goals Against = 3. GD = 2.
      const team1Standing = standings.find(s => s.teamId === 'TEAM1');
      expect(team1Standing).toBeDefined();
      expect(team1Standing!.points).toBe(6);
      expect(team1Standing!.played).toBe(3);
      expect(team1Standing!.won).toBe(2);
      expect(team1Standing!.drawn).toBe(0);
      expect(team1Standing!.lost).toBe(1);
      expect(team1Standing!.goalDifference).toBe(2);

      // Verify standings order: points (T1: 6, others: 4 or 2)
      expect(standings[0].teamId).toBe('TEAM1'); // 6 pts
    });

    it('Grup puan durumu ikili averaj tie-break kuralını doğru işletmeli', () => {
      // Both T1 and T2 have 5 pts, GD = +1, GF = 3.
      // Since their H2H was 1-1 (draw), they fallback to seed (T1 seed = 1, T2 seed = 2).
      // So T1 must rank above T2.
      const scoresMap3 = {
        1: { homeGoals: 1, awayGoals: 1 }, // T1 vs T2: 1-1
        2: { homeGoals: 0, awayGoals: 0 },
        3: { homeGoals: 1, awayGoals: 0 }, // T1 vs T3: 1-0
        4: { homeGoals: 1, awayGoals: 1 }, // T4 vs T2: 1-1
        5: { homeGoals: 1, awayGoals: 1 }, // T4 vs T1: 1-1
        6: { homeGoals: 1, awayGoals: 0 }  // T2 vs T3: 1-0
      };

      const { standings: standings3 } = calculateGroupStandings('A', mockTeams, mockMatches, scoresMap3);
      expect(standings3[0].teamId).toBe('TEAM1'); // seed 1
      expect(standings3[1].teamId).toBe('TEAM2'); // seed 2
    });
  });

  // Test 3: En iyi 8 üçüncü doğru seçiliyor
  describe('En İyi Üçüncülerin Seçimi', () => {
    it('12 grup üçüncüsü arasından en iyi 8 üçüncü doğru puan sıralamasıyla seçilmeli', () => {
      const mockStandings: Record<string, GroupStanding[]> = {};
      const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      
      groups.forEach((g, idx) => {
        // A gets 6 pts, B gets 6 pts, C gets 5 pts, D gets 5 pts, E gets 4 pts, F gets 4 pts,
        // G gets 3 pts, H gets 3 pts, I gets 2 pts, J gets 2 pts, K gets 1 pts, L gets 1 pts.
        const pts = Math.max(0, 6 - Math.floor(idx / 2)); // points: 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1
        const gd = idx % 2 === 0 ? 1 : 0; // GD: 1, 0, 1, 0...
        const gf = 3;
        
        mockStandings[g] = [
          { teamId: `${g}1`, teamName: 'W', flag: 'f', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 9, goalsAgainst: 0, goalDifference: 9, points: 9, seed: 1 },
          { teamId: `${g}2`, teamName: 'RU', flag: 'f', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 6, goalsAgainst: 3, goalDifference: 3, points: 6, seed: 2 },
          { teamId: `${g}3`, teamName: '3rd', flag: 'f', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: gf, goalsAgainst: gf - gd, goalDifference: gd, points: pts, seed: 3 },
          { teamId: `${g}4`, teamName: 'L', flag: 'f', played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 0, goalsAgainst: 9, goalDifference: -9, points: 0, seed: 4 }
        ];
      });

      const { qualified } = getBestThirdPlacedTeams(mockStandings);
      expect(qualified.length).toBe(8);

      const qualifiedLetters = qualified.map(q => q.groupLetter);
      expect(qualifiedLetters).toContain('A');
      expect(qualifiedLetters).toContain('B');
      expect(qualifiedLetters).toContain('C');
      expect(qualifiedLetters).toContain('D');
      expect(qualifiedLetters).toContain('E');
      expect(qualifiedLetters).toContain('F');
      expect(qualifiedLetters).toContain('G');
      expect(qualifiedLetters).toContain('H');
      expect(qualifiedLetters).not.toContain('K');
      expect(qualifiedLetters).not.toContain('L');
    });
  });

  // Test 4 & 5: Grup tahmin puanları (Tam skor = 3, Doğru Sonuç = 1, Yanlış = 0)
  describe('Grup Tahmin Puanlama Motoru', () => {
    it('Tam skor doğruysa 3 puan vermeli', () => {
      const pred = { homeGoals: 2, awayGoals: 1 };
      const actual = { homeGoals: 2, awayGoals: 1 };
      expect(scoreGroupPrediction(pred, actual)).toBe(3);
    });

    it('Sadece doğru sonuç (galibiyet/beraberlik) tahmin edildiyse 1 puan vermeli', () => {
      // Guessed home wins 2-0, actual home wins 3-1. Correct outcome, wrong score.
      expect(scoreGroupPrediction({ homeGoals: 2, awayGoals: 0 }, { homeGoals: 3, awayGoals: 1 })).toBe(1);
      // Guessed draw 1-1, actual draw 2-2. Correct outcome, wrong score.
      expect(scoreGroupPrediction({ homeGoals: 1, awayGoals: 1 }, { homeGoals: 2, awayGoals: 2 })).toBe(1);
    });

    it('Sonuç yanlışsa 0 puan vermeli', () => {
      // Guessed draw 0-0, actual home wins 1-0.
      expect(scoreGroupPrediction({ homeGoals: 0, awayGoals: 0 }, { homeGoals: 1, awayGoals: 0 })).toBe(0);
      // Guessed away wins 1-2, actual home wins 2-0.
      expect(scoreGroupPrediction({ homeGoals: 1, awayGoals: 2 }, { homeGoals: 2, awayGoals: 0 })).toBe(0);
    });
  });

  // Test 6 & 7: Eleme tahmin puanları (Eşleşme yanlışsa 0, Doğruysa Tam Skor = 3, Doğru Sonuç = 1)
  describe('Eleme Tahmin Puanlama Motoru', () => {
    const predMatch = {
      homeTeamId: 'TUR',
      awayTeamId: 'GER',
      homeGoals: 2,
      awayGoals: 1,
      winnerTeamId: 'TUR'
    };

    it('Eşleşen takımlar yanlışsa 0 puan vermeli', () => {
      // Actual match was TUR vs FRA, but user predicted TUR vs GER.
      const actualMatch = {
        homeTeamId: 'TUR',
        awayTeamId: 'FRA',
        homeGoals: 2,
        awayGoals: 1,
        winnerTeamId: 'TUR'
      };
      expect(scoreKnockoutPrediction(predMatch, actualMatch)).toBe(0);
    });

    it('Eşleşme doğru + tam skor ve kazanan doğruysa 3 puan vermeli', () => {
      const actualMatch = {
        homeTeamId: 'TUR',
        awayTeamId: 'GER',
        homeGoals: 2,
        awayGoals: 1,
        winnerTeamId: 'TUR'
      };
      expect(scoreKnockoutPrediction(predMatch, actualMatch)).toBe(3);
    });

    it('Eşleşme doğru + home/away ters olsa bile tam skor ve kazanan doğruysa 3 puan vermeli', () => {
      // Actual is GER vs TUR, score is 1-2 (TUR wins).
      // Predict is TUR vs GER, score is 2-1 (TUR wins).
      // This is the same prediction and outcome!
      const actualMatchReversed = {
        homeTeamId: 'GER',
        awayTeamId: 'TUR',
        homeGoals: 1,
        awayGoals: 2,
        winnerTeamId: 'TUR'
      };
      expect(scoreKnockoutPrediction(predMatch, actualMatchReversed)).toBe(3);
    });

    it('Eşleşme doğru + sadece tur atlayan doğruysa 1 puan vermeli', () => {
      const actualMatch = {
        homeTeamId: 'TUR',
        awayTeamId: 'GER',
        homeGoals: 3,
        awayGoals: 2, // TUR wins 3-2, prediction was TUR wins 2-1
        winnerTeamId: 'TUR'
      };
      expect(scoreKnockoutPrediction(predMatch, actualMatch)).toBe(1);
    });
  });

  // Test 8: Bonus puanları doğru hesaplanıyor
  describe('Bonus Tahmin Puanlaması', () => {
    it('Bonus tahminler doğruysa karşılık gelen puanları vermeli', () => {
      const predBonus = { champion: 'TUR', runnerUp: 'GER', third: 'FRA', fourth: 'BRA' };
      const actualBonusAllCorrect: ActualBonus = { champion: 'TUR', runnerUp: 'GER', third: 'FRA', fourth: 'BRA' };
      expect(scoreBonus(predBonus, actualBonusAllCorrect)).toBe(10 + 5 + 4 + 3); // 22 pts

      const actualBonusSomeCorrect: ActualBonus = { champion: 'TUR', runnerUp: 'FRA', third: 'GER', fourth: 'BRA' };
      expect(scoreBonus(predBonus, actualBonusSomeCorrect)).toBe(10 + 0 + 0 + 3); // 13 pts
    });
  });

  // Test 9: Tahmin export/import round-trip testi
  describe('Tahmin Metin Formatı (Export/Import) Uyumu', () => {
    it('Export edilen tahmin metni import edildiğinde aynı objeyi vermeli', () => {
      const original: Prediction = {
        participantName: 'Test Katılımcısı',
        groupPredictions: {
          1: { homeGoals: 2, awayGoals: 1 },
          2: { homeGoals: 1, awayGoals: 1 }
        },
        knockoutPredictions: {
          73: { homeTeamId: 'TUR', awayTeamId: 'GER', homeGoals: 3, awayGoals: 2, winnerTeamId: 'TUR' }
        },
        bonus: { champion: 'TUR', runnerUp: 'GER', third: 'FRA', fourth: 'BRA' },
        createdAt: '2026-06-09T07:00:00Z',
        updatedAt: '2026-06-09T07:00:00Z'
      };

      const exportedString = exportPredictionToString(original);
      const imported = importPredictionFromString(exportedString);

      expect(imported.participantName).toBe(original.participantName);
      expect(imported.bonus.champion).toBe(original.bonus.champion);
      expect(imported.groupPredictions[1].homeGoals).toBe(original.groupPredictions[1].homeGoals);
      expect(imported.knockoutPredictions[73].winnerTeamId).toBe(original.knockoutPredictions[73].winnerTeamId);
    });
  });

  // Test 10: Leaderboard tie-break doğru çalışıyor
  describe('Leaderboard Sıralama ve Tie-Break Sistemi', () => {
    it('Sıralama kuralları (Puan -> Tam Skor Sayısı -> Eleme Puanı -> Bonus Puanı -> İsim) sırasıyla uygulanmalı', () => {
      const p4: Prediction = {
        participantName: 'Ahmet',
        groupPredictions: {
          1: { homeGoals: 1, awayGoals: 0 }, // actual: 2-1 (+1)
          2: { homeGoals: 2, awayGoals: 1 }, // actual: 1-0 (+1)
          3: { homeGoals: 0, awayGoals: 0 }  // actual: 1-1 (+1)
        },
        knockoutPredictions: {},
        bonus: { champion: '', runnerUp: '', third: '', fourth: '' },
        createdAt: '2026', updatedAt: '2026'
      };

      const p5: Prediction = {
        participantName: 'Mehmet',
        groupPredictions: {
          1: { homeGoals: 2, awayGoals: 1 }, // actual: 2-1 (+3) - exact score
          2: { homeGoals: 0, awayGoals: 0 }, // actual: 1-0 (0)
          3: { homeGoals: 0, awayGoals: 0 }  // actual: 1-1 (0)
        },
        knockoutPredictions: {},
        bonus: { champion: '', runnerUp: '', third: '', fourth: '' },
        createdAt: '2026', updatedAt: '2026'
      };

      const actualResultsForTie: Record<number, ActualResult> = {
        1: { matchId: 1, homeGoals: 2, awayGoals: 1, played: true },
        2: { matchId: 2, homeGoals: 1, awayGoals: 0, played: true },
        3: { matchId: 3, homeGoals: 1, awayGoals: 1, played: true }
      };

      const leaderboard = calculateLeaderboard([p4, p5], actualResultsForTie, {});
      expect(leaderboard[0].participantName).toBe('Mehmet'); // exact score count 1 vs 0
      expect(leaderboard[1].participantName).toBe('Ahmet');
    });
  });
});
