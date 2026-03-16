import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Mantra, SortOption } from '../types';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'total-malas', label: 'Total Malas' },
  { value: 'today-malas', label: "Today's Malas" },
];

export function SavedMantras() {
  const { mantras, setCurrentView, setSelectedMantra, sortOption, setSortOption } = useApp();
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedMantras = useMemo(() => {
    const sorted = [...mantras];
    switch (sortOption) {
      case 'newest': return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest': return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'name-asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'total-malas': return sorted.sort((a, b) => Math.floor(b.totalCount / b.malaSize) - Math.floor(a.totalCount / a.malaSize));
      case 'today-malas': return sorted.sort((a, b) => Math.floor(b.todayCount / b.malaSize) - Math.floor(a.todayCount / a.malaSize));
      default: return sorted;
    }
  }, [mantras, sortOption]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort';

  const handleCountClick = (mantra: Mantra) => { setSelectedMantra(mantra); setCurrentView('counting'); };
  const handleDetailsClick = (mantra: Mantra) => { setSelectedMantra(mantra); setCurrentView('mantraDetails'); };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="animate-fade-in flex flex-col bg-gray-50 dark:bg-slate-900" style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>

      {/* Fixed Top Buttons */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm" >
        <div className="flex">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex-1 bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back</span>
          </button>
          <div className="relative flex-1">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="w-full bg-amber-500 text-white py-3 font-semibold flex items-center justify-center gap-2"
            >
              <i className="fas fa-sort"></i>
              <span>Sorted By</span>
              <i className={`fas fa-chevron-${showSortMenu ? 'up' : 'down'} text-xs`}></i>
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
                <div className="absolute top-full right-0 w-56 bg-white dark:bg-slate-800 rounded-b-xl shadow-xl z-50 border border-gray-200 dark:border-slate-700 overflow-hidden">
                  {SORT_OPTIONS.map((option) => (
                    <button key={option.value} onClick={() => { setSortOption(option.value); setShowSortMenu(false); }}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${sortOption === option.value ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                      <i className={`fas ${sortOption === option.value ? 'fa-check-circle text-indigo-500' : 'fa-circle text-gray-300 dark:text-gray-600'}`}></i>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-filter mr-1"></i>
            Sorted by: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentSortLabel}</span>
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {sortedMantras.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-6xl text-gray-300 mb-4"><i className="fas fa-pray"></i></div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Mantras Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start by adding your first mantra!</p>
            <button onClick={() => setCurrentView('addMantra')} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold">
              <i className="fas fa-plus mr-2"></i>Add First Mantra
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {sortedMantras.map((mantra) => (
              (() => {
                const todayCount = mantra.todayCount || 0;
                const malaSize = mantra.malaSize || 108;
                const todayMalas = Math.floor(todayCount / malaSize);
                const progress = (todayCount % malaSize) / malaSize * 100;
                const totalMalas = Math.floor((mantra.totalCount || 0) / malaSize);
                const now = new Date();
                const nowMins = now.getHours() * 60 + now.getMinutes();
                const isReminderSoon = mantra.reminderEnabled && mantra.reminderTime
                  ? (() => { const [rh, rm] = mantra.reminderTime!.split(':').map(Number); const diff = (rh*60+rm) - nowMins; return diff >= 0 && diff <= 30; })()
                  : false;
                return (
                  <div key={mantra.id} className="bg-white dark:bg-slate-800 mx-3 my-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden dark-transition">
                    {/* Top section */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1 pr-2">
                          {mantra.isDefault && <i className="fas fa-star text-amber-400 text-sm mt-0.5 flex-shrink-0"></i>}
                          <h3 className="text-base font-bold text-gray-800 dark:text-white leading-snug">{mantra.name}</h3>
                        </div>
                        {/* Total Malas Badge */}
                        <div className="flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl px-2.5 py-1.5 text-center min-w-[52px]">
                          <p className="text-indigo-600 dark:text-indigo-400 font-bold text-base leading-none">{totalMalas}</p>
                          <p className="text-indigo-400 dark:text-indigo-500 text-[9px] font-medium mt-0.5">MALAS</p>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-700 px-2 py-0.5 rounded-full">{formatDate(mantra.createdAt)}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {mantra.practiceDays.length === 7 ? 'All Days' : mantra.practiceDays.map(d => DAYS_SHORT[d]).join(' ')}
                        </span>
                        {mantra.reminderEnabled && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isReminderSoon ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400'}`}>
                            <i className={`fas fa-bell text-[9px] ${isReminderSoon ? 'animate-bounce' : ''}`}></i>
                            {mantra.reminderTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-4 pb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Today: {todayCount} mantras • {todayMalas} malas</span>
                        <span className="text-[10px] text-indigo-500 font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(progress, todayCount > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex border-t border-gray-100 dark:border-slate-700">
                      <button onClick={() => handleCountClick(mantra)}
                        className="flex-1 py-3 bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 transition-opacity">
                        <i className="fas fa-hand-point-up"></i>Count
                      </button>
                      <div className="w-px bg-white/30" />
                      <button onClick={() => handleDetailsClick(mantra)}
                        className="flex-1 py-3 bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 transition-opacity">
                        <i className="fas fa-chart-pie"></i>Details
                      </button>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>
        )}
      </div>

      {/* Bottom Safe Area — solid so content doesn't bleed through nav bar */}
      <div
        className="flex-shrink-0 bg-gray-50 dark:bg-slate-900"
        
      />
    </div>
  );
}
