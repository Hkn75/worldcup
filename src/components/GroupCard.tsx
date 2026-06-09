import React from 'react';
import type { Team, Match } from '../types';
import { calculateGroupStandings } from '../lib/groupStandings';
import { GroupTable } from './GroupTable';
import { ScoreInput } from './ScoreInput';
import { teamsMap } from '../data/teams';

interface GroupCardProps {
  groupLetter: string;
  groupTeams: Team[];
  groupMatches: Match[];
  predictions: Record<number, { homeGoals: number | null; awayGoals: number | null }>;
  onPredictionChange: (matchId: number, homeGoals: number | null, awayGoals: number | null) => void;
  disabled?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  groupLetter,
  groupTeams,
  groupMatches,
  predictions,
  onPredictionChange,
  disabled = false
}) => {
  // Live calculation of standings
  const { standings, isComplete } = calculateGroupStandings(
    groupLetter,
    groupTeams,
    groupMatches,
    predictions
  );

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/5 shadow-xl flex flex-col lg:flex-row gap-6 lg:gap-8 hover:border-slate-800 transition-colors">
      
      {/* Matches column */}
      <div className="flex-1">
        <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
          <h3 className="font-display font-black text-2xl text-white tracking-wide uppercase">
            GRUP {groupLetter}
          </h3>
          <span className="text-xs text-slate-400 font-medium bg-primary-light px-2.5 py-1 rounded-lg border border-slate-800">
            6 Maç
          </span>
        </div>

        <div className="space-y-3">
          {groupMatches.map((match) => {
            const homeTeam = teamsMap[match.homeTeamId];
            const awayTeam = teamsMap[match.awayTeamId];
            const pred = predictions[match.id] || { homeGoals: null, awayGoals: null };

            if (!homeTeam || !awayTeam) return null;

            return (
              <div
                key={match.id}
                className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-primary-dark/30 border border-slate-800/40 hover:bg-primary-dark/60 transition-colors"
              >
                {/* Home Team */}
                <div className="flex items-center gap-2 sm:gap-3 w-[40%]">
                  <img
                    src={`https://flagcdn.com/w40/${homeTeam.flag}.png`}
                    alt={homeTeam.name}
                    className="w-6 h-4 object-cover rounded shadow-sm border border-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
                    }}
                  />
                  <span className="font-semibold text-white text-xs sm:text-sm truncate">
                    {homeTeam.name}
                  </span>
                </div>

                {/* Score Inputs */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <ScoreInput
                    value={pred.homeGoals}
                    onChange={(val) => onPredictionChange(match.id, val, pred.awayGoals)}
                    disabled={disabled}
                  />
                  <span className="text-slate-500 font-bold font-display text-lg select-none">:</span>
                  <ScoreInput
                    value={pred.awayGoals}
                    onChange={(val) => onPredictionChange(match.id, pred.homeGoals, val)}
                    disabled={disabled}
                  />
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 w-[40%] text-right">
                  <span className="font-semibold text-white text-xs sm:text-sm truncate">
                    {awayTeam.name}
                  </span>
                  <img
                    src={`https://flagcdn.com/w40/${awayTeam.flag}.png`}
                    alt={awayTeam.name}
                    className="w-6 h-4 object-cover rounded shadow-sm border border-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standings Table column */}
      <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0">
        <GroupTable
          groupLetter={groupLetter}
          standings={standings}
          isComplete={isComplete}
        />
      </div>
      
    </div>
  );
};
