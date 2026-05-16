import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Client } from '../types';

const COL = 'clients';

export function subscribeClients(cb: (items: Client[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy('aangemaaktOp', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
  });
}

export async function addClient(data: Omit<Client, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateClient(id: string, data: Partial<Client>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, bijgewerktOp: Date.now() });
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
