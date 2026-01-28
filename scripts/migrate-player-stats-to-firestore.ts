#!/usr/bin/env npx ts-node
/**
 * Migration Script: Static Player Stats to Firestore
 *
 * This script migrates player statistics from the static bundle (staticPlayerStats.js.bak)
 * to Firestore for dynamic loading with edge caching.
 *
 * Usage:
 *   npx ts-node scripts/migrate-player-stats-to-firestore.ts
 *
 * Or with npm:
 *   npm run migrate:player-stats
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 500; // Firestore batch write limit
const COLLECTION_NAME = 'playerStats';
const METADATA_DOC = 'playerStatsMetadata/current';

// ============================================================================
// TYPES (inline for script portability)
// ============================================================================

interface PassingStats {
  attempts: number | null;
  completions: number | null;
  yards: number;
  touchdowns: number;
  interceptions: number | null;
  sacks: number | null;
}

interface RushingStats {
  attempts: number | null;
  yards: number;
  touchdowns: number;
  fumbles: number | null;
  yardsPerAttempt: number | null;
}

interface ReceivingStats {
  targets: number | null;
  receptions: number | null;
  yards: number;
  touchdowns: number;
  fumbles: number | null;
  yardsPerReception: number | null;
}

interface ScrimmageStats {
  touches: number | null;
  yards: number;
  touchdowns: number;
}

interface FantasyStats {
  points: number;
  ppr_points: number;
}

interface SeasonStats {
  year: number;
  games: number;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  scrimmage: ScrimmageStats;
  fantasy: FantasyStats;
}

interface CareerStats {
  games: number;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  scrimmage: ScrimmageStats;
  fantasy: FantasyStats;
}

interface LegacyPlayerStats {
  name: string;
  position: string;
  team: string;
  seasons: SeasonStats[];
  career: CareerStats;
  databaseId?: string;
  draftkingsRank?: number;
  draftkingsADP?: number;
  clayRank?: number;
  clayLastUpdated?: string;
}

interface LegacyStaticPlayerStatsData {
  metadata: {
    generatedAt: string;
    totalPlayers: number;
    successfulFetches: number;
    failedFetches: number;
    version: string;
    source: string;
  };
  players: Record<string, LegacyPlayerStats>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize player name for use as Firestore document ID
 */
function normalizePlayerId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * Validate position is one of the allowed values
 */
function validatePosition(position: string): 'QB' | 'RB' | 'WR' | 'TE' {
  const validPositions = ['QB', 'RB', 'WR', 'TE'];
  if (validPositions.includes(position)) {
    return position as 'QB' | 'RB' | 'WR' | 'TE';
  }
  console.warn(`⚠️ Invalid position '${position}', defaulting to 'WR'`);
  return 'WR';
}

/**
 * Calculate projected fantasy points from career stats
 */
function calculateProjectedPoints(player: LegacyPlayerStats): number {
  const career = player.career;
  if (!career || !career.fantasy) return 0;

  // Use PPR points as projected points (could be enhanced with more logic)
  return career.fantasy.ppr_points || career.fantasy.points || 0;
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function migratePlayerStats(): Promise<void> {
  console.log('🚀 Starting Player Stats Migration to Firestore...\n');

  // Step 1: Initialize Firebase Admin
  console.log('📦 Initializing Firebase Admin SDK...');

  // Check for service account key
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH ||
    path.join(process.cwd(), 'service-account-key.json');

  let serviceAccount: ServiceAccount | undefined;
  let useApplicationDefault = false;

  if (fs.existsSync(serviceAccountPath)) {
    console.log(`   Found service account key at: ${serviceAccountPath}`);
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('   Using service account from FIREBASE_SERVICE_ACCOUNT environment variable');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('   Using service account from FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    console.log('   No service account key found, trying Application Default Credentials (Firebase CLI)...');
    useApplicationDefault = true;
  }

  try {
    if (useApplicationDefault) {
      console.log('   Using Application Default Credentials (Firebase CLI authentication)');
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      if (!serviceAccount) {
        console.error('❌ Error: Service account is undefined');
        process.exit(1);
      }
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
    console.log('   ✅ Firebase Admin SDK initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }

  const db = getFirestore();

  // Step 2: Load static player stats
  console.log('📂 Loading static player stats...');
  const staticStatsPath = path.join(process.cwd(), 'lib', 'staticPlayerStats.js.bak');

  if (!fs.existsSync(staticStatsPath)) {
    console.error(`❌ Error: Static player stats file not found at: ${staticStatsPath}`);
    process.exit(1);
  }

  // Read and parse the static stats file
  const fileContent = fs.readFileSync(staticStatsPath, 'utf8');

  // Extract the JSON object from the JS export
  // Find the start of the object
  const startMatch = fileContent.match(/export\s+const\s+STATIC_PLAYER_STATS\s*=\s*({)/);
  if (!startMatch) {
    console.error('❌ Error: Could not find STATIC_PLAYER_STATS export in file');
    process.exit(1);
  }

  const startIndex = startMatch.index! + startMatch[0].length - 1; // Position after opening brace
  
  // Find the matching closing brace
  let braceCount = 0;
  let endIndex = startIndex;
  for (let i = startIndex; i < fileContent.length; i++) {
    if (fileContent[i] === '{') braceCount++;
    if (fileContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (braceCount !== 0) {
    console.error('❌ Error: Could not find matching closing brace for STATIC_PLAYER_STATS');
    process.exit(1);
  }

  const objectString = fileContent.substring(startIndex, endIndex);

  let staticData: LegacyStaticPlayerStatsData;
  try {
    // Parse the object string as JSON
    staticData = JSON.parse(objectString);
  } catch (error) {
    // If JSON.parse fails, try eval as fallback (for JS object syntax)
    try {
      // eslint-disable-next-line no-eval
      staticData = eval(`(${objectString})`);
    } catch (evalError) {
      console.error('❌ Error parsing static player stats:', error);
      console.error('   JSON parse error:', error);
      console.error('   Eval error:', evalError);
      process.exit(1);
    }
  }

  const players = Object.values(staticData.players);
  console.log(`   Found ${players.length} players to migrate\n`);

  // Step 3: Migrate players in batches
  console.log('🔄 Migrating players to Firestore...');

  let successCount = 0;
  let failCount = 0;
  const now = Timestamp.now();
  const positionCounts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };

  // Process in batches
  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch: WriteBatch = db.batch();
    const batchPlayers = players.slice(i, i + BATCH_SIZE);

    for (const player of batchPlayers) {
      try {
        const playerId = normalizePlayerId(player.name);
        const position = validatePosition(player.position);
        positionCounts[position]++;

        const docRef = db.collection(COLLECTION_NAME).doc(playerId);

        const playerDoc = {
          id: playerId,
          name: player.name,
          position,
          team: player.team,
          seasons: player.seasons || [],
          career: player.career || {
            games: 0,
            passing: { attempts: null, completions: null, yards: 0, touchdowns: 0, interceptions: null, sacks: null },
            rushing: { attempts: null, yards: 0, touchdowns: 0, fumbles: null, yardsPerAttempt: null },
            receiving: { targets: null, receptions: null, yards: 0, touchdowns: 0, fumbles: null, yardsPerReception: null },
            scrimmage: { touches: null, yards: 0, touchdowns: 0 },
            fantasy: { points: 0, ppr_points: 0 },
          },
          draftkingsRank: player.draftkingsRank || null,
          draftkingsADP: player.draftkingsADP || null,
          clayRank: player.clayRank || null,
          projectedPoints: calculateProjectedPoints(player),
          databaseId: player.databaseId || null,
          clayLastUpdated: player.clayLastUpdated || null,
          updatedAt: now,
        };

        batch.set(docRef, playerDoc, { merge: true });
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error preparing ${player.name}:`, error);
        failCount++;
      }
    }

    // Commit the batch
    try {
      await batch.commit();
      const progress = Math.min(i + BATCH_SIZE, players.length);
      console.log(`   ✅ Batch ${Math.ceil((i + 1) / BATCH_SIZE)} complete: ${progress}/${players.length} players`);
    } catch (error) {
      console.error(`   ❌ Batch commit failed:`, error);
      failCount += batchPlayers.length;
      successCount -= batchPlayers.length;
    }
  }

  // Step 4: Update metadata document
  console.log('\n📝 Updating metadata document...');

  const metadataDoc = {
    version: staticData.metadata.version || '5.0',
    totalPlayers: successCount,
    lastUpdated: now,
    source: 'Migration from staticPlayerStats.js.bak',
    successfulMigrations: successCount,
    failedMigrations: failCount,
    positionCounts,
  };

  try {
    await db.doc(METADATA_DOC).set(metadataDoc);
    console.log('   ✅ Metadata document updated\n');
  } catch (error) {
    console.error('   ❌ Failed to update metadata:', error);
  }

  // Step 5: Summary
  console.log('═'.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Total Players:      ${players.length}`);
  console.log(`   Successfully Migrated: ${successCount}`);
  console.log(`   Failed:             ${failCount}`);
  console.log('');
  console.log('   Position Breakdown:');
  console.log(`     QB: ${positionCounts.QB}`);
  console.log(`     RB: ${positionCounts.RB}`);
  console.log(`     WR: ${positionCounts.WR}`);
  console.log(`     TE: ${positionCounts.TE}`);
  console.log('═'.repeat(60));

  if (failCount === 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('   Next steps:');
    console.log('   1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
    console.log('   2. Create API endpoints: /api/players/stats');
    console.log('   3. Update client hooks to use new API');
  } else {
    console.log('\n⚠️ Migration completed with some failures.');
    console.log('   Review the errors above and re-run if needed.');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the migration
migratePlayerStats().catch((error) => {
  console.error('❌ Unhandled error during migration:', error);
  process.exit(1);
});
