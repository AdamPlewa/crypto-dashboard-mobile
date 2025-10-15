// src/screens/Dashboard.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import CoinItem from '../components/CoinItem';
import { fetchMarketData } from '../services/api';

// dodaj import z expo-router
import { useRouter } from 'expo-router';

export default function Dashboard(/* możesz zostawić props, ale nie jest już wymagany */) {
  const router = useRouter(); // <-- tutaj

  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // zamiast navigation.navigate użyj router.push
  const onPressItem = (id) => {
    router.push(`/coin/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={coins}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CoinItem item={item} onPress={onPressItem} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
