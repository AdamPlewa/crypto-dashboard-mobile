// src/components/SinglePriceChart.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

const DEFAULT_HEIGHT = 320;
const PADDING_HORIZONTAL = 12;
const Y_AXIS_WIDTH = 56;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function SinglePriceChart({
  prices = [],               // [[timestamp, price], ...] (CoinGecko)
  minHeight = DEFAULT_HEIGHT,
  color = '#000000',        // czarna linia domyślnie
  mode = 'nominal',         // 'pct' not used by default here, but accepted
  debug = false,
  maxPointsOverride = null,
}) {
  const { width } = useWindowDimensions();
  const totalWidth = Math.max(320, width - 32);
  const svgWidth = Math.max(160, totalWidth - Y_AXIS_WIDTH);
  const chartHeight = Math.max(140, minHeight);

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [fade]);

  const processed = useMemo(() => {
    if (!Array.isArray(prices) || prices.length === 0) return null;

    // convert prices -> Point[] (Date, value)
    const arr = prices.map(p => ({ x: new Date(p[0]), y: Number(p[1]) }));

    // if mode === 'pct' convert to percent changes relative to first
    const pts = mode === 'pct' ? toPct(arr) : arr.map(p => ({ ...p }));

    return buildProcessedSVGSingle(pts, svgWidth, chartHeight, debug, maxPointsOverride);
  }, [prices, mode, svgWidth, chartHeight, debug, maxPointsOverride]);

  const [tip, setTip] = useState(null);

  if (!processed) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: '#6b7280' }}>Brak danych wykresu</Text>
      </View>
    );
  }

  const { path, points, minY, maxY, xLabels, baselineY, meta } = processed;

  const onTouch = (evt) => {
    try {
      const pageX = evt.nativeEvent.locationX - Y_AXIS_WIDTH;
      if (!points || points.length === 0) return;
      let nearest = 0, best = Infinity;
      for (let i = 0; i < points.length; i++) {
        const d = Math.abs(points[i].x - pageX);
        if (d < best) { best = d; nearest = i; }
      }
      const p = points[nearest];
      setTip({ x: p.x + Y_AXIS_WIDTH, y: p.y, date: p.d, v: p.v });
    } catch (e) { /* ignore */ }
  };
  const clearTip = () => setTip(null);

  const ticks = useMemo(() => {
    const n = 4;
    const step = (maxY - minY) / n;
    const arr = [];
    for (let i = 0; i <= n; i++) arr.push(minY + step * i);
    return arr.reverse();
  }, [minY, maxY]);

  return (
    <View style={[styles.wrapper, { height: chartHeight + 48 }]}>
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>{mode === 'pct' ? 'Zmiana (%)' : 'Cena (USD)'}</Text>
      </View>

      <View
        style={{ flexDirection: 'row', paddingHorizontal: 0 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onTouch}
        onResponderMove={onTouch}
        onResponderRelease={clearTip}
      >
        {/* Y axis labels */}
        <View style={{ width: Y_AXIS_WIDTH, paddingLeft: 8, paddingRight: 4, justifyContent: 'space-between' }}>
          {ticks.map((t, i) => (
            <Text key={i} style={{ fontSize: 11, color: '#6b7280', textAlign: 'left' }}>
              {mode === 'pct' ? `${t.toFixed(1)}%` : formatCompactY(t)}
            </Text>
          ))}
        </View>

        <View style={{ paddingRight: PADDING_HORIZONTAL }}>
          <Svg width={svgWidth} height={chartHeight}>
            {/* baseline line */}
            <Line x1={0} x2={svgWidth} y1={baselineY} y2={baselineY} stroke="#e6edf8" strokeWidth={1} />
            {/* horizontal grid */}
            {Array.from({ length: 4 }).map((_, i) => {
              const y = (i / 3) * chartHeight;
              return <Line key={i} x1={0} x2={svgWidth} y1={y} y2={y} stroke="#f3f6fa" strokeWidth={1} />;
            })}

            {/* path */}
            <AnimatedPath d={path} stroke={color} strokeWidth={2} fill="none" opacity={fade} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingRight: PADDING_HORIZONTAL }}>
            {xLabels.map((t, idx) => <Text key={idx} style={{ fontSize: 11, color: '#6b7280' }}>{t}</Text>)}
          </View>

          {tip && (
            <View style={[styles.tip, { left: Math.max(8, Math.min(svgWidth + Y_AXIS_WIDTH - 152, tip.x - 70)), top: Math.max(8, tip.y - 40) }]}>
              {tip.date && <Text style={styles.tipDate}>{formatShort(tip.date)}</Text>}
              <Text style={{ fontWeight: '700' }}>{mode === 'pct' ? `${tip.v.toFixed(2)}%` : formatVal(tip.v)}</Text>
            </View>
          )}

          {debug && <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>meta: {JSON.stringify(meta)}</Text>}
        </View>
      </View>
    </View>
  );
}

/* --- helper: single-series processed SVG (very similar to CompareChart's buildProcessedSVG) --- */

function toPct(arr) {
  const base = arr[0]?.y ?? 1;
  return arr.map(p => ({ x: p.x, y: ((p.y - base) / base) * 100 }));
}

function buildProcessedSVGSingle(arr, chartW, chartH, debug = false, maxPointsOverride = null) {
  const approxPerPixel = 1.2;
  const autoMax = Math.min(1600, Math.max(240, Math.round(chartW * approxPerPixel)));
  const maxPoints = maxPointsOverride && Number.isFinite(maxPointsOverride) ? Math.max(60, Math.round(maxPointsOverride)) : autoMax;

  const downsample = (a) => {
    if (a.length <= maxPoints) return a.slice();
    const step = a.length / maxPoints;
    const out = [];
    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.floor(i * step);
      out.push(a[idx] ?? a[a.length - 1]);
    }
    return out;
  };

  const upsampleLinear = (arr, targetCount) => {
    if (arr.length >= targetCount) return arr.slice();
    const n = arr.length;
    if (n === 0) return [];
    if (n === 1) {
      const p = arr[0];
      return Array.from({ length: targetCount }).map((_, i) => ({ x: new Date(+p.x + i), y: p.y }));
    }
    const out = [];
    const lastIdx = n - 1;
    for (let i = 0; i < targetCount; i++) {
      const t = (i / (targetCount - 1)) * lastIdx;
      const lo = Math.floor(t);
      const hi = Math.min(lastIdx, lo + 1);
      const frac = t - lo;
      const p0 = arr[lo];
      const p1 = arr[hi];
      const y = Number.isFinite(p0.y) && Number.isFinite(p1.y) ? p0.y * (1 - frac) + p1.y * frac : (Number.isFinite(p0.y) ? p0.y : p1.y);
      const ts0 = p0.x.getTime();
      const ts1 = p1.x.getTime();
      const ts = Math.round(ts0 * (1 - frac) + ts1 * frac);
      out.push({ x: new Date(ts), y });
    }
    return out;
  };

  let A = downsample(arr);

  const minDesired = Math.min(maxPoints, Math.max(60, Math.round(chartW / 2)));
  if (A.length < minDesired) A = upsampleLinear(A, minDesired);

  const vals = A.map(p => p.y).filter(Number.isFinite);
  if (vals.length === 0) return { path: '', points: [], minY: 0, maxY: 1, xLabels: [], baselineY: chartH / 2, meta: {} };

  let minY = Math.min(...vals);
  let maxY = Math.max(...vals);

  // center around median (like CompareChart does for USD)
  const baseline = median(vals);
  let below = baseline - minY;
  let above = maxY - baseline;
  let half = Math.max(below, above);
  if (!Number.isFinite(half) || half <= 0) half = Math.abs(baseline) * 0.05 || 1;

  half = half * 1.05;
  const domainMin = baseline - half;
  const domainMax = baseline + half;

  const valueToY = (v) => {
    const t = (v - domainMin) / (domainMax - domainMin);
    return Math.max(0, Math.min(chartH, chartH - t * chartH));
  };

  const count = Math.max(A.length, 1);
  const usableW = chartW - PADDING_HORIZONTAL * 2;
  const xForIndex = (i) => PADDING_HORIZONTAL + (usableW * (i / Math.max(1, count - 1)));

  const pts = [];
  for (let i = 0; i < A.length; i++) {
    const v = A[i].y;
    const x = xForIndex(i);
    const y = Number.isFinite(v) ? valueToY(v) : valueToY(domainMin);
    pts.push({ x, y, v, d: A[i]?.x });
  }

  const pathOf = (ptsArr) => {
    let d = '';
    for (let i = 0; i < ptsArr.length; i++) {
      const p = ptsArr[i];
      if (!p) continue;
      if (d === '') d = `M ${p.x} ${p.y}`;
      else d += ` L ${p.x} ${p.y}`;
    }
    return d;
  };

  const path = pathOf(pts);

  const labelsCount = Math.min(5, Math.max(2, Math.ceil(count / Math.ceil(count / 4))));
  const xLabels = [];
  for (let i = 0; i < labelsCount; i++) {
    const idx = Math.floor((i / (labelsCount - 1)) * (count - 1));
    const d = (A[idx]?.x ?? new Date());
    xLabels.push(formatXLabel(new Date(d), A[0]?.x, A[A.length - 1]?.x));
  }

  const baselineY = valueToY(baseline);
  const meta = { orig: arr.length, used: A.length, maxPoints };
  return { path, points: pts, minY: domainMin, maxY: domainMax, xLabels, baselineY, meta };
}

/* helpers */
function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function formatXLabel(d, start, end) {
  if (!start || !end) return shortDate(d);
  const span = end.getTime() - start.getTime();
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  return span <= twoDays ? timeHM(d) : shortDate(d);
}
function shortDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}
function timeHM(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function formatVal(v) {
  if (!Number.isFinite(v)) return '-';
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return '$' + (v / 1_000_000_000).toFixed(2) + 'B';
  if (abs >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return '$' + (v / 1_000).toFixed(2) + 'K';
  return '$' + v.toFixed(2);
}
function formatCompactY(n) {
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n) >= 1000) return (n >= 0 ? '' : '-') + Math.abs(n).toFixed(0);
  if (Math.abs(n) >= 1) return n.toFixed(2);
  return n.toFixed(4);
}
function formatShort(d) { return `${shortDate(d)} ${timeHM(d)}`; }

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 10, paddingTop: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6, alignItems: 'center' },
  legendText: { marginRight: 8 },
  loading: { padding: 16, alignItems: 'center' },
  tip: { position: 'absolute', zIndex: 40, width: 144, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  tipDate: { fontWeight: '700', marginBottom: 4 },
});

