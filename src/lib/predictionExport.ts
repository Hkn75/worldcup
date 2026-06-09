import type { Prediction } from '../types';

/**
 * Serializes a Prediction object into a tagged text format.
 */
export const exportPredictionToString = (prediction: Prediction): string => {
  const data = {
    participantName: prediction.participantName,
    createdAt: prediction.createdAt,
    groupPredictions: prediction.groupPredictions,
    knockoutPredictions: prediction.knockoutPredictions,
    bonus: prediction.bonus
  };
  
  // Format as readable JSON inside WC2026_TAHMIN tags
  return `WC2026_TAHMIN\n${JSON.stringify(data, null, 2)}\nEND_WC2026_TAHMIN`;
};

/**
 * Deserializes and validates a prediction from a tagged text block.
 * Throws an descriptive error if formatting or structure is invalid.
 */
export const importPredictionFromString = (text: string): Prediction => {
  const startMarker = 'WC2026_TAHMIN';
  const endMarker = 'END_WC2026_TAHMIN';
  
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Hata: "WC2026_TAHMIN" ve "END_WC2026_TAHMIN" etiketleri metin içerisinde bulunamadı.');
  }

  if (endIndex <= startIndex) {
    throw new Error('Hata: Kapanış etiketi başlangıç etiketinden önce geliyor.');
  }

  const jsonContent = text.substring(startIndex + startMarker.length, endIndex).trim();
  
  try {
    const parsed = JSON.parse(jsonContent);

    // Validate structure
    if (!parsed.participantName || typeof parsed.participantName !== 'string' || parsed.participantName.trim() === '') {
      throw new Error('Katılımcı ismi boş veya geçersiz.');
    }
    
    if (!parsed.groupPredictions || typeof parsed.groupPredictions !== 'object') {
      throw new Error('Grup tahminleri verisi (groupPredictions) eksik.');
    }

    if (!parsed.knockoutPredictions || typeof parsed.knockoutPredictions !== 'object') {
      throw new Error('Eleme tahminleri verisi (knockoutPredictions) eksik.');
    }

    if (!parsed.bonus || typeof parsed.bonus !== 'object') {
      throw new Error('Bonus tahminleri verisi (bonus) eksik.');
    }

    // Verify fields
    const champion = parsed.bonus.champion;
    const runnerUp = parsed.bonus.runnerUp;
    const third = parsed.bonus.third;
    const fourth = parsed.bonus.fourth;
    
    if (!champion || !runnerUp || !third || !fourth) {
      throw new Error('Bonus tahmin alanları (şampiyon, ikinci, üçüncü, dördüncü) eksik.');
    }

    return {
      participantName: parsed.participantName.trim(),
      groupPredictions: parsed.groupPredictions,
      knockoutPredictions: parsed.knockoutPredictions,
      bonus: parsed.bonus,
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error(`Geçersiz JSON formatı: ${error.message}`);
    }
    throw new Error(error.message || 'Tahmin yükleme başarısız oldu.');
  }
};
