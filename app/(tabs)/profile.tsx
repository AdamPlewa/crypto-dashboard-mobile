import { useColorScheme } from '@/hooks/use-color-scheme'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Button, Text, View } from 'react-native'
import { useAuth } from '../../src/context/AuthContext'

export default function ProfileScreen() {
  const { user, signOutUser } = useAuth()
  const router = useRouter()
  const isDark = useColorScheme() === 'dark'

  useEffect(() => {
    if (!user) router.replace('/(tabs)/login')
  }, [user, router])

  if (!user) return <Text style={{ color: isDark ? '#FFF' : '#111', textAlign: 'center', marginTop: 20 }}>Ładowanie...</Text>

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12, backgroundColor: isDark ? '#0B0B0B' : '#FFF' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: isDark ? '#FFF' : '#111' }}>Mój profil</Text>
      <Text style={{ color: isDark ? '#B5B5B5' : '#444' }}>Email: <Text style={{ color: isDark ? '#FFF' : '#111' }}>{user.email}</Text></Text>
      {user.name && <Text style={{ color: isDark ? '#B5B5B5' : '#444' }}>Name: <Text style={{ color: isDark ? '#FFF' : '#111' }}>{user.name}</Text></Text>}
      <Button
        title='Wyloguj'
        onPress={() => {
          signOutUser()
          router.replace('/(tabs)/login')
        }}
      />
    </View>
  )
}
