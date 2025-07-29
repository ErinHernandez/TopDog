const fs = require('fs');
const path = require('path');
const csvPath = path.join(__dirname, '../Best-Ball-2025---DK-Ranks-22.csv');

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');

const nameIdx = headers.indexOf('Name');
const posIdx = headers.indexOf('Position');
const teamIdx = headers.indexOf('Team');
const byeIdx = headers.indexOf('Bye');
const adpIdx = headers.indexOf('ADP');

const players = lines.slice(1).map(line => {
  const cols = line.split(',');
  return {
    name: cols[nameIdx],
    position: cols[posIdx],
    team: cols[teamIdx],
    bye: cols[byeIdx] ? Number(cols[byeIdx]) : null,
    adp: cols[adpIdx] ? Number(cols[adpIdx]) : null,
  };
});

console.log('export const PLAYER_POOL = ' + JSON.stringify(players, null, 2) + ';'); 