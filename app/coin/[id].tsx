// app/coin/[id].tsx
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import Coin from '../../src/screens/Coin'; // z app/coin/[id].tsx -> ../../src/screens/Coin

export default function CoinWrapper() {
  const params = useLocalSearchParams();
  const { id } = params as { id: string };
  const navigation = useNavigation();

  // ustaw bez tytułu (usuwa pokazanie "coin/[id]" w headerze/back)
  useEffect(() => {
    try {
      // @ts-ignore - expo-router navigation.setOptions exists
      navigation.setOptions({ title: '' });
    } catch (e) {
      // ignore
    }
  }, [navigation]);

  return <Coin route={{ params: { id } }} />;
}
