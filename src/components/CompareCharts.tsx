// src/components/CompareChart.tsx
import React, { useMemo } from 'react'
import { ActivityIndicator, useWindowDimensions, View } from 'react-native'
import {
	VictoryAxis,
	VictoryChart,
	VictoryLabel,
	VictoryLegend,
	VictoryLine,
	VictoryTooltip,
	VictoryVoronoiContainer,
} from 'victory-native'

type Point = { x: Date; y: number }
type Mode = 'pct' | 'nominal'

export function CompareChart({
	nameA,
	nameB,
	dataA,
	dataB,
	mode = 'pct',
}: {
	nameA: string
	nameB: string
	dataA: Point[] | null
	dataB: Point[] | null
	mode?: Mode
}) {
	const { width } = useWindowDimensions()
	const chartWidth = Math.max(320, width - 24)
	const padding = { top: 24, right: 24, bottom: 36, left: 56 }

	if (!dataA || !dataB) {
		return (
			<View style={{ padding: 16, alignItems: 'center' }}>
				<ActivityIndicator />
			</View>
		)
	}

	// zrównaj długości serii
	const minLen = Math.min(dataA.length, dataB.length)
	const a0 = dataA.slice(-minLen)
	const b0 = dataB.slice(-minLen)

	// przygotuj serie pod wybrany tryb + formatery
	const { A, B, yTickFormat, tooltipFmt } = useMemo(() => {
		if (mode === 'pct') {
			const toPct = (arr: Point[]) => {
				const base = arr[0]?.y ?? 1
				return arr.map(p => ({ x: p.x, y: ((p.y - base) / base) * 100 }))
			}
			return {
				A: toPct(a0),
				B: toPct(b0),
				yTickFormat: (t: number) => `${to2(t)}%`,
				tooltipFmt: (v: number) => `${to2(v)}%`,
			}
		}

		// nominal – wspólna oś; wartości bezpośrednio z serii
		return {
			A: a0,
			B: b0,
			yTickFormat: (t: number) => formatCompact2(t),
			tooltipFmt: (v: number) => formatCompact2(v),
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, JSON.stringify(a0), JSON.stringify(b0)])

	// mniej etykiet na osi X (zależnie od szerokości)
	const xTickCount = chartWidth < 360 ? 3 : chartWidth < 420 ? 4 : 5
	const xTickFormat = (d: Date) => formatXAxis(d, A[0]?.x, A[A.length - 1]?.x)

	return (
		<VictoryChart
			width={chartWidth}
			height={320}
			scale={{ x: 'time' }}
			padding={padding}
			containerComponent={
				<VictoryVoronoiContainer
					labels={({ datum }: any) => `${compactDateTime(new Date(datum.x))}\n${datum.series}: ${tooltipFmt(datum.y)}`}
					labelComponent={<VictoryTooltip constrainToVisibleArea />}
				/>
			}>
			<VictoryLegend
				x={padding.left}
				y={0}
				orientation='horizontal'
				gutter={24}
				title={undefined} // zabezpieczenie przed titleComponent undefined
				titleComponent={<VictoryLabel />}
				data={[
					{ name: nameA, symbol: { fill: '#3b82f6' } },
					{ name: nameB, symbol: { fill: '#ef4444' } },
				]}
			/>

			{/* Oś X – mniej ticków + kompaktowy format */}
			<VictoryAxis
				tickCount={xTickCount}
				tickFormat={xTickFormat as any}
				style={{
					tickLabels: { fontSize: 10, padding: 6 }, // mniejsze napisy na małych ekranach
				}}
			/>

			{/* Jedna oś Y */}
			<VictoryAxis dependentAxis tickFormat={yTickFormat as any} style={{ tickLabels: { fontSize: 10, padding: 4 } }} />

			{/* Linie */}
			<VictoryLine
				data={A.map(p => ({ ...p, series: nameA }))}
				style={{ data: { stroke: '#3b82f6', strokeWidth: 2 } }}
				interpolation='monotoneX'
			/>
			<VictoryLine
				data={B.map(p => ({ ...p, series: nameB }))}
				style={{ data: { stroke: '#ef4444', strokeWidth: 2 } }}
				interpolation='monotoneX'
			/>
		</VictoryChart>
	)
}

/* ===== Helpers ===== */

function to2(n: number) {
	return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

function formatCompact2(n: number) {
	const abs = Math.abs(n)
	if (!Number.isFinite(n)) return '$0.00'
	if (abs >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B'
	if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
	if (abs >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K'
	return '$' + n.toFixed(2)
}

// kompaktowe etykiety X: dla krótkich zakresów pokazuj godzinę, dla dłuższych – datę
function formatXAxis(d: Date, start?: Date, end?: Date) {
	if (!start || !end) return shortDate(d)
	const spanMs = end.getTime() - start.getTime()
	const oneDay = 24 * 60 * 60 * 1000
	if (spanMs <= oneDay * 2) {
		// zakres do ~2 dni → pokazuj godzinę
		return timeHM(d)
	}
	// dłuższe zakresy → pokazuj datę "dd.MM"
	return shortDate(d)
}

function shortDate(d: Date) {
	// "dd.MM" – krótkie i czytelne
	const dd = String(d.getDate()).padStart(2, '0')
	const mm = String(d.getMonth() + 1).padStart(2, '0')
	return `${dd}.${mm}`
}
function timeHM(d: Date) {
	const hh = String(d.getHours()).padStart(2, '0')
	const mm = String(d.getMinutes()).padStart(2, '0')
	return `${hh}:${mm}`
}
function compactDateTime(d: Date) {
	// używane w tooltipach
	return `${shortDate(d)} ${timeHM(d)}`
}
