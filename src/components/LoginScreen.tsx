import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { signInWithGoogle, handleRedirectResult } from '../firebase';

export function LoginScreen() {
  const { login } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');

  // ── Android Redirect Result Handle karna ─────────────────────────────────────
  // Jab Google account choose karke wapas app mein aayein
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        // Dekho ki redirect se wapas aaye hain ya nahi
        const user = await handleRedirectResult();
        if (user) {
          // Firebase onAuthChange automatically login handle karega
          setIsRedirecting(false);
        }
      } catch (err) {
        setIsRedirecting(false);
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // Android mein: signInWithGoogle redirect karega — ye null return karega
      // Redirect ke baad app wapas khuld aur onAuthChange automatically fire hoga
      // Hum animation dikhate hain jab tak redirect ho raha hai
      setIsRedirecting(true);
      // Note: loading state yahan reset nahi hogi kyunki redirect ho raha hai
    } catch (err: any) {
      setIsLoading(false);
      setIsRedirecting(false);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again!');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Please allow pop-ups for this app.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Kuch nahi karna
      } else {
        setError('Sign-in failed. Please try again.');
      }
    }
  };

  const handleGuestLogin = () => {
    login(true);
  };

  // ── Loading / Redirect Animation ─────────────────────────────────────────────
  // Ye animation tab dikhti hai jab Google login process ho rahi ho
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center text-white animate-fade-in">
          {/* OM Symbol with glow */}
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-44 h-44 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-36 h-36 rounded-full border-4 border-white/30 border-t-white/80 animate-spin" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute w-28 h-28 rounded-full border-2 border-white/20 border-b-white/60 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
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

          <h2 className="text-2xl font-bold mb-2">Connecting to Google...</h2>
          <p className="text-white/70 text-sm mb-6">
            {isRedirecting
              ? 'Please select your Google account to continue'
              : 'Setting up your spiritual journey...'}
          </p>

          {/* Bouncing dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-3 h-3 bg-white/80 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 text-center">
          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute w-28 h-28 rounded-full border-4 border-white/30 border-t-white/80 animate-spin" style={{ animationDuration: '1.5s' }}></div>
            <img
              src="/icons/icon-512.png"
              alt="Mantra Meter"
              className="w-16 h-16 rounded-xl relative z-10 shadow-xl"
              style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.5))' }}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Mantra Meter</h1>
          <p className="text-white/80">Track your spiritual journey</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome 🙏
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sign in to sync your practice across devices
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 p-4 border-2 border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all mb-4 font-semibold text-gray-700 dark:text-white disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
          </div>

          {/* Guest Login */}
          <button
            onClick={handleGuestLogin}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all font-semibold active:scale-95"
          >
            <i className="fas fa-user-circle"></i>
            Continue as Guest
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            Guest mode: Data saved locally on this device only
          </p>
        </div>
      </div>
    </div>
  );
}
