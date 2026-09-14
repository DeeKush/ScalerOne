import { apiFetch, apiBaseUrl } from '@/src/lib/api/client';
import { uriToBase64 } from '@/src/lib/media/uriToBase64';

const CANNED_GUESSES = [
  {
    suggestedTitle: 'Black backpack with a front pocket',
    suggestedCategory: 'accessories',
    suggestedDescription: 'Photographed on campus — looks worn at the corners, no visible tags.',
  },
  {
    suggestedTitle: 'Silver wired earphones',
    suggestedCategory: 'electronics',
    suggestedDescription: 'Photographed on campus — a pair of earphones, cable slightly tangled.',
  },
  {
    suggestedTitle: 'Blue spiral notebook',
    suggestedCategory: 'books',
    suggestedDescription: 'Photographed on campus — a notebook with a few pages dog-eared.',
  },
  {
    suggestedTitle: 'Bunch of keys on a ring',
    suggestedCategory: 'keys',
    suggestedDescription: 'Photographed on campus — a small set of keys, one looks like a padlock key.',
  },
  {
    suggestedTitle: 'Grey hooded sweatshirt',
    suggestedCategory: 'clothing',
    suggestedDescription: 'Photographed on campus — a hoodie, looks like a medium.',
  },
];

let nextGuessIndex = 0;

// Dev fallback only — used when no API server is configured at all (e.g. a
// pure offline/local-only setup with no EXPO_PUBLIC_API_URL). Never reflects
// the actual photo; always succeeds so the form-fill UX is testable without
// a server running.
async function mockAnalyzePhoto(_imageUri) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const guess = CANNED_GUESSES[nextGuessIndex % CANNED_GUESSES.length];
  nextGuessIndex += 1;
  return { ...guess, confidence: null, detectedText: null, status: 'ok' };
}

function hasApiConfigured() {
  try {
    apiBaseUrl();
    return true;
  } catch {
    return false;
  }
}

async function realAnalyzePhoto(imageUri, mime) {
  const base64 = await uriToBase64(imageUri);
  return apiFetch('/v1/lost-found/analyze-photo', {
    method: 'POST',
    json: { mime: mime || 'image/jpeg', base64 },
  });
}

/**
 * Analyze a picked photo for autofill suggestions. Uses the real
 * Gemini-backed endpoint whenever a server is configured (independent of
 * which backend stores the item itself — analysis and item persistence are
 * separate concerns), falling back to a canned mock only when no
 * EXPO_PUBLIC_API_URL is set at all.
 *
 * Returns { suggestedTitle, suggestedCategory, suggestedDescription,
 * confidence, detectedText, status }, where status is 'ok' | 'low_confidence'
 * | 'failed'. Callers should treat 'failed' as "couldn't analyze this photo"
 * and degrade to an empty, honest form rather than showing a guess.
 */
export async function analyzePhoto(imageUri, mime) {
  return hasApiConfigured() ? realAnalyzePhoto(imageUri, mime) : mockAnalyzePhoto(imageUri);
}
