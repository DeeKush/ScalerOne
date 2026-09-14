import { File } from 'expo-file-system';

/**
 * Read a local/blob file URI into a base64 string. Tries the native File
 * API first; falls back to a plain fetch + byte read for anything that
 * isn't File-backed (web blob: URIs, some native paths).
 */
export async function uriToBase64(uri) {
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
