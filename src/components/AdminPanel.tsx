import React, { useState } from 'react';
import { Lock, Unlock, Database, Trash2, Download, Upload, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Match, ActualResult, ActualBonus, Prediction } from '../types';
import { getPlaceholderTeamName } from './MatchCard';
import { PredictionUpload } from './PredictionUpload';
import { initializeActualResults, storageService } from '../lib/storage';
import { groupMatches } from '../data/groupMatches';
import { teams } from '../data/teams';
import { buildKnockoutMatches } from '../lib/bracket';
import { calculateGroupStandings } from '../lib/groupStandings';

interface AdminPanelProps {
  predictions: Prediction[];
  actualResults: Record<number, ActualResult>;
  actualBonus: ActualBonus;
  onDataUpdate: (
    predictions: Prediction[],
    actualResults: Record<number, ActualResult>,
    actualBonus: ActualBonus
  ) => void;
}

// NOTE: CLIENT-SIDE PASSWORD PROTECTION
// This is a client-side utility only and is not meant for production security.
// For production, integrate with a real backend authorization service like Firebase Auth or Supabase Auth.
const ADMIN_PASSWORD = 'admin2026';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  predictions,
  actualResults,
  actualBonus,
  onDataUpdate
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Match scores editing state
  const [selectedMatchId, setSelectedMatchId] = useState<number>(1);
  const [homeGoals, setHomeGoals] = useState<string>('');
  const [awayGoals, setAwayGoals] = useState<string>('');
  const [winnerTeamId, setWinnerTeamId] = useState<string>('');
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const [activeAdminTab, setActiveAdminTab] = useState<'scores' | 'participants' | 'backup'>('scores');
  const [syncLoading, setSyncLoading] = useState(false);

  // Handle Admin Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setAuthError('Hatalı şifre! Lütfen tekrar deneyin.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveAdminTab('scores');
  };

  const handleSyncOfficialScores = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch('https://worldcupjson.net/matches');
      if (!response.ok) throw new Error('API bağlantısı kurulamadı.');
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Geçersiz veri formatı.');
      }

      const updatedResults = { ...actualResults };
      let updatedCount = 0;

      allCompiledMatches.forEach((match) => {
        const found = data.find((g: any) => {
          const apiHome = (g.home_team?.code || g.home_team?.country || '').toUpperCase();
          const apiAway = (g.away_team?.code || g.away_team?.country || '').toUpperCase();
          return (
            (apiHome === match.homeTeamId && apiAway === match.awayTeamId) ||
            (apiHome === match.awayTeamId && apiAway === match.homeTeamId)
          );
        });

        if (found && (found.status === 'completed' || found.completed)) {
          const apiHomeGoals = found.home_team?.goals;
          const apiAwayGoals = found.away_team?.goals;

          if (apiHomeGoals !== undefined && apiAwayGoals !== undefined) {
            const apiHomeCode = (found.home_team?.code || found.home_team?.country || '').toUpperCase();
            const homeGoalsValue = apiHomeCode === match.homeTeamId ? apiHomeGoals : apiAwayGoals;
            const awayGoalsValue = apiHomeCode === match.homeTeamId ? apiAwayGoals : apiHomeGoals;

            let winnerId: string | undefined = undefined;
            if (match.id > 72) {
              if (homeGoalsValue === awayGoalsValue) {
                const apiWinner = (found.winner_code || found.winner || '').toUpperCase();
                winnerId = apiWinner || undefined;
              } else {
                winnerId = homeGoalsValue > awayGoalsValue ? match.homeTeamId : match.awayTeamId;
              }
            }

            const current = updatedResults[match.id];
            if (!current?.played || current.homeGoals !== homeGoalsValue || current.awayGoals !== awayGoalsValue) {
              updatedResults[match.id] = {
                matchId: match.id,
                homeGoals: homeGoalsValue,
                awayGoals: awayGoalsValue,
                winnerTeamId: winnerId,
                played: true
              };
              updatedCount++;
            }
          }
        }
      });

      if (updatedCount > 0) {
        const updatedBonus = { ...actualBonus };
        const finalMatch = updatedResults[104];
        if (finalMatch && finalMatch.played) {
          const finalMatchDetails = allCompiledMatches.find(m => m.id === 104);
          const homeId = finalMatchDetails?.homeTeamId || '';
          const awayId = finalMatchDetails?.awayTeamId || '';
          if (finalMatch.homeGoals > finalMatch.awayGoals) {
            updatedBonus.champion = homeId;
            updatedBonus.runnerUp = awayId;
          } else if (finalMatch.homeGoals < finalMatch.awayGoals) {
            updatedBonus.champion = awayId;
            updatedBonus.runnerUp = homeId;
          } else {
            updatedBonus.champion = finalMatch.winnerTeamId;
            updatedBonus.runnerUp = finalMatch.winnerTeamId === homeId ? awayId : homeId;
          }
        }

        const thirdMatch = updatedResults[103];
        if (thirdMatch && thirdMatch.played) {
          const thirdMatchDetails = allCompiledMatches.find(m => m.id === 103);
          const homeId = thirdMatchDetails?.homeTeamId || '';
          const awayId = thirdMatchDetails?.awayTeamId || '';
          if (thirdMatch.homeGoals > thirdMatch.awayGoals) {
            updatedBonus.third = homeId;
            updatedBonus.fourth = awayId;
          } else if (thirdMatch.homeGoals < thirdMatch.awayGoals) {
            updatedBonus.third = awayId;
            updatedBonus.fourth = homeId;
          } else {
            updatedBonus.third = thirdMatch.winnerTeamId;
            updatedBonus.fourth = thirdMatch.winnerTeamId === homeId ? awayId : homeId;
          }
        }

        storageService.saveActualResults(updatedResults);
        storageService.saveActualBonus(updatedBonus);
        onDataUpdate(predictions, updatedResults, updatedBonus);
        alert(`Başarılı! ${updatedCount} adet tamamlanmış maç skoru API üzerinden çekilerek güncellendi.`);
      } else {
        alert('Yeni tamamlanmış veya güncellenecek maç skoru bulunamadı.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Resmi sonuçlar çekilirken hata oluştu. İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
    } finally {
      setSyncLoading(false);
    }
  };

  // Helper to compile matches based on current actual standings
  const getCompiledKnockoutMatches = (): Match[] => {
    // 1. Calculate actual group standings
    const standings: Record<string, any> = {};
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    let isComplete = true;
    groups.forEach(g => {
      const gTeams = teams.filter(t => t.group === g);
      const res = calculateGroupStandings(g, gTeams, groupMatches, actualResults);
      standings[g] = res.standings;
      if (!res.isComplete) isComplete = false;
    });

    const { matches } = buildKnockoutMatches(standings, isComplete, actualResults);
    return matches;
  };

  const allCompiledMatches = [...groupMatches, ...getCompiledKnockoutMatches()];
  const currentMatch = allCompiledMatches.find(m => m.id === selectedMatchId);

  // Set default scores on match change
  React.useEffect(() => {
    const act = actualResults[selectedMatchId];
    if (act && act.played) {
      setHomeGoals(String(act.homeGoals));
      setAwayGoals(String(act.awayGoals));
      setWinnerTeamId(act.winnerTeamId || '');
    } else {
      setHomeGoals('');
      setAwayGoals('');
      setWinnerTeamId('');
    }
    setEditSuccess(null);
  }, [selectedMatchId, actualResults]);

  // Handle Score Submission
  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess(null);

    if (homeGoals === '' || awayGoals === '') {
      alert('Lütfen her iki takım için de gol girin.');
      return;
    }

    const hg = parseInt(homeGoals, 10);
    const ag = parseInt(awayGoals, 10);

    if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) {
      alert('Geçerli skor değerleri girin.');
      return;
    }

    const isKnockout = selectedMatchId > 72;
    let winnerId = '';
    
    if (isKnockout) {
      if (hg === ag) {
        if (!winnerTeamId) {
          alert('Eleme turlarında beraberlik durumunda tur atlayan takımı seçmelisiniz.');
          return;
        }
        winnerId = winnerTeamId;
      } else {
        winnerId = hg > ag ? currentMatch?.homeTeamId || '' : currentMatch?.awayTeamId || '';
      }
    }

    const updatedResults = { ...actualResults };
    updatedResults[selectedMatchId] = {
      matchId: selectedMatchId,
      homeGoals: hg,
      awayGoals: ag,
      winnerTeamId: winnerId || undefined,
      played: true
    };

    // Calculate actual bonus updates automatically if final / 3rd place is finished
    const updatedBonus = { ...actualBonus };
    if (selectedMatchId === 104) { // Final
      const finalMatch = updatedResults[104];
      if (finalMatch && finalMatch.played) {
        const homeId = currentMatch?.homeTeamId || '';
        const awayId = currentMatch?.awayTeamId || '';
        if (finalMatch.homeGoals > finalMatch.awayGoals) {
          updatedBonus.champion = homeId;
          updatedBonus.runnerUp = awayId;
        } else if (finalMatch.homeGoals < finalMatch.awayGoals) {
          updatedBonus.champion = awayId;
          updatedBonus.runnerUp = homeId;
        } else {
          updatedBonus.champion = finalMatch.winnerTeamId;
          updatedBonus.runnerUp = finalMatch.winnerTeamId === homeId ? awayId : homeId;
        }
      }
    } else if (selectedMatchId === 103) { // 3rd Place Playoff
      const thirdMatch = updatedResults[103];
      if (thirdMatch && thirdMatch.played) {
        const homeId = currentMatch?.homeTeamId || '';
        const awayId = currentMatch?.awayTeamId || '';
        if (thirdMatch.homeGoals > thirdMatch.awayGoals) {
          updatedBonus.third = homeId;
          updatedBonus.fourth = awayId;
        } else if (thirdMatch.homeGoals < thirdMatch.awayGoals) {
          updatedBonus.third = awayId;
          updatedBonus.fourth = homeId;
        } else {
          updatedBonus.third = thirdMatch.winnerTeamId;
          updatedBonus.fourth = thirdMatch.winnerTeamId === homeId ? awayId : homeId;
        }
      }
    }

    storageService.saveActualResults(updatedResults);
    storageService.saveActualBonus(updatedBonus);
    onDataUpdate(predictions, updatedResults, updatedBonus);

    setEditSuccess(`Maç #${selectedMatchId} sonucu başarıyla kaydedildi.`);
  };

  // Handle Score Deletion
  const handleDeleteScore = () => {
    if (!window.confirm(`Maç #${selectedMatchId} sonucunu silmek istediğinize emin misiniz?`)) return;

    const updatedResults = { ...actualResults };
    updatedResults[selectedMatchId] = {
      matchId: selectedMatchId,
      homeGoals: 0,
      awayGoals: 0,
      played: false
    };

    const updatedBonus = { ...actualBonus };
    if (selectedMatchId === 104) {
      delete updatedBonus.champion;
      delete updatedBonus.runnerUp;
    } else if (selectedMatchId === 103) {
      delete updatedBonus.third;
      delete updatedBonus.fourth;
    }

    storageService.saveActualResults(updatedResults);
    storageService.saveActualBonus(updatedBonus);
    onDataUpdate(predictions, updatedResults, updatedBonus);
    
    setHomeGoals('');
    setAwayGoals('');
    setWinnerTeamId('');
    setEditSuccess(`Maç #${selectedMatchId} sonucu silindi.`);
  };

  // Upload parsed prediction
  const handleUploadPrediction = (newPred: Prediction) => {
    const filtered = predictions.filter(
      (p) => p.participantName.toLowerCase() !== newPred.participantName.toLowerCase()
    );
    const updated = [...filtered, newPred];
    storageService.savePredictions(updated);
    onDataUpdate(updated, actualResults, actualBonus);
  };

  // Delete Participant
  const handleDeleteParticipant = (name: string) => {
    if (!window.confirm(`"${name}" isimli katılımcıyı silmek istediğinize emin misiniz?`)) return;
    const updated = predictions.filter((p) => p.participantName !== name);
    storageService.savePredictions(updated);
    onDataUpdate(updated, actualResults, actualBonus);
  };

  // Delete all scores
  const handleResetScores = () => {
    if (!window.confirm('Tüm GERÇEK maç sonuçlarını ve dereceleri silmek istediğinize emin misiniz?')) return;
    const initial = initializeActualResults();
    storageService.saveActualResults(initial);
    storageService.saveActualBonus({});
    onDataUpdate(predictions, initial, {});
    alert('Tüm gerçek maç skorları temizlendi.');
  };

  // Export database
  const handleExportDatabase = () => {
    const data = {
      predictions,
      actualResults,
      actualBonus
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `wc2026_tahmin_veritabani_${new Date().toISOString().split('T')[0]}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Import database
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.predictions && parsed.actualResults && parsed.actualBonus) {
          storageService.savePredictions(parsed.predictions);
          storageService.saveActualResults(parsed.actualResults);
          storageService.saveActualBonus(parsed.actualBonus);
          onDataUpdate(parsed.predictions, parsed.actualResults, parsed.actualBonus);
          alert('Veritabanı başarıyla içe aktarıldı.');
        } else {
          alert('Hata: JSON dosya formatı uygun değil. predictions, actualResults ve actualBonus alanları bulunamadı.');
        }
      } catch (err) {
        alert('Hata: JSON dosyası çözümlenemedi.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-[#1a0e1b] border-2 border-rose-500/20 shadow-2xl relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 blur-3xl rounded-full" />
        
        <div className="text-center mb-6 space-y-2 z-10 relative">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert size={28} />
          </div>
          <h2 className="font-display font-black text-white text-2xl tracking-wide">
            YÖNETİCİ GİRİŞİ
          </h2>
          <p className="text-xs text-rose-400 font-semibold tracking-wider uppercase">
            Giriş için yönetici şifresini yazın
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-500/20 text-rose-300 text-xs sm:text-sm font-semibold rounded-xl border border-rose-500/40 text-center animate-shake">
            {authError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
              Admin Şifresi:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-primary-dark/80 text-white font-mono text-sm border-2 border-slate-800 focus:border-rose-500/70 rounded-xl focus:outline-none transition-colors shadow-inner"
              />
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 font-display font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg hover:shadow-rose-600/20 transition-all active:scale-98 cursor-pointer"
          >
            Sisteme Giriş Yap
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-slate-500 border-t border-slate-800/60 pt-4 leading-normal">
          <span>* Varsayılan şifre: <code>admin2026</code></span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-4 sm:p-6 rounded-3xl bg-[#150a0a]/90 border border-rose-500/30 shadow-2xl relative">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-rose-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center border border-rose-500/30">
            <Unlock size={20} />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-white text-lg sm:text-xl">
              Yönetici Kontrol Paneli
            </h2>
            <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
              World Cup 2026 Tahmin Yönetimi
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          Çıkış Yap
        </button>
      </div>

      {/* Admin tab buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveAdminTab('scores')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            activeAdminTab === 'scores'
              ? 'bg-rose-600 border-rose-600 text-white shadow-md'
              : 'bg-primary-dark/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          ⚽ Gerçek Skor Girişi
        </button>
        <button
          onClick={() => setActiveAdminTab('participants')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            activeAdminTab === 'participants'
              ? 'bg-rose-600 border-rose-600 text-white shadow-md'
              : 'bg-primary-dark/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          👥 Katılımcı ve Tahminler
        </button>
        <button
          onClick={() => setActiveAdminTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            activeAdminTab === 'backup'
              ? 'bg-rose-600 border-rose-600 text-white shadow-md'
              : 'bg-primary-dark/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Database size={14} /> Veritabanı & Yedek
        </button>
      </div>

      {/* Tab 1: Gerçek Skor Girişi */}
      {activeAdminTab === 'scores' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/5 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-slate-800/40">
              <h3 className="font-display font-bold text-white text-base sm:text-lg">
                Gerçek Sonuç Girişi Yap
              </h3>
              <button
                type="button"
                onClick={handleSyncOfficialScores}
                disabled={syncLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {syncLoading ? '🔄 Güncelleniyor...' : '📥 Resmi Sonuçları API\'den Çek ve Güncelle'}
              </button>
            </div>

            {editSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm font-semibold rounded-xl border border-emerald-500/20">
                ✅ {editSuccess}
              </div>
            )}

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Match Select dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
                    Maç Seçin:
                  </label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(Number(e.target.value))}
                    className="w-full p-3 bg-primary-dark/80 text-white text-xs sm:text-sm border border-slate-800 rounded-xl focus:border-rose-500/70 focus:outline-none transition-colors"
                  >
                    <optgroup label="Grup Maçları (1 - 72)">
                      {allCompiledMatches.filter(m => m.stage === 'group').map(m => {
                        const h = getPlaceholderTeamName(m.homeTeamId).name;
                        const a = getPlaceholderTeamName(m.awayTeamId).name;
                        const status = actualResults[m.id]?.played ? '✓ Oynandı' : 'Bekliyor';
                        return (
                          <option key={m.id} value={m.id}>
                            Maç {m.id} ({m.group} Grubu): {h} - {a} ({status})
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="Eleme Aşamaları (73 - 104)">
                      {allCompiledMatches.filter(m => m.stage !== 'group').map(m => {
                        const h = getPlaceholderTeamName(m.homeTeamId).name;
                        const a = getPlaceholderTeamName(m.awayTeamId).name;
                        const status = actualResults[m.id]?.played ? '✓ Oynandı' : 'Bekliyor';
                        const stageLabel =
                          m.stage === 'r32' ? 'Son 32' :
                          m.stage === 'r16' ? 'Son 16' :
                          m.stage === 'qf' ? 'Çeyrek' :
                          m.stage === 'sf' ? 'Yarı Final' :
                          m.stage === 'thirdPlace' ? '3.lük' : 'Final';
                        return (
                          <option key={m.id} value={m.id}>
                            Maç {m.id} ({stageLabel}): {h} - {a} ({status})
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>

                {/* Score Input block */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
                    Gerçek Skor Girişi:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        placeholder="Ev"
                        value={homeGoals}
                        onChange={(e) => setHomeGoals(e.target.value)}
                        className="w-full p-2.5 text-center bg-primary-dark/80 text-white font-display font-bold border border-slate-800 rounded-xl focus:border-rose-500/70 focus:outline-none"
                      />
                    </div>
                    <span className="text-slate-500 font-black">:</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        placeholder="Dep"
                        value={awayGoals}
                        onChange={(e) => setAwayGoals(e.target.value)}
                        className="w-full p-2.5 text-center bg-primary-dark/80 text-white font-display font-bold border border-slate-800 rounded-xl focus:border-rose-500/70 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Winner selection for knockout draws */}
              {selectedMatchId > 72 && homeGoals !== '' && awayGoals !== '' && parseInt(homeGoals, 10) === parseInt(awayGoals, 10) && (
                <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 text-center animate-fade-in">
                  <p className="text-xs text-rose-400 font-bold mb-2 uppercase tracking-wider">
                    Uzatma/Penaltılar Galibi (Tur Atlayan):
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setWinnerTeamId(currentMatch?.homeTeamId || '')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                        winnerTeamId === currentMatch?.homeTeamId
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105'
                          : 'bg-primary-dark text-slate-300 border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      {getPlaceholderTeamName(currentMatch?.homeTeamId || '').name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWinnerTeamId(currentMatch?.awayTeamId || '')}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                        winnerTeamId === currentMatch?.awayTeamId
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105'
                          : 'bg-primary-dark text-slate-300 border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      {getPlaceholderTeamName(currentMatch?.awayTeamId || '').name}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 font-display font-bold text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  Sonucu Kaydet
                </button>
                {actualResults[selectedMatchId]?.played && (
                  <button
                    type="button"
                    onClick={handleDeleteScore}
                    className="py-3 px-4 font-display font-bold text-xs sm:text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Maç Sonucunu Sil
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Katılımcılar */}
      {activeAdminTab === 'participants' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fade-in">
          
          {/* Uploader */}
          <PredictionUpload
            existingNames={predictions.map((p) => p.participantName)}
            onUploadSuccess={handleUploadPrediction}
          />

          {/* List of active participants */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/5 shadow-md">
            <h3 className="font-display font-bold text-white text-base sm:text-lg mb-3">
              Kayıtlı Katılımcı Listesi
            </h3>
            
            {predictions.length === 0 ? (
              <p className="text-center text-xs text-slate-500 italic py-6">
                Kayıtlı katılımcı bulunmamaktadır.
              </p>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {predictions.map((p) => (
                  <div
                    key={p.participantName}
                    className="flex justify-between items-center p-3 bg-primary-dark/50 border border-slate-800 rounded-xl hover:bg-primary-dark/80 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">
                        {p.participantName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Yüklenme: {new Date(p.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteParticipant(p.participantName)}
                      className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Katılımcıyı Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: Veritabanı ve Yedekleme */}
      {activeAdminTab === 'backup' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Backup Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Backup export */}
            <div className="p-5 bg-primary-light/20 border border-slate-850 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-white text-sm sm:text-base mb-2">
                  Tüm Verileri Dışa Aktar (Backup)
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-normal">
                  Sistemdeki tüm katılımcı tahminlerini, girilmiş maç sonuçlarını ve bonus derecelerini içeren tek bir JSON dosyası oluşturup indirin.
                </p>
              </div>
              <button
                onClick={handleExportDatabase}
                className="w-full py-2.5 px-3 flex items-center justify-center gap-2 font-display font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <Download size={14} /> Yedek JSON İndir
              </button>
            </div>

            {/* Backup import */}
            <div className="p-5 bg-primary-light/20 border border-slate-850 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-white text-sm sm:text-base mb-2">
                  Yedek JSON Dosyasından Geri Yükle
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-normal">
                  Daha önce dışa aktardığınız yedek JSON dosyasını yükleyerek tüm katılımcıları ve skorları tek seferde geri yükleyin.
                </p>
              </div>
              <label className="w-full py-2.5 px-3 flex items-center justify-center gap-2 font-display font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer text-center">
                <Upload size={14} /> JSON Dosyası Seç
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDatabase}
                  className="hidden"
                />
              </label>
            </div>

          </div>

          {/* Dangerous Zone Panel */}
          <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertTriangle size={18} />
              <h4 className="font-display font-bold text-sm sm:text-base">Tehlikeli Bölge</h4>
            </div>

            <p className="text-xs text-slate-300 leading-normal">
              Aşağıdaki işlemler geri alınamaz. Lütfen işlem yapmadan önce verilerinizi dışa aktararak yedeklediğinizden emin olun.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={handleResetScores}
                className="py-2 px-3 text-xs font-bold bg-slate-800 text-rose-500 hover:text-white hover:bg-rose-600 rounded-xl transition-colors cursor-pointer border border-slate-750"
              >
                Tüm Gerçek Skorları Temizle
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Tüm katılımcıları ve tüm skorları silerek uygulamayı tamamen sıfırlamak istediğinize emin misiniz?')) {
                    storageService.clearAll();
                    onDataUpdate([], initializeActualResults(), {});
                    alert('Tüm uygulama verileri sıfırlandı.');
                  }
                }}
                className="py-2 px-3 text-xs font-bold bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-colors cursor-pointer border border-rose-500/20"
              >
                Tüm Sistem Verilerini Sıfırla (Fabrika Ayarları)
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
