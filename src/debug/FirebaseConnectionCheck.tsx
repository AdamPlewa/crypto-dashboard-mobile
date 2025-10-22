// src/debug/FirebaseConnectionCheck.tsx
import Constants from 'expo-constants'
import { getApp, getApps } from 'firebase/app'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'

export default function FirebaseConnectionCheck() {
	useEffect(() => {
		try {
			// 1) Czy aplikacja Firebase istnieje?
			const hasApp = getApps().length > 0
			console.log('[FB] app exists:', hasApp)

			// 2) Pobierz app i wyświetl podstawowe opcje (bez żadnych połączeń sieciowych)
			const app = getApp() // rzuci błąd, jeśli brak inicjalizacji
			console.log('[FB] app.name:', app.name)
			console.log('[FB] app.options.projectId:', app.options.projectId)
			console.log('[FB] app.options.appId:', app.options.appId)
			console.log('[FB] app.options.authDomain:', app.options.authDomain)

			// 3) Porównaj z tym, co masz w app.json
			const cfg = Constants.expoConfig?.extra?.firebase
			console.log('[FB] config from app.json:', {
				projectId: cfg?.projectId,
				appId: cfg?.appId,
				authDomain: cfg?.authDomain,
			})
		} catch (e) {
			console.error('[FB] Initialization error:', e)
		}
	}, [])

	return (
		<View style={{ padding: 16 }}>
			<Text style={{ fontSize: 16, fontWeight: '600' }}>Firebase Connection Check</Text>
			<Text>Sprawdź konsolę: powinna pokazać nazwę appki i opcje z konfiguracji.</Text>
		</View>
	)
}
