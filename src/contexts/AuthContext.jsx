import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [team, setTeam] = useState(null)       // { id, name, ... } or null
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // ------------------------------------------------------------------
  // On mount: restore existing sessions
  // ------------------------------------------------------------------
  useEffect(() => {
    async function restoreSession() {
      // 1. Check for an existing Supabase auth session (admin)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAdmin(true)
      }

      // 2. Check sessionStorage for a team session
      const stored = sessionStorage.getItem('intelx_team')
      if (stored) {
        try {
          setTeam(JSON.parse(stored))
        } catch {
          sessionStorage.removeItem('intelx_team')
        }
      }

      setLoading(false)
    }

    restoreSession()

    // Listen for Supabase auth state changes (admin login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAdmin(!!session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ------------------------------------------------------------------
  // Team login: validate code against teams table
  // ------------------------------------------------------------------
  const loginAsTeam = useCallback(async (loginCode) => {
    const trimmed = loginCode.trim()
    if (!trimmed) throw new Error('Login code cannot be empty')

    const { data, error } = await supabase
      .from('teams')
      .select('id, name, credits_balance, clearance_tier')
      .eq('login_code', trimmed)
      .single()

    if (error || !data) {
      throw new Error('Invalid login code. Check with your team mentor.')
    }

    setTeam(data)
    sessionStorage.setItem('intelx_team', JSON.stringify(data))
    return data
  }, [])

  // ------------------------------------------------------------------
  // Admin login: real Supabase Auth sign-in
  // ------------------------------------------------------------------
  const loginAsAdmin = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      throw new Error(error.message || 'Admin authentication failed')
    }
    setIsAdmin(true)
  }, [])

  // ------------------------------------------------------------------
  // Logout (works for both team and admin)
  // ------------------------------------------------------------------
  const logout = useCallback(async () => {
    if (isAdmin) {
      await supabase.auth.signOut()
      setIsAdmin(false)
    }
    setTeam(null)
    sessionStorage.removeItem('intelx_team')
  }, [isAdmin])

  const value = {
    team,
    isAdmin,
    loading,
    loginAsTeam,
    loginAsAdmin,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
