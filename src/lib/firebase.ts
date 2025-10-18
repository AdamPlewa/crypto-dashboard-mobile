// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import Constants from 'expo-constants';

console.log('[FB] firebase.ts loaded'); // ⬅️ ten log musi się pojawić

const cfg = Constants.expoConfig?.extra?.firebase;
if (!cfg) {
  console.error('[FB] Missing expo.extra.firebase in app.json');
  throw new Error('Brak konfiguracji Firebase w app.json → expo.extra.firebase');
}

const app = getApps().length ? getApp() : initializeApp(cfg);
console.log('[FB] initialized:', {
  name: app.name,
  projectId: app.options.projectId,
  appId: app.options.appId,
});

export const auth = getAuth(app);
