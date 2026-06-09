import React, { useRef } from 'react';
import { X, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Prediction, ActualResult } from '../types';
import { getPlaceholderTeamName } from './MatchCard';
import { scoreGroupPrediction, scoreKnockoutPrediction } from '../lib/scoring';

interface MatchDetailModalProps {
  matchId: number;
  stage: string;
  homeTeamId: string;
  awayTeamId: string;
  actualResult: ActualResult;
  predictions: Prediction[];
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  matchId,
  stage,
  homeTeamId,
  awayTeamId,
  actualResult,
  predictions,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const home = getPlaceholderTeamName(homeTeamId);
  const away = getPlaceholderTeamName(awayTeamId);

  const getStageName = (s: string): string => {
    switch (s) {
      case 'group': return 'Grup Aşaması';
      case 'r32': return 'Son 32';
      case 'r16': return 'Son 16';
      case 'qf': return 'Çeyrek Final';
      case 'sf': return 'Yarı Final';
      case 'thirdPlace': return 'Üçüncülük Maçı';
      case 'final': return 'Final';
      default: return '';
    }
  };

  const getParticipantScoreDetails = (p: Prediction) => {
    const isGroup = actualResult.matchId <= 72;
    if (isGroup) {
      const pred = p.groupPredictions[actualResult.matchId];
      if (!pred || pred.homeGoals === null || pred.awayGoals === null) {
        return { scoreStr: '-', points: 0, label: 'Tahmin Yok', badgeClass: 'bg-slate-800 text-slate-400 border-slate-700' };
      }
      
      const pts = scoreGroupPrediction(pred, actualResult);
      const scoreStr = `${pred.homeGoals} - ${pred.awayGoals}`;

      if (pts === 3) {
        return { scoreStr, points: 3, label: 'Tam Skor', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      } else if (pts === 1) {
        return { scoreStr, points: 1, label: 'Doğru Sonuç', badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
      } else {
        return { scoreStr, points: 0, label: 'Yanlış', badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
      }
    } else {
      // Knockout
      const pred = p.knockoutPredictions[actualResult.matchId];
      if (!pred || pred.homeGoals === null || pred.awayGoals === null) {
        return { scoreStr: '-', points: 0, label: 'Tahmin Yok', badgeClass: 'bg-slate-800 text-slate-400 border-slate-700' };
      }

      const pHome = getPlaceholderTeamName(pred.homeTeamId).name;
      const pAway = getPlaceholderTeamName(pred.awayTeamId).name;
      const pWinner = getPlaceholderTeamName(pred.winnerTeamId).name;
      
      const scoreStr = `${pHome} ${pred.homeGoals}-${pred.awayGoals} ${pAway} (${pWinner})`;
      
      // Resolve actual knockout matching context
      const actKnockoutFormat = {
        homeTeamId,
        awayTeamId,
        homeGoals: actualResult.homeGoals,
        awayGoals: actualResult.awayGoals,
        winnerTeamId: actualResult.winnerTeamId || ''
      };

      const pts = scoreKnockoutPrediction(pred, actKnockoutFormat);

      if (pts === 3) {
        return { scoreStr, points: 3, label: 'Tam Skor', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      } else if (pts === 1) {
        return { scoreStr, points: 1, label: 'Doğru Sonuç', badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
      } else {
        return { scoreStr, points: 0, label: 'Yanlış', badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
      }
    }
  };

  const handleExportImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#070b19', // primary dark background
        scale: 2, // Retains high resolution
        useCORS: true // Handles image flag domains
      });

      canvas.toBlob((blob) => {
        if (blob) {
          try {
            // Write image to clipboard
            navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            alert('Analiz kartı görseli panoya kopyalandı! Dilediğiniz yerde yapıştırabilirsiniz.');
          } catch (clipboardError) {
            // Fallback to direct download
            const link = document.createElement('a');
            link.download = `mac-${matchId}-analiz.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Canvas export error', err);
      alert('Görsel oluşturulurken bir sorun oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-dark/85 backdrop-blur-sm animate-fade-in select-none">
      
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-primary border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header Action Buttons */}
        <div className="flex justify-between items-center px-6 py-4 bg-primary-light/30 border-b border-slate-800">
          <h3 className="font-display font-extrabold text-white text-base sm:text-lg">
            Maç Detay & Katılımcı Analizi
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportImage}
              title="Resim Olarak Dışa Aktar"
              className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
            >
              <Camera size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content (Capture Area) */}
        <div className="overflow-y-auto max-h-[70vh] p-6 space-y-6" ref={cardRef} id="match-analysis-card">
          
          {/* Match Info Header */}
          <div className="text-center space-y-2 pb-4 border-b border-slate-800/40">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest bg-primary-light/60 px-3 py-1 rounded-full border border-slate-800">
              {getStageName(stage)} · Maç #{matchId}
            </span>
            
            {/* Team Names & Flags & Score */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex flex-col items-center w-[35%]">
                {home.flagCode ? (
                  <img
                    src={`https://flagcdn.com/w80/${home.flagCode}.png`}
                    alt={home.name}
                    className="w-10 h-7 object-cover rounded shadow-md border border-slate-800"
                  />
                ) : (
                  <span className="text-xl">⚽</span>
                )}
                <span className="font-display font-bold text-white text-xs sm:text-sm mt-1 truncate max-w-full">
                  {home.name}
                </span>
              </div>

              {/* Score Display */}
              <div className="bg-primary-dark/80 px-4 py-2 rounded-2xl border border-slate-800 font-display font-black text-xl sm:text-2xl text-slate-200">
                {actualResult.played ? (
                  `${actualResult.homeGoals} - ${actualResult.awayGoals}`
                ) : (
                  <span className="text-slate-500 font-normal text-xs sm:text-sm">Oynanmadı</span>
                )}
              </div>

              <div className="flex flex-col items-center w-[35%]">
                {away.flagCode ? (
                  <img
                    src={`https://flagcdn.com/w80/${away.flagCode}.png`}
                    alt={away.name}
                    className="w-10 h-7 object-cover rounded shadow-md border border-slate-800"
                  />
                ) : (
                  <span className="text-xl">⚽</span>
                )}
                <span className="font-display font-bold text-white text-xs sm:text-sm mt-1 truncate max-w-full">
                  {away.name}
                </span>
              </div>
            </div>
            
            {actualResult.played && actualResult.winnerTeamId && (
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                Kazanan/Tur Atlayan: {getPlaceholderTeamName(actualResult.winnerTeamId).name}
              </p>
            )}
          </div>

          {/* Participant Predictions List */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-slate-300 text-xs sm:text-sm uppercase tracking-wide px-1">
              Katılımcı Tahminleri ({predictions.length})
            </h4>

            {predictions.length === 0 ? (
              <p className="text-center text-xs text-slate-500 italic py-4">Tahmin yüklenmiş katılımcı bulunmuyor.</p>
            ) : (
              <div className="space-y-2.5">
                {predictions.map((p) => {
                  const details = getParticipantScoreDetails(p);
                  return (
                    <div
                      key={p.participantName}
                      className="flex items-center justify-between p-3 rounded-2xl bg-primary-dark/40 border border-slate-800/50 hover:bg-primary-dark/70 transition-colors"
                    >
                      <div className="flex flex-col max-w-[50%]">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {p.participantName}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate leading-none">
                          {details.scoreStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {actualResult.played && (
                          <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-md border ${details.badgeClass} uppercase tracking-wider`}>
                            {details.label} (+{details.points} P)
                          </span>
                        )}
                        {!actualResult.played && (
                          <span className="text-[10px] text-slate-500 italic">Maç bekliyor</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
