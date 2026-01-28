#!/usr/bin/env node

/**
 * Explore ESPN NFL Statistics endpoint to understand data structure
 */

import * as http from 'http';
import { IncomingMessage } from 'http';

interface StatAthlete {
  displayName: string;
  id: string;
}

interface AthleteStat {
  displayValue: string;
  athlete: StatAthlete;
  stats?: Record<string, unknown>;
}

interface StatLeader {
  displayValue: string;
  athlete: StatAthlete;
}

interface CategoryStats {
  name: string;
  athletes?: AthleteStat[];
  leaders?: StatLeader[];
}

interface StatCategoryDetails {
  name: string;
  abbreviation: string;
  categories?: CategoryStats[];
  leaders?: StatLeader[];
}

interface StatsObject {
  name?: string;
  abbreviation?: string;
  categories?: CategoryStats[];
  type?: string;
}

interface Season {
  year: number;
  name: string;
}

interface League {
  name: string;
}

interface ApiStatsResponse {
  timestamp?: string;
  status?: string;
  season?: Season;
  league?: League;
  stats?: StatsObject[] | StatsObject;
}

interface RequestResult {
  success: boolean;
  status: number | null;
  data?: ApiStatsResponse;
  error?: string;
  rawData?: string;
}

async function exploreESPNStats(): Promise<void> {
  console.log('🔍 Exploring ESPN NFL Statistics...\n');

  const statsUrl = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics';

  try {
    const result = await makeRequest(statsUrl);

    if (result.success && result.status === 200 && result.data) {
      console.log('✅ Successfully fetched ESPN NFL Statistics\n');

      const data = result.data;
      console.log('📊 Data Structure:');
      console.log(`   Timestamp: ${data.timestamp}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Season: ${JSON.stringify(data.season)}`);
      console.log(`   League: ${JSON.stringify(data.league)}`);

      // Log all top-level keys to understand structure
      console.log(`\n🔑 Top-level keys: ${Object.keys(data).join(', ')}`);

      console.log(`\n📈 Stats field type: ${typeof data.stats}`);
      console.log(`📈 Stats field value: ${JSON.stringify(data.stats).substring(0, 200)}...`);

      if (data.stats && typeof data.stats === 'object' && !Array.isArray(data.stats)) {
        const statsObj = data.stats as StatsObject;
        console.log(`\n📊 Stats object: ${statsObj.name} (${statsObj.abbreviation})`);

        if (statsObj.categories && Array.isArray(statsObj.categories)) {
          console.log(`📈 Categories: ${statsObj.categories.length}`);

          // Show first few categories
          statsObj.categories.slice(0, 5).forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.name}`);
            if (cat.leaders && Array.isArray(cat.leaders)) {
              console.log(`      Leaders: ${cat.leaders.length}`);
              cat.leaders.slice(0, 3).forEach((leader) => {
                console.log(
                  `        - ${leader.displayValue} by ${leader.athlete.displayName} (${leader.athlete.id})`
                );
              });
            }
          });
        }
      }

      if (data.stats && Array.isArray(data.stats)) {
        console.log(`\n📈 Statistics Categories: ${data.stats.length}`);

        // Show first few stat categories
        data.stats.slice(0, 3).forEach((stat, index) => {
          console.log(`   ${index + 1}. ${stat.name} (${stat.abbreviation})`);
          console.log(`      Type: ${stat.type}`);
          if (stat.categories && Array.isArray(stat.categories)) {
            console.log(`      Categories: ${stat.categories.length}`);
            stat.categories.slice(0, 2).forEach((cat) => {
              const athleteCount = cat.athletes ? cat.athletes.length : 0;
              console.log(`        - ${cat.name}: ${athleteCount} athletes`);
            });
          }
        });

        // Show first few stat categories
        data.stats.slice(0, 5).forEach((stat, index) => {
          console.log(`   ${index + 1}. ${stat.name} (${stat.abbreviation})`);
          if (stat.categories) {
            console.log(`      Categories: ${stat.categories.length}`);
            stat.categories.slice(0, 3).forEach((cat) => {
              const athleteCount = cat.athletes ? cat.athletes.length : 0;
              console.log(`        - ${cat.name}: ${athleteCount} athletes`);
            });
          }
        });

        // Look for passing, rushing, receiving stats
        const relevantStats = data.stats.filter(
          (stat) =>
            stat.name &&
            (stat.name.toLowerCase().includes('pass') ||
              stat.name.toLowerCase().includes('rush') ||
              stat.name.toLowerCase().includes('receiv'))
        );

        console.log(`\n🎯 Relevant Stats Found: ${relevantStats.length}`);
        relevantStats.forEach((stat) => {
          console.log(`   📊 ${stat.name} (${stat.abbreviation})`);
          if (stat.categories) {
            stat.categories.forEach((cat) => {
              const athleteCount = cat.athletes ? cat.athletes.length : 0;
              console.log(`      - ${cat.name}: ${athleteCount} athletes`);

              // Show sample athletes if available
              if (cat.athletes && cat.athletes.length > 0) {
                const sampleAthlete = cat.athletes[0];
                console.log(
                  `        Sample: ${sampleAthlete.athlete.displayName} (${sampleAthlete.athlete.id})`
                );
                if (sampleAthlete.stats) {
                  console.log(`        Stats: ${Object.keys(sampleAthlete.stats).join(', ')}`);
                }
              }
            });
          }
        });
      }
    } else {
      console.log(`❌ Failed to fetch data: ${result.status}`);
      if (result.data && (result.data as Record<string, unknown>).error) {
        console.log(`   Error: ${(result.data as Record<string, unknown>).error}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`💥 Exception: ${errorMessage}`);
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
          const jsonData = JSON.parse(data) as ApiStatsResponse;
          resolve({
            success: true,
            status: res.statusCode ?? null,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode ?? null,
            error: 'Invalid JSON response',
            rawData: data.substring(0, 200) + '...'
          });
        }
      });
    });

    req.on('error', (error: Error) => {
      resolve({
        success: false,
        status: null,
        error: error.message
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      resolve({
        success: false,
        status: null,
        error: 'Request timeout'
      });
    });
  });
}

// Run exploration
if (require.main === module) {
  exploreESPNStats().catch(console.error);
}

export { exploreESPNStats };
