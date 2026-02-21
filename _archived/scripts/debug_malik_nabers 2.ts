import * as fs from 'fs';
import type { PlayerPoolEntry } from '@/types/player';

interface ClayProjection {
  name: string;
  fantasy_points: number;
  position: string;
  position_rank: number;
}

// Load clay projections
const clayProjections: ClayProjection[] = JSON.parse(
  fs.readFileSync('clay_projections_final.json', 'utf8')
);

// Load current player pool
const playerPoolContent: string = fs.readFileSync('lib/playerPool.js', 'utf8');
const playerPoolMatch: RegExpMatchArray | null = playerPoolContent.match(
  /export const PLAYER_POOL = (\[[\s\S]*?\]);/
);

if (!playerPoolMatch) {
  throw new Error('Could not find PLAYER_POOL in playerPool.js');
}

const currentPlayerPool: PlayerPoolEntry[] = eval(playerPoolMatch[1]!);

console.log('=== DEBUGGING MALIK NABERS ISSUE ===');

// Check if Malik Nabers is in clay data
const malikInClay = clayProjections.find((p) => p.name === 'Malik Nabers');
console.log('Malik Nabers in clay data:', !!malikInClay);
if (malikInClay) {
  console.log('  Fantasy points:', malikInClay.fantasy_points);
  console.log('  Position:', malikInClay.position);
  console.log('  Rank:', malikInClay.position_rank);
}

// Check if Malik Nabers is in player pool
const malikInPool = currentPlayerPool.find((p) => p.name === 'Malik Nabers');
console.log('Malik Nabers in player pool:', !!malikInPool);
if (malikInPool) {
  console.log('  clay_proj:', (malikInPool as unknown as Record<string, unknown>).clay_proj);
  console.log('  clay_projections:', !!(malikInPool as unknown as Record<string, unknown>).clay_projections);
}

// Let's try fuzzy matching to see if there's a name variation
console.log('\n=== FUZZY MATCHING SEARCH ===');
const clayNames: string[] = clayProjections.map((p) => p.name);
const malikMatches: string[] = clayNames.filter(
  (name) => name.toLowerCase().includes('malik') && name.toLowerCase().includes('nab')
);
console.log('Fuzzy matches:', malikMatches);

// Check all clay players that might be Malik
const possibleMaliks: ClayProjection[] = clayProjections.filter(
  (p) =>
    p.name.toLowerCase().includes('malik') ||
    p.name.toLowerCase().includes('nabers') ||
    (p.position === 'WR' && p.fantasy_points > 150 && p.fantasy_points < 300)
);

console.log('\nPossible Malik Nabers candidates:');
possibleMaliks.forEach((p) => {
  console.log(
    `- "${p.name}" (${p.position}): ${p.fantasy_points} pts, rank ${p.position_rank}`
  );
});

// Let's check if our update script has a bug
console.log('\n=== CHECKING INTEGRATION LOGIC ===');
const clayMap: Record<string, ClayProjection> = {};
clayProjections.forEach((player) => {
  clayMap[player.name] = player;
});

const clayDataForMalik: ClayProjection | undefined = clayMap['Malik Nabers'];
console.log('Clay map lookup for "Malik Nabers":', !!clayDataForMalik);

if (clayDataForMalik) {
  console.log('SUCCESS: Malik Nabers found in clay map');
  console.log('  Fantasy points:', clayDataForMalik.fantasy_points);
} else {
  console.log('ISSUE: Malik Nabers NOT found in clay map');
  console.log('Available clay names containing "Malik":');
  Object.keys(clayMap)
    .filter((name) => name.toLowerCase().includes('malik'))
    .forEach((name) => {
      console.log('  -', JSON.stringify(name));
    });
}
