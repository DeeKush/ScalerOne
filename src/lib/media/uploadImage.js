import { apiFetch } from '@/src/lib/api/client';
import { uriToBase64 } from '@/src/lib/media/uriToBase64';

// Fallback only — callers should pass the picker's real asset.mimeType
// whenever one is available. Guessing from the uri string is unreliable
// (e.g. web blob: URIs carry no extension) and was the source of images
// occasionally reaching R2 with the wrong Content-Type.
function mimeFromUri(uri) {
  const lower = String(uri).toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Upload an image for any feature (lost-found, events, profiles, …).
 * Returns { id, url } from POST /v1/images.
 */
export async function uploadImage({ feature, uri, mime }) {
  if (!uri) throw new Error('Image uri required');
  const base64 = await uriToBase64(uri);
  return apiFetch('/v1/images', {
    method: 'POST',
    json: {
      feature,
      mime: mime || mimeFromUri(uri),
      base64,
    },
  });
}
