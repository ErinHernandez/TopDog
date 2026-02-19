/**
 * Next.js Instrumentation Hook
 *
 * Initializes OpenTelemetry tracing for the application.
 * Next.js automatically calls this file's `register()` function once
 * when a new Node.js process starts.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @module instrumentation
 */

export async function register() {
  // Only register on the server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { Resource } = await import('@opentelemetry/resources');
    const {
      ATTR_SERVICE_NAME,
      ATTR_SERVICE_VERSION,
      ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
    } = await import('@opentelemetry/semantic-conventions');
    const { SimpleSpanProcessor, ConsoleSpanExporter } = await import(
      '@opentelemetry/sdk-trace-node'
    );
    const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');

    const isDev = process.env.NODE_ENV === 'development';
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    // Build exporters: always OTLP if configured, console in dev as fallback
    const exporters: any[] = [];

    if (otlpEndpoint) {
      exporters.push(
        new OTLPTraceExporter({
          url: `${otlpEndpoint}/v1/traces`,
          headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
            ? Object.fromEntries(
                process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map(h => {
                  const [key, ...rest] = h.split('=');
                  return [key.trim(), rest.join('=').trim()];
                }),
              )
            : undefined,
        }),
      );
    } else if (isDev) {
      exporters.push(new ConsoleSpanExporter());
    }

    if (exporters.length === 0) {
      // No exporters configured — skip tracing initialization
      return;
    }

    const sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: 'idesaign',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
        [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]:
          process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        'service.instance.id': process.env.VERCEL_REGION || 'local',
        'git.commit.sha': process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown',
      }),
      spanProcessors: exporters.map(exp => new SimpleSpanProcessor(exp)),
      instrumentations: [
        new HttpInstrumentation({
          // Only trace requests to our own API and external AI providers
          ignoreIncomingRequestHook: req => {
            const url = req.url || '';
            // Skip static assets and Next.js internals
            return url.startsWith('/_next/') || url.startsWith('/favicon') || url.endsWith('.map');
          },
        }),
      ],
    });

    sdk.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .then(() => console.warn('[otel] Tracing shut down'))
        .catch(err => console.error('[otel] Shutdown error', err));
    });
  }
}
