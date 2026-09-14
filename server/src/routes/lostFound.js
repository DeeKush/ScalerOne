import { randomUUID } from 'node:crypto';
import { getDb, itemsCol, claimsCol, ensureIndexes, ensureVectorIndex } from '../mongo.js';
import { requireUser } from '../firebaseAuth.js';
import { deleteImageRecord, extractImageId } from './images.js';
import { embedItem, fetchImageBytes } from '../clip.js';
import { analyzePhoto as geminiAnalyzePhoto } from '../gemini.js';

const CATEGORY_LABELS = {
  electronics: 'Electronics',
  documents: 'Documents',
  clothing: 'Clothing',
  accessories: 'Accessories',
  books: 'Books',
  keys: 'Keys',
  other: 'Other',
};

function categoryLabel(categoryId) {
  return CATEGORY_LABELS[categoryId] ?? 'Other';
}

const EDITABLE = [
  'title',
  'description',
  'category',
  'categoryLabel',
  'photoUrl',
  'location',
  'eventDate',
  'contactPreference',
  'contactValue',
];

function omitMongoId(doc) {
  if (!doc) return doc;
  const { _id, embedding, ...rest } = doc;
  return rest;
}

function withPublicPhoto(c, item) {
  if (!item) return item;
  const next = omitMongoId(item);
  if (next.photoUrl?.startsWith('/')) {
    const origin = (process.env.PUBLIC_API_URL || new URL(c.req.url).origin).replace(/\/$/, '');
    next.photoUrl = `${origin}${next.photoUrl}`;
  }
  return next;
}

async function findItem(db, itemId) {
  return itemsCol(db).findOne({ id: itemId });
}

function assertOwner(item, user) {
  if (item.postedBy !== user.uid) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

async function refreshEmbedding(item) {
  try {
    let imageBytes;
    let mime;
    if (item.photoUrl) {
      const fetched = await fetchImageBytes(item.photoUrl);
      imageBytes = fetched?.bytes;
      mime = fetched?.mime;
    }
    const embedding = await embedItem({
      title: item.title,
      description: item.description,
      imageBytes,
      mime,
    });
    const db = await getDb();
    await itemsCol(db).updateOne(
      { id: item.id },
      { $set: { embedding: embedding ?? null, embeddingUpdatedAt: new Date().toISOString() } }
    );
    return embedding;
  } catch (err) {
    console.error('[clip] embed item failed', err?.message ?? err);
    return null;
  }
}

export function registerLostFoundRoutes(app) {
  app.get('/v1/lost-found/items', requireUser, async (c) => {
    await ensureIndexes();
    const db = await getDb();
    const type = c.req.query('type');
    const category = c.req.query('category');
    const query = c.req.query('query');
    const status = c.req.query('status');
    const postedBy = c.req.query('postedBy');
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (category && category !== 'all') filter.category = category;
    if (status) filter.status = status;
    if (postedBy) filter.postedBy = postedBy;
    if (query && query.trim()) {
      filter.title = { $regex: query.trim(), $options: 'i' };
    }
    const items = await itemsCol(db).find(filter).sort({ createdAt: -1 }).toArray();
    return c.json(items.map((item) => withPublicPhoto(c, item)));
  });

  app.get('/v1/lost-found/items/:id', requireUser, async (c) => {
    const db = await getDb();
    const item = await findItem(db, c.req.param('id'));
    if (!item) return c.json({ error: `Lost & Found item not found: ${c.req.param('id')}` }, 404);
    return c.json(withPublicPhoto(c, item));
  });

  app.post('/v1/lost-found/items', requireUser, async (c) => {
    await ensureIndexes();
    const user = c.get('user');
    const data = await c.req.json();
    const now = new Date().toISOString();
    const item = {
      id: randomUUID(),
      description: '',
      photoUrl: '',
      contactPreference: 'app',
      contactValue: '',
      status: 'open',
      ...data,
      postedBy: user.uid,
      postedByName: data.postedByName || user.name || 'Scaler Student',
      categoryLabel: categoryLabel(data.category),
      eventDate: data.eventDate ?? now,
      createdAt: now,
      updatedAt: now,
    };
    const db = await getDb();
    await itemsCol(db).insertOne({ ...item, embedding: null });
    await refreshEmbedding(item);
    const stored = await findItem(db, item.id);
    return c.json(withPublicPhoto(c, stored), 201);
  });

  app.patch('/v1/lost-found/items/:id', requireUser, async (c) => {
    const user = c.get('user');
    const itemId = c.req.param('id');
    const data = await c.req.json();
    const db = await getDb();
    const existing = await findItem(db, itemId);
    if (!existing) return c.json({ error: `Lost & Found item not found: ${itemId}` }, 404);
    try {
      assertOwner(existing, user);
    } catch (err) {
      return c.json({ error: err.message }, err.status || 403);
    }

    const patch = {};
    for (const key of EDITABLE) {
      if (data[key] !== undefined) patch[key] = data[key];
    }
    if (patch.category) patch.categoryLabel = categoryLabel(patch.category);
    if (Object.keys(patch).length === 0) return c.json(withPublicPhoto(c, existing));

    if (patch.photoUrl && patch.photoUrl !== existing.photoUrl) {
      await deleteImageRecord(extractImageId(existing.photoUrl));
    }

    patch.updatedAt = new Date().toISOString();
    await itemsCol(db).updateOne({ id: itemId }, { $set: patch });
    const next = await findItem(db, itemId);
    if (
      patch.photoUrl !== undefined ||
      patch.title !== undefined ||
      patch.description !== undefined
    ) {
      await refreshEmbedding(next);
    }
    const stored = await findItem(db, itemId);
    return c.json(withPublicPhoto(c, stored));
  });

  app.delete('/v1/lost-found/items/:id', requireUser, async (c) => {
    const user = c.get('user');
    const itemId = c.req.param('id');
    const db = await getDb();
    const existing = await findItem(db, itemId);
    if (!existing) return c.json({ error: `Lost & Found item not found: ${itemId}` }, 404);
    try {
      assertOwner(existing, user);
    } catch (err) {
      return c.json({ error: err.message }, err.status || 403);
    }
    await deleteImageRecord(extractImageId(existing.photoUrl));
    await claimsCol(db).deleteMany({ itemId });
    await itemsCol(db).deleteOne({ id: itemId });
    return c.body(null, 204);
  });

  app.get('/v1/lost-found/items/:id/matches', requireUser, async (c) => {
    await ensureVectorIndex();
    const db = await getDb();
    const itemId = c.req.param('id');
    const item = await findItem(db, itemId);
    if (!item) return c.json({ error: `Lost & Found item not found: ${itemId}` }, 404);
    if (!item.embedding?.length) {
      return c.json({ matches: [], reason: 'no_embedding' });
    }
    const opposite = item.type === 'lost' ? 'found' : 'lost';
    try {
      const rows = await itemsCol(db)
        .aggregate([
          {
            $vectorSearch: {
              index: 'item_vector_index',
              path: 'embedding',
              queryVector: item.embedding,
              numCandidates: 100,
              limit: 5,
              filter: { type: opposite, status: 'open' },
            },
          },
          {
            $project: {
              _id: 0,
              id: 1,
              title: 1,
              description: 1,
              photoUrl: 1,
              type: 1,
              categoryLabel: 1,
              location: 1,
              status: 1,
              createdAt: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ])
        .toArray();
      return c.json({ matches: rows.filter((row) => row.id !== item.id) });
    } catch (err) {
      console.error('[matches] vectorSearch failed', err?.message ?? err);
      return c.json({ matches: [], reason: 'vector_index_unavailable' });
    }
  });

  app.get('/v1/lost-found/items/:id/claims', requireUser, async (c) => {
    const db = await getDb();
    const itemId = c.req.param('id');
    const item = await findItem(db, itemId);
    if (!item) return c.json({ error: `Lost & Found item not found: ${itemId}` }, 404);
    const claims = await claimsCol(db).find({ itemId }).sort({ createdAt: -1 }).toArray();
    return c.json(claims.map(omitMongoId));
  });

  app.post('/v1/lost-found/items/:id/claims', requireUser, async (c) => {
    const user = c.get('user');
    const itemId = c.req.param('id');
    const data = await c.req.json().catch(() => ({}));
    const db = await getDb();
    const item = await findItem(db, itemId);
    if (!item) return c.json({ error: `Lost & Found item not found: ${itemId}` }, 404);
    const now = new Date().toISOString();
    const claim = {
      id: randomUUID(),
      itemId,
      claimerUid: user.uid,
      claimerName: data.claimerName || user.name || '',
      message: data.message ?? '',
      createdAt: now,
    };
    await claimsCol(db).insertOne(claim);
    await itemsCol(db).updateOne(
      { id: itemId },
      { $set: { status: 'claimed', updatedAt: now } }
    );
    return c.json(omitMongoId(claim), 201);
  });

  app.post('/v1/lost-found/items/:id/reopen', requireUser, async (c) => {
    return setStatus(c, 'open');
  });

  app.post('/v1/lost-found/items/:id/resolve', requireUser, async (c) => {
    return setStatus(c, 'resolved');
  });

  // Photo analysis for report-form autofill. Pure passthrough — nothing is
  // written to Mongo or R2 here, the photo bytes are discarded after the
  // call. Always returns 200; a failed/low-confidence analysis is a normal
  // outcome (status field), not an HTTP error.
  app.post('/v1/lost-found/analyze-photo', requireUser, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const mime = body.mime || 'image/jpeg';
    const bytes = Buffer.from(String(body.base64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64');

    const failed = () =>
      c.json({
        status: 'failed',
        suggestedTitle: null,
        suggestedCategory: null,
        suggestedDescription: null,
        confidence: null,
        detectedText: null,
      });

    if (!bytes.length) return failed();

    try {
      const result = await geminiAnalyzePhoto({ bytes, mime });
      const avgConfidence =
        (result.confidence.title + result.confidence.category + result.confidence.description) / 3;
      const status = avgConfidence >= 0.5 ? 'ok' : 'low_confidence';
      return c.json({ ...result, status });
    } catch (err) {
      console.error('[gemini] analyze-photo failed', err?.message ?? err);
      return failed();
    }
  });
}

async function setStatus(c, status) {
  const user = c.get('user');
  const itemId = c.req.param('id');
  const db = await getDb();
  const item = await findItem(db, itemId);
  if (!item) return c.json({ error: `Lost & Found item not found: ${itemId}` }, 404);
  if (item.postedBy !== user.uid) return c.json({ error: 'Forbidden' }, 403);
  const now = new Date().toISOString();
  await itemsCol(db).updateOne({ id: itemId }, { $set: { status, updatedAt: now } });
  return c.json({ ok: true, status });
}
