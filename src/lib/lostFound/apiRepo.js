import { apiFetch } from '@/src/lib/api/client';

function queryString(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.set(key, String(value));
    }
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export async function listItems(filters = {}) {
  return apiFetch(`/v1/lost-found/items${queryString(filters)}`);
}

export async function getItem(itemId) {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}`);
}

export async function listClaimsForItem(itemId) {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}/claims`);
}

export async function createItem(data) {
  return apiFetch('/v1/lost-found/items', { method: 'POST', json: data });
}

export async function updateItem(itemId, data) {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    json: data,
  });
}

export async function deleteItem(itemId) {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

export async function claimItem(itemId, claimerUid, message, claimerName = '') {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}/claims`, {
    method: 'POST',
    json: { claimerUid, message, claimerName },
  });
}

export async function resolveItem(itemId) {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}/resolve`, {
    method: 'POST',
    json: {},
  });
}

export async function reopenItem(itemId) {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}/reopen`, {
    method: 'POST',
    json: {},
  });
}

export async function listMatches(itemId) {
  return apiFetch(`/v1/lost-found/items/${encodeURIComponent(itemId)}/matches`);
}
