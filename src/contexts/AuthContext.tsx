import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'
import { UserProfile } from '../types'
import { isEmailAllowed, addAllowedUser } from '../services/allowedUsers'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  accessDenied: boolean
  signIn: () => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const BOOTSTRAP_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setProfile(null)
        setAccessDenied(false)
        setLoading(false)
        return
      }

      const email = (u.email || '').toLowerCase()

      // Bootstrap: first admin via env var
      if (BOOTSTRAP_EMAIL && email === BOOTSTRAP_EMAIL) {
        const existing = await isEmailAllowed(email)
        if (!existing) {
          await addAllowedUser({
            email,
            rol: 'admin',
            toegevoegdDoor: 'systeem',
            toegevoegdOp: Date.now(),
          })
        }
      }

      // Check if email is on the allowlist
      const allowed = await isEmailAllowed(email)
      if (!allowed) {
        await signOut(auth)
        setUser(null)
        setProfile(null)
        setAccessDenied(true)
        setLoading(false)
        return
      }

      // Allowed — load or create user profile
      setAccessDenied(false)
      const ref = doc(db, 'users', u.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: u.uid,
          naam: u.displayName || email,
          email,
          fotoUrl: u.photoURL || undefined,
          rol: allowed.rol,
          aangemaaktOp: Date.now(),
        }
        await setDoc(ref, newProfile)
        setProfile(newProfile)
      } else {
        // Sync role from allowedUsers in case it changed
        const data = snap.data() as UserProfile
        if (data.rol !== allowed.rol) {
          await setDoc(ref, { rol: allowed.rol }, { merge: true })
          data.rol = allowed.rol
        }
        setProfile(data)
      }

      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async () => {
    setAccessDenied(false)
    await signInWithPopup(auth, googleProvider)
  }

  const logOut = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, accessDenied, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
