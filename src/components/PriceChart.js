import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pomocnicza funkcja formatująca daty (miesiąc/dzień)
function formatDateLabel(d) {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function PriceChart({ data = [], color = '#4f46e5' }) {
  // Przyjmujemy format: [[timestamp_ms, price], ...] lub [{x: Date|number, y: number}, ...]
  const formatted = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((p) => {
      if (Array.isArray(p) && p.length >= 2) {
        const ts = typeof p[0] === 'number' && String(p[0]).length === 10 ? p[0] * 1000 : p[0];
        return { x: new Date(ts), y: p[1] };
      }
      if (p && typeof p === 'object' && 'x' in p && 'y' in p) {
        return { x: p.x instanceof Date ? p.x : new Date(p.x), y: p.y };
      }
      return p;
    });
  }, [data]);

  if (!formatted || formatted.length === 0) {
    return <View style={[styles.container, styles.empty]} />;
  }

  // Dane do chart-kit
  const chartData = {
    labels: formatted.map((d) => formatDateLabel(d.x)),
    datasets: [{ data: formatted.map((d) => d.y) }],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={SCREEN_WIDTH - 24}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 2,
          color: () => color,
          labelColor: () => '#666',
          propsForDots: {
            r: '3',
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
