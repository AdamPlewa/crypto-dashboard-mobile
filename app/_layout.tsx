// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'

import { AuthProvider } from '../src/context/AuthContext'



// ⬇️ WAŻNE: import „dla efektu ubocznego” — uruchamia initializeApp()
// (ścieżka z folderu app/ do src/lib/firebase.ts)
import '../src/lib/firebase'

import { getApp, getApps } from 'firebase/app'

// safe area provider
import { SafeAreaProvider } from 'react-native-safe-area-context'

export const unstable_settings = {
	anchor: '(tabs)',
}

export default function RootLayout() {
	const colorScheme = useColorScheme()

	useEffect(() => {
		if (__DEV__) {
			console.log('--- FIREBASE TEST ---')
			console.log('Apps count:', getApps().length)

			if (getApps().length > 0) {
				const app = getApp()
				console.log('Firebase connected ✅')
				console.log('Name:', app.name) // [DEFAULT]
				console.log('Project ID:', app.options.projectId)
				console.log('App ID:', app.options.appId)
				console.log('Auth domain:', app.options.authDomain)
			} else {
				console.log('❌ Firebase NOT initialized')
			}
		}
	}, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
          {/* StatusBar globalnie */}
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}