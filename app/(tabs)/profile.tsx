// app/(tabs)/profile.tsx
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { doc, updateDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../src/context/AuthContext'
import { db } from '../../src/lib/firebase'

// --- KONFIGURACJA STRIPE ---
// Linki do Twoich produktów w Stripe (Test Mode)
const STRIPE_LINK_MONTHLY = 'https://buy.stripe.com/test_7sYfZbe6Y1tn9Xh1815Rm00'
const STRIPE_LINK_YEARLY = 'https://buy.stripe.com/test_28EcMZ2ogfkd3yT2c55Rm01'

export default function ProfileScreen() {
  const { user, signOutUser, loading } = useAuth()
  const router = useRouter()
  const isDark = useColorScheme() === 'dark'
  const [buying, setBuying] = useState(false)

  const styles = getStyles(isDark)

  // Wygeneruj URL przekierowania dla Twojego środowiska (Expo Go / Build)
  const redirectUrl = Linking.createURL('payment-success');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(tabs)/login')
    }
    // Logujemy URL, żebyś mógł go skopiować do Stripe Dashboard
    console.log('[STRIPE CONFIG] Twój URL przekierowania to:', redirectUrl);
  }, [user, loading, router])

  const handleStripePurchase = async (link) => {
    if (link.includes('test_...') || link.endsWith('...')) {
        Alert.alert('Konfiguracja', 'Błędny link do Stripe.');
        return;
    }

    // Informacja dla Ciebie (Developera)
    console.log('Otwieram płatność. Pamiętaj, aby w Stripe Dashboard w "Payment Link" -> "After payment" ustawić:');
    console.log('Redirect URL:', redirectUrl);
    
    try {
        // Otwieramy przeglądarkę systemową (Chrome Custom Tabs)
        await WebBrowser.openBrowserAsync(link);
        // Aplikacja czeka w tle. Gdy użytkownik zapłaci i Stripe go przekieruje,
        // system operacyjny otworzy aplikację na ekranie /payment-success.
    } catch (e) {
        Alert.alert('Błąd', 'Nie udało się otworzyć płatności.');
    }
  }

  // --- STARE METODY DO ANULOWANIA ---
  const handleCancelSub = async () => {
    if (!user?.uid) return
    Alert.alert('Anulowanie', 'Czy na pewno chcesz anulować subskrypcję?', [
        { text: 'Nie', style: 'cancel' },
        { 
            text: 'Tak, anuluj', 
            style: 'destructive',
            onPress: async () => {
                setBuying(true)
                try {
                    await updateDoc(doc(db, 'users', user.uid), {
                        isSubscribed: false
                    })
                    Alert.alert('Anulowano', 'Twoja subskrypcja została anulowana.')
                } catch (e) {
                    Alert.alert('Błąd', 'Nie udało się anulować.')
                } finally {
                    setBuying(false)
                }
            }
        }
    ])
  }

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>
  if (!user) return null

  const isSubscribed = user.isSubscribed

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Mój profil</Text>

      {/* Sekcja Danych */}
      <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email ?? '—'}</Text>
          
          <View style={{ height: 10 }} />
          
          <Text style={styles.label}>Status konta</Text>
          <View style={[styles.badge, { backgroundColor: isSubscribed ? '#10b981' : '#6b7280' }]}>
            <Text style={styles.badgeText}>{isSubscribed ? 'PREMIUM AKTYWNE' : 'DARMOWE'}</Text>
          </View>
      </View>

      {/* Sekcja Subskrypcji */}
      <Text style={styles.sectionHeader}>Subskrypcja</Text>
      
      {isSubscribed ? (
        <View style={styles.card}>
            <Text style={styles.infoText}>Masz aktywny dostęp do porównywarki kryptowalut i innych funkcji Premium.</Text>
            <View style={{ marginTop: 15 }}>
                <Button title="Anuluj subskrypcję" color="#ef4444" onPress={handleCancelSub} disabled={buying} />
            </View>
        </View>
      ) : (
        <View style={{ gap: 15 }}>
            {/* Karta Miesięczna */}
            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Miesięczna</Text>
                    <Text style={styles.planPrice}>24 PLN</Text>
                </View>
                <Text style={styles.planDesc}>Pełny dostęp na 30 dni.</Text>
                
                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: '#5b21b6' }]} 
                    onPress={() => handleStripePurchase(STRIPE_LINK_MONTHLY)}
                >
                    <Text style={styles.btnText}>Kup przez Stripe</Text>
                </TouchableOpacity>
            </View>

            {/* Karta Roczna */}
            <View style={[styles.planCard, styles.planCardRecommended]}>
                <View style={styles.promoTag}>
                    <Text style={styles.promoText}>2 MIESIĄCE GRATIS</Text>
                </View>
                <View style={styles.planHeader}>
                    <Text style={[styles.planTitle, { color: '#fff' }]}>Roczna</Text>
                    <Text style={[styles.planPrice, { color: '#fff' }]}>240 PLN</Text>
                </View>
                <Text style={[styles.planDesc, { color: '#e5e7eb' }]}>Płacisz tylko za 10 miesięcy.</Text>
                
                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: '#fff' }]} 
                    onPress={() => handleStripePurchase(STRIPE_LINK_YEARLY)}
                >
                    <Text style={[styles.btnText, { color: '#2563EB' }]}>Kup przez Stripe</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}

      <View style={{ marginTop: 30 }}>
        <Button
            title="Wyloguj się"
            color={isDark ? '#444' : '#666'}
            onPress={async () => {
            await signOutUser()
            }}
        />
      </View>
    </ScrollView>
  )
}

const getStyles = (isDark) => StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: isDark ? '#0B0B0B' : '#F9FAFB',
        flexGrow: 1,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        fontSize: 28,
        fontWeight: '800',
        color: isDark ? '#FFF' : '#111',
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
        color: isDark ? '#FFF' : '#111',
        marginTop: 25,
        marginBottom: 10,
    },
    card: {
        backgroundColor: isDark ? '#161616' : '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: isDark ? '#888' : '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: isDark ? '#FFF' : '#111',
        fontWeight: '500',
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 4,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    infoText: {
        color: isDark ? '#CCC' : '#444',
        fontSize: 15,
        lineHeight: 22,
    },
    
    // Plans
    planCard: {
        backgroundColor: isDark ? '#1F1F1F' : '#FFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: isDark ? '#333' : '#E5E7EB',
        position: 'relative',
        overflow: 'hidden',
    },
    planCardRecommended: {
        backgroundColor: '#2563EB', // Blue-600
        borderColor: '#2563EB',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#FFF' : '#111',
    },
    planPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#FFF' : '#111',
    },
    planDesc: {
        fontSize: 14,
        color: isDark ? '#AAA' : '#6B7280',
        marginBottom: 15,
    },
    promoTag: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FBBF24', // Amber-400
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 10,
    },
    promoText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#111',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    btn: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10
    },
    btnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    }
})
