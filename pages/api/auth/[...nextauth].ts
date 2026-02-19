/**
 * NextAuth API Route — catch-all handler for /api/auth/*
 *
 * Handles all NextAuth endpoints:
 *   /api/auth/signin       — Sign-in page redirect
 *   /api/auth/signout      — Sign-out
 *   /api/auth/callback/*   — OAuth callback handlers
 *   /api/auth/session      — Session endpoint
 *   /api/auth/csrf         — CSRF token
 *   /api/auth/providers    — Available providers
 *
 * Coexists with existing auth routes:
 *   /api/auth/signup.ts       — Firebase signup (untouched)
 *   /api/auth/verify-admin.ts — Admin verification (untouched)
 *   /api/auth/username/*      — Username operations (untouched)
 *
 * Next.js resolves specific routes before catch-all, so there
 * are no conflicts.
 *
 * @module pages/api/auth/[...nextauth]
 */

import NextAuth from 'next-auth';

import { authOptions } from '@/lib/studio/auth/options';

export default NextAuth(authOptions);
