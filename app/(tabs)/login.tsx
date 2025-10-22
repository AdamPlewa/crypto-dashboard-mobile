import { Link, useRouter } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Button, Platform, Text, TextInput, View } from 'react-native'

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { auth } from '../../src/lib/firebase' // z (tabs) -> ../../src

export default function LoginScreen() {
	const router = useRouter()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [busy, setBusy] = useState(false)

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

	const showMessage = (title: string, msg: string) => {
		if (Platform.OS === 'web') {
			alert(`${title}\n\n${msg}`) // zwykły window.alert
		} else {
			Alert.alert(title, msg)
		}
	}

	const humanizeAuthError = (code?: string) => {
		switch (code) {
			case 'auth/invalid-email':
				return 'Nieprawidłowy adres e-mail.'
			case 'auth/missing-password':
				return 'Podaj hasło.'
			case 'auth/invalid-credential':
			case 'auth/wrong-password':
				return 'Błędne hasło.'
			case 'auth/user-not-found':
				return 'Takie konto nie istnieje.'
			case 'auth/too-many-requests':
				return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.'
			case 'auth/network-request-failed':
				return 'Brak połączenia z siecią.'
			default:
				return 'Nie udało się zalogować. Spróbuj ponownie.'
		}
	}

	const onLogin = async () => {
		if (busy) return

		const mail = email.trim()
		const pass = password

		// 🔎 Walidacje lokalne (zanim wyślesz request)
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

		try {
			setBusy(true)
			await signInWithEmailAndPassword(auth, mail, pass)
			router.replace('/(tabs)/profile') // zostajesz w layoucie z tab barem
		} catch (e: any) {
			const msg = humanizeAuthError(e?.code)
			Alert.alert('Błąd logowania', msg)
		} finally {
			setBusy(false)
		}
	}

	return (
		<View style={{ flex: 1, backgroundColor: bg, padding: 20, gap: 12, justifyContent: 'center' }}>
			<Text style={{ fontSize: 26, fontWeight: '800', color: text, marginBottom: 8 }}>Logowanie</Text>

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

			<Text style={{ color: sub, marginTop: 6 }}>Hasło</Text>
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
				{busy ? <ActivityIndicator /> : <Button title='Zaloguj' onPress={onLogin} color={tint} />}
			</View>

			<Text style={{ color: sub, marginTop: 16 }}>
				Nie masz konta?{' '}
				<Link href='/(tabs)/register' style={{ color: tint, fontWeight: '700' }}>
					Zarejestruj się
				</Link>
			</Text>
		</View>
	)
}
