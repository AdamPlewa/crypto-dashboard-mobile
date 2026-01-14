// app/(auth)/register.tsx
import { Link, useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, Text, TextInput, View } from 'react-native'

import { Colors } from '@/constants/theme'
import { auth, db } from '../../src/lib/firebase'; // z (auth) -> ../../src/lib/firebase

export default function RegisterScreen() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  // 🔒 WYMUSZONY JASNY MOTYW – jak login
  const isDark = false
  const tint = Colors.light.tint

  const bg = '#FFFFFF'
  const text = '#111111'
  const sub = '#444444'
  const inputBg = '#FFFFFF'
  const border = '#DADADA'
  const placeholder = '#9A9A9A'

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const showMessage = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}\n\n${msg}`)
    else Alert.alert(title, msg)
  }

  const humanizeAuthError = (code?: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ten e-mail jest już zajęty. Zaloguj się.'
      case 'auth/invalid-email':
        return 'Nieprawidłowy adres e-mail.'
      case 'auth/weak-password':
        return 'Hasło jest zbyt słabe (min. 6 znaków).'
      case 'auth/network-request-failed':
        return 'Brak połączenia z siecią.'
      default:
        return 'Nie udało się utworzyć konta.'
    }
  }

  const onRegister = async () => {
    if (busy) return

    const mail = email.trim()
    const pass = password

    if (!mail && !pass) return showMessage('Brak danych', 'Podaj e-mail i hasło.')
    if (!mail) return showMessage('Brak e-maila', 'Podaj adres e-mail.')
    if (!isEmail(mail)) return showMessage('Nieprawidłowy e-mail', 'Sprawdź format adresu e-mail.')
    if (!pass) return showMessage('Brak hasła', 'Podaj hasło.')
    if (pass.length < 6)
      return showMessage('Hasło za krótkie', 'Hasło musi mieć co najmniej 6 znaków.')

    try {
      setBusy(true)
      const userCred = await createUserWithEmailAndPassword(auth, mail, pass)

      await setDoc(doc(db, 'users', userCred.user.uid), {
        email: mail,
        createdAt: new Date(),
        isSubscribed: false,
      })

      router.replace('/(tabs)/profile')
    } catch (e: any) {
      showMessage('Błąd rejestracji', humanizeAuthError(e?.code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, padding: 20, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: text, marginBottom: 8 }}>
        Rejestracja
      </Text>

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

      <Text style={{ color: sub, marginTop: 6 }}>Hasło (min. 6 znaków)</Text>
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
          <Pressable
            onPress={onRegister}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: tint,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Utwórz konto</Text>
          </Pressable>
        )}
      </View>

      <Text style={{ color: sub, marginTop: 16 }}>
        Masz już konto?{' '}
        <Link href="/(tabs)/login" style={{ color: tint, fontWeight: '700' }}>
          Zaloguj się
        </Link>
      </Text>
    </View>
  )
}
