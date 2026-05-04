import {
  DeliveryNote,
  DispatchRecord,
  Invoice,
  InvoiceLineItem,
} from '../types';

/**
 * Stock-holding helpers.
 *
 * Background: when a customer is on a stock-holding agreement they pay for the
 * full order up front but draw stock down from the warehouse over time. The UI
 * needs to show, per invoice and per client:
 *
 *   - how much was invoiced (paid for) in total
 *   - how much has physically left the warehouse
 *   - how much is still being held for the customer
 *   - based on recent draw rate, how long that remaining stock should last and
 *     whether it'll outlast the storage agreement window
 *
 * These helpers operate on already-loaded AppData slices — they don't fetch.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

export interface InvoiceLineFulfilment {
  lineItemId: string;
  productName: string;
  quantityInvoiced: number;
  quantityDelivered: number;
  quantityRemaining: number;
}

export interface InvoiceStockHoldingSummary {
  invoiceId: string;
  invoiceNumber: string;
  totalInvoicedQuantity: number;
  totalDeliveredQuantity: number;
  totalRemainingQuantity: number;
  fulfilmentByLine: InvoiceLineFulfilment[];
  /** Days since stockHoldingStartDate. */
  ageInDays: number;
  /** stockHoldingMaxDays - ageInDays, clamped to 0. 0 if no max set. */
  daysUntilStorageExpiry: number;
  /** Average units shipped per week over the last 8 weeks. */
  weeklyAverageReleased: number;
  /** Average units shipped per month over the last 3 months. */
  monthlyAverageReleased: number;
  /** Estimate of days until current remaining hits zero at the recent draw rate. */
  estimatedDaysOfStockLeft: number | null;
  /** True when the storage window will lapse before stock runs out. */
  willExpireBeforeDrawn: boolean;
}

/**
 * Sum delivered quantities from delivery notes that reference an invoice line
 * (via lineItem.invoiceLineItemId) or, fallback, that link to the invoice id
 * via DeliveryNote.parentInvoiceId.
 */
export function getInvoiceLineDeliveredQuantity(
  line: InvoiceLineItem,
  invoiceId: string,
  deliveryNotes: DeliveryNote[],
): number {
  let delivered = 0;
  for (const note of deliveryNotes) {
    if (note.parentInvoiceId !== invoiceId) continue;
    for (const item of note.lineItems) {
      if (item.invoiceLineItemId === line.id) {
        delivered += Number(item.quantity || 0);
      }
    }
  }
  return delivered;
}

function getWeeklyAverageReleased(
  invoiceId: string,
  deliveryNotes: DeliveryNote[],
  weeks = 8,
): number {
  const cutoff = Date.now() - weeks * 7 * DAY_MS;
  let total = 0;
  for (const note of deliveryNotes) {
    if (note.parentInvoiceId !== invoiceId) continue;
    const noteTime = note.noteDate ? new Date(note.noteDate).getTime() : 0;
    if (!noteTime || noteTime < cutoff) continue;
    for (const item of note.lineItems) {
      total += Number(item.quantity || 0);
    }
  }
  return total / weeks;
}

function getMonthlyAverageReleased(
  invoiceId: string,
  deliveryNotes: DeliveryNote[],
  months = 3,
): number {
  const cutoff = Date.now() - months * 30 * DAY_MS;
  let total = 0;
  for (const note of deliveryNotes) {
    if (note.parentInvoiceId !== invoiceId) continue;
    const noteTime = note.noteDate ? new Date(note.noteDate).getTime() : 0;
    if (!noteTime || noteTime < cutoff) continue;
    for (const item of note.lineItems) {
      total += Number(item.quantity || 0);
    }
  }
  return total / months;
}

export function summariseInvoiceStockHolding(
  invoice: Invoice,
  deliveryNotes: DeliveryNote[],
): InvoiceStockHoldingSummary {
  const fulfilmentByLine: InvoiceLineFulfilment[] = invoice.lineItems.map((line) => {
    const delivered = getInvoiceLineDeliveredQuantity(line, invoice.id, deliveryNotes);
    return {
      lineItemId: line.id,
      productName: line.productName,
      quantityInvoiced: Number(line.quantity || 0),
      quantityDelivered: delivered,
      quantityRemaining: Math.max(0, Number(line.quantity || 0) - delivered),
    };
  });

  const totalInvoicedQuantity = fulfilmentByLine.reduce((acc, f) => acc + f.quantityInvoiced, 0);
  const totalDeliveredQuantity = fulfilmentByLine.reduce((acc, f) => acc + f.quantityDelivered, 0);
  const totalRemainingQuantity = Math.max(0, totalInvoicedQuantity - totalDeliveredQuantity);

  const startTime = invoice.stockHoldingStartDate ? new Date(invoice.stockHoldingStartDate).getTime() : 0;
  const ageInDays = startTime ? Math.max(0, Math.floor((Date.now() - startTime) / DAY_MS)) : 0;
  const daysUntilStorageExpiry =
    invoice.stockHoldingMaxDays > 0 ? Math.max(0, invoice.stockHoldingMaxDays - ageInDays) : 0;

  const weeklyAverageReleased = getWeeklyAverageReleased(invoice.id, deliveryNotes);
  const monthlyAverageReleased = getMonthlyAverageReleased(invoice.id, deliveryNotes);

  let estimatedDaysOfStockLeft: number | null = null;
  if (weeklyAverageReleased > 0 && totalRemainingQuantity > 0) {
    const dailyRate = weeklyAverageReleased / 7;
    estimatedDaysOfStockLeft = Math.round(totalRemainingQuantity / dailyRate);
  } else if (totalRemainingQuantity === 0) {
    estimatedDaysOfStockLeft = 0;
  }

  const willExpireBeforeDrawn =
    invoice.stockHoldingMaxDays > 0 &&
    estimatedDaysOfStockLeft !== null &&
    daysUntilStorageExpiry < estimatedDaysOfStockLeft;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalInvoicedQuantity,
    totalDeliveredQuantity,
    totalRemainingQuantity,
    fulfilmentByLine,
    ageInDays,
    daysUntilStorageExpiry,
    weeklyAverageReleased,
    monthlyAverageReleased,
    estimatedDaysOfStockLeft,
    willExpireBeforeDrawn,
  };
}

export interface ClientUsageTrendPoint {
  monthKey: string;
  totalReleased: number;
}

export interface ClientStockHoldingOverview {
  clientId: string;
  totalInvoicedQuantity: number;
  totalDeliveredQuantity: number;
  totalRemainingQuantity: number;
  weeklyAverageReleased: number;
  monthlyAverageReleased: number;
  trend: ClientUsageTrendPoint[];
  invoices: InvoiceStockHoldingSummary[];
}

/**
 * Roll up stock-holding state across every active stock-holding invoice for a
 * client. Trend buckets are last 6 months by month key (YYYY-MM).
 */
export function summariseClientStockHolding(
  clientId: string,
  invoices: Invoice[],
  deliveryNotes: DeliveryNote[],
  dispatchRecords: DispatchRecord[] = [],
): ClientStockHoldingOverview {
  const clientInvoices = invoices.filter(
    (invoice) => invoice.clientId === clientId && invoice.stockHoldingApplies,
  );
  const clientDeliveryNotes = deliveryNotes.filter((note) => note.clientId === clientId);

  const summaries = clientInvoices.map((invoice) =>
    summariseInvoiceStockHolding(invoice, clientDeliveryNotes),
  );

  const totalInvoicedQuantity = summaries.reduce((acc, s) => acc + s.totalInvoicedQuantity, 0);
  const totalDeliveredQuantity = summaries.reduce((acc, s) => acc + s.totalDeliveredQuantity, 0);
  const totalRemainingQuantity = summaries.reduce((acc, s) => acc + s.totalRemainingQuantity, 0);

  // Weekly / monthly averages computed across ALL the client's delivery notes
  // tied to a stock-holding invoice — gives a true draw rate per client.
  const cutoffWeek = Date.now() - 8 * 7 * DAY_MS;
  const cutoffMonth = Date.now() - 3 * 30 * DAY_MS;
  let weekTotal = 0;
  let monthTotal = 0;
  for (const note of clientDeliveryNotes) {
    if (!note.parentInvoiceId) continue;
    const noteTime = note.noteDate ? new Date(note.noteDate).getTime() : 0;
    const itemTotal = note.lineItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
    if (noteTime >= cutoffWeek) weekTotal += itemTotal;
    if (noteTime >= cutoffMonth) monthTotal += itemTotal;
  }
  const weeklyAverageReleased = weekTotal / 8;
  const monthlyAverageReleased = monthTotal / 3;

  // Trend: last 6 months. Includes both stock-holding deliveries and ad-hoc
  // dispatch records (so the client can see their full packaging usage).
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, 0);
  }

  const bucketAdd = (date: string, qty: number) => {
    if (!date) return;
    const key = date.slice(0, 7);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + qty);
    }
  };

  for (const note of clientDeliveryNotes) {
    const itemTotal = note.lineItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
    bucketAdd(note.noteDate, itemTotal);
  }
  for (const dispatch of dispatchRecords) {
    if (dispatch.customerName) {
      // Dispatch records don't carry clientId — best-effort bucket if names
      // match the invoices we're already looking at.
      const matchInvoice = clientInvoices.find(
        (inv) => inv.clientName.toLowerCase() === dispatch.customerName.toLowerCase(),
      );
      if (matchInvoice) {
        bucketAdd(dispatch.dispatchDate, Number(dispatch.quantityDispatched || 0));
      }
    }
  }

  const trend: ClientUsageTrendPoint[] = Array.from(buckets.entries()).map(([monthKey, totalReleased]) => ({
    monthKey,
    totalReleased,
  }));

  return {
    clientId,
    totalInvoicedQuantity,
    totalDeliveredQuantity,
    totalRemainingQuantity,
    weeklyAverageReleased,
    monthlyAverageReleased,
    trend,
    invoices: summaries,
  };
}

/** Format a days-remaining number into a friendly "in 14 days" / "expired 3 days ago" string. */
export function formatDaysFriendly(days: number | null): string {
  if (days === null) return '—';
  if (days <= 0) return 'Stock depleted';
  if (days === 1) return '1 day';
  if (days < 14) return `${days} days`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}
