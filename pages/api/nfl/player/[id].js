/**
 * NFL Single Player API
 * 
 * GET /api/nfl/player/[id]
 * 
 * Returns detailed player info including headshot URL
 */

import { getPlayerById } from '../../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Player ID required' });
    }
    
    const player = await getPlayerById(apiKey, id);
    
    if (!player) {
      return res.status(404).json({ 
        ok: false, 
        error: `Player with ID ${id} not found` 
      });
    }
    
    // Transform to clean output
    const data = {
      playerId: player.PlayerID,
      name: player.Name,
      firstName: player.FirstName,
      lastName: player.LastName,
      team: player.Team,
      position: player.Position,
      number: player.Number,
      height: player.Height,
      weight: player.Weight,
      age: player.Age,
      birthDate: player.BirthDate,
      college: player.College,
      experience: player.Experience,
      status: player.Status,
      headshotUrl: player.PhotoUrl,
      // Injury info
      injuryStatus: player.InjuryStatus,
      injuryBodyPart: player.InjuryBodyPart,
      injuryStartDate: player.InjuryStartDate,
      injuryNotes: player.InjuryNotes,
      // Contract/draft info
      draftYear: player.CollegeDraftYear,
      draftRound: player.CollegeDraftRound,
      draftPick: player.CollegeDraftPick,
      // Fantasy relevant
      fantasyPosition: player.FantasyPosition,
      averageDraftPosition: player.AverageDraftPosition,
      averageDraftPositionPPR: player.AverageDraftPositionPPR,
      byeWeek: player.ByeWeek,
    };
    
    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (err) {
    console.error('Player API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

