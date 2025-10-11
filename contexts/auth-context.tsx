"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ 
  children,
  initialUser 
}: { 
  children: React.ReactNode
  initialUser: User | null
}) {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(initialUser)

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    
    // Clear all Supabase auth storage to prevent PKCE issues
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        try {
          const url = new URL(supabaseUrl)
          const subdomain = url.hostname.split('.')[0]
          const storageKey = `sb-${subdomain}-auth-token`
          
          // Clear localStorage
          localStorage.removeItem(storageKey)
          
          // Clear any PKCE verifiers
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('pkce')) {
              localStorage.removeItem(key)
            }
          })
        } catch (error) {
          console.warn('Error clearing auth storage:', error)
        }
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
