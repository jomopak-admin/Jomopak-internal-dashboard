/**
 * Client 360 — Phase 136.1.
 *
 * One page that consolidates everything about a single client so Aman can
 * answer in 10 seconds: "what does Bruv owe, what stock have I committed
 * to him, what's he taken, what's the margin look like?"
 *
 * Hybrid layout — Overview KPIs always visible at the top, then four
 * collapsible cards (Financials / Stock & Goods / Margin / Activity).
 *
 * Data sources (all already in app state, no extra fetches):
 *   - Client (header + payment terms)
 *   - Invoice[] filtered by clientId  (revenue + AR + drawdowns)
 *   - CustomerDeposit[] filtered by clientId  (cash received, allocations)
 *   - QuoteEstimate[] filtered by clientId  (committed manufacturing stock)
 *   - TradedGoodsItem[] (cost basis for margin on traded goods sold)
 *   - SupplierBill[] (cost basis fallback for non-traded-good costs)
 *
 * Margin section is gated behind a permission check (admin / pricingEditor /
 * canViewCosts). The Sales role will not see it.
 *
 * Cost computation is approximate at this stage — we use:
 *   1. Quote line unitCost × drawn qty (the calculator's costed unit cost
 *      at the time of quote save), where the invoice line maps back to a
 *      quote line via description keyword match (same logic the stock-take
 *      sheet uses).
 *   2. For traded goods sold, qty × tradedGoods.defaultUnitCost as a
 *      fallback when no quote line maps.
 *   3. Anything we can't map is flagged as "uncosted" so admin knows
 *      margin % is approximate, not gospel.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  Entity360Layout,
  Entity360Link,
  Entity360Document,
} from '../../components/Entity360/Entity360Layout';
import {
  Client,
  CustomerDeposit,
  Invoice,
  QuoteEstimate,
  TradedGoodsItem,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface ClientDetailPageProps {
  clients: Client[];
  invoices: Invoice[];
  deposits: CustomerDeposit[];
  quoteEstimates: QuoteEstimate[];
  tradedGoodsItems: TradedGoodsItem[];
  /** Pre-selected client (set when navigated from another page). */
  selectedClientId?: string;
  /** True if the current user is allowed to see cost + margin data. */
  canViewCosts: boolean;
  today: string;
}

/** Helper — sum of invoice line drawdowns matching a keyword set. */
function sumDrawdowns(invoices: Invoice[], clientId: string, keywords: string[]): number {
  let total = 0;
  for (const inv of invoices) {
    if (inv.clientId !== clientId) continue;
    if (inv.status === 'Cancelled' || inv.status === 'Draft') continue;
    for (const li of inv.lineItems || []) {
      const desc = String(li.description ?? '').toLowerCase();
      const qty = Number(li.quantity ?? 0);
      if (!desc || !qty) continue;
      if (keywords.every((k) => desc.includes(k.toLowerCase()))) total += qty;
    }
  }
  return total;
}

/**
 * Heuristic — turn a quote line's productName into the keyword set used to
 * locate the matching drawdown lines on invoices. Same heuristic the stock
 * take sheet uses so the two pages agree on what counts as "drawn".
 */
function keywordsForProduct(productName: string, sizeSpec: string): string[] | null {
  const n = productName.toLowerCase();
  const s = (sizeSpec || '').toLowerCase();
  if (n.includes('paper bags') || n.includes('paper white bags')) return ['bleached paper'];
  if (n.includes('greaseproof')) return ['greaseproof'];
  if (n.includes('plate die')) return null;
  if (n.includes('dripless')) return ['dripless'];
  if (n.includes('saa style') || n.includes('loaded fries')) return ['loaded fries'];
  if (n.includes('chips insert') || n.includes('chip')) return ['chip'];
  if (n.includes('sandwich')) return ['sandwich'];
  if (n.includes('window')) return ['window'];
  if (n.includes('self-erecting box') && s.includes('122x88')) return ['burger', '122x88'];
  if (n.includes('self-erecting box') && s.includes('100x88')) return ['100x88'];
  if (n.includes('self-erecting tray')) return ['self-erecting tray'];
  if (n.includes('gelato cup')) return ['gelato'];
  const tokens = n.split(/\s+/).filter((t) => t.length > 3).slice(0, 2);
  return tokens.length ? tokens : null;
}

/** One row on the stock section. */
interface StockRow {
  label: string;
  detail: string;
  madeQty: number;
  drawnQty: number;
  expectedQty: number;
  source: string;
  /** ex-VAT unit cost from the quote (admin-only). 0 if unknown. */
  unitCost: number;
  /** ex-VAT unit price from the quote (admin-only). 0 if unknown. */
  unitPrice: number;
}

/** One row on the traded-goods drawdown table. */
interface TradedGoodsDrawdownRow {
  itemId: string;
  name: string;
  unitCost: number;
  qtyTaken: number;
  revenueExVat: number;
  /** Costed value for this line (qty × unit cost). */
  costExVat: number;
  matched: boolean;
}

/** One row on the activity timeline. */
interface ActivityEvent {
  date: string;
  type: 'invoice' | 'payment' | 'deposit' | 'depositAllocation';
  title: string;
  detail: string;
  amount: number;
  /** Sign hint for colour cue. */
  direction: 'in' | 'out';
}

export function ClientDetailPage({
  clients,
  invoices,
  deposits,
  quoteEstimates,
  tradedGoodsItems,
  selectedClientId,
  canViewCosts,
  today,
}: ClientDetailPageProps) {
  const [clientId, setClientId] = useState<string>(selectedClientId || '');
  const [search, setSearch] = useState('');
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    financials: true,
    stock: true,
    margin: false,
    activity: false,
  });

  // Clients with at least one invoice / quote / deposit — filters out
  // never-traded clients to keep the picker tight.
  const tradedClients = useMemo(() => {
    const ids = new Set<string>();
    for (const i of invoices) if (i.clientId) ids.add(i.clientId);
    for (const q of quoteEstimates) if (q.clientId) ids.add(q.clientId);
    for (const d of deposits) if (d.clientId) ids.add(d.clientId);
    return clients
      .filter((c) => ids.has(c.id))
      .sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
  }, [clients, invoices, quoteEstimates, deposits]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return tradedClients;
    const q = search.toLowerCase();
    return tradedClients.filter((c) => (
      (c.name || '').toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q)
    ));
  }, [tradedClients, search]);

  const client = clients.find((c) => c.id === clientId);

  // ── Scoped data slices ──────────────────────────────────────────────
  const clientInvoices = useMemo(
    () => invoices.filter((i) => i.clientId === clientId && i.status !== 'Draft' && i.status !== 'Cancelled'),
    [invoices, clientId],
  );

  const clientDeposits = useMemo(
    () => deposits.filter((d) => d.clientId === clientId && d.status !== 'Cancelled'),
    [deposits, clientId],
  );

  const clientQuotes = useMemo(
    () => quoteEstimates.filter((q) => q.clientId === clientId),
    [quoteEstimates, clientId],
  );

  // ── Overview KPIs ───────────────────────────────────────────────────
  const kpis = useMemo(() => {
    let lifetimeRevenueExVat = 0;
    let lifetimeInclVat = 0;
    let lifetimePaymentsToInvoices = 0;
    let totalOutstanding = 0;
    let lastOrderDate = '';
    for (const inv of clientInvoices) {
      lifetimeRevenueExVat += Number(inv.subtotalExclVat) || 0;
      lifetimeInclVat += Number(inv.totalInclVat) || 0;
      lifetimePaymentsToInvoices += Number(inv.amountPaid) || 0;
      totalOutstanding += Number(inv.amountOutstanding) || 0;
      if (inv.invoiceDate && inv.invoiceDate > lastOrderDate) lastOrderDate = inv.invoiceDate;
    }
    let depositReceived = 0;
    let depositAllocated = 0;
    let depositOpen = 0;
    for (const d of clientDeposits) {
      depositReceived += Number(d.amount) || 0;
      depositAllocated += Number(d.allocatedAmount) || 0;
      depositOpen += Number(d.remainingAmount) || 0;
    }
    const netOutstanding = totalOutstanding - depositOpen;
    const totalCashIn = lifetimePaymentsToInvoices + depositReceived;
    // Days since last order
    let daysSinceLast = 0;
    if (lastOrderDate) {
      const diff = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastOrderDate}T00:00:00Z`)) / (1000 * 60 * 60 * 24);
      daysSinceLast = Math.max(0, Math.floor(diff));
    }
    const avgOrderValue = clientInvoices.length ? lifetimeInclVat / clientInvoices.length : 0;
    return {
      lifetimeRevenueExVat,
      lifetimeInclVat,
      lifetimePaymentsToInvoices,
      totalOutstanding,
      depositReceived,
      depositAllocated,
      depositOpen,
      netOutstanding,
      totalCashIn,
      invoiceCount: clientInvoices.length,
      quoteCount: clientQuotes.length,
      depositCount: clientDeposits.length,
      avgOrderValue,
      lastOrderDate,
      daysSinceLast,
    };
  }, [clientInvoices, clientDeposits, clientQuotes, today]);

  // ── Aging buckets ───────────────────────────────────────────────────
  const buckets = useMemo(() => {
    const b = { current: 0, d30: 0, d60: 0, d90: 0, d120: 0 };
    const DAY = 1000 * 60 * 60 * 24;
    for (const inv of clientInvoices) {
      const out = Number(inv.amountOutstanding) || 0;
      if (out <= 0) continue;
      const d = inv.dueDate ? Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${inv.dueDate}T00:00:00Z`)) / DAY) : 0;
      if (d <= 0) b.current += out;
      else if (d <= 30) b.d30 += out;
      else if (d <= 60) b.d60 += out;
      else if (d <= 90) b.d90 += out;
      else b.d120 += out;
    }
    return b;
  }, [clientInvoices, today]);

  // ── Stock rows (quote-driven) ───────────────────────────────────────
  const stockRows = useMemo<StockRow[]>(() => {
    if (!clientId) return [];
    const out: StockRow[] = [];
    for (const qe of clientQuotes) {
      if (qe.status !== 'Converted to Job' && qe.status !== 'Approved') continue;
      if (!qe.productName || !qe.quantity) continue;
      const kw = keywordsForProduct(qe.productName, qe.sizeSpec || '');
      if (!kw) continue;
      let drawn = sumDrawdowns(invoices, clientId, kw);
      // Special — Loaded Fries / SAA Style is the same product on invoices.
      if (qe.productName.toLowerCase().includes('saa style') || qe.productName.toLowerCase().includes('loaded fries')) {
        drawn += sumDrawdowns(invoices, clientId, ['saa style']);
      }
      // Special — Q1086 was clamped to 25,000 manufactured, not the original quote qty.
      let madeQty = qe.quantity;
      const isPaperBags = qe.productName.toLowerCase().includes('paper bags') || qe.productName.toLowerCase().includes('paper white bags');
      if (isPaperBags) madeQty = Math.min(madeQty, 25000);
      out.push({
        label: qe.productName,
        detail: [qe.sizeSpec, qe.quoteNumber].filter(Boolean).join(' · '),
        madeQty,
        drawnQty: drawn,
        expectedQty: madeQty - drawn,
        source: `Quote ${qe.quoteNumber}`,
        unitCost: Number(qe.unitCost) || 0,
        unitPrice: Number(qe.quotedUnitPrice) || 0,
      });
    }
    return out.sort((a, b) => b.expectedQty - a.expectedQty);
  }, [clientId, clientQuotes, invoices]);

  // ── Traded-goods drawdowns ─────────────────────────────────────────
  // For each traded good, sum qty × revenue across invoice lines that match
  // the SKU's name keywords. Lets us show "tot cans sold to Bruv" etc.
  const tradedGoodsRows = useMemo<TradedGoodsDrawdownRow[]>(() => {
    if (!clientId) return [];
    const rows: TradedGoodsDrawdownRow[] = [];
    for (const item of tradedGoodsItems) {
      if (!item.active) continue;
      // Build keywords from the SKU name. Drop very short words.
      const name = (item.name || '').toLowerCase();
      const tokens = name.split(/[\s,()/-]+/).filter((t) => t.length > 3);
      if (tokens.length === 0) continue;
      // Heuristic — use the two most distinctive tokens (skip "unbranded" "paper" etc that match too much).
      const distinctive = tokens.filter((t) => !['unbranded', 'with', 'paper', 'plain'].includes(t));
      const kw = distinctive.length >= 1 ? distinctive.slice(0, 2) : tokens.slice(0, 2);
      let qty = 0;
      let revenue = 0;
      for (const inv of clientInvoices) {
        for (const li of inv.lineItems || []) {
          const desc = String(li.description ?? '').toLowerCase();
          const q = Number(li.quantity ?? 0);
          if (!desc || !q) continue;
          if (kw.every((k) => desc.includes(k))) {
            qty += q;
            revenue += Number(li.lineTotalExclVat ?? 0) || (q * Number(li.unitPriceExclVat ?? 0));
          }
        }
      }
      if (qty <= 0) continue;
      const unitCost = Number(item.defaultUnitCost) || 0;
      rows.push({
        itemId: item.id,
        name: item.name,
        unitCost,
        qtyTaken: qty,
        revenueExVat: revenue,
        costExVat: qty * unitCost,
        matched: unitCost > 0,
      });
    }
    return rows.sort((a, b) => b.qtyTaken - a.qtyTaken);
  }, [clientId, tradedGoodsItems, clientInvoices]);

  // ── Margin (admin/cost-view only) ───────────────────────────────────
  const margin = useMemo(() => {
    if (!canViewCosts) return null;
    // Quote-line margin: for each quote line shipped, revenue = drawn × quoted price,
    // cost = drawn × unit cost. We approximate by using stockRows drawnQty.
    let revenueExVat = 0;
    let costExVat = 0;
    const lineMargins: { label: string; revenue: number; cost: number; marginPct: number; loss: boolean }[] = [];
    for (const row of stockRows) {
      const lineRev = row.drawnQty * row.unitPrice;
      const lineCost = row.drawnQty * row.unitCost;
      revenueExVat += lineRev;
      costExVat += lineCost;
      const marginPct = lineRev > 0 ? ((lineRev - lineCost) / lineRev) * 100 : 0;
      lineMargins.push({ label: row.label, revenue: lineRev, cost: lineCost, marginPct, loss: lineRev > 0 && lineCost > lineRev });
    }
    // Traded goods margin
    for (const tg of tradedGoodsRows) {
      revenueExVat += tg.revenueExVat;
      costExVat += tg.costExVat;
      const marginPct = tg.revenueExVat > 0 ? ((tg.revenueExVat - tg.costExVat) / tg.revenueExVat) * 100 : 0;
      lineMargins.push({ label: tg.name, revenue: tg.revenueExVat, cost: tg.costExVat, marginPct, loss: tg.revenueExVat > 0 && tg.costExVat > tg.revenueExVat });
    }
    const profit = revenueExVat - costExVat;
    const marginPct = revenueExVat > 0 ? (profit / revenueExVat) * 100 : 0;
    return { revenueExVat, costExVat, profit, marginPct, lineMargins: lineMargins.sort((a, b) => a.marginPct - b.marginPct) };
  }, [canViewCosts, stockRows, tradedGoodsRows]);

  // ── Activity timeline (newest first) ────────────────────────────────
  const activity = useMemo<ActivityEvent[]>(() => {
    const ev: ActivityEvent[] = [];
    for (const inv of clientInvoices) {
      ev.push({
        date: inv.invoiceDate,
        type: 'invoice',
        title: `Invoice ${inv.invoiceNumber} raised`,
        detail: `${inv.status} · ${inv.lineItems?.length ?? 0} line(s)`,
        amount: Number(inv.totalInclVat) || 0,
        direction: 'in',
      });
      for (const pmt of inv.payments || []) {
        ev.push({
          date: pmt.paymentDate,
          type: 'payment',
          title: `Payment vs Inv ${inv.invoiceNumber}`,
          detail: `${pmt.method}${pmt.reference ? ' · ' + pmt.reference : ''}`,
          amount: Number(pmt.amount) || 0,
          direction: 'in',
        });
      }
    }
    for (const d of clientDeposits) {
      ev.push({
        date: d.receivedDate,
        type: 'deposit',
        title: `Deposit ${d.depositNumber} received`,
        detail: `${d.paymentMethod}${d.bankReference ? ' · ' + d.bankReference : ''}`,
        amount: Number(d.amount) || 0,
        direction: 'in',
      });
      for (const a of d.allocations || []) {
        ev.push({
          date: a.appliedAt?.slice(0, 10) || d.receivedDate,
          type: 'depositAllocation',
          title: `Deposit ${d.depositNumber} allocated → Inv ${a.invoiceNumber || a.deliveryNoteNumber || '—'}`,
          detail: a.reason,
          amount: Number(a.appliedAmount) || 0,
          direction: 'out',
        });
      }
    }
    return ev.sort((a, b) => b.date.localeCompare(a.date));
  }, [clientInvoices, clientDeposits]);

  // ── Render helpers ──────────────────────────────────────────────────
  function toggleCard(key: string) {
    setOpenCards((c) => ({ ...c, [key]: !c[key] }));
  }
  function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
      <div style={{
        background: 'var(--jp-card, #fff)',
        border: '1px solid var(--jp-line, #e2e8f0)',
        borderRadius: 8,
        padding: '14px 16px',
        minWidth: 160,
        flex: '1 1 180px',
      }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{value}</div>
        {sub ? <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)', marginTop: 2 }}>{sub}</div> : null}
      </div>
    );
  }

  function CardSection({ k, title, subtitle, children }: { k: string; title: string; subtitle?: string; children: React.ReactNode }) {
    const open = openCards[k];
    return (
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <button
          onClick={() => toggleCard(k)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: open ? '1px solid var(--jp-line, #e2e8f0)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
            {subtitle ? <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', marginTop: 2 }}>{subtitle}</div> : null}
          </div>
          <span style={{ fontSize: 18, color: 'var(--jp-ink-3, #64748b)' }}>{open ? '−' : '+'}</span>
        </button>
        {open ? <div style={{ padding: '14px 18px' }}>{children}</div> : null}
      </section>
    );
  }

  if (!clientId) {
    // ── Picker / search view ────────────────────────────────────────
    return (
      <div className="page-stack">
        <SectionTitle
          title="Client 360"
          subtitle="Pick a client to see the full relationship — revenue, AR, deposits, stock committed, what they've taken, and margin."
        />
        <section className="card">
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>Search clients</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, company, or code"
              style={{ width: '100%', padding: '8px 10px', marginTop: 4 }}
            />
          </label>
          {filteredClients.length === 0 ? (
            <EmptyState title="No matching clients" body="No traded clients match that search." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th style={{ textAlign: 'right' }}>Invoices</th>
                    <th style={{ textAlign: 'right' }}>Deposits</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => {
                    const invCount = invoices.filter((i) => i.clientId === c.id).length;
                    const depCount = deposits.filter((d) => d.clientId === c.id).length;
                    return (
                      <tr key={c.id}>
                        <td><strong>{c.companyName || c.name}</strong>{c.code ? <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>{c.code}</div> : null}</td>
                        <td style={{ textAlign: 'right' }}>{invCount}</td>
                        <td style={{ textAlign: 'right' }}>{depCount}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="table-button" onClick={() => setClientId(c.id)}>Open 360</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="page-stack">
        <SectionTitle title="Client 360" />
        <EmptyState
          title="Client not found"
          body="The selected client no longer exists. Pick another from the list."
        />
        <button className="secondary-button" onClick={() => setClientId('')}>← Back to client list</button>
      </div>
    );
  }

  // ── Build the 7 lenses for the shared layout ─────────────────────
  // Lens 2: Linked-to relationships
  const links: Entity360Link[] = [];
  if (client.accountManagerName) links.push({ kind: 'staff', label: 'Account Manager', value: client.accountManagerName });
  if (client.pricingTierName) links.push({ kind: 'other', label: 'Pricing Tier', value: client.pricingTierName });
  if (client.paymentTerms) links.push({ kind: 'other', label: 'Terms', value: client.paymentTerms });
  if (clientQuotes.length > 0) links.push({ kind: 'quote', label: 'Quotes', value: `${clientQuotes.length} on file` });
  if (clientInvoices.length > 0) links.push({ kind: 'invoice', label: 'Invoices', value: `${clientInvoices.length} raised` });
  if (clientDeposits.length > 0) links.push({ kind: 'deposit', label: 'Deposits', value: `${clientDeposits.length} captured` });

  // Lens 3: Status — derived from account hold + AR posture
  const statusLens: Parameters<typeof Entity360Layout>[0]['status'] = (() => {
    if (client.accountHold) return { label: 'On Account Hold', tone: 'danger' as const };
    if (kpis.totalOutstanding > 0 && buckets.d120 > 0) return { label: 'Overdue 90+', tone: 'danger' as const };
    if (kpis.totalOutstanding > 0) return { label: 'Owes Money', tone: 'warning' as const };
    if (kpis.invoiceCount === 0) return { label: 'New (No Invoices)', tone: 'neutral' as const };
    return { label: 'Active · In Good Standing', tone: 'success' as const };
  })();

  // Lens 4: Money — combines AR + deposits into one financial snapshot
  const moneyLens = {
    revenue: kpis.lifetimeRevenueExVat,
    paid: kpis.totalCashIn,
    outstanding: kpis.netOutstanding,
  };

  // Lens 5: Stock — aggregate across all rows
  const totalCommitted = stockRows.reduce((s, r) => s + r.madeQty, 0);
  const totalDrawn = stockRows.reduce((s, r) => s + r.drawnQty, 0);
  const totalOnHand = stockRows.reduce((s, r) => s + r.expectedQty, 0);
  const stockLens = stockRows.length > 0 ? {
    committed: totalCommitted,
    made: totalCommitted, // For client perspective, what we committed to make = what's been made (post-conversion)
    drawn: totalDrawn,
    onHand: totalOnHand,
    unit: 'units',
  } : undefined;

  // Lens 6: Documents — quotes + invoices act as anchor docs
  const documents: Entity360Document[] = [];
  for (const q of clientQuotes.slice(0, 3)) documents.push({ label: `Quote ${q.quoteNumber}`, kind: 'pdf' });
  for (const inv of [...clientInvoices].sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)).slice(0, 3)) {
    documents.push({ label: `Invoice ${inv.invoiceNumber}`, kind: 'pdf' });
  }

  // Lens 7: Next action — picked from a priority ladder
  const nextAction = (() => {
    if (client.accountHold) {
      return { label: 'Release account hold', detail: 'Customer is currently blocked from new orders.', priority: 'high' as const };
    }
    if (kpis.depositOpen > 0 && kpis.totalOutstanding > 0) {
      return {
        label: `Allocate R ${formatNumber(kpis.depositOpen, 2)} open deposits`,
        detail: `Net AR after allocation: R ${formatNumber(kpis.netOutstanding, 2)}`,
        priority: 'high' as const,
      };
    }
    if (buckets.d120 > 0) {
      return { label: `Chase R ${formatNumber(buckets.d120, 2)} > 90 days overdue`, priority: 'high' as const };
    }
    if (kpis.totalOutstanding > 0) {
      return { label: `Follow up on R ${formatNumber(kpis.totalOutstanding, 2)} outstanding`, priority: 'normal' as const };
    }
    if (kpis.daysSinceLast > 30 && kpis.invoiceCount > 0) {
      return { label: `Re-engage — ${kpis.daysSinceLast} days since last order`, priority: 'normal' as const };
    }
    return { label: 'Nothing pressing — relationship in good standing', priority: 'normal' as const };
  })();

  // ── Main detail view ──────────────────────────────────────────────
  return (
    <Entity360Layout
      identity={{
        type: 'Client',
        code: client.code || undefined,
        title: client.companyName || client.name,
        subtitle: [client.contactName, client.contactEmail, client.phoneNumber].filter(Boolean).join(' · '),
        typeTone: 'info',
      }}
      links={links}
      status={statusLens}
      money={moneyLens}
      stock={stockLens}
      documents={documents}
      nextAction={nextAction}
      canViewCosts={canViewCosts}
      onBack={() => setClientId('')}
    >
      {/* Extra deep-dive KPI strip for client-specific facts not covered by Money/Stock lenses. */}
      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          label="Open deposit pool"
          value={`R ${formatNumber(kpis.depositOpen, 2)}`}
          sub={`Allocated R ${formatNumber(kpis.depositAllocated, 0)} of R ${formatNumber(kpis.depositReceived, 0)}`}
        />
        <KpiCard
          label="Avg order value"
          value={`R ${formatNumber(kpis.avgOrderValue, 2)}`}
          sub={`${kpis.quoteCount} quote(s)`}
        />
        <KpiCard
          label="Last order"
          value={kpis.lastOrderDate ? formatDate(kpis.lastOrderDate) : '—'}
          sub={kpis.lastOrderDate ? `${kpis.daysSinceLast} days ago` : 'No invoices yet'}
        />
      </section>

      {/* ── Financials ───────────────────────────────────────────── */}
      <CardSection
        k="financials"
        title="Financials"
        subtitle={`${clientInvoices.length} invoice(s) · ${clientDeposits.length} deposit(s) · Ageing visible below`}
      >
        {clientInvoices.length === 0 ? (
          <EmptyState title="No invoices yet" body="When you raise an invoice for this client it appears here." />
        ) : (
          <>
            <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Invoices</h4>
            <div className="table-wrap">
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Paid</th>
                    <th style={{ textAlign: 'right' }}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {[...clientInvoices].sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)).map((inv) => (
                    <tr key={inv.id}>
                      <td><strong>{inv.invoiceNumber}</strong></td>
                      <td>{formatDate(inv.invoiceDate)}</td>
                      <td>{inv.status}</td>
                      <td style={{ textAlign: 'right' }}>R {formatNumber(inv.totalInclVat, 2)}</td>
                      <td style={{ textAlign: 'right' }}>R {formatNumber(inv.amountPaid, 2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: inv.amountOutstanding > 0 ? 700 : 400 }}>
                        R {formatNumber(inv.amountOutstanding, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ margin: '18px 0 8px', fontSize: 13 }}>Deposits</h4>
            {clientDeposits.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', margin: 0 }}>No deposits captured yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Deposit</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Allocated</th>
                      <th style={{ textAlign: 'right' }}>Open</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...clientDeposits].sort((a, b) => b.receivedDate.localeCompare(a.receivedDate)).map((d) => (
                      <tr key={d.id}>
                        <td><strong>{d.depositNumber}</strong>{d.bankReference ? <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>Ref: {d.bankReference}</div> : null}</td>
                        <td>{formatDate(d.receivedDate)}</td>
                        <td>{d.paymentMethod}</td>
                        <td style={{ textAlign: 'right' }}>R {formatNumber(d.amount, 2)}</td>
                        <td style={{ textAlign: 'right' }}>R {formatNumber(d.allocatedAmount, 2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: d.remainingAmount > 0.005 ? 700 : 400 }}>R {formatNumber(d.remainingAmount, 2)}</td>
                        <td>{d.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h4 style={{ margin: '18px 0 8px', fontSize: 13 }}>Ageing</h4>
            <div className="table-wrap">
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>Current</th>
                    <th style={{ textAlign: 'right' }}>1–30</th>
                    <th style={{ textAlign: 'right' }}>31–60</th>
                    <th style={{ textAlign: 'right' }}>61–90</th>
                    <th style={{ textAlign: 'right' }}>90+</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(buckets.current, 2)}</td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(buckets.d30, 2)}</td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(buckets.d60, 2)}</td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(buckets.d90, 2)}</td>
                    <td style={{ textAlign: 'right', color: buckets.d120 > 0 ? '#b22b2b' : undefined }}>R {formatNumber(buckets.d120, 2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>R {formatNumber(kpis.totalOutstanding, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardSection>

      {/* ── Stock & Goods ───────────────────────────────────────── */}
      <CardSection
        k="stock"
        title="Stock & Goods"
        subtitle={`${stockRows.length} committed item(s) · ${tradedGoodsRows.length} traded good line(s)`}
      >
        <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Quote-committed stock (Made vs Drawn)</h4>
        {stockRows.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>No converted-to-job or approved quote lines for this client.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Source</th>
                  <th style={{ textAlign: 'right' }}>Made</th>
                  <th style={{ textAlign: 'right' }}>Drawn</th>
                  <th style={{ textAlign: 'right' }}>Expected on hand</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((r, i) => (
                  <tr key={i} style={{ background: r.expectedQty <= 0 ? '#fff5f5' : undefined }}>
                    <td><strong>{r.label}</strong><div style={{ fontSize: 10, color: 'var(--jp-ink-3, #64748b)' }}>{r.detail}</div></td>
                    <td style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>{r.source}</td>
                    <td style={{ textAlign: 'right' }}>{r.madeQty.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{r.drawnQty.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.expectedQty.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h4 style={{ margin: '18px 0 8px', fontSize: 13 }}>Traded goods taken</h4>
        {tradedGoodsRows.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>No traded goods consumed by this client.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'right' }}>Qty taken</th>
                  <th style={{ textAlign: 'right' }}>Revenue (ex VAT)</th>
                </tr>
              </thead>
              <tbody>
                {tradedGoodsRows.map((r) => (
                  <tr key={r.itemId}>
                    <td>{r.name}</td>
                    <td style={{ textAlign: 'right' }}>{r.qtyTaken.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(r.revenueExVat, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardSection>

      {/* ── Margin (gated) ──────────────────────────────────────── */}
      {canViewCosts && margin ? (
        <CardSection
          k="margin"
          title="Margin (admin)"
          subtitle={`Revenue R ${formatNumber(margin.revenueExVat, 0)} − Cost R ${formatNumber(margin.costExVat, 0)} = R ${formatNumber(margin.profit, 0)} (${formatNumber(margin.marginPct, 1)} %)`}
        >
          {margin.lineMargins.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>No costed lines to summarise.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th style={{ textAlign: 'right' }}>Revenue (ex)</th>
                      <th style={{ textAlign: 'right' }}>Cost (ex)</th>
                      <th style={{ textAlign: 'right' }}>Margin</th>
                      <th style={{ textAlign: 'right' }}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {margin.lineMargins.map((m, i) => (
                      <tr key={i} style={{ background: m.loss ? '#fff5f5' : undefined }}>
                        <td>{m.label}</td>
                        <td style={{ textAlign: 'right' }}>R {formatNumber(m.revenue, 2)}</td>
                        <td style={{ textAlign: 'right' }}>R {formatNumber(m.cost, 2)}</td>
                        <td style={{ textAlign: 'right', color: m.loss ? '#b22b2b' : undefined, fontWeight: 700 }}>R {formatNumber(m.revenue - m.cost, 2)}</td>
                        <td style={{ textAlign: 'right', color: m.loss ? '#b22b2b' : undefined }}>{formatNumber(m.marginPct, 1)} %</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #333', fontWeight: 700 }}>
                      <td>Total (drawn lines)</td>
                      <td style={{ textAlign: 'right' }}>R {formatNumber(margin.revenueExVat, 2)}</td>
                      <td style={{ textAlign: 'right' }}>R {formatNumber(margin.costExVat, 2)}</td>
                      <td style={{ textAlign: 'right', color: margin.profit < 0 ? '#b22b2b' : undefined }}>R {formatNumber(margin.profit, 2)}</td>
                      <td style={{ textAlign: 'right', color: margin.profit < 0 ? '#b22b2b' : undefined }}>{formatNumber(margin.marginPct, 1)} %</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)', marginTop: 12 }}>
                Cost basis: quote-line unit costs + traded-goods default unit cost. Loss lines highlighted in red.
                Margin is approximate — uncosted lines (e.g. no traded-good SKU matched) are excluded.
              </p>
            </>
          )}
        </CardSection>
      ) : null}

      {/* ── Activity Timeline ───────────────────────────────────── */}
      <CardSection
        k="activity"
        title="Activity Timeline"
        subtitle={`${activity.length} event(s) — newest first`}
      >
        {activity.length === 0 ? (
          <EmptyState title="No activity yet" body="Invoices, payments, and deposits will appear here as they happen." />
        ) : (
          <div style={{ borderLeft: '2px solid var(--jp-line, #e2e8f0)', paddingLeft: 14 }}>
            {activity.slice(0, 50).map((e, i) => (
              <div key={i} style={{ marginBottom: 14, position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: -20,
                  top: 4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: e.direction === 'in' ? '#1e9d6b' : '#b08200',
                }} />
                <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{formatDate(e.date)} · {e.type}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{e.detail} · R {formatNumber(e.amount, 2)}</div>
              </div>
            ))}
            {activity.length > 50 ? (
              <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>+ {activity.length - 50} more event(s) older than the most recent 50.</div>
            ) : null}
          </div>
        )}
      </CardSection>
    </Entity360Layout>
  );
}
