// Real Firestore wiring — not connected yet, no project is provisioned.
// Calls are commented out; each export throws until this is implemented.
//
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   addDoc,
//   updateDoc,
//   query,
//   where,
//   orderBy,
//   serverTimestamp,
// } from 'firebase/firestore';
// import { getFirebaseDb } from '../firebase';

const COLLECTION = 'lostFoundItems';
const CLAIMS_SUBCOLLECTION = 'claims';

export async function listItems(_filters = {}) {
  // TODO: const db = getFirebaseDb();
  // TODO: let constraints = [orderBy('createdAt', 'desc')];
  // TODO: if (filters.type && filters.type !== 'all') constraints.push(where('type', '==', filters.type));
  // TODO: if (filters.category && filters.category !== 'all') constraints.push(where('category', '==', filters.category));
  // TODO: if (filters.status) constraints.push(where('status', '==', filters.status));
  // TODO: Firestore has no native full-text search — `filters.query` needs a search
  // TODO: index (Algolia/Typesense) or client-side filtering of a bounded result set.
  // TODO: const snap = await getDocs(query(collection(db, COLLECTION), ...constraints));
  // TODO: return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  throw new Error(
    `${COLLECTION}.listItems: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function getItem(_itemId) {
  // TODO: const db = getFirebaseDb();
  // TODO: const snap = await getDoc(doc(db, COLLECTION, itemId));
  // TODO: if (!snap.exists()) throw new Error('Item not found');
  // TODO: return { id: snap.id, ...snap.data() };
  throw new Error(
    `${COLLECTION}.getItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function createItem(_data) {
  // TODO: const db = getFirebaseDb();
  // TODO: const ref = await addDoc(collection(db, COLLECTION), {
  // TODO:   ...data,
  // TODO:   status: 'open',
  // TODO:   createdAt: serverTimestamp(),
  // TODO:   updatedAt: serverTimestamp(),
  // TODO: });
  // TODO: return { id: ref.id, ...data };
  throw new Error(
    `${COLLECTION}.createItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function updateItem(_itemId, _data) {
  // TODO: const db = getFirebaseDb();
  // TODO: Whitelist the editable content fields before writing — never let
  // TODO: type/postedBy/status/createdAt through from the caller.
  // TODO: await updateDoc(doc(db, COLLECTION, itemId), { ...patch, updatedAt: serverTimestamp() });
  // TODO: return getItem(itemId);
  throw new Error(
    `${COLLECTION}.updateItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function deleteItem(_itemId) {
  // TODO: const db = getFirebaseDb();
  // TODO: Firestore does not cascade — delete the claims subcollection with the
  // TODO: item in one writeBatch() so no orphan claims survive the delete.
  // TODO: const batch = writeBatch(db);
  // TODO: const claims = await getDocs(collection(db, COLLECTION, itemId, CLAIMS_SUBCOLLECTION));
  // TODO: claims.forEach((c) => batch.delete(c.ref));
  // TODO: batch.delete(doc(db, COLLECTION, itemId));
  // TODO: await batch.commit();
  throw new Error(
    `${COLLECTION}.deleteItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function listClaimsForItem(_itemId) {
  // TODO: const db = getFirebaseDb();
  // TODO: const snap = await getDocs(query(
  // TODO:   collection(db, COLLECTION, itemId, CLAIMS_SUBCOLLECTION),
  // TODO:   orderBy('createdAt', 'desc')
  // TODO: ));
  // TODO: return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  throw new Error(
    `${COLLECTION}.listClaimsForItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function claimItem(_itemId, _claimerUid, _message, _claimerName) {
  // TODO: const db = getFirebaseDb();
  // TODO: const claimRef = await addDoc(collection(db, COLLECTION, itemId, CLAIMS_SUBCOLLECTION), {
  // TODO:   claimerUid,
  // TODO:   message,
  // TODO:   createdAt: serverTimestamp(),
  // TODO: });
  // TODO: await updateDoc(doc(db, COLLECTION, itemId), { status: 'claimed', updatedAt: serverTimestamp() });
  // TODO: return { id: claimRef.id, itemId, claimerUid, message };
  throw new Error(
    `${COLLECTION}.claimItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function reopenItem(_itemId) {
  // TODO: const db = getFirebaseDb();
  // TODO: await updateDoc(doc(db, COLLECTION, itemId), { status: 'open', updatedAt: serverTimestamp() });
  throw new Error(
    `${COLLECTION}.reopenItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function resolveItem(_itemId) {
  // TODO: const db = getFirebaseDb();
  // TODO: await updateDoc(doc(db, COLLECTION, itemId), { status: 'resolved', updatedAt: serverTimestamp() });
  throw new Error(
    `${COLLECTION}.resolveItem: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}

export async function listMatches(_itemId) {
  throw new Error(
    `${COLLECTION}.listMatches: Firestore repo not implemented. Set EXPO_PUBLIC_LOSTFOUND_BACKEND=local.`
  );
}
