// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth'
import { auth } from '../lib/firebase'

export type AppUser = {
  id?: string | null
  email?: string | null
  name?: string | null
  photo?: string | null
  provider?: 'firebase' | 'google'
}

type AuthCtx = {
  user: AppUser | null
  loading: boolean
  setAppUser: (u: AppUser | null) => Promise<void>
  signOutUser: () => Promise<void>
}

const KEY = '@app_auth_user_v1'
const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1) najpierw spróbuj nasłuchu firebase (email/password)
    let unsub: (() => void) | undefined
    try {
      unsub = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setUser({
            id: fbUser.uid,
            email: fbUser.email ?? null,
            name: fbUser.displayName ?? null,
            photo: fbUser.photoURL ?? null,
            provider: 'firebase',
          })
          setLoading(false)
          return
        }
        // jeśli brak firebase usera -> fallback do AsyncStorage (np. natywne Google)
        ;(async () => {
          try {
            const raw = await AsyncStorage.getItem(KEY)
            if (raw) setUser(JSON.parse(raw))
            else setUser(null)
          } catch {
            setUser(null)
          } finally {
            setLoading(false)
          }
        })()
      })
    } catch (e) {
      // fallback - odczyt z AsyncStorage
      ;(async () => {
        try {
          const raw = await AsyncStorage.getItem(KEY)
          if (raw) setUser(JSON.parse(raw))
        } catch {}
        setLoading(false)
      })()
    }

    return () => unsub?.()
  }, [])

  const setAppUser = async (u: AppUser | null) => {
    setUser(u)
    try {
      if (u) await AsyncStorage.setItem(KEY, JSON.stringify(u))
      else await AsyncStorage.removeItem(KEY)
    } catch (err) {
      console.warn('AuthContext: AsyncStorage error', err)
    }
  }

  const signOutUser = async () => {
    try {
      // firebase sign out (jeśli był)
      try {
        await firebaseSignOut(auth)
      } catch (e) {
        // ignore
      }

      // google sign out (natywny) - sprawdź getCurrentUser()
      try {
        const current = await GoogleSignin.getCurrentUser()
        if (current) await GoogleSignin.signOut()
      } catch (e) {
        // ignore
      }

      try {
        await AsyncStorage.removeItem(KEY)
      } catch {}
      setUser(null)
    } catch (err) {
      console.warn('AuthContext.signOutUser error', err)
      setUser(null)
    }
  }

  const value = useMemo(() => ({ user, loading, setAppUser, signOutUser }), [user, loading])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
