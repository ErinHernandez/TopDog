# Database Migrations Guide

**Last Updated:** January 2025  
**Status:** ✅ Migration system implemented

---

## Overview

The Firestore migration system provides version-controlled schema changes with rollback capability. This ensures safe, trackable database updates.

---

## Migration System Features

- ✅ **Version Control:** Track applied migrations in Firestore
- ✅ **Rollback Support:** Undo migrations if needed
- ✅ **Dry Run Mode:** Test migrations without applying
- ✅ **Transaction Safety:** Migrations run in transactions
- ✅ **Status Tracking:** Check current migration version

---

## Creating a Migration

### Step 1: Create Migration File

Create a new file in `lib/migrations/migrations/`:

```
lib/migrations/migrations/002_add_user_fields.ts
```

### Step 2: Define Migration

```typescript
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import { logger } from '../../structuredLogger';
import type { Migration } from '../migrationRunner';

export const migration002_add_user_fields: Migration = {
  version: 2,
  name: 'Add user profile fields',
  
  up: async (db: ReturnType<typeof getFirestore>) => {
    logger.info('[Migration 002] Starting: Add user profile fields');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const batch = writeBatch(db);
    let count = 0;
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.profile) {
        batch.update(doc.ref, {
          profile: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      logger.info(`[Migration 002] Updated ${count} user documents`);
    }
    
    logger.info('[Migration 002] Completed');
  },
  
  down: async (db: ReturnType<typeof getFirestore>) => {
    logger.info('[Migration 002] Rolling back');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const batch = writeBatch(db);
    let count = 0;
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.profile) {
        batch.update(doc.ref, { profile: deleteField() });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      logger.info(`[Migration 002] Rolled back ${count} user documents`);
    }
    
    logger.info('[Migration 002] Rollback completed');
  },
};
```

### Step 3: Register Migration

Add to `lib/migrations/index.ts`:

```typescript
import { migration002_add_user_fields } from './migrations/002_add_user_fields';

export const migrations: Array<import('./migrationRunner').Migration> = [
  migration002_add_user_fields,
];
```

---

## Running Migrations

### Via API (Recommended)

**Run Migrations:**
```bash
POST /api/migrations/run
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "dryRun": false
}
```

**Check Status:**
```bash
GET /api/migrations/status
Authorization: Bearer <admin-token>
```

### Via Code

```typescript
import { runMigrations, migrations } from '@/lib/migrations';

// Dry run first
const dryRunResults = await runMigrations(migrations, true);
console.log('Dry run results:', dryRunResults);

// Run for real
const results = await runMigrations(migrations, false);
console.log('Migration results:', results);
```

---

## Migration Best Practices

### 1. Always Test First

```typescript
// Always run dry run first
const dryRunResults = await runMigrations(migrations, true);
if (dryRunResults.some(r => !r.success)) {
  console.error('Dry run failed, fix issues before running');
  return;
}
```

### 2. Use Batch Writes

For large datasets, use batch writes:

```typescript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
let count = 0;
const BATCH_SIZE = 500; // Firestore limit

usersSnapshot.forEach((doc) => {
  batch.update(doc.ref, { /* changes */ });
  count++;
  
  if (count >= BATCH_SIZE) {
    await batch.commit();
    batch = writeBatch(db);
    count = 0;
  }
});

if (count > 0) {
  await batch.commit();
}
```

### 3. Handle Errors Gracefully

```typescript
up: async (db) => {
  try {
    // Migration logic
  } catch (error) {
    logger.error('Migration failed', error);
    throw error; // Will stop migration process
  }
},
```

### 4. Always Provide Rollback

```typescript
down: async (db) => {
  // Reverse the changes made in up()
  // This allows safe rollback if needed
},
```

### 5. Log Progress

```typescript
logger.info(`[Migration ${version}] Processing ${count} documents`);
logger.info(`[Migration ${version}] Completed successfully`);
```

---

## Migration Status

### Check Current Version

```typescript
import { getMigrationStatus } from '@/lib/migrations';

const status = await getMigrationStatus();
console.log('Current version:', status.currentVersion);
console.log('Applied migrations:', status.appliedMigrations);
```

### View Applied Migrations

The migration system stores status in Firestore:

```
Collection: _migrations
Document: current
Fields:
  - version: number
  - name: string
  - appliedAt: string
  - appliedBy: string
```

---

## Rollback

### Rollback Last Migration

```typescript
import { rollbackLastMigration, migrations } from '@/lib/migrations';

// Dry run first
const dryRunResult = await rollbackLastMigration(migrations, true);
console.log('Dry run rollback:', dryRunResult);

// Rollback for real
const result = await rollbackLastMigration(migrations, false);
console.log('Rollback result:', result);
```

### Via API

```bash
POST /api/migrations/rollback
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "dryRun": false
}
```

---

## Common Migration Patterns

### Adding a Field

```typescript
up: async (db) => {
  const snapshot = await getDocs(collection(db, 'collectionName'));
  const batch = writeBatch(db);
  
  snapshot.forEach((doc) => {
    if (!doc.data().newField) {
      batch.update(doc.ref, { newField: defaultValue });
    }
  });
  
  await batch.commit();
},
```

### Removing a Field

```typescript
up: async (db) => {
  const snapshot = await getDocs(collection(db, 'collectionName'));
  const batch = writeBatch(db);
  
  snapshot.forEach((doc) => {
    if (doc.data().oldField) {
      batch.update(doc.ref, { oldField: deleteField() });
    }
  });
  
  await batch.commit();
},
```

### Renaming a Field

```typescript
up: async (db) => {
  const snapshot = await getDocs(collection(db, 'collectionName'));
  const batch = writeBatch(db);
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.oldFieldName && !data.newFieldName) {
      batch.update(doc.ref, {
        newFieldName: data.oldFieldName,
        oldFieldName: deleteField(),
      });
    }
  });
  
  await batch.commit();
},
```

### Creating Indexes

```typescript
up: async (db) => {
  // Note: Firestore indexes are created via firestore.indexes.json
  // This migration can verify indexes exist or create composite indexes
  logger.info('Indexes should be created via firestore.indexes.json');
},
```

---

## Troubleshooting

### Migration Fails

1. Check logs for error details
2. Verify migration logic is correct
3. Test in development first
4. Use dry run mode

### Rollback Fails

1. Ensure `down()` function is implemented
2. Check that rollback logic is correct
3. Verify no concurrent migrations

### Version Mismatch

If you see "Migration version mismatch":
- Another process may have run migrations
- Check current version: `GET /api/migrations/status`
- Re-run migrations if needed

---

## Security

### Admin Access

Migrations should only be run by administrators:

```typescript
// In migration API routes
if (process.env.NODE_ENV === 'production') {
  // Verify admin access
  const isAdmin = await verifyAdminAccess(req.userId);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
}
```

### Environment Variables

Store migration credentials securely:
- Use environment variables for admin tokens
- Don't commit admin credentials
- Use Firebase Admin SDK for server-side operations

---

## Next Steps

1. Create your first migration using the example template
2. Test in development with dry run
3. Run migration in staging
4. Monitor results
5. Run in production

---

**Last Updated:** January 2025  
**See Also:** `lib/migrations/migrationRunner.ts` for implementation details
