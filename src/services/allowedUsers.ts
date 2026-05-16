import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, orderBy, Unsubscribe, getDoc
} from 'firebase/firestore'
import { db } from '../firebase'

export interface AllowedUser {
  email: string
  rol: 'admin' | 'member'
  toegevoegdDoor: string
  toegevoegdOp: number
}

const COL = 'allowedUsers'

export async function isEmailAllowed(email: string): Promise<AllowedUser | null> {
  const snap = await getDoc(doc(db, COL, email.toLowerCase()))
  if (!snap.exists()) return null
  return snap.data() as AllowedUser
}

export function subscribeAllowedUsers(cb: (users: AllowedUser[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy('toegevoegdOp', 'desc'))
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as AllowedUser))
  })
}

export async function addAllowedUser(user: AllowedUser): Promise<void> {
  await setDoc(doc(db, COL, user.email.toLowerCase()), user)
}

export async function removeAllowedUser(email: string): Promise<void> {
  await deleteDoc(doc(db, COL, email.toLowerCase()))
}

export async function updateAllowedUserRole(email: string, rol: 'admin' | 'member'): Promise<void> {
  await setDoc(doc(db, COL, email.toLowerCase()), { rol }, { merge: true })
}
