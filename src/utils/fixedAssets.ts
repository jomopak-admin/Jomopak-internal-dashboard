/**
 * Fixed-asset depreciation helpers — Phase 29.
 *
 * Straight-line only: annual charge = (cost − residual) / useful life (years).
 * Accumulated depreciation and book value are derived "as at" a date; a
 * depreciation run produces a single balanced GL journal for the period.
 */

import { FixedAsset, JournalEntry, JournalLine, LedgerAccount } from '../types';

function round2(n: number): number { return Math.round((Number(n) || 0) * 100) / 100; }

/** Whole months between two ISO dates (clamped at 0). */
function monthsBetween(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return 0;
  const a = new Date(`${fromIso}T00:00:00Z`);
  const b = new Date(`${toIso}T00:00:00Z`);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1; // not a full month yet
  return Math.max(0, months);
}

export function monthlyDepreciation(asset: FixedAsset): number {
  const life = (Number(asset.usefulLifeYears) || 0) * 12;
  if (life <= 0) return 0;
  const depreciable = Math.max(0, (Number(asset.cost) || 0) - (Number(asset.residualValue) || 0));
  return round2(depreciable / life);
}

/** Accumulated depreciation from acquisition through `asAt`, capped at depreciable amount. */
export function accumulatedDepreciation(asset: FixedAsset, asAt: string): number {
  const depreciable = Math.max(0, (Number(asset.cost) || 0) - (Number(asset.residualValue) || 0));
  const months = monthsBetween(asset.acquisitionDate, asAt);
  return round2(Math.min(depreciable, monthlyDepreciation(asset) * months));
}

export function bookValue(asset: FixedAsset, asAt: string): number {
  return round2((Number(asset.cost) || 0) - accumulatedDepreciation(asset, asAt));
}

export interface DepreciationLine { asset: FixedAsset; charge: number; }

/** Per-asset depreciation charge for a period (between depreciationPostedToDate
 *  and `to`, but not before acquisition), capped so accumulated never exceeds
 *  the depreciable amount. Disposed assets are skipped. */
export function depreciationForPeriod(assets: FixedAsset[], to: string): DepreciationLine[] {
  return assets
    .filter((a) => a.status === 'Active')
    .map((a) => {
      const start = a.depreciationPostedToDate && a.depreciationPostedToDate > a.acquisitionDate
        ? a.depreciationPostedToDate
        : a.acquisitionDate;
      const already = accumulatedDepreciation(a, start);
      const target = accumulatedDepreciation(a, to);
      return { asset: a, charge: round2(Math.max(0, target - already)) };
    })
    .filter((l) => l.charge > 0);
}

/** Build a single balanced depreciation journal (Dr 6150 / Cr 1590) for the
 *  period, or null if there's nothing to post / accounts are missing. */
export function buildDepreciationJournal(
  lines: DepreciationLine[],
  accounts: LedgerAccount[],
  to: string,
): JournalEntry | null {
  const total = round2(lines.reduce((s, l) => s + l.charge, 0));
  if (total <= 0) return null;
  const dep = accounts.find((a) => a.code === '6150');
  const accum = accounts.find((a) => a.code === '1590');
  if (!dep || !accum) return null;
  const stamp = Date.now();
  const jlines: JournalLine[] = [
    { id: `jl-dep-${stamp}-1`, accountId: dep.id, accountCode: dep.code, accountName: dep.name, description: 'Depreciation for period', debit: total, credit: 0 },
    { id: `jl-dep-${stamp}-2`, accountId: accum.id, accountCode: accum.code, accountName: accum.name, description: 'Accumulated depreciation', debit: 0, credit: total },
  ];
  return {
    id: '', entryNumber: '', date: to, reference: 'DEPR', status: 'Draft', source: 'auto:depreciation',
    description: `Depreciation to ${to} (${lines.length} asset${lines.length === 1 ? '' : 's'})`,
    lines: jlines, createdAt: new Date().toISOString(), notes: '',
  };
}
