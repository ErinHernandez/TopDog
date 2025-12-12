/**
 * Data Manager for Player Database
 * Utilities for adding historical stats, ADP, rankings, etc.
 */

const fs = require('fs');
const path = require('path');

class DataManager {
  constructor(databasePath = '../data/playerDatabase.json') {
    this.databasePath = path.resolve(__dirname, databasePath);
    this.database = null;
    this.loadDatabase();
  }

  loadDatabase() {
    try {
      if (fs.existsSync(this.databasePath)) {
        const rawData = fs.readFileSync(this.databasePath, 'utf8');
        this.database = JSON.parse(rawData);
        console.log(`✅ Loaded database with ${this.getTotalPlayers()} players`);
      } else {
        console.log('⚠️  Database not found, creating new one');
        this.database = this.createEmptyDatabase();
      }
    } catch (error) {
      console.error('❌ Error loading database:', error);
      this.database = this.createEmptyDatabase();
    }
  }

  createEmptyDatabase() {
    return {
      meta: {
        lastUpdated: new Date().toISOString(),
        sources: {
          projections: [],
          historical: [],
          adp: [],
          rankings: []
        },
        season: 2025
      },
      players: {
        QB: [],
        RB: [],
        WR: [],
        TE: []
      }
    };
  }

  saveDatabase() {
    try {
      // Update timestamp
      this.database.meta.lastUpdated = new Date().toISOString();
      
      // Create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = this.databasePath.replace('.json', `_backup_${timestamp}.json`);
      
      if (fs.existsSync(this.databasePath)) {
        fs.copyFileSync(this.databasePath, backupPath);
      }
      
      // Save main database
      fs.writeFileSync(this.databasePath, JSON.stringify(this.database, null, 2));
      console.log(`✅ Database saved successfully`);
      console.log(`📁 Backup created: ${path.basename(backupPath)}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving database:', error);
      return false;
    }
  }

  // Find player by name (fuzzy matching)
  findPlayer(searchName, position = null) {
    const normalizedSearch = searchName.toLowerCase().trim();
    
    const searchPositions = position ? [position] : ['QB', 'RB', 'WR', 'TE'];
    
    for (const pos of searchPositions) {
      const players = this.database.players[pos] || [];
      
      // Exact match first
      let found = players.find(p => p.name.toLowerCase() === normalizedSearch);
      if (found) return found;
      
      // Partial match
      found = players.find(p => p.name.toLowerCase().includes(normalizedSearch));
      if (found) return found;
      
      // Last name match
      const searchLastName = normalizedSearch.split(' ').pop();
      found = players.find(p => p.name.toLowerCase().includes(searchLastName));
      if (found) return found;
    }
    
    return null;
  }

  // Add historical stats for a player
  addHistoricalStats(playerName, year, stats) {
    const player = this.findPlayer(playerName);
    if (!player) {
      console.log(`❌ Player not found: ${playerName}`);
      return false;
    }

    if (!player.historical) {
      player.historical = {};
    }

    if (!player.historical[year]) {
      player.historical[year] = {
        fantasyPoints: null,
        games: null,
        passing: {},
        rushing: {},
        receiving: {}
      };
    }

    // Merge stats
    Object.assign(player.historical[year], stats);
    
    console.log(`✅ Added ${year} stats for ${player.name}`);
    return true;
  }

  // Add ADP data
  addADPData(playerName, adp, source = 'Unknown') {
    const player = this.findPlayer(playerName);
    if (!player) {
      console.log(`❌ Player not found: ${playerName}`);
      return false;
    }

    if (!player.draft) {
      player.draft = {
        adp: null,
        adpSource: '',
        expertRankings: {
          overall: null,
          position: null
        }
      };
    }

    player.draft.adp = adp;
    player.draft.adpSource = source;
    
    console.log(`✅ Added ADP ${adp} for ${player.name} (${source})`);
    return true;
  }

  // Batch import from CSV with validation
  importFromCSV(csvFilePath, dataType = 'historical', year = 2024) {
    try {
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      let imported = 0;
      let errors = 0;
      const duplicateRanks = new Set();
      const usedRanks = new Set();
      const validationErrors = [];

      console.log(`📊 Importing ${dataType} data from ${path.basename(csvFilePath)}`);
      console.log(`📋 Headers: ${headers.join(', ')}`);
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowNum = i + 1;
        
        // Validate row completeness
        if (values.length < headers.length) {
          validationErrors.push(`Row ${rowNum}: Incomplete data (${values.length}/${headers.length} columns)`);
          errors++;
          continue;
        }

        const rowData = {};
        headers.forEach((header, idx) => {
          rowData[header] = values[idx];
        });

        const playerName = values[0];
        
        // Validate player name
        if (!playerName || playerName.trim() === '') {
          validationErrors.push(`Row ${rowNum}: Missing player name`);
          errors++;
          continue;
        }
        
        if (dataType === 'historical') {
          if (this.addHistoricalStats(playerName, year, rowData)) {
            imported++;
          } else {
            errors++;
          }
        } else if (dataType === 'adp') {
          const adp = parseFloat(values[1]);
          
          // Validate ADP value
          if (isNaN(adp) || adp <= 0) {
            validationErrors.push(`Row ${rowNum}: Invalid ADP "${values[1]}" for ${playerName}`);
            errors++;
            continue;
          }
          
          // Check for duplicate ranks
          const rank = Math.round(adp);
          if (usedRanks.has(rank)) {
            duplicateRanks.add(rank);
            validationErrors.push(`Row ${rowNum}: Duplicate rank ${rank} for ${playerName}`);
          } else {
            usedRanks.add(rank);
          }
          
          const source = rowData.source || 'CSV Import';
          if (this.addADPData(playerName, adp, source)) {
            imported++;
          } else {
            errors++;
          }
        }
      }

      // Report validation issues
      if (validationErrors.length > 0) {
        console.warn('⚠️ Validation Errors Found:');
        validationErrors.slice(0, 10).forEach(error => console.warn(`  ${error}`));
        if (validationErrors.length > 10) {
          console.warn(`  ... and ${validationErrors.length - 10} more errors`);
        }
      }
      
      if (duplicateRanks.size > 0) {
        console.error(`🚨 DATA QUALITY ISSUE: Duplicate ranks detected: ${Array.from(duplicateRanks).join(', ')}`);
      }

      console.log(`✅ Import complete: ${imported} successful, ${errors} errors, ${duplicateRanks.size} duplicate ranks`);
      return { 
        imported, 
        errors, 
        duplicateRanks: Array.from(duplicateRanks),
        validationErrors 
      };
    } catch (error) {
      console.error('❌ Error importing CSV:', error);
      return { imported: 0, errors: 1, duplicateRanks: [], validationErrors: [error.message] };
    }
  }

  // Generate stats report
  generateStatsReport() {
    const report = {
      totalPlayers: this.getTotalPlayers(),
      byPosition: {},
      dataCoverage: {
        projections: 0,
        historical2024: 0,
        historical2023: 0,
        adp: 0
      }
    };

    ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
      const players = this.database.players[pos] || [];
      report.byPosition[pos] = players.length;

      players.forEach(player => {
        if (player.projections?.mikeClay?.fantasyPoints > 0) {
          report.dataCoverage.projections++;
        }
        if (player.historical?.['2024']?.fantasyPoints) {
          report.dataCoverage.historical2024++;
        }
        if (player.historical?.['2023']?.fantasyPoints) {
          report.dataCoverage.historical2023++;
        }
        if (player.draft?.adp) {
          report.dataCoverage.adp++;
        }
      });
    });

    return report;
  }

  getTotalPlayers() {
    return Object.values(this.database.players).reduce((total, posPlayers) => 
      total + (posPlayers?.length || 0), 0);
  }

  // Utility to add team info to all players
  addTeamInfo(teamMappings) {
    let updated = 0;
    
    Object.keys(teamMappings).forEach(playerName => {
      const player = this.findPlayer(playerName);
      if (player) {
        player.team = teamMappings[playerName];
        updated++;
      }
    });

    console.log(`✅ Updated team info for ${updated} players`);
    return updated;
  }

  // Search and filter utilities
  getTopPlayers(position, count = 10, sortBy = 'mikeClay') {
    const players = this.database.players[position] || [];
    
    return players
      .filter(p => p.projections?.[sortBy]?.fantasyPoints > 0)
      .sort((a, b) => b.projections[sortBy].fantasyPoints - a.projections[sortBy].fantasyPoints)
      .slice(0, count);
  }

  // Export filtered data
  exportPlayerData(filters = {}) {
    const allPlayers = [];
    
    ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
      const players = this.database.players[pos] || [];
      players.forEach(player => {
        if (this.matchesFilters(player, filters)) {
          allPlayers.push(player);
        }
      });
    });

    return allPlayers;
  }

  matchesFilters(player, filters) {
    if (filters.position && player.position !== filters.position) return false;
    if (filters.team && player.team !== filters.team) return false;
    if (filters.minProjection && 
        (!player.projections?.mikeClay?.fantasyPoints || 
         player.projections.mikeClay.fantasyPoints < filters.minProjection)) return false;
    
    return true;
  }
}

module.exports = DataManager;