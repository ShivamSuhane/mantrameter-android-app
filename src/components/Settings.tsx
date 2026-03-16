import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { requestNotificationPermission, checkNotificationPermission, rescheduleAllNotifications } from '../utils/notifications';
import { Capacitor } from '@capacitor/core';

export function Settings() {
  const { setCurrentView, notificationSettings, setNotificationSettings, appSettings, setAppSettings, isDarkMode, toggleDarkMode, showToast, setMantras, mantras } = useApp();
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const isNative = Capacitor.isNativePlatform();
  const defaultMantra = mantras.find(m => m.isDefault);

  const handlePushToggle = async () => {
    const currentlyEnabled = notificationSettings.pushNotifications;
    if (!currentlyEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationSettings(prev => ({ ...prev, pushNotifications: true }));
        await rescheduleAllNotifications(mantras, true);
        showToast('Push notifications enabled! 🔔', 'success');
        setNotifPermission('granted');
      } else {
        showToast(isNative ? 'Please enable notifications in Android Settings → App Permissions' : 'Notification permission denied. Please allow in browser settings.', 'warning');
        setNotifPermission('denied');
      }
    } else {
      setNotificationSettings(prev => ({ ...prev, pushNotifications: false }));
      await rescheduleAllNotifications(mantras, false);
      showToast('Push notifications disabled', 'info');
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    if (key === 'pushNotifications') { await handlePushToggle(); return; }
    setNotificationSettings(prev => {
      const newValue = !prev[key];
      if (key === 'enabled' && !newValue) return { ...prev, enabled: false, dailyReminders: false, malaAlerts: false, pushNotifications: false };
      if (key === 'enabled' && newValue) return { ...prev, enabled: true, dailyReminders: true, malaAlerts: true };
      return { ...prev, [key]: newValue };
    });
    showToast('Setting updated', 'success');
  };

  const handleDefaultLandingChange = (value: 'dashboard' | 'defaultMantra') => {
    if (value === 'defaultMantra' && !defaultMantra) { showToast('Please set a default mantra first from Edit Mantra page', 'warning'); return; }
    setAppSettings(prev => ({ ...prev, defaultLandingPage: value, defaultMantraId: value === 'defaultMantra' ? defaultMantra?.id || null : null }));
    showToast(`Default landing page set to ${value === 'dashboard' ? 'Dashboard' : 'Default Mantra'}`, 'success');
  };

  const [showClearModal, setShowClearModal] = useState(false);
  const handleClearData = () => setShowClearModal(true);
  const confirmClearData = () => {
    setMantras([]); localStorage.removeItem('mantra_data');
    showToast('All data cleared', 'success');
    setShowClearModal(false);
  };

  const testNotification = async () => {
    if (isNative) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      try {
        await LocalNotifications.schedule({ notifications: [{ id: 9999, title: '🕉️ Mantra Meter Test', body: 'Notifications are working perfectly! 🙏', schedule: { at: new Date(Date.now() + 3000) }, smallIcon: 'ic_notification', channelId: 'mantra_reminders', actionTypeId: '', extra: null }] });
        showToast('Test notification in 3 seconds! 🔔', 'success');
      } catch (e) { showToast('Error sending test notification', 'error'); }
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Mantra Meter Test', { body: 'Notifications are working! 🙏' });
      showToast('Test notification sent!', 'success');
    } else { showToast('Please enable notifications first', 'warning'); }
  };

  const getPermStatus = () => {
    if (notificationSettings.pushNotifications) return { text: '✅ Enabled', color: 'text-green-500' };
    if (notifPermission === 'denied') return { text: '❌ Blocked', color: 'text-red-500' };
    return { text: '⚠️ Not Set', color: 'text-yellow-500' };
  };
  const status = getPermStatus();

  const ToggleRow = ({ label, description, checked, onChange, disabled = false }: { label: string; description: string; checked: boolean; onChange: () => void; disabled?: boolean; }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-3">
        <span className="block font-semibold text-gray-800 dark:text-white text-sm">{label}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
        <div className={`w-12 h-6 bg-gray-200 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${disabled ? 'opacity-50' : ''}`}></div>
      </label>
    </div>
  );

  return (
    <div className="animate-fade-in flex flex-col bg-gray-50 dark:bg-slate-900" style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>

      {/* Fixed Top */}
      <div className="flex-shrink-0 bg-slate-700" >
        <button onClick={() => setCurrentView('dashboard')} className="w-full bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold">
          <i className="fas fa-arrow-left"></i><span>Settings</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">

        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-home text-amber-500"></i>Default Landing Page</h3>
          </div>
          <div className="px-4 py-3 space-y-2">
            <button onClick={() => handleDefaultLandingChange('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${appSettings.defaultLandingPage === 'dashboard' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-600'}`}>
              <i className={`fas fa-check-circle ${appSettings.defaultLandingPage === 'dashboard' ? 'text-indigo-500' : 'text-gray-300'}`}></i>
              <div className="text-left"><span className="block font-semibold text-gray-800 dark:text-white text-sm">Dashboard</span><span className="block text-xs text-gray-500">Open dashboard after login</span></div>
            </button>
            <button onClick={() => handleDefaultLandingChange('defaultMantra')} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${appSettings.defaultLandingPage === 'defaultMantra' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-slate-600'}`}>
              <i className={`fas fa-check-circle ${appSettings.defaultLandingPage === 'defaultMantra' ? 'text-amber-500' : 'text-gray-300'}`}></i>
              <div className="text-left"><span className="block font-semibold text-gray-800 dark:text-white text-sm">Default Mantra Counter</span><span className="block text-xs text-gray-500">{defaultMantra ? `Current: ${defaultMantra.name}` : 'No default mantra set - Set from Edit Mantra'}</span></div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 mt-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-bell text-indigo-500"></i>Notifications</h3>
            <span className={`text-sm ${status.color}`}>{status.text}</span>
          </div>
          <div className="px-4 py-2">
            <ToggleRow label="Enable All Notifications" description="Master switch for all notifications" checked={notificationSettings.enabled} onChange={() => handleNotificationToggle('enabled')} />
            <ToggleRow label="Daily Reminders" description="Morning 6:30 AM & Evening 9:00 PM" checked={notificationSettings.dailyReminders} onChange={() => handleNotificationToggle('dailyReminders')} disabled={!notificationSettings.enabled} />
            <ToggleRow label="Mala Completion Alerts" description="Alert when 50, 100, 150... malas complete" checked={notificationSettings.malaAlerts} onChange={() => handleNotificationToggle('malaAlerts')} disabled={!notificationSettings.enabled} />
            <ToggleRow label="Vibrate on Each Mantra" description="Vibrate on every count" checked={notificationSettings.countVibration} onChange={() => handleNotificationToggle('countVibration')} />
            <ToggleRow label="Vibrate on Mala Complete" description="Vibrate when mala completes" checked={notificationSettings.malaVibration} onChange={() => handleNotificationToggle('malaVibration')} />
            <ToggleRow label="Push Notifications" description={isNative ? "Background & closed app notifications" : "When app is in background (browser)"} checked={notificationSettings.pushNotifications} onChange={() => handleNotificationToggle('pushNotifications')} disabled={!notificationSettings.enabled} />
          </div>
          <div className="px-4 pb-3 pt-1">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2"><i className="fas fa-info-circle mt-0.5"></i><span>Notification sound will be your phone's default notification tone. Change it from Android Settings → Sound.</span></p>
            </div>
            <button onClick={testNotification} className="w-full bg-emerald-600 text-white py-2.5 font-semibold flex items-center justify-center gap-2 rounded-lg">
              <i className="fas fa-paper-plane"></i>Test Notification
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 mt-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-mobile-alt text-indigo-500"></i>App Settings</h3>
          </div>
          <div className="px-4 py-2">
            <ToggleRow label="Dark Mode" description="Switch between light and dark theme" checked={isDarkMode} onChange={toggleDarkMode} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 mt-2">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-database text-indigo-500"></i>Data Management</h3>
          </div>
          <div className="px-4 py-3">
            <button onClick={handleClearData} className="w-full bg-red-500 text-white py-2.5 font-semibold flex items-center justify-center gap-2 rounded-lg">
              <i className="fas fa-trash"></i>Clear All Data
            </button>
          </div>
        </div>

        {/* Clear Data Confirm Modal */}
        {showClearModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xs w-full p-5 text-center animate-fade-in">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-trash text-xl text-red-500"></i>
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">Clear All Data?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowClearModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 text-sm">
                  Cancel
                </button>
                <button onClick={confirmClearData}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-500 text-sm">
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 mt-2 mb-4">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-info-circle text-indigo-500"></i>About</h3>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="font-bold text-gray-800 dark:text-white">Mantra Meter v1.0.0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track your spiritual journey</p>
            <p className="text-xs text-gray-500 mt-2">Made with 🙏 for spiritual practitioners</p>
          </div>
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div
        className="flex-shrink-0 bg-gray-50 dark:bg-slate-900"
        
      />
    </div>
  );
}
