import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';


export default function CoinItem({ item, onPress }) {
return (
<Pressable onPress={() => onPress(item.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
<View style={styles.row}>
{item.image ? <Image source={{ uri: item.image }} style={styles.icon} /> : null}
<View style={{ flex: 1 }}>
<Text style={styles.name}>{item.name}</Text>
<Text style={styles.symbol}>{item.symbol.toUpperCase()}</Text>
</View>
<View style={{ alignItems: 'flex-end' }}>
<Text style={styles.price}>{item.current_price} USD</Text>
<Text style={[styles.change, item.price_change_percentage_24h >= 0 ? styles.up : styles.down]}>
{item.price_change_percentage_24h?.toFixed(2)}%
</Text>
</View>
</View>
</Pressable>
);
}


const styles = StyleSheet.create({
card: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
pressed: { opacity: 0.7 },
row: { flexDirection: 'row', alignItems: 'center' },
icon: { width: 36, height: 36, marginRight: 12 },
name: { fontSize: 16, fontWeight: '600' },
symbol: { fontSize: 12, color: '#666' },
price: { fontSize: 14, fontWeight: '600' },
change: { fontSize: 12 },
up: { color: 'green' },
down: { color: 'red' },
});