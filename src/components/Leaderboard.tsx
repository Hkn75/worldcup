import React from 'react';
import type { ParticipantScore } from '../types';

interface LeaderboardProps {
  scores: ParticipantScore[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  if (scores.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center border border-white/5 shadow-md max-w-md mx-auto my-8">
        <span className="text-4xl block mb-3">📋</span>
        <h3 className="font-display font-extrabold text-white text-lg">Henüz Katılımcı Yok</h3>
        <p className="text-slate-400 text-sm mt-1">
          Tahminleri yüklemek veya yeni katılımcı eklemek için Admin panelini kullanın.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="overflow-x-auto w-full rounded-2xl border border-slate-800 bg-primary-dark/40 shadow-xl hide-scrollbar">
        <table className="min-w-full text-center text-xs sm:text-sm font-medium text-slate-300">
          <thead className="bg-primary-light/50 text-slate-400 font-semibold uppercase text-[10px] sm:text-xs tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 w-12 sm:w-16">Sıra</th>
              <th className="py-3 px-3 text-left">Katılımcı</th>
              <th className="py-3 px-3 w-16 sm:w-20 text-emerald-400 font-bold">Toplam</th>
              <th className="py-3 px-2 w-12 sm:w-16">Grup</th>
              <th className="py-3 px-2 w-12 sm:w-16">Eleme</th>
              <th className="py-3 px-2 w-12 sm:w-16">Bonus</th>
              <th className="py-3 px-2 w-12 sm:w-16 hidden md:table-cell">Tam Skor</th>
              <th className="py-3 px-2 w-12 sm:w-16 hidden md:table-cell">Doğru Sonuç</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {scores.map((score, index) => {
              // Highlight podium spots
              let rankBadge = <span>{index + 1}</span>;
              let rowHighlight = 'hover:bg-slate-800/25';
              
              if (index === 0) {
                rankBadge = (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-primary-dark font-black text-xs shadow-md glow-text-gold">
                    1
                  </span>
                );
                rowHighlight = 'bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500';
              } else if (index === 1) {
                rankBadge = (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-primary-dark font-black text-xs shadow-md">
                    2
                  </span>
                );
                rowHighlight = 'bg-slate-300/5 hover:bg-slate-300/10 border-l-4 border-l-slate-300';
              } else if (index === 2) {
                rankBadge = (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs shadow-md">
                    3
                  </span>
                );
                rowHighlight = 'bg-amber-700/5 hover:bg-amber-700/10 border-l-4 border-l-amber-700';
              }

              return (
                <tr key={score.participantName} className={`${rowHighlight} transition-all`}>
                  <td className="py-3.5 px-3 font-display font-bold text-slate-400">
                    {rankBadge}
                  </td>
                  <td className="py-3.5 px-3 text-left font-bold text-white text-sm sm:text-base">
                    {score.participantName}
                  </td>
                  <td className="py-3.5 px-3 text-emerald-400 font-display font-black text-base sm:text-lg">
                    {score.totalScore}
                  </td>
                  <td className="py-3.5 px-2 text-slate-300 font-display font-semibold">
                    {score.groupScore}
                  </td>
                  <td className="py-3.5 px-2 text-slate-300 font-display font-semibold">
                    {score.knockoutScore}
                  </td>
                  <td className="py-3.5 px-2 text-slate-300 font-display font-semibold">
                    {score.bonusScore}
                  </td>
                  <td className="py-3.5 px-2 text-slate-400 font-display hidden md:table-cell">
                    {score.exactScoresCount}
                  </td>
                  <td className="py-3.5 px-2 text-slate-400 font-display hidden md:table-cell">
                    {score.correctResultsCount}
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
