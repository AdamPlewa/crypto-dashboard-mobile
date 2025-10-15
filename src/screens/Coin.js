import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { fetchCoinDetails } from '../services/api';


export default function Coin({ route }) {
const { id } = route.params;
const [coin, setCoin] = useState(null);
const [loading, setLoading] = useState(false);


useEffect(() => {
load();
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
<Text>Market cap rank: {coin.market_cap_rank}</Text>
<View style={{height: 16}} />
<Text style={styles.sectionTitle}>Opis</Text>
<Text>{coin.description?.en ? coin.description.en.replace(/(<([^>]+)>)/gi, '') : 'Brak opisu'}</Text>
</ScrollView>
);
}


const styles = StyleSheet.create({
container: { flex: 1, padding: 16, backgroundColor: '#fff' },
center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
});