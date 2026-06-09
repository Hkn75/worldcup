import React from 'react';
import { ScoreInput } from './ScoreInput';
import { teamsMap } from '../data/teams';

interface MatchCardProps {
  matchId: number;
  stageLabel: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: string;
  onScoreChange: (homeGoals: number | null, awayGoals: number | null) => void;
  onWinnerSelect: (winnerTeamId: string) => void;
  disabled?: boolean;
}

/**
 * Translates bracket team ID placeholders into user-friendly Turkish text.
 */
export const getPlaceholderTeamName = (id: string): { name: string; isPlaceholder: boolean; flagCode?: string } => {
  const team = teamsMap[id];
  if (team) {
    return { name: team.name, isPlaceholder: false, flagCode: team.flag };
  }

  // Bracket placeholders
  if (id.startsWith('Winner_')) {
    const group = id.replace('Winner_', '');
    if (group.startsWith('M')) {
      return { name: `${group.substring(1)} Galibi`, isPlaceholder: true };
    }
    return { name: `${group} Grubu Lideri`, isPlaceholder: true };
  }
  if (id.startsWith('RunnerUp_')) {
    const group = id.replace('RunnerUp_', '');
    return { name: `${group} Grubu İkincisi`, isPlaceholder: true };
  }
  if (id.startsWith('3rd_')) {
    const suffix = id.replace('3rd_Opponent_For_', '').replace('3rd_', '');
    // e.g. E, I, A, L, G, D, B, K
    const pools: Record<string, string> = {
      E: 'A/B/C/D/F',
      I: 'C/D/F/G/H',
      A: 'C/E/F/H/I',
      L: 'E/H/I/J/K',
      G: 'A/E/H/I/J',
      D: 'B/E/F/I/J',
      B: 'E/F/G/I/J',
      K: 'D/E/I/J/L'
    };
    return { name: `En İyi 3. (${pools[suffix] || suffix})`, isPlaceholder: true };
  }
  if (id.startsWith('Loser_')) {
    const match = id.replace('Loser_M', '').replace('Loser_', '');
    return { name: `M${match} Mağlubu`, isPlaceholder: true };
  }

  return { name: id, isPlaceholder: true };
};

export const MatchCard: React.FC<MatchCardProps> = ({
  matchId,
  stageLabel,
  homeTeamId,
  awayTeamId,
  homeGoals,
  awayGoals,
  winnerTeamId,
  onScoreChange,
  onWinnerSelect,
  disabled = false
}) => {
  const home = getPlaceholderTeamName(homeTeamId);
  const away = getPlaceholderTeamName(awayTeamId);

  const isTied = homeGoals !== null && awayGoals !== null && homeGoals === awayGoals;
  const isTeamsResolved = !home.isPlaceholder && !away.isPlaceholder;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/5 shadow-md flex flex-col justify-between hover:border-slate-800 transition-colors bg-primary-light/10 shrink-0">
      
      {/* Stage & Match ID Label */}
      <div className="flex justify-between items-center text-[10px] sm:text-xs font-semibold text-slate-400 border-b border-slate-800/40 pb-2 mb-3">
        <span className="uppercase tracking-wider">{stageLabel}</span>
        <span className="bg-primary-light px-2 py-0.5 rounded border border-slate-800">Maç #{matchId}</span>
      </div>

      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        
        {/* Home Team */}
        <div className="flex items-center gap-2 sm:gap-3 w-[38%]">
          {home.flagCode ? (
            <img
              src={`https://flagcdn.com/w40/${home.flagCode}.png`}
              alt={home.name}
              className="w-7 h-5 object-cover rounded shadow-sm border border-slate-800 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
              }}
            />
          ) : (
            <span className="w-7 h-5 flex items-center justify-center text-xs bg-slate-800 text-slate-500 rounded font-bold shrink-0">⚽</span>
          )}
          <span className={`font-semibold text-xs sm:text-sm truncate ${winnerTeamId === homeTeamId && !home.isPlaceholder ? 'text-emerald-400 font-extrabold' : 'text-white'}`}>
            {home.name}
          </span>
        </div>

        {/* Score Inputs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ScoreInput
            value={homeGoals}
            onChange={(val) => onScoreChange(val, awayGoals)}
            disabled={disabled || !isTeamsResolved}
          />
          <span className="text-slate-500 font-bold font-display text-lg select-none">:</span>
          <ScoreInput
            value={awayGoals}
            onChange={(val) => onScoreChange(homeGoals, val)}
            disabled={disabled || !isTeamsResolved}
          />
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-[38%] text-right">
          <span className={`font-semibold text-xs sm:text-sm truncate ${winnerTeamId === awayTeamId && !away.isPlaceholder ? 'text-emerald-400 font-extrabold' : 'text-white'}`}>
            {away.name}
          </span>
          {away.flagCode ? (
            <img
              src={`https://flagcdn.com/w40/${away.flagCode}.png`}
              alt={away.name}
              className="w-7 h-5 object-cover rounded shadow-sm border border-slate-800 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
              }}
            />
          ) : (
            <span className="w-7 h-5 flex items-center justify-center text-xs bg-slate-800 text-slate-500 rounded font-bold shrink-0">⚽</span>
          )}
        </div>

      </div>

      {/* Winner Select Button Row (for ties in knockout) */}
      {isTied && isTeamsResolved && !disabled && (
        <div className="mt-4 pt-3 border-t border-slate-800/40 text-center animate-fade-in">
          <p className="text-[10px] sm:text-xs text-yellow-500 font-bold mb-2 uppercase tracking-wide">
            Uzatma/Penaltılar Galibi:
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => onWinnerSelect(homeTeamId)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                winnerTeamId === homeTeamId
                  ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                  : 'bg-primary-light text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              {home.name}
            </button>
            <button
              type="button"
              onClick={() => onWinnerSelect(awayTeamId)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                winnerTeamId === awayTeamId
                  ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                  : 'bg-primary-light text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              {away.name}
            </button>
          </div>
        </div>
      )}

      {/* Disabled / Unresolved Match Warning */}
      {!isTeamsResolved && (
        <div className="mt-2 text-center text-[10px] text-slate-500 font-medium italic">
          Grup sonuçları tamamlandığında aktif olacaktır.
        </div>
      )}
    </div>
  );
};
