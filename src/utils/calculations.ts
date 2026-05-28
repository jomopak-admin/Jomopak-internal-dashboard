import {
  AppData,
  ChemicalRegisterEntry,
  FinishedGoodsStock,
  FoodSafeStatus,
  FscClaimType,
  JobCard,
  JobStatus,
  MaterialReceipt,
  PaperLog,
  ProductionLogEntry,
  ProductionLogType,
  WasteEntry,
  WasteReason,
} from '../types';

/**
 * Phase 75 — resolve the paper MaterialReceipt that fed a job.
 *
 * Preferred path: Production Logs (Bag Making → Bag Printing → Flexo → Slitting).
 * Legacy fallback: PaperLog rows (kept until all production data flows through
 * Production Logs, then deprecated).
 *
 * If the resolved MaterialReceipt is a slit child, food-safe + FSC are
 * already inherited at slit time, so a single hop is enough.
 */
function findPaperForJob(
  jobId: string,
  productionLogs: ProductionLogEntry[],
  paperLogs: PaperLog[],
  materialReceipts: MaterialReceipt[],
): MaterialReceipt | undefined {
  const priority: ProductionLogType[] = ['Bag Making', 'Bag Printing', 'Flexo Printing', 'Slitting'];
  for (const t of priority) {
    const entry = productionLogs.find((p) => p.jobId === jobId && p.logType === t && p.sourceMaterialId);
    if (entry) {
      const m = materialReceipts.find((mr) => mr.id === entry.sourceMaterialId);
      if (m) return m;
    }
  }
  const log = paperLogs.find((pl) => pl.jobId === jobId);
  return log ? materialReceipts.find((mr) => mr.id === log.materialReceiptId) : undefined;
}

export const JOB_STATUSES: JobStatus[] = [
  'Draft',
  'Awaiting Artwork',
  'Awaiting Proof Approval',
  'Ready for Production',
  'In Production',
  'Quality Check',
  'Ready for Dispatch',
  'In Storage',
  'Partially Dispatched',
  'Completed',
];
export const WASTE_REASONS: WasteReason[] = [
  'Setup waste',
  'Running waste',
  'Misprint',
  'Machine issue',
  'Paper issue',
  'Damaged stock',
  'Operator error',
  'Other',
];
export const FSC_CLAIM_TYPES: FscClaimType[] = ['None', 'FSC Mix', 'FSC Recycled', 'FSC 100%'];
export const PRODUCTION_LOG_TYPES: ProductionLogType[] = [
  'Slitting',
  'Flexo Printing',
  'Bag Printing',
  'Bag Making',
];

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonthValue(reference = new Date()): string {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

export function getMonthLabel(monthValue: string): string {
  const [year, month] = monthValue.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-ZA', { month: 'long', year: 'numeric' });
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-ZA', { maximumFractionDigits }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysInStorage(date: string, reference = new Date()): number {
  const start = new Date(date);
  const end = new Date(reference.toISOString().slice(0, 10));
  const diffMs = end.getTime() - start.getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
}

export function getStorageAgeBand(days: number): '0-30' | '31-60' | '60+' {
  if (days <= 30) {
    return '0-30';
  }
  if (days <= 60) {
    return '31-60';
  }
  return '60+';
}

export function formatFlag(value: boolean): 'Yes' | 'No' {
  return value ? 'Yes' : 'No';
}

export function matchesText(value: string, search: string): boolean {
  return value.toLowerCase().includes(search.trim().toLowerCase());
}

export function getWasteForJob(jobId: string, wasteEntries: WasteEntry[]): number {
  return wasteEntries
    .filter((entry) => entry.jobId === jobId)
    .reduce((sum, entry) => sum + entry.wasteQuantity, 0);
}

export function getPaperUsedForJob(jobId: string, paperLogs: PaperLog[]): number {
  return paperLogs
    .filter((log) => log.jobId === jobId)
    .reduce((sum, log) => sum + log.quantityUsed, 0);
}

export function getProductionLogsForJob(jobId: string, productionLogs: ProductionLogEntry[]): number {
  return productionLogs.filter((log) => log.jobId === jobId).length;
}

export function getWastePercentForJob(job: JobCard, wasteEntries: WasteEntry[]): number {
  if (!job.quantityPlanned) {
    return 0;
  }

  return (getWasteForJob(job.id, wasteEntries) / job.quantityPlanned) * 100;
}

export function isWithinDateRange(date: string, dateFrom: string, dateTo: string): boolean {
  if (dateFrom && date < dateFrom) {
    return false;
  }

  if (dateTo && date > dateTo) {
    return false;
  }

  return true;
}

export function calculateAverageWastePerJob(wasteEntries: WasteEntry[], jobs: JobCard[]): number {
  if (!jobs.length) {
    return 0;
  }

  const totalWaste = wasteEntries.reduce((sum, entry) => sum + entry.wasteQuantity, 0);
  return totalWaste / jobs.length;
}

export function calculateAverageWastePerCompletedJob(wasteEntries: WasteEntry[], jobs: JobCard[]): number {
  const completedJobs = jobs.filter((job) => job.status === 'Completed');
  if (!completedJobs.length) {
    return 0;
  }

  const totalWaste = wasteEntries.reduce((sum, entry) => sum + entry.wasteQuantity, 0);
  return totalWaste / completedJobs.length;
}

export function groupTotals<T>(
  items: T[],
  getKey: (item: T) => string,
  getValue: (item: T) => number,
): Array<{ label: string; value: number }> {
  const totals = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item) || 'Unspecified';
    totals.set(key, (totals.get(key) ?? 0) + getValue(item));
  });

  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
}

export function getMonthOptions(data: AppData): string[] {
  const values = new Set<string>([getCurrentMonthValue()]);

  data.jobs.forEach((job) => values.add(getMonthKey(job.jobDate)));
  data.materialReceipts.forEach((receipt) => values.add(getMonthKey(receipt.receivedDate)));
  data.productionLogs.forEach((log) => values.add(getMonthKey(log.logDate)));
  data.wasteEntries.forEach((entry) => values.add(getMonthKey(entry.wasteDate)));
  data.paperLogs.forEach((log) => values.add(getMonthKey(log.logDate)));
  data.dispatchRecords.forEach((record) => values.add(getMonthKey(record.dispatchDate)));

  return [...values].sort((left, right) => right.localeCompare(left));
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>): void {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? '');
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/* ---------- Phase 71 — Food-safe + FSC derivation for FG batches ---------- */

/**
 * Result of the food-safe walk for a finished-goods batch. `reason` explains
 * which input drove the verdict so we can show it as a hover tooltip / audit row.
 */
export interface FgFoodSafeVerdict {
  status: FoodSafeStatus;
  reason: string;
}

/**
 * Walk the chain  FG batch → linked job → paper batch (via PaperLog) +
 * chemicals listed on the job. Returns the rolled-up food-safe verdict:
 *   - 'no'      if any input is not food-safe
 *   - 'yes'     if paper + all chemicals are food-safe
 *   - 'unknown' if any input has not been set yet
 *
 * Per JomoPak's process there is exactly ONE paper batch per job.
 */
export function computeFgFoodSafe(
  fg: FinishedGoodsStock,
  jobs: JobCard[],
  paperLogs: PaperLog[],
  materialReceipts: MaterialReceipt[],
  chemicals: ChemicalRegisterEntry[],
  productionLogs: ProductionLogEntry[] = [],
): FgFoodSafeVerdict {
  if (!fg.jobId) return { status: 'unknown', reason: 'No linked job' };
  const job = jobs.find((j) => j.id === fg.jobId);
  if (!job) return { status: 'unknown', reason: 'Linked job not found' };

  // Phase 75 — Production Log is the preferred source; PaperLog is fallback.
  const paper = findPaperForJob(job.id, productionLogs, paperLogs, materialReceipts);

  const inputs: Array<{ status: FoodSafeStatus; label: string }> = [];
  if (paper) {
    inputs.push({
      status: paper.isFoodSafe ?? 'unknown',
      label: `Paper ${paper.receiptNumber}`,
    });
  }
  for (const cid of job.chemicalIds ?? []) {
    const c = chemicals.find((ch) => ch.id === cid);
    if (c) inputs.push({ status: c.isFoodSafe ?? 'unknown', label: c.chemicalName });
  }

  if (inputs.length === 0) {
    return { status: 'unknown', reason: 'No paper batch or chemicals linked to job yet' };
  }

  const blocker = inputs.find((i) => i.status === 'no');
  if (blocker) return { status: 'no', reason: `${blocker.label} is not food-safe` };

  if (inputs.every((i) => i.status === 'yes')) {
    return { status: 'yes', reason: 'Paper + all chemicals certified food-safe' };
  }

  const unknown = inputs.find((i) => i.status === 'unknown');
  return {
    status: 'unknown',
    reason: `${unknown?.label ?? 'Some inputs'} — food-safe flag not yet set`,
  };
}

/**
 * Returns the FSC claim for the FG batch's paper, or 'Unknown' if no paper
 * batch has been logged yet for the linked job.
 */
export function computeFgFsc(
  fg: FinishedGoodsStock,
  jobs: JobCard[],
  paperLogs: PaperLog[],
  materialReceipts: MaterialReceipt[],
  productionLogs: ProductionLogEntry[] = [],
): FscClaimType | 'Unknown' {
  if (!fg.jobId) return 'Unknown';
  const job = jobs.find((j) => j.id === fg.jobId);
  if (!job) return 'Unknown';
  const paper = findPaperForJob(job.id, productionLogs, paperLogs, materialReceipts);
  return paper?.fscClaimType ?? 'Unknown';
}
