/**
 * Next.js Middleware
 *
 * Handles redirects for deprecated draft room versions.
 * Part of Phase 4: Draft Version Consolidation.
 *
 * Redirects:
 * - /draft/v2/[roomId] → /draft/vx2/[roomId]
 * - /draft/v3/[roomId] → /draft/vx2/[roomId]
 * - /draft/topdog/[roomId] → /draft/vx2/[roomId]
 *
 * Note: Redirects are currently disabled pending traffic analysis.
 * Enable by setting ENABLE_DRAFT_REDIRECTS=true in environment.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if redirects are enabled
  const redirectsEnabled = process.env.ENABLE_DRAFT_REDIRECTS === 'true';
  
  if (!redirectsEnabled) {
    // Redirects disabled - allow all requests
    return NextResponse.next();
  }
  
  // Redirect old draft routes to vx2
  if (pathname.startsWith('/draft/v2/')) {
    const roomId = pathname.split('/draft/v2/')[1];
    if (roomId) {
      return NextResponse.redirect(
        new URL(`/draft/vx2/${roomId}`, request.url)
      );
    }
  }
  
  if (pathname.startsWith('/draft/v3/')) {
    const roomId = pathname.split('/draft/v3/')[1];
    if (roomId) {
      return NextResponse.redirect(
        new URL(`/draft/vx2/${roomId}`, request.url)
      );
    }
  }
  
  // Legacy topdog route
  if (pathname.startsWith('/draft/topdog/')) {
    const roomId = pathname.split('/draft/topdog/')[1];
    if (roomId) {
      return NextResponse.redirect(
        new URL(`/draft/vx2/${roomId}`, request.url)
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/draft/v2/:path*',
    '/draft/v3/:path*',
    '/draft/topdog/:path*',
  ],
};
