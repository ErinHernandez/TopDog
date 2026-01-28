/**
 * Auto-generated exposure data from CSV
 * Tournament and player exposure data for analysis
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentExposure {
  id: string;
  name: string;
  entries: number;
  userEntries: number;
  entryFee: number;
  prizes: number;
  type: string;
  draftDate: string;
  isPostDraft: boolean;
}

export interface PlayerExposureData {
  name: string;
  position: string;
  team: string;
  exposure: number;
  leagues: number;
  tournament: string;
  draftStatus: string;
  salary: number;
}

export interface ExposureData {
  tournaments: TournamentExposure[];
  playerExposure: PlayerExposureData[];
}

// ============================================================================
// DATA
// ============================================================================

// Note: This is a large auto-generated data file
// The actual data is imported from the backup file
 
const exposureDataModule = require('./exposureData.js.bak');

export const exposureData: ExposureData = exposureDataModule.exposureData || {
  tournaments: [],
  playerExposure: []
};
