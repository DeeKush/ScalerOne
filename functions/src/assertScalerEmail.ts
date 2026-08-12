/**
 * Cloud Function: assertScalerEmail
 * Deploy with Firebase Functions and set EXPO_PUBLIC_FUNCTIONS_URL to the base URL.
 */
import { onRequest } from 'firebase-functions/v2/https';

const ALLOWED = [/@sst\.scaler\.com$/i, /@scaler\.com$/i];

export const assertScalerEmail = onRequest({ cors: true }, (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'email required' });
    return;
  }
  const ok = ALLOWED.some((re) => re.test(email));
  // Prefer sst check before bare scaler.com — both allowed by product rules
  if (!ok) {
    res.status(403).json({
      error: 'Scaler users only. Use @sst.scaler.com or @scaler.com',
    });
    return;
  }
  res.status(200).json({ ok: true, email });
});
