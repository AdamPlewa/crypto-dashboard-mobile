// app/(tabs)/login.tsx
import { Link, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Platform,
	Pressable,
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
  const { setAppUser } = authCtx ?? ({} as any)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

const colorScheme = useColorScheme()
const isDark = false // wymuszony jasny motyw
const tint = Colors.light.tint


  const bg = isDark ? '#0B0B0B' : '#FFFFFF'
  const text = isDark ? '#FFFFFF' : '#111111'
  const sub = isDark ? '#B5B5B5' : '#444444'
  const inputBg = isDark ? '#161616' : '#FFFFFF'
  const border = isDark ? '#2B2B2B' : '#DADADA'
  const placeholder = isDark ? '#7A7A7A' : '#9A9A9A'

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  useEffect(() => {
    // konfiguruj tylko na urządzeniu (na web nie ma play services)
    try {
      GoogleSignin.configure({
        webClientId: '656233021-96b5to7mns3vg9ol9errel25iefbtek3.apps.googleusercontent.com',
        offlineAccess: false,
      })
    } catch (e) {
      console.warn('GoogleSignin.configure failed', e)
    }
  }, [])

  const showMessage = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}\n\n${msg}`)
    else Alert.alert(title, msg)
  }

  const humanizeAuthError = (code?: string) => {
    switch (code) {
      case 'auth/invalid-email': return 'Nieprawidłowy adres e-mail.'
      case 'auth/missing-password': return 'Podaj hasło.'
      case 'auth/wrong-password': return 'Błędne hasło.'
      case 'auth/user-not-found': return 'Takie konto nie istnieje.'
      case 'auth/too-many-requests': return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.'
      case 'auth/network-request-failed': return 'Brak połączenia z siecią.'
      default: return 'Nie udało się zalogować. Spróbuj ponownie.'
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
      // push/replace — zależy co wolisz, push tworzy historię, replace zastępuje
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

      // Obsłuż różne kształty zwracanego obiektu
      const raw: any = userInfo as any
      const maybeUser = raw.user ?? raw.data?.user ?? raw.data ?? raw

      const directName = maybeUser?.name ?? null
      const given = (maybeUser?.givenName ?? '') as string
      const family = (maybeUser?.familyName ?? '') as string
      const combined = `${given} ${family}`.trim()
      const finalName = directName ?? (combined.length > 0 ? combined : null)

      const appUser = {
        provider: 'google' as const,
        email: maybeUser?.email ?? maybeUser?.emailAddress ?? null,
        uid: (maybeUser?.id ?? maybeUser?.userId ?? null) as string | null,
        name: finalName,
        photo: maybeUser?.photo ?? maybeUser?.photoUrl ?? maybeUser?.imageUrl ?? null,
      }

      // jeżeli kontekst ma setAppUser — użyj, inaczej logujemy tylko debug
      if (typeof setAppUser === 'function') {
        setAppUser(appUser)
      } else {
        console.warn('[AUTH] setAppUser is not a function — skipping setAppUser')
      }

      Alert.alert('Sukces', `Zalogowano jako ${appUser.name ?? appUser.email ?? 'użytkownik'}`)

      // mały timeout żeby expo-router miał czas na zaktualizowanie stanu kontekstu
      setTimeout(() => {
        router.push('/(tabs)/profile')
      }, 120)
    } catch (error: any) {
      console.error('[AUTH] Google Sign-In Error', error)
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled login')
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        console.log('Signin in progress')
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
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
            {/* customowy przycisk zamiast natywnego Button */}
            <Pressable
              onPress={onLogin}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: tint,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: isDark ? '#fff' : '#fff', fontWeight: '700' }}>Zaloguj</Text>
            </Pressable>

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
