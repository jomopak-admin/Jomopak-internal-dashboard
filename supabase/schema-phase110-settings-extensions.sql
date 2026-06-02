-- Phase 110 — Settings extensions.
--
-- Adds the new SimplePay-/QuickBooks-style settings blocks introduced in
-- Phases 110.1–110.9 to the singleton app_settings row:
--
--   • accounting_standard           — IFRS / US GAAP picker (Phase 109.1)
--   • payroll_config                — pay frequency, UIF/SDL/PAYE rates,
--                                     leave entitlements, public holidays,
--                                     EFT batch format, payslip layout,
--                                     employee number format
--   • payroll_calculations          — Sundays/PH multiplier, BCEA termination,
--                                     leave-pay basis, ETI, garnishees,
--                                     CTC composition, pro-rata method
--   • accounting_config             — VAT rates table, default payment terms,
--                                     default GL accounts, auto-post toggles,
--                                     multi-currency toggle, rounding mode
--   • numbering_config              — per-doc prefix/next-seq/padding rules
--   • bank_accounts                 — company bank accounts (jsonb array)
--   • employer_details              — SARS / DoL / FSCA references + filing
--                                     contact (PAYE/UIF/SDL/COIDA/CIPC/SETA)
--   • beneficiaries                 — pension funds, medical aids, unions,
--                                     garnishees (jsonb array, used by
--                                     payroll EFT batches)
--
-- All fields are jsonb on the singleton app_settings row. We DON'T split
-- bank_accounts / beneficiaries into separate tables because the in-memory
-- model treats them as arrays on AppSettings and they're always loaded
-- together. If volume ever justifies it, split later.
--
-- Idempotent: every column add is `if not exists`. Run as many times as
-- you like.

-- ───────────────────────────────────────── Phase 109.1: Accounting standard

alter table public.app_settings
  add column if not exists accounting_standard text default 'IFRS';

-- ───────────────────────────────────────── Phase 110.1 + 110.9: Payroll

alter table public.app_settings
  add column if not exists payroll_config jsonb default '{}'::jsonb;

-- payroll_calculations sits inside payroll_config.calculations on the wire,
-- but we leave the option to query it separately later by exposing a column.
alter table public.app_settings
  add column if not exists payroll_calculations jsonb default '{}'::jsonb;

-- ───────────────────────────────────────── Phase 110.2: Accounting defaults

alter table public.app_settings
  add column if not exists accounting_config jsonb default '{}'::jsonb;

-- ───────────────────────────────────────── Phase 110.3: Document numbering

alter table public.app_settings
  add column if not exists numbering_config jsonb default '{}'::jsonb;

-- ───────────────────────────────────────── Phase 110.4: Bank accounts

alter table public.app_settings
  add column if not exists bank_accounts jsonb default '[]'::jsonb;

-- ───────────────────────────────────────── Phase 110.6: Employer details

alter table public.app_settings
  add column if not exists employer_details jsonb default '{}'::jsonb;

-- ───────────────────────────────────────── Phase 110.7: Beneficiaries

alter table public.app_settings
  add column if not exists beneficiaries jsonb default '[]'::jsonb;

-- ───────────────────────────────────────── Seed sensible South African defaults

-- Seeds run ONLY when the column is still the migration default ('{}'::jsonb
-- or '[]'::jsonb). If you've already saved settings from the UI, they win.
-- This block is split per-column so a partial run leaves saved data alone.

update public.app_settings
   set payroll_config = jsonb_build_object(
     'payFrequency', 'monthly',
     'payDayOfMonth', 25,
     'uifEmployeePercent', 1,
     'uifEmployerPercent', 1,
     'uifEarningsCeilingMonthly', 17712,
     'sdlPercent', 1,
     'sdlExemptionAnnualPayrollUnder', 500000,
     'payePrimaryRebateAnnual', 17235,
     'payeSecondaryRebateAnnual', 9444,
     'payeTertiaryRebateAnnual', 3145,
     'annualLeaveDaysPerYear', 15,
     'sickLeaveDaysPerCycle', 30,
     'sickLeaveCycleMonths', 36,
     'familyResponsibilityDaysPerYear', 3,
     'publicHolidays', jsonb_build_array(
       '2026-01-01','2026-03-21','2026-04-03','2026-04-06','2026-04-27',
       '2026-05-01','2026-06-16','2026-08-09','2026-09-24','2026-12-16',
       '2026-12-25','2026-12-26'
     ),
     'employeeNumberPrefix', 'EMP-',
     'employeeNumberNextSeq', 1,
     'employeeNumberPadding', 4,
     'payslipShowYtd', true,
     'payslipShowLeaveBalance', true,
     'payslipShowLoanBalance', true,
     'payslipFooterNote', 'Queries: payroll@jomopak.co.za',
     'eftBatchFormat', 'Generic CSV',
     'eftBatchSendCcEmails', ''
   )
 where id = 'default' and payroll_config = '{}'::jsonb;

update public.app_settings
   set payroll_calculations = jsonb_build_object(
     'sundayRateMultiplier', 1.5,
     'publicHolidayRateMultiplier', 2.0,
     'terminationNoticeDaysUnder6Months', 7,
     'terminationNoticeDays6MonthsTo1Year', 14,
     'terminationNoticeDaysOver1Year', 28,
     'payTerminationLeaveInLieu', true,
     'leavePayBasis', 'last13Weeks',
     'etiEnabled', true,
     'etiMinimumWageMonthly', 2000,
     'garnisheeMaxPercentOfNet', 25,
     'garnisheeAdminFeePercent', 0,
     'sdlAutoExemptionCheck', true,
     'ctcIncludesUif', true,
     'ctcIncludesSdl', true,
     'ctcIncludesPension', true,
     'ctcIncludesMedicalAid', true,
     'proRataMethod', 'calendarDays'
   )
 where id = 'default' and payroll_calculations = '{}'::jsonb;

update public.app_settings
   set accounting_config = jsonb_build_object(
     'fiscalYearEndMonth', 2,
     'fiscalYearEndDay', 28,
     'vatRates', jsonb_build_array(
       jsonb_build_object('id','vat-std','code','STD','label','Standard rate','ratePercent',15,'isDefault',true,'active',true),
       jsonb_build_object('id','vat-zer','code','ZER','label','Zero-rated','ratePercent',0,'isDefault',false,'active',true),
       jsonb_build_object('id','vat-exm','code','EXM','label','Exempt','ratePercent',0,'isDefault',false,'active',true)
     ),
     'defaultPaymentTermDays', 30,
     'defaultPaymentTermLabel', 'Net 30 days',
     'retainedEarningsAccountCode', '3500',
     'defaultSalesAccountCode', '4000',
     'defaultPurchaseAccountCode', '5000',
     'defaultBankAccountCode', '1100',
     'autoPostInvoicesToGl', true,
     'autoPostBillsToGl', true,
     'enableMultiCurrency', false,
     'roundingMode', 'nearest'
   )
 where id = 'default' and accounting_config = '{}'::jsonb;

update public.app_settings
   set numbering_config = jsonb_build_object(
     'invoice',       jsonb_build_object('prefix','INV-', 'nextSeq',1,'padding',5,'includeDate',false,'resetAnnually',false),
     'quote',         jsonb_build_object('prefix','QUO-', 'nextSeq',1,'padding',5,'includeDate',false,'resetAnnually',false),
     'deliveryNote',  jsonb_build_object('prefix','DN-',  'nextSeq',1,'padding',5,'includeDate',false,'resetAnnually',false),
     'purchaseOrder', jsonb_build_object('prefix','PO-',  'nextSeq',1,'padding',5,'includeDate',false,'resetAnnually',false),
     'jobCard',       jsonb_build_object('prefix','JC-',  'nextSeq',1,'padding',5,'includeDate',false,'resetAnnually',false),
     'supplierBill',  jsonb_build_object('prefix','BILL-','nextSeq',1,'padding',5,'includeDate',false,'resetAnnually',false),
     'creditNote',    jsonb_build_object('prefix','CN-',  'nextSeq',1,'padding',5,'includeDate',false,'resetAnnually',false),
     'payslip',       jsonb_build_object('prefix','PS-',  'nextSeq',1,'padding',6,'includeDate',true, 'resetAnnually',true)
   )
 where id = 'default' and numbering_config = '{}'::jsonb;

update public.app_settings
   set employer_details = jsonb_build_object(
     'incomeTaxReference', '',
     'payeReference', '',
     'uifReference', '',
     'sdlReference', '',
     'uifDolReference', '',
     'coidaReference', '',
     'wcCommissionerCode', '',
     'cipcRegistrationNumber', '',
     'emp201TradingName', '',
     'setaCode', 'FP&M SETA',
     'employerRegistrationDate', '',
     'isSmallBusinessCorporation', false,
     'filingContactName', '',
     'filingContactEmail', '',
     'filingContactPhone', '',
     'backupContactName', '',
     'backupContactEmail', ''
   )
 where id = 'default' and employer_details = '{}'::jsonb;

-- bank_accounts + beneficiaries stay empty arrays — admin fills them
-- from the Settings UI. Don't seed sample rows because that would put
-- fake bank account numbers on real invoices.

-- No new RLS — inherits from app_settings (read open to authenticated,
-- write restricted to admin role).
