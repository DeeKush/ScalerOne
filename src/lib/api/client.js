import { getFirebaseAuth, useMockAuth } from '@/src/lib/firebase';

export function apiBaseUrl() {
  const base = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_URL is not set');
  }
  return base;
}

export async function getApiAuthHeaders() {
  if (useMockAuth()) {
    return { Authorization: 'Bearer mock:mock-user' };
  }
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('Not signed in');
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch(path, { method = 'GET', json, auth = true, headers: extra } = {}) {
  const headers = { ...(extra || {}) };
  if (auth) Object.assign(headers, await getApiAuthHeaders());
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `API ${res.status}`);
  }
  return data;
}
