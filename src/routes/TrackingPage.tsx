import React, { useState } from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { AdminPanel } from '../components/AdminPanel';
import { MatchDetailModal } from '../components/MatchDetailModal';
import type { Prediction, ActualResult, ActualBonus, Match } from '../types';
import { teams } from '../data/teams';
import { groupMatches } from '../data/groupMatches';
import { buildKnockoutMatches } from '../lib/bracket';
import { calculateGroupStandings } from '../lib/groupStandings';
import { calculateLeaderboard, scoreGroupPrediction, scoreKnockoutPrediction } from '../lib/scoring';
import { getPlaceholderTeamName } from '../components/MatchCard';

interface TrackingPageProps {
  predictions: Prediction[];
  actualResults: Record<number, ActualResult>;
  actualBonus: ActualBonus;
  onDataUpdate: (
    predictions: Prediction[],
    actualResults: Record<number, ActualResult>,
    actualBonus: ActualBonus
  ) => void;
}

type Tab = 'leaderboard' | 'matches' | 'matrix' | 'admin';

export const TrackingPage: React.FC<TrackingPageProps> = ({
  predictions,
  actualResults,
  actualBonus,
  onDataUpdate
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  
  // Modal state
  const [selectedAnalysisMatchId, setSelectedAnalysisMatchId] = useState<number | null>(null);

  // Compile full match list (group matches + knockout matches resolved dynamically from actual results)
  const getCompiledMatches = (): Match[] => {
    const standingsMap: Record<string, any> = {};
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    let isComplete = true;
    groups.forEach((gLetter) => {
      const groupTeams = teams.filter((t) => t.group === gLetter);
      const res = calculateGroupStandings(gLetter, groupTeams, groupMatches, actualResults);
      standingsMap[gLetter] = res.standings;
      if (!res.isComplete) {
        isComplete = false;
      }
    });

    const { matches } = buildKnockoutMatches(standingsMap, isComplete, actualResults);
    return [...groupMatches, ...matches];
  };

  const allMatches = getCompiledMatches();

  // Calculate sorted scores for Leaderboard
  const leaderboardScores = calculateLeaderboard(predictions, actualResults, actualBonus);

  // Compute distribution of predictions for a group match
  const getGroupDistribution = (matchId: number) => {
    let homeCount = 0;
    let drawCount = 0;
    let awayCount = 0;

    predictions.forEach((p) => {
      const pred = p.groupPredictions[matchId];
      if (pred && pred.homeGoals !== null && pred.awayGoals !== null) {
        if (pred.homeGoals > pred.awayGoals) homeCount++;
        else if (pred.homeGoals < pred.awayGoals) awayCount++;
        else drawCount++;
      }
    });

    const total = homeCount + drawCount + awayCount;
    return { homeCount, drawCount, awayCount, total };
  };

  // Compute distribution of predictions for a knockout match
  const getKnockoutDistribution = (matchId: number, homeTeamId: string, awayTeamId: string) => {
    let homeCount = 0;
    let awayCount = 0;

    predictions.forEach((p) => {
      const pred = p.knockoutPredictions[matchId];
      if (pred && pred.winnerTeamId) {
        if (pred.winnerTeamId === homeTeamId) homeCount++;
        else if (pred.winnerTeamId === awayTeamId) awayCount++;
      }
    });

    const total = homeCount + awayCount;
    return { homeCount, awayCount, total };
  };

  const getStageLabel = (stage: string): string => {
    switch (stage) {
      case 'group': return 'Grup Aşaması';
      case 'r32': return 'Son 32';
      case 'r16': return 'Son 16';
      case 'qf': return 'Çeyrek Final';
      case 'sf': return 'Yarı Final';
      case 'thirdPlace': return 'Üçüncülük';
      case 'final': return 'Final';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab bar header */}
      <div className="flex justify-between sm:justify-center items-center gap-1.5 p-1 bg-primary-dark/80 border border-slate-800 rounded-2xl max-w-xl mx-auto overflow-x-auto hide-scrollbar select-none">
        {[
          { value: 'leaderboard', label: 'Sıralama', icon: '🏆' },
          { value: 'matches', label: 'Maçlar', icon: '⚽' },
          { value: 'matrix', label: 'Tüm Tahminler', icon: '📊' },
          { value: 'admin', label: 'Admin', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value as Tab)}
            className={`flex-1 min-w-[80px] sm:min-w-[100px] py-2.5 px-1 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === tab.value
                ? 'bg-secondary text-white shadow-md scale-105'
                : 'text-slate-400 hover:text-white hover:bg-primary-light/35'
            }`}
          >
            <span className="mr-1">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Sıralama */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center space-y-1 select-none">
            <h3 className="font-display font-black text-white text-lg sm:text-2xl uppercase tracking-wider">
              Liderlik Tablosu
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Gerçek maç sonuçlarına göre hesaplanan katılımcı puan sıralaması
            </p>
          </div>
          <Leaderboard scores={leaderboardScores} />
        </div>
      )}

      {/* Tab 2: Maçlar */}
      {activeTab === 'matches' && (
        <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="text-center space-y-1 select-none">
            <h3 className="font-display font-black text-white text-lg sm:text-2xl uppercase tracking-wider">
              Dünya Kupası Fikstür & Analiz
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Maçların gerçek sonuçları ve katılımcı tahmin oranları. Analiz detayları için maçların üzerine tıklayın.
            </p>
          </div>

          <div className="space-y-3.5">
            {allMatches.map((match) => {
              const home = getPlaceholderTeamName(match.homeTeamId);
              const away = getPlaceholderTeamName(match.awayTeamId);
              const act = actualResults[match.id] || { homeGoals: 0, awayGoals: 0, played: false };

              const isGroup = match.id <= 72;
              const dist = isGroup
                ? getGroupDistribution(match.id)
                : getKnockoutDistribution(match.id, match.homeTeamId, match.awayTeamId);

              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedAnalysisMatchId(match.id)}
                  className="glass-panel rounded-2xl p-4 border border-white/5 shadow-md hover:border-slate-700/80 hover:bg-primary-light/5 transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Top info row */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-800/40 pb-2 mb-3 select-none">
                    <span className="uppercase tracking-wider">
                      {getStageLabel(match.stage)} {match.group ? `· ${match.group} Grubu` : ''}
                    </span>
                    <span className="bg-primary-light px-2 py-0.5 rounded border border-slate-800">
                      Maç #{match.id}
                    </span>
                  </div>

                  {/* Core Match Row */}
                  <div className="flex items-center justify-between gap-2">
                    
                    {/* Home Team */}
                    <div className="flex items-center gap-2 sm:gap-3 w-[38%]">
                      {home.flagCode ? (
                        <img
                          src={`https://flagcdn.com/w40/${home.flagCode}.png`}
                          alt={home.name}
                          className="w-6 h-4 object-cover rounded shadow-sm border border-slate-800"
                        />
                      ) : (
                        <span className="w-6 h-4 flex items-center justify-center text-[10px] bg-slate-800 rounded">⚽</span>
                      )}
                      <span className="font-semibold text-white text-xs sm:text-sm truncate">
                        {home.name}
                      </span>
                    </div>

                    {/* Actual Result or vs */}
                    <div className="bg-primary-dark/90 px-3.5 py-1.5 rounded-xl border border-slate-800 font-display font-black text-sm sm:text-base text-slate-200">
                      {act.played ? (
                        `${act.homeGoals} - ${act.awayGoals}`
                      ) : (
                        <span className="text-slate-500 font-normal text-xs uppercase tracking-wider">vs</span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 w-[38%] text-right">
                      <span className="font-semibold text-white text-xs sm:text-sm truncate">
                        {away.name}
                      </span>
                      {away.flagCode ? (
                        <img
                          src={`https://flagcdn.com/w40/${away.flagCode}.png`}
                          alt={away.name}
                          className="w-6 h-4 object-cover rounded shadow-sm border border-slate-800"
                        />
                      ) : (
                        <span className="w-6 h-4 flex items-center justify-center text-[10px] bg-slate-800 rounded">⚽</span>
                      )}
                    </div>

                  </div>

                  {/* Guess distribution bar */}
                  {predictions.length > 0 && dist.total > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-800/40 select-none">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        <span>Tahmin Oranları:</span>
                        {isGroup ? (
                          <span>Ev: {Math.round(((dist as any).homeCount / dist.total) * 100)}% | B: {Math.round(((dist as any).drawCount / dist.total) * 100)}% | Dep: {Math.round(((dist as any).awayCount / dist.total) * 100)}%</span>
                        ) : (
                          <span>Ev: {Math.round(((dist as any).homeCount / dist.total) * 100)}% | Dep: {Math.round(((dist as any).awayCount / dist.total) * 100)}%</span>
                        )}
                      </div>
                      
                      {/* Visual Segment Bar */}
                      <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800 border border-slate-900 shadow-inner">
                        {isGroup ? (
                          <>
                            <div
                              style={{ width: `${((dist as any).homeCount / dist.total) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title="Ev Sahibi Galibiyeti"
                            />
                            <div
                              style={{ width: `${((dist as any).drawCount / dist.total) * 100}%` }}
                              className="bg-amber-500 h-full"
                              title="Beraberlik"
                            />
                            <div
                              style={{ width: `${((dist as any).awayCount / dist.total) * 100}%` }}
                              className="bg-rose-500 h-full"
                              title="Deplasman Galibiyeti"
                            />
                          </>
                        ) : (
                          <>
                            <div
                              style={{ width: `${((dist as any).homeCount / dist.total) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title="Ev Sahibi Tur Atlar"
                            />
                            <div
                              style={{ width: `${((dist as any).awayCount / dist.total) * 100}%` }}
                              className="bg-rose-500 h-full"
                              title="Deplasman Tur Atlar"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Tüm Tahminler Matrisi */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-1 select-none">
            <h3 className="font-display font-black text-white text-lg sm:text-2xl uppercase tracking-wider">
              Tahmin Matrisi
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Tüm maçlar bazında katılımcı tahminlerinin doğruluk durumları
            </p>
          </div>

          {predictions.length === 0 ? (
            <p className="text-center text-xs text-slate-500 italic py-8">Kayıtlı katılımcı bulunmamaktadır.</p>
          ) : (
            <div className="space-y-4">
              
              {/* Legend bar */}
              <div className="flex flex-wrap gap-3 p-3 bg-primary-light/30 border border-slate-800 rounded-2xl justify-center text-xs font-semibold select-none">
                <span className="text-slate-400">Açıklama:</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-500 rounded" /> Tam Skor (3 P)</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-amber-500 rounded" /> Doğru Sonuç (1 P)</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-rose-500 rounded" /> Yanlış (0 P)</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-slate-700 rounded" /> Oynanmadı / Bekliyor</span>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto w-full rounded-2xl border border-slate-800 bg-primary-dark/40 shadow-xl max-h-[500px]">
                <table className="min-w-full text-center text-xs font-bold border-collapse">
                  <thead className="sticky top-0 bg-primary text-slate-300 border-b border-slate-800 z-10">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-800 bg-primary w-24">Maç #</th>
                      <th className="py-2.5 px-3 border-r border-slate-800 bg-primary w-40 text-left">Maç Detayı</th>
                      <th className="py-2.5 px-2 border-r border-slate-800 bg-primary w-20">Skor</th>
                      {predictions.map((p) => (
                        <th key={p.participantName} className="py-2.5 px-3 border-r border-slate-800 bg-primary truncate max-w-[120px]">
                          {p.participantName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {allMatches.map((match) => {
                      const home = getPlaceholderTeamName(match.homeTeamId).name;
                      const away = getPlaceholderTeamName(match.awayTeamId).name;
                      const act = actualResults[match.id] || { homeGoals: 0, awayGoals: 0, played: false };

                      return (
                        <tr key={match.id} className="hover:bg-primary-light/5 transition-colors">
                          {/* Match ID */}
                          <td className="py-2 px-3 border-r border-slate-800 font-display text-slate-400">
                            #{match.id}
                          </td>
                          {/* Match description */}
                          <td className="py-2 px-3 border-r border-slate-800 text-left font-semibold text-white truncate max-w-[160px]">
                            {home} - {away}
                          </td>
                          {/* Actual score */}
                          <td className="py-2 px-2 border-r border-slate-800 font-display text-slate-200">
                            {act.played ? `${act.homeGoals}-${act.awayGoals}` : '-'}
                          </td>

                          {/* Participant columns */}
                          {predictions.map((p) => {
                            const isGroup = match.id <= 72;
                            
                            let cellBg = 'bg-slate-800/30 text-slate-500'; // Henüz oynanmadı
                            let predStr = '-';

                            if (isGroup) {
                              const pred = p.groupPredictions[match.id];
                              if (pred && pred.homeGoals !== null && pred.awayGoals !== null) {
                                predStr = `${pred.homeGoals}-${pred.awayGoals}`;
                                if (act.played) {
                                  const pts = scoreGroupPrediction(pred, act);
                                  cellBg =
                                    pts === 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                                    pts === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' :
                                    'bg-rose-500/20 text-rose-400 border border-rose-500/10';
                                }
                              }
                            } else {
                              const pred = p.knockoutPredictions[match.id];
                              if (pred && pred.homeGoals !== null && pred.awayGoals !== null) {
                                predStr = `${pred.homeGoals}-${pred.awayGoals}`;
                                if (act.played) {
                                  // Re-align actual for knockout comparison
                                  const actKnockoutFormat = {
                                    homeTeamId: match.homeTeamId,
                                    awayTeamId: match.awayTeamId,
                                    homeGoals: act.homeGoals,
                                    awayGoals: act.awayGoals,
                                    winnerTeamId: act.winnerTeamId || ''
                                  };
                                  const pts = scoreKnockoutPrediction(pred, actKnockoutFormat);
                                  cellBg =
                                    pts === 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                                    pts === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' :
                                    'bg-rose-500/20 text-rose-400 border border-rose-500/10';
                                }
                              }
                            }

                            return (
                              <td key={p.participantName} className={`py-2 px-3 border-r border-slate-800 ${cellBg}`}>
                                {predStr}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Admin Panel */}
      {activeTab === 'admin' && (
        <div className="animate-fade-in">
          <AdminPanel
            predictions={predictions}
            actualResults={actualResults}
            actualBonus={actualBonus}
            onDataUpdate={onDataUpdate}
          />
        </div>
      )}

      {/* Match analysis Modal */}
      {selectedAnalysisMatchId !== null && (
        (() => {
          const match = allMatches.find((m) => m.id === selectedAnalysisMatchId);
          const act = actualResults[selectedAnalysisMatchId] || { homeGoals: 0, awayGoals: 0, winnerTeamId: '', played: false };
          
          if (!match) return null;

          return (
            <MatchDetailModal
              matchId={selectedAnalysisMatchId}
              stage={match.stage}
              homeTeamId={match.homeTeamId}
              awayTeamId={match.awayTeamId}
              actualResult={act}
              predictions={predictions}
              onClose={() => setSelectedAnalysisMatchId(null)}
            />
          );
        })()
      )}

    </div>
  );
};
