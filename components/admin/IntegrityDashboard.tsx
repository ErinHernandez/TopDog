/**
 * IntegrityDashboard
 *
 * Admin dashboard for reviewing collusion flags.
 */

import React, { useEffect, useState } from 'react';
import { createScopedLogger } from '@/lib/clientLogger';
import type {
  DraftRiskScores,
  UserPairAnalysis,
  DraftIntegrityFlags,
  PickLocationRecord,
  PairRiskScore,
} from '@/lib/integrity/types';

const logger = createScopedLogger('[IntegrityDashboard]');

interface DraftDetail {
  riskScores: DraftRiskScores | null;
  integrityFlags: DraftIntegrityFlags | null;
  pickLocations: PickLocationRecord[];
}

export function IntegrityDashboard() {
  const [drafts, setDrafts] = useState<DraftRiskScores[]>([]);
  const [pairs, setPairs] = useState<UserPairAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Get auth token from Firebase
      const auth = (await import('firebase/auth')).getAuth();
      const user = auth.currentUser;
      if (!user) {
        logger.error('User not authenticated', new Error('No current user'));
        return;
      }

      const token = await user.getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const [draftsRes, pairsRes] = await Promise.all([
        fetch('/api/admin/integrity/drafts', { headers }),
        fetch('/api/admin/integrity/pairs', { headers }),
      ]);

      if (!draftsRes.ok || !pairsRes.ok) {
        throw new Error('Failed to load data');
      }

      const draftsData = await draftsRes.json();
      const pairsData = await pairsRes.json();

      setDrafts(draftsData);
      setPairs(pairsData);
    } catch (error) {
      logger.error('Failed to load integrity data:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading integrity data...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Integrity Review Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Drafts for Review"
          value={drafts.length}
          color="yellow"
        />
        <StatCard
          label="High Risk Pairs"
          value={pairs.filter(p => p.overallRiskLevel === 'high').length}
          color="orange"
        />
        <StatCard
          label="Critical Pairs"
          value={pairs.filter(p => p.overallRiskLevel === 'critical').length}
          color="red"
        />
        <StatCard
          label="Reviewed Today"
          value={drafts.filter(d => d.status === 'reviewed').length}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <TabButton active={!selectedDraft} onClick={() => setSelectedDraft(null)}>
          Flagged Drafts
        </TabButton>
        <TabButton active={false} onClick={() => {}}>
          User Pairs
        </TabButton>
      </div>

      {/* Draft List */}
      {!selectedDraft && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Draft ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Max Risk</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Flagged Pairs</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Analyzed</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map(draft => (
                <tr key={draft.draftId} className="border-t">
                  <td className="px-4 py-3 text-sm font-mono">{draft.draftId.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <RiskBadge score={draft.maxRiskScore} />
                  </td>
                  <td className="px-4 py-3 text-sm">{draft.pairsAboveThreshold}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {draft.analyzedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={draft.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedDraft(draft.draftId)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Draft Detail View */}
      {selectedDraft && (
        <DraftDetailView
          draftId={selectedDraft}
          onBack={() => setSelectedDraft(null)}
          onAction={loadData}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
  };

  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function RiskBadge({ score }: { score: number }) {
  let color = 'bg-green-100 text-green-800';
  if (score >= 90) {
    color = 'bg-red-100 text-red-800';
  } else if (score >= 70) {
    color = 'bg-orange-100 text-orange-800';
  } else if (score >= 50) {
    color = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${color}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    analyzed: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function DraftDetailView({
  draftId,
  onBack,
  onAction,
}: {
  draftId: string;
  onBack: () => void;
  onAction: () => void;
}) {
  const [detail, setDetail] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    loadDetail();
  }, [draftId]);

  async function loadDetail() {
    try {
      const auth = (await import('firebase/auth')).getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/integrity/drafts/${draftId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setDetail(data);
    } catch (error) {
      logger.error('Failed to load draft detail:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    if (!actionReason.trim()) {
      alert('Please provide a reason for this action');
      return;
    }

    try {
      const auth = (await import('firebase/auth')).getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      await fetch('/api/admin/integrity/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType: 'draft',
          targetId: draftId,
          action,
          reason: actionReason,
          notes: actionNotes,
          evidenceSnapshot: detail,
        }),
      });

      onAction();
      onBack();
    } catch (error) {
      logger.error('Failed to record action:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (loading) {
    return <div className="p-8">Loading draft detail...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Draft: {draftId}</h2>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back to list
        </button>
      </div>

      {/* Risk Scores */}
      {detail?.riskScores && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Pair Risk Scores</h3>
          <div className="space-y-2">
            {detail.riskScores.pairScores.map((pair: PairRiskScore, idx: number) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-mono text-sm">{pair.userId1.slice(0, 8)}</span>
                    {' ↔ '}
                    <span className="font-mono text-sm">{pair.userId2.slice(0, 8)}</span>
                  </div>
                  <RiskBadge score={pair.compositeScore} />
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Location: {pair.locationScore} | Behavior: {pair.behaviorScore} | Benefit: {pair.benefitScore}
                </div>
                {pair.flags.length > 0 && (
                  <div className="mt-2">
                    {pair.flags.map((flag: string, i: number) => (
                      <div key={i} className="text-sm text-orange-600">• {flag}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Form */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Take Action</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Reason</label>
          <input
            type="text"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Explain the reason for this action"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Additional notes"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => handleAction('cleared')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Clear
          </button>
          <button
            onClick={() => handleAction('warned')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Warn Users
          </button>
          <button
            onClick={() => handleAction('suspended')}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Suspend
          </button>
          <button
            onClick={() => handleAction('escalated')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
}
