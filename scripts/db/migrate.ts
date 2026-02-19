#!/usr/bin/env npx tsx
/**
 * Firestore Migration Runner
 *
 * Applies schema migrations to Firestore documents. Each migration is a
 * function that reads existing documents and updates them with new fields,
 * renames, or structural changes.
 *
 * Migrations are idempotent — safe to run multiple times.
 *
 * Run with: npx tsx scripts/db/migrate.ts [migration-name]
 * List available: npx tsx scripts/db/migrate.ts --list
 *
 * @module scripts/db/migrate
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// INIT
// ============================================================================

if (!getApps().length) {
  initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'idesaign-dev',
  });
}

const db = getFirestore();

// ============================================================================
// MIGRATION REGISTRY
// ============================================================================

interface Migration {
  name: string;
  description: string;
  createdAt: string;
  run: () => Promise<{ updated: number; skipped: number }>;
}

const migrations: Migration[] = [
  {
    name: '001-add-tier-to-users',
    description: 'Add default tier field to users missing it',
    createdAt: '2025-10-01',
    async run() {
      let updated = 0;
      let skipped = 0;

      const snapshot = await db.collection('users').get();
      const batch = db.batch();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.tier) {
          batch.update(doc.ref, { tier: 'free', updatedAt: Timestamp.now() });
          updated++;
        } else {
          skipped++;
        }
      }

      if (updated > 0) await batch.commit();
      return { updated, skipped };
    },
  },
  {
    name: '002-add-dimensions-to-projects',
    description: 'Add default width/height to projects missing dimensions',
    createdAt: '2025-10-15',
    async run() {
      let updated = 0;
      let skipped = 0;

      const snapshot = await db.collection('user_projects').get();
      const batch = db.batch();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.width || !data.height) {
          batch.update(doc.ref, {
            width: data.width || 1920,
            height: data.height || 1080,
            updatedAt: Timestamp.now(),
          });
          updated++;
        } else {
          skipped++;
        }
      }

      if (updated > 0) await batch.commit();
      return { updated, skipped };
    },
  },
  {
    name: '003-normalize-community-timestamps',
    description: 'Convert Date objects to Firestore Timestamps in community collections',
    createdAt: '2025-11-01',
    async run() {
      let updated = 0;
      let skipped = 0;

      const collections = ['community_posts', 'community_chains', 'community_prompts'];

      for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        const batch = db.batch();

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const needsUpdate =
            data.createdAt && !(data.createdAt instanceof Timestamp) ||
            data.updatedAt && !(data.updatedAt instanceof Timestamp);

          if (needsUpdate) {
            const updates: Record<string, unknown> = {};
            if (data.createdAt && !(data.createdAt instanceof Timestamp)) {
              updates.createdAt = Timestamp.fromDate(new Date(data.createdAt));
            }
            if (data.updatedAt && !(data.updatedAt instanceof Timestamp)) {
              updates.updatedAt = Timestamp.fromDate(new Date(data.updatedAt));
            }
            batch.update(doc.ref, updates);
            updated++;
          } else {
            skipped++;
          }
        }

        await batch.commit();
      }

      return { updated, skipped };
    },
  },
];

// ============================================================================
// RUNNER
// ============================================================================

async function runMigration(migration: Migration): Promise<void> {
  console.log(`\n▶️  Running: ${migration.name}`);
  console.log(`   ${migration.description}`);

  const start = Date.now();
  const result = await migration.run();
  const duration = Date.now() - start;

  console.log(`   ✅ Done in ${duration}ms — ${result.updated} updated, ${result.skipped} skipped`);

  // Record migration in Firestore
  await db.collection('_migrations').doc(migration.name).set({
    name: migration.name,
    description: migration.description,
    ranAt: Timestamp.now(),
    duration,
    result,
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log('\n📋 Available migrations:\n');
    for (const m of migrations) {
      console.log(`  ${m.name} — ${m.description} (${m.createdAt})`);
    }
    console.log('');
    process.exit(0);
  }

  const targetName = args[0];

  console.log('\n🔄 Firestore Migration Runner\n');

  if (targetName) {
    const migration = migrations.find(m => m.name === targetName);
    if (!migration) {
      console.error(`❌ Migration not found: ${targetName}`);
      console.error(`   Use --list to see available migrations`);
      process.exit(1);
    }
    await runMigration(migration);
  } else {
    // Run all migrations in order
    console.log(`Running all ${migrations.length} migrations...`);
    for (const migration of migrations) {
      await runMigration(migration);
    }
  }

  console.log('\n✨ Migrations complete!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
