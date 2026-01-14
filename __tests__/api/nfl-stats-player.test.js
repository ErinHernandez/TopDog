/**
 * Tests for /api/nfl/stats/player
 * 
 * Tier 3 data routes (60%+ coverage).
 * Tests focus on error handling, caching behavior, and response format.
 */

const handler = require('../../pages/api/nfl/stats/player').default;

// Mock dependencies
jest.mock('../../lib/sportsdataio', () => ({
  getPlayerStatsByName: jest.fn(),
}));

jest.mock('../../lib/rateLimiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    check: jest.fn().mockResolvedValue({ allowed: true }),
  })),
}));

jest.mock('../../lib/apiErrorHandler', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return {
    withErrorHandling: jest.fn((req, res, fn) => fn(req, res, mockLogger)),
    validateMethod: jest.fn(),
    validateQueryParams: jest.fn(),
    requireEnvVar: jest.fn(() => 'test-api-key'),
    createSuccessResponse: jest.fn((data, statusCode, logger) => ({
      statusCode: statusCode || 200,
      body: data,
    })),
    createErrorResponse: jest.fn((type, message, extra, requestId) => ({
      statusCode: type === 'NOT_FOUND' ? 404 : type === 'RATE_LIMIT' ? 429 : 400,
      body: { message, ...extra },
    })),
    ErrorType: {
      NOT_FOUND: 'NOT_FOUND',
      RATE_LIMIT: 'RATE_LIMIT',
      VALIDATION: 'VALIDATION',
    },
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

const { getPlayerStatsByName } = require('../../lib/sportsdataio');
const { validateMethod, validateQueryParams, requireEnvVar, createSuccessResponse, createErrorResponse } = require('../../lib/apiErrorHandler');
const { RateLimiter } = require('../../lib/rateLimiter');

describe('GET /api/nfl/stats/player', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: 'GET',
      query: {
        name: 'Patrick Mahomes',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      getHeader: jest.fn(() => 'test-request-id'),
    };

    // Default mock implementation
    getPlayerStatsByName.mockResolvedValue({
      playerId: 1,
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC',
      fantasyPoints: 350,
      passingYards: 4500,
      passingTouchdowns: 38,
    });
  });

  describe('Success Cases', () => {
    it('returns player stats for valid player name', async () => {
      const currentYear = new Date().getFullYear();

      await handler(req, res);

      expect(validateMethod).toHaveBeenCalledWith(req, ['GET'], expect.any(Object));
      expect(validateQueryParams).toHaveBeenCalledWith(req, ['name'], expect.any(Object));
      expect(requireEnvVar).toHaveBeenCalledWith('SPORTSDATAIO_API_KEY', expect.any(Object));
      expect(getPlayerStatsByName).toHaveBeenCalledWith('test-api-key', 'Patrick Mahomes', currentYear, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.ok).toBe(true);
      expect(responseBody.season).toBe(currentYear);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.name).toBe('Patrick Mahomes');
    });

    it('uses specified season', async () => {
      req.query = { name: 'Patrick Mahomes', season: '2023' };

      await handler(req, res);

      expect(getPlayerStatsByName).toHaveBeenCalledWith('test-api-key', 'Patrick Mahomes', 2023, false);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.season).toBe(2023);
    });

    it('forces cache refresh when refresh=true', async () => {
      req.query = { name: 'Patrick Mahomes', refresh: 'true' };

      await handler(req, res);

      const currentYear = new Date().getFullYear();
      expect(getPlayerStatsByName).toHaveBeenCalledWith('test-api-key', 'Patrick Mahomes', currentYear, true);
    });

    it('handles default season when not provided', async () => {
      req.query = { name: 'Patrick Mahomes' };

      await handler(req, res);

      const currentYear = new Date().getFullYear();
      expect(getPlayerStatsByName).toHaveBeenCalledWith('test-api-key', 'Patrick Mahomes', currentYear, false);
    });
  });

  describe('Error Handling', () => {
    it('returns 404 when player not found', async () => {
      getPlayerStatsByName.mockResolvedValue(null);

      await handler(req, res);

      expect(getPlayerStatsByName).toHaveBeenCalled();
      expect(createErrorResponse).toHaveBeenCalledWith(
        'NOT_FOUND',
        expect.stringContaining('not found'),
        expect.objectContaining({ playerName: 'Patrick Mahomes' }),
        'test-request-id'
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('validates required query parameters', async () => {
      req.query = {}; // Missing name

      // validateQueryParams should throw or handle the error
      await handler(req, res);

      expect(validateQueryParams).toHaveBeenCalledWith(req, ['name'], expect.any(Object));
    });

    it('handles API failures gracefully', async () => {
      getPlayerStatsByName.mockRejectedValue(new Error('API error'));

      // Should be handled by withErrorHandling wrapper
      await expect(handler(req, res)).rejects.toThrow();
    });

    it('handles invalid season parameter', async () => {
      req.query = { name: 'Patrick Mahomes', season: 'invalid' };

      await handler(req, res);

      // Should default to current year
      const currentYear = new Date().getFullYear();
      expect(getPlayerStatsByName).toHaveBeenCalledWith('test-api-key', 'Patrick Mahomes', currentYear, false);
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

  describe('Case Sensitivity', () => {
    it('handles player name case variations', async () => {
      req.query = { name: 'patrick mahomes' };

      await handler(req, res);

      expect(getPlayerStatsByName).toHaveBeenCalledWith('test-api-key', 'patrick mahomes', expect.any(Number), false);
    });
  });
});
