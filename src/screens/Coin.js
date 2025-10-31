import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Button } from 'react-native';
import { fetchCoinDetails, fetchCoinMarketChart } from '../services/api';
import PriceChart from '../components/PriceChart';

export default function Coin({ route }) {
  const { id } = route.params;
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    load();
    loadChart(days);
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
      // res.prices to tablica [ [timestamp, price], ... ]
      setChartData(res.prices || []);
      setDays(d);
    } catch (e) {
      console.error(e);
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{coin.name} ({coin.symbol.toUpperCase()})</Text>
      <Text>Current price: {coin.market_data?.current_price?.usd ?? 'N/A'} USD</Text>

      <View style={{ height: 12 }} />

      <View style={styles.periodButtons}>
        <Button title="1D" onPress={() => loadChart(1)} />
        <Button title="7D" onPress={() => loadChart(7)} />
        <Button title="30D" onPress={() => loadChart(30)} />
        <Button title="90D" onPress={() => loadChart(90)} />
      </View>

      {chartLoading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <PriceChart data={chartData} color="#0ea5a4" />
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
  periodButtons: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }
});
