#!/usr/bin/env node

/**
 * Deep exploration of ESPN API data to understand available content
 */

import * as http from 'http';
import { IncomingMessage } from 'http';

interface Athlete {
  displayName: string;
  id: string;
  position?: { abbreviation: string };
}

interface Leader {
  displayValue: string;
  athlete: Athlete;
}

interface StatCategory {
  name: string;
  abbreviation: string;
  leaders?: Leader[];
}

interface Stats {
  categories?: StatCategory[];
}

interface Season {
  year: number;
  name: string;
}

interface TeamAthlete {
  displayName: string;
  id: string;
  position?: { abbreviation: string };
}

interface Team {
  name: string;
  athletes?: TeamAthlete[];
}

interface TeamWrapper {
  team: Team;
}

interface League {
  name: string;
  teams?: TeamWrapper[];
}

interface Sport {
  name: string;
  leagues?: League[];
}

interface ApiResponse {
  season?: Season;
  stats?: Stats;
  sports?: Sport[];
  seasons?: Season[];
}

interface RequestResult {
  success: boolean;
  status: number | null;
  data?: ApiResponse;
  error?: string;
}

interface SeasonEndpoint {
  url: string;
}

async function deepESPNExploration(): Promise<void> {
  console.log('🔍 Deep ESPN API Exploration...\n');

  try {
    // Get current season statistics
    console.log('📡 Fetching current season statistics...');
    const statsResult = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics');

    if (statsResult.success && statsResult.data) {
      const data = statsResult.data;
      console.log(`✅ Current season: ${data.season?.year} (${data.season?.name})`);

      if (data.stats && data.stats.categories) {
        console.log(`\n📊 Available Stat Categories (${data.stats.categories.length}):`);
        data.stats.categories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name} (${cat.abbreviation})`);
          if (cat.leaders) {
            console.log(`      Leaders: ${cat.leaders.length}`);
            if (cat.leaders.length > 0) {
              const sampleLeader = cat.leaders[0]!;
              console.log(`      Sample: ${sampleLeader.athlete.displayName} - ${sampleLeader.displayValue}`);
            }
          }
        });

        // Focus on fantasy-relevant categories
        const fantasyCategories = data.stats.categories.filter(
          (cat) =>
            cat.name.includes('pass') ||
            cat.name.includes('rush') ||
            cat.name.includes('receiv') ||
            cat.name.includes('touchdown') ||
            cat.name.includes('attempt') ||
            cat.name.includes('completion')
        );

        console.log(`\n🎯 Fantasy-Relevant Categories (${fantasyCategories.length}):`);
        fantasyCategories.forEach((cat) => {
          console.log(`   📊 ${cat.name} (${cat.abbreviation})`);
          if (cat.leaders && cat.leaders.length > 0) {
            console.log(
              `      Top 3: ${cat.leaders
                .slice(0, 3)
                .map((l) => `${l.athlete.displayName} (${l.displayValue})`)
                .join(', ')}`
            );
          }
        });
      }
    }

    // Get teams data
    console.log('\n📡 Fetching teams data...');
    const teamsResult = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');

    if (teamsResult.success && teamsResult.data) {
      const data = teamsResult.data;
      console.log(`✅ Teams endpoint working`);

      if (data.sports && data.sports.length > 0) {
        const nflData = data.sports.find((sport) => sport.name === 'Football');
        if (nflData && nflData.leagues) {
          const nflLeague = nflData.leagues.find((league) => league.name === 'National Football League');
          if (nflLeague && nflLeague.teams) {
            console.log(`📊 Found ${nflLeague.teams.length} teams`);

            // Check if any teams have athletes data
            const teamsWithAthletes = nflLeague.teams.filter(
              (teamWrapper) => teamWrapper.team.athletes && teamWrapper.team.athletes.length > 0
            );

            console.log(`📊 Teams with athletes: ${teamsWithAthletes.length}`);

            if (teamsWithAthletes.length > 0) {
              const sampleTeam = teamsWithAthletes[0]!;
              console.log(`📊 Sample team: ${sampleTeam.team.name} - ${sampleTeam.team.athletes?.length} athletes`);

              // Show sample athletes
              sampleTeam.team.athletes?.slice(0, 3).forEach((athlete) => {
                console.log(
                  `   - ${athlete.displayName} (${athlete.id}) - ${athlete.position?.abbreviation || 'N/A'}`
                );
              });
            } else {
              console.log('💡 No athlete data available during preseason');
            }
          }
        }
      }
    }

    // Try to find season information
    console.log('\n📡 Checking for season information...');
    const seasonEndpoints: string[] = [
      'http://site.api.espn.com/apis/site/v2/sports/football/nfl/seasons',
      'http://site.api.espn.com/apis/site/v2/sports/football/nfl/2024/statistics',
      'http://site.api.espn.com/apis/site/v2/sports/football/nfl/2023/statistics',
      'http://site.api.espn.com/apis/site/v2/sports/football/nfl/2022/statistics'
    ];

    for (const endpoint of seasonEndpoints) {
      const result = await makeRequest(endpoint);
      if (result.success && result.data) {
        console.log(`✅ ${endpoint} - Working`);
        if (result.data.seasons) {
          console.log(`   Seasons: ${result.data.seasons.map((s) => `${s.year} (${s.name})`).join(', ')}`);
        }
      } else {
        console.log(`❌ ${endpoint} - ${result.status}`);
      }
    }

    console.log('\n🎯 Data Availability Summary:');
    console.log('   ✅ Current preseason statistics with leaderboards');
    console.log('   ✅ Team information (32 teams)');
    console.log('   ❌ Historical season data (404 errors)');
    console.log('   ❌ Direct projections');
    console.log('   ❌ Fantasy projections');

    console.log('\n💡 Strategy for Fresh Start:');
    console.log('   1. Use current preseason leaderboards as base data');
    console.log('   2. Supplement with external projection sources (Clay, etc.)');
    console.log('   3. Build simple projection model based on preseason performance');
    console.log('   4. Update projections as regular season progresses');
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
          const jsonData = JSON.parse(data) as ApiResponse;
          resolve({
            success: true,
            status: res.statusCode ?? null,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode ?? null,
            error: 'Invalid JSON response'
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

    req.setTimeout(5000, () => {
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
  deepESPNExploration().catch(console.error);
}

export { deepESPNExploration };
