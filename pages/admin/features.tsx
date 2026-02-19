import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { getServerSideProps as _getServerSideProps } from '@/lib/auth/withServerAuth';
import styles from '@/styles/features.module.css';

export const getServerSideProps = _getServerSideProps;

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  tiers: ('free' | 'pro' | 'team')[];
  createdAt: string;
  updatedAt: string;
}

interface FeaturesApiResponse {
  flags: FeatureFlag[];
  timestamp: string;
}

interface SummaryStats {
  total: number;
  enabled: number;
  disabled: number;
  beta: number;
}

type TierFilter = 'all' | 'free' | 'pro' | 'team';

export default function FeaturesPage() {
  const { user, token } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [expandedFlagId, setExpandedFlagId] = useState<string | null>(null);
  const [editingFlag, setEditingFlag] = useState<Partial<FeatureFlag> | null>(null);
  const [savingFlagId, setSavingFlagId] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/studio/admin/features', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.statusText}`);
      }

      const data: FeaturesApiResponse = await response.json();
      setFlags(data.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feature flags');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFlags();
    const interval = setInterval(fetchFlags, 30000);
    return () => clearInterval(interval);
  }, [fetchFlags]);

  const calculateStats = (): SummaryStats => {
    return {
      total: flags.length,
      enabled: flags.filter(f => f.enabled && f.rolloutPercentage === 100).length,
      disabled: flags.filter(f => !f.enabled).length,
      beta: flags.filter(f => f.enabled && f.rolloutPercentage < 100).length,
    };
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (tierFilter === 'all') {
      return matchesSearch;
    }

    return matchesSearch && flag.tiers.includes(tierFilter as 'free' | 'pro' | 'team');
  });

  const getStatusBadge = (flag: FeatureFlag): { text: string; className: string } => {
    if (!flag.enabled) {
      return { text: 'Disabled', className: styles.statusDisabled };
    }
    if (flag.rolloutPercentage === 100) {
      return { text: 'Live', className: styles.statusLive };
    }
    return { text: 'Beta', className: styles.statusBeta };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
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

  const handleToggleExpand = (flagId: string) => {
    if (expandedFlagId === flagId) {
      setExpandedFlagId(null);
      setEditingFlag(null);
    } else {
      setExpandedFlagId(flagId);
      const flag = flags.find(f => f.id === flagId);
      if (flag) {
        setEditingFlag({ ...flag });
      }
    }
  };

  const handleCancel = () => {
    setExpandedFlagId(null);
    setEditingFlag(null);
  };

  const handleSave = async () => {
    if (!editingFlag || !editingFlag.id || !token) return;

    setSavingFlagId(editingFlag.id);
    try {
      const response = await fetch('/api/studio/admin/features', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flagId: editingFlag.id,
          updates: {
            enabled: editingFlag.enabled,
            rolloutPercentage: editingFlag.rolloutPercentage,
            tiers: editingFlag.tiers,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save flag: ${response.statusText}`);
      }

      await fetchFlags();
      setExpandedFlagId(null);
      setEditingFlag(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flag');
    } finally {
      setSavingFlagId(null);
    }
  };

  const stats = calculateStats();
  const statusBadge = expandedFlagId ? getStatusBadge(flags.find(f => f.id === expandedFlagId) || flags[0]) : null;

  if (!user) {
    return <ProtectedRoute />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Feature Flags</h1>
        <p className={styles.subtitle}>Manage feature rollouts and tier access</p>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardLabel}>Total Flags</p>
          <p className={styles.summaryCardValue}>{stats.total}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardLabel}>Enabled</p>
          <p className={styles.summaryCardValue}>{stats.enabled}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardLabel}>Disabled</p>
          <p className={styles.summaryCardValue}>{stats.disabled}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryCardLabel}>Beta</p>
          <p className={styles.summaryCardValue}>{stats.beta}</p>
        </div>
      </div>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search flags by name or description..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className={styles.filterGroup}>
          {(['all', 'free', 'pro', 'team'] as const).map((tier) => (
            <button
              key={tier}
              className={`${styles.filterButton} ${tierFilter === tier ? styles.filterButtonActive : ''}`}
              onClick={() => setTierFilter(tier)}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorMessage}>{error}</span>
          <button className={styles.retryButton} onClick={fetchFlags}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '16px' }}>Loading feature flags...</p>
        </div>
      ) : filteredFlags.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            {flags.length === 0
              ? 'No feature flags configured'
              : `No flags match "${searchQuery}" in ${tierFilter === 'all' ? 'all tiers' : tierFilter} tier`}
          </p>
        </div>
      ) : (
        <div className={styles.flagList}>
          {filteredFlags.map((flag) => {
            const isExpanded = expandedFlagId === flag.id;
            const status = getStatusBadge(flag);

            return (
              <div key={flag.id}>
                <div
                  className={`${styles.flagRow} ${isExpanded ? styles.flagRowExpanded : ''}`}
                  onClick={() => handleToggleExpand(flag.id)}
                >
                  <div className={styles.flagRowContent}>
                    <div className={styles.flagHeader}>
                      <span className={styles.flagName}>{flag.name}</span>
                    </div>
                    <p className={styles.flagDescription}>{flag.description}</p>
                    <div className={styles.flagRowMetrics}>
                      <div className={styles.rolloutBarContainer}>
                        <span className={styles.rolloutLabel}>Rollout</span>
                        <div className={styles.rolloutBar}>
                          <div
                            className={styles.rolloutFill}
                            style={{ width: `${flag.rolloutPercentage}%` }}
                          >
                            {flag.rolloutPercentage > 10 && `${flag.rolloutPercentage}%`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.flagRowRight}>
                    <div className={styles.tierBadgesGroup}>
                      {flag.tiers.map((tier) => {
                        let badgeClass = styles.tierFree;
                        if (tier === 'pro') badgeClass = styles.tierPro;
                        if (tier === 'team') badgeClass = styles.tierTeam;
                        return (
                          <span key={tier} className={`${styles.tierBadge} ${badgeClass}`}>
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </span>
                        );
                      })}
                    </div>
                    <span className={`${styles.statusBadge} ${status.className}`}>
                      {status.text}
                    </span>
                    <span className={styles.lastUpdated}>{formatDate(flag.updatedAt)}</span>
                  </div>
                </div>

                {isExpanded && editingFlag && (
                  <div className={styles.editPanel}>
                    <div className={styles.editSection}>
                      <label className={styles.editSectionLabel}>Status</label>
                      <div className={styles.toggleGroup}>
                        <button
                          className={`${styles.toggle} ${editingFlag.enabled ? styles.toggleEnabled : ''}`}
                          onClick={() =>
                            setEditingFlag({ ...editingFlag, enabled: !editingFlag.enabled })
                          }
                        >
                          <div className={styles.toggleSlider}></div>
                        </button>
                        <span className={styles.toggleLabel}>
                          {editingFlag.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.editSection}>
                      <div className={styles.sliderContainer}>
                        <div className={styles.sliderHeader}>
                          <label className={styles.editSectionLabel}>Rollout Percentage</label>
                          <span className={styles.sliderValue}>{editingFlag.rolloutPercentage}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingFlag.rolloutPercentage || 0}
                          onChange={(e) =>
                            setEditingFlag({
                              ...editingFlag,
                              rolloutPercentage: parseInt(e.target.value, 10),
                            })
                          }
                          className={styles.slider}
                        />
                      </div>
                    </div>

                    <div className={styles.editSection}>
                      <label className={styles.editSectionLabel}>Tier Access</label>
                      <div className={styles.checkboxGroup}>
                        {(['free', 'pro', 'team'] as const).map((tier) => (
                          <div key={tier} className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              id={`tier-${tier}`}
                              className={styles.checkbox}
                              checked={editingFlag.tiers?.includes(tier) || false}
                              onChange={(e) => {
                                const newTiers = editingFlag.tiers || [];
                                if (e.target.checked) {
                                  if (!newTiers.includes(tier)) {
                                    setEditingFlag({
                                      ...editingFlag,
                                      tiers: [...newTiers, tier],
                                    });
                                  }
                                } else {
                                  setEditingFlag({
                                    ...editingFlag,
                                    tiers: newTiers.filter(t => t !== tier),
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`tier-${tier}`} className={styles.checkboxLabel}>
                              {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.editActions}>
                      <button className={styles.cancelButton} onClick={handleCancel}>
                        Cancel
                      </button>
                      <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={savingFlagId === flag.id}
                      >
                        {savingFlagId === flag.id ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
