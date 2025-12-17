// app/(tabs)/profile.tsx
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useRouter } from 'expo-router'
import { doc, updateDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../src/context/AuthContext'
import { db } from '../../src/lib/firebase'

export default function ProfileScreen() {
  const { user, signOutUser, loading } = useAuth()
  const router = useRouter()
  const isDark = useColorScheme() === 'dark'
  const [buying, setBuying] = useState(false)

  const styles = getStyles(isDark)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(tabs)/login')
    }
  }, [user, loading, router])

  // Symulacja procesu In-App Purchase
  const handlePurchase = async (plan: 'monthly' | 'yearly') => {
    if (!user?.uid) return

    const label = plan === 'monthly' ? 'Miesięczny' : 'Roczny'
    const price = plan === 'monthly' ? '24.00 PLN' : '240.00 PLN'

    // 1. Systemowe okno potwierdzenia (udaje Apple/Google Pay)
    Alert.alert(
        'Potwierdź subskrypcję',
        `Czy chcesz kupić plan ${label} za ${price}?`,
        [
            { text: 'Anuluj', style: 'cancel' },
            { 
                text: 'Kup', 
                style: 'default',
                onPress: () => processTransaction(plan) 
            }
        ]
    )
  }

  const processTransaction = async (plan: 'monthly' | 'yearly') => {
      setBuying(true)
      
      // 2. Symulacja przetwarzania płatności przez sklep (2 sekundy)
      setTimeout(async () => {
          try {
              if (!user?.uid) return

              const now = new Date()
              let validUntil = new Date()

              if (plan === 'monthly') {
                  validUntil.setMonth(now.getMonth() + 1)
              } else {
                  validUntil.setFullYear(now.getFullYear() + 1)
              }

              // 3. Zapisanie uprawnień w bazie danych
              await updateDoc(doc(db, 'users', user.uid), {
                  isSubscribed: true,
                  subscriptionPlan: plan,
                  subscriptionStart: now,
                  subscriptionValidUntil: validUntil
              })

              Alert.alert('Sukces', 'Transakcja zakończona pomyślnie. Masz teraz dostęp Premium!')
          } catch (e) {
              console.error(e)
              Alert.alert('Błąd', 'Transakcja nie powiodła się. Spróbuj ponownie.')
          } finally {
              setBuying(false)
          }
      }, 2000)
  }

  const handleCancelSub = async () => {
    if (!user?.uid) return
    Alert.alert('Anulowanie', 'Czy na pewno chcesz anulować subskrypcję? Utracisz dostęp do funkcji Premium.', [
        { text: 'Wróć', style: 'cancel' },
        { 
            text: 'Potwierdź anulowanie', 
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
            <TouchableOpacity 
                style={styles.planCard} 
                onPress={() => handlePurchase('monthly')}
                disabled={buying}
            >
                <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Miesięczna</Text>
                    <Text style={styles.planPrice}>24 PLN</Text>
                </View>
                <Text style={styles.planDesc}>Pełny dostęp na 30 dni. Płatność co miesiąc.</Text>
                
                <View style={styles.fakeBtn}>
                    <Text style={styles.fakeBtnText}>{buying ? 'Przetwarzanie...' : 'Wybierz plan'}</Text>
                </View>
            </TouchableOpacity>

            {/* Karta Roczna */}
            <TouchableOpacity 
                style={[styles.planCard, styles.planCardRecommended]} 
                onPress={() => handlePurchase('yearly')}
                disabled={buying}
            >
                <View style={styles.promoTag}>
                    <Text style={styles.promoText}>2 MIESIĄCE GRATIS</Text>
                </View>
                <View style={styles.planHeader}>
                    <Text style={[styles.planTitle, { color: '#fff' }]}>Roczna</Text>
                    <Text style={[styles.planPrice, { color: '#fff' }]}>240 PLN</Text>
                </View>
                <Text style={[styles.planDesc, { color: '#e5e7eb' }]}>Płacisz tylko za 10 miesięcy. Dostęp na rok.</Text>
                
                <View style={[styles.fakeBtn, { backgroundColor: '#fff' }]}>
                    <Text style={[styles.fakeBtnText, { color: '#2563EB' }]}>{buying ? 'Przetwarzanie...' : 'Wybierz plan'}</Text>
                </View>
            </TouchableOpacity>
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

const getStyles = (isDark: boolean) => StyleSheet.create({
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
        marginBottom: 10,
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
    fakeBtn: {
        backgroundColor: '#333',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    fakeBtnText: {
        color: '#fff',
        fontWeight: '600',
    }
})
