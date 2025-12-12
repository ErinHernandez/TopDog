// Auto-generated player photo data from Underdog Fantasy
export const underdogPlayerPhotos = [];

// Helper function to get player photo URL
export const getPlayerPhotoUrl = (playerName) => {
  const player = underdogPlayerPhotos.find(p => 
    p.name.toLowerCase() === playerName.toLowerCase()
  );
  return player?.localPhotoPath || null;
};
