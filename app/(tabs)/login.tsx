// app/(tabs)/login.tsx
import { Link, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native'

import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useAuth } from '../../src/context/AuthContext'
import { auth as firebaseAuth } from '../../src/lib/firebase'

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function LoginScreen() {
  const router = useRouter()
  const authCtx = useAuth()
  const { setAppUser } = authCtx

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

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '656233021-96b5to7mns3vg9ol9errel25iefbtek3.apps.googleusercontent.com',
      offlineAccess: false,
    })
  }, [])

  const showMessage = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}\n\n${msg}`)
    else Alert.alert(title, msg)
  }

  const humanizeAuthError = (code?: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Nieprawidłowy adres e-mail.'
      case 'auth/missing-password':
        return 'Podaj hasło.'
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

  // Email/password (Firebase)
  const onLogin = async () => {
    if (busy) return
    const mail = email.trim()
    const pass = password

    if (!mail && !pass) return showMessage('Brak danych', 'Podaj e-mail i hasło.')
    if (!mail) return showMessage('Brak e-maila', 'Podaj adres e-mail.')
    if (!isEmail(mail)) return showMessage('Nieprawidłowy e-mail', 'Sprawdź format adresu e-mail.')
    if (!pass) return showMessage('Brak hasła', 'Podaj hasło.')

    setBusy(true)
    try {
      await signInWithEmailAndPassword(firebaseAuth, mail, pass)
      router.replace('/(tabs)/profile')
    } catch (e: any) {
      showMessage('Błąd logowania', humanizeAuthError(e?.code))
    } finally {
      setBusy(false)
    }
  }

  // Natywne Google sign-in (bez Firebase)
  const onGooglePress = async () => {
    if (busy) return
    setBusy(true)
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      console.log('[AUTH] Google user raw:', userInfo)

      // pobierz user niezależnie od formatu (userInfo.user, userInfo.data.user, userInfo.data, userInfo)
      const raw: any = userInfo as any
      const maybeUser = raw.user ?? raw.data?.user ?? raw.data ?? raw

      // Bezpieczne zbudowanie name (unikamy mieszania ?? i ||)
      const directName = maybeUser.name ?? null
      const given = (maybeUser.givenName ?? '') as string
      const family = (maybeUser.familyName ?? '') as string
      const combined = `${given} ${family}`.trim()
      const finalName = directName ?? (combined.length > 0 ? combined : null)

      const appUser = {
        provider: 'google' as const,
        email: maybeUser.email ?? maybeUser.emailAddress ?? null,
        uid: (maybeUser.id ?? maybeUser.userId ?? null) as string | null,
        name: finalName,
        photo: maybeUser.photo ?? maybeUser.photoUrl ?? maybeUser.imageUrl ?? null,
      }

      if (typeof setAppUser === 'function') {
        setAppUser(appUser)
      } else {
        console.warn('[AUTH] setAppUser is not a function')
      }

      Alert.alert('Sukces', `Zalogowano jako ${appUser.name ?? appUser.email ?? 'użytkownik'}`)
      setTimeout(() => {
        // użyj push (bezpośrednio otworzy ekran), lub replace jeśli chcesz zastąpić historię
        router.push('/(tabs)/profile')
      }, 50)
    } catch (error: any) {
      console.error('[AUTH] Google Sign-In Error', error)
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled login')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Signin in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showMessage('Błąd', 'Google Play Services niedostępne na tym urządzeniu.')
      } else {
        showMessage('Błąd', 'Nie udało się zalogować przez Google.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, padding: 20, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: text, marginBottom: 8 }}>Logowanie</Text>

      <Text style={{ color: sub }}>Email</Text>
      <TextInput
        placeholder="np. jan@kowalski.pl"
        placeholderTextColor={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
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
        placeholder="••••••••"
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
        {busy ? (
          <ActivityIndicator />
        ) : (
          <>
            <Button title="Zaloguj" onPress={onLogin} color={tint} />
            <GoogleSigninButton
              style={{ width: '100%', height: 48, marginTop: 12 }}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={onGooglePress}
            />
          </>
        )}
      </View>

      <Text style={{ color: sub, marginTop: 16 }}>
        Nie masz konta?{' '}
        <Link href="/(tabs)/register" style={{ color: tint, fontWeight: '700' }}>
          Zarejestruj się
        </Link>
      </Text>
    </View>
  )
}
