// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { onAuthStateChanged, signOut as fbSignOut, type User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth as firebaseAuth, db } from '../lib/firebase'

type AppUser = {
  provider: 'firebase' | 'google'
  email?: string | null
  uid?: string | null
  name?: string | null
  photo?: string | null
  isSubscribed?: boolean
}

type AuthCtx = {
  user: AppUser | null
  loading: boolean
  signOutUser: () => Promise<void>
  setAppUser: (u: AppUser | null) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubDoc: () => void = () => {}

    const unsubAuth = onAuthStateChanged(firebaseAuth, (fbUser: FirebaseUser | null) => {
      // Clean up previous doc listener if any
      unsubDoc()
      unsubDoc = () => {}

      if (fbUser) {
        // Initial user set
        setUser({
          provider: 'firebase',
          email: fbUser.email ?? null,
          uid: fbUser.uid ?? null,
          name: fbUser.displayName ?? null,
          photo: fbUser.photoURL ?? null,
          isSubscribed: false // default
        })

        // Listen to Firestore user document for subscription status
        // Zakładamy kolekcję 'users' i dokument o ID = uid
        unsubDoc = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
          const data = snap.data()
          const isSub = !!data?.isSubscribed
          setUser(prev => {
            if (!prev) return null 
            // Only update if changed to avoid loops if we were careful, but here straightforward
            return { ...prev, isSubscribed: isSub }
          })
        }, (error) => {
             console.log("Firestore user listener error:", error)
        })

      } else {
        // jeśli poprzednio był firebase user, czyścimy; jeśli był inny provider, nie nadpisujemy
        // (W oryginalnym kodzie było: prev?.provider === 'firebase' ? null : prev)
        // Ale skoro używamy firebaseAuth, to raczej to jest główne źródło prawdy dla firebase
        setUser(prev => (prev?.provider === 'firebase' ? null : prev))
      }
      setLoading(false)
    })

    return () => {
      unsubAuth()
      unsubDoc()
    }
  }, [])

  const setAppUser = (u: AppUser | null) => {
    setUser(u ? { ...u } : null)
  }

  const signOutUser = async () => {
    try {
      await fbSignOut(firebaseAuth)
    } catch (e) {
      // ignore
    }

    try {
      // GoogleSignin.signOut może istnieć; jeśli nie, catch zignoruje
      if ((GoogleSignin as any).signOut) {
        await GoogleSignin.signOut()
      }
    } catch (e) {
      // ignore
    }

    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      signOutUser,
      setAppUser,
    }),
    [user, loading]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
