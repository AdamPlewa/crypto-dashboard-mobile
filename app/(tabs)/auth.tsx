// app/(tabs)/auth.tsx
import { Redirect, usePathname } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'

export default function AuthSlot() {
	const { user } = useAuth()
	const pathname = usePathname()

	if (user) return <Redirect href='/profile' />
	const goRegister = pathname?.includes('/register')
	return <Redirect href={goRegister ? '/register' : '/login'} />
}
