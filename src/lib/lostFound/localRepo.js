import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/localDb';
import { categoryLabel } from './categories';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function isoAgo(ms) {
  return new Date(Date.now() - ms).toISOString();
}

// Matches MOCK_UID in src/lib/auth.js, so a couple of seeded posts belong to the
// signed-in mock user and the poster-side UI (claims received, resolve) has real
// data to show without having to create a second test user first.
const DEMO_OWNER_UID = 'mock-user';

const SEED_ITEMS = [
  {
    id: 'lf1',
    type: 'lost',
    category: 'electronics',
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
    title: 'Found wired earphones (white)',
    description: 'Found tucked under a seat, still in decent condition.',
    location: 'Auditorium lobby',
    status: 'claimed',
    postedBy: 'u_kabir',
    postedByName: 'Kabir Shah',
    createdAt: isoAgo(6 * DAY),
  },
];

const ITEM_COLUMNS = [
  'id',
  'type',
  'title',
  'description',
  'category',
  'categoryLabel',
  'photoUrl',
  'location',
  'eventDate',
  'status',
  'postedBy',
  'postedByName',
  'contactPreference',
  'contactValue',
  'createdAt',
  'updatedAt',
];

function itemValues(item) {
  return ITEM_COLUMNS.map((col) => item[col]);
}

let readyPromise = null;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = initSchema()
      .then(seedIfEmpty)
      .then(seedClaimsIfEmpty)
      .catch((err) => {
        // Never cache a failed init: otherwise one transient failure replays its
        // stale rejection for every later query for the rest of the session.
        console.error('[lost-found] database init failed', err);
        readyPromise = null;
        throw err;
      });
  }
  return readyPromise;
}

async function initSchema() {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lost_found_items (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      categoryLabel TEXT NOT NULL,
      photoUrl TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL,
      eventDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      postedBy TEXT NOT NULL,
      postedByName TEXT NOT NULL,
      contactPreference TEXT NOT NULL DEFAULT 'app',
      contactValue TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_lost_found_items_status ON lost_found_items(status);
    CREATE INDEX IF NOT EXISTS idx_lost_found_items_type ON lost_found_items(type);
    CREATE TABLE IF NOT EXISTS lost_found_claims (
      id TEXT PRIMARY KEY NOT NULL,
      itemId TEXT NOT NULL,
      claimerUid TEXT NOT NULL,
      claimerName TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);
}

async function seedIfEmpty() {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT COUNT(*) AS count FROM lost_found_items');
  if ((row?.count ?? 0) > 0) return;

  const placeholders = `(${ITEM_COLUMNS.map(() => '?').join(', ')})`;
  for (const seed of SEED_ITEMS) {
    const createdAt = seed.createdAt ?? new Date().toISOString();
    const item = {
      description: '',
      photoUrl: '',
      contactPreference: 'whatsapp',
      contactValue: '9123456780',
      status: 'open',
      ...seed,
      categoryLabel: categoryLabel(seed.category),
      eventDate: seed.eventDate ?? createdAt,
      createdAt,
      updatedAt: seed.updatedAt ?? createdAt,
    };
    await db.runAsync(
      `INSERT INTO lost_found_items (${ITEM_COLUMNS.join(', ')}) VALUES ${placeholders}`,
      itemValues(item)
    );
  }
}

// Demo claims on the two posts owned by DEMO_OWNER_UID, so the poster-side
// "Claims received" list has content on a fresh install.
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

async function seedClaimsIfEmpty() {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT COUNT(*) AS count FROM lost_found_claims');
  if ((row?.count ?? 0) > 0) return;

  for (const claim of SEED_CLAIMS) {
    await db.runAsync(
      `INSERT INTO lost_found_claims (id, itemId, claimerUid, claimerName, message, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [claim.id, claim.itemId, claim.claimerUid, claim.claimerName, claim.message, claim.createdAt]
    );
  }
}

function buildWhere({ type, category, query, status, postedBy } = {}) {
  const clauses = [];
  const params = [];
  if (type && type !== 'all') {
    clauses.push('type = ?');
    params.push(type);
  }
  if (postedBy) {
    clauses.push('postedBy = ?');
    params.push(postedBy);
  }
  if (category && category !== 'all') {
    clauses.push('category = ?');
    params.push(category);
  }
  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }
  if (query && query.trim()) {
    clauses.push('title LIKE ?');
    params.push(`%${query.trim()}%`);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export async function listItems(filters = {}) {
  await ensureReady();
  const db = await getDatabase();
  const { where, params } = buildWhere(filters);
  return db.getAllAsync(
    `SELECT * FROM lost_found_items ${where} ORDER BY createdAt DESC`,
    params
  );
}

export async function getItem(itemId) {
  await ensureReady();
  const db = await getDatabase();
  const item = await db.getFirstAsync('SELECT * FROM lost_found_items WHERE id = ?', [itemId]);
  if (!item) throw new Error(`Lost & Found item not found: ${itemId}`);
  return item;
}

export async function listClaimsForItem(itemId) {
  await ensureReady();
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM lost_found_claims WHERE itemId = ? ORDER BY createdAt DESC',
    [itemId]
  );
}

export async function createItem(data) {
  await ensureReady();
  const db = await getDatabase();
  const now = new Date().toISOString();
  const item = {
    id: Crypto.randomUUID(),
    description: '',
    photoUrl: '',
    contactPreference: 'app',
    contactValue: '',
    status: 'open',
    ...data,
    categoryLabel: categoryLabel(data.category),
    eventDate: data.eventDate ?? now,
    createdAt: now,
    updatedAt: now,
  };
  await db.runAsync(
    `INSERT INTO lost_found_items (${ITEM_COLUMNS.join(', ')}) VALUES (${ITEM_COLUMNS.map(() => '?').join(', ')})`,
    itemValues(item)
  );
  return item;
}

// Only content fields a poster may edit. `type`, `postedBy`, `status` and
// `createdAt` are structural/system fields and are deliberately not updatable
// here — changing them would rewrite what the post fundamentally is, or forge
// ownership/history.
const EDITABLE_COLUMNS = [
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

export async function updateItem(itemId, data) {
  await ensureReady();
  const db = await getDatabase();

  const patch = { ...data };
  // Keep categoryLabel consistent with category rather than trusting the caller.
  if (patch.category) patch.categoryLabel = categoryLabel(patch.category);

  const columns = EDITABLE_COLUMNS.filter((col) => patch[col] !== undefined);
  if (columns.length === 0) return getItem(itemId);

  const now = new Date().toISOString();
  const result = await db.runAsync(
    `UPDATE lost_found_items SET ${columns.map((c) => `${c} = ?`).join(', ')}, updatedAt = ?
     WHERE id = ?`,
    [...columns.map((c) => patch[c]), now, itemId]
  );
  if (result.changes === 0) {
    throw new Error(`Lost & Found item not found: ${itemId}`);
  }
  return getItem(itemId);
}

export async function deleteItem(itemId) {
  await ensureReady();
  const db = await getDatabase();
  // One transaction: an item removed while its claims survive would leave
  // orphan rows pointing at an id that no longer exists.
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM lost_found_claims WHERE itemId = ?', [itemId]);
    const result = await db.runAsync('DELETE FROM lost_found_items WHERE id = ?', [itemId]);
    if (result.changes === 0) {
      throw new Error(`Lost & Found item not found: ${itemId}`);
    }
  });
}

export async function claimItem(itemId, claimerUid, message, claimerName = '') {
  await ensureReady();
  const db = await getDatabase();
  const now = new Date().toISOString();
  const claim = {
    id: Crypto.randomUUID(),
    itemId,
    claimerUid,
    claimerName,
    message: message ?? '',
    createdAt: now,
  };
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO lost_found_claims (id, itemId, claimerUid, claimerName, message, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [claim.id, claim.itemId, claim.claimerUid, claim.claimerName, claim.message, claim.createdAt]
    );
    const result = await db.runAsync(
      `UPDATE lost_found_items SET status = 'claimed', updatedAt = ? WHERE id = ?`,
      [now, itemId]
    );
    if (result.changes === 0) {
      throw new Error(`Lost & Found item not found: ${itemId}`);
    }
  });
  return claim;
}

// Undo a resolve. A mistaken resolve is recoverable and low-risk: it only moves
// status back to 'open' and leaves existing claims intact, so nothing a claimer
// submitted is lost. (Editing content mid-claim stays blocked — that would
// change what people already claimed against.)
export async function reopenItem(itemId) {
  await ensureReady();
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `UPDATE lost_found_items SET status = 'open', updatedAt = ? WHERE id = ?`,
    [now, itemId]
  );
  if (result.changes === 0) {
    throw new Error(`Lost & Found item not found: ${itemId}`);
  }
}

export async function resolveItem(itemId) {
  await ensureReady();
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `UPDATE lost_found_items SET status = 'resolved', updatedAt = ? WHERE id = ?`,
    [now, itemId]
  );
  if (result.changes === 0) {
    throw new Error(`Lost & Found item not found: ${itemId}`);
  }
}
