import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function Header() {
  const { userName, userPhoto, logout, showToast } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    showToast('Logged out successfully', 'success');
  };

  return (
    <>
      <header className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        {/* Left - User Profile Photo */}
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 shadow-md flex-shrink-0">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg ${userPhoto ? 'hidden' : ''}`}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Center - App Name */}
        <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <img src="/icons/icon-192.png" alt="Mantra Meter" className="w-6 h-6 rounded-md" />
          <h1 className="text-lg font-bold">Mantra Meter</h1>
        </div>

        {/* Right - Logout Button */}
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white active:bg-red-600 transition-colors shadow-md flex-shrink-0"
        >
          <i className="fas fa-sign-out-alt text-sm"></i>
        </button>
      </header>

      {/* Custom Logout Modal — Capacitor popup replace */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-fade-in text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-sign-out-alt text-2xl text-red-500"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Logout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to logout from Mantra Meter?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 active:opacity-80 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500 active:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
