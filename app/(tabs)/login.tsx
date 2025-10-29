import { Link, useRouter } from 'expo-router'
import { ActivityIndicator, Alert, Button, Text, TextInput, View, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin'
import { useAuth } from '../../src/context/AuthContext'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function LoginScreen() {
  const router = useRouter()
  const { setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const tint = Colors[colorScheme ?? 'light'].tint

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '656233021-96b5to7mns3vg9ol9errel25iefbtek3.apps.googleusercontent.com',
      offlineAccess: false,
    })
  }, [])

  const showMessage = (title: string, msg: string) => {
    Platform.OS === 'web' ? alert(`${title}\n\n${msg}`) : Alert.alert(title, msg)
  }

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  // ---------------- Google Sign-In natywnie ----------------
  const onGooglePress = async () => {
    if (busy) return
    setBusy(true)

    try {
    await GoogleSignin.hasPlayServices()
    const userInfo = await GoogleSignin.signIn()
    // userInfo can be either the user object or an object with a `user` property depending on library/version; normalize it
    const gUser = ((userInfo as any).user ?? (userInfo as any)) as { email?: string; name?: string; photo?: string }

    setUser({
      email: gUser.email ?? '',
      name: gUser.name ?? '',
      photo: gUser.photo ?? '',
    })

      Alert.alert('Sukces', `Zalogowano jako ${gUser.name || gUser.email}`)
      router.replace('/(tabs)/auth')
    } catch (error: any) {
      console.error('[AUTH] Google Sign-In Error', error)
      if (error.code === statusCodes.SIGN_IN_CANCELLED) console.log('User cancelled login')
      else if (error.code === statusCodes.IN_PROGRESS) console.log('Signin in progress')
      else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
        showMessage('Błąd', 'Google Play Services niedostępne na tym urządzeniu.')
      else showMessage('Błąd', 'Nie udało się zalogować przez Google.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12, backgroundColor: isDark ? '#0B0B0B' : '#FFF' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: isDark ? '#FFF' : '#111', marginBottom: 8 }}>Logowanie</Text>

      <View style={{ marginTop: 12 }}>
        {busy ? (
          <ActivityIndicator />
        ) : (
          <GoogleSigninButton
            style={{ width: '100%', height: 48 }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={onGooglePress}
          />
        )}
      </View>

      <Text style={{ marginTop: 16, color: isDark ? '#B5B5B5' : '#444' }}>
        Nie masz konta?{' '}
        <Link href="/(tabs)/register" style={{ color: tint, fontWeight: '700' }}>
          Zarejestruj się
        </Link>
      </Text>
    </View>
  )
}
