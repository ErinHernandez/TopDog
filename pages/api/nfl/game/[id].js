/**
 * NFL Single Game / Box Score API
 * 
 * GET /api/nfl/game/[id]
 * 
 * Returns detailed box score for a specific game.
 * Includes player stats, scoring plays, etc.
 */

import { fetchBoxScore } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../components/draft/v3/constants/positions';

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
      return res.status(400).json({ error: 'Game ID required' });
    }
    
    const boxScore = await fetchBoxScore(apiKey, id);
    
    if (!boxScore || !boxScore.Score) {
      return res.status(404).json({ 
        ok: false, 
        error: `Game with ID ${id} not found` 
      });
    }
    
    // Transform to cleaner format
    const game = boxScore.Score;
    const data = {
      gameId: game.ScoreID,
      gameKey: game.GameKey,
      season: game.Season,
      week: game.Week,
      date: game.Date,
      dateTime: game.DateTime,
      
      // Teams & Scores
      homeTeam: game.HomeTeam,
      awayTeam: game.AwayTeam,
      homeScore: game.HomeScore,
      awayScore: game.AwayScore,
      
      // Quarter scores
      scoring: {
        home: {
          q1: game.HomeScoreQuarter1,
          q2: game.HomeScoreQuarter2,
          q3: game.HomeScoreQuarter3,
          q4: game.HomeScoreQuarter4,
          ot: game.HomeScoreOvertime,
          total: game.HomeScore,
        },
        away: {
          q1: game.AwayScoreQuarter1,
          q2: game.AwayScoreQuarter2,
          q3: game.AwayScoreQuarter3,
          q4: game.AwayScoreQuarter4,
          ot: game.AwayScoreOvertime,
          total: game.AwayScore,
        },
      },
      
      // Game State
      status: game.Status,
      quarter: game.Quarter,
      timeRemaining: game.TimeRemaining,
      possession: game.Possession,
      down: game.Down,
      distance: game.Distance,
      yardLine: game.YardLine,
      redZone: game.RedZone,
      
      // Player Stats (fantasy-relevant only)
      playerStats: (boxScore.PlayerGames || [])
        .filter(p => POSITIONS.includes(p.Position))
        .map(p => ({
          playerId: p.PlayerID,
          name: p.Name,
          team: p.Team,
          position: p.Position,
          fantasyPointsPPR: p.FantasyPointsPPR || 0,
          passingYards: p.PassingYards || 0,
          passingTDs: p.PassingTouchdowns || 0,
          rushingYards: p.RushingYards || 0,
          rushingTDs: p.RushingTouchdowns || 0,
          receptions: p.Receptions || 0,
          receivingYards: p.ReceivingYards || 0,
          receivingTDs: p.ReceivingTouchdowns || 0,
        }))
        .sort((a, b) => b.fantasyPointsPPR - a.fantasyPointsPPR),
      
      // Scoring plays
      scoringPlays: boxScore.ScoringPlays || [],
    };
    
    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (err) {
    console.error('Game API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

