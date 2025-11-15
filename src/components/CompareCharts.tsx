// src/components/CompareChart.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

type Point = { x: Date; y: number }
type Mode = 'pct' | 'nominal'

type Props = {
  nameA: string
  nameB: string
  dataA: Point[] | null
  dataB: Point[] | null
  mode?: Mode 
  minHeight?: number
  maxHeight?: number
  percentClamp?: number | null
  percentileClip?: number | null
  maxRange?: number | null
  debug?: boolean
  maxPointsOverride?: number | null
}

const DEFAULT_HEIGHT = 420
const PADDING_HORIZONTAL = 12
const Y_AXIS_WIDTH = 56 // szerokość kolumny na etykiety Y

export function CompareChart({
  nameA,
  nameB,
  dataA,
  dataB,
  mode = 'pct',
  minHeight = DEFAULT_HEIGHT,
  maxHeight,
  percentClamp = 200,
  percentileClip = 0.025,
  maxRange = null,
  debug = false,
  maxPointsOverride = null,
}: Props) {
  const { width } = useWindowDimensions()
  const totalWidth = Math.max(320, width - 32)
  const svgWidth = Math.max(160, totalWidth - Y_AXIS_WIDTH)
  const chartHeight = Math.min(Math.max(180, minHeight), maxHeight ?? 2000)

  const fade = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start()
  }, [fade])

  const processed = useMemo(() => {
    if (!dataA || !dataB || dataA.length === 0 || dataB.length === 0) return null
    const minLen = Math.min(dataA.length, dataB.length)
    const Araw = dataA.slice(-minLen)
    const Braw = dataB.slice(-minLen)
    if (minLen === 0) return null

    const toPct = (arr: Point[]) => {
      const base = arr[0]?.y ?? 1
      return arr.map(p => ({ x: p.x, y: ((p.y - base) / base) * 100 }))
    }
    const clampArr = (arr: Point[], clampVal: number) =>
      arr.map(p => ({ ...p, y: Math.max(-clampVal, Math.min(clampVal, p.y)) }))

    let A = mode === 'pct' ? toPct(Araw) : Araw.map(p => ({ ...p }))
    let B = mode === 'pct' ? toPct(Braw) : Braw.map(p => ({ ...p }))

    if (percentClamp && Number.isFinite(percentClamp) && mode === 'pct') {
      const c = Number(percentClamp)
      A = clampArr(A, c)
      B = clampArr(B, c)
    }

    return buildProcessedSVG(
      A,
      B,
      mode === 'pct' ? 'pct' : 'usd',
      nameA,
      nameB,
      percentileClip,
      svgWidth,
      chartHeight,
      maxRange,
      debug,
      maxPointsOverride
    )
  }, [dataA, dataB, mode, nameA, nameB, percentClamp, percentileClip, svgWidth, chartHeight, maxRange, debug, maxPointsOverride])

  const [tip, setTip] = useState<{ x: number; y: number; date?: Date; a?: number; b?: number } | null>(null)

  if (!processed) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    )
  }

  const { pointsA, pointsB, minY, maxY, xLabels, baselineY, pathA, pathB, meta } = processed

  const onTouch = (evt: any) => {
    try {
      const pageX = evt.nativeEvent.locationX - Y_AXIS_WIDTH
      const pts = pointsA.length >= pointsB.length ? pointsA : pointsB
      if (!pts || pts.length === 0) return
      let nearest = 0
      let bestDist = Infinity
      for (let i = 0; i < pts.length; i++) {
        const d = Math.abs(pts[i].x - pageX)
        if (d < bestDist) {
          bestDist = d
          nearest = i
        }
      }
      const aPt = pointsA[nearest]
      const bPt = pointsB[nearest]
      setTip({ x: ((aPt?.x ?? bPt?.x) || pageX) + Y_AXIS_WIDTH, y: ((aPt?.y ?? bPt?.y) || baselineY), date: aPt?.d ?? bPt?.d, a: aPt?.v, b: bPt?.v })
    } catch (e) {
      // ignore
    }
  }
  const clearTip = () => setTip(null)

  const ticks = useMemo(() => {
    const n = 4
    const step = (maxY - minY) / n
    const arr: number[] = []
    for (let i = 0; i <= n; i++) {
      arr.push(minY + step * i)
    }
    return arr.reverse()
  }, [minY, maxY])

  return (
    <View style={[styles.wrapper, { height: chartHeight + 48 }]}>
      <View style={styles.legendRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LegendDot color="#3b82f6" /><Text style={styles.legendText}>{nameA} ({mode === 'pct' ? '% zm.' : 'USD'})</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LegendDot color="#ef4444" /><Text style={styles.legendText}>{nameB} ({mode === 'pct' ? '% zm.' : 'USD'})</Text>
        </View>
      </View>

      <View
        style={{ flexDirection: 'row', paddingHorizontal: 0 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onTouch}
        onResponderMove={onTouch}
        onResponderRelease={clearTip}
      >
        <View style={{ width: Y_AXIS_WIDTH, paddingLeft: 8, paddingRight: 4, justifyContent: 'space-between' }}>
          {ticks.map((t, i) => (
            <Text key={i} style={{ fontSize: 11, color: '#6b7280', textAlign: 'left' }}>
              {mode === 'pct' ? `${t.toFixed(1)}%` : formatCompactY(t)}
            </Text>
          ))}
        </View>

        <View style={{ paddingRight: PADDING_HORIZONTAL }}>
          <Svg width={svgWidth} height={chartHeight}>
            <Line x1={0} x2={svgWidth} y1={baselineY} y2={baselineY} stroke="#e6edf8" strokeWidth={1} />
            {Array.from({ length: 4 }).map((_, i) => {
              const y = (i / 3) * chartHeight
              return <Line key={`g${i}`} x1={0} x2={svgWidth} y1={y} y2={y} stroke="#f3f6fa" strokeWidth={1} />
            })}

            <AnimatedPath d={pathA} stroke="#3b82f6" strokeWidth={2} fill="none" opacity={fade} strokeLinecap="round" strokeLinejoin="round" />
            <AnimatedPath d={pathB} stroke="#ef4444" strokeWidth={2} fill="none" opacity={fade} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingRight: PADDING_HORIZONTAL }}>
            {xLabels.map((t, idx) => <Text key={idx} style={{ fontSize: 11, color: '#6b7280' }}>{t}</Text>)}
          </View>

          {tip && (
            <View style={[styles.tip, { left: Math.max(8, Math.min(svgWidth + Y_AXIS_WIDTH - 152, tip.x - 70)), top: Math.max(8, tip.y - 40) }]}>
              {tip.date && <Text style={styles.tipDate}>{formatShort(tip.date)}</Text>}
              {typeof tip.a === 'number' && <Text style={{ color: '#3b82f6' }}>{nameA}: {formatVal(tip.a, mode)}</Text>}
              {typeof tip.b === 'number' && <Text style={{ color: '#ef4444' }}>{nameB}: {formatVal(tip.b, mode)}</Text>}
            </View>
          )}

          {debug && <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>minY: {minY.toFixed(4)} maxY: {maxY.toFixed(4)} ptsA:{pointsA.length} ptsB:{pointsB.length} meta:{JSON.stringify(meta)}</Text>}
        </View>
      </View>
    </View>
  )
}

const AnimatedPath = Animated.createAnimatedComponent(Path)

/* --- helpers: buildProcessedSVG z upsamplingiem liniowym --- */

function buildProcessedSVG(
  arrA: Point[],
  arrB: Point[],
  kind: 'pct' | 'usd',
  nameA: string,
  nameB: string,
  percentileClip: number | null,
  chartW: number,
  chartH: number,
  maxRange: number | null,
  debug?: boolean,
  maxPointsOverride?: number | null
) {
  // dynamiczny limit punktów: zależny od szerokości (ok. 1 punkt na 1.2 px), z górnym limitem
  const approxPerPixel = 1.2
  const autoMax = Math.min(1600, Math.max(240, Math.round(chartW * approxPerPixel)))
  const maxPoints = maxPointsOverride && Number.isFinite(maxPointsOverride) ? Math.max(60, Math.round(maxPointsOverride)) : autoMax

  // jeśli mamy więcej punktów niż maxPoints, downsample równomiernie
  const downsample = (arr: Point[]) => {
    if (arr.length <= maxPoints) return arr.slice()
    const step = arr.length / maxPoints
    const out: Point[] = []
    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.floor(i * step)
      out.push(arr[idx] ?? arr[arr.length - 1])
    }
    return out
  }

  // upsample liniowy: jeśli arr ma mało punktów, interpolujemy do targetCount
  const upsampleLinear = (arr: Point[], targetCount: number) => {
    if (arr.length >= targetCount) return arr.slice()
    const n = arr.length
    if (n === 0) return []
    if (n === 1) {
      // replicate
      const p = arr[0]
      return Array.from({ length: targetCount }).map((_, i) => ({ x: new Date(+p.x + i), y: p.y }))
    }
    const out: Point[] = []
    const lastIdx = n - 1
    for (let i = 0; i < targetCount; i++) {
      const t = (i / (targetCount - 1)) * lastIdx
      const lo = Math.floor(t)
      const hi = Math.min(lastIdx, lo + 1)
      const frac = t - lo
      const p0 = arr[lo]
      const p1 = arr[hi]
      // linear interp for value and timestamp
      const y = Number.isFinite(p0.y) && Number.isFinite(p1.y) ? p0.y * (1 - frac) + p1.y * frac : (Number.isFinite(p0.y) ? p0.y : p1.y)
      const ts0 = p0.x.getTime()
      const ts1 = p1.x.getTime()
      const ts = Math.round(ts0 * (1 - frac) + ts1 * frac)
      out.push({ x: new Date(ts), y })
    }
    return out
  }

  let A = downsample(arrA)
  let B = downsample(arrB)

  // jeśli po downsample mamy mało punktów (< ~chartW/4), spróbuj upsamplować do przyzwoitej liczby
  const minDesired = Math.min(maxPoints, Math.max(60, Math.round(chartW / 2)))
  if (A.length < minDesired) A = upsampleLinear(A, minDesired)
  if (B.length < minDesired) B = upsampleLinear(B, minDesired)

  const vals = [...A.map(p => p.y), ...B.map(p => p.y)].filter(Number.isFinite)
  if (vals.length === 0) return { pathA: '', pathB: '', pointsA: [], pointsB: [], minY: 0, maxY: 1, xLabels: [], baselineY: chartH / 2, meta: {} }

  let minY = Math.min(...vals)
  let maxY = Math.max(...vals)
  if (percentileClip && percentileClip > 0 && percentileClip < 0.49) {
    const lowP = quantile(vals, percentileClip)
    const highP = quantile(vals, 1 - percentileClip)
    if (Number.isFinite(lowP) && Number.isFinite(highP) && highP > lowP) {
      minY = lowP
      maxY = highP
    }
  }

  const baseline = kind === 'pct' ? 0 : median(vals)
  let below = baseline - minY
  let above = maxY - baseline
  let half = Math.max(below, above)
  if (!Number.isFinite(half) || half <= 0) half = Math.abs(baseline) * 0.05 || 1

  if (maxRange && Number.isFinite(maxRange) && maxRange > 0) {
    const maxHalf = maxRange / 2
    if (half > maxHalf) half = maxHalf
  }

  half = half * 1.05
  const domainMin = baseline - half
  const domainMax = baseline + half

  const valueToY = (v: number) => {
    const t = (v - domainMin) / (domainMax - domainMin)
    return Math.max(0, Math.min(chartH, chartH - t * chartH))
  }

  const count = Math.max(A.length, B.length, 1)
  const usableW = chartW - PADDING_HORIZONTAL * 2
  const xForIndex = (i: number) => PADDING_HORIZONTAL + (usableW * (i / Math.max(1, count - 1)))

  const buildPoints = (arr: Point[]) => {
    const pts: { x: number; y: number; v: number; d?: Date }[] = []
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i].y
      const x = xForIndex(i)
      if (!Number.isFinite(v)) {
        pts.push({ x, y: valueToY(domainMin), v: NaN, d: arr[i]?.x })
        continue
      }
      const y = valueToY(v)
      pts.push({ x, y, v, d: arr[i]?.x })
    }
    return pts
  }

  const ptsA = buildPoints(A)
  const ptsB = buildPoints(B)

  const pathOf = (pts: { x: number; y: number }[]) => {
    let d = ''
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      if (!p) continue
      if (d === '') d = `M ${p.x} ${p.y}`
      else d += ` L ${p.x} ${p.y}`
    }
    return d
  }

  const pathA = pathOf(ptsA)
  const pathB = pathOf(ptsB)

  const labelsCount = Math.min(5, Math.max(2, Math.ceil(count / Math.ceil(count / 4))))
  const xLabels: string[] = []
  for (let i = 0; i < labelsCount; i++) {
    const idx = Math.floor((i / (labelsCount - 1)) * (count - 1))
    const d = (A[idx]?.x ?? B[idx]?.x ?? new Date()) as Date
    xLabels.push(formatXLabel(new Date(d), A[0]?.x, A[A.length - 1]?.x))
  }

  const baselineY = valueToY(baseline)
  const meta = { origA: arrA.length, origB: arrB.length, usedA: A.length, usedB: B.length, maxPoints }
  return { pathA, pathB, pointsA: ptsA, pointsB: ptsB, minY: domainMin, maxY: domainMax, xLabels, baselineY, meta }
}

/* helpers */
function quantile(arr: number[], q: number) {
  const s = arr.slice().sort((a, b) => a - b)
  const idx = (s.length - 1) * q
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  if (lo === hi) return s[lo]
  const frac = idx - lo
  return s[lo] * (1 - frac) + s[hi] * frac
}
function median(arr: number[]) {
  if (!arr || arr.length === 0) return 0
  const s = arr.slice().sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2
}
function formatXLabel(d: Date, start?: Date, end?: Date) {
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
function formatVal(v: number, mode: Mode) {
  if (!Number.isFinite(v)) return '-'
  if (mode === 'pct') return `${v.toFixed(2)}%`
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return '$' + (v / 1_000_000_000).toFixed(2) + 'B'
  if (abs >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000) return '$' + (v / 1_000).toFixed(2) + 'K'
  return '$' + v.toFixed(2)
}
function formatCompactY(n: number) {
  if (!Number.isFinite(n)) return ''
  if (Math.abs(n) >= 1000) return (n >= 0 ? '' : '-') + Math.abs(n).toFixed(0)
  if (Math.abs(n) >= 1) return n.toFixed(2)
  return n.toFixed(4)
}
function formatShort(d: Date) {
  return `${shortDate(d)} ${timeHM(d)}`
}
function LegendDot({ color }: { color: string }) {
  return <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: color, marginRight: 6 }} />
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 10, paddingTop: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6, alignItems: 'center' },
  legendText: { marginRight: 8 },
  loading: { padding: 16, alignItems: 'center' },
  tip: { position: 'absolute', zIndex: 40, width: 144, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  tipDate: { fontWeight: '700', marginBottom: 4 },
})
