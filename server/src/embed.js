import { loadEnv } from './loadEnv.js';
import { getDb, itemsCol, ensureIndexes, ensureVectorIndex } from './mongo.js';
import { embedItem, fetchImageBytes, clipReady } from './clip.js';

loadEnv();

async function main() {
  if (!clipReady()) {
    console.log('HF_TOKEN missing — skip embeddings');
    process.exit(0);
  }
  const db = await getDb();
  await ensureIndexes();
  await ensureVectorIndex();
  const items = await itemsCol(db)
    .find({ $or: [{ embedding: { $exists: false } }, { embedding: null }] })
    .toArray();
  let ok = 0;
  for (const item of items) {
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
    await itemsCol(db).updateOne(
      { id: item.id },
      { $set: { embedding: embedding ?? null, embeddingUpdatedAt: new Date().toISOString() } }
    );
    if (embedding) ok += 1;
  }
  console.log(`Embeddings updated: ${ok}/${items.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
