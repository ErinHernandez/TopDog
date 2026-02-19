/**
 * Server-side authentication guard for protected pages.
 *
 * Usage in any protected page:
 * ```ts
 * export { getServerSideProps } from '@/lib/auth/withServerAuth';
 * ```
 *
 * Or with custom logic:
 * ```ts
 * export const getServerSideProps = withServerAuth(async (ctx, user) => {
 *   return { props: { userId: user.uid } };
 * });
 * ```
 *
 * @module lib/auth/withServerAuth
 */

import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getAdminAuth } from '@/lib/firebase/server';
import type { DecodedIdToken } from 'firebase-admin/auth';

/** Decoded user token passed to the inner getServerSideProps handler. */
export type ServerAuthUser = DecodedIdToken;

type AuthenticatedHandler<P extends Record<string, unknown> = Record<string, unknown>> = (
  ctx: GetServerSidePropsContext,
  user: ServerAuthUser,
) => Promise<GetServerSidePropsResult<P>>;

/**
 * Higher-order function that wraps `getServerSideProps` with Firebase token verification.
 *
 * Reads the `__session` cookie (set by Firebase Auth on the client) or falls back
 * to the `Authorization: Bearer <token>` header pattern used during SSR hydration.
 *
 * On failure, redirects to `/login?returnUrl=<currentPath>`.
 */
export function withServerAuth<P extends Record<string, unknown> = Record<string, unknown>>(
  handler?: AuthenticatedHandler<P>,
): GetServerSideProps<P> {
  return async (ctx) => {
    const token =
      ctx.req.cookies['__session'] ??
      ctx.req.headers.authorization?.replace('Bearer ', '') ??
      null;

    if (!token) {
      return redirectToLogin(ctx);
    }

    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(token);

      if (!decoded.email_verified) {
        return redirectToLogin(ctx);
      }

      if (handler) {
        return handler(ctx, decoded);
      }

      return { props: {} as P };
    } catch {
      // Token invalid or expired — redirect to login
      return redirectToLogin(ctx);
    }
  };
}

function redirectToLogin(ctx: GetServerSidePropsContext) {
  const returnUrl = encodeURIComponent(ctx.resolvedUrl);
  return {
    redirect: {
      destination: `/login?returnUrl=${returnUrl}`,
      permanent: false,
    },
  } as const;
}

/**
 * Default export for simple protected pages that don't need custom props.
 *
 * Usage: `export { getServerSideProps } from '@/lib/auth/withServerAuth';`
 */
export const getServerSideProps: GetServerSideProps = withServerAuth();
