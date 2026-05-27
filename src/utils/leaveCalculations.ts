/**
 * Leave-balance helpers (Phase 43).
 *
 * Pure functions — no React, no Supabase, easy to unit-test. Apply BCEA
 * defaults: 21 annual days / year, 10 sick / year, 3 family-responsibility,
 * accrued pro-rata from the employee's startDate up to today.
 */

import { BCEA_LEAVE_ENTITLEMENTS, Employee, LeaveRequest, LeaveType } from '../types';

/** Working days between two dates inclusive — excludes Saturdays + Sundays.
 *  Returns 0 for invalid ranges. */
export function countWorkingDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Months elapsed (rounded down) between an employee's startDate and today.
 *  Capped at 12 for accrual math — we don't carry beyond a single year. */
export function monthsAccrued(startDate: string, asOf: Date = new Date()): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime()) || start > asOf) return 0;
  const months = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
  return Math.max(0, Math.min(12, months));
}

/**
 * Compute a staff member's current balance for one leave type.
 *
 *   Entitlement is the BCEA annual entitlement pro-rated by months worked
 *   (capped at 12, i.e. one full year). "Taken" sums every Approved or
 *   Taken request for the same leave type. Result floors at zero.
 */
export function leaveBalanceFor(
  employee: Employee | undefined,
  type: LeaveType,
  allRequests: LeaveRequest[],
): { entitlement: number; taken: number; pending: number; available: number } {
  const months = monthsAccrued(employee?.startDate || '');
  const annualEntitlement = BCEA_LEAVE_ENTITLEMENTS[type] || 0;
  const entitlement = Math.round((annualEntitlement * months) / 12 * 100) / 100;
  const empMatches = (r: LeaveRequest) => employee && (
    r.employeeId === employee.id ||
    r.employeeName.trim().toLowerCase() === `${employee.firstName} ${employee.lastName}`.trim().toLowerCase()
  );
  const myRequests = allRequests.filter(empMatches).filter((r) => r.type === type);
  const taken = myRequests.filter((r) => r.status === 'Approved' || r.status === 'Taken').reduce((s, r) => s + (r.days || 0), 0);
  const pending = myRequests.filter((r) => r.status === 'Pending').reduce((s, r) => s + (r.days || 0), 0);
  const available = Math.max(0, entitlement - taken);
  return { entitlement, taken, pending, available };
}
