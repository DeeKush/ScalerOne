import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const ALLOWED_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_BYTES = 2 * 1024 * 1024;

let client;

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'scalerone-images';
  const publicBase = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required');
  }
  if (!publicBase) {
    throw new Error('R2_PUBLIC_BASE_URL is required (r2.dev public development URL)');
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase };
}

function getClient() {
  if (!client) {
    const { accountId, accessKeyId, secretAccessKey } = r2Config();
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export function r2Ready() {
  try {
    r2Config();
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFeature(feature) {
  const value = String(feature || '')
    .trim()
    .toLowerCase();
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(value)) {
    throw new Error('Invalid feature name');
  }
  return value;
}

export function extForMime(mime) {
  const ext = ALLOWED_MIME[String(mime || '').toLowerCase()];
  if (!ext) {
    throw new Error('Unsupported image type (jpeg, png, webp only)');
  }
  return ext;
}

export function assertImageBytes(bytes) {
  if (!bytes || !bytes.length) {
    throw new Error('Empty image');
  }
  if (bytes.length > MAX_BYTES) {
    throw new Error('Image too large (max 2 MB)');
  }
}

export function objectKeyFor({ feature, imageId, ext }) {
  const year = new Date().getUTCFullYear();
  return `${feature}/${year}/${imageId}.${ext}`;
}

export function publicUrlFor(key) {
  return `${r2Config().publicBase}/${key}`;
}

export async function putR2Object({ key, bytes, mime }) {
  const { bucket } = r2Config();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return publicUrlFor(key);
}

export async function deleteR2Object(key) {
  if (!key) return;
  const { bucket } = r2Config();
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export { ALLOWED_MIME, MAX_BYTES };
