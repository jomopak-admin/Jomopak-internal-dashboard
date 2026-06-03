/**
 * Stock Movements report — Phase 66.
 *
 * Per-user issue trail with anomaly flagging. Three things admin actually
 * needs at month-end:
 *
 *   1. Who issued what, this month — full audit table with filters.
 *   2. Per-receiver totals — sorted by issue count so unusual patterns
 *      surface naturally (the operator who suddenly went from 3 to 47
 *      consumables in a month is at the top).
 *   3. High-value summary — every issue flagged high-value-at-time, who
 *      approved, whether a signature is on file.
 *
 * Designed for ops + admin only (set by ROLE_DEFAULT_VIEWS).
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { StockIssue } from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface StockMovementsPageProps {
  stockIssues: StockIssue[];
}

type Lens = 'all' | 'highValue' | 'unsigned' | 'tools-out';

const MONTH_OPTIONS = (() => {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    });
  }
  return out;
})();

export function StockMovementsPage({ stockIssues }: StockMovementsPageProps) {
  const [month, setMonth] = useState<string>('all');
  const [lens, setLens] = useState<Lens>('all');
  const [search, setSearch] = useState('');

  // Build the filtered set.
  const filtered = useMemo(() => {
    return stockIssues.filter((i) => {
      if (month !== 'all') {
        const key = (i.issuedAt || i.createdAt || '').slice(0, 7);
        if (key !== month) return false;
      }
      if (lens === 'highValue' && !i.highValueAtIssue) return false;
      if (lens === 'unsigned' && Boolean(i.signatureDataUrl)) return false;
      if (lens === 'tools-out' && (i.itemType !== 'Tool' || i.status === 'Returned')) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${i.itemName} ${i.issuedToName} ${i.issuedByName} ${i.jobNumber} ${i.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.issuedAt || b.createdAt || '').localeCompare(a.issuedAt || a.createdAt || ''));
  }, [stockIssues, month, lens, search]);

  // Per-receiver tallies + anomaly detection (3x or more vs previous month).
  const receiverStats = useMemo(() => {
    const thisKey = month === 'all' ? null : month;
    // Compute previous month key for comparison if a specific month is picked.
    let prevKey: string | null = null;
    if (thisKey) {
      const [y, m] = thisKey.split('-').map((n) => Number(n));
      const d = new Date(y, m - 2, 1);
      prevKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const tally = new Map<string, { name: string; issuesThis: number; qtyThis: number; issuesPrev: number; highValueThis: number }>();
    for (const i of stockIssues) {
      const key = (i.issuedAt || i.createdAt || '').slice(0, 7);
      const name = i.issuedToName || '— unspecified —';
      const t = tally.get(name) ?? { name, issuesThis: 0, qtyThis: 0, issuesPrev: 0, highValueThis: 0 };
      if (!thisKey || key === thisKey) {
        t.issuesThis += 1;
        t.qtyThis += Number(i.quantity) || 0;
        if (i.highValueAtIssue) t.highValueThis += 1;
      } else if (prevKey && key === prevKey) {
        t.issuesPrev += 1;
      }
      tally.set(name, t);
    }
    const list = Array.from(tally.values());
    return list
      .filter((r) => r.issuesThis > 0 || r.issuesPrev > 0)
      .sort((a, b) => b.issuesThis - a.issuesThis);
  }, [stockIssues, month]);

  function isAnomaly(r: { issuesThis: number; issuesPrev: number }) {
    if (r.issuesPrev === 0 && r.issuesThis >= 10) return true;
    if (r.issuesPrev > 0 && r.issuesThis / r.issuesPrev >= 3) return true;
    return false;
  }

  return (
    <>
      <SectionTitle
        title="Stock movements & issue trail"
        subtitle="Per-user audit of every stock issue. Flags unsigned receipts, high-value approvals, and unusual patterns (a sudden 3× jump month-on-month) so admin can investigate before shrinkage accumulates."
      />

      <section className="card">
        <div className="filters-grid">
          <label><span>Month</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">All months</option>
              {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label><span>Lens</span>
            <select value={lens} onChange={(e) => setLens(e.target.value as Lens)}>
              <option value="all">All issues</option>
              <option value="highValue">High-value only</option>
              <option value="unsigned">Missing signature</option>
              <option value="tools-out">Tools still checked out</option>
            </select>
          </label>
          <label><span>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Item, receiver, issuer, job, notes" />
          </label>
        </div>
      </section>

      <section className="card">
        <SectionTitle
          title="Per-receiver tally"
          subtitle={month === 'all' ? 'All-time totals.' : 'Selected month vs previous month. = jumped 3× or more, or 10+ where last month was zero.'}
        />
        {receiverStats.length === 0 ? (
          <EmptyState title="No issues in this period" body="Stock movements will show up here as soon as items are issued." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Receiver</th>
                  <th style={{ textAlign: 'right' }}>Issues this period</th>
                  <th style={{ textAlign: 'right' }}>Qty this period</th>
                  <th style={{ textAlign: 'right' }}>High-value this period</th>
                  {month !== 'all' && <th style={{ textAlign: 'right' }}>Issues prev month</th>}
                  <th>Pattern</th>
                </tr>
              </thead>
              <tbody>
                {receiverStats.map((r) => {
                  const anomaly = month !== 'all' && isAnomaly(r);
                  return (
                    <tr key={r.name} className={anomaly ? 'row-alert' : undefined}>
                      <td><strong>{r.name}</strong></td>
                      <td style={{ textAlign: 'right' }}>{r.issuesThis}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(r.qtyThis)}</td>
                      <td style={{ textAlign: 'right' }}>{r.highValueThis || '—'}</td>
                      {month !== 'all' && <td style={{ textAlign: 'right' }}>{r.issuesPrev}</td>}
                      <td>{anomaly ? <span style={{ color: '#b91c1c', fontWeight: 600 }}>Investigate</span> : <span className="muted">normal</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <SectionTitle title={`Issue audit (${filtered.length})`} subtitle="Every issue in the selected window. Click an issue's row to drill into the source item." />
        {filtered.length === 0 ? (
          <EmptyState title="No issues match the filter" body="Try a different month or lens." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Receiver</th>
                  <th>Issued by</th>
                  <th>Approved by</th>
                  <th>Signed?</th>
                  <th>High value</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const issuedKey = (i.issuedAt || i.createdAt || '').slice(0, 10);
                  return (
                    <tr key={i.id} className={i.highValueAtIssue ? 'row-alert' : undefined}>
                      <td>{issuedKey ? formatDate(issuedKey) : '—'}</td>
                      <td>{i.itemName}<div className="table-subtext">{i.category}</div></td>
                      <td>{formatNumber(i.quantity)} {i.unitOfMeasure}</td>
                      <td>{i.issuedToName || '—'}</td>
                      <td>{i.issuedByName || '—'}</td>
                      <td>{i.approverName || (i.highValueAtIssue ? <span style={{ color: '#b91c1c' }}>missing</span> : '—')}</td>
                      <td>{i.signatureDataUrl ? '' : <span style={{ color: '#b91c1c' }}>NO</span>}</td>
                      <td>{i.highValueAtIssue ? 'yes' : '—'}</td>
                      <td className="table-subtext">{i.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
