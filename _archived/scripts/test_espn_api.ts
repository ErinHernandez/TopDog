#!/usr/bin/env node

/**
 * Test ESPN API functionality
 */

import * as https from 'https';
import * as http from 'http';
import { ClientRequest } from 'http';

interface RequestResult {
  success: boolean;
  status: number;
  data?: Record<string, unknown>;
  error?: string;
  rawData?: string;
}

interface TestCase {
  name: string;
  url: string;
  description: string;
}

// Test ESPN API endpoints
async function testESPNAPI(): Promise<void> {
  console.log('🔍 Testing ESPN API...\n');

  const testCases: TestCase[] = [
    {
      name: "Player Info - Ja'Marr Chase",
      url: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/4426499',
      description: 'Fetch basic player information'
    },
    {
      name: "Player Stats - Ja'Marr Chase 2024",
      url: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/athletes/4426499/statistics',
      description: 'Fetch 2024 season statistics'
    },
    {
      name: "Player Stats - Ja'Marr Chase 2023",
      url: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2023/athletes/4426499/statistics',
      description: 'Fetch 2023 season statistics'
    },
    {
      name: 'Alternative Base URL Test',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/4426499',
      description: 'Test alternative ESPN API base URL'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📡 Testing: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   URL: ${testCase.url}`);

    try {
      const result = await makeRequest(testCase.url);

      if (result.success) {
        console.log(`   ✅ SUCCESS - Status: ${result.status}`);
        console.log(`   📊 Response size: ${result.data ? JSON.stringify(result.data).length : 0} characters`);

        // Show a sample of the data structure
        if (result.data && typeof result.data === 'object') {
          const keys = Object.keys(result.data);
          console.log(
            `   🔑 Top-level keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`
          );
        }
      } else {
        console.log(`   ❌ FAILED - Status: ${result.status}`);
        console.log(`   💬 Error: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   💥 EXCEPTION: ${errorMessage}`);
    }

    console.log(''); // Empty line for readability
  }
}

// Helper function to make HTTP requests
function makeRequest(url: string): Promise<RequestResult> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk: string) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data) as Record<string, unknown>;
          resolve({
            success: true,
            status: res.statusCode ?? 0,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode ?? 0,
            error: 'Invalid JSON response',
            rawData: data.substring(0, 200) + '...'
          });
        }
      });
    }) as ClientRequest;

    req.on('error', (error: Error) => {
      resolve({
        success: false,
        status: 0,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: 'Request timeout'
      });
    });
  });
}

// Test the actual ESPN API class from your codebase
async function testESPNClass(): Promise<void> {
  console.log('🧪 Testing ESPN API Class...\n');

  try {
    // Import the ESPN API class using dynamic import for ES6 modules
    const { ESPNPlayerAPI } = await import('../lib/espnAPI.js');

    interface ESPNAPI {
      getPlayerID(name: string): string | null;
      fetchPlayerInfo(id: string): Promise<Record<string, unknown> | null>;
      fetchPlayerStats(id: string, year: number): Promise<Record<string, unknown> | null>;
    }

    const espnAPI = new ESPNPlayerAPI() as ESPNAPI;

    console.log('📡 Testing player ID lookup...');
    const playerId = espnAPI.getPlayerID("Ja'Marr Chase");
    console.log(`   Ja'Marr Chase ID: ${playerId}`);

    console.log('\n📡 Testing player info fetch...');
    const playerInfo = await espnAPI.fetchPlayerInfo(playerId || '');
    if (playerInfo) {
      console.log(`   ✅ Player info fetched successfully`);
      const displayName = (playerInfo as Record<string, unknown>).displayName || 'N/A';
      console.log(`   📊 Player name: ${displayName}`);
    } else {
      console.log(`   ❌ Failed to fetch player info`);
    }

    console.log('\n📡 Testing player stats fetch...');
    const playerStats = await espnAPI.fetchPlayerStats(playerId || '', 2024);
    if (playerStats) {
      console.log(`   ✅ Player stats fetched successfully`);
      console.log(`   📊 Stats keys: ${Object.keys(playerStats).join(', ')}`);
    } else {
      console.log(`   ❌ Failed to fetch player stats`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   💥 Error testing ESPN class: ${errorMessage}`);
  }
}

// Run tests
async function main(): Promise<void> {
  console.log('🚀 ESPN API Test Suite\n');
  console.log('='.repeat(50));

  await testESPNAPI();

  console.log('='.repeat(50));

  await testESPNClass();

  console.log('\n✅ ESPN API testing complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { testESPNAPI, testESPNClass };
