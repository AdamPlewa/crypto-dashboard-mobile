// src/auth/googleWebDirect.ts
import { getRedirectResult, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth } from '../lib/firebase'

export async function signInWithGoogleWebDirect() {
	const provider = new GoogleAuthProvider()
	provider.setCustomParameters({ prompt: 'select_account' })

	try {
		const cred = await signInWithPopup(auth, provider) // popup
		return cred.user
	} catch {
		// popup zablokowany → fallback do redirect
		await signInWithRedirect(auth, provider)
		return null
	}
}

// wywołaj raz po wejściu na ekran (useEffect) – domyka redirect flow
export async function handleRedirectResult() {
	try {
		const res = await getRedirectResult(auth)
		return res?.user ?? null
	} catch (e) {
		console.warn('[Google Redirect] error:', e)
		return null
	}
}
