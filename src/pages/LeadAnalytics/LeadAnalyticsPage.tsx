/**
 * Lead Conversion Analytics — Task #98
 *
 * Read-only view that turns the lead/quote/job/invoice spine into a sales
 * funnel. Everything is derived; no new persistence.
 *
 * What it answers:
 *   • How many leads are in each pipeline stage right now?
 *   • What's the overall win rate, and by source / by rep?
 *   • What are leads being lost to (lostReason rollup)?
 *   • Median + average days from enquiry → won (or → lost).
 *
 * The component intentionally avoids charts — counts + simple bars render
 * fine on the prints/PDFs the sales team already uses.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import { Lead, LeadStatus } from '../../types';

interface LeadAnalyticsPageProps {
  leads: Lead[];
}

const FUNNEL_ORDER: LeadStatus[] = ['New', 'Qualified', 'Awaiting Info', 'Quoted', 'Won', 'Lost'];

function daysBetween(aIso: string, bIso: string): number | null {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

type Range = 'all' | '30d' | '90d' | '12m';

function inRange(iso: string, range: Range): boolean {
  if (range === 'all') return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const ms = range === '30d' ? 30 : range === '90d' ? 90 : 365;
  return Date.now() - t <= ms * 86_400_000;
}

export function LeadAnalyticsPage({ leads }: LeadAnalyticsPageProps) {
  const [range, setRange] = useState<Range>('90d');

  const scoped = useMemo(
    () => leads.filter((l) => inRange(l.enquiryDate || l.createdAt, range)),
    [leads, range],
  );

  const counts = useMemo(() => {
    const map: Record<LeadStatus, number> = {
      'New': 0, 'Qualified': 0, 'Awaiting Info': 0, 'Quoted': 0, 'Won': 0, 'Lost': 0,
    };
    for (const l of scoped) map[l.status] = (map[l.status] || 0) + 1;
    return map;
  }, [scoped]);

  const total = scoped.length;
  const won = counts.Won;
  const lost = counts.Lost;
  const closed = won + lost;
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;

  // Days-to-close stats (won only).
  const wonDays = useMemo(() => {
    const arr: number[] = [];
    for (const l of scoped) {
      if (l.status !== 'Won') continue;
      const start = l.enquiryDate || l.createdAt;
      // Use lead's last activity as close proxy; otherwise current time.
      const lastActivity = (l.activities || []).slice().sort((a, b) => a.at.localeCompare(b.at)).pop();
      const close = lastActivity?.at || new Date().toISOString();
      const d = daysBetween(start, close);
      if (d !== null && d >= 0) arr.push(d);
    }
    return arr;
  }, [scoped]);

  const avgDays = wonDays.length === 0 ? 0 : Math.round(wonDays.reduce((s, n) => s + n, 0) / wonDays.length);
  const medDays = Math.round(median(wonDays));

  // By source / by rep.
  type Group = { name: string; total: number; won: number; lost: number; openValue: number };
  function groupBy(extract: (l: Lead) => string): Group[] {
    const map = new Map<string, Group>();
    for (const l of scoped) {
      const k = extract(l) || '— unassigned —';
      const g = map.get(k) || { name: k, total: 0, won: 0, lost: 0, openValue: 0 };
      g.total += 1;
      if (l.status === 'Won') g.won += 1;
      if (l.status === 'Lost') g.lost += 1;
      if (l.status !== 'Won' && l.status !== 'Lost') g.openValue += l.estimatedValue || 0;
      map.set(k, g);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }
  const bySource = useMemo(() => groupBy((l) => l.source), [scoped]);
  const byRep = useMemo(() => groupBy((l) => l.assignedTo), [scoped]);

  // Lost reasons.
  const lostReasons = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of scoped) {
      if (l.status !== 'Lost') continue;
      const r = l.lostReason || 'Unspecified';
      map.set(r, (map.get(r) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [scoped]);

  if (leads.length === 0) {
    return <EmptyState title="No leads yet" body="Once leads start flowing in, you'll see funnel rollups here." />;
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Lead Conversion Analytics"
        subtitle="Funnel + win-rate breakdown across the current pipeline."
        action={
          <div className="segmented-control">
            {(['30d', '90d', '12m', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                className={range === r ? 'active' : ''}
                onClick={() => setRange(r)}
              >
                {r === 'all' ? 'All' : r.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total leads</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Won</span>
          <span className="stat-value">{won}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Lost</span>
          <span className="stat-value">{lost}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Win rate</span>
          <span className="stat-value">{winRate}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg days to close</span>
          <span className="stat-value">{avgDays}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Median days to close</span>
          <span className="stat-value">{medDays}</span>
        </div>
      </div>

      <section className="card">
        <h3>Funnel</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th style={{ textAlign: 'right' }}>Count</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {FUNNEL_ORDER.map((stage) => {
              const c = counts[stage];
              const pct = total > 0 ? Math.round((c / total) * 100) : 0;
              return (
                <tr key={stage}>
                  <td>{stage}</td>
                  <td style={{ textAlign: 'right' }}>{c}</td>
                  <td>
                    <div className="mini-bar"><span style={{ width: `${pct}%` }} /></div>
                    <small>{pct}%</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>By source</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th style={{ textAlign: 'right' }}>Leads</th>
              <th style={{ textAlign: 'right' }}>Won</th>
              <th style={{ textAlign: 'right' }}>Lost</th>
              <th style={{ textAlign: 'right' }}>Win rate</th>
              <th style={{ textAlign: 'right' }}>Open value</th>
            </tr>
          </thead>
          <tbody>
            {bySource.map((g) => {
              const c = g.won + g.lost;
              const w = c > 0 ? Math.round((g.won / c) * 100) : 0;
              return (
                <tr key={g.name}>
                  <td>{g.name}</td>
                  <td style={{ textAlign: 'right' }}>{g.total}</td>
                  <td style={{ textAlign: 'right' }}>{g.won}</td>
                  <td style={{ textAlign: 'right' }}>{g.lost}</td>
                  <td style={{ textAlign: 'right' }}>{w}%</td>
                  <td style={{ textAlign: 'right' }}>{Math.round(g.openValue).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>By sales rep</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Assigned to</th>
              <th style={{ textAlign: 'right' }}>Leads</th>
              <th style={{ textAlign: 'right' }}>Won</th>
              <th style={{ textAlign: 'right' }}>Lost</th>
              <th style={{ textAlign: 'right' }}>Win rate</th>
              <th style={{ textAlign: 'right' }}>Open value</th>
            </tr>
          </thead>
          <tbody>
            {byRep.map((g) => {
              const c = g.won + g.lost;
              const w = c > 0 ? Math.round((g.won / c) * 100) : 0;
              return (
                <tr key={g.name}>
                  <td>{g.name}</td>
                  <td style={{ textAlign: 'right' }}>{g.total}</td>
                  <td style={{ textAlign: 'right' }}>{g.won}</td>
                  <td style={{ textAlign: 'right' }}>{g.lost}</td>
                  <td style={{ textAlign: 'right' }}>{w}%</td>
                  <td style={{ textAlign: 'right' }}>{Math.round(g.openValue).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {lostReasons.length > 0 ? (
        <section className="card">
          <h3>Why we're losing</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reason</th>
                <th style={{ textAlign: 'right' }}>Count</th>
                <th>Share of losses</th>
              </tr>
            </thead>
            <tbody>
              {lostReasons.map(([reason, count]) => {
                const pct = lost > 0 ? Math.round((count / lost) * 100) : 0;
                return (
                  <tr key={reason}>
                    <td>{reason}</td>
                    <td style={{ textAlign: 'right' }}>{count}</td>
                    <td>
                      <div className="mini-bar"><span style={{ width: `${pct}%` }} /></div>
                      <small>{pct}%</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
