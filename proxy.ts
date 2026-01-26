/**
 * Next.js Proxy (successor to middleware)
 *
 * Runs before requests hit the app. Handles redirects for draft room migration
 * and removed V4 pages. Part of Phase 1: Draft Room Consolidation.
 *
 * Status: 100% VX2 Migration - All legacy routes redirect to VX2
 *
 * Redirects:
 * - /draft/v2/[roomId] → /draft/vx2/[roomId] (100% redirect)
 * - /draft/v3/[roomId] → /draft/vx2/[roomId] (100% redirect)
 * - /draft/topdog/[roomId] → /draft/vx2/[roomId] (100% redirect)
 *
 * Configuration:
 * - VX2_ROLLOUT_PERCENTAGE: 0.0 to 1.0 (0% to 100%)
 *   - 1.0 = 100% to VX2 (full migration) - DEFAULT
 *   - 0.0 = No redirects (all legacy) - For rollback only
 *   - Supports gradual rollout if needed: 0.10, 0.25, 0.50, 0.75
 *
 * Environment Variables:
 * - VX2_ROLLOUT_PERCENTAGE: Rollout percentage (default: 1.0 = 100%)
 * - ENABLE_DRAFT_REDIRECTS: Legacy flag (deprecated, use VX2_ROLLOUT_PERCENTAGE)
 *
 * Response Headers:
 * - X-VX2-Migration: 'redirected' or 'legacy' (for analytics)
 * - X-Rollout-Percentage: Current rollout percentage (for monitoring)
 *
 * Phase 1D: Full Migration - COMPLETE (100% VX2)
 * Phase 1E: Legacy Cleanup - Ready to start (after 1+ week stable)
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withMiddlewareErrorHandling } from './lib/middlewareErrorHandler';

/** Pages removed in V4 mobile-only – redirect to home */
const REMOVED_PAGES = [
  '/rankings',
  '/my-teams',
  '/exposure',
  '/profile-customization',
  '/customer-support',
  '/deposit-history',
  '/mobile-rankings',
  '/mobile-deposit-history',
  '/mobile-profile-customization',
  '/mobile',
];

/**
 * Get rollout percentage from environment
 * Supports both new (VX2_ROLLOUT_PERCENTAGE) and legacy (ENABLE_DRAFT_REDIRECTS) flags
 */
function getRolloutPercentage(): number {
  // New flag: explicit percentage (0.0 to 1.0)
  const rolloutPercent = process.env.VX2_ROLLOUT_PERCENTAGE;
  if (rolloutPercent) {
    const parsed = parseFloat(rolloutPercent);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }

  // Legacy flag: binary (true = 100%, false = 0%)
  const legacyEnabled = process.env.ENABLE_DRAFT_REDIRECTS === 'true';
  if (legacyEnabled) {
    return 1.0; // 100% if legacy flag is enabled
  }

  // Default: 100% (full migration to VX2)
  return 1.0;
}

/**
 * Generate consistent hash from user identifier
 * Uses IP + User-Agent for anonymous users, or user ID if available
 */
function getUserHash(request: NextRequest): number {
  // Try to get user ID from cookie/header (if authenticated)
  const userId =
    request.cookies.get('userId')?.value || request.headers.get('x-user-id');

  // Fallback to IP + User-Agent for anonymous users
  // Get IP from headers (NextRequest doesn't have .ip property)
  // Priority: Trusted proxies first (cf-connecting-ip, x-real-ip), then x-forwarded-for
  // x-forwarded-for can be spoofed by clients, so it's checked last
  const cfIp = request.headers.get('cf-connecting-ip'); // Cloudflare (most trusted)
  const realIp = request.headers.get('x-real-ip'); // Nginx/Vercel (trusted proxy)
  const forwardedFor = request.headers.get('x-forwarded-for'); // Can be spoofed (least trusted)
  const ip = cfIp || realIp || forwardedFor?.split(',')[0] || 'unknown';

  const identifier =
    userId || `${ip}-${request.headers.get('user-agent') || 'unknown'}`;

  // Simple hash function for consistent assignment
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return value between 0 and 1
  return Math.abs(hash % 10000) / 10000;
}

/**
 * Check if user should be redirected to VX2
 */
function shouldRedirectToVX2(
  request: NextRequest,
  rolloutPercentage: number
): boolean {
  if (rolloutPercentage === 0) {
    return false; // No rollout
  }

  if (rolloutPercentage >= 1) {
    return true; // 100% rollout
  }

  // A/B test: use consistent hash for stable assignment
  const userHash = getUserHash(request);
  return userHash < rolloutPercentage;
}

/**
 * Proxy handler: redirects for removed pages and legacy draft room migration
 */
function proxyHandler(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (REMOVED_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const rolloutPercentage = getRolloutPercentage();
  const legacyMatch = pathname.match(/^\/draft\/(v2|v3|topdog)\/(.+)$/);

  if (!legacyMatch) {
    return NextResponse.next();
  }

  // Check if user should be redirected to VX2
  const shouldRedirect = shouldRedirectToVX2(request, rolloutPercentage);

  if (shouldRedirect) {
    const roomId = legacyMatch[2];
    const redirectUrl = new URL(`/draft/vx2/${roomId}`, request.url);

    // Preserve query parameters
    redirectUrl.search = request.nextUrl.search;

    // Add header to track A/B test assignment
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('X-VX2-Migration', 'redirected');
    response.headers.set('X-Rollout-Percentage', rolloutPercentage.toString());

    return response;
  }

  // User stays on legacy version
  const response = NextResponse.next();
  response.headers.set('X-VX2-Migration', 'legacy');
  response.headers.set('X-Rollout-Percentage', rolloutPercentage.toString());

  return response;
}

export const proxy = withMiddlewareErrorHandling(proxyHandler);

export const config = {
  matcher: [
    '/rankings',
    '/my-teams',
    '/exposure',
    '/profile-customization',
    '/customer-support',
    '/deposit-history',
    '/mobile-rankings',
    '/mobile-deposit-history',
    '/mobile-profile-customization',
    '/mobile',
    '/draft/v2/:path*',
    '/draft/v3/:path*',
    '/draft/topdog/:path*',
  ],
};
