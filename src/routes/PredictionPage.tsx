import React, { useState, useEffect } from 'react';
import { Clipboard, Mail, Calendar, Play, AlertCircle, Info, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Prediction, GroupPrediction, KnockoutPrediction, PredictionBonus } from '../types';
import { Countdown } from '../components/Countdown';
import { GroupCard } from '../components/GroupCard';
import { Bracket } from '../components/Bracket';
import { teams } from '../data/teams';
import { groupMatches } from '../data/groupMatches';
import { buildKnockoutMatches } from '../lib/bracket';
import { calculateGroupStandings } from '../lib/groupStandings';
import { storageService } from '../lib/storage';
import { validateParticipantName, getMissingGroupPredictions, getMissingKnockoutPredictions } from '../lib/validation';
import { exportPredictionToString } from '../lib/predictionExport';
import { getPlaceholderTeamName } from '../components/MatchCard';

type Step = 'intro' | 'groups' | 'knockout' | 'bonus' | 'submit';

export const PredictionPage: React.FC = () => {
  const [step, setStep] = useState<Step>('intro');
  const [participantName, setParticipantName] = useState('');
  
  // Predictions state
  const [groupPredictions, setGroupPredictions] = useState<Record<number, GroupPrediction>>({});
  const [knockoutPredictions, setKnockoutPredictions] = useState<Record<number, KnockoutPrediction>>({});
  const [bonus, setBonus] = useState<PredictionBonus>({ champion: '', runnerUp: '', third: '', fourth: '' });
  
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    const draft = storageService.getDraftPrediction();
    if (draft) {
      setParticipantName(draft.participantName);
      setGroupPredictions(draft.groupPredictions);
      setKnockoutPredictions(draft.knockoutPredictions);
      setBonus(draft.bonus);
    } else {
      // Initialize empty predictions
      const initialGroups: Record<number, GroupPrediction> = {};
      groupMatches.forEach((m) => {
        initialGroups[m.id] = { homeGoals: null, awayGoals: null };
      });
      setGroupPredictions(initialGroups);

      const initialKnockouts: Record<number, KnockoutPrediction> = {};
      for (let i = 73; i <= 104; i++) {
        initialKnockouts[i] = { homeTeamId: '', awayTeamId: '', homeGoals: null, awayGoals: null, winnerTeamId: '' };
      }
      setKnockoutPredictions(initialKnockouts);
    }
  }, []);

  // Auto-save draft
  const saveDraft = (
    currentName: string,
    currentGroups: Record<number, GroupPrediction>,
    currentKnockouts: Record<number, KnockoutPrediction>,
    currentBonus: PredictionBonus
  ) => {
    const draft: Prediction = {
      participantName: currentName,
      groupPredictions: currentGroups,
      knockoutPredictions: currentKnockouts,
      bonus: currentBonus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storageService.saveDraftPrediction(draft);
  };

  const triggerSaveToast = () => {
    saveDraft(participantName, groupPredictions, knockoutPredictions, bonus);
    setSaveToast('Taslak başarıyla kaydedildi.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Name validations & starting game
  const handleStartGame = () => {
    setNameError(null);
    const err = validateParticipantName(participantName);
    if (err) {
      setNameError(err);
      return;
    }
    triggerSaveToast();
    setStep('groups');
  };

  // Group Predictions updates
  const handleGroupPredictionChange = (matchId: number, homeGoals: number | null, awayGoals: number | null) => {
    const updated = {
      ...groupPredictions,
      [matchId]: { homeGoals, awayGoals }
    };
    setGroupPredictions(updated);
    saveDraft(participantName, updated, knockoutPredictions, bonus);
  };

  // Compile group standings to construct knockout bracket
  const getCompiledGroupStandings = () => {
    const standingsMap: Record<string, any> = {};
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    let isComplete = true;
    groups.forEach((gLetter) => {
      const groupTeams = teams.filter((t) => t.group === gLetter);
      const res = calculateGroupStandings(gLetter, groupTeams, groupMatches, groupPredictions);
      standingsMap[gLetter] = res.standings;
      if (!res.isComplete) {
        isComplete = false;
      }
    });

    return { standingsMap, isComplete };
  };

  const { standingsMap, isComplete: isGroupStageComplete } = getCompiledGroupStandings();

  // Resolve knockout bracket structure dynamically
  const resolvedKnockout = buildKnockoutMatches(standingsMap, isGroupStageComplete, knockoutPredictions);
  const knockoutMatches = resolvedKnockout.matches;
  const knockoutError = resolvedKnockout.error;

  // Knockout prediction updates
  const handleKnockoutScoreChange = (matchId: number, homeGoals: number | null, awayGoals: number | null) => {
    const match = knockoutMatches.find(m => m.id === matchId);
    if (!match) return;

    let winnerTeamId = '';
    if (homeGoals !== null && awayGoals !== null) {
      if (homeGoals > awayGoals) {
        winnerTeamId = match.homeTeamId;
      } else if (homeGoals < awayGoals) {
        winnerTeamId = match.awayTeamId;
      }
    }

    const updatedKnockouts = {
      ...knockoutPredictions,
      [matchId]: {
        ...knockoutPredictions[matchId],
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeGoals,
        awayGoals,
        winnerTeamId
      }
    };

    setKnockoutPredictions(updatedKnockouts);
    autoUpdateBonus(updatedKnockouts);
  };

  const handleKnockoutWinnerSelect = (matchId: number, winnerTeamId: string) => {
    const updatedKnockouts = {
      ...knockoutPredictions,
      [matchId]: {
        ...knockoutPredictions[matchId],
        winnerTeamId
      }
    };
    setKnockoutPredictions(updatedKnockouts);
    autoUpdateBonus(updatedKnockouts);
  };

  // Automatically update bonus selections based on semi-finals, 3rd place, and final results
  const autoUpdateBonus = (currentKnockouts: Record<number, KnockoutPrediction>) => {
    const updatedBonus = { ...bonus };

    // Final (Match 104)
    const finalPred = currentKnockouts[104];
    if (finalPred && finalPred.homeGoals !== null && finalPred.awayGoals !== null && finalPred.winnerTeamId) {
      updatedBonus.champion = finalPred.winnerTeamId;
      updatedBonus.runnerUp = finalPred.winnerTeamId === finalPred.homeTeamId ? finalPred.awayTeamId : finalPred.homeTeamId;
    } else {
      updatedBonus.champion = '';
      updatedBonus.runnerUp = '';
    }

    // 3rd Place Playoff (Match 103)
    const thirdPred = currentKnockouts[103];
    if (thirdPred && thirdPred.homeGoals !== null && thirdPred.awayGoals !== null && thirdPred.winnerTeamId) {
      updatedBonus.third = thirdPred.winnerTeamId;
      updatedBonus.fourth = thirdPred.winnerTeamId === thirdPred.homeTeamId ? thirdPred.awayTeamId : thirdPred.homeTeamId;
    } else {
      updatedBonus.third = '';
      updatedBonus.fourth = '';
    }

    setBonus(updatedBonus);
    saveDraft(participantName, groupPredictions, currentKnockouts, updatedBonus);
  };

  // Navigation validation
  const navigateToKnockouts = () => {
    if (!isGroupStageComplete) {
      alert('Eleme tahminlerine geçebilmek için tüm grup maçlarının skorlarını tamamlamalısınız.');
      return;
    }
    if (knockoutError) {
      alert(knockoutError);
      return;
    }
    triggerSaveToast();
    setStep('knockout');
  };

  // Submission helpers
  const missingGroupIds = getMissingGroupPredictions(groupPredictions);
  // Typecasting correct knockout structure for validation helper
  const castedKnockouts = knockoutPredictions as Record<number, { homeGoals: number | null; awayGoals: number | null; winnerTeamId: string }>;
  const missingKnockoutIds = getMissingKnockoutPredictions(castedKnockouts);
  const totalMissingMatches = missingGroupIds.length + missingKnockoutIds.length;

  const isBonusIncomplete = !bonus.champion || !bonus.runnerUp || !bonus.third || !bonus.fourth;

  const buildExportPrediction = (): Prediction => {
    return {
      participantName: participantName.trim(),
      groupPredictions,
      knockoutPredictions,
      bonus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleCopyToClipboard = () => {
    const payload = buildExportPrediction();
    const textString = exportPredictionToString(payload);
    
    // Add readable summary to clipboard text for copy-paste convenience
    const summaryText = `WORLD CUP 2026 OFİS TAHMİNİ\nKatılımcı: ${payload.participantName}\nKayıt Tarihi: ${new Date(payload.createdAt).toLocaleString('tr-TR')}\n\nLütfen aşağıdaki kod bloğunu eksiksiz olarak kopyalayıp yöneticinize gönderin:\n\n${textString}`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopyToast('Tahmin kod bloğu panoya kopyalandı!');
      setTimeout(() => setCopyToast(null), 3000);
    });
  };

  const handleSendEmail = () => {
    const payload = buildExportPrediction();
    const textString = exportPredictionToString(payload);
    
    const subject = encodeURIComponent(`WC2026 Tahmin Oyunu - ${payload.participantName}`);
    const body = encodeURIComponent(
      `Merhaba,\n\nWorld Cup 2026 Ofis Tahmin Oyunu tahminlerimi tamamladım. Tahmin kod bloğum aşağıdadır:\n\n${textString}\n\nİyi çalışmalar.`
    );
    window.location.href = `mailto:admin@ofistahmin2026.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Step */}
      {step === 'intro' && (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in select-none">
          {/* Header block */}
          <div className="text-center space-y-3">
            <h2 className="font-display font-black text-white text-2xl sm:text-4xl tracking-wide glow-text-red uppercase leading-tight">
              Aurotrans Dünya Kupası Tahmin Yarışması
            </h2>
            <p className="text-slate-400 font-semibold text-xs sm:text-sm tracking-widest uppercase">
              FIFA Dünya Kupası · Tahmin Oyunu
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-secondary font-bold">
              <Calendar size={14} />
              <span>11 Haziran – 19 Temmuz 2026</span>
            </div>
          </div>

          {/* Countdown timer */}
          <Countdown />

          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { val: '48', desc: 'Takım' },
              { val: '12', desc: 'Grup' },
              { val: '104', desc: 'Maç' },
              { val: '39', desc: 'Gün' }
            ].map((card) => (
              <div
                key={card.desc}
                className="glass-panel rounded-2xl py-3 border border-white/5 text-center flex flex-col justify-center"
              >
                <span className="font-display font-black text-white text-xl sm:text-2xl leading-none">{card.val}</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">{card.desc}</span>
              </div>
            ))}
          </div>

          {/* Scoring system card */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/5 shadow-md">
            <h3 className="font-display font-bold text-white text-base sm:text-lg mb-3 flex items-center gap-2 border-b border-slate-800/40 pb-2">
              <Info size={18} className="text-secondary" /> Puanlama Kuralları
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-secondary/15 text-secondary text-[10px] font-bold rounded">3</span>
                <span>Grup maçı tam skor tahmini</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-secondary/15 text-secondary text-[10px] font-bold rounded">1</span>
                <span>Grup maçı doğru sonuç/beraberlik</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-secondary/15 text-secondary text-[10px] font-bold rounded">3</span>
                <span>Eleme maçı tam skor (eşleşme doğruysa)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-secondary/15 text-secondary text-[10px] font-bold rounded">1</span>
                <span>Eleme maçı doğru sonuç (eşleşme doğruysa)</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2 mt-2 pt-2 border-t border-slate-800/40">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Bonus Derece Puanları:</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-extrabold">+10</span>
                <span>Şampiyon Tahmini</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-extrabold">+5</span>
                <span>İkinci Tahmini</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-extrabold">+4</span>
                <span>Üçüncü Tahmini</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-extrabold">+3</span>
                <span>Dördüncü Tahmini</span>
              </li>
            </ul>
          </div>

          {/* Tiebreaker Warning Box */}
          <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 flex gap-3">
            <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-yellow-500 uppercase tracking-wider">
                Önemli FIFA Formatı Uyarısı
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                FIFA 2026 formatında en iyi üçüncüler ve karmaşık eşleşme senaryoları olduğu için nadir durumlarda fair play/FIFA sıralaması gibi tie-breaker durumları manuel düzeltme gerektirebilir.
              </p>
            </div>
          </div>

          {/* Form screen */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
                Kullanıcı Adı ve Soyadı:
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Örn. Ahmet Yılmaz"
                className="w-full px-4 py-3 bg-primary-dark/80 text-white font-semibold text-sm sm:text-base border border-slate-800 rounded-xl focus:border-secondary focus:outline-none transition-colors shadow-inner"
              />
              {nameError && (
                <p className="text-rose-500 text-xs mt-1.5 font-bold px-1">
                  ⚠️ {nameError}
                </p>
              )}
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4.5 px-4 flex items-center justify-center gap-2 font-display font-black text-sm text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-lg hover:shadow-secondary/20 transition-all active:scale-98 cursor-pointer"
            >
              <Play size={16} /> Tahminleri Doldurmaya Başla
            </button>
          </div>

        </div>
      )}

      {/* Main predictions flow (step !== 'intro') */}
      {step !== 'intro' && (
        <div className="space-y-6">
          
          {/* Header Dashboard status */}
          <div className="flex justify-between items-center bg-primary-light/10 p-3 sm:p-4 rounded-2xl border border-slate-800/60 select-none">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Katılımcı</span>
              <span className="font-bold text-white text-sm sm:text-base">{participantName}</span>
            </div>
            
            {/* Draft status info */}
            <div className="flex items-center gap-2">
              {saveToast && (
                <span className="text-[10px] text-emerald-400 font-semibold animate-pulse-slow">
                  {saveToast}
                </span>
              )}
              <button
                type="button"
                onClick={triggerSaveToast}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
              >
                <Save size={12} /> Taslak Kaydet
              </button>
            </div>
          </div>

          {/* Group Predictions Step */}
          {step === 'groups' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center select-none">
                <h3 className="font-display font-black text-white text-lg sm:text-2xl uppercase tracking-wider">
                  Grup Tahminleri
                </h3>
                <button
                  onClick={navigateToKnockouts}
                  className="px-4 py-2 flex items-center gap-1.5 font-display font-extrabold text-xs text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-md cursor-pointer transition-transform hover:translate-x-0.5"
                >
                  Eleme Aşamasına Geç <ChevronRight size={14} />
                </button>
              </div>

              {/* Groups listing A to L */}
              <div className="space-y-8">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((gLetter) => {
                  const gTeams = teams.filter((t) => t.group === gLetter);
                  const gMatches = groupMatches.filter((m) => m.group === gLetter);
                  return (
                    <GroupCard
                      key={gLetter}
                      groupLetter={gLetter}
                      groupTeams={gTeams}
                      groupMatches={gMatches}
                      predictions={groupPredictions}
                      onPredictionChange={handleGroupPredictionChange}
                    />
                  );
                })}
              </div>

              {/* Bottom Nav Action buttons */}
              <div className="flex justify-between border-t border-slate-800/40 pt-6 select-none">
                <button
                  onClick={() => setStep('intro')}
                  className="px-4 py-2 flex items-center gap-1.5 font-display font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Giriş Ekranına Dön
                </button>
                <button
                  onClick={navigateToKnockouts}
                  className="px-5 py-2.5 flex items-center gap-1.5 font-display font-extrabold text-xs sm:text-sm text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-lg hover:shadow-secondary/20 transition-all cursor-pointer"
                >
                  Eleme Aşamasına Geç <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Knockout Predictions Step */}
          {step === 'knockout' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center select-none">
                <button
                  onClick={() => setStep('groups')}
                  className="px-3.5 py-2 flex items-center gap-1.5 font-display font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Gruplara Geri Dön
                </button>
                <h3 className="font-display font-black text-white text-lg sm:text-2xl uppercase tracking-wider text-center hidden md:block">
                  Eleme Tahminleri
                </h3>
                <button
                  onClick={() => {
                    triggerSaveToast();
                    setStep('bonus');
                  }}
                  className="px-4 py-2 flex items-center gap-1.5 font-display font-extrabold text-xs text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-md cursor-pointer transition-transform hover:translate-x-0.5"
                >
                  Bonus Tahminlere Geç <ChevronRight size={14} />
                </button>
              </div>

              {knockoutError && (
                <div className="p-4 bg-rose-500/10 text-rose-500 text-xs sm:text-sm font-semibold rounded-2xl border border-rose-500/20 text-center select-none">
                  ⚠️ Hata: {knockoutError}
                </div>
              )}

              {!knockoutError && (
                <Bracket
                  knockoutMatches={knockoutMatches}
                  predictions={knockoutPredictions}
                  onScoreChange={handleKnockoutScoreChange}
                  onWinnerSelect={handleKnockoutWinnerSelect}
                />
              )}

              {/* Bottom Nav Action buttons */}
              <div className="flex justify-between border-t border-slate-800/40 pt-6 select-none">
                <button
                  onClick={() => setStep('groups')}
                  className="px-4 py-2 flex items-center gap-1.5 font-display font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Gruplara Geri Dön
                </button>
                <button
                  onClick={() => {
                    triggerSaveToast();
                    setStep('bonus');
                  }}
                  className="px-5 py-2.5 flex items-center gap-1.5 font-display font-extrabold text-xs sm:text-sm text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-lg hover:shadow-secondary/20 transition-all cursor-pointer"
                >
                  Bonus Tahminlere Geç <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Bonus Predictions Step */}
          {step === 'bonus' && (
            <div className="space-y-6 max-w-xl mx-auto animate-fade-in select-none">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep('knockout')}
                  className="px-3.5 py-2 flex items-center gap-1.5 font-display font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Elemelere Geri Dön
                </button>
                <h3 className="font-display font-black text-white text-lg sm:text-xl uppercase tracking-wider">
                  Bonus Derece Tahminleri
                </h3>
                <button
                  onClick={() => {
                    triggerSaveToast();
                    setStep('submit');
                  }}
                  className="px-4 py-2 flex items-center gap-1.5 font-display font-extrabold text-xs text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-md cursor-pointer transition-transform hover:translate-x-0.5"
                >
                  Özeti Gör <ChevronRight size={14} />
                </button>
              </div>

              {/* Bonus Explanation box */}
              <div className="p-4 bg-primary-light/30 border border-slate-800 rounded-2xl text-xs text-slate-400 leading-relaxed space-y-1.5">
                <p><strong>* Otomatik Doldurma:</strong> Şampiyon, İkinci, Üçüncü ve Dördüncü tahminleriniz, eleme bracket'ında girdiğiniz Final ve Üçüncülük maçlarının sonuçlarından otomatik olarak gelmektedir.</p>
                <p>Dilerseniz bu alanları değiştirebilirsiniz, ancak bracket sonuçlarınız ile bonus seçimlerinizin uyumlu kalmasını öneririz.</p>
              </div>

              {/* Bonus Inputs listing */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/5 space-y-4 shadow-xl">
                {[
                  { field: 'champion', label: '🏆 Şampiyon:', placeholder: 'Final maçını tamamlayın' },
                  { field: 'runnerUp', label: '🥈 İkinci:', placeholder: 'Final maçını tamamlayın' },
                  { field: 'third', label: '🥉 Üçüncü:', placeholder: 'Üçüncülük maçını tamamlayın' },
                  { field: 'fourth', label: '🏅 Dördüncü:', placeholder: 'Üçüncülük maçını tamamlayın' }
                ].map((row) => {
                  const val = bonus[row.field as keyof PredictionBonus];
                  const resTeam = getPlaceholderTeamName(val);
                  
                  return (
                    <div key={row.field} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/40 pb-3 last:border-0 last:pb-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-300">{row.label}</span>
                      <div className="flex items-center gap-2">
                        {val && resTeam.flagCode && (
                          <img
                            src={`https://flagcdn.com/w40/${resTeam.flagCode}.png`}
                            alt={resTeam.name}
                            className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-800"
                          />
                        )}
                        <input
                          type="text"
                          readOnly
                          value={resTeam.name || ''}
                          placeholder={row.placeholder}
                          className="px-3 py-2 bg-primary-dark/80 text-white font-bold text-xs sm:text-sm border border-slate-800 rounded-xl w-[200px] focus:outline-none placeholder:text-slate-600 shadow-inner"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Nav Action buttons */}
              <div className="flex justify-between border-t border-slate-800/40 pt-6">
                <button
                  onClick={() => setStep('knockout')}
                  className="px-4 py-2 flex items-center gap-1.5 font-display font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Elemelere Geri Dön
                </button>
                <button
                  onClick={() => {
                    triggerSaveToast();
                    setStep('submit');
                  }}
                  className="px-5 py-2.5 flex items-center gap-1.5 font-display font-extrabold text-xs sm:text-sm text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-lg hover:shadow-secondary/20 transition-all cursor-pointer"
                >
                  Özeti Gör & Gönder <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Submit Step */}
          {step === 'submit' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in select-none">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep('bonus')}
                  className="px-3.5 py-2 flex items-center gap-1.5 font-display font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Bonuslara Geri Dön
                </button>
                <h3 className="font-display font-black text-white text-lg sm:text-xl uppercase tracking-wider">
                  Tahmin Özeti & Gönderim
                </h3>
              </div>

              {/* Toast confirmation */}
              {copyToast && (
                <div className="p-3 bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm font-semibold rounded-xl border border-emerald-500/20 text-center animate-pulse-slow">
                  ✅ {copyToast}
                </div>
              )}

              {/* Missing Matches Panel */}
              {totalMissingMatches > 0 && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-500">
                  <AlertCircle className="shrink-0 mt-0.5 animate-pulse-slow" size={18} />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide">Eksik Tahminler Var!</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Toplamda <strong>{totalMissingMatches}</strong> adet tahmininiz eksik görünüyor ({missingGroupIds.length} Grup, {missingKnockoutIds.length} Eleme maçı). Göndermeden önce tamamlamanızı öneririz.
                    </p>
                  </div>
                </div>
              )}

              {isBonusIncomplete && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-500">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide">Bonus Dereceleri Eksik!</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Şampiyonluk ve derece seçimleriniz doldurulmamış. Lütfen eleme ağacındaki Final ve Üçüncülük maçlarını oynayarak tamamlayın.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary details card */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/5 space-y-4 shadow-xl">
                <h4 className="font-display font-black text-white text-sm sm:text-base border-b border-slate-800/40 pb-2 uppercase tracking-wider">
                  Tahminlerinizin Özeti
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 block">Katılımcı Adı:</span>
                    <span className="font-bold text-white text-sm sm:text-base">{participantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tarih:</span>
                    <span className="font-bold text-white">{new Date().toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800/20 grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span>Grup Tahminleri:</span>
                      <strong className={`block ${missingGroupIds.length === 0 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                        {72 - missingGroupIds.length} / 72 Dolduruldu
                      </strong>
                    </div>
                    <div>
                      <span>Eleme Tahminleri:</span>
                      <strong className={`block ${missingKnockoutIds.length === 0 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                        {32 - missingKnockoutIds.length} / 32 Dolduruldu
                      </strong>
                    </div>
                  </div>
                  
                  <div className="col-span-2 pt-3 border-t border-slate-800/20">
                    <span className="text-slate-400 block mb-2 text-xs font-bold uppercase tracking-wider">Şampiyonluk Kürsüsü:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-primary-dark/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-amber-500 font-extrabold block text-[10px] uppercase">1. Şampiyon</span>
                        <strong className="text-white text-xs truncate block mt-0.5">{getPlaceholderTeamName(bonus.champion).name || '-'}</strong>
                      </div>
                      <div className="bg-primary-dark/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-300 font-extrabold block text-[10px] uppercase">2. İkinci</span>
                        <strong className="text-white text-xs truncate block mt-0.5">{getPlaceholderTeamName(bonus.runnerUp).name || '-'}</strong>
                      </div>
                      <div className="bg-primary-dark/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-amber-700 font-extrabold block text-[10px] uppercase">3. Üçüncü</span>
                        <strong className="text-white text-xs truncate block mt-0.5">{getPlaceholderTeamName(bonus.third).name || '-'}</strong>
                      </div>
                      <div className="bg-primary-dark/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 font-extrabold block text-[10px] uppercase">4. Dördüncü</span>
                        <strong className="text-white text-xs truncate block mt-0.5">{getPlaceholderTeamName(bonus.fourth).name || '-'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Action Box */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const payload = buildExportPrediction();
                    const existing = storageService.getPredictions();
                    const idx = existing.findIndex(p => p.participantName.toLowerCase() === payload.participantName.toLowerCase());
                    if (idx >= 0) {
                      existing[idx] = payload;
                    } else {
                      existing.push(payload);
                    }
                    storageService.savePredictions(existing);
                    alert('Tahminleriniz başarıyla Aurotrans yarışma listesine kaydedildi! "Takip & Canlı Sonuçlar" sekmesinde sıralamanızı görebilirsiniz.');
                    setCopyToast('Tahminleriniz başarıyla listeye kaydedildi! "Takip & Canlı Sonuçlar" sekmesinde görebilirsiniz.');
                    setTimeout(() => setCopyToast(null), 5000);
                  }}
                  disabled={participantName === ''}
                  className="w-full py-4 px-4 flex items-center justify-center gap-2 font-display font-black text-sm text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg hover:shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
                >
                  💾 Tahminlerimi Yarışma Listesine Kaydet
                </button>
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={participantName === ''}
                  className="w-full py-3.5 px-4 flex items-center justify-center gap-2 font-display font-black text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Clipboard size={16} /> Tahminleri Panoya Kopyala (Yönetici İçin)
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={participantName === ''}
                  className="w-full py-4 px-4 flex items-center justify-center gap-2 font-display font-black text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Mail size={16} /> Tahminlerimi E-posta ile Gönder
                </button>
              </div>

            </div>
          )}

          {/* Sticky bottom tab navigation for mobile layout */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary/95 backdrop-blur-md border-t border-slate-800 shadow-2xl block lg:hidden select-none">
            <div className="flex justify-between items-center max-w-md mx-auto px-4 py-2">
              {[
                { val: 'groups', icon: '⚽', label: 'Gruplar' },
                { val: 'knockout', icon: '🌳', label: 'Eleme' },
                { val: 'bonus', icon: '🏆', label: 'Bonus' },
                { val: 'submit', icon: '✉️', label: 'Gönder' }
              ].map((btn) => {
                const isActive = step === btn.val;
                const isBtnDisabled = btn.val === 'knockout' && !isGroupStageComplete;

                return (
                  <button
                    key={btn.val}
                    type="button"
                    disabled={isBtnDisabled}
                    onClick={() => setStep(btn.val as Step)}
                    className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      isActive ? 'text-secondary' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-lg mb-0.5 leading-none">{btn.icon}</span>
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Large display screen padding to offset footer */}
          <div className="h-16 lg:h-0" />
          
        </div>
      )}

    </div>
  );
};
