#!/usr/bin/env npx tsx
/**
 * Firestore Seed Script
 *
 * Populates the Firestore emulator with test data for local development.
 * Run with: npx tsx scripts/db/seed.ts
 *
 * Prerequisites:
 *   - Firebase emulators running: firebase emulators:start
 *   - FIRESTORE_EMULATOR_HOST=localhost:8080 set in env
 *
 * @module scripts/db/seed
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// CONFIG
// ============================================================================

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

// Ensure we're pointing at the emulator, not production
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
  console.warn(`⚠️  FIRESTORE_EMULATOR_HOST not set — defaulting to ${EMULATOR_HOST}`);
}

// Safety guard: refuse to run against production
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !process.env.FIRESTORE_EMULATOR_HOST
) {
  console.error('🚫 Refusing to seed production Firestore. Set FIRESTORE_EMULATOR_HOST first.');
  process.exit(1);
}

// ============================================================================
// INIT
// ============================================================================

if (!getApps().length) {
  initializeApp({ projectId: 'idesaign-dev' });
}

const db = getFirestore();

// ============================================================================
// SEED DATA
// ============================================================================

const USERS = [
  {
    id: 'user-001',
    email: 'alice@idesaign.dev',
    displayName: 'Alice Designer',
    tier: 'pro',
    createdAt: Timestamp.fromDate(new Date('2025-06-01')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'user-002',
    email: 'bob@idesaign.dev',
    displayName: 'Bob Creator',
    tier: 'free',
    createdAt: Timestamp.fromDate(new Date('2025-07-15')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'user-003',
    email: 'carol@idesaign.dev',
    displayName: 'Carol Enterprise',
    tier: 'enterprise',
    createdAt: Timestamp.fromDate(new Date('2025-05-01')),
    updatedAt: Timestamp.now(),
  },
];

const PROJECTS = [
  {
    id: 'proj-001',
    name: 'Brand Identity Pack',
    userId: 'user-001',
    description: 'Logo and brand collateral for TopDog',
    width: 1920,
    height: 1080,
    createdAt: Timestamp.fromDate(new Date('2025-08-01')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'proj-002',
    name: 'Social Media Templates',
    userId: 'user-001',
    description: 'Instagram and Twitter post templates',
    width: 1080,
    height: 1080,
    createdAt: Timestamp.fromDate(new Date('2025-08-10')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'proj-003',
    name: 'Product Mockups',
    userId: 'user-002',
    description: 'T-shirt and mug mockups for store',
    width: 2400,
    height: 1600,
    createdAt: Timestamp.fromDate(new Date('2025-09-01')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'proj-004',
    name: 'Enterprise Dashboard',
    userId: 'user-003',
    description: 'Analytics dashboard screenshots',
    width: 1440,
    height: 900,
    createdAt: Timestamp.fromDate(new Date('2025-09-15')),
    updatedAt: Timestamp.now(),
  },
];

const COMMUNITY_POSTS = [
  {
    id: 'post-001',
    userId: 'user-001',
    title: 'My First AI Generation',
    description: 'Experimenting with style transfer on product photos',
    imageUrl: 'https://storage.googleapis.com/idesaign-dev/samples/post-001.png',
    likes: 12,
    createdAt: Timestamp.fromDate(new Date('2025-09-20')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'post-002',
    userId: 'user-002',
    title: 'Fantasy Football Logo',
    description: 'Used AI to generate a custom league logo',
    imageUrl: 'https://storage.googleapis.com/idesaign-dev/samples/post-002.png',
    likes: 34,
    createdAt: Timestamp.fromDate(new Date('2025-10-01')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'post-003',
    userId: 'user-003',
    title: 'Batch Export Workflow',
    description: 'Tips on using batch export for social media sizes',
    imageUrl: 'https://storage.googleapis.com/idesaign-dev/samples/post-003.png',
    likes: 8,
    createdAt: Timestamp.fromDate(new Date('2025-10-05')),
    updatedAt: Timestamp.now(),
  },
];

const COMMUNITY_PROMPTS = [
  {
    id: 'prompt-001',
    userId: 'user-001',
    title: 'Cinematic Portrait',
    prompt: 'cinematic portrait, dramatic lighting, shallow depth of field, 85mm lens',
    category: 'portrait',
    uses: 145,
    createdAt: Timestamp.fromDate(new Date('2025-08-15')),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'prompt-002',
    userId: 'user-002',
    title: 'Product on Marble',
    prompt: 'product photography, white marble surface, soft natural lighting, minimal',
    category: 'product',
    uses: 89,
    createdAt: Timestamp.fromDate(new Date('2025-09-01')),
    updatedAt: Timestamp.now(),
  },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedCollection(
  collectionName: string,
  items: Array<{ id: string; [key: string]: unknown }>,
): Promise<void> {
  const batch = db.batch();
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(db.collection(collectionName).doc(id), data);
  }
  await batch.commit();
  console.log(`  ✅ ${collectionName}: ${items.length} documents`);
}

async function clearCollection(collectionName: string): Promise<void> {
  const snapshot = await db.collection(collectionName).limit(500).get();
  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  🗑️  ${collectionName}: cleared ${snapshot.size} documents`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🌱 Seeding Firestore emulator...\n');
  console.log(`   Target: ${EMULATOR_HOST}\n`);

  // Clear existing data
  console.log('Clearing existing data...');
  await clearCollection('users');
  await clearCollection('user_projects');
  await clearCollection('community_posts');
  await clearCollection('community_prompts');
  console.log('');

  // Seed fresh data
  console.log('Seeding new data...');
  await seedCollection('users', USERS);
  await seedCollection('user_projects', PROJECTS);
  await seedCollection('community_posts', COMMUNITY_POSTS);
  await seedCollection('community_prompts', COMMUNITY_PROMPTS);

  console.log('\n✨ Seed complete!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
