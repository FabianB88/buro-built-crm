import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Note } from '../types';

const COL = 'notes';

export function subscribeNotes(cb: (items: Note[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy('aangemaaktOp', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Note)));
  });
}

export async function addNote(data: Omit<Note, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateNote(id: string, data: Partial<Note>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteNote(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
