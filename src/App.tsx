import { useEffect, useState, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AddMantra } from './components/AddMantra';
import { SavedMantras } from './components/SavedMantras';
import { CountingView } from './components/CountingView';
import { MantraDetails } from './components/MantraDetails';
import { EditMantra } from './components/EditMantra';
import { HistoryView } from './components/HistoryView';
import { Settings } from './components/Settings';
import { InstallPWA } from './components/InstallPWA';
import { BottomNav } from './components/BottomNav';

// ── Issue 4: Loading screen — Google login ke baad bhi dikhti hai ─────────────
function LoadingScreen({ message }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center z-[200]"

    >
      <div className="text-center">
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer glow rings */}
          <div className="absolute w-52 h-52 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute w-40 h-40 bg-white/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          {/* Rotating ring */}
          <div className="absolute w-36 h-36 rounded-full border-4 border-white/30 border-t-white/80 animate-spin" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute w-28 h-28 rounded-full border-2 border-white/20 border-b-white/60 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
          {/* App Icon */}
          <img
            src="/icons/icon-512.png"
            alt="Mantra Meter"
            className="w-20 h-20 rounded-2xl relative z-10 shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.6)) drop-shadow(0 0 40px rgba(255,255,255,0.3))',
              animation: 'iconPulse 2s ease-in-out infinite',
            }}
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg tracking-wide">
          Mantra Meter
        </h1>
        <p className="text-white/80 text-sm mb-6">
          {message || 'Your Spiritual Companion'}
        </p>
        <div className="flex justify-center gap-2 mt-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-white/80 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewDayModal({
  onSaveAndReset,
  onDiscardAndReset,
  totalTodayCount,
}: {
  onSaveAndReset: () => void;
  onDiscardAndReset: () => void;
  totalTodayCount: number;
}) {
  const [showWarning, setShowWarning] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-fade-in text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-sun text-4xl text-amber-500"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">🌅 New Day Started!</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            You have <strong>{totalTodayCount}</strong> mantra counts recorded from yesterday.
            You can save them to history and start fresh, or discard them and reset directly.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-6">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <i className="fas fa-info-circle mr-1"></i>
              Choose the option that suits you. Read both options below before deciding.
            </p>
          </div>
          <button onClick={onSaveAndReset} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 mb-3 flex items-center justify-center gap-2">
            <i className="fas fa-save"></i>💾 Save &amp; Reset
            <span className="text-xs font-normal opacity-80">— counts will be saved to history</span>
          </button>
          <button onClick={() => setShowWarning(true)} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center gap-2">
            <i className="fas fa-trash-alt"></i>🗑️ Discard &amp; Reset
            <span className="text-xs font-normal opacity-80">— counts will be deleted</span>
          </button>
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-fade-in text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">⚠️ Please Note!</h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">This action will:</p>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-2">
                <li className="flex items-start gap-2"><i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i><span>Permanently delete your <strong>{totalTodayCount} mantra counts</strong></span></li>
                <li className="flex items-start gap-2"><i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i><span>These counts will <strong>not be saved</strong> to history</span></li>
                <li className="flex items-start gap-2"><i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i><span>Today's practice will <strong>not be recorded</strong></span></li>
                <li className="flex items-start gap-2"><i className="fas fa-times-circle mt-0.5 flex-shrink-0"></i><span>This action <strong>cannot be undone</strong></span></li>
              </ul>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <i className="fas fa-lightbulb mr-1"></i>Use this option only if you counted mantras by mistake.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWarning(false)} className="flex-1 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700">
                <i className="fas fa-arrow-left mr-1"></i>Go Back
              </button>
              <button onClick={onDiscardAndReset} className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600">
                <i className="fas fa-trash-alt mr-1"></i>Yes, Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AppContent() {
  const {
    currentView, isLoggedIn, isInitialLoading, userName, mantras,
    checkAndResetDaily, showNewDayModal, setShowNewDayModal,
    confirmDailyReset, resetAndSyncToday, showToast,
  } = useApp();

  const [showSplash, setShowSplash] = useState(true);
  // Issue 4: Google login ke baad loading track karne ke liye
  const [postLoginLoading, setPostLoginLoading] = useState(false);
  const hasShownWelcome = useRef(false);
  const prevLoggedIn = useRef(false);

  const totalTodayCount = mantras.reduce((sum, m) => sum + (m.todayCount || 0), 0);

  useEffect(() => {
    if (!isInitialLoading) {
      // Pehli baar login: loading screen dikhao taaki flicker na ho
      if (isLoggedIn && !prevLoggedIn.current) {
        setPostLoginLoading(true);
        prevLoggedIn.current = isLoggedIn;
        // 2 second wait — data + UI fully ready
        const timer = setTimeout(() => {
          setShowSplash(false);
          setPostLoginLoading(false);
          if (!hasShownWelcome.current) {
            hasShownWelcome.current = true;
            showToast(`Welcome, ${userName}! 🙏`, 'success');
            setTimeout(() => { showToast('Logged in successfully ✅', 'success'); }, 1500);
            setTimeout(() => { checkAndResetDaily(); }, 4000);
          }
        }, 2000);
        return () => clearTimeout(timer);
      }

      prevLoggedIn.current = isLoggedIn;

      if (!isLoggedIn) {
        const timer = setTimeout(() => setShowSplash(false), 1500);
        return () => clearTimeout(timer);
      }

      if (isLoggedIn && hasShownWelcome.current) {
        const timer = setTimeout(() => {
          setShowSplash(false);
          checkAndResetDaily();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isInitialLoading, isLoggedIn, userName, checkAndResetDaily, showToast]);

  // Issue 4: Loading screen — splash, initial loading, ya post-login loading
  if (showSplash || isInitialLoading) {
    return <LoadingScreen message="Your Spiritual Companion" />;
  }

  if (postLoginLoading) {
    return <LoadingScreen message="Default landing page is loading..." />;
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen />
        <InstallPWA />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'addMantra': return <AddMantra />;
      case 'savedMantras': return <SavedMantras />;
      case 'counting': return <CountingView />;
      case 'mantraDetails': return <MantraDetails />;
      case 'editMantra': return <EditMantra />;
      case 'history': return <HistoryView />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const fullScreenViews = ['counting', 'mantraDetails', 'editMantra', 'addMantra'];
  const isFullScreen = fullScreenViews.includes(currentView);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 dark-transition">
      {showNewDayModal && (
        <NewDayModal
          onSaveAndReset={confirmDailyReset}
          onDiscardAndReset={resetAndSyncToday}
          totalTodayCount={totalTodayCount}
        />
      )}
      {!isFullScreen && <Header />}
      <main>{renderView()}</main>
      <BottomNav />
      <InstallPWA />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
