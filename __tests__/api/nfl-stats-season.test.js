/**
 * Tests for /api/nfl/stats/season
 * 
 * Tier 3 data routes (60%+ coverage).
 * Tests focus on error handling, caching behavior, and response format.
 */

import handler from '../../pages/api/nfl/stats/season';

// Mock dependencies
jest.mock('../../lib/sportsdataio', () => ({
  getPlayerSeasonStats: jest.fn(),
}));

jest.mock('../../lib/playerModel', () => ({
  transformPlayerStats: jest.fn((p) => ({
    playerId: p.PlayerID,
    name: p.Name,
    position: p.Position,
    fantasyPoints: p.FantasyPointsPPR || 0,
  })),
  FANTASY_POSITIONS: ['QB', 'RB', 'WR', 'TE'],
}));

jest.mock('../../lib/rateLimiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    check: jest.fn().mockResolvedValue({ allowed: true }),
  })),
}));

jest.mock('../../lib/apiErrorHandler', () => {
  const actual = jest.requireActual('../../lib/apiErrorHandler');
  return {
    ...actual,
    withErrorHandling: jest.fn((req, res, fn) => fn(req, res, mockLogger)),
    validateMethod: jest.fn(),
    requireEnvVar: jest.fn(() => 'test-api-key'),
    createSuccessResponse: jest.fn((data, status, logger) => ({
      statusCode: status || 200,
      body: data,
    })),
    createErrorResponse: jest.fn((type, message, extra, requestId) => ({
      statusCode: type === 'RATE_LIMIT' ? 429 : type === 'NOT_FOUND' ? 404 : 400,
      body: { message, ...extra },
    })),
  };
});

jest.mock('../../lib/structuredLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const { getPlayerSeasonStats } = require('../../lib/sportsdataio');
const { validateMethod, requireEnvVar, createSuccessResponse, createErrorResponse } = require('../../lib/apiErrorHandler');
const { transformPlayerStats, FANTASY_POSITIONS } = require('../../lib/playerModel');
const { RateLimiter } = require('../../lib/rateLimiter');

describe('GET /api/nfl/stats/season', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: 'GET',
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      getHeader: jest.fn(() => 'test-request-id'),
    };

    // Default mock implementations
    getPlayerSeasonStats.mockResolvedValue([
      {
        PlayerID: 1,
        Name: 'Patrick Mahomes',
        Position: 'QB',
        Team: 'KC',
        FantasyPointsPPR: 350,
        FantasyPointsHalfPPR: 320,
        FantasyPoints: 290,
        PassingYards: 4500,
        PassingTouchdowns: 38,
        RushingYards: 200,
        RushingTouchdowns: 4,
      },
      {
        PlayerID: 2,
        Name: 'Christian McCaffrey',
        Position: 'RB',
        Team: 'SF',
        FantasyPointsPPR: 380,
        FantasyPointsHalfPPR: 340,
        FantasyPoints: 300,
        RushingYards: 1500,
        RushingTouchdowns: 14,
        Receptions: 67,
        ReceivingYards: 550,
        ReceivingTouchdowns: 7,
      },
      {
        PlayerID: 3,
        Name: 'Tyreek Hill',
        Position: 'WR',
        Team: 'MIA',
        FantasyPointsPPR: 360,
        FantasyPointsHalfPPR: 330,
        FantasyPoints: 300,
        Receptions: 119,
        ReceivingYards: 1799,
        ReceivingTouchdowns: 13,
      },
    ]);
  });

  describe('Success Cases', () => {
    it('returns season stats with default parameters', async () => {
      const currentYear = new Date().getFullYear();

      await handler(req, res);

      expect(validateMethod).toHaveBeenCalledWith(req, ['GET'], mockLogger);
      expect(requireEnvVar).toHaveBeenCalledWith('SPORTSDATAIO_API_KEY', mockLogger);
      expect(getPlayerSeasonStats).toHaveBeenCalledWith('test-api-key', currentYear, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.ok).toBe(true);
      expect(responseBody.season).toBe(currentYear);
      expect(responseBody.data).toHaveLength(3);
      expect(responseBody.count).toBe(3);
      expect(responseBody.total).toBe(3);
    });

    it('filters by position', async () => {
      req.query = { position: 'QB' };

      await handler(req, res);

      expect(getPlayerSeasonStats).toHaveBeenCalled();
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toHaveLength(1);
      expect(responseBody.data[0].position).toBe('QB');
    });

    it('filters by multiple positions', async () => {
      req.query = { position: 'QB,RB' };

      await handler(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toHaveLength(2);
      expect(responseBody.data.some(p => p.position === 'QB')).toBe(true);
      expect(responseBody.data.some(p => p.position === 'RB')).toBe(true);
    });

    it('filters by team', async () => {
      req.query = { team: 'KC' };

      await handler(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toHaveLength(1);
      expect(responseBody.data[0].name).toBe('Patrick Mahomes');
    });

    it('sorts by PPR (default)', async () => {
      await handler(req, res);

      const responseBody = res.json.mock.calls[0][0];
      // Should be sorted by PPR descending
      expect(responseBody.data[0].fantasyPoints).toBeGreaterThanOrEqual(responseBody.data[1].fantasyPoints);
    });

    it('sorts by half-PPR', async () => {
      req.query = { sort: 'half' };

      await handler(req, res);

      expect(getPlayerSeasonStats).toHaveBeenCalled();
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toBeDefined();
    });

    it('sorts by standard scoring', async () => {
      req.query = { sort: 'standard' };

      await handler(req, res);

      expect(getPlayerSeasonStats).toHaveBeenCalled();
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toBeDefined();
    });

    it('limits results', async () => {
      req.query = { limit: '2' };

      await handler(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toHaveLength(2);
      expect(responseBody.count).toBe(2);
      expect(responseBody.total).toBe(3);
    });

    it('forces cache refresh when refresh=true', async () => {
      req.query = { refresh: 'true' };

      await handler(req, res);

      expect(getPlayerSeasonStats).toHaveBeenCalledWith('test-api-key', expect.any(Number), true);
    });

    it('uses specified season', async () => {
      req.query = { season: '2023' };

      await handler(req, res);

      expect(getPlayerSeasonStats).toHaveBeenCalledWith('test-api-key', 2023, false);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.season).toBe(2023);
    });

    it('filters to fantasy-relevant positions only', async () => {
      getPlayerSeasonStats.mockResolvedValue([
        {
          PlayerID: 1,
          Name: 'Patrick Mahomes',
          Position: 'QB',
          Team: 'KC',
          FantasyPointsPPR: 350,
        },
        {
          PlayerID: 2,
          Name: 'Aaron Donald',
          Position: 'DT', // Not fantasy-relevant
          Team: 'LAR',
          FantasyPointsPPR: 0,
        },
      ]);

      await handler(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toHaveLength(1);
      expect(responseBody.data[0].position).toBe('QB');
    });
  });

  describe('Error Handling', () => {
    it('handles API failures gracefully', async () => {
      getPlayerSeasonStats.mockRejectedValue(new Error('API error'));

      await handler(req, res);

      // Should be handled by withErrorHandling wrapper
      expect(getPlayerSeasonStats).toHaveBeenCalled();
    });

    it('handles empty results', async () => {
      getPlayerSeasonStats.mockResolvedValue([]);

      await handler(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data).toEqual([]);
      expect(responseBody.count).toBe(0);
      expect(responseBody.total).toBe(0);
    });

    it('handles invalid season parameter', async () => {
      req.query = { season: 'invalid' };

      await handler(req, res);

      // Should default to current year
      const currentYear = new Date().getFullYear();
      expect(getPlayerSeasonStats).toHaveBeenCalledWith('test-api-key', currentYear, false);
    });

    it('handles invalid limit parameter', async () => {
      req.query = { limit: 'invalid' };

      await handler(req, res);

      // Should handle gracefully (parseInt returns NaN, slice handles it)
      expect(getPlayerSeasonStats).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('enforces rate limits', async () => {
      const rateLimiter = new RateLimiter();
      rateLimiter.check.mockResolvedValue({
        allowed: false,
        retryAfterMs: 5000,
      });

      await handler(req, res);

      expect(rateLimiter.check).toHaveBeenCalledWith(req);
      expect(createErrorResponse).toHaveBeenCalledWith(
        'RATE_LIMIT',
        'Rate limit exceeded',
        { retryAfter: 5 },
        'test-request-id'
      );
    });
  });
});
