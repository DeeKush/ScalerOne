import { randomUUID } from 'node:crypto';
import { getDb, imagesCol, ensureIndexes } from '../mongo.js';
import { requireUser } from '../firebaseAuth.js';
import {
  sanitizeFeature,
  extForMime,
  assertImageBytes,
  objectKeyFor,
  putR2Object,
  deleteR2Object,
} from '../r2.js';

const MIME_FROM_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function extractImageId(photoUrl) {
  if (!photoUrl) return null;
  const proxy = String(photoUrl).match(/\/v1\/images\/([a-f0-9-]{36})/i);
  if (proxy?.[1]) return proxy[1];
  const r2 = String(photoUrl).match(/\/([a-f0-9-]{36})\.(jpg|jpeg|png|webp)(?:\?|$)/i);
  return r2?.[1] ?? null;
}

function decodeBase64(input) {
  const cleaned = String(input || '').replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(cleaned, 'base64');
}

export async function deleteImageRecord(imageId) {
  if (!imageId) return;
  const db = await getDb();
  const doc = await imagesCol(db).findOne({ _id: imageId });
  if (!doc) return;
  try {
    await deleteR2Object(doc.r2Key || doc.githubPath);
  } catch (err) {
    console.error('[images] r2 delete failed', err?.message ?? err);
  }
  await imagesCol(db).deleteOne({ _id: imageId });
}

export function registerImageRoutes(app) {
  app.post('/v1/images', requireUser, async (c) => {
    await ensureIndexes();
    const user = c.get('user');
    const body = await c.req.json().catch(() => ({}));
    const feature = sanitizeFeature(body.feature);
    const mime = body.mime || body.contentType || 'image/jpeg';
    const ext = extForMime(mime);
    const bytes = decodeBase64(body.base64 || body.content);
    assertImageBytes(bytes);

    const imageId = randomUUID();
    const r2Key = objectKeyFor({ feature, imageId, ext });
    const contentType = MIME_FROM_EXT[ext] || mime;
    const url = await putR2Object({ key: r2Key, bytes, mime: contentType });
    const createdAt = new Date().toISOString();
    const doc = {
      _id: imageId,
      feature,
      ownerUid: user.uid,
      r2Key,
      publicUrl: url,
      mime: contentType,
      byteSize: bytes.length,
      createdAt,
    };
    const db = await getDb();
    await imagesCol(db).insertOne(doc);
    return c.json(
      {
        id: imageId,
        url,
        feature,
        mime: doc.mime,
        byteSize: doc.byteSize,
      },
      201
    );
  });

  app.get('/v1/images/:id', async (c) => {
    const imageId = c.req.param('id');
    const db = await getDb();
    const doc = await imagesCol(db).findOne({ _id: imageId });
    if (!doc?.publicUrl) return c.json({ error: 'Image not found' }, 404);
    return c.redirect(doc.publicUrl, 302);
  });
}
