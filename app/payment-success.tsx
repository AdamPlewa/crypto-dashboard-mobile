import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../src/lib/firebase';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Inicjalizacja...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const activateSubscription = async () => {
      // Jeśli auth się ładuje, czekamy
      if (loading) {
        if(mounted) setStatus('Ładowanie sesji użytkownika...');
        return;
      }

      // Jeśli załadowano, ale brak usera -> błąd
      if (!user) {
         if(mounted) {
             setStatus('Błąd: Nie wykryto zalogowanego użytkownika.');
             setIsError(true);
         }
         return; 
      }

      try {
        if(mounted) setStatus('Zapisywanie subskrypcji w bazie...');
        
        const now = new Date();
        const validUntil = new Date();
        validUntil.setMonth(now.getMonth() + 1);

        // Próba aktualizacji dokumentu
        await updateDoc(doc(db, 'users', user.uid), {
          isSubscribed: true,
          subscriptionPlan: 'monthly_stripe',
          subscriptionStart: now,
          subscriptionValidUntil: validUntil,
          updatedAt: now
        });

        if(mounted) setStatus('Sukces! Przekierowanie do profilu...');
        
        setTimeout(() => {
            if(mounted) router.replace('/(tabs)/profile');
        }, 1500);

      } catch (error) {
        console.error("Payment activation error:", error);
        if(mounted) {
            setStatus('Wystąpił błąd zapisu w bazie danych.');
            setIsError(true);
        }
      }
    };

    // Uruchamiamy logikę
    activateSubscription();

    return () => { mounted = false; };
  }, [user, loading]);

  const handleManualReturn = () => {
    router.replace('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <IconSymbol name="star.fill" size={80} color={isError ? "#EF4444" : "#FBBF24"} />
      
      <Text style={styles.title}>
        {isError ? 'Coś poszło nie tak' : 'Płatność Zakończona!'}
      </Text>
      
      <Text style={styles.status}>{status}</Text>
      
      {!isError && <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />}

      {/* Przycisk awaryjny - zawsze widoczny po chwili, żeby użytkownik nie utknął */}
      <TouchableOpacity 
        onPress={handleManualReturn}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Wróć do Profilu</Text>
      </TouchableOpacity>
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
    textAlign: 'center',
    marginBottom: 30
  },
  button: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  buttonText: {
    color: '#111',
    fontWeight: '600'
  }
});
