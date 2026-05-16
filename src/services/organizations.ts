import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Organization } from '../types';

const COL = 'organizations';

export function subscribeOrganizations(cb: (items: Organization[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy('aangemaaktOp', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization)));
  });
}

export async function addOrganization(data: Omit<Organization, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateOrganization(id: string, data: Partial<Organization>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, bijgewerktOp: Date.now() });
}

export async function deleteOrganization(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
