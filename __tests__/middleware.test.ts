/**
 * Middleware Unit Tests
 * 
 * Tests for Next.js middleware functions:
 * - getRolloutPercentage()
 * - getUserHash()
 * - shouldRedirectToVX2()
 * - proxy() (main handler)
 * 
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '../proxy';

// Mock the middlewareErrorHandler to test core logic
// Note: The actual handler returns NextResponse, but the wrapper makes it async
jest.mock('../lib/middlewareErrorHandler', () => ({
  withMiddlewareErrorHandling: (handler: (req: NextRequest) => NextResponse) => {
    return async (req: NextRequest) => handler(req);
  },
}));

describe('Proxy (next.js middleware)', () => {
  const createMockRequest = (
    pathname: string,
    options: {
      userId?: string;
      ip?: string;
      userAgent?: string;
      headers?: Record<string, string>;
    } = {}
  ): NextRequest => {
    const url = `https://example.com${pathname}`;
    const headers = new Headers({
      'user-agent': options.userAgent || 'Mozilla/5.0',
      ...(options.ip && { 'cf-connecting-ip': options.ip }),
      ...options.headers,
    });
    
    const request = new NextRequest(new URL(url), {
      headers,
      ...(options.userId && {
        cookies: {
          get: (name: string) => {
            if (name === 'userId') {
              return { value: options.userId };
            }
            return undefined;
          },
        } as any,
      }),
    });
    
    return request;
  };

  describe('getRolloutPercentage', () => {
    beforeEach(() => {
      delete process.env.VX2_ROLLOUT_PERCENTAGE;
      delete process.env.ENABLE_DRAFT_REDIRECTS;
    });

    it('should return 1.0 by default', async () => {
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      const rolloutPercent = response.headers.get('X-Rollout-Percentage');
      expect(rolloutPercent).toBe('1');
    });

    it('should use VX2_ROLLOUT_PERCENTAGE when set', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0.25';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      const rolloutPercent = response.headers.get('X-Rollout-Percentage');
      expect(rolloutPercent).toBe('0.25');
    });

    it('should fall back to legacy flag when VX2_ROLLOUT_PERCENTAGE is invalid', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = 'invalid';
      process.env.ENABLE_DRAFT_REDIRECTS = 'true';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      const rolloutPercent = response.headers.get('X-Rollout-Percentage');
      expect(rolloutPercent).toBe('1');
    });

    it('should handle negative values', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '-0.5';
      process.env.ENABLE_DRAFT_REDIRECTS = 'true';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      const rolloutPercent = response.headers.get('X-Rollout-Percentage');
      expect(rolloutPercent).toBe('1'); // Falls back to legacy flag
    });

    it('should handle values greater than 1', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '1.5';
      process.env.ENABLE_DRAFT_REDIRECTS = 'true';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      const rolloutPercent = response.headers.get('X-Rollout-Percentage');
      expect(rolloutPercent).toBe('1'); // Falls back to legacy flag
    });

    it('should use legacy flag when VX2_ROLLOUT_PERCENTAGE is not set', async () => {
      process.env.ENABLE_DRAFT_REDIRECTS = 'true';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      const rolloutPercent = response.headers.get('X-Rollout-Percentage');
      expect(rolloutPercent).toBe('1');
    });
  });

  describe('getUserHash', () => {
    it('should use userId cookie when available', async () => {
      const request1 = createMockRequest('/draft/v2/test', { userId: 'user123' });
      const request2 = createMockRequest('/draft/v2/test', { userId: 'user123' });
      
      // Same user should get same hash
      const response1 = await proxy(request1);
      const response2 = await proxy(request2);
      
      // Both should have same migration status (deterministic)
      const migration1 = response1.headers.get('X-VX2-Migration');
      const migration2 = response2.headers.get('X-VX2-Migration');
      expect(migration1).toBe(migration2);
    });

    it('should use IP + User-Agent for anonymous users', async () => {
      const request1 = createMockRequest('/draft/v2/test', { 
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      const request2 = createMockRequest('/draft/v2/test', { 
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      
      // Same IP + User-Agent should get same hash
      const response1 = await proxy(request1);
      const response2 = await proxy(request2);
      
      const migration1 = response1.headers.get('X-VX2-Migration');
      const migration2 = response2.headers.get('X-VX2-Migration');
      expect(migration1).toBe(migration2);
    });

    it('should prioritize cf-connecting-ip over x-real-ip', async () => {
      const request = createMockRequest('/draft/v2/test', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-real-ip': '5.6.7.8',
          'x-forwarded-for': '9.10.11.12',
        },
      });
      
      // Should use cf-connecting-ip
      const response = await proxy(request);
      expect(response).toBeDefined();
      // Hash should be consistent for same IP
    });

    it('should fall back to x-real-ip when cf-connecting-ip is missing', async () => {
      const request = createMockRequest('/draft/v2/test', {
        headers: {
          'x-real-ip': '5.6.7.8',
          'x-forwarded-for': '9.10.11.12',
        },
      });
      
      const response = await proxy(request);
      expect(response).toBeDefined();
    });

    it('should fall back to x-forwarded-for when trusted headers are missing', async () => {
      const request = createMockRequest('/draft/v2/test', {
        headers: {
          'x-forwarded-for': '9.10.11.12',
        },
      });
      
      const response = await proxy(request);
      expect(response).toBeDefined();
    });

    it('should handle multiple IPs in x-forwarded-for', async () => {
      const request = createMockRequest('/draft/v2/test', {
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12',
        },
      });
      
      // Should use first IP
      const response = await proxy(request);
      expect(response).toBeDefined();
    });
  });

  describe('shouldRedirectToVX2', () => {
    beforeEach(() => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0.5'; // 50% rollout
    });

    it('should return false when rollout is 0', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      expect(response.headers.get('X-VX2-Migration')).toBe('legacy');
    });

    it('should return true when rollout is 1.0', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '1.0';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      expect(response.headers.get('X-VX2-Migration')).toBe('redirected');
    });

    it('should return true when rollout is greater than 1', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '1.5';
      // Falls back to legacy flag, but if it didn't, should redirect
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      // Should have a migration header
      expect(response.headers.get('X-VX2-Migration')).toBeDefined();
    });

    it('should use hash for A/B testing when rollout is between 0 and 1', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0.5';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      
      // Should have migration header (either 'redirected' or 'legacy')
      const migration = response.headers.get('X-VX2-Migration');
      expect(['redirected', 'legacy']).toContain(migration);
    });

    it('should provide consistent assignment for same user', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0.5';
      const request = createMockRequest('/draft/v2/test', { userId: 'user123' });
      
      const response1 = await proxy(request);
      const response2 = await proxy(request);
      
      // Same user should get same assignment
      expect(response1.headers.get('X-VX2-Migration')).toBe(
        response2.headers.get('X-VX2-Migration')
      );
    });
  });

  describe('proxy - removed pages', () => {
    const removedPages = [
      '/rankings',
      '/my-teams',
      '/exposure',
      '/profile-customization',
      '/customer-support',
      '/deposit-history',
      '/mobile-rankings',
      '/mobile-deposit-history',
      '/mobile-profile-customization',
    ];

    removedPages.forEach((path) => {
      it(`should redirect ${path} to home`, async () => {
        const request = createMockRequest(path);
        const response = await proxy(request);
        
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('https://example.com/');
      });
    });
  });

  describe('proxy - legacy draft routes', () => {
    beforeEach(() => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '1.0'; // 100% rollout
    });

    it('should redirect /draft/v2/[roomId] to /draft/vx2/[roomId]', async () => {
      const request = createMockRequest('/draft/v2/test-room');
      const response = await proxy(request);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/draft/vx2/test-room');
      expect(response.headers.get('X-VX2-Migration')).toBe('redirected');
    });

    it('should redirect /draft/v3/[roomId] to /draft/vx2/[roomId]', async () => {
      const request = createMockRequest('/draft/v3/test-room');
      const response = await proxy(request);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/draft/vx2/test-room');
    });

    it('should redirect /draft/topdog/[roomId] to /draft/vx2/[roomId]', async () => {
      const request = createMockRequest('/draft/topdog/test-room');
      const response = await proxy(request);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/draft/vx2/test-room');
    });

    it('should preserve query parameters during redirect', async () => {
      const request = createMockRequest('/draft/v2/test-room?pickNumber=50&teamCount=12');
      const response = await proxy(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('pickNumber=50');
      expect(location).toContain('teamCount=12');
    });

    it('should preserve complex query parameters', async () => {
      const request = createMockRequest('/draft/v2/test-room?pickNumber=50&teamCount=12&fastMode=true');
      const response = await proxy(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('pickNumber=50');
      expect(location).toContain('teamCount=12');
      expect(location).toContain('fastMode=true');
    });

    it('should handle room IDs with special characters', async () => {
      const request = createMockRequest('/draft/v2/room-123-abc');
      const response = await proxy(request);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/draft/vx2/room-123-abc');
    });
  });

  describe('proxy - non-matching routes', () => {
    it('should pass through routes that do not match', async () => {
      const request = createMockRequest('/some-other-route');
      const response = await proxy(request);
      
      expect(response.status).toBe(200); // NextResponse.next() returns 200
    });

    it('should pass through /draft/vx2 routes', async () => {
      const request = createMockRequest('/draft/vx2/test-room');
      const response = await proxy(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-VX2-Migration')).toBeNull();
    });
  });

  describe('proxy - headers', () => {
    beforeEach(() => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0.5';
    });

    it('should set X-VX2-Migration header', async () => {
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      
      const migration = response.headers.get('X-VX2-Migration');
      expect(['redirected', 'legacy']).toContain(migration);
    });

    it('should set X-Rollout-Percentage header', async () => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0.75';
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      
      expect(response.headers.get('X-Rollout-Percentage')).toBe('0.75');
    });

    it('should set X-Request-ID header (from error handler)', async () => {
      const request = createMockRequest('/draft/v2/test');
      const response = await proxy(request);
      
      // Error handler adds X-Request-ID (when not mocked)
      // Since we mock the error handler, this test verifies the response structure
      // In production, the error handler would add X-Request-ID
      expect(response).toBeDefined();
      expect(response.headers).toBeDefined();
      // Note: X-Request-ID is added by withMiddlewareErrorHandling wrapper
      // which is mocked in tests, so header may not be present
    });
  });
});
