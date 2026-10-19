import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

export const getFirebaseConfig = () => {
  try {
    const custom = localStorage.getItem('firebase_config_custom');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed.apiKey) return parsed;
    }
  } catch {}

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

export const isFirebaseLive = () => {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.apiKey.length > 20 && !cfg.apiKey.includes('Dummy'));
};

const resolveActiveConfig = () => {
  const active = getFirebaseConfig();
  return {
    apiKey: active.apiKey || 'AIzaSyDummyKeyForDevelopment12345',
    authDomain: active.authDomain || 'recipenest-demo.firebaseapp.com',
    projectId: active.projectId || 'recipenest-demo',
    storageBucket: active.storageBucket || 'recipenest-demo.appspot.com',
    messagingSenderId: active.messagingSenderId || '123456789012',
    appId: active.appId || '1:123456789012:web:abcdef123456',
  };
};

let app = !getApps().length ? initializeApp(resolveActiveConfig()) : getApp();
let auth = getAuth(app);
export let googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const saveFirebaseConfig = async (config) => {
  if (config && config.apiKey) {
    localStorage.setItem('firebase_config_custom', JSON.stringify(config));
  } else {
    localStorage.removeItem('firebase_config_custom');
  }

  try {
    const apps = getApps();
    for (const a of apps) {
      await deleteApp(a);
    }
  } catch (err) {
    console.warn('Firebase app cleanup notice:', err);
  }

  app = initializeApp(resolveActiveConfig());
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  return { app, auth };
};

export const getFirebaseAuth = () => auth;
export { auth, signInWithPopup, sendPasswordResetEmail };
export default app;
