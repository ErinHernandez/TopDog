#!/usr/bin/env node

/**
 * Debug ESPN Teams endpoint structure
 */

import * as http from 'http';

interface HttpResponse {
  success: boolean;
  status: number;
  data?: unknown;
  error?: string;
  rawData?: string;
}

async function debugTeamsStructure(): Promise<void> {
  console.log('🔍 Debugging ESPN Teams Structure...\n');

  try {
    const result: HttpResponse = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');

    if (result.success) {
      console.log('✅ Teams endpoint working\n');

      const data = result.data as any;
      console.log('📊 Data Structure:');
      console.log(`   Sports count: ${data.sports ? data.sports.length : 0}`);

      if (data.sports && data.sports.length > 0) {
        const footballSport = data.sports.find((sport: any) => sport.name === 'Football');
        if (footballSport) {
          console.log(`   Football sport found: ${footballSport.name}`);
          console.log(`   Leagues count: ${footballSport.leagues ? footballSport.leagues.length : 0}`);

          if (footballSport.leagues) {
            console.log(`   Available leagues: ${footballSport.leagues.map((l: any) => l.name).join(', ')}`);

            const nflLeague = footballSport.leagues.find((league: any) => league.name === 'National Football League');
            if (nflLeague) {
              console.log(`   NFL league found: ${nflLeague.name}`);
              console.log(`   Teams count: ${nflLeague.teams ? nflLeague.teams.length : 0}`);

              if (nflLeague.teams) {
                console.log('\n📋 Teams:');
                nflLeague.teams.slice(0, 5).forEach((teamWrapper: any, index: number) => {
                  const team = teamWrapper.team;
                  console.log(`   ${index + 1}. ${team.name} (${team.abbreviation})`);
                  console.log(`      Athletes: ${team.athletes ? team.athletes.length : 0}`);
                  console.log(`      Keys: ${Object.keys(team).join(', ')}`);

                  if (team.athletes && team.athletes.length > 0) {
                    console.log(`      Sample athlete: ${team.athletes[0].displayName} (${team.athletes[0].id})`);
                  }
                });

                // Check if there are any teams with athletes
                const teamsWithAthletes = nflLeague.teams.filter((teamWrapper: any) => teamWrapper.team.athletes && teamWrapper.team.athletes.length > 0);
                console.log(`\n📊 Teams with athletes: ${teamsWithAthletes.length}`);

                if (teamsWithAthletes.length === 0) {
                  console.log('\n🔍 Checking alternative team structure...');
                  nflLeague.teams.slice(0, 3).forEach((teamWrapper: any, index: number) => {
                    const team = teamWrapper.team;
                    console.log(`\n   Team ${index + 1}: ${team.name}`);
                    console.log(`   All keys: ${Object.keys(team).join(', ')}`);

                    // Look for any array fields that might contain players
                    Object.keys(team).forEach((key: string) => {
                      if (Array.isArray(team[key])) {
                        console.log(`   ${key}: ${team[key].length} items`);
                        if (team[key].length > 0 && team[key][0].displayName) {
                          console.log(`   Sample ${key}: ${team[key][0].displayName}`);
                        }
                      }
                    });
                  });
                }
              }
            } else {
              console.log('   ❌ NFL league not found');
            }
          }
        } else {
          console.log('   ❌ Football sport not found');
        }
      }

    } else {
      console.log(`❌ Teams endpoint failed: ${result.status}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Exception: ${errorMessage}`);
  }
}

// Helper function to make HTTP requests
function makeRequest(url: string): Promise<HttpResponse> {
  return new Promise((resolve: (value: HttpResponse) => void) => {
    const req = http.get(url, (res) => {
      let data: string = '';

      res.on('data', (chunk: string) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode || 0,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode || 0,
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

// Run debug
if (require.main === module) {
  debugTeamsStructure().catch(console.error);
}

export { debugTeamsStructure };
