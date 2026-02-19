/**
 * Auto-generated player photo data from Underdog Fantasy
 * Helper functions for retrieving player photo URLs
 */

// ============================================================================
// TYPES
// ============================================================================

export interface UnderdogPlayerPhoto {
  name: string;
  localPhotoPath: string;
}

// ============================================================================
// DATA
// ============================================================================

/**
 * Auto-generated player photo data from Underdog Fantasy
 */
export const underdogPlayerPhotos: UnderdogPlayerPhoto[] = [];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function to get player photo URL
 * @param playerName - The name of the player
 * @returns The local photo path if found, null otherwise
 */
export const getPlayerPhotoUrl = (playerName: string): string | null => {
  const player = underdogPlayerPhotos.find(p => 
    p.name.toLowerCase() === playerName.toLowerCase()
  );
  return player?.localPhotoPath || null;
};
