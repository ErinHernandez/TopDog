import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * CSP Violation Report Endpoint
 *
 * Receives Content-Security-Policy violation reports from browsers.
 * Reports are sent when the browser blocks content that violates the CSP.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 */

interface CSPViolationReport {
  'blocked-uri'?: string;
  'violated-directive'?: string;
  'document-uri'?: string;
  'original-policy'?: string;
  'disposition'?: string;
  'effective-directive'?: string;
  'referrer'?: string;
  'script-sample'?: string;
  'source-file'?: string;
  'status-code'?: number;
  'line-number'?: number;
  'column-number'?: number;
}

interface CSPReportBody {
  'csp-report'?: CSPViolationReport;
}

interface CSPViolationLogEntry {
  blockedUri: string | undefined;
  violatedDirective: string | undefined;
  effectiveDirective: string | undefined;
  documentUri: string | undefined;
  sourceFile: string | undefined;
  lineNumber: number | undefined;
  columnNumber: number | undefined;
  timestamp: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  // Only accept POST requests (browsers send CSP reports via POST)
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as CSPReportBody;
    const report = body?.['csp-report'];

    if (report) {
      // Strip query params from document-uri to avoid logging PII
      let documentUri = report['document-uri'];
      if (documentUri) {
        try {
          documentUri = new URL(documentUri).pathname;
        } catch {
          // If URL parsing fails, use the original value
        }
      }

      const logEntry: CSPViolationLogEntry = {
        blockedUri: report['blocked-uri'],
        violatedDirective: report['violated-directive'],
        effectiveDirective: report['effective-directive'],
        documentUri,
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        columnNumber: report['column-number'],
        timestamp: new Date().toISOString(),
      };

      // Log violation for monitoring
      // In production, consider sending to Sentry, DataDog, or other logging service
      if (process.env.NODE_ENV === 'development') {
        console.warn('CSP Violation:', logEntry);
      } else {
        // Production: Log with less verbosity or send to external service
        console.warn('CSP Violation:', {
          blockedUri: logEntry.blockedUri,
          violatedDirective: logEntry.violatedDirective,
          timestamp: logEntry.timestamp,
        });
      }
    }
  } catch (error) {
    console.error('Error processing CSP report:', error);
  }

  // Return 204 No Content (standard response for CSP reports)
  res.status(204).end();
}
