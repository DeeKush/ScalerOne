// Real Lost & Found photo analysis — single free-tier provider (Google
// Gemini, via Google AI Studio) producing structured autofill suggestions
// plus best-effort text extraction in one call. See
// docs/image-pipeline-architecture.md §7 for why this replaced the earlier
// "vision model + dedicated OCR" plan, and docs/lost-found-production-roadmap.md
// Phase 4 for the free-tier rate-limit and data-handling notes.

// A Google-maintained alias rather than a pinned version — the original
// pin (gemini-2.5-flash) was already retired for new projects by the time
// this was first tested live, which is exactly the kind of churn an alias
// is meant to absorb. The "flash-lite" tier over plain "flash" is
// deliberate too: this task is a bounded structured-extraction job, not
// deep reasoning, and lite fits the free-tier-first philosophy (cheaper,
// and in live testing had spare capacity when the full "flash" alias
// returned a transient 503 under demand). If a specific pinned version is
// ever preferred instead (for output stability), swap this for an exact
// model id.
const MODEL = 'gemini-flash-lite-latest';

export const CATEGORY_IDS = [
  'electronics',
  'documents',
  'clothing',
  'accessories',
  'books',
  'keys',
  'other',
];

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    suggestedTitle: { type: 'STRING' },
    suggestedCategory: { type: 'STRING', enum: CATEGORY_IDS },
    suggestedDescription: { type: 'STRING' },
    confidence: {
      type: 'OBJECT',
      properties: {
        title: { type: 'NUMBER' },
        category: { type: 'NUMBER' },
        description: { type: 'NUMBER' },
      },
      required: ['title', 'category', 'description'],
    },
    detectedText: { type: 'STRING', nullable: true },
  },
  required: ['suggestedTitle', 'suggestedCategory', 'suggestedDescription', 'confidence'],
};

const PROMPT = `You are helping a student post a Lost & Found listing on a campus app from a single photo of the item.

Look at the photo and produce:
- suggestedTitle: a short, specific title for the item (e.g. "Black backpack with a front pocket").
- suggestedCategory: exactly one of ${CATEGORY_IDS.join(', ')} — pick the closest match.
- suggestedDescription: 1-2 sentences describing distinguishing details (color, brand, condition, marks) that would help someone recognize it.
- confidence: your confidence (0.0-1.0) in each of the three fields above, judged independently.
- detectedText: any clearly readable text visible in the photo (e.g. a name, ID number, label), verbatim, or null if there is none or it isn't legible.

Only describe what is actually visible in the photo. Do not guess at a brand or text you cannot actually read.`;

function geminiApiKey() {
  return process.env.GEMINI_API_KEY || '';
}

export function geminiReady() {
  return Boolean(geminiApiKey());
}

/**
 * Analyze a Lost & Found photo. Returns
 * { suggestedTitle, suggestedCategory, suggestedDescription, confidence, detectedText }.
 * Throws on any failure (missing key, network, rate limit, malformed
 * response) — callers decide how to degrade, this stays a thin wrapper
 * around the API call.
 */
export async function analyzePhoto({ bytes, mime }) {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  if (!bytes?.length) throw new Error('No image bytes provided');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mime || 'image/jpeg', data: bytes.toString('base64') } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 240)}`);
  }

  const data = JSON.parse(text);
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned no content');
  const parsed = JSON.parse(raw);

  return {
    suggestedTitle: parsed.suggestedTitle,
    suggestedCategory: CATEGORY_IDS.includes(parsed.suggestedCategory)
      ? parsed.suggestedCategory
      : 'other',
    suggestedDescription: parsed.suggestedDescription,
    confidence: {
      title: Number(parsed.confidence?.title) || 0,
      category: Number(parsed.confidence?.category) || 0,
      description: Number(parsed.confidence?.description) || 0,
    },
    detectedText: parsed.detectedText || null,
  };
}
