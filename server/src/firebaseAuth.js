import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function allowMockAuth() {
  return process.env.ALLOW_MOCK_AUTH === 'true';
}

function initAdmin() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return;
  const parsed = JSON.parse(raw);
  initializeApp({ credential: cert(parsed) });
}

export async function resolveUser(c) {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (allowMockAuth() && token.startsWith('mock')) {
    const uid = token.includes(':') ? token.split(':').slice(1).join(':') : 'mock-user';
    return { uid: uid || 'mock-user', mock: true, name: 'You' };
  }

  if (!token) return null;

  initAdmin();
  if (!getApps().length) {
    if (allowMockAuth()) {
      return { uid: 'mock-user', mock: true, name: 'You' };
    }
    return null;
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      mock: false,
      name: decoded.name || '',
      email: decoded.email || '',
    };
  } catch {
    return null;
  }
}

export async function requireUser(c, next) {
  const user = await resolveUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('user', user);
  await next();
}
