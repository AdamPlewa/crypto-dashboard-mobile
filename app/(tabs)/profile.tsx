// app/(tabs)/profile.tsx
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Button, Text, View } from 'react-native'
import { useAuth } from '../../src/context/AuthContext'

export default function ProfileScreen() {
  const { user, signOutUser, loading } = useAuth()
  const router = useRouter()
  const isDark = useColorScheme() === 'dark'

  useEffect(() => {
    // jeśli nie ma usera i już załadowaliśmy auth -> przenieś na login
    if (!loading && !user) {
      router.replace('/(tabs)/login')
    }
  }, [user, loading, router])

  if (loading) return <Text>Ładowanie...</Text>
  if (!user) return null // useEffect zajmie się redirectem

  return (
    <View style={{ flex: 1, padding: 20, gap: 12, justifyContent: 'center', backgroundColor: isDark ? '#0B0B0B' : '#FFF' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: isDark ? '#FFF' : '#111' }}>Mój profil</Text>

      <Text style={{ color: isDark ? '#B5B5B5' : '#444' }}>
        Email: <Text style={{ color: isDark ? '#FFF' : '#111' }}>{user.email ?? '—'}</Text>
      </Text>

      <Text style={{ color: isDark ? '#B5B5B5' : '#444' }}>
        Nazwa: <Text style={{ color: isDark ? '#FFF' : '#111' }}>{user.name ?? '—'}</Text>
      </Text>

      <Text style={{ color: isDark ? '#B5B5B5' : '#444' }}>
        UID: <Text style={{ color: isDark ? '#FFF' : '#111' }}>{user.uid ?? '—'}</Text>
      </Text>

      <Button
        title="Wyloguj"
        onPress={async () => {
          await signOutUser()
          // po wylogowaniu kontekst ustawi user = null -> useEffect wykona replace
        }}
      />
    </View>
  )
}
