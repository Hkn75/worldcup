import React from 'react';
import type { GroupStanding } from '../lib/groupStandings';

interface GroupTableProps {
  groupLetter: string;
  standings: GroupStanding[];
  isComplete: boolean;
}

export const GroupTable: React.FC<GroupTableProps> = ({
  groupLetter,
  standings,
  isComplete
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="font-display font-bold text-white text-lg sm:text-xl">
          Grup {groupLetter} Puan Durumu
        </h4>
        {!isComplete && (
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full border border-yellow-500/30 animate-pulse-slow">
            Eksik Skorlar Var
          </span>
        )}
      </div>

      <div className="overflow-x-auto w-full rounded-xl border border-slate-800 bg-primary-dark/40 shadow-md hide-scrollbar">
        <table className="min-w-full text-center text-xs sm:text-sm font-medium text-slate-300">
          <thead className="bg-primary-light/50 text-slate-400 font-semibold uppercase text-[10px] sm:text-xs tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 text-left w-12 sm:w-16">Sıra</th>
              <th className="py-2.5 px-2 text-left">Takım</th>
              <th className="py-2.5 px-2 w-8 sm:w-10">O</th>
              <th className="py-2.5 px-2 w-8 sm:w-10">G</th>
              <th className="py-2.5 px-2 w-8 sm:w-10">B</th>
              <th className="py-2.5 px-2 w-8 sm:w-10">M</th>
              <th className="py-2.5 px-2 w-10 sm:w-12">Av</th>
              <th className="py-2.5 px-3 w-10 sm:w-12 text-secondary font-bold">P</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {standings.map((row, index) => {
              // Highlight qualification zones
              let borderClass = 'border-l-4 border-l-transparent';
              if (index < 2) {
                borderClass = 'border-l-4 border-l-emerald-500 bg-emerald-500/5'; // Top 2 qualify
              } else if (index === 2) {
                borderClass = 'border-l-4 border-l-blue-500 bg-blue-500/5'; // 3rd place candidates
              } else {
                borderClass = 'border-l-4 border-l-rose-500 bg-rose-500/5'; // Eliminated
              }

              return (
                <tr key={row.teamId} className={`${borderClass} hover:bg-slate-800/35 transition-colors`}>
                  <td className="py-2 px-3 text-left font-display font-semibold text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-2 px-2 text-left flex items-center gap-2 font-semibold text-white">
                    <img
                      src={`https://flagcdn.com/w40/${row.flag}.png`}
                      alt={`${row.teamName} Bayrak`}
                      className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-slate-700/50"
                      onError={(e) => {
                        // Fallback in case subnational flag doesn't resolve
                        (e.target as HTMLImageElement).src = 'https://flagcdn.com/w40/un.png';
                      }}
                    />
                    <span className="truncate max-w-[80px] sm:max-w-none">{row.teamName}</span>
                  </td>
                  <td className="py-2 px-2 text-slate-400">{row.played}</td>
                  <td className="py-2 px-2">{row.won}</td>
                  <td className="py-2 px-2 text-slate-400">{row.drawn}</td>
                  <td className="py-2 px-2 text-slate-400">{row.lost}</td>
                  <td className={`py-2 px-2 font-display ${row.goalDifference > 0 ? 'text-emerald-500' : row.goalDifference < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="py-2 px-3 text-emerald-400 font-display font-bold text-sm">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
