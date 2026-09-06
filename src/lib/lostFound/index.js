import * as localRepo from './localRepo';
import * as firestoreRepo from './firestoreRepo';

export function useLostFoundBackend() {
  return process.env.EXPO_PUBLIC_LOSTFOUND_BACKEND === 'firestore' ? 'firestore' : 'local';
}

const repo = useLostFoundBackend() === 'firestore' ? firestoreRepo : localRepo;

export const listItems = repo.listItems;
export const getItem = repo.getItem;
export const listClaimsForItem = repo.listClaimsForItem;
export const createItem = repo.createItem;
export const updateItem = repo.updateItem;
export const deleteItem = repo.deleteItem;
export const claimItem = repo.claimItem;
export const resolveItem = repo.resolveItem;
export const reopenItem = repo.reopenItem;
