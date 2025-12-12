export default async function handler(req, res) {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'SPORTSDATAIO_API_KEY is not configured on the server.' });
  }

  try {
    // Player Season Projection Stats endpoint
    const season = new Date().getFullYear(); // e.g., 2025
    const url = `https://api.sportsdata.io/v3/nfl/projections/json/PlayerSeasonProjectionStats/${season}?key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: 'SportsDataIO request failed',
        status: response.status,
        body: text,
      });
    }

    const data = await response.json();

    // Sort by projected fantasy points (descending) and return top players
    const sorted = Array.isArray(data) 
      ? data.sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0))
      : [];

    return res.status(200).json({
      ok: true,
      season,
      playerCount: sorted.length,
      sample: sorted.slice(0, 10), // Top 10 projected players
      allPlayers: sorted, // Full list for further use
    });
  } catch (err) {
    console.error('SportsDataIO test error', err);
    return res.status(500).json({ error: 'Unexpected error calling SportsDataIO.' });
  }
}
