// src/components/CompareChart.tsx
import React, { useMemo } from 'react'
import { View, ActivityIndicator, useWindowDimensions, Text } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'

type Point = { x: Date; y: number }
type Mode = 'pct' | 'nominal'

type Props = {
  nameA: string
  nameB: string
  dataA: Point[] | null
  dataB: Point[] | null
  mode?: Mode
}

export function CompareChart({ nameA, nameB, dataA, dataB, mode = 'pct' }: Props) {
  const { width } = useWindowDimensions()
  const chartWidth = Math.max(320, width - 32)

  // 🔹 wszystko w useMemo, bez hooków po early return
  const processed = useMemo(() => {
    if (!dataA || !dataB || dataA.length === 0 || dataB.length === 0) {
      return null
    }

    // wyrównaj długości
    const minLen = Math.min(dataA.length, dataB.length)
    const a0 = dataA.slice(-minLen)
    const b0 = dataB.slice(-minLen)

    if (minLen === 0) return null

    // tryb %
    if (mode === 'pct') {
      const toPct = (arr: Point[]) => {
        const base = arr[0]?.y ?? 1
        return arr.map(p => ({
          x: p.x,
          y: ((p.y - base) / base) * 100,
        }))
      }

      const A = toPct(a0)
      const B = toPct(b0)

      const maxPoints = 120
      const step = Math.max(1, Math.ceil(A.length / maxPoints))
      const xLabelEvery = Math.max(1, Math.floor(A.length / 5))

      const data = mapToChart(A, step, xLabelEvery, 'pct')
      const data2 = mapToChart(B, step, xLabelEvery, 'pct')

      const all = [...data, ...data2].map(d => d.value)
      const { minY, maxY } = computeY(all)

      return {
        data,
        data2,
        minY,
        maxY,
        legendA: `${nameA} (% zm.)`,
        legendB: `${nameB} (% zm.)`,
        formatVal: (v: number) => `${to2(v)}%`,
        mode,
        rawA: A,
        rawB: B,
        step,
      }
    }

    // tryb nominalny (USD)
    const A = a0
    const B = b0

    const maxPoints = 120
    const step = Math.max(1, Math.ceil(A.length / maxPoints))
    const xLabelEvery = Math.max(1, Math.floor(A.length / 5))

    const data = mapToChart(A, step, xLabelEvery, 'usd')
    const data2 = mapToChart(B, step, xLabelEvery, 'usd')

    const all = [...data, ...data2].map(d => d.value)
    const { minY, maxY } = computeY(all)

    return {
      data,
      data2,
      minY,
      maxY,
      legendA: `${nameA} (USD)`,
      legendB: `${nameB} (USD)`,
      formatVal: (v: number) => formatCompact2(v),
      mode,
      rawA: A,
      rawB: B,
      step,
    }
  }, [dataA, dataB, mode, nameA, nameB])

  if (!processed) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  const { data, data2, minY, maxY, legendA, legendB, formatVal, mode: m, rawA, rawB, step } =
    processed

  return (
    <View style={{ padding: 4 }}>
      {/* legenda */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
        <LegendDot color='#3b82f6' />
        <Text>{legendA}</Text>
        <LegendDot color='#ef4444' />
        <Text>{legendB}</Text>
      </View>

      <LineChart
        width={chartWidth}
        height={260}
        data={data}
        data2={data2}
        color='#3b82f6'
        color2='#ef4444'
        hideDataPoints
        thickness={2}
        initialSpacing={12}
        spacing={Math.max(
          6,
          (chartWidth - 40) / Math.min(data.length, 60)
        )}
        maxValue={maxY}
        minValue={minY}
        noOfSections={4}
        hideRules={false}
        rulesColor='#f1f5f9'
        yAxisColor='#e5e7eb'
        xAxisColor='#e5e7eb'
        yAxisThickness={1}
        xAxisThickness={1}
        yAxisTextStyle={{ fontSize: 10 }}
        xAxisLabelTextStyle={{ fontSize: 10 }}
        scrollToEnd={false}
        isAnimated={false}
        pointerConfig={{
          activatePointersOnLongPress: true,
          pointerStripHeight: 220,
          pointerStripColor: '#cbd5f5',
          pointerColor: '#64748b',
          showPointerStrip: true,
          showPointerLabel: true,
          // items: [primaryPoint, secondaryPoint]
          pointerLabelComponent: (items?: any[]) => {
            if (!items || items.length === 0) return null
            const i = items[0]?.index ?? 0
            const realIdx = i * step
            const date =
              rawA[realIdx]?.x ||
              rawB[realIdx]?.x ||
              rawA[rawA.length - 1]?.x ||
              rawB[rawB.length - 1]?.x

            const aVal = items[0]?.value
            const bVal = items[1]?.value

            return (
              <View
                style={{
                  backgroundColor: '#fff',
                  padding: 6,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}>
                {date && (
                  <Text style={{ fontWeight: '700', marginBottom: 2 }}>
                    {compactDateTime(new Date(date))}
                  </Text>
                )}
                {Number.isFinite(aVal) && (
                  <Text style={{ color: '#3b82f6' }}>
                    {nameA}: {formatVal(aVal)}
                  </Text>
                )}
                {Number.isFinite(bVal) && (
                  <Text style={{ color: '#ef4444' }}>
                    {nameB}: {formatVal(bVal)}
                  </Text>
                )}
              </View>
            )
          },
        }}
      />
    </View>
  )
}

/* helpers */

function LegendDot({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: color,
      }}
    />
  )
}

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

function computeY(values: number[]) {
  const finite = values.filter(v => Number.isFinite(v))
  if (!finite.length) return { minY: 0, maxY: 1 }
  let minY = Math.min(...finite)
  let maxY = Math.max(...finite)
  if (minY === maxY) {
    const pad = Math.abs(minY || 1) * 0.05
    minY -= pad
    maxY += pad
  } else {
    const pad = (maxY - minY) * 0.05
    minY -= pad
    maxY += pad
  }
  return { minY, maxY }
}

// buduje punkty dla Gifted Charts z rzadkimi etykietami X
function mapToChart(
  arr: Point[],
  step: number,
  labelEvery: number,
  kind: 'pct' | 'usd'
) {
  return arr
    .filter((_, i) => i % step === 0)
    .map((p, idx) => {
      const showLabel = idx % Math.max(1, Math.floor(labelEvery / step)) === 0
      return {
        value: Number(p.y ?? 0),
        label: showLabel ? xTick(p.x, arr[0].x, arr[arr.length - 1].x) : '',
      }
    })
}

function xTick(d: Date, start?: Date, end?: Date) {
  if (!start || !end) return shortDate(d)
  const span = end.getTime() - start.getTime()
  const twoDays = 2 * 24 * 60 * 60 * 1000
  return span <= twoDays ? timeHM(d) : shortDate(d)
}

function shortDate(d: Date) {
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
  return `${shortDate(d)} ${timeHM(d)}`
}
