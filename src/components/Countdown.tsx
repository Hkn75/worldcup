import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const Countdown: React.FC = () => {
  const targetDate = new Date('2026-06-11T12:00:00+03:00').getTime();

  const calculateTimeLeft = (): TimeLeft => {
    const difference = targetDate - new Date().getTime();
    let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : String(num);
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto my-6 select-none">
      {Object.entries(timeLeft).map(([label, value]) => {
        const labelTr =
          label === 'days'
            ? 'Gün'
            : label === 'hours'
            ? 'Saat'
            : label === 'minutes'
            ? 'Dakika'
            : 'Saniye';

        return (
          <div
            key={label}
            className="glass-panel rounded-xl py-3 px-2 text-center border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <span className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none z-10 drop-shadow-md">
              {formatNumber(value)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1 z-10">
              {labelTr}
            </span>
          </div>
        );
      })}
    </div>
  );
};
