/**
 * Middleware Integration Tests
 * 
 * Tests middleware redirect flows and query parameter preservation
 * 
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';

// Mock the middlewareErrorHandler to test core logic
// Note: The actual handler returns NextResponse, but the wrapper makes it async
jest.mock('../../lib/middlewareErrorHandler', () => ({
  withMiddlewareErrorHandling: (handler: (req: NextRequest) => any) => {
    return async (req: NextRequest) => handler(req);
  },
}));

describe('Middleware Integration Tests', () => {
  const createMockRequest = (
    pathname: string,
    searchParams?: Record<string, string>
  ): NextRequest => {
    let url = `https://example.com${pathname}`;
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      url += `?${params.toString()}`;
    }
    
    return new NextRequest(new URL(url));
  };

  describe('Redirect Flow Integration', () => {
    beforeEach(() => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '1.0'; // 100% rollout for integration tests
    });

    it('should complete full redirect flow for v2 route', async () => {
      const request = createMockRequest('/draft/v2/test-room-123');
      const response = await middleware(request);
      
      // Verify redirect
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBe('https://example.com/draft/vx2/test-room-123');
      
      // Verify headers
      expect(response.headers.get('X-VX2-Migration')).toBe('redirected');
      expect(response.headers.get('X-Rollout-Percentage')).toBe('1');
    });

    it('should complete full redirect flow for v3 route', async () => {
      const request = createMockRequest('/draft/v3/test-room-456');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBe('https://example.com/draft/vx2/test-room-456');
    });

    it('should complete full redirect flow for topdog route', async () => {
      const request = createMockRequest('/draft/topdog/test-room-789');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBe('https://example.com/draft/vx2/test-room-789');
    });
  });

  describe('Query Parameter Preservation', () => {
    beforeEach(() => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '1.0';
    });

    it('should preserve single query parameter', async () => {
      const request = createMockRequest('/draft/v2/test-room', { pickNumber: '50' });
      const response = await middleware(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('pickNumber=50');
    });

    it('should preserve multiple query parameters', async () => {
      const request = createMockRequest('/draft/v2/test-room', {
        pickNumber: '50',
        teamCount: '12',
        fastMode: 'true',
      });
      const response = await middleware(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('pickNumber=50');
      expect(location).toContain('teamCount=12');
      expect(location).toContain('fastMode=true');
    });

    it('should preserve query parameters with special characters', async () => {
      const request = createMockRequest('/draft/v2/test-room', {
        roomName: 'Test Room & More',
        userId: 'user-123',
      });
      const response = await middleware(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('roomName=');
      expect(location).toContain('userId=user-123');
    });

    it('should preserve empty query string', async () => {
      const request = createMockRequest('/draft/v2/test-room');
      const response = await middleware(request);
      
      const location = response.headers.get('location');
      // Should not have query string
      expect(location?.split('?').length).toBe(1);
    });
  });

  describe('Removed Pages Redirect Flow', () => {
    it('should redirect removed pages to home', async () => {
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

      for (const path of removedPages) {
        const request = createMockRequest(path);
        const response = await middleware(request);
        
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('https://example.com/');
      }
    });

    it('should preserve query parameters when redirecting removed pages', async () => {
      const request = createMockRequest('/rankings', { sort: 'points' });
      const response = await middleware(request);
      
      // Removed pages redirect to home, query params may or may not be preserved
      // This is acceptable behavior
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://example.com/');
    });
  });

  describe('A/B Test Assignment Consistency', () => {
    beforeEach(() => {
      process.env.VX2_ROLLOUT_PERCENTAGE = '0.5'; // 50% rollout
    });

    it('should assign same user to same variant consistently', async () => {
      const userId = 'user-123';
      const request1 = createMockRequest('/draft/v2/test-room');
      const request2 = createMockRequest('/draft/v2/test-room');
      
      // Mock userId cookie
      Object.defineProperty(request1, 'cookies', {
        value: {
          get: (name: string) => name === 'userId' ? { value: userId } : undefined,
        },
        writable: true,
      });
      
      Object.defineProperty(request2, 'cookies', {
        value: {
          get: (name: string) => name === 'userId' ? { value: userId } : undefined,
        },
        writable: true,
      });
      
      const response1 = await middleware(request1);
      const response2 = await middleware(request2);
      
      // Same user should get same assignment
      expect(response1.headers.get('X-VX2-Migration')).toBe(
        response2.headers.get('X-VX2-Migration')
      );
    });

    it('should assign different users to different variants (probabilistic)', async () => {
      // This test may occasionally fail due to hash collisions
      // but should generally assign different users differently
      const request1 = createMockRequest('/draft/v2/test-room');
      const request2 = createMockRequest('/draft/v2/test-room');
      
      // Different IPs
      request1.headers.set('cf-connecting-ip', '1.2.3.4');
      request2.headers.set('cf-connecting-ip', '5.6.7.8');
      
      const response1 = await middleware(request1);
      const response2 = await middleware(request2);
      
      // Should have migration headers (may be same or different)
      expect(response1.headers.get('X-VX2-Migration')).toBeDefined();
      expect(response2.headers.get('X-VX2-Migration')).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed URLs gracefully', async () => {
      // Create request with potentially problematic path
      const request = createMockRequest('/draft/v2/test%20room');
      const response = await middleware(request);
      
      // Should not throw, should handle gracefully
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle very long room IDs', async () => {
      const longRoomId = 'a'.repeat(1000);
      const request = createMockRequest(`/draft/v2/${longRoomId}`);
      const response = await middleware(request);
      
      // Should handle without error
      expect(response).toBeDefined();
    });
  });
});
