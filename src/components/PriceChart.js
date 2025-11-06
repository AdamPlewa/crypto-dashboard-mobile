import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pomocnicza funkcja formatująca daty (miesiąc/dzień)
function formatDateLabel(d) {
  const date = new Date(d);
  // MM/DD (krótki) — zmień jeśli chcesz DD/MM
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Zwraca co nth element z tablicy (próbkowanie)
function sampleArray(arr, maxPoints) {
  if (!arr || arr.length <= maxPoints) return arr
  const step = Math.ceil(arr.length / maxPoints)
  return arr.filter((_, i) => i % step === 0)
}

export default function PriceChart({ data = [], color = '#4f46e5', maxXTicks = 6 }) {
  // Przyjmujemy format: [[timestamp_ms, price], ...] lub [{x: Date|number, y: number}, ...]
  const formatted = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((p) => {
      if (Array.isArray(p) && p.length >= 2) {
        // obsłuż timestampy w sekundach (10 cyfr) i ms (13 cyfr)
        const ts = typeof p[0] === 'number' && String(p[0]).length === 10 ? p[0] * 1000 : p[0];
        return { x: new Date(ts), y: Number(p[1] ?? 0) };
      }
      if (p && typeof p === 'object' && ('x' in p) && ('y' in p)) {
        return { x: p.x instanceof Date ? p.x : new Date(p.x), y: Number(p.y ?? 0) };
      }
      return null;
    }).filter(Boolean);
  }, [data]);

  if (!formatted || formatted.length === 0) {
    return <View style={[styles.container, styles.empty]} />;
  }

  // Przygotuj etykiety: będziemy próbkować, żeby była ich maksymalnie maxXTicks
  const sampled = sampleArray(formatted, maxXTicks);
  const labels = sampled.map(d => formatDateLabel(d.x));
  const dataset = formatted.map(d => Number(d.y ?? 0));

  // jeśli mamy dużo punktów wyłącz rysowanie wszystkich kropek (przyspieszenie + czytelność)
  const showDots = formatted.length <= 60;

  const chartData = {
    labels,
    datasets: [
      {
        data: dataset,
        color: (opacity = 1) => color, // color line
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={SCREEN_WIDTH - 24}
        height={220}
        withDots={showDots}
        withInnerLines={false}
        withOuterLines={false}
        withShadow={true}
        fromZero={false}
        yLabelsOffset={6}
        xLabelsOffset={-6}
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 2,
          color: (opacity = 1) => color,
          labelColor: (opacity = 1) => `rgba(102,102,102, ${opacity})`,
          propsForBackgroundLines: { strokeDasharray: '' },
          propsForDots: {
            r: showDots ? '3' : '0',
            strokeWidth: '1',
            stroke: color,
          },
        }}
        bezier
        style={{ borderRadius: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    backgroundColor: 'transparent',
  },
  empty: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
