import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { getServerSideProps as _getServerSideProps } from '@/lib/auth/withServerAuth';
import styles from '@/styles/observability.module.css';

export const getServerSideProps = _getServerSideProps;

interface Metric {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  totalRequests: number;
  errorRate: number;
  p95Latency: number;
}

interface RoutePerformance {
  route: string;
  requests: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
}

interface Memory {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
}

/** Raw API response shape from /api/studio/admin/observability/metrics */
interface MetricsApiResponse {
  globalMetrics: {
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    uptimeMs: number;
    collectionStartedAt: number;
    routes: Array<{
      route: string;
      requestCount: number;
      errorCount: number;
      errorRate: number;
      latencyP50: number;
      latencyP95: number;
      latencyP99: number;
      lastRequestAt: number;
    }>;
  };
  serverMemory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    externalMb: number;
  };
  timestamp: string;
  requestId: string;
}

interface Incident {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'resolved';
  service: string;
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

interface IncidentsResponse {
  incidents: Incident[];
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: string;
  severity: 'critical' | 'warning' | 'info';
  channels: string[];
  enabled: boolean;
}

interface AlertsResponse {
  rules: AlertRule[];
  summary: {
    totalRules: number;
    enabledRules: number;
    countBySeverity: { critical: number; warning: number; info: number };
  };
}

type SortField = 'route' | 'requests' | 'errorRate' | 'p50' | 'p95' | 'p99';
type SortOrder = 'asc' | 'desc';
type AlertFilter = 'all' | 'critical' | 'warning' | 'info';

export default function ObservabilityPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <ObservabilityContent />
    </ProtectedRoute>
  );
}

function ObservabilityContent() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<Metric | null>(null);
  const [routes, setRoutes] = useState<RoutePerformance[]>([]);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const [sortField, setSortField] = useState<SortField>('requests');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [metricsRes, incidentsRes, alertsRes] = await Promise.allSettled([
        fetch('/api/studio/admin/observability/metrics', { headers }),
        fetch('/api/studio/admin/observability/incidents', { headers }),
        fetch('/api/studio/admin/observability/alerts', { headers }),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const data: MetricsApiResponse = await metricsRes.value.json();
        const gm = data.globalMetrics;
        const avgP95 = gm.routes.length > 0
          ? gm.routes.reduce((sum, r) => sum + r.latencyP95, 0) / gm.routes.length
          : 0;
        setMetrics({
          overallHealth: gm.errorRate > 5 ? 'unhealthy' : gm.errorRate > 1 ? 'degraded' : 'healthy',
          totalRequests: gm.totalRequests,
          errorRate: gm.errorRate,
          p95Latency: Math.round(avgP95),
        });
        setRoutes(
          gm.routes.map((r) => ({
            route: r.route,
            requests: r.requestCount,
            errorRate: r.errorRate,
            p50: r.latencyP50,
            p95: r.latencyP95,
            p99: r.latencyP99,
          }))
        );
        setMemory({
          heapUsed: data.serverMemory.heapUsedMb,
          heapTotal: data.serverMemory.heapTotalMb,
          rss: data.serverMemory.rssMb,
          external: data.serverMemory.externalMb,
        });
      } else if (metricsRes.status === 'fulfilled') {
        setError(`Failed to fetch metrics: ${metricsRes.value.status}`);
      }

      if (incidentsRes.status === 'fulfilled' && incidentsRes.value.ok) {
        const data: IncidentsResponse = await incidentsRes.value.json();
        setIncidents(data.incidents || []);
      } else if (incidentsRes.status === 'fulfilled') {
        setError(`Failed to fetch incidents: ${incidentsRes.value.status}`);
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const data: AlertsResponse = await alertsRes.value.json();
        setAlerts(data.rules || []);
      } else if (alertsRes.status === 'fulfilled') {
        setError(`Failed to fetch alerts: ${alertsRes.value.status}`);
      }

      setLastRefresh(new Date());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        fetchData();
      }, 15000);
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefresh, fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedRoutes = [...routes].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return 0;
  });

  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === 'all') return true;
    return alert.severity === alertFilter;
  });

  const alertCounts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };

  const getErrorRateColor = (rate: number): string => {
    if (rate < 1) return '#22c55e';
    if (rate < 5) return '#eab308';
    return '#ef4444';
  };

  const getLatencyColor = (latency: number): string => {
    if (latency < 500) return '#22c55e';
    if (latency < 2000) return '#eab308';
    return '#ef4444';
  };

  const formatTimestamp = (ts: string): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getHealthStatusDot = (status: string): string => {
    switch (status) {
      case 'healthy':
        return styles.statusHealthy;
      case 'degraded':
        return styles.statusDegraded;
      case 'unhealthy':
        return styles.statusUnhealthy;
      default:
        return styles.statusHealthy;
    }
  };

  const getSeverityBadgeClass = (severity: string): string => {
    switch (severity) {
      case 'P1':
      case 'critical':
        return styles.severityCritical;
      case 'P2':
      case 'warning':
        return styles.severityWarning;
      case 'P3':
      case 'info':
        return styles.severityInfo;
      case 'P4':
        return styles.severityLow;
      default:
        return styles.severityLow;
    }
  };

  const memoryPercentage = memory ? (memory.heapUsed / memory.heapTotal) * 100 : 0;

  return (
    <div className={styles.container}>
      {error && <div className={styles.errorState}>{error}</div>}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Observability</h1>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.refreshInfo}>
            <span>Last refresh:</span>
            <span>{lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}</span>
          </div>

          <button className={styles.refreshButton} onClick={fetchData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          <div className={styles.autoRefreshToggle}>
            <span>Auto-refresh</span>
            <button
              className={`${styles.toggleSwitch} ${autoRefresh ? styles.enabled : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              role="switch"
              aria-checked={autoRefresh}
            >
              <div className={styles.toggleSlider} />
            </button>
            <span>{autoRefresh ? '15s' : 'Off'}</span>
          </div>
        </div>
      </div>

      {loading && !metrics ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading observability data...</p>
        </div>
      ) : metrics ? (
        <>
          <div className={styles.statusGrid}>
            <div className={styles.card}>
              <p className={styles.cardLabel}>Health Status</p>
              <div className={styles.cardStatus}>
                <div className={`${styles.statusDot} ${getHealthStatusDot(metrics.overallHealth)}`} />
                <span className={styles.statusText}>{metrics.overallHealth.toUpperCase()}</span>
              </div>
            </div>

            <div className={styles.card}>
              <p className={styles.cardLabel}>Total Requests</p>
              <p className={styles.cardValue}>{metrics.totalRequests.toLocaleString()}</p>
            </div>

            <div className={styles.card}>
              <p className={styles.cardLabel}>Error Rate</p>
              <p className={styles.cardValue} style={{ color: getErrorRateColor(metrics.errorRate) }}>
                {metrics.errorRate.toFixed(2)}%
              </p>
            </div>

            <div className={styles.card}>
              <p className={styles.cardLabel}>P95 Latency</p>
              <p className={styles.cardValue} style={{ color: getLatencyColor(metrics.p95Latency) }}>
                {metrics.p95Latency}ms
              </p>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Route Performance</h2>
            {sortedRoutes.length > 0 ? (
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th onClick={() => handleSort('route')}>
                      Route
                      {sortField === 'route' && <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th onClick={() => handleSort('requests')}>
                      Requests
                      {sortField === 'requests' && <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th onClick={() => handleSort('errorRate')}>
                      Error Rate
                      {sortField === 'errorRate' && <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th onClick={() => handleSort('p50')}>
                      P50
                      {sortField === 'p50' && <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th onClick={() => handleSort('p95')}>
                      P95
                      {sortField === 'p95' && <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                    <th onClick={() => handleSort('p99')}>
                      P99
                      {sortField === 'p99' && <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRoutes.map((route, idx) => (
                    <tr key={idx} className={styles.tableRow}>
                      <td className={styles.tableCell}>{route.route}</td>
                      <td className={styles.tableCell}>{route.requests.toLocaleString()}</td>
                      <td className={styles.tableCell} style={{ color: getErrorRateColor(route.errorRate) }}>
                        {route.errorRate.toFixed(2)}%
                      </td>
                      <td className={styles.tableCell} style={{ color: getLatencyColor(route.p50) }}>
                        {route.p50}ms
                      </td>
                      <td className={styles.tableCell} style={{ color: getLatencyColor(route.p95) }}>
                        {route.p95}ms
                      </td>
                      <td className={styles.tableCell} style={{ color: getLatencyColor(route.p99) }}>
                        {route.p99}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>No route performance data available yet</p>
              </div>
            )}
          </div>

          {memory && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Server Memory</h2>
              <div className={styles.memoryCard}>
                <div className={styles.memoryBarContainer}>
                  <div className={styles.memoryBarLabel}>
                    <span>Heap Usage</span>
                    <span>{memoryPercentage.toFixed(1)}%</span>
                  </div>
                  <div className={styles.memoryBar}>
                    <div className={styles.memoryFill} style={{ width: `${memoryPercentage}%` }} />
                  </div>
                </div>

                <div className={styles.memoryStats}>
                  <div className={styles.memoryStat}>
                    <p className={styles.memoryStatLabel}>Heap Used</p>
                    <p className={styles.memoryStatValue}>{(memory.heapUsed / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <div className={styles.memoryStat}>
                    <p className={styles.memoryStatLabel}>Heap Total</p>
                    <p className={styles.memoryStatValue}>{(memory.heapTotal / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <div className={styles.memoryStat}>
                    <p className={styles.memoryStatLabel}>RSS</p>
                    <p className={styles.memoryStatValue}>{(memory.rss / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <div className={styles.memoryStat}>
                    <p className={styles.memoryStatLabel}>External</p>
                    <p className={styles.memoryStatValue}>{(memory.external / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Incidents</h2>
            {incidents.length > 0 ? (
              incidents.map((incident) => (
                <div key={incident.id} className={styles.incidentCard}>
                  <div className={styles.incidentContent}>
                    <div className={styles.incidentHeader}>
                      <span className={`${styles.severityBadge} ${getSeverityBadgeClass(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={styles.incidentService}>{incident.service}</span>
                    </div>
                    <p className={styles.incidentDescription}>{incident.description}</p>
                    <p className={styles.incidentTimestamp}>
                      {formatTimestamp(incident.createdAt)}
                      {incident.status === 'resolved' && ' (resolved)'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>No incidents recorded</p>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Alert Rules</h2>

            {alerts.length > 0 && (
              <div className={styles.alertSummary}>
                <div className={styles.alertSummaryCard}>
                  <p className={styles.alertSummaryValue}>{alertCounts.critical}</p>
                  <p className={styles.alertSummaryLabel}>Critical</p>
                </div>
                <div className={styles.alertSummaryCard}>
                  <p className={styles.alertSummaryValue}>{alertCounts.warning}</p>
                  <p className={styles.alertSummaryLabel}>Warning</p>
                </div>
                <div className={styles.alertSummaryCard}>
                  <p className={styles.alertSummaryValue}>{alertCounts.info}</p>
                  <p className={styles.alertSummaryLabel}>Info</p>
                </div>
              </div>
            )}

            <div className={styles.filterGroup}>
              {(['all', 'critical', 'warning', 'info'] as const).map((filter) => (
                <button
                  key={filter}
                  className={`${styles.filterButton} ${alertFilter === filter ? styles.filterButtonActive : ''}`}
                  onClick={() => setAlertFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className={styles.alertRuleRow}>
                  <div className={styles.alertRuleContent}>
                    <span className={styles.alertRuleName}>{alert.name}</span>
                    <span className={styles.alertRuleMetric}>{alert.metric}</span>
                    <span className={styles.alertRuleThreshold}>{alert.threshold}</span>
                    <div className={styles.alertChannels}>
                      {alert.channels.map((channel, idx) => (
                        <span key={idx} className={styles.alertChannel}>
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.alertStatus}>
                    <span className={`${styles.alertStatusBadge} ${!alert.enabled ? styles.disabled : ''}`}>
                      {alert.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className={`${styles.severityBadge} ${getSeverityBadgeClass(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>
                  {alertFilter === 'all' ? 'No alert rules configured' : `No ${alertFilter} alerts found`}
                </p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
