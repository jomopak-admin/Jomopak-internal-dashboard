/**
 * Aman OS Connector — tile computation (Phase 32).
 *
 * Turns the full JomoPak AppData into a small set of curated, aggregated metric
 * tiles. This is the ONLY shape that leaves JomoPak — never raw rows. The
 * publisher writes these (minus any toggled off) to the connector feed, which a
 * token-secured read-only edge function serves to Aman OS.
 */

import { AppData, ConnectorTile } from '../types';
import { produceAllEvents } from './inbox';

function round2(n: number): number { return Math.round((Number(n) || 0) * 100) / 100; }

function startOfMonth(today: string): string { return `${today.slice(0, 7)}-01`; }
function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeConnectorTiles(data: AppData, today: string): ConnectorTile[] {
  const tiles: ConnectorTile[] = [];
  const monthStart = startOfMonth(today);
  const weekAhead = addDays(today, 7);

  // ── Finance ────────────────────────────────────────────────────────────
  const liveInvoices = data.invoices.filter((i) => i.status !== 'Draft' && i.status !== 'Cancelled');
  const arOutstanding = round2(liveInvoices.reduce((s, i) => s + (Number(i.amountOutstanding) || 0), 0));
  const overdue = liveInvoices.filter((i) => i.dueDate && i.dueDate < today && (Number(i.amountOutstanding) || 0) > 0);
  const overdueAmt = round2(overdue.reduce((s, i) => s + (Number(i.amountOutstanding) || 0), 0));
  const apOutstanding = round2(
    data.supplierBills
      .filter((b) => b.status !== 'Cancelled' && b.status !== 'Paid')
      .reduce((s, b) => s + (Number(b.amountOutstanding) || 0), 0),
  );
  const revenueMtd = round2(
    liveInvoices
      .filter((i) => i.invoiceDate && i.invoiceDate >= monthStart && i.invoiceDate <= today)
      .reduce((s, i) => s + (Number(i.subtotalExclVat) || 0) * (i.currency && i.currency !== 'ZAR' ? (Number(i.exchangeRate) || 1) : 1), 0),
  );
  tiles.push({ key: 'jomopak.finance.revenue_mtd', category: 'Finance', label: 'Revenue (this month)', value: revenueMtd, unit: 'ZAR', detail: 'Invoiced, excl VAT' });
  tiles.push({ key: 'jomopak.finance.ar_outstanding', category: 'Finance', label: 'Owed to us (debtors)', value: arOutstanding, unit: 'ZAR', detail: `${overdue.length} overdue` });
  tiles.push({ key: 'jomopak.finance.ar_overdue', category: 'Finance', label: 'Overdue receivables', value: overdueAmt, unit: 'ZAR', detail: `${overdue.length} invoice(s)` });
  tiles.push({ key: 'jomopak.finance.ap_outstanding', category: 'Finance', label: 'We owe (creditors)', value: apOutstanding, unit: 'ZAR', detail: 'Unpaid supplier bills' });

  // ── Sales ──────────────────────────────────────────────────────────────
  const openLeads = data.leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost');
  const followUpsDue = openLeads.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate <= today);
  tiles.push({ key: 'jomopak.sales.open_leads', category: 'Sales', label: 'Open leads', value: openLeads.length, unit: 'count', detail: `${followUpsDue.length} follow-up(s) due` });
  tiles.push({ key: 'jomopak.sales.followups_due', category: 'Sales', label: 'Follow-ups due', value: followUpsDue.length, unit: 'count', detail: 'Leads to chase today' });

  // ── Production ───────────────────────────────────────────────────────────
  const activeJobs = data.jobs.filter((j) => j.status !== 'Completed');
  const dueThisWeek = activeJobs.filter((j) => j.dueDate && j.dueDate >= today && j.dueDate <= weekAhead);
  const wasteMtd = round2(
    data.wasteEntries
      .filter((w) => w.wasteDate && w.wasteDate >= monthStart && w.wasteDate <= today)
      .reduce((s, w) => s + (Number(w.wasteQuantity) || 0), 0),
  );
  tiles.push({ key: 'jomopak.production.active_jobs', category: 'Production', label: 'Jobs in progress', value: activeJobs.length, unit: 'count', detail: `${dueThisWeek.length} due this week` });
  tiles.push({ key: 'jomopak.production.due_this_week', category: 'Production', label: 'Jobs due this week', value: dueThisWeek.length, unit: 'count', detail: '' });
  tiles.push({ key: 'jomopak.production.waste_mtd', category: 'Production', label: 'Waste (this month)', value: wasteMtd, unit: 'units', detail: 'Logged wastage' });

  // ── Stock ────────────────────────────────────────────────────────────────
  const lowSpares = data.spareParts.filter((p) => (p.reorderLevel ?? 0) > 0 && (p.quantityOnHand ?? 0) <= (p.reorderLevel ?? 0));
  const fgOnHand = round2(data.finishedGoodsStock.reduce((s, f) => s + (Number(f.quantityOnHand) || 0), 0));
  tiles.push({ key: 'jomopak.stock.finished_on_hand', category: 'Stock', label: 'Finished goods on hand', value: fgOnHand, unit: 'units', detail: '' });
  tiles.push({ key: 'jomopak.stock.spares_low', category: 'Stock', label: 'Spares below reorder', value: lowSpares.length, unit: 'count', detail: '' });

  // ── Compliance ─────────────────────────────────────────────────────────
  const openNcrs = data.nonConformances.filter((n) => n.status !== 'Closed').length;
  const openComplaints = data.customerComplaints.filter((c) => c.status !== 'Closed' && c.status !== 'Resolved').length;
  const expiringDocs = (data.documents || []).filter((d) => d.expiryDate && d.expiryDate <= addDays(today, 30)).length;
  tiles.push({ key: 'jomopak.compliance.open_ncrs', category: 'Compliance', label: 'Open NCRs', value: openNcrs, unit: 'count', detail: '' });
  tiles.push({ key: 'jomopak.compliance.open_complaints', category: 'Compliance', label: 'Open complaints', value: openComplaints, unit: 'count', detail: '' });
  tiles.push({ key: 'jomopak.compliance.docs_expiring', category: 'Compliance', label: 'Documents expiring (30d)', value: expiringDocs, unit: 'count', detail: '' });

  /* ─── Phase 103.5 — Aman OS Connector publishes Inbox health.
   *
   * One aggregate tile per inbox category, plus a headline "all events".
   * The Aman OS doesn't get individual events (privacy + volume) — it gets
   * the count by category and tone so it can surface "Aman, JomoPak has 7
   * urgent safety items waiting on you" without leaking row-level data.
   * ───────────────────────────────────────────────────────────────────── */
  try {
    const events = produceAllEvents(data);
    const totalAlerts = events.filter((e) => e.tone === 'alert').length;
    const totalWarn = events.filter((e) => e.tone === 'warning').length;
    tiles.push({
      key: 'jomopak.inbox.total',
      category: 'Compliance',
      label: 'Inbox items waiting',
      value: events.length,
      unit: 'count',
      detail: `${totalAlerts} urgent · ${totalWarn} warning`,
    });
    // Per-category roll-up. Skips empty categories so Aman OS doesn't render
    // dead tiles.
    const byCategory = new Map<string, number>();
    events.forEach((e) => byCategory.set(e.category, (byCategory.get(e.category) || 0) + 1));
    byCategory.forEach((count, category) => {
      tiles.push({
        key: `jomopak.inbox.${category.toLowerCase()}`,
        category: 'Compliance',
        label: `Inbox · ${category}`,
        value: count,
        unit: 'count',
        detail: '',
      });
    });
  } catch {
    // Don't let inbox computation break the rest of the publish.
  }

  return tiles;
}

/** The tiles actually published = computed tiles minus any toggled off. */
export function publishableTiles(data: AppData, today: string, disabledKeys: string[]): ConnectorTile[] {
  const off = new Set(disabledKeys);
  return computeConnectorTiles(data, today).filter((t) => !off.has(t.key));
}
