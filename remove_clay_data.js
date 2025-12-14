const fs = require('fs');
const path = require('path');

// Read the player pool file
const playerPoolPath = path.join(__dirname, 'lib', 'playerPool.js');
let content = fs.readFileSync(playerPoolPath, 'utf8');

// Remove all Clay-related fields from each player object
let updatedContent = content.replace(/"clayProj":\s*\d+,?\s*/g, '');
updatedContent = updatedContent.replace(/"clayRank":\s*\d+,?\s*/g, '');
updatedContent = updatedContent.replace(/"clayGames":\s*\d+,?\s*/g, '');
updatedContent = updatedContent.replace(/"clayProjections":\s*\{[^}]*\},?\s*/g, '');
updatedContent = updatedContent.replace(/"clayLastUpdated":\s*"[^"]*",?\s*/g, '');

// Clean up any trailing commas
updatedContent = updatedContent.replace(/,(\s*[}\]])/g, '$1');

// Write the updated content back
fs.writeFileSync(playerPoolPath, updatedContent);

console.log('Removed all Clay-related fields from player pool');
