// app/paywall.tsx
import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../hooks/useSubscription';
import { PLAN_FEATURES } from '../constants/subscription';

export default function PaywallScreen() {
  const router = useRouter();
  const { subscription } = useSubscription();

  const handleBuyPro = () => {
    // TODO: tutaj później podłączymy Stripe / Firebase Functions
    console.log('Kliknięto: Kup PRO (tu podłączymy płatność)');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Odblokuj plan PRO</Text>

      <Text style={styles.current}>
        Twój obecny plan: <Text style={styles.bold}>{subscription.plan.toUpperCase()}</Text>
      </Text>

      <Text style={styles.sectionTitle}>Co daje PRO:</Text>
      {PLAN_FEATURES.pro.map((f) => (
        <Text key={f} style={styles.bullet}>
          • {f}
        </Text>
      ))}

      <Pressable style={styles.button} onPress={handleBuyPro}>
        <Text style={styles.buttonText}>Kup PRO</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryText}>Wróć</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 64,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  current: {
    fontSize: 14,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryText: {
    fontSize: 14,
  },
});
