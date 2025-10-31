import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, useColorScheme, View } from 'react-native'
import CoinItem from '../../src/components/CoinItem'
import { useCoins } from '../../src/context/CoinsContent'
import { useWatchlist } from '../../src/context/WatchlistContent'

export default function WatchlistScreen() {
	const { ids } = useWatchlist()
	const { coins, isLoading, error } = useCoins()
	const router = useRouter()
	const colorScheme = useColorScheme()

	const data = coins.filter(c => ids.has(c.id))
      
	// 🎨 Kolory — jasne tło, ciemny tekst
	const backgroundColor = colorScheme === 'dark' ? '#fff'  : '#ffffff'
	const textColor = colorScheme === 'dark' ? '#000000ff' : '#000000'

	const handlePress = (id: string) => {
		router.push(`/coin/${id}`)
	}

	if (isLoading)
		return (
			<View style={[styles.center, { backgroundColor }]}>
				<Text style={{ color: textColor }}>Ładowanie…</Text>
			</View>
		)

	if (error)
		return (
			<View style={[styles.center, { backgroundColor }]}>
				<Text style={{ color: textColor }}>Błąd: {error}</Text>
			</View>
		)

	if (data.length === 0)
		return (
			<View style={[styles.center, { backgroundColor }]}>
				<Text style={[styles.title, { color: textColor }]}>Watchlist</Text>
				<Text style={{ color: textColor, marginTop: 8 }}>Brak coinów na watchliście.</Text>
				<Text style={{ color: textColor, opacity: 0.8 }}>Dodaj gwiazdką na liście głównej.</Text>
			</View>
		)

	return (
		<View style={[styles.container, { backgroundColor }]}>
			<Text style={[styles.title, { color: textColor }]}>Watchlist</Text>
			<FlatList
				data={data}
				keyExtractor={item => item.id}
				renderItem={({ item }) => <CoinItem item={item} onPress={handlePress} />}
				contentContainerStyle={{ paddingBottom: 32 }}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 12,
		textAlign: 'left',
	},
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 16,
	},
})
