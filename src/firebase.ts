import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyAzoe08f1B5WxYsEnK0vajjGNofmV2phJg",
  authDomain: "mantra-meter.firebaseapp.com",
  projectId: "mantra-meter",
  storageBucket: "mantra-meter.firebasestorage.app",
  messagingSenderId: "33866769980",
  appId: "1:33866769980:web:869c1ff90f6b34298bc539",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Google Sign In ────────────────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<User | null> {
  const isNative = Capacitor.isNativePlatform();

  try {
    if (isNative) {
      // Android APK: Capacitor Google Auth plugin use karo
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(
        googleUser.authentication.idToken
      );
      const result = await signInWithCredential(auth, credential);
      await saveUserToFirestore(result.user);
      return result.user;
    } else {
      // Web browser: Popup method
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user);
      return result.user;
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      // Web fallback — popup block hone par
      const { signInWithRedirect } = await import('firebase/auth');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    if (
      error.code === 'auth/cancelled-popup-request' ||
      error.error === 'popup_closed_by_user'
    ) {
      return null;
    }
    throw error;
  }
}

// Redirect result — sirf web ke liye
export async function handleRedirectResult(): Promise<User | null> {
  if (Capacitor.isNativePlatform()) return null;
  try {
    const { getRedirectResult } = await import('firebase/auth');
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await saveUserToFirestore(result.user);
      return result.user;
    }
    return null;
  } catch {
    return null;
  }
}

// ── User Firestore mein save karna ───────────────────────────────────────────
async function saveUserToFirestore(user: User) {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function firebaseSignOut(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.signOut();
    } catch {}
  }
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveMantrasToCloud(userId: string, mantras: any[]) {
  try {
    await setDoc(
      doc(db, 'users', userId, 'appData', 'mantras'),
      { mantras: JSON.stringify(mantras), lastUpdated: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving to cloud:', error);
  }
}

export async function loadMantrasFromCloud(userId: string): Promise<any[] | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId, 'appData', 'mantras'));
    if (docSnap.exists()) return JSON.parse(docSnap.data().mantras);
    return null;
  } catch {
    return null;
  }
}

export async function saveSettingsToCloud(userId: string, settings: any) {
  try {
    await setDoc(
      doc(db, 'users', userId, 'appData', 'settings'),
      { ...settings, lastUpdated: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function loadSettingsFromCloud(userId: string): Promise<any | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId, 'appData', 'settings'));
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch {
    return null;
  }
}

export { auth, db };