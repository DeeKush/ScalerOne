import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  claimItem,
  createItem,
  deleteItem,
  getItem,
  listClaimsForItem,
  listItems,
  reopenItem,
  resolveItem,
  updateItem,
  listMatches,
} from '@/src/lib/lostFound';

export function useItems(filters) {
  return useQuery({
    queryKey: ['lostFoundItems', filters],
    queryFn: () => listItems(filters),
    placeholderData: keepPreviousData,
  });
}

export function useItem(itemId) {
  return useQuery({
    queryKey: ['lostFoundItem', itemId],
    queryFn: () => getItem(itemId),
    enabled: Boolean(itemId),
    retry: false,
  });
}

export function useClaimsForItem(itemId) {
  return useQuery({
    queryKey: ['lostFoundClaims', itemId],
    queryFn: () => listClaimsForItem(itemId),
    enabled: Boolean(itemId),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
    },
  });
}

export function useUpdateItem(itemId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
      queryClient.invalidateQueries({ queryKey: ['lostFoundItem', itemId] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => deleteItem(itemId),
    onSuccess: (_result, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
      queryClient.removeQueries({ queryKey: ['lostFoundItem', itemId] });
      queryClient.removeQueries({ queryKey: ['lostFoundClaims', itemId] });
    },
  });
}

export function useClaimItem(itemId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ claimerUid, message, claimerName }) =>
      claimItem(itemId, claimerUid, message, claimerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
      queryClient.invalidateQueries({ queryKey: ['lostFoundItem', itemId] });
      queryClient.invalidateQueries({ queryKey: ['lostFoundClaims', itemId] });
    },
  });
}

export function useReopenItem(itemId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reopenItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
      queryClient.invalidateQueries({ queryKey: ['lostFoundItem', itemId] });
      queryClient.invalidateQueries({ queryKey: ['lostFoundClaims', itemId] });
    },
  });
}

export function useResolveItem(itemId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resolveItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
      queryClient.invalidateQueries({ queryKey: ['lostFoundItem', itemId] });
      queryClient.invalidateQueries({ queryKey: ['lostFoundClaims', itemId] });
    },
  });
}

export function useItemMatches(itemId) {
  return useQuery({
    queryKey: ['lostFoundMatches', itemId],
    queryFn: () => listMatches(itemId),
    enabled: Boolean(itemId),
  });
}
