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
  BrandLogo,
  Client,
  CustomerStockRelease,
  FinishedGoodsStock,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';
import { sendEmails, OutgoingEmail } from '../../utils/emailService';
import { toast } from '../../components/Toast';
import { buildLetterhead, buildCompanyBlock } from '../../utils/printing';

interface StockStatementsPageProps {
  clients: Client[];
  finishedStock: FinishedGoodsStock[];
  releases: CustomerStockRelease[];
  company?: AppSettingsCompany;
  today: string;
  /** Phase 115 — Brand logos library so the letterhead can pick the right
   *  mark when multiple are uploaded. */
  brandLogos?: BrandLogo[];
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

export function StockStatementsPage({ clients, finishedStock, releases, company, today, brandLogos }: StockStatementsPageProps) {
  // 90 days back is a sensible default reporting window — clients usually
  // ask "what's been happening since last month?", not "what happened in 2019".
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 90);

  const [clientId, setClientId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(defaultFrom.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(today);
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  // Phase 112.2 — async sending state for the "Email to client" button so we
  // can disable it + show a spinner while the email is in flight.
  const [sending, setSending] = useState(false);

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

  /**
   * Phase 112.1 — Branded Stock Statement HTML.
   *
   * Built as a function (not a template literal mash-up) so the same string
   * can power both the popup print window and the outbound email body.
   * Brand: cream paper (#faf4e8), kraft-bag brown text (#5d3a1f), JomoPak
   * orange (#db5a1f) only as accent. The brand mark on the letterhead is
   * the dark-square-with-orange-J + orange-dot lockup from the website nav.
   *
   * Inline styles only — Outlook/Gmail strip <style> blocks otherwise, so we
   * accept the verbosity in exchange for an email that renders the same as
   * the print preview.
   */
  function buildStatementHtml(): string {
    if (!selectedClient) return '';
    const ink = '#5d3a1f';           // primary kraft-bag brown
    const inkSoft = '#8a6440';       // muted body copy
    const inkFaint = '#ad8d6a';      // hint text
    const orange = '#db5a1f';        // accent
    const orangeSoft = '#fbe6d5';
    const paper = '#faf4e8';         // cream paper
    const paperWarm = '#efe5d2';     // band/totals
    const line = '#e5ddcf';
    const lineSoft = '#ede6d8';

    const summaryRows = (summary.length ? summary.map((l, i) => `
      <tr style="background:${i % 2 ? paper : '#ffffff'}">
        <td style="padding:7px 10px;border-bottom:1px solid ${line};color:${ink};font-weight:500;">${esc(l.productName)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${line};color:${inkSoft};">${esc(l.unit || '—')}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${line};color:${ink};text-align:right;">${formatNumber(l.opening, 0)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${line};color:${ink};text-align:right;">+${formatNumber(l.received, 0)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${line};color:${ink};text-align:right;">-${formatNumber(l.released, 0)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${line};color:${orange};font-weight:500;text-align:right;">${formatNumber(l.closing, 0)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${line};color:${inkFaint};text-align:right;">${formatNumber(l.reserved, 0)}</td>
      </tr>`).join('')
      : `<tr><td colspan="7" style="padding:14px;text-align:center;color:${inkSoft};font-style:italic;">No stock held for this client in this period.</td></tr>`);

    const detailRows = (detail.length ? detail.map((t, i) => `
      <tr style="background:${i % 2 ? paper : '#ffffff'}">
        <td style="padding:6px 9px;border-bottom:1px solid ${lineSoft};color:${ink};">${formatDate(t.date)}</td>
        <td style="padding:6px 9px;border-bottom:1px solid ${lineSoft};">
          <span style="background:${t.type === 'Release' ? orange : ink};color:${paper};padding:2px 7px;border-radius:3px;font-size:9.5px;font-weight:500;font-family:'Courier New',monospace;letter-spacing:0.5px;">${t.type.toUpperCase()}</span>
        </td>
        <td style="padding:6px 9px;border-bottom:1px solid ${lineSoft};color:${ink};">${esc(t.productName)}</td>
        <td style="padding:6px 9px;border-bottom:1px solid ${lineSoft};color:${inkSoft};">${esc(t.stockNumber)}</td>
        <td style="padding:6px 9px;border-bottom:1px solid ${lineSoft};color:${inkSoft};">${esc(t.jobNumber)}</td>
        <td style="padding:6px 9px;border-bottom:1px solid ${lineSoft};color:${t.type === 'Release' ? orange : ink};font-weight:500;text-align:right;">${t.type === 'Release' ? '-' : '+'}${formatNumber(t.quantity, 0)}</td>
        <td style="padding:6px 9px;border-bottom:1px solid ${lineSoft};color:${inkSoft};">${esc(t.reference)}</td>
      </tr>`).join('')
      : `<tr><td colspan="7" style="padding:14px;text-align:center;color:${inkSoft};font-style:italic;">No movements in this period.</td></tr>`);

    const companyName = company?.name || 'JomoPak';
    const companyLegal = company?.legalName || '';
    const companyAddr = `${company?.addressLine1 || ''}${company?.addressLine2 ? ', ' + company.addressLine2 : ''}`;
    const companyPhone = company?.phone || '';
    const companyEmail = company?.email || '';
    const companyVat = company?.vatNumber || '';
    const today2 = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
    const statementNo = `SS-${toDate.replace(/-/g, '').slice(0, 6)}-${Math.abs(hashCode(selectedClient.id)).toString().slice(0, 3).padStart(3, '0')}`;

    return `<!doctype html><html><head><meta charset="utf-8"><title>Stock statement — ${esc(selectedClient.name)}</title>
<style>@media print { body { background: ${paper} !important; } .page { box-shadow: none !important; } }</style></head>
<body style="margin:0;background:${paper};font-family:Georgia,'Times New Roman',serif;color:${ink};">
  <div class="page" style="max-width:780px;margin:0 auto;background:${paper};padding:48px 44px;">

    <!-- Letterhead — Phase 114/115: shared helper picks the right logo from the brand library. -->
    ${buildLetterhead(company, {
      rightTitle: 'Stock Statement',
      rightSubtitle: `No. ${statementNo}`,
      logoHeightPx: 90,
      showDivider: true,
      documentKind: 'stockStatement',
      brandLogos,
      // Phase 116 — honour this client's preferred logo (FSC mark, etc).
      clientPreferredLogoId: selectedClient.preferredLogoId,
    })}

    <!-- Period band -->
    <div style="background:${paperWarm};border-radius:6px;padding:10px 14px;margin-bottom:22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${ink};">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td><span style="color:${inkSoft};">Period:</span> <strong>${esc(fromDate)} &rarr; ${esc(toDate)}</strong></td>
        <td style="text-align:right;"><span style="color:${inkSoft};">Generated:</span> <strong>${esc(today2)}</strong></td>
      </tr></table>
    </div>

    <!-- Address blocks. Phase 114: From block delegates to buildCompanyBlock(). -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:26px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;">
      <tr>
        <td style="width:50%;vertical-align:top;border-left:3px solid ${ink};padding:0 0 0 12px;">
          <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:500;color:${ink};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">From</div>
          <div style="font-weight:500;color:${ink};font-size:13px;">${esc(companyName)}</div>
          ${buildCompanyBlock(company)}
        </td>
        <td style="width:50%;vertical-align:top;border-left:3px solid ${orange};padding:0 0 0 12px;">
          <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:500;color:${orange};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Statement of stock for</div>
          <div style="font-weight:500;color:${ink};font-size:13px;">${esc(selectedClient.name)}</div>
          ${selectedClient.contactName ? `<div style="color:${inkSoft};">Attn: ${esc(selectedClient.contactName)}</div>` : ''}
          ${selectedClient.contactEmail ? `<div style="color:${inkSoft};">${esc(selectedClient.contactEmail)}</div>` : ''}
          ${selectedClient.phoneNumber ? `<div style="color:${inkSoft};">${esc(selectedClient.phoneNumber)}</div>` : ''}
          <div style="color:${inkFaint};font-size:10.5px;margin-top:4px;">Account: ${esc(selectedClient.id.slice(0, 8))}</div>
        </td>
      </tr>
    </table>

    <!-- Summary tiles -->
    <table style="width:100%;border-collapse:separate;border-spacing:6px;margin-bottom:18px;font-family:'Helvetica Neue',Arial,sans-serif;">
      <tr>
        ${tile('Opening', formatNumber(totals.opening, 0), '#ffffff', ink, inkSoft)}
        ${tile('Received', '+' + formatNumber(totals.received, 0), '#ffffff', ink, inkSoft)}
        ${tile('Released', '-' + formatNumber(totals.released, 0), '#ffffff', ink, inkSoft)}
        ${tile('On hand', formatNumber(totals.closing, 0), orange, paper, orangeSoft)}
      </tr>
    </table>

    <!-- Stock by product -->
    <div style="font-family:'Courier New',monospace;font-size:11px;font-weight:500;color:${ink};margin:14px 0 10px;text-transform:uppercase;letter-spacing:2px;">Stock by product</div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:26px;font-family:'Helvetica Neue',Arial,sans-serif;">
      <thead><tr style="background:${ink};color:${paper};">
        <th style="text-align:left;padding:9px 10px;font-weight:500;">Product</th>
        <th style="text-align:left;padding:9px 10px;font-weight:500;">Unit</th>
        <th style="text-align:right;padding:9px 10px;font-weight:500;">Opening</th>
        <th style="text-align:right;padding:9px 10px;font-weight:500;">Received</th>
        <th style="text-align:right;padding:9px 10px;font-weight:500;">Released</th>
        <th style="text-align:right;padding:9px 10px;font-weight:500;color:#f4b98f;">On hand</th>
        <th style="text-align:right;padding:9px 10px;font-weight:500;color:${inkFaint};">Reserved</th>
      </tr></thead>
      <tbody>${summaryRows}</tbody>
      <tfoot><tr style="background:${paperWarm};">
        <td colspan="2" style="padding:10px;font-weight:500;color:${ink};border-top:2px solid ${ink};">Totals</td>
        <td style="text-align:right;padding:10px;font-weight:500;color:${ink};border-top:2px solid ${ink};">${formatNumber(totals.opening, 0)}</td>
        <td style="text-align:right;padding:10px;font-weight:500;color:${ink};border-top:2px solid ${ink};">+${formatNumber(totals.received, 0)}</td>
        <td style="text-align:right;padding:10px;font-weight:500;color:${ink};border-top:2px solid ${ink};">-${formatNumber(totals.released, 0)}</td>
        <td style="text-align:right;padding:10px;font-weight:500;color:${orange};font-size:13px;border-top:2px solid ${ink};">${formatNumber(totals.closing, 0)}</td>
        <td style="text-align:right;padding:10px;color:${inkSoft};border-top:2px solid ${ink};">${formatNumber(totals.reserved, 0)}</td>
      </tr></tfoot>
    </table>

    <!-- Movements -->
    <div style="font-family:'Courier New',monospace;font-size:11px;font-weight:500;color:${ink};margin:14px 0 10px;text-transform:uppercase;letter-spacing:2px;">Movements in this period</div>
    <table style="width:100%;border-collapse:collapse;font-size:10.5px;font-family:'Helvetica Neue',Arial,sans-serif;">
      <thead><tr style="background:${ink};color:${paper};">
        <th style="text-align:left;padding:7px 9px;font-weight:500;">Date</th>
        <th style="text-align:left;padding:7px 9px;font-weight:500;">Type</th>
        <th style="text-align:left;padding:7px 9px;font-weight:500;">Product</th>
        <th style="text-align:left;padding:7px 9px;font-weight:500;">Stock #</th>
        <th style="text-align:left;padding:7px 9px;font-weight:500;">Job #</th>
        <th style="text-align:right;padding:7px 9px;font-weight:500;">Quantity</th>
        <th style="text-align:left;padding:7px 9px;font-weight:500;">Reference</th>
      </tr></thead>
      <tbody>${detailRows}</tbody>
    </table>

    <!-- Discrepancy clause -->
    <div style="margin-top:32px;padding:14px 16px;background:${paperWarm};border-radius:6px;border-left:3px solid ${orange};font-size:10.5px;color:${ink};line-height:1.6;font-family:'Helvetica Neue',Arial,sans-serif;">
      This statement reflects stock physically held on your behalf at ${esc(companyName)}. <em>Reserved</em> quantities are allocated to open orders and not yet released. Please notify us within 7 days of any discrepancies.
    </div>

    <!-- Footer -->
    <div style="margin-top:28px;padding-top:14px;border-top:1px solid ${line};font-size:10px;color:${inkFaint};font-family:'Helvetica Neue',Arial,sans-serif;">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td><span style="display:inline-block;width:6px;height:6px;background:${orange};border-radius:50%;vertical-align:middle;margin-right:6px;"></span>jomopak.co.za &middot; paper bags, made with purpose</td>
        <td style="text-align:right;">Page 1 of 1</td>
      </tr></table>
    </div>

  </div>
</body></html>`;
  }

  function printStatement() {
    if (!selectedClient) return;
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return;
    w.document.write(buildStatementHtml());
    w.document.close();
    setTimeout(() => w.print(), 250);
  }

  /**
   * Phase 112.2 — QuickBooks-style "Send to client".
   *
   * Routes the same branded HTML through the existing sendEmails() pipe
   * (currently a noop stub in dev, Resend in prod). The recipient is the
   * client's primary contact email; if it's missing we toast a guidance
   * message rather than failing silently.
   */
  async function emailStatement() {
    if (!selectedClient) return;
    const to = selectedClient.contactEmail || '';
    if (!to) {
      toast.error('No email on file for this client — add one on the Client profile first.');
      return;
    }
    const html = buildStatementHtml();
    const subject = `Stock statement — ${selectedClient.name} · ${fromDate} to ${toDate}`;
    const email: OutgoingEmail = { to, subject, html };
    setSending(true);
    try {
      const res = await sendEmails([email]);
      if (res.error) {
        toast.error(`Email failed: ${res.error}`);
      } else if (res.sent === 0) {
        toast.error('Email could not be sent. Check the connector setup in Settings.');
      } else {
        toast.success(`Stock statement sent to ${to}.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Email failed: ${message}`);
    } finally {
      setSending(false);
    }
  }

  /**
   * Phase 112.1 helpers — `esc` HTML-escapes user-controlled strings so a
   * product name with `<` or `&` in it doesn't break the layout (or worse,
   * inject markup into the client's inbox). `tile` renders one summary
   * card; `hashCode` is the cheap deterministic generator for the
   * SS-YYYYMM-NNN statement number so repeated runs against the same
   * client + period reproduce the same number.
   */
  function esc(value: string | number | null | undefined): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function tile(label: string, value: string, bg: string, valueColor: string, labelColor: string): string {
    return `<td style="width:25%;background:${bg};border:1px solid #e5ddcf;border-radius:6px;padding:10px 12px;">
      <div style="font-family:'Courier New',monospace;font-size:9px;color:${labelColor};text-transform:uppercase;letter-spacing:1px;">${label}</div>
      <div style="font-size:18px;font-weight:500;color:${valueColor};margin-top:4px;">${value}</div>
    </td>`;
  }
  function hashCode(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  return (
    <section className="card">
      <SectionTitle
        title="Stock Statements"
        subtitle={selectedClient ? `${selectedClient.name} · ${fromDate} ${toDate}` : 'Pick a stock-holding client and a date range'}
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ghost-button" onClick={exportCsv} disabled={!selectedClient}>Export CSV</button>
            <button
              className="ghost-button"
              onClick={emailStatement}
              disabled={!selectedClient || sending || !selectedClient?.contactEmail}
              title={!selectedClient?.contactEmail ? 'No email on file for this client' : `Email statement to ${selectedClient?.contactEmail}`}
            >
              {sending ? 'Sending…' : 'Email to client'}
            </button>
            <button className="secondary-button" onClick={printStatement} disabled={!selectedClient}>Print / PDF</button>
          </div>
        }
      />

      <div className="filters-grid">
        <label><span>Client</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— pick client —</option>
            {stockHoldingClients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.stockHoldingEnabled ? ' ' : ''}</option>
            ))}
          </select>
        </label>
        <label><span>From</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
        <label><span>To</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
      </div>

      {!selectedClient ? (
        <EmptyState title="Pick a client" body="Choose a client above to see their stock statement. Clients marked are stock-holding accounts." />
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
