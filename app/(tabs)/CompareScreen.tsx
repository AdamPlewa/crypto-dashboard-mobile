// src/screens/CompareScreen.tsx
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTwoCoinsHistory } from '../../hooks/useTwoCoinsHistory'
import CoinItem from '../../src/components/CoinItem'
import { CompareChart } from '../../src/components/CompareCharts' // jedna oś Y, tryb %/nominal
import { useCoins } from '../../src/context/CoinsContent'

type Mode = 'pct' | 'nominal'
type RangeDays = 1 | 3 | 7 | 30 | 90

const RANGES: { label: string; days: RangeDays }[] = [
	{ label: '1D', days: 1 },
	{ label: '3D', days: 3 },
	{ label: '7D', days: 7 },
	{ label: '1M', days: 30 },
	{ label: '90D', days: 90 },
]

export default function CompareScreen() {
	const { coins, isLoading, error } = useCoins()
	const [query, setQuery] = useState('')
	const [selected, setSelected] = useState<string[]>([]) // np. ['bitcoin','ethereum']
	const [mode, setMode] = useState<Mode>('pct') // % zmiany ↔ nominal (USD)
	const [days, setDays] = useState<RangeDays>(7)

	// filtrowanie listy coinów
	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return coins
		return coins.filter(
			c => c.id.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
		)
	}, [coins, query])

	// wybór maks. 2 coinów
	const toggleSelect = (id: string) => {
		setSelected(prev => {
			if (prev.includes(id)) return prev.filter(x => x !== id) // odznacz
			if (prev.length >= 2) return prev // blokuj >2
			return [...prev, id] // zaznacz
		})
	}
	const clearSelection = () => setSelected([])

	const canCompare = selected.length === 2
	const [coinA, coinB] = selected

	// pobieramy surowe wartości; %/nominal robi CompareChart
	const {
		seriesA,
		seriesB,
		loading: loadingChart,
		error: errChart,
	} = useTwoCoinsHistory(canCompare ? coinA : undefined, canCompare ? coinB : undefined, {
		days,
		asPctChange: false,
	})

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Compare Coins</Text>

			{/* Pasek wybranych (chip-y) */}
			<View style={styles.selectedBar}>
				<Text style={styles.selectedLabel}>Selected:</Text>
				{selected.length === 0 ? (
					<Text style={styles.selectedHint}>pick 2 coins below</Text>
				) : (
					<View style={styles.chipsRow}>
						{selected.map(id => (
							<View key={id} style={styles.chip}>
								<Text style={styles.chipText}>{id}</Text>
								<TouchableOpacity onPress={() => toggleSelect(id)} style={styles.chipX}>
									<Text style={{ fontWeight: '700' }}>×</Text>
								</TouchableOpacity>
							</View>
						))}
						<TouchableOpacity onPress={clearSelection} style={styles.clearBtn}>
							<Text style={styles.clearBtnText}>Clear</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>

			{/* Szukajka */}
			<TextInput
				placeholder='Search coin (id/symbol/name)…'
				placeholderTextColor='#999'
				style={styles.search}
				value={query}
				onChangeText={setQuery}
			/>

			{isLoading && <ActivityIndicator />}
			{error && <Text style={styles.error}>{error}</Text>}

			{/* LISTA — 1 kolumna jak na dashboardzie */}
			<FlatList
				data={filtered}
				key='one-column'
				numColumns={1}
				keyExtractor={item => item.id}
				contentContainerStyle={{ paddingBottom: 12 }}
				renderItem={({ item }) => {
					const active = selected.includes(item.id)
					const disabled = !active && selected.length >= 2
					return (
						<CoinItem
							item={item}
							onPress={() => !disabled && toggleSelect(item.id)}
							containerStyle={[styles.itemWrapper, active && styles.itemSelected, disabled && styles.itemDisabled]}
						/>
					)
				}}
			/>

			{/* Pasek opcji: tryb wykresu + zakres dni */}
			<View style={styles.controlsRow}>
				{/* Przełącznik trybu wykresu */}
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<Text style={styles.switchText}>{mode === 'pct' ? 'Tryb: %' : 'Tryb: USD'}</Text>
					<TouchableOpacity
						onPress={() => setMode(m => (m === 'pct' ? 'nominal' : 'pct'))}
						style={[styles.switchBtn, { backgroundColor: mode === 'pct' ? '#3b82f6' : '#ef4444' }]}>
						<Text style={{ color: '#fff', fontWeight: '600' }}>{mode === 'pct' ? 'USD' : '%'}</Text>
					</TouchableOpacity>
				</View>

				{/* Selektor zakresu dni (pigułki) */}
				<View style={styles.rangeRow}>
					{RANGES.map(r => (
						<TouchableOpacity
							key={r.days}
							onPress={() => setDays(r.days)}
							style={[styles.rangePill, days === r.days && styles.rangePillActive]}>
							<Text style={[styles.rangeText, days === r.days && styles.rangeTextActive]}>{r.label}</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Wykres — jedna oś Y */}
			{canCompare ? (
				<View style={styles.chartContainer}>
					{loadingChart ? (
						<ActivityIndicator />
					) : (
						<CompareChart
							nameA={coinA.toUpperCase()}
							nameB={coinB.toUpperCase()}
							dataA={seriesA}
							dataB={seriesB}
							mode={mode}
						/>
					)}
					{errChart && <Text style={styles.error}>Chart: {String(errChart)}</Text>}
				</View>
			) : (
				<Text style={styles.hint}>Select exactly 2 coins to show the chart.</Text>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 },
	header: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#111' },

	selectedBar: { marginBottom: 8 },
	selectedLabel: { fontWeight: '600', color: '#111' },
	selectedHint: { color: '#6b7280' },
	chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#eef2ff',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	chipText: { color: '#111' },
	chipX: { marginLeft: 6 },
	clearBtn: { backgroundColor: '#f3f4f6', borderRadius: 999, paddingHorizontal: 10, justifyContent: 'center' },
	clearBtnText: { color: '#111', fontWeight: '600' },

	search: {
		backgroundColor: '#f3f4f6',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		color: '#111',
		marginBottom: 8,
	},

	error: { color: 'red', textAlign: 'center', marginVertical: 4 },

	itemWrapper: { borderBottomWidth: 1, borderColor: '#eee' },
	itemSelected: { backgroundColor: '#eff6ff' },
	itemDisabled: { opacity: 0.5 },

	controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },

	switchText: { color: '#111', fontWeight: '500' },
	switchBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },

	rangeRow: { flexDirection: 'row', gap: 6 },
	rangePill: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
	rangePillActive: { backgroundColor: '#111', borderColor: '#111' },
	rangeText: { color: '#111', fontSize: 12, fontWeight: '600' },
	rangeTextActive: { color: '#fff' },

	chartContainer: { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 4 },

	hint: { textAlign: 'center', color: '#6b7280', marginTop: 8 },
})
