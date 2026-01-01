#!/usr/bin/env node
/**
 * Integration script for extracted CSV data into our player database
 */

const fs = require('fs');
const path = require('path');
const DataManager = require('../lib/dataManager.js');

function loadExtractedData(jsonPath) {
    try {
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('❌ Error loading extracted data:', error);
        return null;
    }
}

function detectDataType(sampleRecord) {
    const keys = Object.keys(sampleRecord).map(k => k.toLowerCase());
    
    // Check for historical stats indicators
    const hasHistoricalIndicators = keys.some(key => 
        key.includes('week') || key.includes('game') || key.includes('season') || 
        key.includes('2024') || key.includes('2023') || key.includes('2022')
    );
    
    // Check for ADP indicators
    const hasADPIndicators = keys.some(key => 
        key.includes('adp') || key.includes('draft') || key.includes('position')
    );
    
    // Check for projection indicators  
    const hasProjectionIndicators = keys.some(key =>
        key.includes('proj') || key.includes('prediction') || key.includes('forecast')
    );
    
    if (hasADPIndicators) return 'adp';
    if (hasProjectionIndicators) return 'projections';
    if (hasHistoricalIndicators) return 'historical';
    
    return 'stats'; // Default to general stats
}

function getPlayerNameField(record) {
    const keys = Object.keys(record);
    
    // Look for common player name fields
    for (const key of keys) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('name') || lowerKey.includes('player')) {
            return key;
        }
    }
    
    // If no obvious name field, use first field
    return keys[0];
}

function cleanPlayerName(name) {
    if (!name) return '';
    return String(name).trim().replace(/[^\w\s'-\.]/g, '');
}

function integrateHistoricalData(dataManager, records, year = 2024) {
    console.log(`📊 Integrating ${records.length} historical records for ${year}...`);
    
    let successful = 0;
    let failed = 0;
    
    const playerNameField = getPlayerNameField(records[0]);
    console.log(`👤 Using player name field: ${playerNameField}`);
    
    for (const record of records) {
        const playerName = cleanPlayerName(record[playerNameField]);
        if (!playerName) {
            failed++;
            continue;
        }
        
        // Prepare historical stats object
        const stats = {
            fantasyPoints: null,
            games: null,
            passing: {},
            rushing: {},
            receiving: {}
        };
        
        // Map fields to our structure
        for (const [key, value] of Object.entries(record)) {
            if (key === playerNameField) continue;
            
            const lowerKey = key.toLowerCase();
            const numValue = parseFloat(value);
            const finalValue = isNaN(numValue) ? value : numValue;
            
            // Fantasy points
            if (lowerKey.includes('fantasy') && lowerKey.includes('point')) {
                stats.fantasyPoints = finalValue;
            }
            // Games
            else if (lowerKey.includes('game') && !lowerKey.includes('point')) {
                stats.games = finalValue;
            }
            // Passing stats
            else if (lowerKey.includes('pass') || lowerKey.includes('comp') || lowerKey.includes('attempt')) {
                stats.passing[key] = finalValue;
            }
            // Rushing stats
            else if (lowerKey.includes('rush') || lowerKey.includes('carry')) {
                stats.rushing[key] = finalValue;
            }
            // Receiving stats
            else if (lowerKey.includes('rec') || lowerKey.includes('target') || lowerKey.includes('catch')) {
                stats.receiving[key] = finalValue;
            }
            // Other stats - put in appropriate category based on context
            else {
                // Default to receiving for skill position stats
                stats.receiving[key] = finalValue;
            }
        }
        
        if (dataManager.addHistoricalStats(playerName, year, stats)) {
            successful++;
        } else {
            failed++;
        }
    }
    
    console.log(`✅ Historical integration complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
}

function integrateADPData(dataManager, records) {
    console.log(`📊 Integrating ${records.length} ADP records...`);
    
    let successful = 0;
    let failed = 0;
    
    const playerNameField = getPlayerNameField(records[0]);
    console.log(`👤 Using player name field: ${playerNameField}`);
    
    for (const record of records) {
        const playerName = cleanPlayerName(record[playerNameField]);
        if (!playerName) {
            failed++;
            continue;
        }
        
        // Find ADP value
        let adpValue = null;
        let source = 'CSV Import';
        
        for (const [key, value] of Object.entries(record)) {
            if (key === playerNameField) continue;
            
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('adp') || lowerKey.includes('draft')) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    adpValue = numValue;
                    source = `${key} from CSV`;
                    break;
                }
            }
        }
        
        if (adpValue !== null) {
            if (dataManager.addADPData(playerName, adpValue, source)) {
                successful++;
            } else {
                failed++;
            }
        } else {
            failed++;
        }
    }
    
    console.log(`✅ ADP integration complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
}

function integrateGeneralStats(dataManager, records, dataType = 'general') {
    console.log(`📊 Integrating ${records.length} ${dataType} records...`);
    
    let successful = 0;
    let failed = 0;
    
    const playerNameField = getPlayerNameField(records[0]);
    console.log(`👤 Using player name field: ${playerNameField}`);
    
    // For now, treat as 2024 historical data
    const year = 2024;
    
    for (const record of records) {
        const playerName = cleanPlayerName(record[playerNameField]);
        if (!playerName) {
            failed++;
            continue;
        }
        
        // Convert all non-name fields to stats
        const stats = {};
        for (const [key, value] of Object.entries(record)) {
            if (key !== playerNameField) {
                const numValue = parseFloat(value);
                stats[key] = isNaN(numValue) ? value : numValue;
            }
        }
        
        if (dataManager.addHistoricalStats(playerName, year, { customStats: stats })) {
            successful++;
        } else {
            failed++;
        }
    }
    
    console.log(`✅ ${dataType} integration complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
}

function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node scripts/integrate_extracted_data.js <extracted_data.json>');
        console.log('Example: node scripts/integrate_extracted_data.js extracted_fantasy_data_20250815_123456.json');
        return;
    }
    
    const jsonPath = process.argv[2];
    
    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ File not found: ${jsonPath}`);
        return;
    }
    
    console.log('🔗 INTEGRATING EXTRACTED DATA INTO PLAYER DATABASE');
    console.log('=' .repeat(60));
    
    // Load extracted data
    console.log(`📂 Loading data from: ${path.basename(jsonPath)}`);
    const extractedData = loadExtractedData(jsonPath);
    
    if (!extractedData || extractedData.length === 0) {
        console.error('❌ No data found in file');
        return;
    }
    
    console.log(`📊 Found ${extractedData.length.toLocaleString()} records`);
    
    // Detect data type
    const dataType = detectDataType(extractedData[0]);
    console.log(`🔍 Detected data type: ${dataType}`);
    
    // Show sample record
    console.log(`📄 Sample record:`, JSON.stringify(extractedData[0], null, 2));
    
    // Initialize data manager
    const dataManager = new DataManager();
    
    // Integrate based on type
    let results;
    
    switch (dataType) {
        case 'historical':
            const year = parseInt(process.argv[3]) || 2024;
            console.log(`📅 Using year: ${year}`);
            results = integrateHistoricalData(dataManager, extractedData, year);
            break;
            
        case 'adp':
            results = integrateADPData(dataManager, extractedData);
            break;
            
        default:
            results = integrateGeneralStats(dataManager, extractedData, dataType);
            break;
    }
    
    // Save updated database
    console.log('\n💾 Saving updated database...');
    if (dataManager.saveDatabase()) {
        console.log('✅ Database updated successfully');
    } else {
        console.error('❌ Failed to save database');
    }
    
    // Show final stats
    console.log('\n📊 FINAL DATABASE STATS:');
    const report = dataManager.generateStatsReport();
    console.log(`Total players: ${report.totalPlayers}`);
    console.log(`Players with 2024 stats: ${report.dataCoverage.historical2024}`);
    console.log(`Players with ADP: ${report.dataCoverage.adp}`);
    
    console.log('\n✅ Integration complete!');
}

if (require.main === module) {
    main();
}