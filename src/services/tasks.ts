import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Task } from '../types';

const COL = 'tasks';

export function subscribeTasks(cb: (items: Task[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy('aangemaaktOp', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
  });
}

export async function addTask(data: Omit<Task, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, bijgewerktOp: Date.now() });
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
