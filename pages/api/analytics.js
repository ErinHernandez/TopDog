/**
 * Analytics API Endpoint
 * 
 * POST /api/analytics
 * 
 * Receives analytics events from the client and logs them.
 * Currently a stub endpoint - can be extended to send to external analytics services.
 */

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, data, timestamp, userId, sessionId } = req.body;

    // Log analytics event (in production, you might send to external service)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', { event, userId, sessionId, timestamp });
    }

    // Return success response
    return res.status(200).json({ 
      ok: true,
      message: 'Analytics event received' 
    });
  } catch (err) {
    console.error('Analytics API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

