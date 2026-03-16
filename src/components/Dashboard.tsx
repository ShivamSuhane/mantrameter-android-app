import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const { userName, setCurrentView, mantras } = useApp();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  // Today's overall stats
  const stats = useMemo(() => {
    const totalToday = mantras.reduce((sum, m) => sum + (m.todayCount || 0), 0);
    const totalMalas = mantras.reduce((sum, m) => sum + Math.floor((m.todayCount || 0) / m.malaSize), 0);
    const totalAllTime = mantras.reduce((sum, m) => sum + (m.totalCount || 0), 0);

    // Best streak across all mantras
    let bestStreak = 0;
    const today = new Date();
    mantras.forEach(m => {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = m.dailyHistory?.find(h => h.date === dateStr);
        if (entry && entry.mantraCount > 0) streak++;
        else if (i > 0) break;
      }
      bestStreak = Math.max(bestStreak, streak);
    });

    // Upcoming reminder
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let upcomingReminder: { name: string; time: string } | null = null;
    let minDiff = Infinity;
    mantras.forEach(m => {
      if (m.reminderEnabled && m.reminderTime) {
        const [h, min] = m.reminderTime.split(':').map(Number);
        const remMins = h * 60 + min;
        const diff = remMins >= nowMins ? remMins - nowMins : (24 * 60 - nowMins + remMins);
        if (diff < minDiff && diff < 120) {
          minDiff = diff;
          const ampm = h < 12 ? 'AM' : 'PM';
          const h12 = h % 12 === 0 ? 12 : h % 12;
          upcomingReminder = { name: m.name, time: `${h12}:${String(min).padStart(2,'0')} ${ampm}` };
        }
      }
    });

    return { totalToday, totalMalas, totalAllTime, bestStreak, upcomingReminder };
  }, [mantras]);

  const cards = [
    {
      id: 'add',
      title: 'Add Mantra',
      subtitle: 'Start a new practice',
      icon: 'fa-plus-circle',
      gradient: 'from-indigo-500 to-violet-600',
      iconBg: 'bg-white/20',
      onClick: () => setCurrentView('addMantra'),
    },
    {
      id: 'saved',
      title: 'My Mantras',
      subtitle: `${mantras.length} mantra${mantras.length !== 1 ? 's' : ''} saved`,
      icon: 'fa-om',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-white/20',
      onClick: () => setCurrentView('savedMantras'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Customize your app',
      icon: 'fa-cog',
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-white/20',
      onClick: () => setCurrentView('settings'),
    },
  ];

  return (
    <div
      className="animate-fade-in flex flex-col dark-transition"
      style={{
        height: 'calc(100dvh - 56px - 60px)',
        overflow: 'hidden',
      }}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 pt-4 pb-5 flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/70 text-xs font-medium">{currentDate}</p>
            <h2 className="text-white text-lg font-bold mt-0.5">
              Jai Shri Ram, {userName.split(' ')[0]}! 🙏
            </h2>
          </div>
          {stats.bestStreak > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-1.5 border border-white/30">
              <i className="fas fa-fire text-amber-300 animate-streak-fire text-sm"></i>
              <div>
                <p className="text-white font-bold text-sm leading-none">{stats.bestStreak}</p>
                <p className="text-white/70 text-[10px] leading-none">day streak</p>
              </div>
            </div>
          )}
        </div>

        {/* Today Stats Strip */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-around border border-white/20">
          <div className="text-center">
            <p className="text-white font-bold text-xl leading-none">{stats.totalToday.toLocaleString()}</p>
            <p className="text-white/70 text-[10px] mt-1">Today's Mantras</p>
          </div>
          <div className="w-px h-8 bg-white/30" />
          <div className="text-center">
            <p className="text-white font-bold text-xl leading-none">{stats.totalMalas}</p>
            <p className="text-white/70 text-[10px] mt-1">Today's Malas</p>
          </div>
          <div className="w-px h-8 bg-white/30" />
          <div className="text-center">
            <p className="text-white font-bold text-xl leading-none">{stats.totalAllTime.toLocaleString()}</p>
            <p className="text-white/70 text-[10px] mt-1">All Time</p>
          </div>
        </div>

        {/* Upcoming Reminder */}
        {stats.upcomingReminder && (
          <div className="mt-3 bg-amber-400/30 border border-amber-400/40 rounded-xl px-3 py-2 flex items-center gap-2">
            <i className="fas fa-bell text-amber-300 text-xs animate-bounce"></i>
            <p className="text-white text-xs flex-1">
              <span className="font-semibold">{stats.upcomingReminder.name.length > 20 ? stats.upcomingReminder.name.substring(0,20)+'...' : stats.upcomingReminder.name}</span>
              {' '}reminder at {stats.upcomingReminder.time}
            </p>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden bg-gray-50 dark:bg-slate-900">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className={`flex-1 bg-gradient-to-r ${card.gradient} rounded-2xl flex items-center gap-4 px-5 text-white active:scale-[0.98] transition-transform shadow-lg`}
          >
            <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center text-2xl border border-white/30 flex-shrink-0`}>
              <i className={`fas ${card.icon}`}></i>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-base font-bold">{card.title}</h3>
              <p className="text-white/75 text-xs mt-0.5">{card.subtitle}</p>
            </div>
            <i className="fas fa-chevron-right text-white/60 text-sm"></i>
          </button>
        ))}
      </div>
    </div>
  );
}
