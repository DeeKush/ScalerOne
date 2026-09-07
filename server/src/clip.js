const MODEL = 'openai/clip-vit-base-patch32';
const IMAGE_WEIGHT = 0.7;
const TEXT_WEIGHT = 0.3;
const DIM = 512;

function hfToken() {
  return process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || '';
}

export function clipReady() {
  return Boolean(hfToken());
}

function flattenEmbedding(data) {
  if (!data) return null;
  if (Array.isArray(data) && typeof data[0] === 'number') return data;
  if (Array.isArray(data)) return flattenEmbedding(data[0]);
  if (Array.isArray(data.embedding)) return flattenEmbedding(data.embedding);
  return null;
}

function l2Normalize(vec) {
  let sum = 0;
  for (const n of vec) sum += n * n;
  const mag = Math.sqrt(sum) || 1;
  return vec.map((n) => n / mag);
}

function mix(imageVec, textVec) {
  const img = imageVec?.length === DIM ? imageVec : null;
  const txt = textVec?.length === DIM ? textVec : null;
  if (!img && !txt) return null;
  const wi = img ? (txt ? IMAGE_WEIGHT : 1) : 0;
  const wt = txt ? (img ? TEXT_WEIGHT : 1) : 0;
  const out = new Array(DIM);
  for (let i = 0; i < DIM; i++) {
    out[i] = (img ? img[i] * wi : 0) + (txt ? txt[i] * wt : 0);
  }
  return l2Normalize(out);
}

async function hfPost({ body, headers }) {
  const token = hfToken();
  const url = `https://router.huggingface.co/hf-inference/models/${MODEL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, ...headers },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`CLIP ${res.status}: ${text.slice(0, 240)}`);
  }
  return JSON.parse(text);
}

export async function embedImageBytes(bytes, mime = 'image/jpeg') {
  if (!bytes?.length || !hfToken()) return null;
  const data = await hfPost({
    body: bytes,
    headers: { 'Content-Type': mime },
  });
  return flattenEmbedding(data);
}

export async function embedText(text) {
  const input = String(text || '').trim();
  if (!input || !hfToken()) return null;
  const data = await hfPost({
    body: JSON.stringify({ inputs: input }),
    headers: { 'Content-Type': 'application/json' },
  });
  return flattenEmbedding(data);
}

export async function embedItem({ title, description, imageBytes, mime }) {
  if (!hfToken()) return null;
  const text = [title, description].filter(Boolean).join('. ');
  let imageVec = null;
  let textVec = null;
  try {
    if (imageBytes?.length) imageVec = await embedImageBytes(imageBytes, mime);
  } catch (err) {
    console.error('[clip] image embed failed', err?.message ?? err);
  }
  try {
    textVec = await embedText(text);
  } catch (err) {
    console.error('[clip] text embed failed', err?.message ?? err);
  }
  return mix(imageVec, textVec);
}

export async function fetchImageBytes(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return { bytes: buf, mime };
}
