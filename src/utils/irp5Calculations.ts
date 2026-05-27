/**
 * IRP5 / IT3a / EMP501 year-end aggregation (Phase 46).
 *
 * Aggregates per-employee earnings + deductions across a SA tax year
 * (1 March → 28/29 February). Returns the totals SARS needs for the IRP5
 * certificate per employee, plus an EMP501 reconciliation roll-up.
 *
 * SARS source codes mapped to our payslip fields:
 *   3601 Income (PAYE) — grossPay
 *   4102 PAYE          — paye
 *   4141 UIF (employee) — uifEmployee
 *   4142 UIF (employer) — uifEmployer
 *   4149 SDL            — sdl
 *   4115 Other deductions
 */

import { Employee, PayrollRun } from '../types';

export interface Irp5LineItem {
  employee: Employee;
  /** Tax-year start year (e.g. 2025 means 1 Mar 2025 → 28 Feb 2026). */
  taxYearStart: number;
  /** YYYY-MM-DD of period covered. */
  fromDate: string;
  toDate: string;
  /** Source-code totals. */
  income3601: number;
  paye4102: number;
  uifEmployee4141: number;
  uifEmployer4142: number;
  sdl4149: number;
  otherDeductions4115: number;
  /** Net pay across the year (gross - PAYE - UIF emp - other). */
  netPay: number;
  /** Number of payroll runs the employee appeared in. */
  periods: number;
}

export interface Emp501Summary {
  taxYearStart: number;
  fromDate: string;
  toDate: string;
  totalEmployees: number;
  totalIncome: number;
  totalPaye: number;
  totalUifEmployee: number;
  totalUifEmployer: number;
  totalSdl: number;
  /** Total EMP201 obligation (PAYE + UIF total + SDL) over the year. */
  totalEmp201: number;
}

/** SA tax year runs 1 Mar → 28/29 Feb. Pass the year of the March start. */
export function taxYearRange(startYear: number): { from: string; to: string } {
  return {
    from: `${startYear}-03-01`,
    to: `${startYear + 1}-02-28`, // Feb-28 simplifies leap-year edge cases; payslips don't care
  };
}

/** Best guess at the current tax year start based on today's date. */
export function currentTaxYearStart(today: Date = new Date()): number {
  // If we're in Jan/Feb the tax year started LAST March.
  return today.getMonth() < 2 ? today.getFullYear() - 1 : today.getFullYear();
}

export function buildIrp5(employees: Employee[], runs: PayrollRun[], taxYearStart: number): Irp5LineItem[] {
  const { from, to } = taxYearRange(taxYearStart);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const inRange = runs.filter((r) => {
    if (!r.payDate) return false;
    const d = new Date(r.payDate);
    return d >= fromDate && d <= toDate && r.status !== 'Draft';
  });
  return employees.map((employee) => {
    const lines = inRange.flatMap((r) => r.payslips.filter((p) => p.employeeId === employee.id));
    const sum = lines.reduce((acc, p) => ({
      income: acc.income + p.grossPay,
      paye: acc.paye + p.paye,
      uifEmp: acc.uifEmp + p.uifEmployee,
      uifEmployer: acc.uifEmployer + p.uifEmployer,
      sdl: acc.sdl + p.sdl,
      other: acc.other + p.otherDeductions,
      net: acc.net + p.netPay,
    }), { income: 0, paye: 0, uifEmp: 0, uifEmployer: 0, sdl: 0, other: 0, net: 0 });
    return {
      employee,
      taxYearStart,
      fromDate: from,
      toDate: to,
      income3601: round2(sum.income),
      paye4102: round2(sum.paye),
      uifEmployee4141: round2(sum.uifEmp),
      uifEmployer4142: round2(sum.uifEmployer),
      sdl4149: round2(sum.sdl),
      otherDeductions4115: round2(sum.other),
      netPay: round2(sum.net),
      periods: lines.length,
    };
  }).filter((line) => line.periods > 0);
}

export function buildEmp501(lines: Irp5LineItem[], taxYearStart: number): Emp501Summary {
  const { from, to } = taxYearRange(taxYearStart);
  return lines.reduce((acc, l) => ({
    ...acc,
    totalIncome: acc.totalIncome + l.income3601,
    totalPaye: acc.totalPaye + l.paye4102,
    totalUifEmployee: acc.totalUifEmployee + l.uifEmployee4141,
    totalUifEmployer: acc.totalUifEmployer + l.uifEmployer4142,
    totalSdl: acc.totalSdl + l.sdl4149,
    totalEmp201: acc.totalEmp201 + l.paye4102 + l.uifEmployee4141 + l.uifEmployer4142 + l.sdl4149,
  }), {
    taxYearStart,
    fromDate: from,
    toDate: to,
    totalEmployees: lines.length,
    totalIncome: 0,
    totalPaye: 0,
    totalUifEmployee: 0,
    totalUifEmployer: 0,
    totalSdl: 0,
    totalEmp201: 0,
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
