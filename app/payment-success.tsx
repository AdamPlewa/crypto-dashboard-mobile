import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../src/lib/firebase';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState('Verifying payment...');

  useEffect(() => {
    const activateSubscription = async () => {
      if (!user?.uid) {
        setStatus('Error: No user found.');
        return;
      }

      try {
        setStatus('Activating Premium...');
        // W prawdziwej aplikacji to powinno dziać się po stronie serwera (Webhook)
        // Ale na potrzeby projektu studenckiego, robimy to po powrocie do aplikacji
        await updateDoc(doc(db, 'users', user.uid), {
          isSubscribed: true,
          subscriptionPlan: 'monthly', // domyślnie
          subscriptionStart: new Date(),
        });

        setStatus('Success! Redirecting...');
        setTimeout(() => {
            // Wracamy do profilu
            router.replace('/(tabs)/profile');
        }, 2000);

      } catch (error) {
        console.error(error);
        setStatus('Error activating subscription.');
      }
    };

    activateSubscription();
  }, [user]);

  return (
    <View style={styles.container}>
      <IconSymbol name="star.fill" size={80} color="#FBBF24" />
      <Text style={styles.title}>Płatność Zakończona!</Text>
      <Text style={styles.status}>{status}</Text>
      <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
    color: '#111',
  },
  status: {
    fontSize: 16,
    color: '#666',
  },
});
