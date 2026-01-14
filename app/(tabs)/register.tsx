// app/(auth)/register.tsx
import { Link, useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Button, Platform, Text, TextInput, View } from 'react-native'

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { auth, db } from '../../src/lib/firebase' // z (auth) -> ../../src/lib/firebase

export default function RegisterScreen() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [busy, setBusy] = useState(false)
	const router = useRouter()

	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const tint = Colors[colorScheme ?? 'light'].tint

	const bg = isDark ? '#0B0B0B' : '#FFFFFF'
	const text = isDark ? '#FFFFFF' : '#111111'
	const sub = isDark ? '#B5B5B5' : '#444444'
	const inputBg = isDark ? '#161616' : '#FFFFFF'
	const border = isDark ? '#2B2B2B' : '#DADADA'
	const placeholder = isDark ? '#7A7A7A' : '#9A9A9A'

	const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

	const humanizeAuthError = (code?: string) => {
		switch (code) {
			case 'auth/email-already-in-use':
				return 'Ten e-mail jest już zajęty. Zaloguj się tym adresem.'
			case 'auth/invalid-email':
				return 'Nieprawidłowy adres e-mail.'
			case 'auth/weak-password':
				return 'Hasło jest zbyt słabe (min. 6 znaków).'
			case 'auth/network-request-failed':
				return 'Brak połączenia z siecią.'
			default:
				return 'Nie udało się utworzyć konta. Spróbuj ponownie.'
		}
	}
	const showMessage = (title: string, msg: string) => {
		if (Platform.OS === 'web') {
			alert(`${title}\n\n${msg}`) // zwykły window.alert
		} else {
			Alert.alert(title, msg)
		}
	}
	const onRegister = async () => {
		if (busy) return

		const mail = email.trim()
		const pass = password

		// 🔎 Walidacje lokalne
		if (!mail && !pass) {
			showMessage('Brak danych', 'Podaj e-mail i hasło.')
			return
		}
		if (!mail) {
			showMessage('Brak e-maila', 'Podaj adres e-mail.')
			return
		}
		if (!isEmail(mail)) {
			showMessage('Nieprawidłowy e-mail', 'Sprawdź format adresu e-mail.')
			return
		}
		if (!pass) {
			showMessage('Brak hasła', 'Podaj hasło.')
			return
		}
		if (pass.length < 6) {
			showMessage('Hasło za krótkie', 'Hasło musi mieć co najmniej 6 znaków.')
			return
		}

		try {
			setBusy(true)
			const userCred = await createUserWithEmailAndPassword(auth, mail, pass)
			
			// Tworzymy dokument użytkownika w Firestore
			// Domyślnie brak subskrypcji
			await setDoc(doc(db, 'users', userCred.user.uid), {
				email: mail,
				createdAt: new Date(),
				isSubscribed: false
			})

			// Po sukcesie Firebase zaloguje od razu użytkownika
			router.replace('/(tabs)/profile') // trzymaj się grupy tabs, żeby był dolny pasek
		} catch (e: any) {
			const msg = humanizeAuthError(e?.code)
			showMessage('Błąd rejestracji', msg)
		} finally {
			setBusy(false)
		}
	}

	return (
		<View style={{ flex: 1, backgroundColor: bg, padding: 20, gap: 12, justifyContent: 'center' }}>
			<Text style={{ fontSize: 26, fontWeight: '800', color: text, marginBottom: 8 }}>Rejestracja</Text>

			<Text style={{ color: sub }}>Email</Text>
			<TextInput
				placeholder='np. jan@kowalski.pl'
				placeholderTextColor={placeholder}
				autoCapitalize='none'
				autoCorrect={false}
				keyboardType='email-address'
				value={email}
				onChangeText={setEmail}
				style={{
					color: text,
					backgroundColor: inputBg,
					borderWidth: 1,
					borderColor: border,
					borderRadius: 12,
					paddingHorizontal: 14,
					paddingVertical: 12,
				}}
			/>

			<Text style={{ color: sub, marginTop: 6 }}>Hasło (min. 6 znaków)</Text>
			<TextInput
				placeholder='••••••••'
				placeholderTextColor={placeholder}
				secureTextEntry
				value={password}
				onChangeText={setPassword}
				style={{
					color: text,
					backgroundColor: inputBg,
					borderWidth: 1,
					borderColor: border,
					borderRadius: 12,
					paddingHorizontal: 14,
					paddingVertical: 12,
				}}
			/>

			<View style={{ marginTop: 12 }}>
				{busy ? <ActivityIndicator /> : <Button title='Utwórz konto' onPress={onRegister} color={tint} />}
			</View>

			<Text style={{ color: sub, marginTop: 16 }}>
				Masz już konto?{' '}
				<Link href='/(tabs)/login' style={{ color: tint, fontWeight: '700' }}>
					Zaloguj się
				</Link>
			</Text>
		</View>
	)
}
