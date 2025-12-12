/**
 * NFL Injuries API
 * 
 * GET /api/nfl/injuries
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - status: Filter by injury status (Out, Doubtful, Questionable, Probable)
 *   - refresh: Force cache refresh (true/false)
 */

import { getInjuries } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { team, position, status, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    let injuries = await getInjuries(apiKey, forceRefresh);
    
    // Filter by team
    if (team) {
      injuries = injuries.filter(i => i.Team === team.toUpperCase());
    }
    
    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      injuries = injuries.filter(i => positions.includes(i.Position));
    }
    
    // Filter by status
    if (status) {
      const statuses = status.split(',').map(s => s.toLowerCase());
      injuries = injuries.filter(i => 
        statuses.includes((i.Status || '').toLowerCase())
      );
    }
    
    // Transform for cleaner output
    const transformed = injuries.map(i => ({
      name: i.Name,
      team: i.Team,
      position: i.Position,
      status: i.Status,
      bodyPart: i.BodyPart,
      injuryStartDate: i.InjuryStartDate,
      practiceStatus: i.PracticeStatus,
      practiceDescription: i.PracticeDescription,
      playerId: i.PlayerID,
    }));
    
    return res.status(200).json({
      ok: true,
      count: transformed.length,
      data: transformed,
    });
  } catch (err) {
    console.error('Injuries API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

