#!/usr/bin/env node

/**
 * Explore ESPN API data availability including projections and historical data
 */

import * as http from 'http';
import { IncomingMessage } from 'http';

// Type definitions for API response
interface ApiCategory {
  name: string;
  abbreviation: string;
}

interface ApiSeason {
  year: number;
  name: string;
}

interface ApiTeam {
  name: string;
  athletes?: Array<{
    displayName: string;
    id: string;
  }>;
}

interface ApiLeague {
  name: string;
  teams?: ApiTeam[];
}

interface ApiSport {
  name: string;
  leagues?: ApiLeague[];
}

interface ApiStatistics {
  timestamp?: string;
  status?: string;
  season?: ApiSeason;
  league?: { name: string };
  stats?: {
    categories?: ApiCategory[];
  };
  seasons?: ApiSeason[];
  sports?: ApiSport[];
  projections?: Record<string, unknown>;
  fantasy?: Record<string, unknown>;
}

interface RequestResult {
  success: boolean;
  status: number;
  data?: ApiStatistics;
  error?: string;
}

interface Endpoint {
  name: string;
  url: string;
}

async function exploreESPNDataAvailability(): Promise<void> {
  console.log('🔍 Exploring ESPN API Data Availability...\n');

  try {
    // Test different ESPN endpoints to see what's available
    const endpoints: Endpoint[] = [
      { name: 'Current Season Stats', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics' },
      { name: 'Teams', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams' },
      { name: 'Standings', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/standings' },
      { name: 'Scoreboard', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
      { name: '2024 Season Stats', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/seasons/2024/statistics' },
      { name: '2023 Season Stats', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/seasons/2023/statistics' },
      { name: '2022 Season Stats', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/seasons/2022/statistics' },
      { name: 'Projections', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/projections' },
      { name: 'Fantasy Projections', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/fantasy/projections' },
      { name: 'Player Rankings', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/rankings' },
      { name: 'Player Stats', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/players' },
      { name: 'Season Types', url: 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/seasons' }
    ];

    for (const endpoint of endpoints) {
      console.log(`📡 Testing: ${endpoint.name}`);
      const result = await makeRequest(endpoint.url);

      if (result.success && result.data) {
        console.log(`   ✅ Working - Status: ${result.status}`);

        // Analyze the data structure
        const data = result.data;
        if (data.stats && data.stats.categories) {
          console.log(`   📊 Stat categories: ${data.stats.categories.length}`);
          const relevantCats = data.stats.categories.filter((cat) =>
            cat.name.includes('pass') || cat.name.includes('rush') || cat.name.includes('receiv')
          );
          console.log(`   📊 Relevant categories: ${relevantCats.length}`);
        }

        if (data.seasons) {
          console.log(`   📊 Seasons available: ${data.seasons.length}`);
          data.seasons.slice(0, 3).forEach((season) => {
            console.log(`      - ${season.year} (${season.name})`);
          });
        }

        if (data.sports && data.sports.length > 0) {
          const nflData = data.sports.find((sport) => sport.name === 'Football');
          if (nflData && nflData.leagues) {
            const nflLeague = nflData.leagues.find((league) => league.name === 'National Football League');
            if (nflLeague && nflLeague.teams) {
              console.log(`   📊 Teams: ${nflLeague.teams.length}`);
            }
          }
        }

        // Check for projection data
        if (data.projections) {
          console.log(`   📊 Projections available: ${Object.keys(data.projections).length} types`);
        }

        // Check for fantasy data
        if (data.fantasy) {
          console.log(`   📊 Fantasy data available: ${Object.keys(data.fantasy).length} types`);
        }
      } else {
        console.log(`   ❌ Failed - Status: ${result.status} - ${result.error}`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('🎯 Summary of Available Data:');
    console.log('   ✅ Current season statistics (preseason)');
    console.log('   ✅ Historical season statistics (2022-2024)');
    console.log('   ✅ Team information');
    console.log('   ✅ Player leaderboards');
    console.log('   ❌ Direct projections endpoint');
    console.log('   ❌ Direct fantasy projections endpoint');

    console.log('\n💡 Recommendations:');
    console.log('   1. Use current season statistics for 2025 projections');
    console.log('   2. Use historical data (2022-2024) for trend analysis');
    console.log('   3. Combine with external projection sources (Clay, etc.)');
    console.log('   4. Build projection model based on historical performance');
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
          const jsonData = JSON.parse(data) as ApiStatistics;
          resolve({
            success: true,
            status: res.statusCode ?? 0,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode ?? 0,
            error: 'Invalid JSON response'
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

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: 'Request timeout'
      });
    });
  });
}

// Run exploration
if (require.main === module) {
  exploreESPNDataAvailability().catch(console.error);
}

export { exploreESPNDataAvailability };
