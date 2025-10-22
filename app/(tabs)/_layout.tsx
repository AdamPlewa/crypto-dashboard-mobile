// app/(tabs)/_layout.tsx
import { HapticTab } from '@/components/haptic-tab'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Tabs, usePathname } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'

export default function TabLayout() {
	const { user } = useAuth()
	const colorScheme = useColorScheme()
	const tint = Colors[colorScheme ?? 'light'].tint
	const pathname = usePathname()

	const isLoggedIn = !!user
	const onRegisterScreen = pathname?.includes('/register')
	const authTitle = isLoggedIn ? 'Mój profil' : onRegisterScreen ? 'Rejestracja' : 'Login'
	const authIcon = isLoggedIn ? 'person.fill' : onRegisterScreen ? 'person.fill' : 'person.fill'

	return (
		<Tabs
			key={isLoggedIn ? 'auth' : onRegisterScreen ? 'guest-register' : 'guest-login'}
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: tint,
				// ⛔️ NIC tutaj o tabBarButton – usuwamy globalne HapticTab
			}}>
			{/* 1) HOME – WIDOCZNY slot */}
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />,
					tabBarButton: HapticTab, // ✅ tylko tu
				}}
			/>

			{/* 2) EXPLORE – WIDOCZNY slot */}
			<Tabs.Screen
				name='explore'
				options={{
					title: 'Explore',
					tabBarIcon: ({ color }) => <IconSymbol size={28} name='paperplane.fill' color={color} />,
					tabBarButton: HapticTab, // ✅ tylko tu
				}}
			/>

			{/* 3) AUTH – JEDEN WIDOCZNY slot (etykieta/ikona dynamiczne) */}
			<Tabs.Screen
				name='auth'
				options={{
					title: authTitle,
					tabBarIcon: ({ color }) => <IconSymbol size={28} name={authIcon} color={color} />,
					tabBarButton: HapticTab, // ✅ tylko tu
				}}
			/>

			{/* ⬇️ Docelowe ekrany – UKRYTE (nie mają przycisków, nie zajmują miejsca) */}
			<Tabs.Screen name='login' options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
			<Tabs.Screen name='register' options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
			<Tabs.Screen name='profile' options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
		</Tabs>
	)
}
