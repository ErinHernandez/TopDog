#!/usr/bin/env node
/**
 * Generate Static Player Data Files
 * 
 * Creates the immutable/semi-static data files:
 * - registry.json: Eternal biographical data
 * - career-stats.json: Historical season stats (append-only)
 * - rosters-{year}.json: Current team assignments
 * 
 * Usage:
 *   node scripts/generateStaticPlayerData.js
 *   node scripts/generateStaticPlayerData.js --year 2025
 */

const fs = require('fs');
const path = require('path');

// Parse command line args
const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year'));
const YEAR = yearArg ? yearArg.split('=')[1] || args[args.indexOf('--year') + 1] : '2025';

// ============================================================================
// BYE WEEKS 2025
// ============================================================================

const BYE_WEEKS = {
  'LAC': 5, 'NYJ': 5,
  'KC': 6, 'LAR': 6, 'MIA': 6, 'MIN': 6,
  'ARI': 7, 'CAR': 7, 'NYG': 7, 'TB': 7,
  'CLE': 9, 'LV': 9, 'SEA': 9, 'TEN': 9,
  'BAL': 10, 'CIN': 10, 'JAX': 10, 'NE': 10,
  'DEN': 11, 'HOU': 11, 'PIT': 11, 'SF': 11,
  'IND': 12, 'NO': 12,
  'ATL': 13, 'BUF': 13, 'CHI': 13, 'DET': 13,
  'DAL': 14, 'GB': 14, 'PHI': 14, 'WAS': 14,
};

// ============================================================================
// PLAYER REGISTRY - ETERNAL BIOGRAPHICAL DATA
// ============================================================================

const PLAYER_REGISTRY = {
  // ==========================================================================
  // QUARTERBACKS
  // ==========================================================================
  'allen_josh': {
    id: 'allen_josh',
    name: 'Josh Allen',
    position: 'QB',
    birthDate: '1996-05-21',
    birthPlace: 'Firebaugh, California',
    college: 'Wyoming',
    nflDraftYear: 2018,
    nflDraftRound: 1,
    nflDraftPick: 7,
    nflDraftTeam: 'BUF',
  },
  'hurts_jalen': {
    id: 'hurts_jalen',
    name: 'Jalen Hurts',
    position: 'QB',
    birthDate: '1998-08-07',
    birthPlace: 'Houston, Texas',
    college: 'Oklahoma',
    nflDraftYear: 2020,
    nflDraftRound: 2,
    nflDraftPick: 53,
    nflDraftTeam: 'PHI',
  },
  'jackson_lamar': {
    id: 'jackson_lamar',
    name: 'Lamar Jackson',
    position: 'QB',
    birthDate: '1997-01-07',
    birthPlace: 'Pompano Beach, Florida',
    college: 'Louisville',
    nflDraftYear: 2018,
    nflDraftRound: 1,
    nflDraftPick: 32,
    nflDraftTeam: 'BAL',
  },
  'mahomes_patrick': {
    id: 'mahomes_patrick',
    name: 'Patrick Mahomes',
    position: 'QB',
    birthDate: '1995-09-17',
    birthPlace: 'Tyler, Texas',
    college: 'Texas Tech',
    nflDraftYear: 2017,
    nflDraftRound: 1,
    nflDraftPick: 10,
    nflDraftTeam: 'KC',
  },
  'daniels_jayden': {
    id: 'daniels_jayden',
    name: 'Jayden Daniels',
    position: 'QB',
    birthDate: '2000-12-18',
    birthPlace: 'San Bernardino, California',
    college: 'LSU',
    nflDraftYear: 2024,
    nflDraftRound: 1,
    nflDraftPick: 2,
    nflDraftTeam: 'WAS',
  },
  'burrow_joe': {
    id: 'burrow_joe',
    name: 'Joe Burrow',
    position: 'QB',
    birthDate: '1996-12-10',
    birthPlace: 'Ames, Iowa',
    college: 'LSU',
    nflDraftYear: 2020,
    nflDraftRound: 1,
    nflDraftPick: 1,
    nflDraftTeam: 'CIN',
  },
  'stroud_cj': {
    id: 'stroud_cj',
    name: 'CJ Stroud',
    position: 'QB',
    birthDate: '2001-10-03',
    birthPlace: 'Rancho Cucamonga, California',
    college: 'Ohio State',
    nflDraftYear: 2023,
    nflDraftRound: 1,
    nflDraftPick: 2,
    nflDraftTeam: 'HOU',
  },
  'murray_kyler': {
    id: 'murray_kyler',
    name: 'Kyler Murray',
    position: 'QB',
    birthDate: '1997-08-07',
    birthPlace: 'Bedford, Texas',
    college: 'Oklahoma',
    nflDraftYear: 2019,
    nflDraftRound: 1,
    nflDraftPick: 1,
    nflDraftTeam: 'ARI',
  },
  'richardson_anthony': {
    id: 'richardson_anthony',
    name: 'Anthony Richardson',
    position: 'QB',
    birthDate: '2001-05-17',
    birthPlace: 'Gainesville, Florida',
    college: 'Florida',
    nflDraftYear: 2023,
    nflDraftRound: 1,
    nflDraftPick: 4,
    nflDraftTeam: 'IND',
  },
  'williams_caleb': {
    id: 'williams_caleb',
    name: 'Caleb Williams',
    position: 'QB',
    birthDate: '2001-11-18',
    birthPlace: 'Washington, D.C.',
    college: 'USC',
    nflDraftYear: 2024,
    nflDraftRound: 1,
    nflDraftPick: 1,
    nflDraftTeam: 'CHI',
  },
  
  // ==========================================================================
  // RUNNING BACKS
  // ==========================================================================
  'robinson_bijan': {
    id: 'robinson_bijan',
    name: 'Bijan Robinson',
    position: 'RB',
    birthDate: '2002-02-28',
    birthPlace: 'Tucson, Arizona',
    college: 'Texas',
    nflDraftYear: 2023,
    nflDraftRound: 1,
    nflDraftPick: 8,
    nflDraftTeam: 'ATL',
  },
  'hall_breece': {
    id: 'hall_breece',
    name: 'Breece Hall',
    position: 'RB',
    birthDate: '2001-04-01',
    birthPlace: 'Wichita, Kansas',
    college: 'Iowa State',
    nflDraftYear: 2022,
    nflDraftRound: 2,
    nflDraftPick: 36,
    nflDraftTeam: 'NYJ',
  },
  'gibbs_jahmyr': {
    id: 'gibbs_jahmyr',
    name: 'Jahmyr Gibbs',
    position: 'RB',
    birthDate: '2002-08-20',
    birthPlace: 'Dalton, Georgia',
    college: 'Alabama',
    nflDraftYear: 2023,
    nflDraftRound: 1,
    nflDraftPick: 12,
    nflDraftTeam: 'DET',
  },
  'barkley_saquon': {
    id: 'barkley_saquon',
    name: 'Saquon Barkley',
    position: 'RB',
    birthDate: '1997-02-09',
    birthPlace: 'The Bronx, New York',
    college: 'Penn State',
    nflDraftYear: 2018,
    nflDraftRound: 1,
    nflDraftPick: 2,
    nflDraftTeam: 'NYG',
  },
  'taylor_jonathan': {
    id: 'taylor_jonathan',
    name: 'Jonathan Taylor',
    position: 'RB',
    birthDate: '1999-01-19',
    birthPlace: 'Salem, New Jersey',
    college: 'Wisconsin',
    nflDraftYear: 2020,
    nflDraftRound: 2,
    nflDraftPick: 41,
    nflDraftTeam: 'IND',
  },
  'henry_derrick': {
    id: 'henry_derrick',
    name: 'Derrick Henry',
    position: 'RB',
    birthDate: '1994-01-04',
    birthPlace: 'Yulee, Florida',
    college: 'Alabama',
    nflDraftYear: 2016,
    nflDraftRound: 2,
    nflDraftPick: 45,
    nflDraftTeam: 'TEN',
  },
  'achane_devon': {
    id: 'achane_devon',
    name: "De'Von Achane",
    position: 'RB',
    birthDate: '2002-03-11',
    birthPlace: 'Waco, Texas',
    college: 'Texas A&M',
    nflDraftYear: 2023,
    nflDraftRound: 3,
    nflDraftPick: 84,
    nflDraftTeam: 'MIA',
  },
  'williams_kyren': {
    id: 'williams_kyren',
    name: 'Kyren Williams',
    position: 'RB',
    birthDate: '2001-03-14',
    birthPlace: 'Saint Louis, Missouri',
    college: 'Notre Dame',
    nflDraftYear: 2022,
    nflDraftRound: 5,
    nflDraftPick: 164,
    nflDraftTeam: 'LAR',
  },
  'jacobs_josh': {
    id: 'jacobs_josh',
    name: 'Josh Jacobs',
    position: 'RB',
    birthDate: '1998-02-11',
    birthPlace: 'Tulsa, Oklahoma',
    college: 'Alabama',
    nflDraftYear: 2019,
    nflDraftRound: 1,
    nflDraftPick: 24,
    nflDraftTeam: 'LV',
  },
  'pacheco_isiah': {
    id: 'pacheco_isiah',
    name: 'Isiah Pacheco',
    position: 'RB',
    birthDate: '1999-03-02',
    birthPlace: 'Vineland, New Jersey',
    college: 'Rutgers',
    nflDraftYear: 2022,
    nflDraftRound: 7,
    nflDraftPick: 251,
    nflDraftTeam: 'KC',
  },
  
  // ==========================================================================
  // WIDE RECEIVERS
  // ==========================================================================
  'chase_jamarr': {
    id: 'chase_jamarr',
    name: "Ja'Marr Chase",
    position: 'WR',
    birthDate: '2000-03-01',
    birthPlace: 'Harvey, Louisiana',
    college: 'LSU',
    nflDraftYear: 2021,
    nflDraftRound: 1,
    nflDraftPick: 5,
    nflDraftTeam: 'CIN',
  },
  'lamb_ceedee': {
    id: 'lamb_ceedee',
    name: 'CeeDee Lamb',
    position: 'WR',
    birthDate: '1999-04-08',
    birthPlace: 'Opelousas, Louisiana',
    college: 'Oklahoma',
    nflDraftYear: 2020,
    nflDraftRound: 1,
    nflDraftPick: 17,
    nflDraftTeam: 'DAL',
  },
  'hill_tyreek': {
    id: 'hill_tyreek',
    name: 'Tyreek Hill',
    position: 'WR',
    birthDate: '1994-03-01',
    birthPlace: 'Lauderhill, Florida',
    college: 'West Alabama',
    nflDraftYear: 2016,
    nflDraftRound: 5,
    nflDraftPick: 165,
    nflDraftTeam: 'KC',
  },
  'jefferson_justin': {
    id: 'jefferson_justin',
    name: 'Justin Jefferson',
    position: 'WR',
    birthDate: '1999-06-16',
    birthPlace: 'Destrehan, Louisiana',
    college: 'LSU',
    nflDraftYear: 2020,
    nflDraftRound: 1,
    nflDraftPick: 22,
    nflDraftTeam: 'MIN',
  },
  'stbrown_amonra': {
    id: 'stbrown_amonra',
    name: 'Amon-Ra St. Brown',
    position: 'WR',
    birthDate: '1999-10-24',
    birthPlace: 'Anaheim Hills, California',
    college: 'USC',
    nflDraftYear: 2021,
    nflDraftRound: 4,
    nflDraftPick: 112,
    nflDraftTeam: 'DET',
  },
  'harrisonjr_marvin': {
    id: 'harrisonjr_marvin',
    name: 'Marvin Harrison Jr.',
    position: 'WR',
    birthDate: '2002-08-25',
    birthPlace: 'Philadelphia, Pennsylvania',
    college: 'Ohio State',
    nflDraftYear: 2024,
    nflDraftRound: 1,
    nflDraftPick: 4,
    nflDraftTeam: 'ARI',
  },
  'brown_aj': {
    id: 'brown_aj',
    name: 'A.J. Brown',
    position: 'WR',
    birthDate: '1997-06-30',
    birthPlace: 'Starkville, Mississippi',
    college: 'Ole Miss',
    nflDraftYear: 2019,
    nflDraftRound: 2,
    nflDraftPick: 51,
    nflDraftTeam: 'TEN',
  },
  'wilson_garrett': {
    id: 'wilson_garrett',
    name: 'Garrett Wilson',
    position: 'WR',
    birthDate: '2000-07-22',
    birthPlace: 'Columbus, Ohio',
    college: 'Ohio State',
    nflDraftYear: 2022,
    nflDraftRound: 1,
    nflDraftPick: 10,
    nflDraftTeam: 'NYJ',
  },
  'nacua_puka': {
    id: 'nacua_puka',
    name: 'Puka Nacua',
    position: 'WR',
    birthDate: '2001-06-17',
    birthPlace: 'Provo, Utah',
    college: 'BYU',
    nflDraftYear: 2023,
    nflDraftRound: 5,
    nflDraftPick: 177,
    nflDraftTeam: 'LAR',
  },
  'nabers_malik': {
    id: 'nabers_malik',
    name: 'Malik Nabers',
    position: 'WR',
    birthDate: '2003-07-24',
    birthPlace: 'Metairie, Louisiana',
    college: 'LSU',
    nflDraftYear: 2024,
    nflDraftRound: 1,
    nflDraftPick: 6,
    nflDraftTeam: 'NYG',
  },
  
  // ==========================================================================
  // TIGHT ENDS
  // ==========================================================================
  'laporta_sam': {
    id: 'laporta_sam',
    name: 'Sam LaPorta',
    position: 'TE',
    birthDate: '2000-11-06',
    birthPlace: 'Highland Park, Illinois',
    college: 'Iowa',
    nflDraftYear: 2023,
    nflDraftRound: 2,
    nflDraftPick: 34,
    nflDraftTeam: 'DET',
  },
  'kelce_travis': {
    id: 'kelce_travis',
    name: 'Travis Kelce',
    position: 'TE',
    birthDate: '1989-10-05',
    birthPlace: 'Westlake, Ohio',
    college: 'Cincinnati',
    nflDraftYear: 2013,
    nflDraftRound: 3,
    nflDraftPick: 63,
    nflDraftTeam: 'KC',
  },
  'mcbride_trey': {
    id: 'mcbride_trey',
    name: 'Trey McBride',
    position: 'TE',
    birthDate: '2000-02-25',
    birthPlace: 'Fort Morgan, Colorado',
    college: 'Colorado State',
    nflDraftYear: 2022,
    nflDraftRound: 2,
    nflDraftPick: 55,
    nflDraftTeam: 'ARI',
  },
  'kittle_george': {
    id: 'kittle_george',
    name: 'George Kittle',
    position: 'TE',
    birthDate: '1993-10-09',
    birthPlace: 'Madison, Wisconsin',
    college: 'Iowa',
    nflDraftYear: 2017,
    nflDraftRound: 5,
    nflDraftPick: 146,
    nflDraftTeam: 'SF',
  },
  'andrews_mark': {
    id: 'andrews_mark',
    name: 'Mark Andrews',
    position: 'TE',
    birthDate: '1995-09-06',
    birthPlace: 'Scottsdale, Arizona',
    college: 'Oklahoma',
    nflDraftYear: 2018,
    nflDraftRound: 3,
    nflDraftPick: 86,
    nflDraftTeam: 'BAL',
  },
  'bowers_brock': {
    id: 'bowers_brock',
    name: 'Brock Bowers',
    position: 'TE',
    birthDate: '2002-12-12',
    birthPlace: 'Napa, California',
    college: 'Georgia',
    nflDraftYear: 2024,
    nflDraftRound: 1,
    nflDraftPick: 13,
    nflDraftTeam: 'LV',
  },
};

// ============================================================================
// CAREER STATS - HISTORICAL (APPEND-ONLY)
// ============================================================================

const CAREER_STATS = {
  // Quarterbacks
  'allen_josh': {
    '2018': { games: 12, passYards: 2074, passTd: 10, int: 12, rushYards: 631, rushTd: 8, fantasyPts: 232.1 },
    '2019': { games: 16, passYards: 3089, passTd: 20, int: 9, rushYards: 510, rushTd: 9, fantasyPts: 291.4 },
    '2020': { games: 16, passYards: 4544, passTd: 37, int: 10, rushYards: 421, rushTd: 8, fantasyPts: 400.2 },
    '2021': { games: 17, passYards: 4407, passTd: 36, int: 15, rushYards: 763, rushTd: 6, fantasyPts: 398.8 },
    '2022': { games: 16, passYards: 4283, passTd: 35, int: 14, rushYards: 762, rushTd: 7, fantasyPts: 394.5 },
    '2023': { games: 17, passYards: 4306, passTd: 29, int: 18, rushYards: 524, rushTd: 15, fantasyPts: 382.6 },
    '2024': { games: 17, passYards: 3731, passTd: 28, int: 6, rushYards: 531, rushTd: 12, fantasyPts: 358.2 },
  },
  'mahomes_patrick': {
    '2018': { games: 16, passYards: 5097, passTd: 50, int: 12, rushYards: 272, rushTd: 2, fantasyPts: 417.4 },
    '2019': { games: 14, passYards: 4031, passTd: 26, int: 5, rushYards: 218, rushTd: 2, fantasyPts: 294.5 },
    '2020': { games: 16, passYards: 4740, passTd: 38, int: 6, rushYards: 308, rushTd: 2, fantasyPts: 378.2 },
    '2021': { games: 17, passYards: 4839, passTd: 37, int: 13, rushYards: 381, rushTd: 2, fantasyPts: 378.8 },
    '2022': { games: 17, passYards: 5250, passTd: 41, int: 12, rushYards: 358, rushTd: 4, fantasyPts: 405.2 },
    '2023': { games: 16, passYards: 4183, passTd: 27, int: 14, rushYards: 389, rushTd: 0, fantasyPts: 302.5 },
    '2024': { games: 16, passYards: 3928, passTd: 26, int: 11, rushYards: 347, rushTd: 0, fantasyPts: 285.4 },
  },
  
  // Wide Receivers
  'chase_jamarr': {
    '2021': { games: 17, rec: 81, recYards: 1455, recTd: 13, fantasyPts: 265.5 },
    '2022': { games: 16, rec: 87, recYards: 1046, recTd: 9, fantasyPts: 212.6 },
    '2023': { games: 16, rec: 100, recYards: 1216, recTd: 7, fantasyPts: 228.6 },
    '2024': { games: 17, rec: 127, recYards: 1708, recTd: 17, fantasyPts: 358.8 },
  },
  'jefferson_justin': {
    '2020': { games: 16, rec: 88, recYards: 1400, recTd: 7, fantasyPts: 228.0 },
    '2021': { games: 17, rec: 108, recYards: 1616, recTd: 10, fantasyPts: 277.6 },
    '2022': { games: 17, rec: 128, recYards: 1809, recTd: 8, fantasyPts: 296.9 },
    '2023': { games: 10, rec: 68, recYards: 1074, recTd: 5, fantasyPts: 177.4 },
    '2024': { games: 17, rec: 103, recYards: 1533, recTd: 10, fantasyPts: 268.3 },
  },
  'lamb_ceedee': {
    '2020': { games: 16, rec: 74, recYards: 935, recTd: 5, fantasyPts: 168.5 },
    '2021': { games: 17, rec: 79, recYards: 1102, recTd: 6, fantasyPts: 190.2 },
    '2022': { games: 17, rec: 107, recYards: 1359, recTd: 9, fantasyPts: 248.9 },
    '2023': { games: 17, rec: 135, recYards: 1749, recTd: 12, fantasyPts: 310.9 },
    '2024': { games: 15, rec: 101, recYards: 1194, recTd: 8, fantasyPts: 218.4 },
  },
  
  // Running Backs
  'robinson_bijan': {
    '2023': { games: 16, rushYards: 976, rushTd: 4, rec: 58, recYards: 487, recTd: 4, fantasyPts: 232.3 },
    '2024': { games: 16, rushYards: 1139, rushTd: 11, rec: 54, recYards: 495, recTd: 2, fantasyPts: 278.4 },
  },
  'barkley_saquon': {
    '2018': { games: 16, rushYards: 1307, rushTd: 11, rec: 91, recYards: 721, recTd: 4, fantasyPts: 352.8 },
    '2019': { games: 13, rushYards: 1003, rushTd: 6, rec: 52, recYards: 438, recTd: 2, fantasyPts: 217.1 },
    '2020': { games: 2, rushYards: 34, rushTd: 0, rec: 6, recYards: 60, recTd: 0, fantasyPts: 15.4 },
    '2021': { games: 13, rushYards: 593, rushTd: 2, rec: 41, recYards: 263, recTd: 2, fantasyPts: 140.6 },
    '2022': { games: 16, rushYards: 1312, rushTd: 10, rec: 57, recYards: 338, recTd: 0, fantasyPts: 257.0 },
    '2023': { games: 14, rushYards: 962, rushTd: 6, rec: 41, recYards: 280, recTd: 4, fantasyPts: 210.2 },
    '2024': { games: 16, rushYards: 2005, rushTd: 13, rec: 33, recYards: 278, recTd: 2, fantasyPts: 338.3 },
  },
  'henry_derrick': {
    '2019': { games: 16, rushYards: 1540, rushTd: 16, rec: 18, recYards: 206, recTd: 2, fantasyPts: 294.6 },
    '2020': { games: 16, rushYards: 2027, rushTd: 17, rec: 19, recYards: 114, recTd: 0, fantasyPts: 331.1 },
    '2021': { games: 8, rushYards: 937, rushTd: 10, rec: 6, recYards: 21, recTd: 0, fantasyPts: 159.8 },
    '2022': { games: 16, rushYards: 1538, rushTd: 13, rec: 33, recYards: 398, recTd: 1, fantasyPts: 286.6 },
    '2023': { games: 17, rushYards: 1167, rushTd: 12, rec: 21, recYards: 215, recTd: 1, fantasyPts: 232.2 },
    '2024': { games: 17, rushYards: 1921, rushTd: 16, rec: 16, recYards: 96, recTd: 1, fantasyPts: 318.7 },
  },
  
  // Tight Ends
  'kelce_travis': {
    '2020': { games: 15, rec: 105, recYards: 1416, recTd: 11, fantasyPts: 269.6 },
    '2021': { games: 17, rec: 92, recYards: 1125, recTd: 9, fantasyPts: 223.5 },
    '2022': { games: 17, rec: 110, recYards: 1338, recTd: 12, fantasyPts: 265.8 },
    '2023': { games: 15, rec: 93, recYards: 984, recTd: 5, fantasyPts: 183.4 },
    '2024': { games: 16, rec: 97, recYards: 823, recTd: 3, fantasyPts: 155.3 },
  },
  'laporta_sam': {
    '2023': { games: 17, rec: 86, recYards: 889, recTd: 10, fantasyPts: 208.9 },
    '2024': { games: 15, rec: 67, recYards: 790, recTd: 5, fantasyPts: 154.0 },
  },
};

// ============================================================================
// ROSTERS 2025 - CURRENT TEAM ASSIGNMENTS
// ============================================================================

const ROSTERS_2025 = {
  // Quarterbacks
  'allen_josh': { team: 'BUF' },
  'hurts_jalen': { team: 'PHI' },
  'jackson_lamar': { team: 'BAL' },
  'mahomes_patrick': { team: 'KC' },
  'daniels_jayden': { team: 'WAS' },
  'burrow_joe': { team: 'CIN' },
  'stroud_cj': { team: 'HOU' },
  'murray_kyler': { team: 'ARI' },
  'richardson_anthony': { team: 'IND' },
  'williams_caleb': { team: 'CHI' },
  
  // Running Backs
  'robinson_bijan': { team: 'ATL' },
  'hall_breece': { team: 'NYJ' },
  'gibbs_jahmyr': { team: 'DET' },
  'barkley_saquon': { team: 'PHI' },
  'taylor_jonathan': { team: 'IND' },
  'henry_derrick': { team: 'BAL' },
  'achane_devon': { team: 'MIA' },
  'williams_kyren': { team: 'LAR' },
  'jacobs_josh': { team: 'GB' },
  'pacheco_isiah': { team: 'KC' },
  
  // Wide Receivers
  'chase_jamarr': { team: 'CIN' },
  'lamb_ceedee': { team: 'DAL' },
  'hill_tyreek': { team: 'MIA' },
  'jefferson_justin': { team: 'MIN' },
  'stbrown_amonra': { team: 'DET' },
  'harrisonjr_marvin': { team: 'ARI' },
  'brown_aj': { team: 'PHI' },
  'wilson_garrett': { team: 'NYJ' },
  'nacua_puka': { team: 'LAR' },
  'nabers_malik': { team: 'NYG' },
  
  // Tight Ends
  'laporta_sam': { team: 'DET' },
  'kelce_travis': { team: 'KC' },
  'mcbride_trey': { team: 'ARI' },
  'kittle_george': { team: 'SF' },
  'andrews_mark': { team: 'BAL' },
  'bowers_brock': { team: 'LV' },
};

// Add bye weeks to rosters
for (const [playerId, data] of Object.entries(ROSTERS_2025)) {
  data.byeWeek = BYE_WEEKS[data.team] || 7;
}

// ============================================================================
// GENERATE FILES
// ============================================================================

function generateFiles() {
  console.log('\nGenerating static player data files...\n');
  
  // Ensure output directory exists
  const outputDir = path.join(__dirname, '../public/data/players');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 1. Registry (eternal biographical data)
  const registryPath = path.join(outputDir, 'registry.json');
  const registryData = {
    metadata: {
      description: 'Eternal player biographical data - never changes',
      playerCount: Object.keys(PLAYER_REGISTRY).length,
      lastUpdated: new Date().toISOString(),
    },
    players: PLAYER_REGISTRY,
  };
  fs.writeFileSync(registryPath, JSON.stringify(registryData, null, 2));
  console.log(`Created: ${registryPath}`);
  console.log(`  Players: ${Object.keys(PLAYER_REGISTRY).length}`);
  
  // 2. Career Stats (historical, append-only)
  const statsPath = path.join(outputDir, 'career-stats.json');
  const statsData = {
    metadata: {
      description: 'Historical season stats - append new seasons at year end',
      playerCount: Object.keys(CAREER_STATS).length,
      lastUpdated: new Date().toISOString(),
    },
    players: CAREER_STATS,
  };
  fs.writeFileSync(statsPath, JSON.stringify(statsData, null, 2));
  console.log(`\nCreated: ${statsPath}`);
  console.log(`  Players with stats: ${Object.keys(CAREER_STATS).length}`);
  
  // 3. Rosters (semi-static, update on trades)
  const rostersPath = path.join(outputDir, `rosters-${YEAR}.json`);
  const rostersData = {
    metadata: {
      description: 'Current team assignments - update on trades/FA signings',
      season: YEAR,
      playerCount: Object.keys(ROSTERS_2025).length,
      lastUpdated: new Date().toISOString(),
    },
    players: ROSTERS_2025,
  };
  fs.writeFileSync(rostersPath, JSON.stringify(rostersData, null, 2));
  console.log(`\nCreated: ${rostersPath}`);
  console.log(`  Players: ${Object.keys(ROSTERS_2025).length}`);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Static Player Data Generated Successfully!');
  console.log('='.repeat(50));
  console.log(`\nFiles created in: ${outputDir}`);
  console.log('\nUpdate frequency:');
  console.log('  - registry.json: Add rookies yearly');
  console.log('  - career-stats.json: Append new season after each year');
  console.log(`  - rosters-${YEAR}.json: Update on trades/signings`);
  console.log('');
}

generateFiles();

