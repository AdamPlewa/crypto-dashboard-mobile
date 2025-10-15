// app/coin/[id].tsx
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import Coin from '../../src/screens/Coin'; // z app/coin/[id].tsx -> ../../src/screens/Coin

export default function CoinWrapper() {
  const params = useLocalSearchParams();
  const { id } = params as { id: string };

  return <Coin route={{ params: { id } }} />;
}
