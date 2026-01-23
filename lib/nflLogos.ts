/**
 * Auto-generated NFL logo mapping
 * Provides logo URLs for NFL teams
 */

// ============================================================================
// TYPES
// ============================================================================

export type NFLTeamCode = 
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI'
  | 'CIN' | 'CLE' | 'DAL' | 'DEN' | 'DET' | 'GB'
  | 'HOU' | 'IND' | 'JAX' | 'KC' | 'LAC' | 'LAR'
  | 'LV' | 'MIA' | 'MIN' | 'NE' | 'NO' | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SEA' | 'SF' | 'TB'
  | 'TEN' | 'WAS';

// ============================================================================
// CONSTANTS
// ============================================================================

export const nflLogoMapping: Record<NFLTeamCode, string> = {
  "ARI": "/logos/nfl/ari.png",
  "ATL": "/logos/nfl/atl.png",
  "BAL": "/logos/nfl/bal.png",
  "BUF": "/logos/nfl/buf.png",
  "CAR": "/logos/nfl/car.png",
  "CHI": "/logos/nfl/chi.png",
  "CIN": "/logos/nfl/cin.png",
  "CLE": "/logos/nfl/cle.png",
  "DAL": "/logos/nfl/dal.png",
  "DEN": "/logos/nfl/den.png",
  "DET": "/logos/nfl/det.png",
  "GB": "/logos/nfl/gb.png",
  "HOU": "/logos/nfl/hou.png",
  "IND": "/logos/nfl/ind.png",
  "JAX": "/logos/nfl/jax.png",
  "KC": "/logos/nfl/kc.png",
  "LAC": "/logos/nfl/lac.png",
  "LAR": "/logos/nfl/lar.png",
  "LV": "/logos/nfl/lv.png",
  "MIA": "/logos/nfl/mia.png",
  "MIN": "/logos/nfl/min.png",
  "NE": "/logos/nfl/ne.png",
  "NO": "/logos/nfl/no.png",
  "NYG": "/logos/nfl/nyg.png",
  "NYJ": "/logos/nfl/nyj.png",
  "PHI": "/logos/nfl/phi.png",
  "PIT": "/logos/nfl/pit.png",
  "SEA": "/logos/nfl/sea.png",
  "SF": "/logos/nfl/sf.png",
  "TB": "/logos/nfl/tb.png",
  "TEN": "/logos/nfl/ten.png",
  "WAS": "/logos/nfl/was.png"
};

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Function to get logo URL for a team
 * @param teamCode - NFL team code
 * @returns Logo URL or default logo URL
 */
export function getNflLogoUrl(teamCode: NFLTeamCode | string): string {
  return nflLogoMapping[teamCode as NFLTeamCode] || '/logos/nfl/default.png';
}
