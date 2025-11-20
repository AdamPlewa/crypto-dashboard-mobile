// components/subscription/PlanBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSubscription } from '../../hooks/useSubscription';

export default function PlanBadge() {
  const { subscription } = useSubscription();

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {subscription.plan.toUpperCase()}
        {subscription.status !== 'active' && subscription.plan !== 'free'
          ? ' (nieaktywna)'
          : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#888',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
