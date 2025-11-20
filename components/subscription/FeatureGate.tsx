// components/subscription/FeatureGate.tsx
import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../../hooks/useSubscription';
import type { SubscriptionPlanId } from '../../constants/subscription';

type Props = {
  minPlan: SubscriptionPlanId;
  children: React.ReactNode;
};

export default function FeatureGate({ minPlan, children }: Props) {
  const { isLoading, isActive, hasPlan } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isActive || !hasPlan(minPlan)) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedTitle}>Funkcja premium</Text>
        <Text style={styles.lockedText}>
          Ta sekcja jest dostępna w planie {minPlan.toUpperCase()}.
        </Text>
        <Pressable style={styles.button} onPress={() => router.push('/paywall')}>
          <Text style={styles.buttonText}>Zobacz plany</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginVertical: 8,
  },
  lockedTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  lockedText: {
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#888',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
