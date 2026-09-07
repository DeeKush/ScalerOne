import { File } from 'expo-file-system';
import { apiFetch } from '@/src/lib/api/client';

async function uriToBase64(uri) {
  try {
    const file = new File(uri);
    if (file.exists && typeof file.base64 === 'function') {
      return file.base64();
    }
  } catch {
    // Web blob: URIs and some native paths are not File-backed.
  }
  const res = await fetch(uri);
  if (!res.ok) throw new Error('Could not read image');
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

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
