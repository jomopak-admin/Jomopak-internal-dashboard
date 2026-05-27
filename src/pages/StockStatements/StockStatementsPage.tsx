/**
 * Stock Statements (Phase 52).
 *
 * The physical-stock counterpart to Customer Statements (AR): pick a
 * stock-holding client and a date range, and the system computes a
 * statement-of-account for their stock — every batch added (receipt),
 * every release (dispatch), and the running balance per product.
 *
 * Two views:
 *   • Per-product summary — opening + receipts + releases + closing per SKU
 *   • Transaction detail  — every movement chronologically
 *
 * Printable + CSV export so accountants / sales can send to clients.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  AppSettingsCompany,
  Client,
  CustomerStockRelease,
  FinishedGoodsStock,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface StockStatementsPageProps {
  clients: Client[];
  finishedStock: FinishedGoodsStock[];
  releases: CustomerStockRelease[];
  company?: AppSettingsCompany;
  today: string;
}

/** A single line on the per-product summary. */
interface ProductLine {
  productId: string;
  productName: string;
  unit: string;
  opening: number;
  received: number;
  released: number;
  closing: number;
  /** Quantity reserved against open orders (informational). */
  reserved: number;
}

/** One row on the transaction-detail view. */
interface TxnRow {
  date: string;
  type: 'Receipt' | 'Release';
  productName: string;
  stockNumber: string;
  jobNumber: string;
  quantity: number;
  unit: string;
  reference: string;
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const esc = (v: string) => (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v.replace(/"/g, '""')}"` : v;
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StockStatementsPage({ clients, finishedStock, releases, company, today }: StockStatementsPageProps) {
  // 90 days back is a sensible default reporting window — clients usually
  // ask "what's been happening since last month?", not "what happened in 2019".
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 90);

  const [clientId, setClientId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(defaultFrom.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(today);
  const [view, setView] = useState<'summary' | 'detail'>('summary');

  // Only stock-holding clients are interesting — they're the ones who
  // ask "how much do I have left?" The dropdown surfaces them first.
  const stockHoldingClients = useMemo(() => {
    const enabled = clients.filter((c) => c.stockHoldingEnabled);
    const others = clients.filter((c) => !c.stockHoldingEnabled);
    return [...enabled, ...others];
  }, [clients]);

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  // ───────────────────────────────────────── Per-product summary
  const summary = useMemo<ProductLine[]>(() => {
    if (!clientId) return [];
    // Receipts = FinishedGoodsStock batches stored for this client.
    const clientStock = finishedStock.filter((s) => s.clientId === clientId);
    // Releases = CustomerStockReleases against this client.
    const clientReleases = releases.filter((r) => r.clientId === clientId);

    // Group by product. Use productName as fallback key when productId is empty.
    const map = new Map<string, ProductLine>();
    function lineFor(productId: string, productName: string, unit: string) {
      const key = productId || productName || '(unknown)';
      let line = map.get(key);
      if (!line) {
        line = { productId, productName: productName || '(unknown)', unit: unit || '', opening: 0, received: 0, released: 0, closing: 0, reserved: 0 };
        map.set(key, line);
      }
      return line;
    }

    // Walk receipts (each FinishedGoodsStock entry = qty produced + stored
    // for client on its storedDate; later releases will draw it down).
    clientStock.forEach((s) => {
      const line = lineFor(s.productId, s.productName, s.quantityUnit);
      const stored = s.storedDate || s.createdAt?.slice(0, 10) || '';
      if (stored && stored < fromDate) {
        // Opening balance — the qty was already on hand at the start of the
        // period. We approximate opening as quantityOnHand for batches
        // stored before fromDate, which holds when releases are recorded
        // against the batch row (they decrement onHand directly).
        line.opening += s.quantityOnHand || 0;
      } else if (stored && stored >= fromDate && stored <= toDate) {
        line.received += s.quantityOnHand || 0;
        // The closing of that batch (qty on hand still) lands in closing.
      }
      line.reserved += s.quantityReserved || 0;
    });

    // Walk releases in the window.
    clientReleases.forEach((r) => {
      const date = r.releaseDate || '';
      // Use product info from the linked FinishedGoodsStock entry if we
      // can find it (client releases don't carry product name directly).
      const stock = clientStock.find((s) => s.id === r.finishedGoodsStockId);
      const productId = stock?.productId || '';
      const productName = stock?.productName || r.finishedGoodsStockNumber || '(unknown)';
      const unit = (r.quantityUnit || stock?.quantityUnit || '') as string;
      const line = lineFor(productId, productName, unit);
      if (date && date >= fromDate && date <= toDate) {
        line.released += r.quantityReleased || 0;
      } else if (date && date < fromDate) {
        // Releases before the window already came off the opening balance —
        // they're baked into FinishedGoodsStock.quantityOnHand so no extra
        // accounting needed here.
      }
    });

    // Closing = current on-hand for batches stored on/before toDate, minus
    // anything released in window. Simpler: opening + received - released.
    Array.from(map.values()).forEach((l) => {
      l.closing = Math.max(0, l.opening + l.received - l.released);
    });

    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [clientId, finishedStock, releases, fromDate, toDate]);

  // ───────────────────────────────────────── Transaction detail
  const detail = useMemo<TxnRow[]>(() => {
    if (!clientId) return [];
    const out: TxnRow[] = [];
    finishedStock
      .filter((s) => s.clientId === clientId)
      .forEach((s) => {
        const date = s.storedDate || s.createdAt?.slice(0, 10) || '';
        if (date && date >= fromDate && date <= toDate) {
          out.push({
            date,
            type: 'Receipt',
            productName: s.productName,
            stockNumber: s.stockNumber || '',
            jobNumber: s.jobNumber || '',
            quantity: s.quantityOnHand || 0,
            unit: s.quantityUnit,
            reference: s.notes || '',
          });
        }
      });
    releases
      .filter((r) => r.clientId === clientId)
      .forEach((r) => {
        const date = r.releaseDate || '';
        if (date && date >= fromDate && date <= toDate) {
          const stock = finishedStock.find((s) => s.id === r.finishedGoodsStockId);
          out.push({
            date,
            type: 'Release',
            productName: stock?.productName || r.finishedGoodsStockNumber || '',
            stockNumber: stock?.stockNumber || r.finishedGoodsStockNumber || '',
            jobNumber: r.jobNumber || '',
            quantity: r.quantityReleased || 0,
            unit: (r.quantityUnit || stock?.quantityUnit || '') as string,
            reference: `${r.releaseNumber || ''}${r.destination ? ` · ${r.destination}` : ''}`,
          });
        }
      });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [clientId, finishedStock, releases, fromDate, toDate]);

  const totals = useMemo(() => ({
    opening: summary.reduce((s, l) => s + l.opening, 0),
    received: summary.reduce((s, l) => s + l.received, 0),
    released: summary.reduce((s, l) => s + l.released, 0),
    closing: summary.reduce((s, l) => s + l.closing, 0),
    reserved: summary.reduce((s, l) => s + l.reserved, 0),
  }), [summary]);

  function exportCsv() {
    if (!selectedClient) return;
    if (view === 'summary') {
      const header = ['Product', 'Unit', 'Opening', 'Received', 'Released', 'Closing', 'Reserved'];
      const rows = summary.map((l) => [l.productName, l.unit, String(l.opening), String(l.received), String(l.released), String(l.closing), String(l.reserved)]);
      downloadCsv(`stock-statement-${selectedClient.name.replace(/[^a-z0-9]+/gi, '-')}-${toDate}.csv`, header, rows);
    } else {
      const header = ['Date', 'Type', 'Product', 'Stock #', 'Job #', 'Quantity', 'Unit', 'Reference'];
      const rows = detail.map((t) => [t.date, t.type, t.productName, t.stockNumber, t.jobNumber, String(t.quantity), t.unit, t.reference]);
      downloadCsv(`stock-statement-detail-${selectedClient.name.replace(/[^a-z0-9]+/gi, '-')}-${toDate}.csv`, header, rows);
    }
  }

  function printStatement() {
    if (!selectedClient) return;
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return;
    const summaryRows = summary.map((l) => `<tr><td>${l.productName}</td><td>${l.unit}</td><td class="num">${formatNumber(l.opening, 0)}</td><td class="num">${formatNumber(l.received, 0)}</td><td class="num">${formatNumber(l.released, 0)}</td><td class="num"><strong>${formatNumber(l.closing, 0)}</strong></td><td class="num muted">${formatNumber(l.reserved, 0)}</td></tr>`).join('');
    const detailRows = detail.map((t) => `<tr><td>${formatDate(t.date)}</td><td>${t.type}</td><td>${t.productName}</td><td>${t.stockNumber}</td><td>${t.jobNumber}</td><td class="num">${t.type === 'Release' ? '-' : '+'}${formatNumber(t.quantity, 0)} ${t.unit}</td><td class="muted">${t.reference}</td></tr>`).join('');
    w.document.write(`<!doctype html><html><head><title>Stock statement — ${selectedClient.name}</title>
<style>
  body { font-family: sans-serif; padding: 24px; color: #111; }
  h1 { margin: 0 0 4px; }
  h2 { margin: 24px 0 8px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
  td.num, th.num { text-align: right; }
  .muted { color: #666; }
  .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .totals { margin-top: 6px; font-size: 12px; }
</style></head><body>
<h1>Stock Statement</h1>
<p class="muted">From ${fromDate} to ${toDate} · generated ${new Date().toLocaleDateString()}</p>
<div class="header-grid">
  <div><h2>${company?.name || 'JomoPak'}</h2><div class="muted">${company?.legalName || ''}</div><div class="muted">${company?.addressLine1 || ''} ${company?.addressLine2 || ''}</div><div class="muted">${company?.phone || ''} · ${company?.email || ''}</div></div>
  <div><h2>${selectedClient.name}</h2><div class="muted">${selectedClient.contactName || ''}</div><div class="muted">${selectedClient.contactEmail || ''}</div><div class="muted">${selectedClient.phoneNumber || ''}</div></div>
</div>

<h2>Stock by product</h2>
<table><thead><tr><th>Product</th><th>Unit</th><th class="num">Opening</th><th class="num">Received</th><th class="num">Released</th><th class="num">On hand</th><th class="num">Reserved</th></tr></thead>
<tbody>${summaryRows || '<tr><td colspan="7" class="muted">No stock held for this client in this period.</td></tr>'}</tbody>
<tfoot><tr><td colspan="2"><strong>Totals</strong></td><td class="num">${formatNumber(totals.opening, 0)}</td><td class="num">${formatNumber(totals.received, 0)}</td><td class="num">${formatNumber(totals.released, 0)}</td><td class="num"><strong>${formatNumber(totals.closing, 0)}</strong></td><td class="num">${formatNumber(totals.reserved, 0)}</td></tr></tfoot>
</table>

<h2>Movements in this period</h2>
<table><thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Stock #</th><th>Job #</th><th class="num">Quantity</th><th>Reference</th></tr></thead>
<tbody>${detailRows || '<tr><td colspan="7" class="muted">No movements in this period.</td></tr>'}</tbody>
</table>

<p class="muted" style="font-size: 11px; margin-top: 24px;">This statement reflects stock physically held on your behalf at ${company?.name || 'JomoPak'}. Reserved quantities are allocated to open orders and not yet released. Please notify us within 7 days of any discrepancies.</p>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 250);
  }

  return (
    <section className="card">
      <SectionTitle
        title="Stock Statements"
        subtitle={selectedClient ? `${selectedClient.name} · ${fromDate} → ${toDate}` : 'Pick a stock-holding client and a date range'}
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ghost-button" onClick={exportCsv} disabled={!selectedClient}>Export CSV</button>
            <button className="secondary-button" onClick={printStatement} disabled={!selectedClient}>Print / PDF</button>
          </div>
        }
      />

      <div className="filters-grid">
        <label><span>Client</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— pick client —</option>
            {stockHoldingClients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.stockHoldingEnabled ? ' ✓' : ''}</option>
            ))}
          </select>
        </label>
        <label><span>From</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
        <label><span>To</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
      </div>

      {!selectedClient ? (
        <EmptyState title="Pick a client" body="Choose a client above to see their stock statement. Clients marked ✓ are stock-holding accounts." />
      ) : (
        <>
          <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 12 }}>
            <button type="button" className={view === 'summary' ? 'secondary-button' : 'ghost-button'} onClick={() => setView('summary')}>Per-product summary</button>
            <button type="button" className={view === 'detail' ? 'secondary-button' : 'ghost-button'} onClick={() => setView('detail')}>Movements ({detail.length})</button>
          </div>

          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Opening total</span><strong>{formatNumber(totals.opening, 0)}</strong></div>
            <div className="food-safety-stat"><span>Received</span><strong>+{formatNumber(totals.received, 0)}</strong></div>
            <div className="food-safety-stat"><span>Released</span><strong>-{formatNumber(totals.released, 0)}</strong></div>
            <div className="food-safety-stat"><span>Closing on hand</span><strong>{formatNumber(totals.closing, 0)}</strong></div>
            <div className="food-safety-stat"><span>Reserved (informational)</span><strong>{formatNumber(totals.reserved, 0)}</strong></div>
          </div>

          {view === 'summary' ? (
            summary.length === 0 ? (
              <EmptyState title="No stock for this client" body="No batches stored for this client in the date range." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Product</th><th>Unit</th><th>Opening</th><th>Received</th><th>Released</th><th>On hand</th><th>Reserved</th></tr></thead>
                  <tbody>
                    {summary.map((l) => (
                      <tr key={`${l.productId}-${l.productName}`}>
                        <td><strong>{l.productName}</strong></td>
                        <td>{l.unit || '—'}</td>
                        <td>{formatNumber(l.opening, 0)}</td>
                        <td>+{formatNumber(l.received, 0)}</td>
                        <td>-{formatNumber(l.released, 0)}</td>
                        <td><strong>{formatNumber(l.closing, 0)}</strong></td>
                        <td className="muted">{formatNumber(l.reserved, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            detail.length === 0 ? (
              <EmptyState title="No movements" body="No receipts or releases in this period." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Stock #</th><th>Job #</th><th>Quantity</th><th>Reference</th></tr></thead>
                  <tbody>
                    {detail.map((t, i) => (
                      <tr key={i}>
                        <td>{formatDate(t.date)}</td>
                        <td><span className={t.type === 'Release' ? 'badge badge-danger' : 'badge badge-success'}>{t.type}</span></td>
                        <td>{t.productName}</td>
                        <td className="muted">{t.stockNumber || '—'}</td>
                        <td className="muted">{t.jobNumber || '—'}</td>
                        <td><strong>{t.type === 'Release' ? '-' : '+'}{formatNumber(t.quantity, 0)} {t.unit}</strong></td>
                        <td className="muted">{t.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </section>
  );
}
