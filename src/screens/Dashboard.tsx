// src/screens/Dashboard.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import CoinItem from '../components/CoinItem';
import { fetchMarketData } from '../services/api';

export default function Dashboard() {
  const router = useRouter();

  const [coins, setCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchMarketData();
      setCoins(data);
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      const data = await fetchMarketData();
      setCoins(data);
    } catch (e) {
      console.error('refresh error', e);
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c: any) =>
        c.id?.toLowerCase().includes(q) ||
        c.symbol?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q)
    );
  }, [coins, query]);

  const onPressItem = (id: string) => {
    router.push(`/coin/${id}`);
  };

  if (loading && coins.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Wyszukiwarka jak w Compare */}
      <Text style={styles.header}>Markets</Text>
      <TextInput
        placeholder="Search coin"
        placeholderTextColor="#999"
        style={styles.search}
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <CoinItem item={item} onPress={onPressItem} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={
          <View style={styles.center}>
            {loading ? <ActivityIndicator /> : <Text style={{ color: '#6b7280' }}>No results</Text>}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#111' },
  search: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111',
    marginBottom: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
