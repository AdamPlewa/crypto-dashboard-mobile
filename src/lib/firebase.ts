// src/lib/firebase.ts
import Constants from 'expo-constants'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'

console.log('[FB] firebase.ts loaded')

const cfg = Constants.expoConfig?.extra?.firebase

if (!cfg) {
	console.error('[FB] Missing expo.extra.firebase in app.config.js')
	throw new Error('Brak konfiguracji Firebase — sprawdź app.config.js → extra.firebase')
}

// ✅ Użyj istniejącej instancji jeśli już była zainicjalizowana
const app = getApps().length ? getApp() : initializeApp(cfg)

console.log('[FB] initialized:', {
	name: app.name,
	projectId: app.options.projectId,
	appId: app.options.appId,
})

// ✅ Pobieramy auth (Firebase Auth SDK)
export const auth = getAuth(app)

setPersistence(auth, browserLocalPersistence)
	.then(() => console.log('[FB] Auth persistence: local'))
	.catch(e => console.warn('[FB] setPersistence error', e))
