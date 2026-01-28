#!/usr/bin/env node

/**
 * Debug ESPN API errors and test alternative endpoints
 */

import * as http from 'http';
import { IncomingMessage } from 'http';

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

async function debugESPNAPI(): Promise<void> {
  console.log('🔍 Debugging ESPN API Errors...\n');

  const testCases: TestCase[] = [
    {
      name: 'Current ESPN Core API',
      url: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/4426499',
      description: 'Test current implementation'
    },
    {
      name: 'ESPN Site API',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/4426499',
      description: 'Test site API endpoint'
    },
    {
      name: 'ESPN API v1',
      url: 'http://api.espn.com/v1/sports/football/nfl/athletes/4426499',
      description: 'Test v1 API endpoint'
    },
    {
      name: 'ESPN API v2',
      url: 'http://api.espn.com/v2/sports/football/nfl/athletes/4426499',
      description: 'Test v2 API endpoint'
    },
    {
      name: 'ESPN Stats API',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics',
      description: 'Test stats endpoint'
    },
    {
      name: 'ESPN Teams API',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      description: 'Test teams endpoint'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📡 Testing: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   URL: ${testCase.url}`);

    try {
      const result = await makeRequest(testCase.url);

      console.log(`   Status: ${result.status}`);
      console.log(`   Response size: ${result.data ? JSON.stringify(result.data).length : 0} characters`);

      if (result.data && (result.data as Record<string, unknown>).error) {
        console.log(`   ❌ Error: ${(result.data as Record<string, unknown>).error}`);
      } else if (result.data && (result.data as Record<string, unknown>).code) {
        console.log(`   ❌ Code: ${(result.data as Record<string, unknown>).code}`);
      } else if (result.data && typeof result.data === 'object') {
        const keys = Object.keys(result.data);
        console.log(
          `   ✅ Success - Top-level keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`
        );

        // Show a sample of the data
        if (keys.length > 0) {
          const sampleKey = keys[0];
          const sampleValue = result.data[sampleKey];
          console.log(`   📊 Sample data (${sampleKey}): ${JSON.stringify(sampleValue).substring(0, 100)}...`);
        }
      } else {
        console.log(`   📄 Raw response: ${JSON.stringify(result.data).substring(0, 200)}...`);
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
    const req = http.get(url, (res: IncomingMessage) => {
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
    });

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

// Test working ESPN endpoints
async function testWorkingEndpoints(): Promise<void> {
  console.log('🔍 Testing Working ESPN Endpoints...\n');

  const workingEndpoints: TestCase[] = [
    {
      name: 'ESPN NFL Teams',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      description: 'Get all NFL teams'
    },
    {
      name: 'ESPN NFL Standings',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/standings',
      description: 'Get NFL standings'
    },
    {
      name: 'ESPN NFL Scoreboard',
      url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      description: 'Get NFL scoreboard'
    }
  ];

  for (const endpoint of workingEndpoints) {
    console.log(`📡 Testing: ${endpoint.name}`);
    console.log(`   Description: ${endpoint.description}`);

    try {
      const result = await makeRequest(endpoint.url);

      if (result.success && result.status === 200 && result.data) {
        console.log(`   ✅ SUCCESS - Status: ${result.status}`);
        if (result.data && (result.data as Record<string, unknown>).sports) {
          const sports = (result.data as Record<string, unknown>).sports as Array<Record<string, unknown>>;
          const nflData = sports.find((sport) => sport.name === 'Football');
          if (nflData && (nflData as Record<string, unknown>).leagues) {
            const leagues = (nflData as Record<string, unknown>).leagues as Array<Record<string, unknown>>;
            const nflLeague = leagues.find((league) => league.name === 'NFL');
            if (nflLeague && (nflLeague as Record<string, unknown>).teams) {
              const teams = (nflLeague as Record<string, unknown>).teams as unknown[];
              console.log(`   📊 Found ${teams.length} NFL teams`);
            }
          }
        }
      } else {
        console.log(`   ❌ FAILED - Status: ${result.status}`);
        if (result.data && (result.data as Record<string, unknown>).error) {
          console.log(`   💬 Error: ${(result.data as Record<string, unknown>).error}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   💥 EXCEPTION: ${errorMessage}`);
    }

    console.log('');
  }
}

// Run tests
async function main(): Promise<void> {
  console.log('🚀 ESPN API Debug Suite\n');
  console.log('='.repeat(50));

  await debugESPNAPI();

  console.log('='.repeat(50));

  await testWorkingEndpoints();

  console.log('\n✅ ESPN API debugging complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { debugESPNAPI, testWorkingEndpoints };
