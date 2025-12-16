#!/usr/bin/env node

// Test column mapping for Falcons data
const testLine = "TE Feleipe Franks 17 0 0 0 0 0 0 0 0 0 3 2 18 0 4 93";

console.log('=== TESTING COLUMN MAPPING ===');
console.log(`Test line: "${testLine}"`);

const parts = testLine.trim().split(/\s+/);
console.log(`Parts: [${parts.join(', ')}]`);

// Expected format: Pos Player Games Att Comp Yds TD INT Sk Att Yds TD Tgt Rec Yd TD Pts Rk
console.log('\nColumn mapping:');
console.log(`Position: ${parts[0]}`);
console.log(`Player: ${parts[1]} ${parts[2]}`);
console.log(`Games: ${parts[3]}`);
console.log(`Passing Att: ${parts[4]}`);
console.log(`Passing Comp: ${parts[5]}`);
console.log(`Passing Yds: ${parts[6]}`);
console.log(`Passing TD: ${parts[7]}`);
console.log(`Passing INT: ${parts[8]}`);
console.log(`Sacks: ${parts[9]}`);
console.log(`Rush Att: ${parts[10]}`);
console.log(`Rush Yds: ${parts[11]}`);
console.log(`Rush TD: ${parts[12]}`);
console.log(`Targets: ${parts[13]}`);
console.log(`Receptions: ${parts[14]}`);
console.log(`Rec Yds: ${parts[15]}`);
console.log(`Rec TD: ${parts[16]}`);
console.log(`Fantasy Pts: ${parts[17]}`);
console.log(`Rank: ${parts[18]}`);

// For Feleipe Franks, this should be:
// TE Feleipe Franks 17 0 0 0 0 0 0 0 0 0 3 2 18 0 4 93
// Expected: targets=3, receptions=2, yards=18, TDs=0, points=4, rank=93 