import { useApp } from '../context/AppContext';
import { ViewType } from '../types';

interface NavItem {
  view: ViewType;
  icon: string;
  label: string;
  activeColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', icon: 'fa-home', label: 'Home', activeColor: 'text-indigo-500' },
  { view: 'savedMantras', icon: 'fa-om', label: 'Mantras', activeColor: 'text-emerald-500' },
  { view: 'history', icon: 'fa-chart-bar', label: 'History', activeColor: 'text-amber-500' },
  { view: 'settings', icon: 'fa-cog', label: 'Settings', activeColor: 'text-purple-500' },
];

// Pages where bottom nav shows
const SHOW_NAV_VIEWS: ViewType[] = ['dashboard', 'savedMantras', 'settings'];

export function BottomNav() {
  const { currentView, setCurrentView, selectedMantra, mantras } = useApp();

  if (!SHOW_NAV_VIEWS.includes(currentView)) return null;

  const handleNavPress = (item: NavItem) => {
    if (item.view === 'history') {
      // History ke liye mantra select karna padega
      const mantra = selectedMantra || mantras[0];
      if (mantra) {
        setCurrentView('history');
      } else {
        setCurrentView('savedMantras');
      }
    } else {
      setCurrentView(item.view);
    }
  };

  const isActive = (item: NavItem) => {
    if (item.view === 'history') return currentView === 'history';
    return currentView === item.view;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 dark-transition"
      
    >
      {/* Blur background */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-slate-700/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.view}
                onClick={() => handleNavPress(item)}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative active:scale-95 transition-transform"
              >
                {/* Active indicator pill */}
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full bg-indigo-500" />
                )}

                {/* Icon container */}
                <div className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200 ${active ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                  <i className={`fas ${item.icon} text-base transition-all duration-200 ${active ? item.activeColor : 'text-gray-400 dark:text-gray-500'}`}
                    style={{ fontSize: active ? '18px' : '16px' }}
                  ></i>
                </div>

                {/* Label */}
                <span className={`text-[10px] font-semibold transition-all duration-200 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
