import React, { useState } from 'react';
import type { Match } from '../types';
import { MatchCard } from './MatchCard';

interface BracketProps {
  knockoutMatches: Match[];
  predictions: Record<number, { homeGoals: number | null; awayGoals: number | null; winnerTeamId: string }>;
  onScoreChange: (matchId: number, homeGoals: number | null, awayGoals: number | null) => void;
  onWinnerSelect: (matchId: number, winnerTeamId: string) => void;
  disabled?: boolean;
}

type BracketRound = 'r32' | 'r16' | 'qf' | 'sf' | 'final';

export const Bracket: React.FC<BracketProps> = ({
  knockoutMatches,
  predictions,
  onScoreChange,
  onWinnerSelect,
  disabled = false
}) => {
  const [activeRound, setActiveRound] = useState<BracketRound>('r32');

  const rounds: { value: BracketRound; label: string }[] = [
    { value: 'r32', label: 'Son 32' },
    { value: 'r16', label: 'Son 16' },
    { value: 'qf', label: 'Çeyrek Final' },
    { value: 'sf', label: 'Yarı Final' },
    { value: 'final', label: 'Finaller' }
  ];

  // Helper to filter matches of a round
  const getMatchesForRound = (round: BracketRound): Match[] => {
    return knockoutMatches.filter((m) => {
      if (round === 'final') {
        return m.stage === 'final' || m.stage === 'thirdPlace';
      }
      return m.stage === round;
    });
  };

  const getRoundLabel = (stage: string): string => {
    switch (stage) {
      case 'r32': return 'Round of 32';
      case 'r16': return 'Round of 16';
      case 'qf': return 'Çeyrek Final';
      case 'sf': return 'Yarı Final';
      case 'thirdPlace': return 'Üçüncülük Maçı';
      case 'final': return 'Final';
      default: return '';
    }
  };

  return (
    <div className="w-full">
      
      {/* Mobile/Tablet Round Tabs (Always shown to enable clean filtering) */}
      <div className="flex justify-between sm:justify-center items-center gap-1.5 p-1 bg-primary-dark/80 border border-slate-800 rounded-2xl mb-6 max-w-xl mx-auto overflow-x-auto hide-scrollbar select-none">
        {rounds.map((round) => (
          <button
            key={round.value}
            type="button"
            onClick={() => setActiveRound(round.value)}
            className={`flex-1 min-w-[70px] sm:min-w-[90px] py-2 px-1 text-center text-xs font-bold rounded-xl transition-all ${
              activeRound === round.value
                ? 'bg-secondary text-white shadow-md scale-105'
                : 'text-slate-400 hover:text-white hover:bg-primary-light/35'
            }`}
          >
            {round.label}
          </button>
        ))}
      </div>

      {/* Tree view layout on Desktop / Stack list on Mobile */}
      <div className="block lg:hidden">
        {/* Mobile Stack view of the active round */}
        <div className="space-y-4 max-w-md mx-auto">
          {getMatchesForRound(activeRound).map((match) => {
            const pred = predictions[match.id] || { homeGoals: null, awayGoals: null, winnerTeamId: '' };
            return (
              <MatchCard
                key={match.id}
                matchId={match.id}
                stageLabel={getRoundLabel(match.stage)}
                homeTeamId={match.homeTeamId}
                awayTeamId={match.awayTeamId}
                homeGoals={pred.homeGoals}
                awayGoals={pred.awayGoals}
                winnerTeamId={pred.winnerTeamId}
                onScoreChange={(hg, ag) => onScoreChange(match.id, hg, ag)}
                onWinnerSelect={(winner) => onWinnerSelect(match.id, winner)}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-row gap-6 xl:gap-8 items-stretch overflow-x-auto pb-4">
        {/* Desktop Tree Column View: Columns are aligned side-by-side */}
        {rounds.map((round) => {
          const roundMatches = getMatchesForRound(round.value);
          const isActive = activeRound === round.value;

          return (
            <div
              key={round.value}
              className={`flex-1 min-w-[220px] flex flex-col gap-6 transition-all duration-300 h-full ${
                isActive ? 'opacity-100 scale-100' : 'opacity-65 hover:opacity-100'
              }`}
            >
              <div className="text-center bg-primary-light/45 py-2.5 px-4 rounded-xl border border-slate-800">
                <span className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
                  {round.label}
                </span>
                <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                  {roundMatches.length} Maç
                </span>
              </div>

              {/* Column matches stack */}
              <div className="flex-1 flex flex-col justify-around min-h-[950px] py-2">
                {roundMatches.map((match) => {
                  const pred = predictions[match.id] || { homeGoals: null, awayGoals: null, winnerTeamId: '' };
                  return (
                    <MatchCard
                      key={match.id}
                      matchId={match.id}
                      stageLabel={getRoundLabel(match.stage)}
                      homeTeamId={match.homeTeamId}
                      awayTeamId={match.awayTeamId}
                      homeGoals={pred.homeGoals}
                      awayGoals={pred.awayGoals}
                      winnerTeamId={pred.winnerTeamId}
                      onScoreChange={(hg, ag) => onScoreChange(match.id, hg, ag)}
                      onWinnerSelect={(winner) => onWinnerSelect(match.id, winner)}
                      disabled={disabled}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
