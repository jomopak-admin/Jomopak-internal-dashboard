/**
 * Multi-currency helpers — Phase 31.
 *
 * Base currency is ZAR. A foreign amount is converted to base by multiplying by
 * its rate-to-base (1 USD = 18.50 ZAR → rateToBase 18.50). Documents store the
 * booking rate they were captured at; reports and revaluation use that, and the
 * config rate is the "current" rate used for new docs + period-end revaluation.
 *
 * `fetchExchangeRates` is a stub with the shape an auto-fetch integration would
 * fill in later (e.g. an FX API). It currently returns the existing rates
 * unchanged so the call site is ready without an external dependency.
 */

import { AppSettingsCurrencyConfig, ExchangeRate, Invoice, JournalEntry, JournalLine, LedgerAccount, SupplierBill } from '../types';

export function getRate(code: string, config: AppSettingsCurrencyConfig): number {
  if (!code || code === config.baseCurrency) return 1;
  const found = config.rates.find((r) => r.code === code);
  return found && found.rateToBase > 0 ? found.rateToBase : 1;
}

/** Convert an amount in `code` to base currency using an explicit rate (booking
 *  rate) when given, otherwise the current config rate. */
export function toBase(amount: number, code: string, config: AppSettingsCurrencyConfig, bookingRate?: number): number {
  const rate = bookingRate && bookingRate > 0 ? bookingRate : getRate(code, config);
  return Math.round((Number(amount) || 0) * rate * 100) / 100;
}

/** Realised FX gain/(loss) when a foreign amount booked at `bookingRate` is
 *  settled at `settlementRate`. Positive = gain. */
export function realisedFx(foreignAmount: number, bookingRate: number, settlementRate: number): number {
  return Math.round((Number(foreignAmount) || 0) * ((Number(settlementRate) || 0) - (Number(bookingRate) || 0)) * 100) / 100;
}

/** Unrealised FX gain/(loss) on an open foreign balance: the difference between
 *  its base value at the booking rate and at the current rate. Positive = gain
 *  for an asset (e.g. AR); the caller decides the sign for liabilities. */
export function unrealisedFx(foreignBalance: number, bookingRate: number, currentRate: number): number {
  return Math.round((Number(foreignBalance) || 0) * ((Number(currentRate) || 0) - (Number(bookingRate) || 0)) * 100) / 100;
}

/**
 * Stub for future auto-fetch. An integration would replace the body with a call
 * to an FX API and return fresh rates + today's date. For now it echoes the
 * current rates so the wiring is in place. Keep the signature stable.
 */
export async function fetchExchangeRates(config: AppSettingsCurrencyConfig): Promise<ExchangeRate[]> {
  // TODO: replace with a real FX API call (e.g. exchangerate.host / openexchangerates).
  // const res = await fetch(`https://api.example.com/latest?base=${config.baseCurrency}`);
  return config.rates;
}

function round2(n: number): number { return Math.round((Number(n) || 0) * 100) / 100; }

export interface RevaluationResult {
  arDelta: number;     // base-currency change in receivables (open foreign invoices)
  apDelta: number;     // base-currency change in payables (open foreign bills)
  netGain: number;     // positive = FX gain to income
  journal: JournalEntry | null;
}

/**
 * Period-end unrealised FX revaluation of OPEN foreign AR (invoices) and AP
 * (bills): the difference between each balance at its booking rate and at the
 * current rate. Produces a single balanced draft journal:
 *   Dr/Cr AR 1100, Dr/Cr AP 2000, balancing to FX Gain/(Loss) 4920.
 */
export function buildRevaluationJournal(
  invoices: Invoice[],
  supplierBills: SupplierBill[],
  config: AppSettingsCurrencyConfig,
  accounts: LedgerAccount[],
  asAt: string,
): RevaluationResult {
  const base = config.baseCurrency;
  let arDelta = 0;
  for (const inv of invoices) {
    if (!inv.currency || inv.currency === base) continue;
    if (inv.status === 'Cancelled' || inv.status === 'Draft') continue;
    const outstanding = Number(inv.amountOutstanding) || 0;
    if (outstanding <= 0) continue;
    const booking = Number(inv.exchangeRate) || 1;
    const current = getRate(inv.currency, config);
    arDelta += outstanding * (current - booking);
  }
  let apDelta = 0;
  for (const b of supplierBills) {
    if (!b.currency || b.currency === base) continue;
    if (b.status === 'Cancelled') continue;
    const outstanding = Number(b.amountOutstanding) || 0;
    if (outstanding <= 0) continue;
    const booking = Number(b.exchangeRate) || 1;
    const current = getRate(b.currency, config);
    apDelta += outstanding * (current - booking);
  }
  arDelta = round2(arDelta);
  apDelta = round2(apDelta);
  const netGain = round2(arDelta - apDelta);

  if (arDelta === 0 && apDelta === 0) return { arDelta, apDelta, netGain, journal: null };

  const ar = accounts.find((a) => a.code === '1100');
  const ap = accounts.find((a) => a.code === '2000');
  const fx = accounts.find((a) => a.code === '4920');
  if (!ar || !ap || !fx) return { arDelta, apDelta, netGain, journal: null };

  const stamp = Date.now();
  const lines: JournalLine[] = [];
  if (arDelta !== 0) {
    lines.push({ id: `jl-rev-${stamp}-ar`, accountId: ar.id, accountCode: ar.code, accountName: ar.name, description: 'AR FX revaluation', debit: arDelta > 0 ? arDelta : 0, credit: arDelta < 0 ? -arDelta : 0 });
  }
  if (apDelta !== 0) {
    // apDelta > 0 means liability grew → credit AP.
    lines.push({ id: `jl-rev-${stamp}-ap`, accountId: ap.id, accountCode: ap.code, accountName: ap.name, description: 'AP FX revaluation', debit: apDelta < 0 ? -apDelta : 0, credit: apDelta > 0 ? apDelta : 0 });
  }
  const sumDebit = lines.reduce((s, l) => s + l.debit, 0);
  const sumCredit = lines.reduce((s, l) => s + l.credit, 0);
  const diff = round2(sumDebit - sumCredit);
  lines.push({ id: `jl-rev-${stamp}-fx`, accountId: fx.id, accountCode: fx.code, accountName: fx.name, description: diff > 0 ? 'Unrealised FX gain' : 'Unrealised FX loss', debit: diff < 0 ? -diff : 0, credit: diff > 0 ? diff : 0 });

  const journal: JournalEntry = {
    id: '', entryNumber: '', date: asAt, reference: 'FX-REVAL', status: 'Draft', source: 'auto:fx-revaluation',
    description: `Unrealised FX revaluation to ${asAt}`,
    lines, createdAt: new Date().toISOString(), notes: '',
  };
  return { arDelta, apDelta, netGain, journal };
}

export interface RealisedFxResult {
  arDelta: number;
  apDelta: number;
  netGain: number;
  journal: JournalEntry | null;
  /** Payments to mark fxPosted: { docId, paymentId, kind }. */
  postedPayments: { docId: string; paymentId: string; kind: 'invoice' | 'bill' }[];
}

/**
 * Realised FX on the PAID portion of foreign documents. For each not-yet-posted
 * foreign payment, realised FX = amount × (settlement rate − booking rate),
 * where the settlement rate is the payment's stored rate, or the current rate
 * as a proxy. Complementary to revaluation (which covers the open balance), so
 * the two never double-count. Returns a balanced draft journal + the payments
 * to flag as posted.
 */
export function buildRealisedFxJournal(
  invoices: Invoice[],
  supplierBills: SupplierBill[],
  config: AppSettingsCurrencyConfig,
  accounts: LedgerAccount[],
  asAt: string,
): RealisedFxResult {
  const base = config.baseCurrency;
  const postedPayments: { docId: string; paymentId: string; kind: 'invoice' | 'bill' }[] = [];
  let arDelta = 0;
  for (const inv of invoices) {
    if (!inv.currency || inv.currency === base) continue;
    if (inv.status === 'Cancelled') continue;
    const booking = Number(inv.exchangeRate) || 1;
    for (const p of inv.payments || []) {
      if (p.fxPosted) continue;
      const amt = Number(p.amount) || 0;
      if (amt <= 0) continue;
      const settlement = Number(p.exchangeRate) || getRate(inv.currency, config);
      arDelta += amt * (settlement - booking);
      postedPayments.push({ docId: inv.id, paymentId: p.id, kind: 'invoice' });
    }
  }
  let apDelta = 0;
  for (const b of supplierBills) {
    if (!b.currency || b.currency === base) continue;
    if (b.status === 'Cancelled') continue;
    const booking = Number(b.exchangeRate) || 1;
    for (const p of b.payments || []) {
      if (p.fxPosted) continue;
      const amt = Number(p.amount) || 0;
      if (amt <= 0) continue;
      const settlement = Number(p.exchangeRate) || getRate(b.currency, config);
      apDelta += amt * (settlement - booking);
      postedPayments.push({ docId: b.id, paymentId: p.id, kind: 'bill' });
    }
  }
  arDelta = round2(arDelta);
  apDelta = round2(apDelta);
  const netGain = round2(arDelta - apDelta);
  if (arDelta === 0 && apDelta === 0) return { arDelta, apDelta, netGain, journal: null, postedPayments };

  const ar = accounts.find((a) => a.code === '1100');
  const ap = accounts.find((a) => a.code === '2000');
  const fx = accounts.find((a) => a.code === '4920');
  if (!ar || !ap || !fx) return { arDelta, apDelta, netGain, journal: null, postedPayments };

  const stamp = Date.now();
  const lines: JournalLine[] = [];
  if (arDelta !== 0) {
    lines.push({ id: `jl-rfx-${stamp}-ar`, accountId: ar.id, accountCode: ar.code, accountName: ar.name, description: 'AR realised FX', debit: arDelta > 0 ? arDelta : 0, credit: arDelta < 0 ? -arDelta : 0 });
  }
  if (apDelta !== 0) {
    lines.push({ id: `jl-rfx-${stamp}-ap`, accountId: ap.id, accountCode: ap.code, accountName: ap.name, description: 'AP realised FX', debit: apDelta < 0 ? -apDelta : 0, credit: apDelta > 0 ? apDelta : 0 });
  }
  const diff = round2(lines.reduce((s, l) => s + l.debit, 0) - lines.reduce((s, l) => s + l.credit, 0));
  lines.push({ id: `jl-rfx-${stamp}-fx`, accountId: fx.id, accountCode: fx.code, accountName: fx.name, description: diff > 0 ? 'Realised FX gain' : 'Realised FX loss', debit: diff < 0 ? -diff : 0, credit: diff > 0 ? diff : 0 });

  const journal: JournalEntry = {
    id: '', entryNumber: '', date: asAt, reference: 'FX-REALISED', status: 'Draft', source: 'auto:fx-realised',
    description: `Realised FX on foreign settlements to ${asAt}`,
    lines, createdAt: new Date().toISOString(), notes: '',
  };
  return { arDelta, apDelta, netGain, journal, postedPayments };
}
