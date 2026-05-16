import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '../types';

const COL = 'projects';

export function subscribeProjects(cb: (items: Project[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy('aangemaaktOp', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
  });
}

export async function addProject(data: Omit<Project, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, bijgewerktOp: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
