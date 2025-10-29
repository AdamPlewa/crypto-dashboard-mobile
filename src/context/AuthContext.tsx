// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react'

export type User = {
  email: string
  name?: string
  photo?: string
}

type AuthCtx = {
  user: User | null
  setUser: (user: User | null) => void
  signOutUser: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  const signOutUser = () => {
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, setUser, signOutUser }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
