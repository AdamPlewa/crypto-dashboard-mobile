// app/(tabs)/_layout.tsx
import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Tabs, usePathname, useRootNavigation, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useAuth } from '../../src/context/AuthContext'

export default function TabLayout() {
	const { user } = useAuth()
	const colorScheme = useColorScheme()
	const tint = Colors[colorScheme ?? 'light'].tint
	const pathname = usePathname()
	const router = useRouter()
	const rootNav = useRootNavigation()
	const navReady = rootNav?.isReady

	const isLoggedIn = !!user
	const onRegisterScreen = pathname?.includes('/register')
	const authTitle = isLoggedIn ? 'Mój profil' : onRegisterScreen ? 'Rejestracja' : 'Login'
	const authIcon = 'person.fill'

	// Dokąd ma prowadzić tab "Auth"
	const authTarget = useMemo(
		() => (isLoggedIn ? '/(tabs)/profile' : onRegisterScreen ? '/(tabs)/register' : '/(tabs)/login'),
		[isLoggedIn, onRegisterScreen]
	)

	return (
		<Tabs
			key={isLoggedIn ? 'auth' : onRegisterScreen ? 'guest-register' : 'guest-login'}
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: tint,
			}}>
			{/* 1) HOME */}
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />,
					tabBarButton: HapticTab,
				}}
			/>

			{/* 2) EXPLORE */}
			<Tabs.Screen
				name='explore'
				options={{
					title: 'Explore',
					tabBarIcon: ({ color }) => <IconSymbol size={28} name='paperplane.fill' color={color} />,
					tabBarButton: HapticTab,
				}}
			/>

			{/* 3) AUTH – widoczny przycisk, bez własnej trasy.
             Przechwytujemy klik i ręcznie nawigujemy do login/register/profile. */}
			<Tabs.Screen
				name='auth'
				options={{
					title: authTitle,
					tabBarIcon: ({ color }) => <IconSymbol size={28} name={authIcon} color={color} />,
					// Własny przycisk z haptyką i ręcznym onPress:
					tabBarButton: props => (
						<HapticTab
							{...props}
							onPress={e => {
								// nie nawiguj, dopóki root navigation nie gotowe
								if (!navReady) return
								// ręczna nawigacja do odpowiedniego ekranu
								router.replace(authTarget)
							}}
						/>
					),
				}}
			/>

			{/* Docelowe ekrany – ukryte w pasku kart */}
			<Tabs.Screen name='login' options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
			<Tabs.Screen name='register' options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
			<Tabs.Screen name='profile' options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
		</Tabs>
	)
}
