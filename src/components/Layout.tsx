import React from 'react';
import { Trophy } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'prediction' | 'tracking';
  onTabChange: (tab: 'prediction' | 'tracking') => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-primary-dark">
      
      {/* Sticky Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-primary/80 backdrop-blur-md border-b border-slate-800/80 shadow-lg select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('prediction')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center border border-secondary/20 shadow-inner">
              <Trophy size={20} className="sm:w-6 sm:h-6 animate-pulse-slow text-secondary" />
            </div>
            <div>
              <h1 className="font-display font-black text-white text-xs sm:text-sm tracking-wider leading-none m-0 p-0 uppercase">
                Aurotrans Dünya Kupası Tahmin Yarışması
              </h1>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold tracking-widest uppercase">
                FIFA Dünya Kupası · Tahmin Oyunu
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onTabChange('prediction')}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-display font-extrabold text-xs sm:text-sm tracking-wide transition-all border cursor-pointer ${
                activeTab === 'prediction'
                  ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                  : 'bg-primary-light/45 text-slate-400 border-slate-800/60 hover:text-white hover:bg-primary-light/80'
              }`}
            >
              Tahmin Doldur
            </button>
            <button
              onClick={() => onTabChange('tracking')}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-display font-extrabold text-xs sm:text-sm tracking-wide transition-all border cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-secondary text-white border-secondary shadow-md scale-105'
                  : 'bg-primary-light/45 text-slate-400 border-slate-800/60 hover:text-white hover:bg-primary-light/80'
              }`}
            >
              Takip & Canlı Sonuçlar
            </button>
          </nav>

        </div>
      </header>

      {/* Main Body Content Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer Details */}
      <footer className="w-full py-6 bg-primary-dark border-t border-slate-800/40 text-center select-none">
        <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
          FIFA World Cup 2026 Office Prediction Game · Kod Mimarisi Firebase/Supabase uyumludur.
        </p>
        <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-widest font-semibold">
          11 Haziran – 19 Temmuz 2026
        </p>
      </footer>
      
    </div>
  );
};
