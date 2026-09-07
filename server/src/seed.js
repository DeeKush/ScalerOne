import { randomUUID } from 'node:crypto';
import { loadEnv } from './loadEnv.js';
import { getDb, ensureIndexes, ensureVectorIndex, itemsCol, claimsCol, imagesCol } from './mongo.js';
import { objectKeyFor, putR2Object, r2Ready } from './r2.js';
import { embedItem, fetchImageBytes } from './clip.js';

loadEnv();

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function isoAgo(ms) {
  return new Date(Date.now() - ms).toISOString();
}

const DEMO_OWNER_UID = 'mock-user';

const SEED_ITEMS = [
  {
    id: 'lf1',
    type: 'lost',
    category: 'electronics',
    categoryLabel: 'Electronics',
    title: 'Black iPhone 13 with cracked case',
    description: 'Lost near the library reading hall, screen has a spiderweb crack.',
    location: 'Library, 2nd floor',
    status: 'open',
    postedBy: 'u_ariyan',
    postedByName: 'Ariyan Gupta',
    createdAt: isoAgo(2 * HOUR),
  },
  {
    id: 'lf2',
    type: 'found',
    category: 'documents',
    categoryLabel: 'Documents',
    title: 'Found Aadhaar card near Gate 2',
    description: 'Picked up on the ground near the security cabin.',
    location: 'Main Gate 2',
    status: 'open',
    postedBy: DEMO_OWNER_UID,
    postedByName: 'You',
    contactPreference: 'whatsapp',
    contactValue: '9876543210',
    createdAt: isoAgo(5 * HOUR),
  },
  {
    id: 'lf3',
    type: 'lost',
    category: 'clothing',
    categoryLabel: 'Clothing',
    title: 'Blue hoodie left in classroom 4B',
    description: 'Navy blue zip-up hoodie, left on the back of a chair.',
    location: 'Academic Block C, Room 4B',
    status: 'claimed',
    postedBy: 'u_rahul',
    postedByName: 'Rahul Verma',
    createdAt: isoAgo(1 * DAY),
  },
  {
    id: 'lf4',
    type: 'found',
    category: 'accessories',
    categoryLabel: 'Accessories',
    title: 'Found silver wristwatch',
    description: 'A silver-strap analog watch found on a cafeteria table.',
    location: 'Cafeteria',
    status: 'open',
    postedBy: DEMO_OWNER_UID,
    postedByName: 'You',
    contactPreference: 'whatsapp',
    contactValue: '9876543210',
    createdAt: isoAgo(1.5 * DAY),
  },
  {
    id: 'lf5',
    type: 'lost',
    category: 'books',
    categoryLabel: 'Books',
    title: 'DSA textbook (CLRS) missing',
    description: 'Hardcover, name written inside the front cover.',
    location: 'Hostel Block A, common room',
    status: 'resolved',
    postedBy: 'u_dev',
    postedByName: 'Dev Patil',
    createdAt: isoAgo(3 * DAY),
  },
  {
    id: 'lf6',
    type: 'found',
    category: 'keys',
    categoryLabel: 'Keys',
    title: 'Bunch of keys with a red keychain',
    description: 'Three keys on a ring with a small red rubber keychain.',
    location: 'Basketball court',
    status: 'open',
    postedBy: 'u_ishaan',
    postedByName: 'Ishaan Kapoor',
    createdAt: isoAgo(4 * DAY),
  },
  {
    id: 'lf7',
    type: 'lost',
    category: 'other',
    categoryLabel: 'Other',
    title: 'Grey water bottle, dented',
    description: 'Steel bottle with a dent near the base, has a college sticker.',
    location: 'Gym',
    status: 'open',
    postedBy: 'u_priya',
    postedByName: 'Priya Menon',
    createdAt: isoAgo(5 * DAY),
  },
  {
    id: 'lf8',
    type: 'found',
    category: 'electronics',
    categoryLabel: 'Electronics',
    title: 'Found wired earphones (white)',
    description: 'Found tucked under a seat, still in decent condition.',
    location: 'Auditorium lobby',
    status: 'claimed',
    postedBy: 'u_kabir',
    postedByName: 'Kabir Shah',
    createdAt: isoAgo(6 * DAY),
  },
];

const SEED_CLAIMS = [
  {
    id: 'lfc1',
    itemId: 'lf2',
    claimerUid: 'u_rahul',
    claimerName: 'Rahul Verma',
    message: 'I think that’s mine — lost it near Gate 2 on Tuesday evening.',
    createdAt: isoAgo(3 * HOUR),
  },
  {
    id: 'lfc2',
    itemId: 'lf4',
    claimerUid: 'u_priya',
    claimerName: 'Priya Menon',
    message: 'That looks like my watch. It has a small scratch on the clasp.',
    createdAt: isoAgo(1 * DAY),
  },
  {
    id: 'lfc3',
    itemId: 'lf4',
    claimerUid: 'u_ishaan',
    claimerName: 'Ishaan Kapoor',
    message: 'Could be the one I left in the cafeteria last week?',
    createdAt: isoAgo(6 * HOUR),
  },
];

// 1×1 JPEG used only when R2 credentials are present.
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAf/bAIQAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAf/CABEIAAEAAQMBIgACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAK/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/2gAMAwEAAhADEAAAAf8A/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIQAxAAAAH/AP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQAwAT8Bf//Z',
  'base64'
);

async function seedImagesIfPossible(db) {
  if (!r2Ready()) {
    console.log('R2 credentials missing — seed items will have empty photoUrl');
    return new Map();
  }
  const urls = new Map();
  const feature = 'lost-found';
  const seedTargets = ['lf1', 'lf2', 'lf4'];
  for (const itemId of seedTargets) {
    const existing = await imagesCol(db).findOne({ feature, ownerUid: `seed-${itemId}` });
    if (existing?.publicUrl) {
      urls.set(itemId, existing.publicUrl);
      continue;
    }
    const imageId = randomUUID();
    const r2Key = objectKeyFor({ feature, imageId, ext: 'jpg' });
    const publicUrl = await putR2Object({
      key: r2Key,
      bytes: TINY_JPEG,
      mime: 'image/jpeg',
    });
    const doc = {
      _id: imageId,
      feature,
      ownerUid: `seed-${itemId}`,
      r2Key,
      publicUrl,
      mime: 'image/jpeg',
      byteSize: TINY_JPEG.length,
      createdAt: new Date().toISOString(),
    };
    await imagesCol(db).insertOne(doc);
    urls.set(itemId, publicUrl);
  }
  return urls;
}

async function main() {
  const db = await getDb();
  await ensureIndexes();
  await ensureVectorIndex();
  const photoUrls = await seedImagesIfPossible(db);

  for (const seed of SEED_ITEMS) {
    const createdAt = seed.createdAt;
    const item = {
      description: '',
      photoUrl: photoUrls.get(seed.id) || '',
      contactPreference: 'whatsapp',
      contactValue: '9123456780',
      status: 'open',
      ...seed,
      eventDate: seed.eventDate ?? createdAt,
      createdAt,
      updatedAt: seed.updatedAt ?? createdAt,
    };
    await itemsCol(db).updateOne({ id: item.id }, { $setOnInsert: item }, { upsert: true });
  }

  for (const claim of SEED_CLAIMS) {
    await claimsCol(db).updateOne({ id: claim.id }, { $setOnInsert: claim }, { upsert: true });
  }

  const itemCount = await itemsCol(db).countDocuments();
  const claimCount = await claimsCol(db).countDocuments();
  console.log(`Seed complete. items=${itemCount} claims=${claimCount} photos=${photoUrls.size}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
