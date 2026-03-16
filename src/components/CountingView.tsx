import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function CountingView() {
  const { selectedMantra, setCurrentView, incrementCount, decrementCount, resetTodayCount, notificationSettings, showToast } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const mantra = selectedMantra;
  if (!mantra) { setCurrentView('savedMantras'); return null; }

  const todayCount = mantra.todayCount || 0;
  const malaSize = mantra.malaSize || 108;
  const todayMalas = Math.floor(todayCount / malaSize);
  const currentMalaProgress = todayCount % malaSize;

  const handleIncrement = useCallback(() => {
    const newCount = todayCount + 1;
    incrementCount(mantra.id);
    if (notificationSettings.countVibration && navigator.vibrate) navigator.vibrate(50);
    if (newCount > 0 && newCount % malaSize === 0) {
      setShowCelebration(true);
      if (notificationSettings.malaVibration && navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
      showToast('🎉 Mala Complete!', 'success');
      setTimeout(() => setShowCelebration(false), 2500);
    }
  }, [todayCount, malaSize, mantra.id, incrementCount, notificationSettings, showToast]);

  const handleDecrement = () => { if (todayCount > 0) decrementCount(mantra.id); };
  const handleReset = () => setShowResetModal(true);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handleIncrement(); }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleIncrement]);

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="animate-fade-in flex flex-col bg-gray-50 dark:bg-slate-900" style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>

      {/* Mala Complete Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                backgroundColor: ['#4f46e5','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
          {/* Center card */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-center mx-6 shadow-2xl border border-white/20">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-1">Mala Complete!</h2>
            <p className="text-indigo-200 text-lg font-semibold mb-3">🙏 Sadhu Sadhu 🙏</p>
            <p className="text-white/70 text-sm">{todayMalas} mala{todayMalas !== 1 ? 's' : ''} today</p>
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-ping"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm Modal — Attractive */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full overflow-hidden animate-fade-in shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-redo text-3xl text-white"></i>
              </div>
              <h3 className="text-lg font-bold text-white">Reset Today's Count?</h3>
              <p className="text-white/80 text-sm mt-1">
                {todayCount} mantra{todayCount !== 1 ? 's' : ''} will be reset to zero
              </p>
            </div>
            {/* Body */}
            <div className="p-5">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-5">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5"></i>
                  <span>Only today's count will be reset. Your total count and history will not be affected.</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 active:opacity-80 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { resetTodayCount(mantra.id); setShowResetModal(false); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 active:opacity-90 transition-opacity"
                >
                  <i className="fas fa-redo mr-1"></i> Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Top — Back Button */}
      <div className="flex-shrink-0 bg-slate-700 shadow-sm" >
        <button
          onClick={() => setCurrentView('savedMantras')}
          className="w-full text-white py-3 font-semibold flex items-center justify-center gap-2 active:bg-slate-800 transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Mantras</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Mantra Info */}
        <div className="text-center py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{mantra.name}</h1>
          <div className="flex justify-center items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <span>{malaSize} beads</span><span>•</span><span>{todayDate}</span>
          </div>
        </div>

        {/* Stats Circles */}
        <div className="flex justify-center gap-6 py-4">
          {[
            { value: todayCount, label: 'Today', borderColor: 'border-indigo-500' },
            { value: todayMalas, label: 'Malas', borderColor: 'border-emerald-500' },
            { value: `${currentMalaProgress}/${malaSize}`, label: 'Progress', borderColor: 'border-amber-500' },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className={`w-20 h-20 rounded-full bg-white dark:bg-slate-800 border-4 ${stat.borderColor} flex items-center justify-center shadow-lg`}>
                <span className="text-xl font-bold text-gray-800 dark:text-white">{stat.value}</span>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Big Counting Circle with Progress Ring */}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="relative">
            {/* SVG Progress Ring */}
            <svg width="240" height="240" className="absolute inset-0 -rotate-90">
              {/* Background ring */}
              <circle cx="120" cy="120" r="108" fill="none" stroke="currentColor"
                className="text-gray-200 dark:text-slate-700" strokeWidth="8" />
              {/* Progress ring - changes color at 25/50/75/100% */}
              <circle cx="120" cy="120" r="108" fill="none"
                stroke={
                  progressPercent >= 100 ? '#10b981' :
                  progressPercent >= 75 ? '#f59e0b' :
                  progressPercent >= 50 ? '#8b5cf6' :
                  progressPercent >= 25 ? '#6366f1' : '#4f46e5'
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 108}`}
                strokeDashoffset={`${2 * Math.PI * 108 * (1 - progressPercent / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }}
              />
            </svg>

            {/* Main Button */}
            <button
              onClick={handleIncrement}
              className="w-60 h-60 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              style={{ boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)' }}
            >
              <div className="text-center text-white">
                <div className="text-6xl font-bold tracking-tight">{todayCount}</div>
                <div className="text-sm opacity-80 mt-1 font-medium">Tap to Count</div>
                {currentMalaProgress > 0 && (
                  <div className="text-xs opacity-60 mt-0.5">{currentMalaProgress}/{malaSize} beads</div>
                )}
              </div>
            </button>
          </div>

          {/* Progress labels */}
          <div className="flex items-center gap-4 mt-4">
            {[25, 50, 75, 100].map(pct => (
              <div key={pct} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-all ${progressPercent >= pct ? 'scale-110' : 'opacity-30'}`}
                  style={{ backgroundColor: pct === 100 ? '#10b981' : pct === 75 ? '#f59e0b' : pct === 50 ? '#8b5cf6' : '#6366f1' }} />
                <span className={`text-[10px] font-medium transition-all ${progressPercent >= pct ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Buttons — Fixed Bottom */}
      <div
        className="flex-shrink-0 bg-gray-50 dark:bg-slate-900 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
        
      >
        <div className="flex justify-center gap-8 py-4">
          <button onClick={handleDecrement} className="w-14 h-14 rounded-full bg-red-500 text-white text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <i className="fas fa-minus"></i>
          </button>
          <button onClick={handleReset} className="w-14 h-14 rounded-full bg-amber-500 text-white text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <i className="fas fa-redo"></i>
          </button>
          <button onClick={handleIncrement} className="w-14 h-14 rounded-full bg-emerald-500 text-white text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
