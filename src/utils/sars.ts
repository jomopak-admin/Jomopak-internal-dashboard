/**
 * SARS Centre helpers — Phase 25.
 *
 * Pure, side-effect-free helpers that (a) generate the recurring SARS deadline
 * calendar from a small config, and (b) compute VAT figures from the accounting
 * data already in the app. No network, no tax-rate guesswork beyond the standard
 * 15% VAT arithmetic that's already stored on invoices and supplier bills.
 *
 * Important: this is an ORGANIZER. It surfaces what's due and pre-fills figures
 * the user can override — it does not file returns or calculate income tax.
 */

import {
  AppSettingsSarsConfig,
  Invoice,
  SarsObligationType,
  SupplierBill,
} from '../types';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SarsCalendarSlot {
  obligationType: SarsObligationType;
  /** Stable key, also used to match a saved SarsFiling. */
  periodKey: string;
  periodLabel: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
}

function pad(n: number): string { return String(n).padStart(2, '0'); }
function iso(year: number, month1: number, day: number): string { return `${year}-${pad(month1)}-${pad(day)}`; }

/** Last calendar day of a 1-based month. */
function lastDayOfMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

/** Roll a date back to the previous business day if it lands on a weekend. */
function rollBackToBusinessDay(year: number, month1: number, day: number): string {
  const d = new Date(Date.UTC(year, month1 - 1, day));
  const dow = d.getUTCDay(); // 0 Sun … 6 Sat
  if (dow === 6) d.setUTCDate(d.getUTCDate() - 1);
  else if (dow === 0) d.setUTCDate(d.getUTCDate() - 2);
  return d.toISOString().slice(0, 10);
}

function lastBusinessDayOfMonth(year: number, month1: number): string {
  return rollBackToBusinessDay(year, month1, lastDayOfMonth(year, month1));
}

/** The month/year immediately after a given 1-based month. */
function nextMonth(year: number, month1: number): { y: number; m: number } {
  return month1 === 12 ? { y: year + 1, m: 1 } : { y: year, m: month1 + 1 };
}
function prevMonth(year: number, month1: number): { y: number; m: number } {
  return month1 === 1 ? { y: year - 1, m: 12 } : { y: year, m: month1 - 1 };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

/**
 * Build the recurring SARS deadline calendar for a window around `today`.
 * Returns slots whose due date sits within roughly the last 3 months and the
 * next ~14 months, sorted by due date.
 */
export function buildSarsCalendar(config: AppSettingsSarsConfig, today: string): SarsCalendarSlot[] {
  const slots: SarsCalendarSlot[] = [];
  const now = today || new Date().toISOString().slice(0, 10);
  const nowYear = Number(now.slice(0, 4));
  const years = [nowYear - 1, nowYear, nowYear + 1];

  // ── VAT201 ────────────────────────────────────────────────────────────
  if (config.vatRegistered) {
    if (config.vatFrequency === 'monthly') {
      years.forEach((y) => {
        for (let m = 1; m <= 12; m++) {
          const due = lastBusinessDayOfMonth(nextMonth(y, m).y, nextMonth(y, m).m);
          slots.push({
            obligationType: 'VAT201',
            periodKey: `VAT201-${y}-${pad(m)}`,
            periodLabel: `VAT ${MONTH_ABBR[m - 1]} ${y}`,
            periodStart: iso(y, m, 1),
            periodEnd: iso(y, m, lastDayOfMonth(y, m)),
            dueDate: due,
          });
        }
      });
    } else {
      // Bi-monthly. Category A periods end in odd months, B in even months.
      const endMonths = config.vatCategory === 'B' ? [2, 4, 6, 8, 10, 12] : [1, 3, 5, 7, 9, 11];
      years.forEach((y) => {
        endMonths.forEach((endM) => {
          const start = prevMonth(y, endM);
          const next = nextMonth(y, endM);
          slots.push({
            obligationType: 'VAT201',
            periodKey: `VAT201-${y}-${pad(endM)}`,
            periodLabel: `VAT ${MONTH_ABBR[start.m - 1]}–${MONTH_ABBR[endM - 1]} ${y}`,
            periodStart: iso(start.y, start.m, 1),
            periodEnd: iso(y, endM, lastDayOfMonth(y, endM)),
            dueDate: lastBusinessDayOfMonth(next.y, next.m),
          });
        });
      });
    }
  }

  // ── EMP201 (monthly PAYE/UIF/SDL), due 7th of the following month ───────
  if (config.payrollActive) {
    years.forEach((y) => {
      for (let m = 1; m <= 12; m++) {
        const nm = nextMonth(y, m);
        slots.push({
          obligationType: 'EMP201',
          periodKey: `EMP201-${y}-${pad(m)}`,
          periodLabel: `PAYE ${MONTH_ABBR[m - 1]} ${y}`,
          periodStart: iso(y, m, 1),
          periodEnd: iso(y, m, lastDayOfMonth(y, m)),
          dueDate: rollBackToBusinessDay(nm.y, nm.m, 7),
        });
      }
    });

    // ── EMP501 employer reconciliation (tax year always Mar–Feb) ──────────
    // Interim covers Mar–Aug (due ~31 Oct); annual covers Mar–Feb (due ~31 May).
    years.forEach((endY) => {
      slots.push({
        obligationType: 'EMP501',
        periodKey: `EMP501-${endY}-interim`,
        periodLabel: `Interim Recon (Mar–Aug ${endY - 1})`,
        periodStart: iso(endY - 1, 3, 1),
        periodEnd: iso(endY - 1, 8, lastDayOfMonth(endY - 1, 8)),
        dueDate: lastBusinessDayOfMonth(endY - 1, 10),
      });
      slots.push({
        obligationType: 'EMP501',
        periodKey: `EMP501-${endY}-annual`,
        periodLabel: `Annual Recon (Mar ${endY - 1}–Feb ${endY})`,
        periodStart: iso(endY - 1, 3, 1),
        periodEnd: iso(endY, 2, lastDayOfMonth(endY, 2)),
        dueDate: lastBusinessDayOfMonth(endY, 5),
      });
    });
  }

  // ── IRP6 provisional tax + ITR14 (driven by company financial year-end) ─
  const fyEnd = Math.min(12, Math.max(1, config.financialYearEndMonth || 2));
  years.forEach((Y) => {
    // Year of assessment ends last day of fyEnd month in year Y.
    const start = nextMonth(Y, fyEnd); // first month of the YoA is the month after FY end…
    // …but that lands in the wrong year: FY ending Feb Y starts Mar (Y-1).
    const startYear = fyEnd === 12 ? Y : Y - 1;
    const yoaLabel = `${Y}`;
    const periodStart = iso(startYear, start.m, 1);
    const periodEnd = iso(Y, fyEnd, lastDayOfMonth(Y, fyEnd));

    // 1st provisional: end of the 6th month of the YoA.
    let p1m = start.m + 5;
    let p1y = startYear;
    if (p1m > 12) { p1m -= 12; p1y += 1; }
    slots.push({
      obligationType: 'IRP6',
      periodKey: `IRP6-${Y}-1`,
      periodLabel: `Provisional 1 (YoA ${yoaLabel})`,
      periodStart,
      periodEnd: iso(p1y, p1m, lastDayOfMonth(p1y, p1m)),
      dueDate: lastBusinessDayOfMonth(p1y, p1m),
    });
    // 2nd provisional: end of the YoA.
    slots.push({
      obligationType: 'IRP6',
      periodKey: `IRP6-${Y}-2`,
      periodLabel: `Provisional 2 (YoA ${yoaLabel})`,
      periodStart,
      periodEnd,
      dueDate: lastBusinessDayOfMonth(Y, fyEnd),
    });
    // ITR14 company income tax — due ~12 months after FY end.
    slots.push({
      obligationType: 'ITR14',
      periodKey: `ITR14-${Y}`,
      periodLabel: `Income Tax Return (YoA ${yoaLabel})`,
      periodStart,
      periodEnd,
      dueDate: lastBusinessDayOfMonth(Y + 1, fyEnd),
    });
  });

  // Window: keep recent + upcoming, drop ancient/far-future noise.
  const lower = addDays(now, -100);
  const upper = addDays(now, 430);
  return slots
    .filter((s) => s.dueDate >= lower && s.dueDate <= upper)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface VatPeriodResult {
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  standardRatedSalesExclVat: number;
  purchasesExclVat: number;
}

/**
 * Compute VAT figures for a period straight from the accounting data.
 *  - Output VAT: VAT on issued (non-draft, non-cancelled) ZAR invoices dated in the period.
 *  - Input VAT: VAT on (non-cancelled) ZAR supplier bills dated in the period.
 * Foreign-currency docs are excluded (export sales are zero-rated; import VAT is
 * handled separately at customs).
 */
export function computeVatForPeriod(
  invoices: Invoice[],
  supplierBills: SupplierBill[],
  periodStart: string,
  periodEnd: string,
): VatPeriodResult {
  const inRange = (d: string) => !!d && d >= periodStart && d <= periodEnd;

  let outputVat = 0;
  let standardRatedSalesExclVat = 0;
  invoices.forEach((inv) => {
    if (!inRange(inv.invoiceDate)) return;
    if (inv.status === 'Draft' || inv.status === 'Cancelled') return;
    if (inv.currency && inv.currency !== 'ZAR') return;
    outputVat += Number(inv.vatTotal) || 0;
    standardRatedSalesExclVat += Number(inv.subtotalExclVat) || 0;
  });

  let inputVat = 0;
  let purchasesExclVat = 0;
  supplierBills.forEach((bill) => {
    if (!inRange(bill.billDate)) return;
    if (bill.status === 'Cancelled') return;
    if (bill.currency && bill.currency !== 'ZAR') return;
    inputVat += Number(bill.vatAmount) || 0;
    purchasesExclVat += Number(bill.subtotalExclVat) || 0;
  });

  return {
    outputVat: round2(outputVat),
    inputVat: round2(inputVat),
    netVatPayable: round2(outputVat - inputVat),
    standardRatedSalesExclVat: round2(standardRatedSalesExclVat),
    purchasesExclVat: round2(purchasesExclVat),
  };
}

/** Days from `today` until `dueDate` (negative = overdue). */
export function daysUntil(dueDate: string, today: string): number {
  if (!dueDate) return 0;
  const a = new Date(`${today}T00:00:00.000Z`).getTime();
  const b = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
