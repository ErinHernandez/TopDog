#!/usr/bin/env node

export {}; // Force ES module scope to prevent variable redeclaration errors

// Test Bijan Robinson's data
const testLine: string = "RB Bijan Robinson 17 0 0 0 0 0 0 303 1422 12 79 62 490 2 336 1";

console.log('=== TESTING BIJAN ROBINSON DATA ===');
console.log(`Test line: "${testLine}"`);

const parts: string[] = testLine.trim().split(/\s+/);
console.log(`Parts: [${parts.join(', ')}]`);

// Expected format: RB Bijan Robinson 17 0 0 0 0 0 0 303 1422 12 79 62 490 2 336 1
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

// For Bijan Robinson, this should be:
// RB Bijan Robinson 17 0 0 0 0 0 0 303 1422 12 79 62 490 2 336 1
// Expected: targets=79, receptions=62, yards=490, TDs=2, points=336, rank=1
