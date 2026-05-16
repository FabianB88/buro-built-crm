import {
  collection, addDoc, deleteDoc,
  doc, onSnapshot, query, where, Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import { Interaction } from '../types'

const COL = 'interactions'

export function subscribeInteractionsByContact(contactId: string, cb: (items: Interaction[]) => void): Unsubscribe {
  const q = query(collection(db, COL), where('contactId', '==', contactId))
  return onSnapshot(q, snap => {
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Interaction))
      .sort((a, b) => b.aangemaaktOp - a.aangemaaktOp)
    cb(items)
  })
}

export async function addInteraction(data: Omit<Interaction, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data)
  return ref.id
}

export async function deleteInteraction(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
