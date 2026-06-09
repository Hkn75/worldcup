import React from 'react';

interface ScoreInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({
  value,
  onChange,
  placeholder = '-',
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    if (valStr === '') {
      onChange(null);
      return;
    }

    // Filter out non-numeric characters
    const cleanStr = valStr.replace(/[^0-9]/g, '');
    if (cleanStr === '') {
      onChange(null);
      return;
    }

    const parsed = parseInt(cleanStr, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 99) {
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value === null ? '' : value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-12 h-12 sm:w-14 sm:h-14 text-center font-display text-xl sm:text-2xl font-bold bg-primary-dark/80 text-white border-2 border-slate-700 rounded-xl focus:border-secondary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-inner"
    />
  );
};
