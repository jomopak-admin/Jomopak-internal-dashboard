/**
 * Reorder Reminders — Task #97
 *
 * For each (client, product) where Jomopak holds stock on the customer's
 * behalf, compute a simple days-of-cover figure:
 *
 *   consumption_rate  =  total released in the lookback window ÷ window days
 *   days_of_cover     =  on_hand ÷ consumption_rate
 *
 * Anything ≤ the reorder threshold (default 14 days) lands in the list.
 * The page is read-only — it points at the relevant client/job so the
 * sales rep can pick up the conversation manually.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import { Client, CustomerStockRelease, FinishedGoodsStock, Product, View } from '../../types';

interface ReorderRemindersPageProps {
  finishedGoodsStock: FinishedGoodsStock[];
  customerStockReleases: CustomerStockRelease[];
  clients: Client[];
  products: Product[];
  onNavigate: (view: View, entityId?: string) => void;
}

type Window = 30 | 60 | 90;

interface ReorderRow {
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  onHand: number;
  releasedInWindow: number;
  ratePerDay: number;
  daysCover: number;
  severity: 'urgent' | 'warn' | 'info';
}

function daysAgo(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export function ReorderRemindersPage({
  finishedGoodsStock,
  customerStockReleases,
  clients,
  onNavigate,
}: ReorderRemindersPageProps) {
  const [windowDays, setWindowDays] = useState<Window>(60);
  const [threshold, setThreshold] = useState<number>(14);

  const rows = useMemo<ReorderRow[]>(() => {
    // Restrict to stock-holding clients (everyone else doesn't need this).
    const stockHoldingClientIds = new Set(
      clients.filter((c) => c.stockHoldingEnabled !== false).map((c) => c.id),
    );

    // Aggregate on-hand per (client, product).
    const onHandByKey = new Map<string, { clientId: string; clientName: string; productId: string; productName: string; onHand: number }>();
    for (const fg of finishedGoodsStock) {
      if (!fg.clientId || !fg.productId) continue;
      if (!stockHoldingClientIds.has(fg.clientId)) continue;
      const key = `${fg.clientId}::${fg.productId}`;
      const row = onHandByKey.get(key) || {
        clientId: fg.clientId,
        clientName: fg.clientName,
        productId: fg.productId,
        productName: fg.productName,
        onHand: 0,
      };
      row.onHand += fg.quantityAvailable || 0;
      onHandByKey.set(key, row);
    }

    // Aggregate releases-in-window per (client, product).
    const releasedByKey = new Map<string, number>();
    for (const r of customerStockReleases) {
      if (!r.clientId) continue;
      if (daysAgo(r.releaseDate || r.createdAt) > windowDays) continue;
      // Match release back to product via the finished-goods stock id.
      const fg = finishedGoodsStock.find((f) => f.id === r.finishedGoodsStockId);
      if (!fg) continue;
      const key = `${r.clientId}::${fg.productId}`;
      releasedByKey.set(key, (releasedByKey.get(key) || 0) + (r.quantityReleased || 0));
    }

    const out: ReorderRow[] = [];
    for (const [key, base] of onHandByKey) {
      const released = releasedByKey.get(key) || 0;
      const ratePerDay = released > 0 ? released / windowDays : 0;
      const daysCover = ratePerDay > 0 ? base.onHand / ratePerDay : (base.onHand > 0 ? 9999 : 0);
      // Filter: anything with no recent movement AND no on-hand is useless.
      if (ratePerDay === 0) continue;
      if (daysCover > threshold) continue;
      const severity: ReorderRow['severity'] =
        daysCover <= 3 ? 'urgent' : daysCover <= 7 ? 'warn' : 'info';
      out.push({ ...base, releasedInWindow: released, ratePerDay, daysCover, severity });
    }
    out.sort((a, b) => a.daysCover - b.daysCover);
    return out;
  }, [finishedGoodsStock, customerStockReleases, clients, windowDays, threshold]);

  if (rows.length === 0) {
    return (
      <div className="page-stack">
        <SectionTitle
          title="Reorder Reminders"
          subtitle="Customers whose held stock is running low based on recent consumption."
          action={
            <div className="form-row" style={{ gap: 8 }}>
              <label>
                Window
                <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value) as Window)}>
                  <option value={30}>30d</option>
                  <option value={60}>60d</option>
                  <option value={90}>90d</option>
                </select>
              </label>
              <label>
                Threshold (days cover)
                <input type="number" min={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
              </label>
            </div>
          }
        />
        <EmptyState
          title="Nothing needs reordering"
          body={`No customer's days-of-cover is at or below ${threshold} days using a ${windowDays}-day window.`}
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Reorder Reminders"
        subtitle="Customers whose held stock is running low based on recent consumption."
        action={
          <div className="form-row" style={{ gap: 8 }}>
            <label>
              Window
              <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value) as Window)}>
                <option value={30}>30d</option>
                <option value={60}>60d</option>
                <option value={90}>90d</option>
              </select>
            </label>
            <label>
              Threshold (days cover)
              <input type="number" min={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
            </label>
          </div>
        }
      />

      <section className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Product</th>
              <th style={{ textAlign: 'right' }}>On hand</th>
              <th style={{ textAlign: 'right' }}>Released ({windowDays}d)</th>
              <th style={{ textAlign: 'right' }}>Rate/day</th>
              <th style={{ textAlign: 'right' }}>Days cover</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.clientId}-${r.productId}`} className={`severity-${r.severity}`}>
                <td>
                  <button className="link-button" onClick={() => onNavigate('clients', r.clientId)}>
                    {r.clientName}
                  </button>
                </td>
                <td>{r.productName}</td>
                <td style={{ textAlign: 'right' }}>{Math.round(r.onHand).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{Math.round(r.releasedInWindow).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{r.ratePerDay.toFixed(1)}</td>
                <td style={{ textAlign: 'right' }}>
                  <strong>{Math.round(r.daysCover)}</strong>
                </td>
                <td>
                  <button className="ghost-button" onClick={() => onNavigate('customerStock')}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
