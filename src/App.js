import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Navigation from './navigation'
import TestSVG from './screens/TestSVG'

export default function App() {
	return (
		<SafeAreaProvider>
			<NavigationContainer>
				<Navigation />
				<TestSVG />
			</NavigationContainer>
		</SafeAreaProvider>
	)
}
