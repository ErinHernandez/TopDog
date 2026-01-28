import * as fs from 'fs';

interface ReceivingStats {
  receptions?: number;
}

interface PlayerProjections {
  receiving?: ReceivingStats;
  fantasyPoints?: number;
}

interface PlayerData {
  name: string;
  position: string;
  clayProj?: number;
  clayProjections?: PlayerProjections;
}

interface ConversionRecord {
  name: string;
  position: string;
  receptions: number;
  originalPPR: number;
  halfPPR: number;
  reduction: number;
}

// Load current player pool
const content: string = fs.readFileSync('lib/playerPool.js', 'utf8');
const match: RegExpMatchArray | null = content.match(
  /export const PLAYER_POOL = (\[[\s\S]*?\]);/
);

if (!match) {
  throw new Error('Could not find PLAYER_POOL');
}

const pool: PlayerData[] = eval(match[1]);

console.log('=== CONVERTING ALL PPR PROJECTIONS TO HALF-PPR ===');
console.log('Formula: Half-PPR = PPR - (Receptions × 0.5)');

let convertedCount = 0;
const conversions: ConversionRecord[] = [];

pool.forEach((player) => {
  if (player.clayProj && player.clayProjections) {
    const originalPPR: number = player.clayProj;
    let receptions: number = 0;

    // Get receptions from receiving data
    if (player.clayProjections.receiving?.receptions) {
      receptions = player.clayProjections.receiving.receptions;
    }

    // Calculate half-PPR conversion
    const pprPenalty: number = receptions * 0.5;
    const halfPPR: number = originalPPR - pprPenalty;

    // Update the player's fantasy points
    player.clayProj = Math.round(halfPPR * 10) / 10; // Round to 1 decimal
    if (player.clayProjections) {
      player.clayProjections.fantasyPoints = player.clayProj;
    }

    // Track significant conversions for logging
    if (pprPenalty >= 5) {
      conversions.push({
        name: player.name,
        position: player.position,
        receptions: receptions,
        originalPPR: originalPPR,
        halfPPR: player.clayProj,
        reduction: pprPenalty
      });
    }

    convertedCount++;
  }
});

// Save updated player pool
const updatedPlayerPoolString: string = JSON.stringify(pool, null, 2);
const newPlayerPoolContent = `export const PLAYER_POOL = ${updatedPlayerPoolString};

// Function to group picks by position for easier display
export function groupPicksByPosition(picks: Array<{player: string}>) {
  const grouped: Record<string, PlayerData[]> = {
    QB: [],
    RB: [],
    WR: [],
    TE: []
  };

  picks.forEach(pick => {
    const player = PLAYER_POOL.find(p => p.name === pick.player);
    if (player && grouped[player.position]) {
      grouped[player.position].push(player);
    }
  });

  return grouped;
}
`;

fs.writeFileSync('lib/playerPool.js', newPlayerPoolContent);

console.log(`\n✅ CONVERTED ${convertedCount} players from PPR to Half-PPR!`);

console.log(`\n📊 BIGGEST REDUCTIONS (Top 15):`);
conversions
  .sort((a, b) => b.reduction - a.reduction)
  .slice(0, 15)
  .forEach((conv) => {
    console.log(
      `${conv.name} (${conv.position}): ${conv.originalPPR} → ${conv.halfPPR} (-${conv.reduction.toFixed(1)} pts, ${conv.receptions} rec)`
    );
  });

console.log(`\n🎯 All projections now reflect Half-PPR scoring!`);

// Verify some specific players mentioned
console.log(`\n📋 VERIFICATION:`);
const testPlayers: string[] = ['James Conner', 'Malik Nabers', 'Mark Andrews'];
testPlayers.forEach((playerName) => {
  const player = pool.find((p) => p.name === playerName);
  if (player && player.clayProjections) {
    const receptions = player.clayProjections.receiving?.receptions || 0;
    console.log(`${playerName}: ${player.clayProj} Half-PPR pts (${receptions} rec)`);
  }
});
