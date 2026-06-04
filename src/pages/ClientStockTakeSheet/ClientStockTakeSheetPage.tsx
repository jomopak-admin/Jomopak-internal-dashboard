/**
 * Client Stock-Take Sheet — printable.
 *
 * Phase 135.1 — for clients under a Stock Holding Agreement we need to
 * physically count what's left in our warehouse. This page pulls every
 * item committed to a chosen client (paper bags, greaseproof, boxes
 * sourced from suppliers, traded goods, etc.), calculates EXPECTED
 * on-hand from (made − drawdowns) and renders a clean printable sheet
 * with blank columns for Actual Count + Variance.
 *
 * Lebo (or whoever counts) prints, walks the warehouse, fills in the
 * actual count column, signs at the bottom, hands it back. Discrepancies
 * become the basis for a stock adjustment SQL.
 *
 * Drawdowns are computed from invoice line items matched by description
 * keywords. It's approximate (description-text matching) but practical
 * for the current data shape.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  Client,
  Invoice,
  QuoteEstimate,
} from '../../types';
import { formatDate } from '../../utils/calculations';
import { AppSettingsCompany } from '../../types';

interface ClientStockTakeSheetPageProps {
  clients: Client[];
  invoices: Invoice[];
  quoteEstimates: QuoteEstimate[];
  company?: AppSettingsCompany;
  today: string;
}

/**
 * One row on the stock take sheet. The expected-qty maths is per row:
 * `expected = madeQty - sum(drawdowns from invoices that match this row)`
 */
interface StockRow {
  /** Display label of the item (printed on the sheet). */
  label: string;
  /** Detail line shown smaller under the label (size / supplier etc). */
  detail: string;
  /** What we committed to manufacture / source. */
  madeQty: number;
  /** Total used so far. */
  drawnQty: number;
  /** Computed expected on-hand. */
  expectedQty: number;
  /** Source of this row — which quote line or traded-goods record. */
  source: string;
}

/**
 * Best-effort match of an invoice line description against a known
 * keyword set. Returns the qty consumed if matched. Negative qtys
 * (credits / returns) are honoured so an apparent overdraw becomes a
 * net reduction in drawn-down.
 */
function sumDrawdowns(invoices: Invoice[], clientId: string, keywords: string[]): number {
  let total = 0;
  for (const inv of invoices) {
    if (inv.clientId !== clientId) continue;
    if (inv.status === 'Cancelled' || inv.status === 'Draft') continue;
    const lines = Array.isArray(inv.lineItems) ? inv.lineItems : [];
    for (const li of lines) {
      const desc = String((li as { description?: string }).description ?? '').toLowerCase();
      const qty = Number((li as { qty?: number }).qty ?? 0);
      if (!desc || !qty) continue;
      // Match if ALL keywords appear in the description (logical AND).
      const hit = keywords.every((k) => desc.includes(k.toLowerCase()));
      if (hit) total += qty;
    }
  }
  return total;
}

export function ClientStockTakeSheetPage({
  clients,
  invoices,
  quoteEstimates,
  company,
  today,
}: ClientStockTakeSheetPageProps) {
  const [clientId, setClientId] = useState<string>('');
  const [stocktakerName, setStocktakerName] = useState<string>('');
  const [stocktakeDate, setStocktakeDate] = useState<string>(today);

  // Only show clients that actually have a stock-holding presence — i.e.
  // there's at least one invoice or one quote_estimate linked to them.
  const billableClients = useMemo(() => {
    const ids = new Set<string>();
    for (const inv of invoices) if (inv.clientId) ids.add(inv.clientId);
    for (const qe of quoteEstimates) if (qe.clientId) ids.add(qe.clientId);
    return clients.filter((c) => ids.has(c.id))
      .sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
  }, [clients, invoices, quoteEstimates]);

  const client = clients.find((c) => c.id === clientId);

  /**
   * Build the rows for the selected client. Pull from:
   *   1. Quote estimates with status 'Approved' / 'Converted to Job' (the
   *      production / stock-holding commitments)
   *   2. Per-row drawdowns from this client's paid invoices via the
   *      description-keyword matcher.
   */
  const rows = useMemo<StockRow[]>(() => {
    if (!clientId) return [];
    const out: StockRow[] = [];

    // Quote-driven rows. We treat each quote line that's 'Converted to Job'
    // or 'Approved' as a committed manufacturing/stock-holding line.
    const clientQuotes = quoteEstimates.filter((qe) => qe.clientId === clientId
      && (qe.status === 'Converted to Job' || qe.status === 'Approved'));

    for (const qe of clientQuotes) {
      if (!qe.productName || !qe.quantity) continue;
      // Build keyword list from the product name. Strip generic words to
      // narrow the description-match against invoice line items.
      const productName = qe.productName.toLowerCase();
      const sizeSpec = (qe.sizeSpec || '').toLowerCase();
      const keywords: string[] = [];

      // Heuristic — pick the strongest distinguishing keyword(s) from
      // the product name. We pick the box-type identifier or "paper bags"
      // or "greaseproof" — the language that consistently appears on
      // invoice lines for that item.
      if (productName.includes('paper bags') || productName.includes('paper white bags')) {
        keywords.push('bleached paper');
      } else if (productName.includes('greaseproof')) {
        keywords.push('greaseproof');
      } else if (productName.includes('plate die')) {
        continue; // Plates aren't a physical stock item — skip.
      } else if (productName.includes('dripless')) {
        keywords.push('dripless');
      } else if (productName.includes('saa style') || productName.includes('loaded fries')) {
        // Loaded Fries Box is the renamed SAA Style box per Aman.
        keywords.push('loaded fries'); // We'll add the second match below.
      } else if (productName.includes('chips insert') || productName.includes('chip')) {
        keywords.push('chip');
      } else if (productName.includes('sandwich')) {
        keywords.push('sandwich');
      } else if (productName.includes('window')) {
        keywords.push('window');
      } else if (productName.includes('self-erecting box') && sizeSpec.includes('122x88')) {
        keywords.push('burger');
        keywords.push('122x88');
      } else if (productName.includes('self-erecting box') && sizeSpec.includes('100x88')) {
        keywords.push('100x88');
      } else if (productName.includes('self-erecting tray')) {
        keywords.push('self-erecting tray');
      } else if (productName.includes('gelato cup')) {
        keywords.push('gelato');
      } else {
        // Fallback: first 2 significant words from the product name.
        const tokens = productName.split(/\s+/).filter((t) => t.length > 3).slice(0, 2);
        if (tokens.length === 0) continue;
        keywords.push(...tokens);
      }

      // Special: SAA Style box also appears on invoices as 'loaded fries' —
      // include both phrasings. Sum drawdowns across both keyword sets.
      let drawn = sumDrawdowns(invoices, clientId, keywords);
      if (productName.includes('saa style') || productName.includes('loaded fries')) {
        // Also pick up invoice lines that mention "saa style" instead.
        drawn += sumDrawdowns(invoices, clientId, ['saa style']);
      }

      // Special override per Aman 04/06/2026: Q1086 paper bags were
      // manufactured at 25,000 (not the 50,000 quoted). The system has the
      // corrected qty on the line, but if you're looking at a stale row
      // the override kicks in.
      let madeQty = qe.quantity;
      if (productName.includes('paper bags') || productName.includes('paper white bags')) {
        madeQty = Math.min(madeQty, 25000);
      }

      out.push({
        label: qe.productName,
        detail: [qe.sizeSpec, qe.quoteNumber].filter(Boolean).join(' · '),
        madeQty,
        drawnQty: drawn,
        expectedQty: madeQty - drawn,
        source: `Quote ${qe.quoteNumber}`,
      });
    }

    // Sort: largest expected first (biggest items first on the count sheet).
    return out.sort((a, b) => b.expectedQty - a.expectedQty);
  }, [clientId, quoteEstimates, invoices]);

  const totalExpected = rows.reduce((sum, r) => sum + r.expectedQty, 0);

  return (
    <div className="page-stack">
      <SectionTitle
        title="Client Stock-Take Sheet"
        subtitle="Print a sheet of expected on-hand quantities for a chosen client. Lebo walks the warehouse, fills in the actual counts."
        action={rows.length > 0 ? (
          <button className="primary-button no-print" onClick={() => window.print()}>
            Print sheet
          </button>
        ) : undefined}
      />

      {/* ── Toolbar (hidden on print) ──────────────────────────── */}
      <section className="card accounting-toolbar no-print">
        <label>
          <span>Client</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— select a client —</option>
            {billableClients.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Stocktaker name</span>
          <input
            value={stocktakerName}
            placeholder="e.g. Lebo"
            onChange={(e) => setStocktakerName(e.target.value)}
          />
        </label>
        <label>
          <span>Stocktake date</span>
          <input type="date" value={stocktakeDate} onChange={(e) => setStocktakeDate(e.target.value)} />
        </label>
      </section>

      {!clientId ? (
        <EmptyState
          title="Pick a client to start"
          body="Choose a client above to generate the stock-take sheet."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No stock-holding items"
          body={`No quoted production found for ${client?.companyName || client?.name || 'this client'}. The system can only generate a stock-take sheet for clients with at least one Converted-to-Job or Approved quote line.`}
        />
      ) : (
        // ── Printable sheet ──────────────────────────────────
        <article className="card" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px' }}>
          {/* Header */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid #ddd',
            paddingBottom: 12,
            marginBottom: 18,
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>{company?.name || 'JomoPak'}</h1>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
                {company?.addressLine1}
                {company?.phone ? <> · {company.phone}</> : null}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Stock-Take Sheet
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
                As at {formatDate(stocktakeDate)}
              </p>
            </div>
          </header>

          {/* Client + stocktaker block */}
          <section style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 14, fontSize: 12 }}>
            <div>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: '#999' }}>Client</p>
              <strong style={{ fontSize: 14 }}>{client?.companyName || client?.name}</strong>
            </div>
            <div>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: '#999' }}>Stocktaker</p>
              <strong style={{ fontSize: 14 }}>{stocktakerName || '__________________'}</strong>
            </div>
            <div>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: '#999' }}>Items</p>
              <strong style={{ fontSize: 14 }}>{rows.length}</strong>
            </div>
            <div>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: '#999' }}>Total expected</p>
              <strong style={{ fontSize: 14 }}>{totalExpected.toLocaleString()}</strong>
            </div>
          </section>

          {/* Count rows */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #999', textAlign: 'left' }}>
                <th style={{ padding: '6px 4px', width: '40%' }}>Item</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Made</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Drawn</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Expected</th>
                <th style={{ padding: '6px 4px', textAlign: 'right', borderLeft: '1px dashed #999', width: '14%' }}>Actual count</th>
                <th style={{ padding: '6px 4px', textAlign: 'right', width: '14%' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px' }}>
                    <strong>{r.label}</strong>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{r.detail}</div>
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>{r.madeQty.toLocaleString()}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>{r.drawnQty.toLocaleString()}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>
                    {r.expectedQty.toLocaleString()}
                  </td>
                  <td style={{
                    padding: '8px 4px',
                    textAlign: 'right',
                    borderLeft: '1px dashed #999',
                    minHeight: 30,
                    height: 30,
                  }}>
                    {/* Empty box for handwritten actual count */}
                    &nbsp;
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                    {/* Empty box for variance (Actual − Expected) */}
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #333', fontWeight: 700 }}>
                <td style={{ padding: '8px 4px' }}>Total units expected on hand</td>
                <td colSpan={2} />
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>{totalExpected.toLocaleString()}</td>
                <td style={{ borderLeft: '1px dashed #999' }} />
                <td />
              </tr>
            </tfoot>
          </table>

          {/* Sign-off footer */}
          <footer style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 11, color: '#444' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: '#999' }}>
                Counted by
              </p>
              <p style={{ marginTop: 24, borderTop: '1px solid #333', paddingTop: 2 }}>
                {stocktakerName || 'Signature'}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: '#999' }}>
                Date
              </p>
              <p style={{ marginTop: 24, borderTop: '1px solid #333', paddingTop: 2 }}>
                {formatDate(stocktakeDate)}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: '#999' }}>
                Reviewed by
              </p>
              <p style={{ marginTop: 24, borderTop: '1px solid #333', paddingTop: 2 }}>Signature</p>
            </div>
          </footer>

          <p style={{ marginTop: 18, fontSize: 10, color: '#999', textAlign: 'center' }}>
            Generated by JomoPak Dashboard · variance = actual − expected · any variance gets investigated + posted as a stock adjustment.
          </p>
        </article>
      )}
    </div>
  );
}
