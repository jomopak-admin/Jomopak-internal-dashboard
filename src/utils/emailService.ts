/**
 * Email service — thin client over the `send-payslip` Supabase Edge Function.
 *
 * The function relays HTML emails through Resend. This keeps the API key on the
 * server (never in the browser bundle) and the call authenticated as the signed-in
 * dashboard user.
 */

import { AppSettingsCompany, Employee, Payslip, PayrollRun } from '../types';
import { supabase } from './supabase';
import { buildLetterhead } from './printing';

/**
 * YTD totals for the current SA tax year (March → February). Pass the
 * employee's id and the full list of approved payroll runs and we sum
 * all matching payslips up to and including the current run's pay date.
 */
export interface PayslipYtd {
  income: number;
  basicSalary: number;
  paye: number;
  uifEmployee: number;
  uifEmployer: number;
  sdl: number;
  otherDeductions: number;
  netPay: number;
}

export function computePayslipYtd(employeeId: string, allRuns: PayrollRun[], currentRun: PayrollRun): PayslipYtd {
  const totals: PayslipYtd = { income: 0, basicSalary: 0, paye: 0, uifEmployee: 0, uifEmployer: 0, sdl: 0, otherDeductions: 0, netPay: 0 };
  // SA tax year: Mar 1 → Feb 28/29 of the following year. Pick the year
  // window that contains the current run's pay date.
  const cur = new Date(currentRun.payDate || `${currentRun.periodYear}-${String(currentRun.periodMonth).padStart(2, '0')}-01`);
  const taxYearStartYear = cur.getMonth() < 2 ? cur.getFullYear() - 1 : cur.getFullYear();
  const from = new Date(`${taxYearStartYear}-03-01`);
  const to = cur; // inclusive of current run
  allRuns.forEach((r) => {
    if (r.status === 'Draft') return;
    const d = new Date(r.payDate || `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}-01`);
    if (d < from || d > to) return;
    r.payslips.forEach((p) => {
      if (p.employeeId !== employeeId) return;
      totals.income += p.grossPay || 0;
      totals.basicSalary += p.basicSalary || 0;
      totals.paye += p.paye || 0;
      totals.uifEmployee += p.uifEmployee || 0;
      totals.uifEmployer += p.uifEmployer || 0;
      totals.sdl += p.sdl || 0;
      totals.otherDeductions += p.otherDeductions || 0;
      totals.netPay += p.netPay || 0;
    });
  });
  return totals;
}

/** Compute the period from/to dates for a payroll run (handles Monthly /
 *  Weekly / Fortnightly cycles). Best-effort — falls back to month bounds. */
export function payrollPeriodRange(run: PayrollRun): { from: string; to: string } {
  // For monthly cycles: full calendar month.
  const month = run.periodMonth;
  const year = run.periodYear;
  if (!month || !year) return { from: run.payDate, to: run.payDate };
  const fromDate = new Date(year, month - 1, 1);
  const toDate = new Date(year, month, 0); // last day of month
  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  cc?: string;
}

export interface SendResult {
  sent: number;
  total: number;
  results: { to: string; ok: boolean; error?: string }[];
  error?: string;
}

function money(n: number): string {
  return (Number(n) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Phase 123 — SA-format date helper for payslip headers + footer.
 *  Turns "2026-05-01" into "1 May 2026". Returns "—" for blanks. */
function fmtDateSA(iso: string): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

/** Phase 123 — Mask a bank account number to show only the last 4 digits.
 *  Keeps payslips safe to print + email — full bank details aren't dumped
 *  on every doc that gets passed around the office. */
function maskAccount(acct: string): string {
  if (!acct) return '—';
  const trimmed = acct.replace(/\s/g, '');
  if (trimmed.length <= 4) return trimmed;
  return `••••${trimmed.slice(-4)}`;
}

/** Build a clean, email-client-safe HTML payslip (inline styles, simple table). */
/**
 * SMETA-compliant payslip HTML (Phase 55). Itemizes hours/rates,
 * earnings, deductions and employer contributions with Current + YTD
 * columns. Matches SimplePay's two-column layout so existing staff
 * recognise it.
 *
 * Required by SMETA wage-and-benefit audits — every payslip must show:
 *   • Gross + net pay (each line itemized)
 *   • Hours worked + rate of pay (Rates & Quantities table)
 *   • Overtime premium hours separated from normal hours
 *   • Each deduction explained
 *   • Bonuses / allowances as separate lines
 */
export function buildPayslipHtml(
  slip: Payslip,
  run: PayrollRun,
  company?: AppSettingsCompany,
  ytd?: PayslipYtd,
  employee?: Employee,
): string {
  const period = payrollPeriodRange(run);
  const safeYtd = ytd ?? { income: slip.grossPay, basicSalary: slip.basicSalary, paye: slip.paye, uifEmployee: slip.uifEmployee, uifEmployer: slip.uifEmployer, sdl: slip.sdl, otherDeductions: slip.otherDeductions, netPay: slip.netPay };

  // 2-column line row with optional YTD column.
  const line2 = (label: string, current: number, ytdVal: number, opts: { strong?: boolean; sign?: '' | '-' } = {}) => {
    const s = opts.strong ? 'font-weight:600;' : '';
    const sign = opts.sign || '';
    return `<tr>
      <td style="padding:5px 8px;border-bottom:1px solid #eee;${s}">${label}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;${s}">${sign}${money(current)}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;color:#666;${s}">${sign}${money(ytdVal)}</td>
    </tr>`;
  };

  // Heading row for a section ("Income", "Deduction", "Employer Contribution").
  const head = (label: string) => `<tr>
    <td colspan="3" style="padding:8px 8px 4px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${label}</td>
  </tr>`;

  const totalIncome = (slip.basicSalary || 0) + (slip.allowances || 0) + (slip.additionalIncome ?? []).reduce((s, l) => s + l.amount, 0);
  const totalDeductions = (slip.paye || 0) + (slip.uifEmployee || 0) + (slip.otherDeductions || 0) + (slip.additionalDeductions ?? []).reduce((s, l) => s + l.amount, 0);

  const incomeRows = [
    line2('Basic Salary', slip.basicSalary || 0, safeYtd.basicSalary),
    ...(slip.allowances ? [line2('Allowances', slip.allowances, 0)] : []),
    ...((slip.additionalIncome ?? []).map((l) => line2(l.label, l.amount, 0))),
  ].join('');

  const deductionRows = [
    line2('UIF - Employee', slip.uifEmployee || 0, safeYtd.uifEmployee, { sign: '-' }),
    line2('Tax (PAYE)', slip.paye || 0, safeYtd.paye, { sign: '-' }),
    ...(slip.otherDeductions ? [line2('Other deductions', slip.otherDeductions, safeYtd.otherDeductions, { sign: '-' })] : []),
    ...((slip.additionalDeductions ?? []).map((l) => line2(l.label, l.amount, 0, { sign: '-' }))),
  ].join('');

  // Phase 123.2 — Always show SDL row even at R0 so SMETA auditors
  // see the statutory line is present. (UIF Employer was already always-on.)
  const employerRows = [
    line2('UIF - Employer', slip.uifEmployer || 0, safeYtd.uifEmployer),
    line2('SDL', slip.sdl || 0, safeYtd.sdl),
  ].join('');

  // Phase 123.2 — Cost to Company = Gross + Employer contributions.
  // Critical SMETA transparency: the employee sees the full cost of
  // employing them, not just their nett take-home.
  const employerTotal = (slip.uifEmployer || 0) + (slip.sdl || 0);
  const employerYtdTotal = safeYtd.uifEmployer + safeYtd.sdl;
  const costToCompany = totalIncome + employerTotal;
  const costToCompanyYtd = safeYtd.income + employerYtdTotal;

  const hoursRows = (slip.hoursLines ?? []).map((h) => `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #eee;">${h.type}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;">${h.quantity.toFixed(2)}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">R ${money(h.rate)}</td>
  </tr>`).join('');

  // Phase 123.2 — Daily hours for converting leave days → hours equivalent.
  // Most staff think in "days" but timekeepers / SMETA auditors want hours.
  // Defaults to 8 hours/day if no standardMonthlyHours captured.
  const standardDailyHours = (employee?.standardMonthlyHours && employee.standardMonthlyHours > 0)
    ? (employee.standardMonthlyHours / 21.67) // BCEA: ~21.67 working days/month
    : 8;
  const leaveRows = (slip.leaveSnapshot ?? []).map((l) => `<tr>
    <td style="padding:4px 8px;">${l.type}</td>
    <td style="padding:4px 8px;text-align:right;white-space:nowrap;">${l.balance.toFixed(2)} <span style="color:#888;font-size:10px;">(${(l.balance * standardDailyHours).toFixed(1)}h)</span></td>
    <td style="padding:4px 8px;text-align:right;">${l.adjustment.toFixed(2)}</td>
    <td style="padding:4px 8px;text-align:right;">${l.taken.toFixed(2)}</td>
    <td style="padding:4px 8px;text-align:right;">${l.scheduled.toFixed(2)}</td>
  </tr>`).join('');

  const hourlyRate = (employee?.hourlyRate && employee.hourlyRate > 0) ? employee.hourlyRate : ((employee?.standardMonthlyHours && employee.standardMonthlyHours > 0) ? (slip.basicSalary / employee.standardMonthlyHours) : 0);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;color:#1a1a1a;font-size:12px;">

    <!-- ─── Phase 123.2 — Letterhead block.
         Uses the shared buildLetterhead helper so payslips look the same
         as your invoices/quotes (brand logo + clean address layout).
         The "Payslip" right-title makes the doc type instantly clear. -->
    ${buildLetterhead(company, {
      rightTitle: 'Payslip',
      rightSubtitle: `${fmtDateSA(period.from)} to ${fmtDateSA(period.to)}`,
      logoHeightPx: 80,
      documentKind: 'payslip',
    })}

    <!-- ─── Employee header (Phase 123.2 — period now in letterhead subtitle).
         Status pill makes Draft vs Approved instantly obvious. -->
    <div style="display:table;width:100%;padding:14px 0 6px;">
      <div style="display:table-cell;width:55%;font-size:12px;">
        <div style="font-weight:600;font-size:13px;">${slip.employeeName}</div>
        ${employee?.idNumber ? `<div style="color:#555;margin-top:2px;">ID Number: ${employee.idNumber}</div>` : ''}
        ${employee?.taxNumber ? `<div style="color:#555;">Tax Number: ${employee.taxNumber}</div>` : ''}
        <div style="color:#555;">${run.payCycle || 'Monthly'} pay${run.status && run.status !== 'Approved' ? ` · <strong style="color:#92400e;">${run.status}</strong>` : ''}</div>
      </div>
      <div style="display:table-cell;width:45%;text-align:right;font-size:12px;color:#555;">
        ${slip.employeeNumber ? `Employee Number: ${slip.employeeNumber}<br/>` : ''}
        ${employee?.jobTitle ? `Job Title: ${employee.jobTitle}<br/>` : ''}
        ${employee?.department ? `Department: ${employee.department}<br/>` : ''}
        ${employee?.startDate ? `Employment Date: ${fmtDateSA(employee.startDate)}` : ''}
      </div>
    </div>

    <!-- ─── Two-column body: Earnings/Deductions left, Employer Contrib + Rates&Qty right ─── -->
    <div style="display:table;width:100%;margin-top:8px;table-layout:fixed;">
      <div style="display:table-cell;vertical-align:top;width:55%;padding-right:14px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;"></th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">Current</th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">YTD</th>
            </tr>
          </thead>
          <tbody>
            ${head('Earnings')}
            ${incomeRows}
            <tr><td colspan="3" style="padding:6px 8px;border-top:1px solid #ccc;font-weight:600;">
              <table style="width:100%;"><tr>
                <td style="padding:0;">Total Earnings</td>
                <td style="padding:0;text-align:right;">R ${money(totalIncome)}</td>
                <td style="padding:0;text-align:right;color:#666;width:80px;">R ${money(safeYtd.income)}</td>
              </tr></table>
            </td></tr>

            ${head('Deductions')}
            ${deductionRows}
            <tr><td colspan="3" style="padding:6px 8px;border-top:1px solid #ccc;font-weight:600;">
              <table style="width:100%;"><tr>
                <td style="padding:0;">Total Deductions</td>
                <td style="padding:0;text-align:right;">-R ${money(totalDeductions)}</td>
                <td style="padding:0;text-align:right;color:#666;width:80px;">-R ${money(safeYtd.paye + safeYtd.uifEmployee + safeYtd.otherDeductions)}</td>
              </tr></table>
            </td></tr>

            <tr><td colspan="3" style="padding:12px 8px;border-top:2px solid #333;font-weight:700;font-size:14px;background:#f7f7f7;">
              <table style="width:100%;"><tr>
                <td style="padding:0;">Net Pay</td>
                <td style="padding:0;text-align:right;">R ${money(slip.netPay)}</td>
                <td style="padding:0;text-align:right;color:#666;width:80px;">R ${money(safeYtd.netPay)}</td>
              </tr></table>
            </td></tr>
          </tbody>
        </table>
      </div>

      <div style="display:table-cell;vertical-align:top;width:45%;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;"></th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">Current</th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">YTD</th>
            </tr>
          </thead>
          <tbody>
            ${head('Employer Contributions')}
            ${employerRows}
            <tr><td colspan="3" style="padding:6px 8px;border-top:1px solid #ccc;font-weight:600;">
              <table style="width:100%;"><tr>
                <td style="padding:0;">Employer total</td>
                <td style="padding:0;text-align:right;">R ${money(employerTotal)}</td>
                <td style="padding:0;text-align:right;color:#666;width:80px;">R ${money(employerYtdTotal)}</td>
              </tr></table>
            </td></tr>
            <!-- Phase 123.2 — Cost to Company is the real number a SMETA
                 auditor wants: Earnings + Employer Contributions. The
                 employee sees their full cost on the business. -->
            <tr><td colspan="3" style="padding:10px 8px;border-top:2px solid #333;font-weight:700;font-size:13px;background:#f7f7f7;">
              <table style="width:100%;"><tr>
                <td style="padding:0;">Cost to Company</td>
                <td style="padding:0;text-align:right;">R ${money(costToCompany)}</td>
                <td style="padding:0;text-align:right;color:#666;width:80px;">R ${money(costToCompanyYtd)}</td>
              </tr></table>
            </td></tr>
          </tbody>
        </table>

        ${hoursRows ? `
          <div style="margin-top:18px;">
            <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:0 0 6px;">Rates &amp; Quantities</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="text-align:left;font-weight:500;font-size:11px;padding:6px 8px;">Type</th>
                  <th style="text-align:right;font-weight:500;font-size:11px;padding:6px 8px;">Quantity</th>
                  <th style="text-align:right;font-weight:500;font-size:11px;padding:6px 8px;">Rate</th>
                </tr>
              </thead>
              <tbody>${hoursRows}</tbody>
            </table>
          </div>
        ` : (hourlyRate > 0 ? `
          <div style="margin-top:18px;">
            <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:0 0 6px;">Rates &amp; Quantities</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="text-align:left;font-weight:500;font-size:11px;padding:6px 8px;">Type</th>
                  <th style="text-align:right;font-weight:500;font-size:11px;padding:6px 8px;">Quantity</th>
                  <th style="text-align:right;font-weight:500;font-size:11px;padding:6px 8px;">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="padding:5px 8px;">Normal</td><td style="padding:5px 8px;text-align:right;">${(employee?.standardMonthlyHours ?? 173.33).toFixed(2)}</td><td style="padding:5px 8px;text-align:right;white-space:nowrap;">R ${hourlyRate.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
        ` : '')}
      </div>
    </div>

    ${leaveRows ? `
      <div style="margin-top:18px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">Leave Type</th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">Balance</th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">Adjmt.</th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">Taken</th>
              <th style="text-align:right;font-weight:400;color:#888;font-size:11px;padding:4px 8px;border-bottom:1px solid #ddd;">Sched.</th>
            </tr>
          </thead>
          <tbody>${leaveRows}</tbody>
        </table>
      </div>
    ` : ''}

    <!-- ─── Phase 123 — Bank deposit footer.
         Shows the employee where the money was paid (or would be, at R0)
         so they can verify their bank record on file. Account number is
         masked to last-4 so the payslip is safe to print/share. ─── -->
    <div style="display:table;width:100%;margin-top:18px;border-top:1px solid #ddd;padding-top:10px;">
      <div style="display:table-cell;vertical-align:top;width:55%;font-size:11px;color:#444;">
        <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Paid to</div>
        <div><strong>${employee?.bankName || 'Bank not on file'}</strong></div>
        <div style="color:#555;">
          ${employee?.accountType ? `${employee.accountType} account · ` : ''}
          ${maskAccount(employee?.bankAccountNumber || '')}
        </div>
        ${employee?.bankBranchCode ? `<div style="color:#555;">Branch ${employee.bankBranchCode}</div>` : ''}
      </div>
      <div style="display:table-cell;vertical-align:top;width:45%;font-size:11px;color:#444;text-align:right;">
        <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Pay date</div>
        <div><strong>${fmtDateSA(run.payDate)}</strong></div>
      </div>
    </div>

    <p style="font-size:10px;color:#999;margin-top:18px;border-top:1px solid #eee;padding-top:8px;text-align:center;">
      This payslip is provided in accordance with the Basic Conditions of Employment Act and SMETA wage-transparency guidelines.
      If anything looks wrong, please contact payroll within 7 days.
    </p>
  </div>`;
}

/** Send a batch of emails via the edge function. Never throws — returns a result. */
export async function sendEmails(emails: OutgoingEmail[]): Promise<SendResult> {
  if (emails.length === 0) {
    return { sent: 0, total: 0, results: [], error: 'No recipients with an email address.' };
  }
  try {
    const { data, error } = await supabase.functions.invoke('send-payslip', { body: { emails } });
    if (error) {
      // Try to surface the function's JSON error message if present.
      let message = error.message || 'Email service call failed.';
      try {
        const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
        if (ctx?.json) {
          const parsed = (await ctx.json()) as { error?: string };
          if (parsed?.error) message = parsed.error;
        }
      } catch {
        /* ignore */
      }
      return { sent: 0, total: emails.length, results: [], error: message };
    }
    const payload = (data || {}) as SendResult;
    return {
      sent: payload.sent ?? 0,
      total: payload.total ?? emails.length,
      results: payload.results ?? [],
      error: payload.error,
    };
  } catch (err) {
    return { sent: 0, total: emails.length, results: [], error: String(err) };
  }
}
