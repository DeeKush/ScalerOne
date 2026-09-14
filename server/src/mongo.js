import { MongoClient } from 'mongodb';

const globalForMongo = globalThis;

export function mongoUri() {
  const uri = process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URL is not set (server-only; never EXPO_PUBLIC_)');
  }
  return uri;
}

export function dbName() {
  return process.env.MONGODB_DB || 'ScalerOne';
}

export async function getDb() {
  if (!globalForMongo.__scaleroneMongo) {
    const client = new MongoClient(mongoUri());
    await client.connect();
    globalForMongo.__scaleroneMongo = client;
  }
  return globalForMongo.__scaleroneMongo.db(dbName());
}

export async function pingMongo() {
  const db = await getDb();
  await db.command({ ping: 1 });
}

export async function ensureIndexes() {
  const db = await getDb();
  await db.collection('images').createIndex({ feature: 1, createdAt: -1 });
  await db.collection('lost_found_items').createIndex({ status: 1 });
  await db.collection('lost_found_items').createIndex({ type: 1 });
  await db.collection('lost_found_items').createIndex({ postedBy: 1 });
  await db.collection('lost_found_items').createIndex({ createdAt: -1 });
  await db.collection('lost_found_claims').createIndex({ itemId: 1 });
}

export async function ensureVectorIndex() {
  const db = await getDb();
  try {
    await itemsCol(db).createSearchIndex({
      name: 'item_vector_index',
      type: 'vectorSearch',
      definition: {
        fields: [
          {
            type: 'vector',
            path: 'embedding',
            numDimensions: 512,
            similarity: 'cosine',
          },
          { type: 'filter', path: 'type' },
          { type: 'filter', path: 'status' },
        ],
      },
    });
  } catch (err) {
    const msg = String(err?.message || err);
    if (/already exists|duplicate/i.test(msg)) return;
    console.warn(
      '[mongo] createSearchIndex skipped (create item_vector_index in Atlas UI if needed):',
      msg.slice(0, 200)
    );
  }
}

export function imagesCol(db) {
  return db.collection('images');
}

export function itemsCol(db) {
  return db.collection('lost_found_items');
}

export function claimsCol(db) {
  return db.collection('lost_found_claims');
}
