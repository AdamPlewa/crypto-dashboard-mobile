// src/screens/Coin.js
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SinglePriceChart from '../components/SinglePriceChart';
import { fetchCoinDetails, fetchCoinMarketChart } from '../services/api';

const RANGES = [
  { label: '1D', days: 1 },
  { label: '3D', days: 3 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '90D', days: 90 },
];

export default function Coin({ route }) {
  const { id } = route.params;
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [prices, setPrices] = useState([]); // <-- raw prices from API: [ [ts, price], ... ]
  const [days, setDays] = useState(7);

  useEffect(() => {
    load();
    loadChart(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchCoinDetails(id);
      setCoin(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadChart(d = 7) {
    setChartLoading(true);
    try {
      const res = await fetchCoinMarketChart(id, 'usd', d);
      // res.prices is [[timestamp, price], ...]
      setPrices(res.prices || []);
      setDays(d);
    } catch (e) {
      console.error(e);
      setPrices([]);
    } finally {
      setChartLoading(false);
    }
  }

  if (loading || !coin) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!loading && !coin) {
    return (
      <View style={styles.center}>
        <Text>Nie udało się załadować danych. Spróbuję ponownie później...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{coin.name} ({coin.symbol.toUpperCase()})</Text>
      <Text>Current price: {coin.market_data?.current_price?.usd ?? 'N/A'} USD</Text>

      <View style={{ height: 12 }} />

      <View style={styles.periodButtons}>
        {RANGES.map(r => (
          <TouchableOpacity
            key={r.days}
            onPress={() => loadChart(r.days)}
            style={[styles.rangePill, days === r.days && styles.rangePillActive]}>
            <Text style={[styles.rangeText, days === r.days && styles.rangeTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {chartLoading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        // pass raw prices array that SinglePriceChart expects
        <SinglePriceChart
          prices={prices}
          color="black"
        />
      )}

      <View style={{height: 16}} />

      <Text style={styles.sectionTitle}>Opis</Text>
      <Text>{coin.description?.en ? coin.description.en.replace(/(<([^>]+)>)/gi, '') : 'Brak opisu'}</Text>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  periodButtons: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8, gap: 6 },
  rangePill: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  rangePillActive: { backgroundColor: '#111', borderColor: '#111' },
  rangeText: { color: '#111', fontSize: 12, fontWeight: '600' },
  rangeTextActive: { color: '#fff' },
});