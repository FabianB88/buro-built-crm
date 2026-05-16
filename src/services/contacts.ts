import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Contact } from '../types';

const COL = 'contacts';

export function subscribeContacts(cb: (items: Contact[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy('aangemaaktOp', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
  });
}

export async function addContact(data: Omit<Contact, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, bijgewerktOp: Date.now() });
}

export async function deleteContact(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
