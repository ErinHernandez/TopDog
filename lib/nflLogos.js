// Auto-generated NFL logo mapping
export const nflLogoMapping = {
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

// Function to get logo URL for a team
export function getNflLogoUrl(teamCode) {
  return nflLogoMapping[teamCode] || '/logos/nfl/default.png';
}
