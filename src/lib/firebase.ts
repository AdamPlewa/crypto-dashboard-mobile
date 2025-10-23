// src/lib/firebase.ts
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Auth } from 'firebase/auth'
import { getAuth, initializeAuth } from 'firebase/auth'

// --- helper: bezpieczne pobranie getReactNativePersistence (różne bundlery/typy)
function resolveGetReactNativePersistence():
  | ((storage: typeof AsyncStorage) => any)
  | undefined {
  try {
    // w SDK 12 jest re-eksport w 'firebase/auth'
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('firebase/auth')
    if (mod?.getReactNativePersistence) return mod.getReactNativePersistence
  } catch {}
  try {
    // fallback – działa w 10–12
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rn = require('firebase/auth/dist/rn/index.js')
    if (rn?.getReactNativePersistence) return rn.getReactNativePersistence
  } catch {}
  return undefined
}

console.log('[FB] firebase.ts loaded')

const cfg = Constants.expoConfig?.extra?.firebase
if (!cfg) {
  console.error('[FB] Missing expo.extra.firebase in app.config.js')
  throw new Error('Brak konfiguracji Firebase — sprawdź app.config.js → extra.firebase')
}

// 1) App
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(cfg)

// 2) Auth
const isNative = Platform.OS === 'ios' || Platform.OS === 'android'
const getRNPersistence = resolveGetReactNativePersistence()

let auth: Auth

if (isNative) {
  // Jeśli Auth już zainicjalizowany – zwróci gotowy
  try {
    auth = getAuth(app)
  } catch {
    // Inicjalizacja dla RN (iOS/Android)
    if (getRNPersistence) {
      auth = initializeAuth(app, {
        persistence: getRNPersistence(AsyncStorage),
      })
    } else {
      // awaryjnie bez persystencji (pamięć) – nie crashuje na starcie
      auth = initializeAuth(app, {})
      console.warn(
        '[FB] RN persistence not found – stan logowania nie przetrwa restartu. ' +
          'Upewnij się, że zainstalowano @react-native-async-storage/async-storage.'
      )
    }
  }
} else {
  // Web
  auth = getAuth(app)
}

console.log('[FB] initialized:', {
  name: app.name,
  projectId: app.options.projectId,
  appId: app.options.appId,
})

export { app, auth }
export type { Auth }
