/**
 * Mock Drafter Names Index
 * This file contains an array of mock drafter names that can be randomly selected from
 * for creating mock drafts with simulated participants
 */

import { serverLogger } from './logger/serverLogger';

// ============================================================================
// DATA
// ============================================================================

export const MOCK_DRAFTER_NAMES: readonly string[] = [
  // Epstein-related names
  'Little Saint James',
  'Epstein Didn\'t Kill Himself',
  'Lolita Express',
  'Flight Logs',
  
  // 9/11 themed names
  'Building 7',
  'Thermite Residue',
  'Controlled Demolition',
  'Bush Did 9/11',
  
  // COVID conspiracy names
  '5G Conspiracy',
  'Bill Gates Microchip',
  'Plandemic Believers',
  'Fauci Critics',
  
  // JFK conspiracy names
  'Magic Bullet Theory',
  'Grassy Knoll',
  'CIA Involvement',
  
  // Moon landing conspiracy names
  'Moon Landing Deniers',
  'Stanley Kubrick Studios',
  
  // Flat earth names
  'Flat Earth Society',
  'Ice Wall',
  
  // QAnon themed names
  'Q Followers',
  'Great Awakening',
  
  // Harvey Weinstein defense names
  'Weinstein Was Framed',
  'Cancel Culture',
  
  // Diddy support names
  'Diddy Defenders',
  'Diddy Didn\'t Do It',
  
  // R. Kelly support names
  'R. Kelly Defenders',
  
  // Brett Favre names
  'Free Brett Favre',
  'Favre was Framed',
  
  // Climate change questioning names
  'Climate Change Deniers',
  'Global Warming Hoax',
  
  // CIA crack names
  'CIA Crack Dealers',
  'Contra Connection',
  
  // Reptilian government names
  'Lizard People',
  'Reptilian Overlords',
  
  // Denver airport names
  'Blue Horse',
  'Underground Bunkers',
  
  // Chemtrail names
  'Chemtrail Watchers',
  'Sky Spraying',
  
  // Obama birth certificate names
  'Birther Movement',
  'Kenya Birth',
  
  // Capitol riot conspiracy names
  'False Flag Riot',
  'FBI Plants',
  
  // Antifa themed names
  'Anti-Fascist Action',
  'Black Bloc',
  
  // TWA Flight 800 related names
  'TWA 800',
  
  // Titan sub implosion names
  'Titan Implosion Fans',
  
  // Kanye West defense names
  'Kanye Defenders',
  
  // BP oil spill support names
  'BP Defenders',
  
  // Anti-recycling names
  'Recycling is a Scam',
  
  // Sex Work is Work name
  'Sex Work is Work',
  
] as const;

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Function to get a random subset of mock drafter names
 */
export const getRandomMockDrafters = (count: number = 11): string[] => {
  if (MOCK_DRAFTER_NAMES.length === 0) {
    serverLogger.warn('No mock drafter names available in index');
    return [];
  }
  
  // Shuffle the array and take the first 'count' elements
  const shuffled = [...MOCK_DRAFTER_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, MOCK_DRAFTER_NAMES.length));
};

/**
 * Function to get all available mock drafter names
 */
export const getAllMockDrafters = (): string[] => {
  return [...MOCK_DRAFTER_NAMES];
};

// CommonJS exports for backward compatibility
module.exports = {
  MOCK_DRAFTER_NAMES,
  getRandomMockDrafters,
  getAllMockDrafters
};
