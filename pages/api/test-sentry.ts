import type { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';
import { logger } from '../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../lib/apiErrorHandler';

/**
 * Test endpoint to verify Sentry error tracking is working
 * GET /api/test-sentry - Returns success message
 * POST /api/test-sentry - Triggers a test error and sends it to Sentry
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET', 'POST'], logger);
    
    if (req.method === 'GET') {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      const isConfigured = !!dsn;
      
      const response = createSuccessResponse({
        success: true,
        message: 'Sentry test endpoint',
        sentryConfigured: isConfigured,
        dsnPresent: isConfigured,
        instructions: {
          method: 'POST',
          description: 'Send a POST request to trigger a test error',
          curl: 'curl -X POST http://localhost:3000/api/test-sentry',
        },
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
    }

    // POST request - trigger test error
    const { type = 'error', message = 'Test error from BestBall - Sentry integration test', component } = req.body || {};

    logger.info('Test Sentry error triggered', {
      component: 'test-sentry',
      errorType: type,
      componentTag: component,
      timestamp: new Date().toISOString(),
    });

    // Create a test error
    const testError = new Error(`🧪 ${message}`);
    testError.name = 'SentryTestError';
    
    // Add custom context with Sentry scope
    Sentry.withScope((scope) => {
      // Set component tag if provided
      if (component) {
        scope.setTag('component', component);
      }
      
      // Set error level based on type
      if (type === 'fatal') {
        scope.setLevel('fatal');
      } else if (type === 'warning') {
        scope.setLevel('warning');
      } else {
        scope.setLevel('error');
      }
      
      // Add context
      scope.setContext('test', {
      purpose: 'Verify Sentry integration',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
        testType: type,
        component: component || undefined,
    });

      // Add user context
    Sentry.setUser({
      id: 'test-user',
      username: 'test-user',
    });

    // Capture the exception
    Sentry.captureException(testError);
    });

    // Also log it normally
    logger.error('Test error captured by Sentry', testError, {
      component: 'test-sentry',
    });

    const response = createSuccessResponse({
      success: true,
      message: 'Test error sent to Sentry!',
      error: {
        name: testError.name,
        message: testError.message,
      },
      instructions: {
        step1: 'Check your Sentry dashboard',
        step2: 'The error should appear within 30 seconds',
        step3: 'Look for "SentryTestError" in the Issues feed',
        dashboard: 'https://topdogdog.sentry.io/issues/',
      },
      testParams: {
        type: type || 'error',
        component: component || undefined,
        message: message,
      },
      timestamp: new Date().toISOString(),
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}
