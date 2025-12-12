/**
 * NFL Current Week API
 * 
 * GET /api/nfl/current-week
 * 
 * Returns the current NFL week/season information.
 */

import { getCurrentWeek } from '../../../lib/sportsdataio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const current = await getCurrentWeek(apiKey);
    
    if (!current) {
      return res.status(200).json({
        ok: true,
        message: 'No current NFL week (offseason)',
        data: null,
      });
    }
    
    return res.status(200).json({
      ok: true,
      data: current,
    });
  } catch (err) {
    console.error('Current Week API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

