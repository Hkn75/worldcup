import React, { useState } from 'react';
import type { Prediction } from '../types';
import { importPredictionFromString } from '../lib/predictionExport';

interface PredictionUploadProps {
  existingNames: string[];
  onUploadSuccess: (prediction: Prediction) => void;
}

export const PredictionUpload: React.FC<PredictionUploadProps> = ({
  existingNames,
  onUploadSuccess
}) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingPrediction, setPendingPrediction] = useState<Prediction | null>(null);

  const handleProcessText = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPendingPrediction(null);

    if (!text.trim()) {
      setError('Lütfen tahmin metnini buraya yapıştırın.');
      return;
    }

    try {
      const parsed = importPredictionFromString(text);
      
      // Check for name collision
      const nameExists = existingNames.some(
        (name) => name.toLowerCase() === parsed.participantName.toLowerCase()
      );

      if (nameExists) {
        setPendingPrediction(parsed);
      } else {
        onUploadSuccess(parsed);
        setSuccess(`Tebrikler! ${parsed.participantName} isimli katılımcının tahminleri başarıyla eklendi.`);
        setText('');
      }
    } catch (err: any) {
      setError(err.message || 'Tahmin metni çözümlenirken hata oluştu.');
    }
  };

  const handleConfirmOverwrite = () => {
    if (pendingPrediction) {
      onUploadSuccess(pendingPrediction);
      setSuccess(`${pendingPrediction.participantName} isimli katılımcının tahminleri başarıyla güncellendi.`);
      setPendingPrediction(null);
      setText('');
    }
  };

  const handleCancelOverwrite = () => {
    setPendingPrediction(null);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/5 shadow-md">
      <h3 className="font-display font-bold text-white text-lg sm:text-xl mb-3">
        Yeni Katılımcı Tahmini Yükle
      </h3>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Katılımcının e-posta veya kopyalayarak gönderdiği, <code>WC2026_TAHMIN</code> ile başlayan ve <code>END_WC2026_TAHMIN</code> ile biten metin bloğunu aşağıdaki alana yapıştırıp yükleyin.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 text-rose-500 text-xs sm:text-sm font-semibold rounded-xl border border-rose-500/20">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-500 text-xs sm:text-sm font-semibold rounded-xl border border-emerald-500/20 animate-pulse-slow">
          ✅ {success}
        </div>
      )}

      {pendingPrediction && (
        <div className="mb-4 p-4 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20 animate-fade-in">
          <p className="text-xs sm:text-sm font-bold mb-3">
            ⚠️ Diğerlerinden Farklı Karar Gerekiyor!
          </p>
          <p className="text-xs mb-3 text-slate-300">
            <strong>"{pendingPrediction.participantName}"</strong> isimli katılımcıya ait tahminler zaten sistemde mevcut. Üzerine yazarak güncellemek istiyor musunuz?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmOverwrite}
              className="px-3 py-1.5 text-xs font-bold bg-yellow-500 text-primary-dark rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Evet, Üzerine Yaz (Güncelle)
            </button>
            <button
              type="button"
              onClick={handleCancelOverwrite}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleProcessText} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={pendingPrediction !== null}
            placeholder="WC2026_TAHMIN&#10;{&#10;  &quot;participantName&quot;: ...&#10;}&#10;END_WC2026_TAHMIN"
            rows={8}
            className="w-full p-3 bg-primary-dark/80 text-white font-mono text-xs border border-slate-800 rounded-xl focus:border-secondary focus:outline-none disabled:opacity-50 transition-colors shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={pendingPrediction !== null}
          className="w-full py-3 px-4 font-display font-bold text-sm text-white bg-secondary hover:bg-secondary-hover rounded-xl shadow-lg hover:shadow-secondary/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          Tahmini Ayrıştır ve Yükle
        </button>
      </form>
    </div>
  );
};
