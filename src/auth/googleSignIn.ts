// src/auth/googleSignIn.ts
import { makeRedirectUri } from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import Constants from 'expo-constants'
import * as WebBrowser from 'expo-web-browser'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { Platform } from 'react-native'
import { auth } from '../lib/firebase'

WebBrowser.maybeCompleteAuthSession()

export function useGoogleAuth() {
	const webClientId = Constants.expoConfig?.extra?.google?.webClientId as string
	const iosClientId = Constants.expoConfig?.extra?.google?.iosClientId as string

	// na iOS/Android używamy AuthSession (redirect przez proxy Expo w dev)
	const redirectUri = makeRedirectUri({
		useProxy: true, // prościej w dev
		native: 'cryptodashboardmobile:/oauthredirect', // scheme z app.config
	})

	const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
		clientId: Platform.select({ web: webClientId, ios: iosClientId, android: webClientId, default: webClientId }),
		redirectUri,
	})

	const signInWithGoogle = async () => {
		const res = await promptAsync({ useProxy: true })
		if (res?.type !== 'success') return null
		const idToken = res.params?.id_token
		if (!idToken) throw new Error('Brak id_token z Google.')
		const cred = GoogleAuthProvider.credential(idToken)
		const userCred = await signInWithCredential(auth, cred)
		return userCred.user
	}

	return { request, response, signInWithGoogle }
}
