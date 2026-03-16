import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo, useCallback } from 'react';
import { Mantra, NotificationSettings, AppSettings, ViewType } from '../types';
import { db, onAuthChange, saveMantrasToCloud, loadMantrasFromCloud, firebaseSignOut } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  rescheduleAllNotifications,
  triggerMilestoneNotification,
  scheduleStreakNotification,
  cancelEveningReminder,
  cancelMissedReminder,
} from '../utils/notifications';

const DEFAULT_MANTRAS: Mantra[] = [
  { id: 'default_1', userId: 'guest', name: 'ॐ नमः शिवाय', malaSize: 108, practiceDays: [0,1,2,3,4,5,6], totalCount: 0, todayCount: 0, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), dailyHistory: [], reminderEnabled: false, reminderTime: '07:00', sound: 'bell', isDefault: false },
  { id: 'default_2', userId: 'guest', name: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे', malaSize: 108, practiceDays: [0,1,2,3,4,5,6], totalCount: 0, todayCount: 0, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), dailyHistory: [], reminderEnabled: false, reminderTime: '07:00', sound: 'bell', isDefault: false },
  { id: 'default_3', userId: 'guest', name: 'ॐ गं गणपतये नमः', malaSize: 108, practiceDays: [0,1,2,3,4,5,6], totalCount: 0, todayCount: 0, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), dailyHistory: [], reminderEnabled: false, reminderTime: '07:00', sound: 'bell', isDefault: false },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true, dailyReminders: true, malaAlerts: true, pushNotifications: true, countVibration: true, malaVibration: true,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  vibrationEnabled: true, soundEnabled: true, darkMode: false, autoResetTime: '00:00', language: 'en', defaultLandingPage: 'dashboard', sound: 'bell', defaultMantraId: null,
};

interface AppContextType {
  isLoggedIn: boolean; isGuest: boolean; userName: string; userPhoto: string; userEmail: string;
  firebaseUserId: string | null; currentView: ViewType; mantras: Mantra[]; selectedMantra: Mantra | null;
  appSettings: AppSettings; notificationSettings: NotificationSettings; isInitialLoading: boolean;
  showNewDayModal: boolean; isDarkMode: boolean; sortOption: string;
  login: (asGuest?: boolean) => void; logout: () => void;
  setCurrentView: (view: ViewType) => void; setSelectedMantra: (mantra: Mantra | null) => void;
  setMantras: React.Dispatch<React.SetStateAction<Mantra[]>>;
  addMantra: (mantraData: Partial<Mantra>) => void;
  updateMantra: (id: string, updates: Partial<Mantra>) => void;
  deleteMantra: (id: string) => void;
  incrementCount: (id: string) => void; decrementCount: (id: string) => void;
  resetTodayCount: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  toggleDarkMode: () => void; setSortOption: (option: string) => void;
  checkAndResetDaily: () => void; setShowNewDayModal: (show: boolean) => void;
  confirmDailyReset: () => void; resetAndSyncToday: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [userPhoto, setUserPhoto] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showNewDayModal, setShowNewDayModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const cloudDataLoaded = useRef(false);
  const isFirstSave = useRef(true);
  const lastResetDate = useRef<string>('');

  const getCurrentDate = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const getResetKey = (uid: string | null, guest: boolean): string => {
    if (guest) return 'lastResetDate_guest';
    if (uid) return `lastResetDate_${uid}`;
    return 'lastResetDate_unknown';
  };

  const showToast = (message: string, type: string = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      // Smooth transition
      document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      document.documentElement.classList.toggle('dark', newValue);
      localStorage.setItem('darkMode', newValue.toString());
      setTimeout(() => {
        document.documentElement.style.transition = '';
      }, 400);
      return newValue;
    });
  };

  const checkAndResetDaily = () => {
    const today = getCurrentDate();
    const resetKey = getResetKey(firebaseUserId, isGuest);
    const storedLastReset = localStorage.getItem(resetKey);
    if (storedLastReset && storedLastReset !== today) {
      setShowNewDayModal(true);
    } else if (!storedLastReset) {
      localStorage.setItem(resetKey, today);
    }
    lastResetDate.current = storedLastReset || today;
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const midnightCheck = setInterval(() => {
      const today = getCurrentDate();
      const resetKey = getResetKey(firebaseUserId, isGuest);
      const storedLastReset = localStorage.getItem(resetKey);
      if (storedLastReset && storedLastReset !== today && !showNewDayModal) {
        setShowNewDayModal(true);
      }
    }, 60000);
    return () => clearInterval(midnightCheck);
  }, [isLoggedIn, showNewDayModal, firebaseUserId, isGuest]);

  const confirmDailyReset = () => {
    const today = getCurrentDate();
    const resetKey = getResetKey(firebaseUserId, isGuest);
    setMantras(prev => prev.map(mantra => {
      if (mantra.todayCount > 0) {
        const yesterday = lastResetDate.current;
        const existingHistory = mantra.dailyHistory || [];
        const existingDayIndex = existingHistory.findIndex(h => h.date === yesterday);
        const dayEntry = {
          date: yesterday, mantraCount: mantra.todayCount,
          malaCount: Math.floor(mantra.todayCount / mantra.malaSize),
          beadsPerMala: mantra.malaSize, remark: '',
          status: { practiced: mantra.todayCount > 0, beadsUpdated: false, settingsUpdated: false, missed: false, isPracticeDay: mantra.practiceDays.includes(new Date(yesterday).getDay()) },
        };
        const newHistory = existingDayIndex >= 0
          ? existingHistory.map((h, i) => i === existingDayIndex ? { ...h, ...dayEntry } : h)
          : [...existingHistory, dayEntry];
        return { ...mantra, todayCount: 0, dailyHistory: newHistory, lastUpdated: new Date().toISOString() };
      }
      return { ...mantra, todayCount: 0, lastUpdated: new Date().toISOString() };
    }));
    localStorage.setItem(resetKey, today);
    lastResetDate.current = today;
    setShowNewDayModal(false);
    showToast('Practice saved! New day started. 🙏', 'success');
  };

  const resetAndSyncToday = () => {
    const today = getCurrentDate();
    const resetKey = getResetKey(firebaseUserId, isGuest);
    setMantras(prev => prev.map(mantra => ({ ...mantra, totalCount: mantra.totalCount - mantra.todayCount, todayCount: 0, lastUpdated: new Date().toISOString() })));
    localStorage.setItem(resetKey, today);
    lastResetDate.current = today;
    setShowNewDayModal(false);
    showToast('Counts discarded. New day started. 🙏', 'info');
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') { 
      setIsDarkMode(true); 
      document.documentElement.classList.add('dark'); 
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      // Guest mode mein Firebase user ko ignore karo
      const guestModeActive = localStorage.getItem('mantra_guest_mode') === 'true';
      if (user && !guestModeActive) {
        setIsLoggedIn(true); setIsGuest(false);
        setUserName(user.displayName || 'User');
        setUserPhoto(user.photoURL || '');
        setUserEmail(user.email || '');
        setFirebaseUserId(user.uid);
        try {
          const cloudMantras = await loadMantrasFromCloud(user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.settings) setAppSettings(prev => ({ ...prev, ...userData.settings }));
            if (userData.notificationSettings) setNotificationSettings(prev => ({ ...prev, ...userData.notificationSettings }));
          }
          if (cloudMantras && cloudMantras.length > 0) {
            setMantras(cloudMantras);
            const savedSettings = userDoc.exists() ? userDoc.data().settings : null;
            if (savedSettings?.defaultLandingPage === 'defaultMantra' && savedSettings?.defaultMantraId) {
              const defaultMantra = cloudMantras.find((m: Mantra) => m.id === savedSettings.defaultMantraId);
              if (defaultMantra) { setSelectedMantra(defaultMantra); setCurrentView('counting'); }
            }
          }
          cloudDataLoaded.current = true;
        } catch (e) { console.error('Cloud load error', e); }
      } else {
        const guestMode = localStorage.getItem('mantra_guest_mode');
        if (guestMode === 'true') {
          setIsLoggedIn(true); setIsGuest(true); setUserName('Guest');
          // Guest ke liye alag key use karo taaki Google data mix na ho
          const savedMantras = localStorage.getItem('mantra_data_guest');
          const savedSettings = localStorage.getItem('mantra_settings_guest');
          let parsedMantras: Mantra[] = [];
          if (savedMantras) {
            try {
              parsedMantras = JSON.parse(savedMantras);
              if (parsedMantras.length > 0) { setMantras(parsedMantras); }
              else { parsedMantras = DEFAULT_MANTRAS; setMantras(DEFAULT_MANTRAS); localStorage.setItem('mantra_data_guest', JSON.stringify(DEFAULT_MANTRAS)); }
            } catch { parsedMantras = DEFAULT_MANTRAS; setMantras(DEFAULT_MANTRAS); localStorage.setItem('mantra_data_guest', JSON.stringify(DEFAULT_MANTRAS)); }
          } else { parsedMantras = DEFAULT_MANTRAS; setMantras(DEFAULT_MANTRAS); localStorage.setItem('mantra_data_guest', JSON.stringify(DEFAULT_MANTRAS)); }
          
          if (savedSettings) {
            try { 
              const settings = JSON.parse(savedSettings);
              setAppSettings(prev => ({ ...prev, ...settings }));
              if (settings.defaultLandingPage === 'defaultMantra' && settings.defaultMantraId) {
                const defaultMantra = parsedMantras.find((m: Mantra) => m.id === settings.defaultMantraId);
                if (defaultMantra) { setSelectedMantra(defaultMantra); setCurrentView('counting'); }
              }
            } catch (e) {
              console.error('Error parsing saved settings', e);
            }
          }
        } else { 
          setIsLoggedIn(false); 
        }
      }
      setTimeout(() => setIsInitialLoading(false), 500);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (isFirstSave.current && !isGuest) { isFirstSave.current = false; return; }
    // Guest aur logged-in user ke liye alag keys
    if (isGuest) {
      localStorage.setItem('mantra_data_guest', JSON.stringify(mantras));
      localStorage.setItem('mantra_settings_guest', JSON.stringify(appSettings));
    } else {
      localStorage.setItem('mantra_data', JSON.stringify(mantras));
      localStorage.setItem('mantra_settings', JSON.stringify(appSettings));
    }
    if (firebaseUserId && !isGuest && cloudDataLoaded.current) {
      saveMantrasToCloud(firebaseUserId, mantras);
      setDoc(doc(db, 'users', firebaseUserId), { settings: appSettings, notificationSettings, lastUpdated: new Date().toISOString() }, { merge: true });
    }
  }, [mantras, appSettings, notificationSettings, isLoggedIn, isGuest, firebaseUserId]);

  useEffect(() => {
    if (selectedMantra) {
      const updated = mantras.find(m => m.id === selectedMantra.id);
      if (updated) setSelectedMantra(updated);
    }
  }, [mantras, selectedMantra]);

  // ── Notifications reschedule — jab mantras ya settings change ho ─────────────
  useEffect(() => {
    if (!isLoggedIn || mantras.length === 0) return;
    
    // Create stable reminder config string
    const reminderConfig = JSON.stringify(mantras.map(m => ({
      id: m.id,
      reminderEnabled: m.reminderEnabled,
      reminderTime: m.reminderTime
    })));
    
    rescheduleAllNotifications(mantras, notificationSettings.pushNotifications && notificationSettings.enabled);
    
  }, [mantras, notificationSettings.pushNotifications, notificationSettings.enabled, isLoggedIn]);

  const calculateStreak = (history: any[], practiceDays: number[]): number => {
    if (!history || history.length === 0) return 0;
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 100; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay();
      if (!practiceDays.includes(dayOfWeek)) continue;
      const entry = sorted.find(h => h.date === dateStr);
      if (entry && entry.mantraCount > 0) { streak++; }
      else { break; }
    }
    return streak;
  };

  const addMantra = (mantraData: Partial<Mantra>) => {
    const newMantra: Mantra = {
      id: 'm_' + Date.now(), 
      userId: firebaseUserId || 'guest', 
      name: mantraData.name || '',
      malaSize: mantraData.malaSize || 108, 
      practiceDays: mantraData.practiceDays || [0,1,2,3,4,5,6],
      totalCount: 0, 
      todayCount: 0, 
      createdAt: new Date().toISOString(), 
      lastUpdated: new Date().toISOString(),
      dailyHistory: [], 
      reminderEnabled: mantraData.reminderEnabled || false, 
      reminderTime: mantraData.reminderTime || '07:00',
      sound: mantraData.sound || 'bell', 
      isDefault: mantraData.isDefault || false,
    };
    if (newMantra.isDefault) setAppSettings(prev => ({ ...prev, defaultMantraId: newMantra.id }));
    setMantras(prev => [newMantra, ...prev]);
    showToast('Mantra added successfully! 🙏', 'success');
  };

  const updateMantra = (id: string, updates: Partial<Mantra>) => {
    const today = getCurrentDate();
    setMantras(prev => prev.map(m => {
      if (m.id !== id) return m;
      const newMantra = { ...m, ...updates, lastUpdated: new Date().toISOString() };
      if (updates.malaSize !== undefined && updates.malaSize !== m.malaSize) {
        const history = [...(newMantra.dailyHistory || [])];
        const todayIndex = history.findIndex(h => h.date === today);
        if (todayIndex >= 0) {
          history[todayIndex] = { ...history[todayIndex], status: { ...history[todayIndex].status, beadsUpdated: true, settingsUpdated: true } };
        } else {
          history.push({ date: today, mantraCount: newMantra.todayCount, malaCount: Math.floor(newMantra.todayCount / newMantra.malaSize), beadsPerMala: newMantra.malaSize, remark: '', status: { practiced: newMantra.todayCount > 0, beadsUpdated: true, settingsUpdated: true, missed: false, isPracticeDay: newMantra.practiceDays.includes(new Date().getDay()) } });
        }
        newMantra.dailyHistory = history;
      }
      return newMantra;
    }));
    if (updates.isDefault) setAppSettings(prev => ({ ...prev, defaultMantraId: id }));
  };

  // ── Increment Count + Milestone + Streak + Cancel Evening/Missed ─────────────
  const incrementCount = (id: string) => {
    const today = getCurrentDate();
    setMantras(prev => {
      const updated = prev.map(m => {
        if (m.id !== id) return m;
        const newTodayCount = m.todayCount + 1;
        const newTotalCount = m.totalCount + 1;
        const history = [...(m.dailyHistory || [])];
        const todayIndex = history.findIndex(h => h.date === today);
        if (todayIndex >= 0) {
          history[todayIndex] = { ...history[todayIndex], mantraCount: newTodayCount, malaCount: Math.floor(newTodayCount / m.malaSize), status: { ...history[todayIndex].status, practiced: true } };
        } else {
          history.push({ date: today, mantraCount: newTodayCount, malaCount: Math.floor(newTodayCount / m.malaSize), beadsPerMala: m.malaSize, remark: '', status: { practiced: true, beadsUpdated: false, settingsUpdated: false, missed: false, isPracticeDay: m.practiceDays.includes(new Date().getDay()) } });
        }

        // ── Milestone Check: Har 50 mala par notification ────────────────────
        const newTotalMalas = Math.floor(newTotalCount / m.malaSize);
        const oldTotalMalas = Math.floor(m.totalCount / m.malaSize);
        if (notificationSettings.malaAlerts && newTotalMalas > oldTotalMalas && newTotalMalas > 0 && newTotalMalas % 50 === 0) {
          triggerMilestoneNotification(m.name, newTotalMalas);
        }

        // ── Streak Check: Har 7 din par streak notification ───────────────────
        const streak = calculateStreak(history, m.practiceDays);
        if (notificationSettings.dailyReminders && streak > 0 && streak % 7 === 0) {
          const mantraIndex = prev.findIndex(pm => pm.id === id);
          scheduleStreakNotification(m.name, streak, mantraIndex);
        }

        return { ...m, todayCount: newTodayCount, totalCount: newTotalCount, dailyHistory: history, lastUpdated: new Date().toISOString() };
      });

      // Evening aur Missed reminders cancel karo agar user ne count kiya
      const mantraIndex = prev.findIndex(m => m.id === id);
      if (mantraIndex >= 0 && notificationSettings.pushNotifications) {
        cancelEveningReminder(mantraIndex);
        cancelMissedReminder(mantraIndex);
      }

      return updated;
    });
  };

  const decrementCount = (id: string) => {
    const today = getCurrentDate();
    setMantras(prev => prev.map(m => {
      if (m.id !== id || m.todayCount <= 0) return m;
      const newTodayCount = m.todayCount - 1;
      const newTotalCount = m.totalCount - 1;
      const history = [...(m.dailyHistory || [])];
      const todayIndex = history.findIndex(h => h.date === today);
      if (todayIndex >= 0) {
        history[todayIndex] = { ...history[todayIndex], mantraCount: newTodayCount, malaCount: Math.floor(newTodayCount / m.malaSize) };
      }
      return { ...m, todayCount: newTodayCount, totalCount: newTotalCount, dailyHistory: history, lastUpdated: new Date().toISOString() };
    }));
  };

  const resetTodayCount = (id: string) => {
    setMantras(prev => prev.map(m => {
      if (m.id !== id) return m;
      return { ...m, totalCount: m.totalCount - m.todayCount, todayCount: 0, lastUpdated: new Date().toISOString() };
    }));
    showToast("Today's count reset", 'info');
  };

  const deleteMantra = (id: string) => {
    setMantras(prev => prev.filter(m => m.id !== id));
    if (appSettings.defaultMantraId === id) setAppSettings(prev => ({ ...prev, defaultMantraId: null }));
    showToast('Mantra deleted', 'success');
  };

  const login = (asGuest: boolean = false) => {
    setIsLoggedIn(true); 
    setIsGuest(asGuest);
    localStorage.setItem('mantra_guest_mode', asGuest ? 'true' : 'false');
    if (asGuest) {
      setUserName('Guest');
      const savedMantras = localStorage.getItem('mantra_data_guest');
      if (savedMantras) {
        try {
          const parsed = JSON.parse(savedMantras);
          if (parsed.length > 0) { setMantras(parsed); }
          else { setMantras(DEFAULT_MANTRAS); localStorage.setItem('mantra_data_guest', JSON.stringify(DEFAULT_MANTRAS)); }
        } catch { setMantras(DEFAULT_MANTRAS); localStorage.setItem('mantra_data_guest', JSON.stringify(DEFAULT_MANTRAS)); }
      } else { setMantras(DEFAULT_MANTRAS); localStorage.setItem('mantra_data_guest', JSON.stringify(DEFAULT_MANTRAS)); }
    }
    setCurrentView('dashboard');
  };

  const logout = async () => {
    try { await firebaseSignOut(); } catch (e) { console.error('Logout error', e); }
    localStorage.removeItem('mantra_guest_mode');
    setIsLoggedIn(false); 
    setIsGuest(false); 
    setMantras([]); 
    setSelectedMantra(null); 
    setCurrentView('dashboard');
    window.location.reload();
  };

  const getToastClasses = (type: string): string => {
    switch(type) {
      case 'success': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'error': return 'bg-gradient-to-r from-red-500 to-rose-500';
      case 'warning': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      default: return 'bg-gradient-to-r from-indigo-500 to-purple-500';
    }
  };

  const getToastIcon = (type: string): string => {
    switch(type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      default: return 'fa-info-circle';
    }
  };

  return (
    <AppContext.Provider value={{ 
      isLoggedIn, 
      isGuest, 
      userName, 
      userPhoto, 
      userEmail, 
      firebaseUserId, 
      currentView, 
      mantras, 
      selectedMantra, 
      appSettings, 
      notificationSettings, 
      isInitialLoading, 
      showNewDayModal, 
      isDarkMode, 
      sortOption, 
      login, 
      logout, 
      setCurrentView, 
      setSelectedMantra, 
      setMantras, 
      addMantra, 
      updateMantra, 
      deleteMantra, 
      incrementCount, 
      decrementCount, 
      resetTodayCount, 
      showToast, 
      setAppSettings, 
      setNotificationSettings, 
      toggleDarkMode, 
      setSortOption, 
      checkAndResetDaily, 
      setShowNewDayModal, 
      confirmDailyReset, 
      resetAndSyncToday 
    }}>
      {children}
      {toast && (
        <div className="fixed top-4 right-4 z-[300] max-w-[90vw]">
          <div className={`px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 animate-slide-up w-auto ${getToastClasses(toast.type)}`}>
            <i className={`fas ${getToastIcon(toast.type)}`}></i>
            <span className="flex-1 text-sm font-medium whitespace-normal break-words">{toast.message}</span>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};