/**
 * Phase 107.3 — Visitor Approval Requests page.
 *
 * Dedicated list view for every visitor area approval request, with
 * filters (status, approver) and an expandable audit history per row.
 * Auditors use this to prove the chain of approvals; admins use it to
 * intervene (override / revoke) on stuck requests.
 *
 * This complements the Inbox: the Inbox is "what needs my attention
 * right now"; this page is "show me everything that happened today /
 * this week / ever".
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Employee,
  VisitorApprovalStatus,
  VisitorAreaApprovalRequest,
} from '../../types';
import { formatDate } from '../../utils/calculations';
import { applyVisitorApprovalDecision } from '../../utils/visitorApproval';

interface VisitorApprovalsPageProps {
  requests: VisitorAreaApprovalRequest[];
  employees: Employee[];
  /** Current user — drives "this is your request" highlighting. */
  currentEmployeeId?: string;
  currentUserName: string;
  /** Replace a single request with a new state (after applying a decision). */
  onUpdateRequest: (request: VisitorAreaApprovalRequest) => void;
}

type StatusFilter = 'all' | 'active' | 'decided';

const STATUS_LABEL: Record<VisitorApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  approved_partial: 'Partial approval',
  declined: 'Declined',
  keep_reception: 'Kept at reception',
  delegated: 'Delegated',
  escalated: 'Escalated',
  expired: 'Expired',
  overridden: 'Overridden',
};

const STATUS_TONE: Record<VisitorApprovalStatus, string> = {
  pending: 'rgba(184,134,11,0.10)',
  approved: 'rgba(46,111,62,0.10)',
  approved_partial: 'rgba(46,111,62,0.10)',
  declined: 'rgba(178,43,43,0.10)',
  keep_reception: 'rgba(184,134,11,0.10)',
  delegated: 'rgba(99,102,241,0.10)',
  escalated: 'rgba(178,43,43,0.10)',
  expired: 'rgba(100,116,139,0.10)',
  overridden: 'rgba(100,116,139,0.10)',
};

function ageMinutes(iso: string, now: number = Date.now()): number {
  const t = new Date(iso).getTime();
  return Math.max(0, Math.round((now - t) / 60_000));
}

function ageLabel(iso: string): string {
  const m = ageMinutes(iso);
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export function VisitorApprovalsPage({ requests, employees, currentEmployeeId, currentUserName, onUpdateRequest }: VisitorApprovalsPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [approverFilter, setApproverFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests
      .filter((r) => {
        if (statusFilter === 'active') return r.status === 'pending' || r.status === 'delegated' || r.status === 'escalated';
        if (statusFilter === 'decided') return r.status !== 'pending' && r.status !== 'delegated' && r.status !== 'escalated';
        return true;
      })
      .filter((r) => !approverFilter || r.currentApproverEmployeeId === approverFilter)
      .filter((r) => {
        if (!search) return true;
        const t = search.toLowerCase();
        return `${r.visitorName} ${r.visitorCompany} ${r.hostName} ${r.currentApproverName}`.toLowerCase().includes(t);
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [requests, statusFilter, approverFilter, search]);

  const counts = useMemo(() => {
    const active = requests.filter((r) => r.status === 'pending' || r.status === 'delegated' || r.status === 'escalated').length;
    const escalated = requests.filter((r) => r.status === 'escalated').length;
    const mine = currentEmployeeId
      ? requests.filter((r) => r.currentApproverEmployeeId === currentEmployeeId && (r.status === 'pending' || r.status === 'delegated' || r.status === 'escalated')).length
      : 0;
    return { active, escalated, mine };
  }, [requests, currentEmployeeId]);

  const employeeOptions = employees.filter((e) => e.active);

  return (
    <div className="page">
      <SectionTitle
        title="Visitor approval requests"
        subtitle="Every restricted-area request reception has raised. Approve, override, or just review the chain of decisions."
      />

      <div className="card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div><strong style={{ fontSize: 20 }}>{counts.active}</strong> <span className="muted">active</span></div>
          {counts.escalated > 0 ? (
            <div><strong style={{ fontSize: 20, color: 'var(--alert, #b22b2b)' }}>{counts.escalated}</strong> <span className="muted">escalated</span></div>
          ) : null}
          {counts.mine > 0 ? (
            <div><strong style={{ fontSize: 20, color: 'var(--warn, #b8860b)' }}>{counts.mine}</strong> <span className="muted">waiting on you</span></div>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['active', 'decided', 'all'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: `1px solid ${statusFilter === s ? 'var(--jp-ink-2, #475569)' : 'var(--jp-divider, #cbd5e1)'}`,
                  background: statusFilter === s ? 'var(--jp-ink-1, #1e293b)' : 'transparent',
                  color: statusFilter === s ? 'var(--jp-paper, #fff)' : 'var(--jp-ink-2, #475569)',
                  cursor: 'pointer',
                  fontSize: 13,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <select value={approverFilter} onChange={(e) => setApproverFilter(e.target.value)} style={{ padding: '6px 8px' }}>
            <option value="">All approvers</option>
            {employeeOptions.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor, host, company…"
            style={{ flex: 1, minWidth: 200, padding: '6px 8px' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState title="Nothing matches" body="Adjust the filters or check back later." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((r) => {
              const expanded = expandedId === r.id;
              const isActive = r.status === 'pending' || r.status === 'delegated' || r.status === 'escalated';
              const mine = currentEmployeeId && r.currentApproverEmployeeId === currentEmployeeId && isActive;
              return (
                <div
                  key={r.id}
                  style={{
                    border: `1px solid ${mine ? 'var(--warn, #b8860b)' : 'var(--jp-divider, #cbd5e1)'}`,
                    borderRadius: 8,
                    padding: 12,
                    background: STATUS_TONE[r.status],
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 15 }}>{r.visitorName}</strong>
                        {r.visitorCompany ? <span className="muted" style={{ fontSize: 13 }}>· {r.visitorCompany}</span> : null}
                        <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--jp-paper, #fff)', border: '1px solid var(--jp-divider, #cbd5e1)' }}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        Here to see <strong>{r.hostName}</strong>
                        {r.satisfiedByBookingId ? ' · pre-approved booking matched' : ''}
                        {' · '}{ageLabel(r.createdAt)}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        <span className="muted">Requested: </span>{r.requestedAreas.join(', ')}
                        {r.approvedAreas.length > 0 ? (
                          <>
                            <br />
                            <span className="muted">Granted: </span>{r.approvedAreas.join(', ')}
                          </>
                        ) : null}
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        Currently with: <strong>{r.currentApproverName}</strong>
                        {mine ? ' · waiting on you' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      style={{ fontSize: 12 }}
                    >
                      {expanded ? 'Hide history' : `View history (${r.history.length})`}
                    </button>
                    {/* Admin override — force-approve all requested areas
                        even after a decline / escalation. Per Aman's spec
                        every admin override is logged. */}
                    {isActive ? (
                      <button
                        type="button"
                        className="primary-button"
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          const updated = applyVisitorApprovalDecision(r, 'override', currentUserName, {
                            actorEmployeeId: currentEmployeeId,
                            approvedAreas: r.requestedAreas,
                            note: 'Admin override — all requested areas granted.',
                          });
                          onUpdateRequest(updated);
                        }}
                      >Admin override (approve all)</button>
                    ) : null}
                    {isActive ? (
                      <button
                        type="button"
                        className="ghost-button"
                        style={{ fontSize: 12, color: 'var(--alert, #b22b2b)' }}
                        onClick={() => {
                          const updated = applyVisitorApprovalDecision(r, 'revoke', currentUserName, {
                            actorEmployeeId: currentEmployeeId,
                            note: 'Admin revoked access.',
                          });
                          onUpdateRequest(updated);
                        }}
                      >Revoke</button>
                    ) : null}
                  </div>

                  {expanded ? (
                    <div style={{ marginTop: 10, padding: 10, background: 'var(--jp-paper, #fff)', border: '1px solid var(--jp-divider, #cbd5e1)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)', marginBottom: 6 }}>
                        Audit history
                      </div>
                      {r.history.length === 0 ? (
                        <div className="muted" style={{ fontSize: 12 }}>No history.</div>
                      ) : (
                        <ol style={{ paddingLeft: 18, margin: 0, fontSize: 12 }}>
                          {r.history.map((h, i) => (
                            <li key={`${r.id}-h-${i}`} style={{ marginBottom: 4 }}>
                              <strong>{h.action}</strong> · {h.actorName}
                              {h.delegatedToName ? ` → ${h.delegatedToName}` : ''}
                              {h.approvedAreas && h.approvedAreas.length > 0 ? ` · granted ${h.approvedAreas.join(', ')}` : ''}
                              <span className="muted"> · {formatDate(h.at)}{h.at.length > 10 ? ` ${h.at.slice(11, 16)}` : ''}</span>
                              {h.note ? <div className="muted" style={{ fontSize: 11 }}>{h.note}</div> : null}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
