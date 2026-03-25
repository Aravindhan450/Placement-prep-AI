import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    let mounted = true

    // handle initial session restore properly
    supabase.auth.getSession().then(({ data, error }) => {

      if (!mounted) return

      if (error) {
        console.error("Session restore error:", error)
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)

    })

    // listen for ALL auth changes including INITIAL_SESSION
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {

        if (!mounted) return

        console.log("Auth event:", event)

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

      })

    return () => {

      mounted = false
      subscription.unsubscribe()

    }

  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )

}

export function useAuth() {
  return useContext(AuthContext)
}
