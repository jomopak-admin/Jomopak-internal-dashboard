import {
  AppData,
  FscClaimType,
  JobCard,
  JobStatus,
  PaperLog,
  ProductionLogEntry,
  ProductionLogType,
  WasteEntry,
  WasteReason,
} from '../types';

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
