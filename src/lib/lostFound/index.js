import * as localRepo from './localRepo';
import * as firestoreRepo from './firestoreRepo';
import * as apiRepo from './apiRepo';

export function useLostFoundBackend() {
  const value = process.env.EXPO_PUBLIC_LOSTFOUND_BACKEND;
  if (value === 'api') return 'api';
  if (value === 'firestore') return 'firestore';
  return 'local';
}

const repo =
  useLostFoundBackend() === 'api'
    ? apiRepo
    : useLostFoundBackend() === 'firestore'
      ? firestoreRepo
      : localRepo;

export const listItems = repo.listItems;
export const getItem = repo.getItem;
export const listClaimsForItem = repo.listClaimsForItem;
export const createItem = repo.createItem;
export const updateItem = repo.updateItem;
export const deleteItem = repo.deleteItem;
export const claimItem = repo.claimItem;
export const resolveItem = repo.resolveItem;
export const reopenItem = repo.reopenItem;
export const listMatches = repo.listMatches;
