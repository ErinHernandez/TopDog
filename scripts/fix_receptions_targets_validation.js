const fs = require('fs');
const path = require('path');

async function fixReceptionsTargetsValidation() {
  console.log('🔍 Checking for receptions > targets data errors...');
  
  // Load the player database
  const databasePath = path.join(__dirname, '../data/playerDatabase.json');
  const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Check all players for data validation issues
  Object.values(database.players).forEach(positionPlayers => {
    positionPlayers.forEach(player => {
      if (player.clayProjections?.receiving) {
        const receiving = player.clayProjections.receiving;
        const receptions = receiving.receptions || 0;
        const targets = receiving.targets || 0;
        
        // Check if receptions > targets (impossible)
        if (receptions > targets && targets > 0) {
          console.log(`❌ ${player.name}: ${receptions} receptions > ${targets} targets`);
          errorCount++;
          
          // Fix by setting receptions equal to targets
          receiving.receptions = targets;
          receiving.validationNote = `Fixed: receptions cannot exceed targets (was ${receptions}, set to ${targets})`;
          fixedCount++;
        }
        
        // Check if targets is 0 but receptions > 0 (impossible)
        if (targets === 0 && receptions > 0) {
          console.log(`❌ ${player.name}: ${receptions} receptions with 0 targets`);
          errorCount++;
          
          // Fix by setting receptions to 0
          receiving.receptions = 0;
          receiving.validationNote = `Fixed: receptions cannot be > 0 with 0 targets (was ${receptions}, set to 0)`;
          fixedCount++;
        }
      }
    });
  });
  
  if (errorCount === 0) {
    console.log('✅ No receptions > targets errors found!');
  } else {
    console.log(`\n🔧 Fixed ${fixedCount} data validation errors`);
    
    // Save the updated database
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
    console.log('💾 Updated player database saved');
  }
  
  // Also check for other impossible stats
  console.log('\n🔍 Checking for other impossible stats...');
  let otherErrors = 0;
  
  Object.values(database.players).forEach(positionPlayers => {
    positionPlayers.forEach(player => {
      if (player.clayProjections?.rushing) {
        const rushing = player.clayProjections.rushing;
        const attempts = rushing.attempts || 0;
        const yards = rushing.yards || 0;
        
        // Check if yards > 0 but attempts = 0 (impossible)
        if (attempts === 0 && yards > 0) {
          console.log(`❌ ${player.name}: ${yards} rushing yards with 0 attempts`);
          rushing.yards = 0;
          rushing.validationNote = `Fixed: yards cannot be > 0 with 0 attempts (was ${yards}, set to 0)`;
          otherErrors++;
        }
      }
      
      if (player.clayProjections?.receiving) {
        const receiving = player.clayProjections.receiving;
        const receptions = receiving.receptions || 0;
        const yards = receiving.yards || 0;
        
        // Check if yards > 0 but receptions = 0 (impossible)
        if (receptions === 0 && yards > 0) {
          console.log(`❌ ${player.name}: ${yards} receiving yards with 0 receptions`);
          receiving.yards = 0;
          receiving.validationNote = `Fixed: yards cannot be > 0 with 0 receptions (was ${yards}, set to 0)`;
          otherErrors++;
        }
      }
    });
  });
  
  if (otherErrors > 0) {
    console.log(`🔧 Fixed ${otherErrors} other data validation errors`);
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
  } else {
    console.log('✅ No other impossible stats found!');
  }
  
  console.log('\n🎯 Data validation complete!');
}

fixReceptionsTargetsValidation().catch(console.error); 