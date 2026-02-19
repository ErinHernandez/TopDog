/**
 * API Types
 * 
 * Shared types for Next.js API routes
 */

import type { NextApiRequest } from 'next';

// Extend NextApiRequest to include user property from withAuth
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string;
    email?: string;
  } | null;
}

