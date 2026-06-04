export type View =
  | 'dashboard'
  | 'salesDesk'
  | 'calculator'
  | 'workTicket'
  | 'costMasters'
  | 'costInputs'
  | 'leads'
  | 'permissions'
  | 'settings'
  | 'osConnector'
  | 'suppliers'
  | 'quotes'
  | 'artwork'
  | 'customerStock'
  | 'deliveryNotes'
  | 'invoices'
  | 'proformas'
  | 'customerDeposits'
  | 'productionSpecs'
  | 'machines'
  | 'jobs'
  | 'products'
  | 'clients'
  | 'pricing'
  | 'priceList'
  | 'finishedStock'
  | 'spares'
  | 'materials'
  | 'chemicalRegister'
  | 'foodSafeMaterials'
  | 'cleaningLogs'
  | 'foodSafetyControlCentre'
  | 'haccpRegister'
  | 'nonConformance'
  | 'sopRegister'
  | 'staffTraining'
  | 'ppeControl'
  | 'pestControl'
  | 'foreignObjectControl'
  | 'contaminationControl'
  | 'toolBladeControl'
  | 'firstAidRegister'
  | 'visitorLog'
  | 'visitorKiosk'
  | 'traceability'
  | 'complaints'
  | 'agedDebtors'
  | 'profitability'
  | 'salesPipeline'
  | 'productionSchedule'
  | 'materialRequirements'
  | 'cashFlow'
  | 'morningDigest'
  | 'reorderReminders'
  | 'leadAnalytics'
  | 'driverPod'
  | 'invoiceInbox'
  | 'stockTake'
  | 'documentVault'
  | 'shipments'
  | 'chartOfAccounts'
  | 'accountsPayable'
  | 'sarsCentre'
  | 'financeSummary'
  | 'customerStatements'
  | 'employees'
  | 'payroll'
  | 'bankRec'
  | 'generalLedger'
  | 'financialStatements'
  | 'financialProjections'
  | 'fixedAssets'
  | 'currencies'
  | 'maintenance'
  | 'production'
  | 'waste'
  | 'paper'
  | 'dispatch'
  | 'reports'
  | 'reportsHub'
  | 'myPortal'
  | 'notices'
  | 'staffWarnings'
  | 'stockRequests'
  | 'stockRequestsApprove'
  | 'stockRequestsBuy'
  | 'staffLeave'
  | 'staffLeaveApprove'
  | 'staffLoans'
  | 'irp5Centre'
  | 'expenseClaims'
  | 'expenseClaimsApprove'
  | 'stockStatements'
  | 'companies'
  | 'dispatchRuns'
  | 'dies'
  | 'stereos'
  | 'labels'
  | 'stockMovements'
  | 'tradedGoods'
  | 'incidentRegister'
  | 'drillRegister'
  | 'toolboxTalks'
  | 'sheCommittee'
  | 'auditProgrammes'
  | 'visitorApprovals'
  | 'adminHub'
  | 'inbox';
export type UserRole = 'admin' | 'ops' | 'production' | 'sales' | 'artwork' | 'accounts' | 'driver';

/** Phase 103 — Inbox categories.
 *  Mirrors the InboxCategory in utils/inbox.ts. Re-declared here so
 *  UserProfile can reference it without the type file importing utils. */
export type InboxCategory = 'HR' | 'Sales' | 'Production' | 'Safety' | 'Finance' | 'Operations';
export const ALL_INBOX_CATEGORIES: InboxCategory[] = ['HR', 'Sales', 'Production', 'Safety', 'Finance', 'Operations'];

/** Phase 103 — Partner scopes for external_partner accounts.
 *  Each scope gates a slice of the app:
 *   - hr         — leave, claims, warnings, employees, IRP5 docs
 *   - legal      — NCRs, contracts, legal correspondence
 *   - accounting — invoices, supplier bills, bank rec, GL, can post invoices
 *   - marketing  — leads, sales pipeline, customer data, can post notices
 *   - audit      — audit programmes, SHE, NCRs, compliance docs
 *  Combine scopes for firms that do multiple jobs ('hr' + 'accounting'). */
export type PartnerScope = 'hr' | 'legal' | 'accounting' | 'marketing' | 'audit';
export const ALL_PARTNER_SCOPES: PartnerScope[] = ['hr', 'legal', 'accounting', 'marketing', 'audit'];

/** Phase 103 — which inbox categories each partner scope should see by
 *  default. Sensible starting point; admin can override per user. */
export const PARTNER_SCOPE_INBOX_DEFAULTS: Record<PartnerScope, InboxCategory[]> = {
  hr:         ['HR'],
  legal:      ['Safety'],                          // NCRs, contracts surface as Safety
  accounting: ['Finance'],
  marketing:  ['Sales'],
  audit:      ['Safety', 'Operations'],
};
export type DashboardWidget =
  | 'stats'
  | 'monthSummary'
  | 'alerts'
  | 'quickCalculator'
  | 'finishedStock'
  | 'partsAttention'
  | 'recentJobs'
  | 'recentMaterials'
  | 'recentWaste'
  | 'recentProduction'
  | 'recentPaper'
  | 'recentDispatch'
  | 'wasteByReason'
  | 'topPaper'
  | 'leadsAttention';

export const VIEW_LABELS: Record<View, string> = {
  dashboard: 'Dashboard',
  salesDesk: 'Sales Desk',
  calculator: 'Calculator',
  workTicket: 'Work Tickets',
  costMasters: 'Cost Masters',
  costInputs: 'Cost Inputs',
  leads: 'Leads',
  permissions: 'Permissions',
  settings: 'Settings',
  osConnector: 'API Access',
  suppliers: 'Suppliers',
  quotes: 'Quotes & Estimates',
  artwork: 'Artwork',
  customerStock: 'Customer Stock',
  deliveryNotes: 'Delivery Notes',
  invoices: 'Tax Invoices',
  proformas: 'Pro-formas',
  customerDeposits: 'Customer Deposits',
  productionSpecs: 'Production Specs',
  machines: 'Machines',
  jobs: 'Job Cards',
  products: 'Products',
  clients: 'Clients',
  pricing: 'Pricing Tiers',
  priceList: 'Price List',
  finishedStock: 'Finished Stock',
  spares: 'Spares & Consumables',
  materials: 'Materials Receiving',
  chemicalRegister: 'Chemical Register (MSDS)',
  foodSafeMaterials: 'Food-Safe Materials',
  cleaningLogs: 'Cleaning & Sanitation Logs',
  foodSafetyControlCentre: 'Food Safety Control Centre',
  haccpRegister: 'HACCP Hazard Register',
  nonConformance: 'Incidents & NCRs',
  sopRegister: 'SOP Document Register',
  staffTraining: 'Staff Training & Hygiene',
  ppeControl: 'PPE Issue & Control',
  pestControl: 'Pest Control Register',
  foreignObjectControl: 'Foreign Object Register',
  contaminationControl: 'Contamination Control',
  toolBladeControl: 'Tools & Blade Control',
  firstAidRegister: 'First Aid Register',
  visitorLog: 'Visitor & Contractor Log',
  visitorKiosk: 'Reception Kiosk',
  traceability: 'Batch Traceability',
  complaints: 'Complaints & Recall',
  agedDebtors: 'Aged Debtors',
  profitability: 'Profitability',
  salesPipeline: 'Sales Pipeline',
  productionSchedule: 'Production Schedule',
  materialRequirements: 'Material Requirements',
  cashFlow: 'Cash Flow Forecast',
  morningDigest: 'Morning Digest',
  reorderReminders: 'Reorder Reminders',
  leadAnalytics: 'Lead Conversion Analytics',
  driverPod: 'Driver POD',
  invoiceInbox: 'Supplier Invoice Inbox',
  stockTake: 'Stock Take',
  documentVault: 'Document Vault',
  shipments: 'Imports & Shipments',
  chartOfAccounts: 'Chart of Accounts',
  accountsPayable: 'Accounts Payable',
  sarsCentre: 'SARS Centre',
  financeSummary: 'P&L & VAT Summary',
  customerStatements: 'Customer Statements',
  employees: 'Employees',
  payroll: 'Payroll',
  bankRec: 'Bank Reconciliation',
  generalLedger: 'General Ledger',
  financialStatements: 'Financial Statements',
  financialProjections: 'Financial Projections',
  fixedAssets: 'Fixed Assets',
  currencies: 'Currencies & FX',
  maintenance: 'Maintenance',
  production: 'Production Logs',
  waste: 'Waste Log',
  paper: 'Paper Log',
  dispatch: 'Dispatch',
  reports: 'Operational Reports',
  reportsHub: 'Reports Hub',
  myPortal: 'My Stuff',
  notices: 'Notice Board',
  staffWarnings: 'Staff Warnings & Notes',
  stockRequests: 'Stock Requests',
  stockRequestsApprove: 'Approve Stock Requests',
  stockRequestsBuy: 'Buying Queue',
  staffLeave: 'Leave Register',
  staffLeaveApprove: 'Approve Leave',
  staffLoans: 'Staff Loans',
  irp5Centre: 'IRP5 / EMP501 Centre',
  expenseClaims: 'Expense Claims',
  expenseClaimsApprove: 'Approve Expense Claims',
  stockStatements: 'Stock Statements',
  companies: 'Companies',
  dispatchRuns: 'Dispatch Runs',
  dies: 'Dies',
  stereos: 'Stereos',
  labels: 'Labels',
  stockMovements: 'Stock Movements',
  tradedGoods: 'Traded Goods',
  incidentRegister: 'Incident Register',
  drillRegister: 'Drill Register',
  toolboxTalks: 'Toolbox Talks',
  sheCommittee: 'SHE Committee',
  auditProgrammes: 'Audit Programmes',
  visitorApprovals: 'Visitor Approvals',
  adminHub: 'Admin Hub',
  inbox: 'Inbox',
};

export const ROLE_DEFAULT_VIEWS: Record<UserRole, View[]> = {
  admin: [
    'inbox',
    'dashboard',
    'adminHub',
    'salesDesk',
    'calculator',
    'workTicket',
    'costMasters',
    'costInputs',
    'leads',
    'permissions',
    'settings',
    // Phase 103.7 — API access lives inside Settings → API access tab now.
    // It is intentionally NOT in the admin's default permissions list so
    // it never appears in the sidebar. The Settings tab uses its own
    // direct render path so route-level access still works for admins
    // even though the standalone view permission was dropped.
    'suppliers',
    'quotes',
    'artwork',
    'customerStock',
    'deliveryNotes',
    'invoices',
    'productionSpecs',
    'machines',
    'maintenance',
    'jobs',
    'products',
    'clients',
    'pricing',
    'priceList',
    'finishedStock',
    'tradedGoods',
    'stockTake',
    'spares',
    'materials',
    'shipments',
    'chemicalRegister',
    'foodSafeMaterials',
    'cleaningLogs',
    'foodSafetyControlCentre',
    'haccpRegister',
    'nonConformance',
    'sopRegister',
    'staffTraining',
    'ppeControl',
    'pestControl',
    'foreignObjectControl',
    'toolBladeControl',
    'firstAidRegister',
    'incidentRegister',
    'drillRegister',
    'toolboxTalks',
    'sheCommittee',
    'auditProgrammes',
    'visitorLog',
    'visitorKiosk',
    'visitorApprovals',
    'traceability',
    'complaints',
    'agedDebtors',
    'profitability',
    'salesPipeline',
    'productionSchedule',
    'materialRequirements',
    'cashFlow',
    'morningDigest',
    'leadAnalytics',
    'reorderReminders',
    'driverPod',
    'dispatchRuns',
    'dies',
    'stereos',
    'labels',
    'stockMovements',
    'invoiceInbox',
    'production',
    'waste',
    'paper',
    'dispatch',
    'reports',
    'reportsHub',
    'documentVault',
    'chartOfAccounts',
    'accountsPayable',
    'sarsCentre',
    'financeSummary',
    'customerStatements',
    'employees',
    'payroll',
    'bankRec',
    'generalLedger',
    'financialStatements',
    'financialProjections',
    'fixedAssets',
    'currencies',
    'myPortal',
    'notices',
    'staffWarnings',
    'stockRequests',
    'stockRequestsApprove',
    'stockRequestsBuy',
    'staffLeave',
    'staffLeaveApprove',
    'staffLoans',
    'irp5Centre',
    'expenseClaims',
    'expenseClaimsApprove',
    'stockStatements',
    'companies',
  ],
  ops: [
    'dashboard',
    'myPortal',
    'leads',
    'calculator',
    'workTicket',
    'quotes',
    'artwork',
    'customerStock',
    'deliveryNotes',
    'invoices',
    'productionSpecs',
    'machines',
    'maintenance',
    'jobs',
    'products',
    'priceList',
    'finishedStock',
    'tradedGoods',
    'stockTake',
    'spares',
    'materials',
    'shipments',
    'chemicalRegister',
    'foodSafeMaterials',
    'cleaningLogs',
    'foodSafetyControlCentre',
    'haccpRegister',
    'nonConformance',
    'sopRegister',
    'staffTraining',
    'ppeControl',
    'pestControl',
    'foreignObjectControl',
    'toolBladeControl',
    'firstAidRegister',
    'incidentRegister',
    'drillRegister',
    'toolboxTalks',
    'sheCommittee',
    'visitorLog',
    'traceability',
    'complaints',
    'agedDebtors',
    'profitability',
    'salesPipeline',
    'productionSchedule',
    'materialRequirements',
    'cashFlow',
    'morningDigest',
    'reorderReminders',
    'driverPod',
    'dispatchRuns',
    'dies',
    'stereos',
    'labels',
    'stockMovements',
    'invoiceInbox',
    'production',
    'waste',
    'paper',
    'dispatch',
    'reports',
    'stockRequests',
    'stockRequestsApprove',
    'staffLeaveApprove',
    'expenseClaimsApprove',
    'stockStatements',
  ],
  production: [
    // Factory-floor operator scope. Intentionally minimal — just what a
    // machine operator needs to do their shift. Admin can tick more per
    // user via the Permissions page (e.g. for a senior operator who also
    // does materials receiving). My Stuff + dashboard are forced on by
    // normalizeProfilePermissions; listed here so they show up in role
    // defaults too.
    'dashboard',
    'myPortal',
    'jobs',                // see today's assigned work
    'productionSchedule',  // see today's queue
    'production',          // log production output
    'waste',               // log waste
    'paper',               // log paper usage
    'finishedStock',       // see what they've produced
    'cleaningLogs',        // sanitation between batches
    'maintenance',         // report machine issues
    'stockRequests',       // request tape, gloves, tools, etc.
    'dies',                // see what die to grab off the rack
    'stereos',             // confirm the stereo on the press
  ],
  sales: [
    'dashboard',
    'myPortal',
    'salesDesk',
    'salesPipeline',
    'leadAnalytics',
    'dies',
    'stereos',
    'productionSchedule',
    'materialRequirements',
    'cashFlow',
    'morningDigest',
    'reorderReminders',
    'leads',
    'calculator',
    'workTicket',
    'quotes',
    'artwork',
    'deliveryNotes',
    'invoices',
    'productionSpecs',
    'jobs',
    'products',
    'priceList',
    'tradedGoods',
    'stockStatements',
    'foodSafetyControlCentre',
    'haccpRegister',
    'nonConformance',
    'sopRegister',
    'staffTraining',
    'ppeControl',
    'pestControl',
    'foreignObjectControl',
    'toolBladeControl',
    'firstAidRegister',
    'incidentRegister',
    'drillRegister',
    'toolboxTalks',
    'sheCommittee',
    'visitorLog',
    'traceability',
    'complaints',
    'reports',
  ],
  artwork: [
    'dashboard',
    'artwork',
    'deliveryNotes',
    'productionSpecs',
    'quotes',
    'jobs',
    'products',
    'reports',
  ],
  driver: [
    // Phase 60 — Driver role. PWA-only experience: when the driver logs in
    // on a phone they land directly on Driver POD with no sidebar. Nothing
    // else is in their menu — they don't see Clients, Invoices, jobs etc.
    // My Stuff is force-added by normalizeProfilePermissions so they can
    // still see their own warnings/leave/payslips.
    'driverPod',
  ],
  accounts: [
    'dashboard',
    'invoices',
    'invoiceInbox',
    'chartOfAccounts',
    'accountsPayable',
    'sarsCentre',
    'financeSummary',
    'customerStatements',
    'employees',
    'payroll',
    'staffLeave',
    'staffLoans',
    'irp5Centre',
    'expenseClaims',
    'stockStatements',
    'bankRec',
    'generalLedger',
    'financialStatements',
    'financialProjections',
    'fixedAssets',
    'currencies',
    'agedDebtors',
    'profitability',
    'salesPipeline',
    'productionSchedule',
    'materialRequirements',
    'cashFlow',
    'morningDigest',
    'foodSafetyControlCentre',
    'haccpRegister',
    'nonConformance',
    'sopRegister',
    'staffTraining',
    'ppeControl',
    'pestControl',
    'foreignObjectControl',
    'toolBladeControl',
    'firstAidRegister',
    'incidentRegister',
    'drillRegister',
    'toolboxTalks',
    'sheCommittee',
    'visitorLog',
    'traceability',
    'complaints',
    'deliveryNotes',
    'productionSpecs',
    'quotes',
    'clients',
    'pricing',
    'priceList',
    'jobs',
    'products',
    'customerStock',
    'dispatch',
    'calculator',
    'reports',
  ],
};

export function normalizeProfilePermissions(role: UserRole, permissions?: string[] | null): View[] {
  const source = Array.isArray(permissions) && permissions.length
    ? permissions
    : ROLE_DEFAULT_VIEWS[role];
  // Phase 103.7 hardening — strip 'osConnector' on read so legacy admin
  // rows that still have it stored no longer ever land in the user's
  // resolved permission list. API Access lives inside Settings → API
  // access tab now. The sidebar already filters this view, but stripping
  // here closes the loop at the data layer too.
  const valid: View[] = source.filter(
    (permission): permission is View => permission in VIEW_LABELS && permission !== 'osConnector',
  );
  // Drivers get the tightest possible scope: just driverPod + myPortal so
  // they can still see their own warnings/payslips. No dashboard, no
  // sidebar tabs. They are expected to use the PWA on their phone.
  if (role === 'driver') {
    const driverRequired = new Set<View>(['driverPod', 'myPortal']);
    driverRequired.forEach((permission) => {
      if (!valid.includes(permission)) valid.push(permission);
    });
    return Array.from(new Set(valid));
  }
  const required = new Set<View>(['dashboard', 'myPortal']);
  if (role === 'admin') {
    required.add('permissions');
    required.add('settings');
    required.add('notices');
    // Phase 101 / 102 / 103 — added after the initial admin profiles were
    // saved. Force them in so existing admin rows in Supabase pick them up
    // without anyone re-saving permissions manually.
    required.add('inbox');
    required.add('adminHub');
    required.add('auditProgrammes');
    // Front-office surfaces that also need force-adding for existing admins.
    required.add('visitorLog');
    required.add('visitorKiosk');
    required.add('visitorApprovals');
  }
  required.forEach((permission) => {
    if (!valid.includes(permission)) {
      valid.push(permission);
    }
  });
  return Array.from(new Set(valid));
}

/**
 * Phase 60 — Default landing view per role. Drivers land directly on the
 * POD capture screen (skipping the dashboard entirely) so the PWA feels
 * like a single-purpose phone app. Other roles still default to dashboard.
 */
export function defaultLandingViewForRole(role: UserRole): View {
  if (role === 'driver') return 'driverPod';
  return 'dashboard';
}

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidget, string> = {
  stats: 'Top Stats',
  monthSummary: 'Month Summary',
  alerts: 'Exceptions & Alerts',
  quickCalculator: 'Quick Calculator',
  finishedStock: 'Finished Stock On Hand',
  partsAttention: 'Parts Needing Attention',
  recentJobs: 'Recent Jobs',
  recentMaterials: 'Recent Material Receipts',
  recentWaste: 'Recent Waste Entries',
  recentProduction: 'Recent Production Logs',
  recentPaper: 'Recent Paper Logs',
  recentDispatch: 'Recent Dispatches',
  wasteByReason: 'Waste By Reason',
  topPaper: 'Top Paper Types Used',
  leadsAttention: 'Leads Needing Attention',
};

export const ROLE_DEFAULT_DASHBOARD_WIDGETS: Record<UserRole, DashboardWidget[]> = {
  admin: Object.keys(DASHBOARD_WIDGET_LABELS) as DashboardWidget[],
  ops: [
    'stats',
    'monthSummary',
    'alerts',
    'leadsAttention',
    'finishedStock',
    'partsAttention',
    'recentJobs',
    'recentMaterials',
    'recentWaste',
    'recentProduction',
    'recentPaper',
    'recentDispatch',
    'wasteByReason',
    'topPaper',
  ],
  production: [
    'stats',
    'monthSummary',
    'alerts',
    'finishedStock',
    'partsAttention',
    'recentJobs',
    'recentMaterials',
    'recentWaste',
    'recentProduction',
    'recentPaper',
    'recentDispatch',
    'wasteByReason',
    'topPaper',
  ],
  sales: [
    'stats',
    'monthSummary',
    'alerts',
    'leadsAttention',
    'quickCalculator',
    'recentJobs',
    'recentDispatch',
  ],
  artwork: [
    'stats',
    'monthSummary',
    'alerts',
    'recentJobs',
  ],
  accounts: [
    'stats',
    'monthSummary',
    'alerts',
    'leadsAttention',
    'recentJobs',
    'recentDispatch',
  ],
  // Drivers never see the dashboard — they land on driverPod directly. We
  // ship an empty widget set anyway so the type-system is happy.
  driver: [],
};

export function normalizeDashboardWidgets(role: UserRole, widgets?: string[] | null): DashboardWidget[] {
  const source = Array.isArray(widgets) && widgets.length
    ? widgets
    : ROLE_DEFAULT_DASHBOARD_WIDGETS[role];
  return Array.from(
    new Set(
      source.filter((widget): widget is DashboardWidget => widget in DASHBOARD_WIDGET_LABELS),
    ),
  );
}

export type JobStatus =
  | 'Draft'
  | 'Awaiting Artwork'
  | 'Awaiting Proof Approval'
  | 'Ready for Production'
  | 'In Production'
  | 'Quality Check'
  | 'Ready for Dispatch'
  | 'In Storage'
  | 'Partially Dispatched'
  | 'Completed';
// Phase 79 — expanded for materials receiving: chemicals (litres/ml),
// raw materials (ton/grams), generic count units (pieces). All existing
// values are kept so old rows stay valid.
export type QuantityUnit =
  | 'kg' | 'g' | 'ton'
  | 'litres' | 'ml'
  | 'sheets' | 'rolls'
  | 'units' | 'pieces';
export const QUANTITY_UNITS: QuantityUnit[] = [
  'kg', 'g', 'ton', 'litres', 'ml', 'sheets', 'rolls', 'units', 'pieces',
];
export type ProductSupplyType = 'Manufactured' | 'Purchased';
export type ProductCategory = 'Paper Bags' | 'Paper Cups' | 'Food Boxes' | 'Wet Wipes' | 'Other Packaging';
export type PricingTierType = 'Wholesale' | 'Retail' | 'Ecommerce' | 'Custom';
export type FinishedStockStatus = 'In Storage' | 'Reserved' | 'Ready to Dispatch' | 'Dispatched';
export type ApprovalStatus = 'Not Sent' | 'Awaiting Approval' | 'Approved' | 'Changes Requested';
export type StockReservationStatus = 'Not Checked' | 'Reserved' | 'Production Needed';

export type WasteReason =
  | 'Setup waste'
  | 'Running waste'
  | 'Misprint'
  | 'Machine issue'
  | 'Paper issue'
  | 'Damaged stock'
  | 'Operator error'
  | 'Other';

export type FscClaimType = 'None' | 'FSC Mix' | 'FSC Recycled' | 'FSC 100%';

// ----- Phase 82 — First Aid Register -----
export type FirstAidInjuryType =
  | 'Cut / Laceration'
  | 'Burn'
  | 'Bruise / Contusion'
  | 'Sprain / Strain'
  | 'Fracture'
  | 'Eye injury'
  | 'Chemical exposure'
  | 'Heat / Cold'
  | 'Foreign body'
  | 'Other';

export const FIRST_AID_INJURY_TYPES: FirstAidInjuryType[] = [
  'Cut / Laceration', 'Burn', 'Bruise / Contusion', 'Sprain / Strain',
  'Fracture', 'Eye injury', 'Chemical exposure', 'Heat / Cold',
  'Foreign body', 'Other',
];

export type FirstAidCertLevel = 'L1' | 'L2' | 'L3' | 'Not certified';
export const FIRST_AID_CERT_LEVELS: FirstAidCertLevel[] = ['L1', 'L2', 'L3', 'Not certified'];

/** Site first-aider register. OHS Act requires at least 1 certified first
 *  aider per 50 employees in any workplace where >5 employees work. We
 *  track cert expiry so HR gets a renewal reminder before the cert lapses. */
export interface DesignatedFirstAider {
  id: string;
  /** Optional pointer to the Employee record if this person is on payroll. */
  employeeId: string;
  fullName: string;
  certLevel: FirstAidCertLevel;
  certNumber: string;
  certIssuedDate: string;
  certExpiryDate: string;
  phoneNumber: string;
  notes: string;
  active: boolean;
}

export interface FirstAidEntry {
  id: string;
  /** FAR-YYYYMM-NNN — auto-generated. */
  entryNumber: string;
  /** Optimistic concurrency token. */
  version?: number;
  /** Server-side update timestamp. */
  rowUpdatedAt?: string;
  createdAt: string;
  incidentDate: string;
  incidentTime: string;
  /** Where the incident happened — machine name, area, room. */
  location: string;
  // ----- Who was hurt -----
  isVisitor: boolean;
  employeeId: string;
  employeeName: string;
  visitorName: string;
  visitorCompany: string;
  // ----- Injury -----
  injuryType: FirstAidInjuryType;
  bodyPart: string;
  description: string;
  // ----- Treatment -----
  treatmentGiven: string;
  treatedByName: string;
  /** The first aider's cert number — must match a DesignatedFirstAider record. */
  treatedByCertNumber: string;
  // ----- Injury on Duty (Compensation Fund / RMA reporting) -----
  isIod: boolean;
  iodReportNumber: string;
  iodReportedDate: string;
  // ----- Follow-up -----
  followUpRequired: boolean;
  followUpNotes: string;
  resolvedDate: string;
  // ----- Evidence -----
  witnessName: string;
  photoUrls?: string[];
  /** Employee signature confirming treatment was administered + accepted. */
  signatureDataUrl?: string;
  notes: string;
  /** Phase 98 — what came out of the first aid box. SMETA auditors and
   *  the SHE rep both want to see this so the box can be restocked and
   *  consumption patterns reviewed. */
  dressingsUsed?: FirstAidDressing[];
}

/** Phase 98 — one item taken from the first aid box per incident. */
export interface FirstAidDressing {
  item: string;        // 'Plaster', 'Crepe bandage 75mm', 'Wound dressing #3', etc.
  quantity: number;
  notes?: string;
}

export interface FirstAidEntryFormState {
  incidentDate: string;
  incidentTime: string;
  location: string;
  isVisitor: boolean;
  employeeId: string;
  employeeName: string;
  visitorName: string;
  visitorCompany: string;
  injuryType: FirstAidInjuryType;
  bodyPart: string;
  description: string;
  treatmentGiven: string;
  treatedByName: string;
  treatedByCertNumber: string;
  isIod: boolean;
  iodReportNumber: string;
  iodReportedDate: string;
  followUpRequired: boolean;
  followUpNotes: string;
  resolvedDate: string;
  witnessName: string;
  photoUrls?: string[];
  signatureDataUrl?: string;
  notes: string;
  /** Phase 98 — dressings used from the first aid box. */
  dressingsUsed: FirstAidDressing[];
}

export interface FirstAidFilters {
  search: string;
  month: string;
  iodOnly: boolean;
}

export interface DesignatedFirstAiderFormState {
  employeeId: string;
  fullName: string;
  certLevel: FirstAidCertLevel;
  certNumber: string;
  certIssuedDate: string;
  certExpiryDate: string;
  phoneNumber: string;
  notes: string;
  active: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 95 — SMETA Safety Registers.
 *
 * Five live registers that SMETA audits expect. Each is a per-event log
 * (rather than reference docs which live in Doc Vault).
 *
 *   - IncidentRegister     = injury / property / IOD / near-miss
 *   - DrillRegister        = fire & evacuation drills
 *   - ToolboxTalkRegister  = safety talks with attendee signatures
 *   - SheCommitteeMeeting  = SHE committee minutes + action items
 *   - HiraRegister         = per-process hazard ID + risk assessment (later)
 *
 * Shared shape: id, code, date, narrative, photos, who logged it,
 * sign-off. Action items on incidents and SHE meetings tie into the
 * existing NCR/CAPA system so corrective actions don't get orphaned.
 * ────────────────────────────────────────────────────────────────────────*/

export type IncidentType = 'Near miss' | 'First aid case' | 'Medical treatment' | 'Lost time injury' | 'Property damage' | 'IOD' | 'Environmental';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IncidentEntry {
  id: string;
  incidentNumber: string;
  createdAt: string;
  incidentDate: string;
  incidentTime: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  /** Injured person — links to Employee where possible, otherwise free text
   *  (visitor, contractor, etc.). */
  personEmployeeId?: string;
  personName: string;
  personRole: string;
  isContractor: boolean;
  bodyPartAffected: string;
  location: string;
  description: string;
  immediateAction: string;
  treatmentGiven: string;
  treatedByName: string;
  /** First-aider on duty if applicable. */
  firstAiderEmployeeId?: string;
  witnessName: string;
  rootCause: string;
  /** Corrective action plan free-text + optional link to NCR record. */
  correctiveAction: string;
  linkedNcrId?: string;
  /** WCl.2 (COIDA) submission tracking. */
  iodSubmitted: boolean;
  iodReference: string;
  /** Returned to work date — drives the LTI day count. */
  daysLost: number;
  returnToWorkDate: string;
  /** Closure. */
  closedAt: string;
  closedByName: string;
  /** Sign-off + evidence. */
  reporterName: string;
  reporterSignatureUrl: string;
  photoUrls: string[];
  notes: string;
}

export interface IncidentFormState {
  incidentNumber: string;
  incidentDate: string;
  incidentTime: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  personEmployeeId: string;
  personName: string;
  personRole: string;
  isContractor: boolean;
  bodyPartAffected: string;
  location: string;
  description: string;
  immediateAction: string;
  treatmentGiven: string;
  treatedByName: string;
  firstAiderEmployeeId: string;
  witnessName: string;
  rootCause: string;
  correctiveAction: string;
  linkedNcrId: string;
  iodSubmitted: boolean;
  iodReference: string;
  daysLost: string;
  returnToWorkDate: string;
  closedAt: string;
  closedByName: string;
  reporterName: string;
  reporterSignatureUrl: string;
  photoUrls: string[];
  notes: string;
}

/* ─── Fire / Evacuation Drill register ───────────────────────────────── */
export type DrillType = 'Fire' | 'Evacuation' | 'Bomb threat' | 'Chemical spill' | 'Other';
export type DrillOutcome = 'Successful' | 'Concerns' | 'Failed';

export interface DrillEntry {
  id: string;
  drillNumber: string;
  createdAt: string;
  drillDate: string;
  drillType: DrillType;
  scenario: string;
  /** Times in HH:MM. */
  alarmRaisedTime: string;
  evacuationCompleteTime: string;
  /** Total time in minutes — computed but persisted. */
  totalMinutes: number;
  headcountExpected: number;
  headcountAtMuster: number;
  missingPersons: string;
  /** Who facilitated. */
  fireMarshalName: string;
  fireMarshalSignatureUrl: string;
  observations: string;
  lessonsLearned: string;
  outcome: DrillOutcome;
  photoUrls: string[];
  notes: string;
}

export interface DrillFormState {
  drillNumber: string;
  drillDate: string;
  drillType: DrillType;
  scenario: string;
  alarmRaisedTime: string;
  evacuationCompleteTime: string;
  headcountExpected: string;
  headcountAtMuster: string;
  missingPersons: string;
  fireMarshalName: string;
  fireMarshalSignatureUrl: string;
  observations: string;
  lessonsLearned: string;
  outcome: DrillOutcome;
  photoUrls: string[];
  notes: string;
}

/* ─── Toolbox Talks register ─────────────────────────────────────────── */
export interface ToolboxTalkAttendee {
  /** Optional link to Employee record. */
  employeeId?: string;
  name: string;
  signatureUrl: string;
}

export interface ToolboxTalkEntry {
  id: string;
  talkNumber: string;
  createdAt: string;
  talkDate: string;
  topic: string;
  /** Free-text key points covered. */
  keyPoints: string;
  /** Q&A / discussion that came up. */
  discussion: string;
  facilitatorName: string;
  facilitatorSignatureUrl: string;
  durationMinutes: number;
  attendees: ToolboxTalkAttendee[];
  photoUrls: string[];
  notes: string;
}

export interface ToolboxTalkFormState {
  talkNumber: string;
  talkDate: string;
  topic: string;
  keyPoints: string;
  discussion: string;
  facilitatorName: string;
  facilitatorSignatureUrl: string;
  durationMinutes: string;
  attendees: ToolboxTalkAttendee[];
  photoUrls: string[];
  notes: string;
}

/* ─── SHE Committee meeting register ─────────────────────────────────── */
export type SheActionStatus = 'Open' | 'In progress' | 'Done' | 'Cancelled';

export interface SheActionItem {
  id: string;
  description: string;
  ownerName: string;
  dueDate: string;
  status: SheActionStatus;
  closedDate: string;
  closeoutNote: string;
}

export interface SheMeetingAttendee {
  employeeId?: string;
  name: string;
  role: string;
  signatureUrl: string;
}

export interface SheMeetingEntry {
  id: string;
  meetingNumber: string;
  createdAt: string;
  meetingDate: string;
  meetingTime: string;
  chairpersonName: string;
  scribeName: string;
  attendees: SheMeetingAttendee[];
  agenda: string;
  minutes: string;
  actionItems: SheActionItem[];
  nextMeetingDate: string;
  photoUrls: string[];
  notes: string;
}

export interface SheMeetingFormState {
  meetingNumber: string;
  meetingDate: string;
  meetingTime: string;
  chairpersonName: string;
  scribeName: string;
  attendees: SheMeetingAttendee[];
  agenda: string;
  minutes: string;
  actionItems: SheActionItem[];
  nextMeetingDate: string;
  photoUrls: string[];
  notes: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 103.2 — Audit Programme register.
 *
 * One row per audit programme JomoPak runs against: SMETA, FSC Chain of
 * Custody, FSSC 22000, ISO 9001, SARS PAYE inspection, etc. Each row
 * tracks who audits us, when we were last audited, how often it recurs,
 * and when the next one is due. The inbox producer reads this list and
 * emits "Audit due in 30 days" events as the date approaches.
 *
 * Simpler than the SARS calendar — audits aren't on a fixed gov't
 * schedule. They're "we got audited last June, next one's around then."
 * Cadence in months is the dial; nextDueDate is computed from
 * lastAuditedDate + cadenceMonths but can be overridden manually.
 * ────────────────────────────────────────────────────────────────────────*/
export type AuditProgrammeStatus = 'Active' | 'Paused' | 'Lapsed';

export interface AuditProgramme {
  id: string;
  /** Short code, e.g. 'SMETA', 'FSC-COC', 'FSSC', 'ISO9001'. */
  code: string;
  /** Display name. */
  name: string;
  /** Which body audits us — Sedex, SGS, BSI, FSC South Africa, etc. */
  auditingBody: string;
  /** Optional contact email for the audit body — drives reminder emails later. */
  contactEmail: string;
  /** ISO date of the last completed audit. */
  lastAuditedDate: string;
  /** How often the audit recurs. SMETA + FSC + FSSC = 12, ISO surveillance
   *  = 12, ISO recertification = 36. Drives the auto-computed nextDueDate. */
  cadenceMonths: number;
  /** Optional manual override — when set, takes precedence over the
   *  auto-computed (lastAuditedDate + cadenceMonths). Useful when the
   *  auditor schedules a specific date. */
  nextDueDateOverride?: string;
  /** Notes — scope, prep checklist, certificate number. */
  notes: string;
  /** Active / paused / lapsed. Paused programmes don't emit inbox events. */
  status: AuditProgrammeStatus;
  /** Optional URL to the latest audit report / certificate. */
  certificateUrl: string;
  certificateExpiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditProgrammeFormState {
  code: string;
  name: string;
  auditingBody: string;
  contactEmail: string;
  lastAuditedDate: string;
  cadenceMonths: string;
  nextDueDateOverride: string;
  notes: string;
  status: AuditProgrammeStatus;
  certificateUrl: string;
  certificateExpiryDate: string;
}

/** Compute the next-due date from cadence, respecting the manual override. */
export function computeAuditNextDue(a: AuditProgramme): string {
  if (a.nextDueDateOverride) return a.nextDueDateOverride;
  if (!a.lastAuditedDate) return '';
  const d = new Date(a.lastAuditedDate);
  d.setMonth(d.getMonth() + (a.cadenceMonths || 12));
  return d.toISOString().slice(0, 10);
}


/** Tri-state food-safe flag used on materials, chemicals, and derived FG batches.
 *  Defaults to 'unknown' so receivers/operators must explicitly pick. */
export type FoodSafeStatus = 'yes' | 'no' | 'unknown';
export type ProductionLogType = 'Slitting' | 'Flexo Printing' | 'Bag Printing' | 'Bag Making';
export type HandleType = 'None' | 'Flat Handle' | 'Rope Handle' | 'Roll Handle';
export type PrintMethod = 'Plain' | 'Auto' | 'Screen Print' | 'Flexo' | 'Digital Print' | 'Litho';
export type SupplyFormat = 'Boxes' | 'Flat Packed' | 'Bundles' | 'Palletized' | 'Loose';
export type CommercialReleaseStatus = 'Pending' | 'Accepted' | 'Invoiced' | 'Cleared for Production';
export type PaymentRequirement = '50% Deposit' | 'Full Payment' | 'Credit Terms';
export type PaymentStatus = 'Pending' | '50% Paid' | 'Full Payment Received' | 'Credit Limit Applied';
export type CreditCheckStatus = 'Not Required' | 'Within Limit' | 'Blocked';
export type PaperAllocationStatus = 'Not Checked' | 'In Stock' | 'Order Required' | 'Ordered';
export type ProcurementOrderStatus = 'Requested' | 'Ordered' | 'Received' | 'Cancelled';
export type ArtworkPreparationStatus = 'Print Ready' | 'Ready but Not Print Ready' | 'Needs Design';
export type SupplierType = 'Paper' | 'Packaging' | 'Spares' | 'General';
export type QuoteStatus = 'Draft' | 'Quoted' | 'Approved' | 'Converted to Job' | 'Lost';

/**
 * Phase 119 — Customer payment models.
 *
 * JomoPak runs four distinct AR flows depending on the customer:
 *
 *  - 'depositThenDraw' — Customer pays a deposit upfront, then we invoice
 *    against the deposit as we deliver. Common with wholesale customers
 *    on long-running orders. The deposit sits as a liability (we owe
 *    them stock) until it's drawn down.
 *
 *  - 'fiftyFifty' — 50% Tax Invoice to start production, 50% on
 *    completion / before delivery. Default for new commercial orders
 *    where we want skin in the game before tying up paper + machine time.
 *
 *  - 'prepayThenDraw' — Customer pays full order value upfront, takes
 *    stock as and when they need it. Stock-holding customers usually
 *    work this way. We hold finished goods on their behalf and draw
 *    against their prepayment on each release.
 *
 *  - 'cod' — Cash on delivery. Customer pays in full at collection,
 *    no deposit, no terms.
 *
 *  - 'standard' — Normal trade terms (e.g. 30 days). No deposit. Used
 *    for established credit customers.
 *
 * The model lives on the Client record so sales doesn't have to remember
 * which customer needs which treatment; new Jobs / Quotes / Invoices for
 * that client pre-fill the right flow.
 */
export type CustomerPaymentModel =
  | 'depositThenDraw'
  | 'fiftyFifty'
  | 'prepayThenDraw'
  | 'cod'
  | 'standard';

export const CUSTOMER_PAYMENT_MODEL_LABELS: Record<CustomerPaymentModel, string> = {
  depositThenDraw: 'Deposit, then invoice as we deliver',
  fiftyFifty: '50% to start, 50% on completion',
  prepayThenDraw: 'Prepay full order, draw stock as needed',
  cod: 'Cash on delivery',
  standard: 'Standard terms (no deposit)',
};

/**
 * Phase 119 — Why a particular deposit was received. Drives the auto-
 * generated pro-forma wording + the dashboard categorisation. Aligns
 * with CustomerPaymentModel but is per-deposit so a 50/50 client can
 * still take a one-off prepayment without us having to change their
 * customer record.
 */
export type DepositPurpose =
  | 'jobDeposit'      // a per-order deposit (depositThenDraw)
  | 'fiftyFirstHalf'  // first 50% of a 50/50 invoice
  | 'fiftySecondHalf' // second 50% — recorded against the same job
  | 'prepayment'      // full prepay for a stock-holding customer
  | 'topUp'           // top-up to an existing client deposit balance
  | 'other';

/**
 * Phase 119 — A deposit received from a customer.
 *
 * Deposits live in their own ledger because they're a balance-sheet
 * liability ("we owe this customer goods or a refund"), NOT revenue.
 * Revenue only recognises when we deliver and invoice — the allocation
 * engine handles that automatically.
 *
 * Numbering:
 *  - depositNumber — internal sequence (DEP-2026-001)
 *  - proformaNumber — issued at deposit receipt if a pro-forma was
 *    generated (PF-2026-001). SARS-compliant clients can switch this
 *    to a Tax-Invoice-on-receipt later via Settings.
 *  - receiptNumber — confirmation that money has been received.
 *
 * Earmarking:
 *  - jobId / quoteId — optional. Set on per-order deposits. Lets us see
 *    "this R50k is for Job JC-241" rather than just a client balance.
 *    Unset for prepayment / top-up deposits that float at client level.
 *
 * Allocation tracking:
 *  - allocations[] — every drawdown from this deposit. The remaining
 *    balance is amount - sum(allocations.appliedAmount).
 *  - The engine never deletes allocations; reversals are recorded as
 *    isReversal entries with a negative appliedAmount so the audit
 *    trail stays intact.
 */
export interface CustomerDeposit {
  id: string;
  depositNumber: string;
  version?: number;
  rowUpdatedAt?: string;
  // Who paid
  clientId: string;
  clientName: string;
  // When and how much
  receivedDate: string;            // YYYY-MM-DD — bank credit date
  amount: number;                  // gross amount received (incl. VAT if pro-forma)
  currency: CurrencyCode;
  paymentMethod: string;           // EFT / Card / Cash / Cheque
  bankReference: string;           // for bank-rec matching
  // Linkage to the originating pro-forma. Both id (stable for the
  // allocation engine) and number (for human display + bank ref matching).
  proformaId: string;              // empty if not tied to a specific pro-forma
  proformaNumber: string;          // empty if not tied to a specific pro-forma
  receiptNumber: string;
  // Earmarking — optional, lets us tie the deposit to a specific work item
  jobId: string;
  jobNumber: string;
  quoteId: string;
  quoteNumber: string;
  purpose: DepositPurpose;
  // Allocation state (computed from allocations[])
  allocations: DepositAllocation[];
  /** sum(allocations.appliedAmount) — denormalised for fast list rendering. */
  allocatedAmount: number;
  /** amount - allocatedAmount — sometimes negative if a reversal overruns. */
  remainingAmount: number;
  // Lifecycle
  status: DepositStatus;
  // Audit
  capturedByName: string;
  capturedAt: string;
  notes: string;
}

/**
 * Phase 119 — A drawdown allocating part of a deposit against an Invoice
 * or Delivery Note. Recorded on the deposit's allocations[] array.
 *
 * One deposit can be split across many invoices (typical for a prepay
 * customer who collects in chunks). One invoice can pull from many
 * deposits (a top-up + an earlier deposit might both fund a single
 * collection). FIFO by default — oldest deposit drained first — but the
 * allocation engine lets admins manually retarget if needed.
 */
export interface DepositAllocation {
  id: string;
  depositId: string;
  // What the deposit was applied against — exactly one of these is set.
  invoiceId: string;
  invoiceNumber: string;
  deliveryNoteId: string;
  deliveryNoteNumber: string;
  appliedAmount: number;           // positive for normal allocation, negative for reversals
  appliedAt: string;
  appliedByName: string;
  /** How this allocation was created. */
  reason: 'autoOnInvoice' | 'autoOnDelivery' | 'manual' | 'reversal' | 'refund';
  isReversal: boolean;
  notes: string;
}

export type DepositStatus =
  | 'Open'        // received, allocations < amount
  | 'Allocated'   // fully drawn down
  | 'Refunded'    // refunded back to customer (rare)
  | 'Cancelled';  // captured in error, voided

/**
 * Phase 119 — Tax treatment for a customer deposit. Defaults to
 * 'proforma' for new dashboards (matches what most SA factories do) but
 * Settings can flip the default to 'taxInvoiceOnReceipt' if the
 * accountant determines deposit volumes trigger SARS deemed-supply
 * rules. Per-deposit override lets us flip individual ones too.
 *
 * - 'proforma' — Pro-forma invoice + receipt issued. Tax Invoice raised
 *   on delivery for the full amount, with a "less deposit received" line.
 * - 'taxInvoiceOnReceipt' — Tax Invoice raised on deposit receipt
 *   (output VAT triggers immediately). Final invoice applies the
 *   deposit and only charges VAT on the balance.
 */
export type DepositTaxTreatment = 'proforma' | 'taxInvoiceOnReceipt';

/**
 * Phase 117 — "Waiting on" blockers for Quotes & Jobs.
 *
 * Real factory pattern: a quote sits half-done because someone is waiting
 * for a die cost from the toolmaker, a board cost from the paper rep, or
 * artwork approval from the client. Same on jobs — production parked
 * waiting for tooling, paper, or food-safe sign-off. Without a place to
 * capture the blocker, the job gets forgotten and a follow-up never gets
 * chased.
 *
 * Each work item (Quote, Job) carries an array of these. Resolved ones
 * stick around for the audit trail; only unresolved ones drive the UI
 * chips, filters, and overdue alerts.
 */
export type WaitingOnParty =
  | 'Supplier'
  | 'Client'
  | 'Toolmaker'
  | 'Paper rep'
  | 'Internal'
  | 'Other';

export interface WaitingOnBlocker {
  id: string;
  /** Who we're waiting on — categorises the blocker for filtering. */
  party: WaitingOnParty;
  /** Optional named contact / company ("Polipack", "John at Sappi").
   *  Free text so the rep doesn't have to be a Supplier record. */
  partyName?: string;
  /** What we're waiting for ("Die cost for 2-up cutter", "Board cost
   *  for 100gsm kraft", "Artwork approval"). Required so the blocker
   *  is actually useful when re-read later. */
  reason: string;
  /** Expected-by date. Past this date with no resolution → marked as
   *  overdue in the UI and surfaced on the dashboard. Optional in case
   *  the rep has no commitment yet. */
  expectedBy?: string;
  createdAt: string;
  createdBy?: string;
  /** Set when the blocker is cleared. Resolved blockers stay in the
   *  array as an audit trail but stop showing in chips/filters. */
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}
export type LeadStatus = 'New' | 'Qualified' | 'Awaiting Info' | 'Quoted' | 'Won' | 'Lost';
/** Phase 99 — Niched lead sources.
 *  Lets us answer "which channel converts best?" instead of lumping
 *  everything into 'Social Media'. Legacy 'Social Media' rows still
 *  display (forward-compatible) but new selections pick a specific platform.
 *
 *  Add new sources here as you spin up new channels (LinkedIn, Trade Show, etc.). */
export type LeadSource =
  // Digital — paid + organic
  | 'TikTok'
  | 'Instagram'
  | 'Facebook'
  | 'LinkedIn'
  | 'Google'
  | 'Website'
  // Direct contact
  | 'WhatsApp'
  | 'Phone'
  | 'Email'
  | 'SMS'
  | 'Cold Call'
  // In-person
  | 'Walk-in'
  | 'Trade Show'
  | 'Networking Event'
  // Relationship
  | 'Word of Mouth'
  | 'Referral'
  | 'Existing Customer'
  // Catch-all + legacy
  | 'Social Media'   // kept for back-compat with rows tagged generically
  | 'Other';

export const LEAD_SOURCES: LeadSource[] = [
  // Order = display order in the dropdown. Most-used at the top.
  'WhatsApp', 'Phone', 'Email', 'Walk-in',
  'Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Google', 'Website',
  'Cold Call', 'SMS',
  'Trade Show', 'Networking Event',
  'Word of Mouth', 'Referral', 'Existing Customer',
  'Social Media', 'Other',
];

/** Phase 99 — grouped sources for the form picker so the segmented control
 *  doesn't drown in 19 options. Each group renders as a header + buttons. */
export const LEAD_SOURCE_GROUPS: Array<{ label: string; sources: LeadSource[] }> = [
  { label: 'Direct', sources: ['WhatsApp', 'Phone', 'Email', 'SMS', 'Walk-in', 'Cold Call'] },
  { label: 'Social', sources: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn'] },
  { label: 'Search & web', sources: ['Google', 'Website'] },
  { label: 'In-person', sources: ['Trade Show', 'Networking Event'] },
  { label: 'Relationship', sources: ['Word of Mouth', 'Referral', 'Existing Customer'] },
  { label: 'Other', sources: ['Social Media', 'Other'] },
];

export type LeadActivityType = 'Note' | 'Call' | 'Email' | 'WhatsApp' | 'Meeting' | 'Quote Sent' | 'Sample Sent' | 'Follow-up' | 'Other';

export const LEAD_ACTIVITY_TYPES: LeadActivityType[] = [
  'Note', 'Call', 'Email', 'WhatsApp', 'Meeting', 'Quote Sent', 'Sample Sent', 'Follow-up', 'Other',
];

/** One row in the lead's activity log. Append-only — every touchpoint stays
 *  on record. Replaces the single free-text `notes` field as the primary
 *  history of the relationship. */
export interface LeadActivity {
  id: string;
  /** ISO datetime when the activity occurred. */
  at: string;
  type: LeadActivityType;
  byName: string;
  summary: string;
}

export type LostReason =
  | 'Price too high'
  | 'No response from customer'
  | 'Lost to competitor'
  | 'Out of stock / lead time'
  | 'Not a fit for us'
  | 'Customer changed mind'
  | 'Sample rejected'
  | 'Other';

export const LOST_REASONS: LostReason[] = [
  'Price too high',
  'No response from customer',
  'Lost to competitor',
  'Out of stock / lead time',
  'Not a fit for us',
  'Customer changed mind',
  'Sample rejected',
  'Other',
];
export type MachineStatus = 'Active' | 'Maintenance' | 'Offline';
export type ArtworkStage = 'Awaiting Artwork' | 'Artwork Received' | 'Proof Sent' | 'Approved' | 'Changes Requested';
export type CertificationType = 'FSC' | 'ISO' | 'Food Safety' | 'Other';
export type CertificationStatus = 'Active' | 'Expiring Soon' | 'Expired';
export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP';
export type InventoryItemType = 'Finished Goods' | 'Spare Part' | 'Material Lot';
export type InventoryMovementType = 'Received' | 'Issued to Job' | 'Transferred' | 'Adjusted' | 'Returned';
export type PaymentMethod = 'EFT' | 'Cash' | 'Card' | 'Credit Terms' | 'Other';
export type StorageFeeType = 'None' | 'Per Month' | 'Per Pallet' | 'Per Unit';
export type DeliveryChargePolicy = 'Charge Every Release' | 'Client Collection' | 'Charge By Zone' | 'Included By Agreement';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
export type InvoiceTermsType = 'Full Payment Up Front' | '50% Deposit' | 'Net 7' | 'Net 14' | 'Net 30' | 'Net 60' | 'On Delivery';
export type StockHoldingStatus = 'Not Applicable' | 'Active' | 'Fully Released' | 'Expired';
export type DeliveryReceiptMode = 'Signed' | 'Collected' | 'Pending';
export type ProductionSpecStatus = 'Draft' | 'Approved' | 'In Production' | 'Completed' | 'Archived';

export interface SupplierContact {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface SupplierCertification {
  id: string;
  type: CertificationType;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
  reviewFrequencyMonths: number;
  reminderDays: number;
  status: CertificationStatus;
  notes: string;
}

export interface SupplierProductLink {
  id: string;
  productId: string;
  productName: string;
  supplierSku: string;
  defaultPrice: number;
  currency: CurrencyCode;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  lastQuotedDate: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  /** Phase 57 — optional pointer back to the unified Company record. */
  companyId?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  contacts: SupplierContact[];
  address: string;
  billingAddress: string;
  city: string;
  country: string;
  website: string;
  supplierType: SupplierType;
  certificateCode: string;
  accountNumber: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  currency: CurrencyCode;
  isAlsoClient: boolean;
  linkedClientId: string;
  linkedClientName: string;
  lastCheckInDate: string;
  nextReviewDate: string;
  reviewFrequencyMonths: number;
  internalOwner: string;
  certifications: SupplierCertification[];
  suppliedProducts: SupplierProductLink[];
  notes: string;
  active: boolean;
}

export interface Machine {
  id: string;
  name: string;
  code: string;
  department: string;
  processType: string;
  status: MachineStatus;
  notes: string;
  active: boolean;
  /** Phase 5.5 maintenance gating. When the maintenance status is one
   *  of the blocking values, food-packaging jobs assigned to this machine
   *  cannot be cleared for production. */
  maintenanceStatus?: 'OK' | 'Service Due' | 'Critical Issue' | 'Out of Service';
  /** Date of the last service / maintenance event. */
  lastServicedDate?: string;
  /** Date the next service is due. */
  nextServiceDate?: string;
  /** Free-text description of any open maintenance issue. */
  openMaintenanceIssue?: string;
}

/** Check if a machine is fit to run a food-packaging job. */
export function isMachineFoodSafetyBlocked(m: Machine): boolean {
  if (!m.maintenanceStatus) return false;
  return m.maintenanceStatus === 'Critical Issue' || m.maintenanceStatus === 'Out of Service';
}

export interface QuoteEstimate {
  id: string;
  quoteNumber: string;
  quickbooksEstimateNumber: string;
  createdAt: string;
  quoteDate: string;
  linkedLeadId: string;
  linkedLeadNumber: string;
  salesOwnerName: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  pricingTierId: string;
  pricingTierName: string;
  paperRateId: string;
  paperRateName: string;
  costProfileId: string;
  costProfileName: string;
  quantity: number;
  sizeSpec: string;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: number;
  unitCost: number;
  quotedUnitPrice: number;
  totalQuote: number;
  status: QuoteStatus;
  notes: string;
  /** Phase 34 — customer-facing note printed on the quote. */
  customerNote?: string;
  /** Phase 118.1 — when this quote was created from the Calculator,
   *  every row from that single save shares the same batchId. Lets the
   *  Quotes page re-stitch a multi-line quote for re-print / re-email.
   *  Single-line quotes (saved from the old form) leave this undefined. */
  calculatorBatchId?: string;
  /** Phase 118.1 — frozen calculator state at save-time, scoped to
   *  THIS row's line(s). Keeping it per-row makes deletes safe (drop
   *  one row → others still re-stitch) and search/list pages don't
   *  need to know about batching. The re-print stitcher reads every
   *  sibling row with the same batchId and concatenates their snapshot
   *  .lines arrays in quoteNumber order (-A, -B, -C, ...) to rebuild
   *  the original CalculatorState. The 'shared' header is identical
   *  on every sibling row (same client / date / cost profile / etc.). */
  calculatorSnapshot?: CalculatorState;
  /** Phase 117 — Blockers parking this quote ("waiting for die cost from
   *  toolmaker"). Resolved entries stay for audit; unresolved ones drive
   *  list chips, filters, and dashboard alerts. */
  waitingOn?: WaitingOnBlocker[];
}

/** Phase 99 — One line in a lead's enquiry.
 *  Clients often ask for multiple things in one quote ("can you do 5000
 *  brown paper bags + 2000 printed boxes + a roll stock?"). One row per
 *  item, each with its own product, qty, spec note. The legacy single
 *  productId / requestedQuantity on Lead are still populated from the
 *  first item so existing reports keep working. */
export interface LeadItem {
  id: string;
  productId: string;
  productName: string;
  /** Free text — for new items that don't exist in Products yet. */
  description: string;
  requestedQuantity: number;
  unit: string;       // 'units' / 'kg' / 'rolls' etc.
  /** Optional per-item spec the client mentioned ("white kraft, 80gsm, flat
   *  handle"). The actual production spec gets pinned down on the Job. */
  specNote: string;
  /** Per-item estimated value — feeds the lead's total estimated value. */
  estimatedValue: number;
}

export interface Lead {
  id: string;
  leadNumber: string;
  createdAt: string;
  enquiryDate: string;
  clientId: string;
  clientName: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  source: LeadSource;
  /** Phase 99 — when source is 'Referral' / 'Word of Mouth' / 'Existing
   *  Customer', who pointed them at us. Helps thank referrers. */
  sourceDetail?: string;
  assignedTo: string;
  /** Legacy single-product fields — first LeadItem populates these on save
   *  so existing pipeline + reports keep working. */
  productId: string;
  productName: string;
  requestedQuantity: number;
  dueDate: string;
  status: LeadStatus;
  quickbooksEstimateNumber: string;
  linkedQuoteId: string;
  linkedQuoteNumber: string;
  notes: string;
  /** Phase 7 CRM upgrade — next-touchpoint date, drives the overdue flag. */
  nextFollowUpDate?: string;
  /** Append-only timeline of every touchpoint with the customer. */
  activities?: LeadActivity[];
  /** When status moves to Lost, capture why so we can analyse win rate. */
  lostReason?: LostReason | '';
  /** Estimated value of the opportunity — used in pipeline rollup. */
  estimatedValue?: number;
  /** Phase 99 — multi-item enquiry. Empty/undefined for legacy single-item
   *  rows. New leads always populate this. */
  items?: LeadItem[];
  /** Phase 99 — has the client returned the New Client Detail Form? Sales
   *  tick this when the PDF comes back; the bell can chase it after N days. */
  onboardingFormReceived?: boolean;
  onboardingFormReceivedDate?: string;
  /** Phase 99 — admin/sales note when the form was sent but not yet returned. */
  onboardingFormNote?: string;
}

export interface ArtworkRecord {
  id: string;
  artworkNumber: string;
  createdAt: string;
  jobId: string;
  jobNumber: string;
  clientId: string;
  clientName: string;
  artworkReceivedDate: string;
  proofSentDate: string;
  approvalDate: string;
  stage: ArtworkStage;
  changesRequested: string;
  notes: string;
}

export interface CustomerStockRelease {
  id: string;
  releaseNumber: string;
  createdAt: string;
  releaseDate: string;
  clientId: string;
  clientName: string;
  finishedGoodsStockId: string;
  finishedGoodsStockNumber: string;
  jobId: string;
  jobNumber: string;
  quantityReleased: number;
  quantityUnit: QuantityUnit;
  destination: string;
  notes: string;
}

export interface DeliveryNoteLineItem {
  id: string;
  description: string;
  productName: string;
  stockNumber: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  dispatchRecordId: string;
  customerStockReleaseId: string;
  /** Optional link back to the invoice line this delivery is fulfilling. */
  invoiceLineItemId?: string;
}

/**
 * Phase 126.1 — Paper purpose.
 *
 * What this paper is BOUGHT FOR. Drives the calculator's "what paper do I
 * use here" picker (e.g. when quoting a bag's body the picker only shows
 * Paper Bags + Slitting; when quoting a handle patch the picker only shows
 * Handle Patch). 'Other' is the catch-all so we never block adding a new
 * line just because the taxonomy hasn't caught up.
 */
/**
 * Phase 126.3 — End-uses only. Slitting is NOT an end-use, it's a
 * process we do to a reel to prepare it for one of these. Tracked via
 * `requiresSlitting` flag on the rate instead.
 *
 * A single paper rate can legitimately serve MULTIPLE end-uses
 * (e.g. 70gsm Unbleached Kraft → both bag bodies and handle patches),
 * so the rate stores `useCases: PaperUseCase[]` not a single value.
 */
export type PaperUseCase =
  | 'Paper Bags'
  | 'Handle Patches'
  | 'Rope'
  | 'Greaseproof Paper'
  | 'Liner'
  | 'Other';

export const PAPER_USE_CASES: PaperUseCase[] = [
  'Paper Bags',
  'Handle Patches',
  'Rope',
  'Greaseproof Paper',
  'Liner',
  'Other',
];

/** Paper form factor — reels (jumbo, slit on our side) vs sheets (pre-cut). */
export type PaperForm = 'Reels' | 'Sheets';

/**
 * Phase 126.4 — Sappi (and other big mills) price by their dispatch
 * warehouse. JomoPak sources from whichever region has stock, so each
 * (paper × region) combo gets its own rate row. Calculator picks the
 * cheapest available for the matching public label.
 */
export type PaperRegion = 'DBN' | 'JHB' | 'CT' | 'Other';

export const PAPER_REGIONS: PaperRegion[] = ['DBN', 'JHB', 'CT', 'Other'];

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 127.1 — Consumable Rate (Glue, Tape, Ink, Stitching wire, etc.)
 * ----------------------------------------------------------------------
 * Parallel structure to PaperRate. Holds the cost/charge/supplier-private
 * pricing for anything that goes INTO a bag that isn't paper. Same admin
 * confidentiality rules: staff see only `publicLabel`, never supplier or
 * the per-unit cost. The existing per-bag rates in CostProfile keep
 * working for cheap consumables you don't want to itemise.
 * ───────────────────────────────────────────────────────────────────────*/

export type ConsumableCategory =
  | 'Glue'
  | 'Tape'
  | 'Stitching Wire'
  | 'Ink'
  | 'Solvent'
  | 'Other';

export const CONSUMABLE_CATEGORIES: ConsumableCategory[] = [
  'Glue',
  'Tape',
  'Stitching Wire',
  'Ink',
  'Solvent',
  'Other',
];

/** Unit the consumable is bought / consumed in. */
export type ConsumableUnit =
  | 'kg'
  | 'L'
  | 'roll'
  | 'case'
  | 'bag'
  | 'drum'
  | 'pail'
  | 'unit';

export const CONSUMABLE_UNITS: ConsumableUnit[] = [
  'kg', 'L', 'roll', 'case', 'bag', 'drum', 'pail', 'unit',
];

export interface ConsumableRate {
  id: string;
  /** Private internal nickname. */
  name: string;
  /** PRIVATE. */
  supplierId: string;
  supplierName: string;
  /** PRIVATE. Supplier product code. */
  productCode?: string;
  /** What category of consumable. Drives admin grouping. */
  category: ConsumableCategory;
  /** Unit the cost/charge is quoted in. */
  unit: ConsumableUnit;
  /** PUBLIC label — the only identifier non-admin staff see. */
  publicLabel?: string;
  /** PRIVATE. Cost we pay per unit. */
  costPerUnit: number;
  /** PRIVATE. Charge per unit used by the calculator. Falls back to
   *  costPerUnit if not set. */
  chargePerUnit?: number;
  /** PRIVATE. Dispatch region (where multi-region pricing applies). */
  region?: PaperRegion;
  validFrom?: string;
  validTo?: string;
  notes: string;
  active: boolean;
}

export interface ConsumableRateFormState {
  name: string;
  supplierId: string;
  productCode: string;
  category: ConsumableCategory | '';
  unit: ConsumableUnit | '';
  publicLabel: string;
  costPerUnit: string;
  chargePerUnit: string;
  region: PaperRegion | '';
  validFrom: string;
  validTo: string;
  notes: string;
  active: boolean;
}

export interface ConsumableRateFilters {
  search: string;
  active: string;
  category: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 128.1 — UNIFIED MATERIAL.
 *
 * Single concept that replaces PaperRate + ConsumableRate. Every cost is
 * just a material — paper, glue, tape, ink, anything. White-label
 * customers can add categories without code changes.
 *
 * Paper-specific fields (gsm / form / useCases) stay as OPTIONAL columns
 * — they're filled in only when category === 'Paper'. The calculator
 * engine reads them with that filter.
 * ───────────────────────────────────────────────────────────────────────*/

/** Category is a free string so white-label customers can add their own
 *  ("LDPE Resin", "Master Batch"). We seed it with the same options
 *  PaperRate + ConsumableRate covered. */
export type MaterialRateCategory =
  | 'Paper'
  | 'Glue'
  | 'Tape'
  | 'Stitching Wire'
  | 'Ink'
  | 'Solvent'
  | 'Other';

export const MATERIAL_RATE_CATEGORIES: MaterialRateCategory[] = [
  'Paper', 'Glue', 'Tape', 'Stitching Wire', 'Ink', 'Solvent', 'Other',
];

/** Unit covers paper-style (ton) and consumable-style (kg/L/roll/case). */
export type MaterialRateUnit =
  | 'ton' | 'kg' | 'L' | 'roll' | 'case' | 'bag' | 'drum' | 'pail' | 'unit' | 'sheet' | 'm';

export const MATERIAL_RATE_UNITS: MaterialRateUnit[] = [
  'ton', 'kg', 'L', 'roll', 'case', 'bag', 'drum', 'pail', 'unit', 'sheet', 'm',
];

export interface MaterialRate {
  id: string;
  /** Private internal nickname (for admin reference). */
  name: string;
  /** PUBLIC label — the only identifier non-admin staff see. */
  publicLabel?: string;
  /** What category of material. Free string for white-label extensibility,
   *  but typed as MaterialRateCategory for autocomplete on the form. */
  category: string;
  /** Unit the cost / charge is quoted in. */
  unit: MaterialRateUnit;
  /** PRIVATE — supplier identity. */
  supplierId: string;
  supplierName: string;
  /** PRIVATE — supplier product code (e.g. "PrimePak U"). */
  productCode?: string;
  /** PRIVATE — supplier dispatch region (e.g. DBN/JHB/CT for SA mills). */
  region?: PaperRegion;
  /** PRIVATE — what we pay the supplier per unit. */
  costPerUnit: number;
  /** PRIVATE — what the calculator charges per unit. Falls back to cost. */
  chargePerUnit?: number;
  /** Contract validity dates. */
  validFrom?: string;
  validTo?: string;
  notes: string;
  active: boolean;
  /* ── PAPER-SPECIFIC fields (optional). Only filled when
   *    category === 'Paper'. White-label customers ignore. ── */
  gsm?: string;
  paperType?: string;
  form?: PaperForm;
  useCases?: PaperUseCase[];
}

export interface MaterialRateFormState {
  name: string;
  publicLabel: string;
  category: string;
  unit: MaterialRateUnit | '';
  supplierId: string;
  productCode: string;
  region: PaperRegion | '';
  costPerUnit: string;
  chargePerUnit: string;
  validFrom: string;
  validTo: string;
  notes: string;
  active: boolean;
  // Paper-specific (only filled when category === 'Paper').
  gsm: string;
  paperType: string;
  form: PaperForm | '';
  useCases: PaperUseCase[];
}

export interface MaterialRateFilters {
  search: string;
  category: string;
  active: string;
}

export interface PaperRate {
  id: string;
  name: string;
  /**
   * Phase 126.1 — PRIVATE (admin + pricingEditor only). Supplier identity
   * is treated as confidential. Staff using the calculator must NOT see
   * which supplier a paper comes from.
   */
  supplierId: string;
  supplierName: string;
  /**
   * Phase 126.1 — Supplier's product grade / code (e.g. "PrimePak U").
   * Private. Useful for re-ordering and for the paper-margin analytic.
   */
  productCode?: string;
  /**
   * Phase 126.3 — End-uses this paper covers. A single rate can serve
   * multiple (e.g. 70gsm Unbleached Kraft → Paper Bags AND Handle
   * Patches). Drives the calculator's grouped picker. Kept the
   * single-value field below for backwards-compat with already-saved
   * rows; new rows write to `useCases`.
   */
  useCases?: PaperUseCase[];
  /** Phase 126.1 — DEPRECATED. Kept so legacy rows still display. */
  useCase?: PaperUseCase;
  /**
   * Phase 126.3 — Process flag. Slitting is what we DO to a reel to
   * prepare it for an end-use. Tracked separately from useCases so the
   * production team knows which rolls need to go through the slitter
   * before being booked into a job. Private — production planning only.
   */
  requiresSlitting?: boolean;
  /**
   * Phase 126.1 — Reels (slit on our side from jumbo) vs Sheets (pre-cut).
   */
  form?: PaperForm;
  /**
   * Phase 126.4 — Supplier dispatch region. Sappi prices by warehouse
   * (DBN / JHB / CT). Private — admin only. Calculator picks the
   * cheapest matching region when multiple are available.
   */
  region?: PaperRegion;
  /**
   * Phase 126.1 — PUBLIC label. The ONLY identifier non-admin staff see
   * in the calculator. e.g. "70gsm Unbleached Kraft", "40gsm Greaseproof".
   * If empty, the public picker falls back to gsm + paperType.
   */
  publicLabel?: string;
  paperType: string;
  gsm: string;
  /**
   * Phase 126.1 — Legacy "price per ton" column. Now stores the COST
   * (what we pay the supplier). Kept as `pricePerTon` for DB compatibility;
   * the new `chargePerTon` below is what the calculator actually uses.
   */
  pricePerTon: number;
  /**
   * Phase 126.1 — What the calculator charges per ton. Admin sets this
   * above `pricePerTon` to absorb fuel / forex / supplier hikes between
   * contract renewals. The difference (charge − cost) is paper margin
   * and only shows on Aman's profile.
   * Defaults to pricePerTon if not set so legacy rows still calc.
   */
  chargePerTon?: number;
  /**
   * Phase 126.1 — Optional contract validity. Lets us flag a rate as
   * stale on the admin page when the contract window expires.
   */
  validFrom?: string;
  validTo?: string;
  notes: string;
  active: boolean;
}

export interface CostProfile {
  id: string;
  name: string;
  wastagePercent: number;
  defaultMarginPercent: number;
  baseGlueCostPerBag: number;
  hotMeltCostPerBag: number;
  flatHandleCostPerBag: number;
  ropeHandleCostPerBag: number;
  rollHandleCostPerBag: number;
  screenPrintSetupCost: number;
  screenPrintCostPerColor: number;
  flexoInkCostPer1000PerColor: number;
  plateCostPerColor: number;
  labourCostPer1000: number;
  packagingCostPer1000: number;
  transportCostPerJob: number;
  sideSeamAllowanceMm: number;
  topFoldAllowanceMm: number;
  bottomFoldAllowanceMm: number;
  flexoThresholdQty: number;
  active: boolean;
  notes: string;
}

export interface PricingTier {
  id: string;
  name: string;
  type: PricingTierType;
  defaultMarginPercent: number;
  brandingMarginPercent: number;
  notes: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Work-ticket / detailed costing masters (phase 15).
 *
 * The bag-centric `CostProfile` above lumps a lot of variables together for
 * the lightweight quote calculator. The factory's actual work-ticket (per
 * the Jomopak production print-out) breaks costs into these distinct
 * categories: INK / PAPER / PRESS / GUILLOTINE / PRE-PRESS / FINISHING /
 * DESPATCH. Each has its own master table so the quoter is just confirming
 * already-correct numbers, not retyping them.
 *
 * We keep the legacy `CostProfile` intact to avoid breaking the calculator
 * page; the work-ticket engine consumes these new masters instead.
 * ────────────────────────────────────────────────────────────────────────*/

/** A single ink (e.g. PMS 485, Process Cyan, Varnish). Cost is per kilogram
 *  of ink; coverage tells us how many m² that kg can cover at standard
 *  GSM laydown so we can convert sheet area → kg → currency cleanly. */
export interface InkRate {
  id: string;
  name: string;
  inkType: 'Process' | 'Pantone' | 'Varnish' | 'Metallic' | 'Other';
  supplierId: string;
  supplierName: string;
  /** Currency per kg of ink as supplied. */
  costPerKg: number;
  /** Square metres of full-coverage print produced by 1kg of ink. Defaults
   *  hover around 80–120 m²/kg for litho/flexo at typical laydown. */
  coverageSqmPerKg: number;
  /** Default coverage assumption for *jobs* using this ink, in percent of
   *  the printed area. Used when the quoter hasn't typed a per-job number. */
  defaultCoveragePercent: number;
  notes: string;
  active: boolean;
}

/** A finishing operation that runs after press: lamination, die-cut, glue,
 *  fold, spot-UV, embossing, etc. We support both per-1000 piecework rates
 *  and per-hour machine rates so simple ops stay simple. */
export interface FinishingOperation {
  id: string;
  name: string;
  /** Free-text — e.g. "Bobst die-cutter", "Heidelberg folder/gluer". */
  machineName: string;
  rateType: 'PerThousand' | 'PerHour';
  /** Rate value in the currency unit implied by `rateType`. */
  rate: number;
  /** Setup / make-ready charge per job, in currency. */
  setupCost: number;
  /** Optional run-speed hint, used for time estimates on print breakdowns. */
  runSpeedPerHour: number;
  notes: string;
  active: boolean;
}

/** Press (printing machine) cost. `ratePerHour` is the all-in operating
 *  cost (operator + power + depreciation). `makeReady` numbers let us roll
 *  setup waste into the paper bill automatically. */
export interface PressRate {
  id: string;
  /** Optional link to a machine record (so changing the press updates here). */
  machineId: string;
  machineName: string;
  /** Currency / hour. */
  ratePerHour: number;
  /** Sheets consumed during make-ready (dropped before the live run). */
  makeReadySheets: number;
  /** Make-ready time before the run begins, in minutes. */
  makeReadyMinutes: number;
  /** Steady-state production speed (sheets / hour) — lets us estimate run time. */
  runSpeedSheetsPerHour: number;
  notes: string;
  active: boolean;
}

/** Plate cost master — applies to litho / flexo. One row per format; the
 *  quote multiplies by the colour count. */
export interface PlateCost {
  id: string;
  name: string;
  /** e.g. "B2", "B1", "Flexo sleeve 800mm". */
  format: string;
  /** Currency per colour (one plate = one colour). */
  costPerColor: number;
  /** Origination/proof set-up charge per job (one-off, not per colour). */
  originationCost: number;
  notes: string;
  active: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Work ticket itself.
 * The breakdown matches the printed work-ticket layout one-for-one so the
 * print view is just a thin styled rendering of the data we already store.
 * Each line on the ticket is materialised as a row in the relevant array
 * (InkLine / FinishingLine / etc) so we can show line items with quantity,
 * unit cost, and extension — same as the paper printout.
 * ────────────────────────────────────────────────────────────────────────*/

export type WorkTicketStatus = 'Draft' | 'Costed' | 'Approved' | 'Sent' | 'Won' | 'Lost' | 'Converted to Job';

export interface WorkTicketInkLine {
  id: string;
  inkRateId: string;
  inkName: string;
  /** Coverage (%) of printed area this ink occupies on the job. */
  coveragePercent: number;
  /** Resolved at compute-time: kg of ink the job will use. */
  estimatedKg: number;
  /** Resolved at compute-time: cost in currency. */
  cost: number;
}

export interface WorkTicketFinishingLine {
  id: string;
  finishingOperationId: string;
  operationName: string;
  /** How many units this op processes — sheets, bags, bundles, etc. */
  quantity: number;
  /** Resolved cost in currency. */
  cost: number;
  /** Free-text override, used when the quoter typed a custom number. */
  override: boolean;
}

/** Press / guillotine breakdown share the same shape: time × rate. */
export interface WorkTicketMachineLine {
  id: string;
  /** For PRESS: pressRateId. For GUILLOTINE: a separate machine entry. */
  pressRateId: string;
  machineName: string;
  /** Estimated make-ready + run minutes. */
  minutes: number;
  /** Estimated sheets passed through this machine. */
  sheets: number;
  cost: number;
}

export interface WorkTicket {
  id: string;
  ticketNumber: string;
  /** Optimistic concurrency token (phase 14). */
  version?: number;
  rowUpdatedAt?: string;
  createdAt: string;
  ticketDate: string;
  /** Optional links — a ticket may exist before the formal quote/job. */
  linkedQuoteId: string;
  linkedQuoteNumber: string;
  linkedJobId: string;
  linkedJobNumber: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  /** Free-text description as it appears at the top of the printed ticket. */
  productDescription: string;
  /** Spec block — printed verbatim on the ticket. */
  sizeSpec: string;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: number;
  /** Run quantity (units / bags / boxes — whatever the job is). */
  quantity: number;
  /** Total sheets running through the press, including make-ready. */
  sheets: number;
  /** Sheet size used (e.g. "640 × 920"). Free-text for now. */
  sheetSize: string;
  /** Paper rate looked up at compute time. Stored for audit clarity. */
  paperRateId: string;
  paperRateName: string;
  paperType: string;
  paperGsm: string;
  paperKg: number;
  paperCost: number;
  /** Plate / pre-press master used. */
  plateCostId: string;
  plateCostName: string;
  prePressCost: number;
  /** Per-category line items + computed sub-totals. */
  inkLines: WorkTicketInkLine[];
  inkSubtotal: number;
  pressLines: WorkTicketMachineLine[];
  pressSubtotal: number;
  guillotineLines: WorkTicketMachineLine[];
  guillotineSubtotal: number;
  finishingLines: WorkTicketFinishingLine[];
  finishingSubtotal: number;
  /** Despatch / packing / delivery. Single-line for now. */
  despatchCost: number;
  despatchNotes: string;
  /** Rolled-up totals. */
  totalCost: number;
  marginPercent: number;
  sellingPricePerUnit: number;
  sellingPriceTotal: number;
  status: WorkTicketStatus;
  notes: string;
  /** Set when the ticket is auto-priced from masters; cleared if the quoter
   *  hand-edits any line. Lets us flag stale tickets when masters change. */
  pricedFromMasters: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  clientId: string;
  /** Phase 103 — accountType expanded.
   *  - internal       = staff with a login
   *  - client         = customer portal user (sees their orders / stock-holding)
   *  - external_partner = outsourced firm (HR / Legal / Accounting / Marketing /
   *    Audit) given scoped access. See `partnerScope`. */
  accountType: 'internal' | 'client' | 'external_partner';
  /** Phase 103 — when accountType = 'external_partner', defines which
   *  business functions they can see. Multi-select so a firm doing both
   *  HR + Payroll gets ['hr', 'accounting']. */
  partnerScope?: PartnerScope[];
  /** Phase 103 — per-user inbox category gate. When set, the Inbox only
   *  shows events from these categories. Empty/undefined = the user's role
   *  default (admin gets all; others get nothing until granted). */
  inboxCategories?: InboxCategory[];
  /** Phase 103.4 — explicit grant for an external_partner with the
   *  'accounting' scope to upload supplier invoices into the OCR / Invoice
   *  Inbox. Defaults false. Internal accounts staff don't need this — they
   *  always can. */
  canPostInvoices?: boolean;
  publicDisplayName: string;
  publicDisplayRole: string;
  role: UserRole;
  /** Phase 91 — explicit grant for the pricing / discount tools on the
   *  Calculator. Admin always has it. The CEO can grant this to specific
   *  staff (e.g. a senior sales lead) so they can see costs, set margin,
   *  and quote discounts. Defaults false. */
  pricingEditor?: boolean;
  permissions: View[];
  dashboardWidgets: DashboardWidget[];
  /** Phase 40 — staff portal. Links this login to an Employee row so the
   *  staff member can see their own payslips, training, SOPs, and notices. */
  linkedEmployeeId?: string;
  /** Phase 66 — granular stock-security flags.
   *  - stockVisibility: when 'restricted', qty-on-hand + unit cost are
   *    redacted on the Spares page (and elsewhere) so the user sees
   *    'In stock' / 'Out of stock' instead of exact counts + values.
   *    Stops untrusted users from calculating skim opportunities.
   *  - approvalPin: 4-digit PIN required to approve high-value stock
   *    issues. Only set for foremen / ops / admin. Stored as plain text
   *    inside the workspace because the workspace itself is the
   *    security boundary; not a public secret. */
  stockVisibility?: 'full' | 'restricted';
  approvalPin?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 57 — Unified Company / Business Partner architecture
 * ----------------------------------------------------------------------
 * A real-world business entity (e.g. "Sappi (Pty) Ltd"). One Company can
 * play multiple roles at once — Client, Supplier, Manufacturer, Logistics
 * provider, etc. Shared data (legal name, VAT, contacts, address, banking,
 * default currency) lives here ONCE. Role-specific data (credit limit on
 * the client side, lead times on the supplier side) lives on per-role
 * Client / Supplier records that link back via companyId.
 *
 * Separate Company records when:
 *   • legally separate entities (different VAT registration)
 *   • branches with separate banking / billing
 * Otherwise: one Company, multiple roles.
 * ──────────────────────────────────────────────────────────────────────── */

export type CompanyRole = 'Client' | 'Supplier' | 'Manufacturer' | 'Logistics' | 'Partner' | 'Other';
export const COMPANY_ROLES: CompanyRole[] = ['Client', 'Supplier', 'Manufacturer', 'Logistics', 'Partner', 'Other'];

export interface CompanyContact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface Company {
  id: string;
  code: string;
  createdAt: string;
  /** Trading / friendly name. */
  name: string;
  /** Registered legal name (e.g. "Sava Online (Pty) Ltd t/a Jomopack"). */
  legalName: string;
  registrationNumber: string;
  vatNumber: string;
  /** Roles this company plays. Multi-select. Drives where the company
   *  shows up in pickers (client dropdown / supplier dropdown / both). */
  roles: CompanyRole[];
  /** Primary contact for general correspondence. */
  primaryContact: CompanyContact;
  /** Extra contacts (accounts, dispatch, technical, etc.). */
  additionalContacts: CompanyContact[];
  // Shared physical/postal address — both invoices to them AND deliveries
  // from them use this. Per-role overrides are stored on the role profile.
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  // Shared banking — used for both paying them (when they're a supplier)
  // and confirming inbound payments (when they're a client). Per-role
  // overrides allowed on the Client / Supplier records.
  bankName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  accountType: string;
  /** Default trading currency (if foreign). */
  defaultCurrency: string;
  /** Default payment terms (e.g. "30 days", "On receipt"). */
  defaultPaymentTerms: string;
  industry: string;
  website: string;
  notes: string;
  active: boolean;
  /** Pointers to the role-specific profile records, if any have been created.
   *  Set when admin clicks "Create Client profile" / "Create Supplier profile"
   *  on the Companies page. Existing Clients/Suppliers can be back-linked. */
  linkedClientId?: string;
  linkedSupplierId?: string;
}

export interface CompanyFormState {
  name: string;
  legalName: string;
  registrationNumber: string;
  vatNumber: string;
  roles: CompanyRole[];
  primaryContactName: string;
  primaryContactRole: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  bankName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  accountType: string;
  defaultCurrency: string;
  defaultPaymentTerms: string;
  industry: string;
  website: string;
  notes: string;
  active: boolean;
}

export interface CompanyFilters {
  search: string;
  role: string;
  active: 'all' | 'yes' | 'no';
}

export interface Client {
  id: string;
  /** Phase 57 — optional pointer back to the unified Company record.
   *  Lets banking, contacts, address etc. be sourced from there instead
   *  of duplicated on the client. Empty for legacy / pre-Phase-57 clients. */
  companyId?: string;
  name: string;
  /** Optimistic concurrency token (phase 14). See JobCard.version. */
  version?: number;
  /** Server-side update timestamp. */
  rowUpdatedAt?: string;
  companyName: string;
  /** Phase 35 — staff member who owns/manages this client (display name).
   *  Drives the rep-handover tool. Optional so legacy records load. */
  accountManagerName?: string;
  code: string;
  pricingTierId: string;
  pricingTierName: string;
  clientType: PricingTierType;
  brandingDefault: boolean;
  defaultMarginPercent: number;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: string;
  primaryPaymentMethod: PaymentMethod;
  currency: CurrencyCode;
  invoiceLanguage: string;
  vatNumber: string;
  openingBalance: number;
  openingBalanceAsOf: string;
  accountHold: boolean;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  contactName: string;
  contactEmail: string;
  phoneNumber: string;
  mobileNumber: string;
  otherPhone: string;
  faxNumber: string;
  ccEmail: string;
  bccEmail: string;
  website: string;
  marketingConsent: boolean;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  stockHoldingEnabled: boolean;
  stockHoldingAgreementSigned: boolean;
  stockHoldingAgreementSignedDate: string;
  stockHoldingAgreementReference: string;
  stockHoldingReviewDate: string;
  /** Phase 60 — opt out of automatic client-facing notifications when a
   *  POD is captured (default behaviour is to send a delivery confirmation
   *  email to contactEmail). Some clients prefer to be contacted by their
   *  account manager directly rather than receive system emails. */
  notifyClientOnDelivery?: boolean;
  /** Phase 116 — Per-client logo preference. References an id in
   *  AppSettings.brandLogos[]. When any customer-facing document is
   *  printed for this client (invoice, DN, quote, stock statement,
   *  customer statement), the resolver picks this logo over the dashboard
   *  default. Empty / unset = use the global default. Internal documents
   *  (warnings, payslips, UI-19) always use the dashboard default. */
  preferredLogoId?: string;
  /** Phase 119 — Which AR model this customer runs on. Drives default
   *  deposit % on new jobs, the dashboard chase logic, the overdraw
   *  gate on Invoices/DNs, and the wording on auto-generated pro-formas.
   *  Defaults to 'standard' (normal trade terms) so existing customers
   *  stay unchanged until explicitly classified. */
  paymentModel?: CustomerPaymentModel;
  /** Phase 119 — Default deposit % expected from this customer on new
   *  orders. 50 for 50/50, 100 for prepay, blank for standard. Used by
   *  the Quote → Job promote handler to set paymentRequirement and by
   *  the dashboard to compute "expected deposit not yet received". */
  defaultDepositPercent?: number;
  /** Phase 76 — does this client want FSC claimed on their outputs by default?
   *  Auto-fills the per-job fscClaimEnabled flag on job creation. Sales can
   *  still override per job. Defaults to false (no claim) so we never claim
   *  FSC accidentally. */
  defaultFscClaim?: boolean;
  /** Phase 5.6 — customer-specific food safety requirements. Optional so
   *  existing records load without forcing a migration. */
  foodSafeDeclarationRequired?: boolean;
  batchNumberRequiredOnDeliveryNote?: boolean;
  coaRequired?: boolean;
  productSpecRequired?: boolean;
  specialPackingRules?: string;
  specialDeliveryRules?: string;
  approvedMaterialRestrictions?: string;
  creditAgreementSigned: boolean;
  creditAgreementSignedDate: string;
  creditAgreementReference: string;
  storageGracePeriodDays: number;
  maxStoragePeriodDays: number;
  storageFeeApplies: boolean;
  storageFeeType: StorageFeeType;
  storageFeeRate: number;
  depositRequiredPercent: number;
  minimumMonthlyReleaseQuantity: number;
  minimumMonthlyReleaseUnit: QuantityUnit;
  minimumReleaseQuantity: number;
  deliveryChargePolicy: DeliveryChargePolicy;
  releaseApprovalRequired: boolean;
  portalEnabled: boolean;
  portalViewQuotes: boolean;
  portalViewInvoices: boolean;
  portalViewStock: boolean;
  portalRequestRelease: boolean;
  notes: string;
  active: boolean;
}

/**
 * Standard-product pricing spec (phase 33).
 *
 * A standard catalogue product carries a fixed specification so its cost can
 * be recomputed automatically from the live cost masters (paper rate + cost
 * profile) — exactly the same maths the ad-hoc Calculator uses, but saved
 * against the product instead of typed in each time. The Price List view turns
 * this spec into cost-plus prices at the base quantity and each MOQ break.
 *
 * All numeric fields are numbers (not form strings); the form state mirrors
 * them as strings. Optional on Product so legacy records load untouched.
 */
export interface ProductPricingSpec {
  bagWidthMm: number;
  bagHeightMm: number;
  gussetMm: number;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: number;
  printAreaCm2: number;
  coverageBand: PrintCoverageBand;
  /** Which paper rate (paper type + gsm + price/ton) this product is made from. */
  paperRateId: string;
  /** Which cost profile (wastage, labour, glue, allowances, …) applies. */
  costProfileId: string;
  /** How plates are billed for this product's standard run. */
  plateBilling: PlateBillingMode;
  /** The product's own default margin %, applied unless a tier/client overrides. */
  baseMarginPercent: number;
  /** Headline order quantity the standard price is quoted at. */
  baseQuantity: number;
  /** Additional MOQ break quantities to show in the price list (ascending). */
  breakQuantities: number[];
}

export interface Product {
  id: string;
  /** Phase 59 — uploaded photos (Supabase Storage public URLs). */
  photoUrls?: string[];
  name: string;
  sku: string;
  category: ProductCategory;
  supplyType: ProductSupplyType;
  defaultSupplierId: string;
  defaultSupplierName: string;
  brandingAllowed: boolean;
  defaultUnit: QuantityUnit;
  defaultPaperType: string;
  defaultGsm: string;
  notes: string;
  active: boolean;
  /** Phase 33 — when true this product appears in the Price List and carries a
   *  pricing spec. Optional so existing products load without a migration. */
  pricingEnabled?: boolean;
  /** Phase 33 — the standard costing spec used to compute cost-plus prices. */
  pricingSpec?: ProductPricingSpec;
  /** Phase 85 — bag dimensions live on the Product as the single source of
   *  truth. Pulled into pricing + jobs + finished stock automatically. */
  bagWidthMm?: string;
  bagHeightMm?: string;
  gussetMm?: string;
  handleType?: 'None' | 'Flat Handle' | 'Rope Handle' | 'Roll Handle';
  /** Phase 85 — the units in which this product is offered for sale. Each
   *  carries the number of base units (bags / pieces) it contains, so a
   *  customer can order "1 pallet" and the system knows that's 12,000 bags. */
  salesUnits?: ProductSalesUnit[];
}

/** Phase 85 — a packing/sale unit available for a product. */
export interface ProductSalesUnit {
  id: string;
  /** Display name — Pallet, Box, Bale, Case, Single, Roll, etc. */
  name: string;
  /** How many base units (bags / pieces) this packing unit contains. */
  quantityInBaseUnit: number;
  /** Optional descriptor (e.g. "Brown shrink wrap, blue strapping"). */
  notes?: string;
}

/**
 * A point-in-time, approvable snapshot of a product's price (phase 33).
 *
 * Standard prices must be versioned, auditable and private: this records the
 * margin used, the cost assumptions in force at the time (so we can see *why*
 * a price was what it was), the resulting cost-plus prices per break quantity,
 * and who approved it and when. The Price List flags a product as "out of
 * date" when the live recomputed cost drifts from the latest approved version.
 */
export type ProductPriceVersionStatus = 'Draft' | 'Approved' | 'Superseded';

export interface ProductPriceBreakSnapshot {
  quantity: number;
  /** Production cost per unit at this quantity (margin excluded). */
  unitCost: number;
  /** Cost-plus sell price per unit at the version's base margin. */
  unitPrice: number;
  /** One-off plate setup fee at this quantity (0 when amortised). */
  plateSetupFee: number;
}

export interface ProductPriceVersion {
  id: string;
  productId: string;
  productName: string;
  /** Monotonic per-product version number (1, 2, 3 …). */
  versionNumber: number;
  status: ProductPriceVersionStatus;
  baseMarginPercent: number;
  /** Snapshot of the cost assumptions used, for the audit trail. */
  assumptions: {
    paperRateId: string;
    paperRateName: string;
    paperType: string;
    gsm: string;
    pricePerTon: number;
    costProfileId: string;
    costProfileName: string;
    wastagePercent: number;
  };
  /** Computed prices per break quantity at approval/snapshot time. */
  breaks: ProductPriceBreakSnapshot[];
  note: string;
  createdAt: string;
  createdByName: string;
  approvedAt: string;
  approvedByName: string;
}

/**
 * Client-specific override for a standard product's price (phase 33).
 *
 * Either a margin override (recompute cost-plus at this margin for the client)
 * or a fixed agreed unit price. Optional minimum quantity scopes the deal to a
 * break. Private — never published to the Aman OS connector.
 */
export type ClientProductPriceMode = 'margin' | 'fixedPrice';

export interface ClientProductPrice {
  id: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  mode: ClientProductPriceMode;
  /** Used when mode = 'margin'. */
  marginPercent: number;
  /** Used when mode = 'fixedPrice'. */
  fixedUnitPrice: number;
  /** Optional: this deal applies from this quantity upward. 0 = all quantities. */
  minQuantity: number;
  note: string;
  active: boolean;
  createdAt: string;
  createdByName: string;
}

export interface JobCard {
  id: string;
  /** Phase 59 — proof / sample / finished-product photos. */
  photoUrls?: string[];
  /** Phase 62 — die / stereo tooling used on this job. Bumps the
   *  tool's runCount + lastUsedAt automatically on save. */
  dieToolId?: string;
  dieToolCode?: string;
  stereoToolId?: string;
  stereoToolCode?: string;
  jobNumber: string;
  /**
   * Optimistic concurrency token (phase 14). Bumped server-side on every
   * meaningful UPDATE. Compared against the DB before save to detect concurrent
   * edits — see `detectVersionConflict` in supabaseData.ts.
   */
  version?: number;
  /** Server-side update timestamp set by the bump_row_version trigger. */
  rowUpdatedAt?: string;
  createdAt: string;
  jobDate: string;
  dueDate: string;
  leadId: string;
  leadNumber: string;
  quoteId: string;
  quoteNumber: string;
  quickbooksEstimateNumber: string;
  invoiceNumber: string;
  salesOwnerName: string;
  orderValue: number;
  paymentRequirement: PaymentRequirement;
  paymentStatus: PaymentStatus;
  creditCheckStatus: CreditCheckStatus;
  availableCreditAtApproval: number;
  commercialReleaseStatus: CommercialReleaseStatus;
  clientId: string;
  pricingTierId: string;
  productId: string;
  productCategory: ProductCategory;
  customerName: string;
  customerReference: string;
  productName: string;
  description: string;
  sizeSpec: string;
  paperType: string;
  gsm: string;
  paperQuantityRequired: number;
  paperQuantityUnit: QuantityUnit;
  paperAllocationStatus: PaperAllocationStatus;
  linkedMaterialOrderId: string;
  printRequired: boolean;
  printMethod: PrintMethod;
  colorCount: number;
  supplyFormat: SupplyFormat;
  packingNotes: string;
  printNotes: string;
  quantityPlanned: number;
  quantityCompleted: number;
  status: JobStatus;
  artworkReceived: boolean;
  proofSent: boolean;
  approvalStatus: ApprovalStatus;
  approvalDate: string;
  artworkPreparationStatus: ArtworkPreparationStatus;
  addElementsRequired: boolean;
  colorChangesRequired: boolean;
  artworkChangeSummary: string;
  artworkAssignedDate: string;
  artworkAssignedTo: string;
  proofSharedDate: string;
  proofSharedBy: string;
  finalApprovalReceivedDate: string;
  finalApprovalClearedBy: string;
  factoryReleaseDate: string;
  factoryReleasedBy: string;
  productionStartDate: string;
  productionStartedBy: string;
  readyForDispatchDate: string;
  readyForDispatchBy: string;
  collectionOrDeliveryStatus: 'Client Collecting' | 'Delivery Required' | 'Not Confirmed';
  changesRequested: string;
  artworkNotes: string;
  reserveFromStock: boolean;
  reservedFinishedGoodsStockId: string;
  reservedFinishedGoodsStockNumber: string;
  reservedQuantity: number;
  stockReservationStatus: StockReservationStatus;
  dispatchStatus: string;
  qualityNotes: string;
  capturedBy: string;
  releasedBy: string;
  notes: string;
  fscRelated: boolean;
  /** Food-safety classification for this job. Drives all material-approval checks. */
  foodContactLevel: FoodContactLevel;
  /** IDs of FoodSafeMaterial records selected for this job's materials. */
  foodSafeMaterialIds: string[];
  /** Phase 71 — Chemicals (inks, glues, adhesives, lubricants) used on this
   *  job. Drives the FG-batch food-safe derivation: every chemical must be
   *  food-safe for the batch to inherit a food-safe 'Yes'. */
  chemicalIds?: string[];
  /** Phase 76 — Sales decision: should this job's outputs carry an FSC claim
   *  on the invoice / dispatch? Default-fills from client.defaultFscClaim when
   *  a job is created. FSC paper alone is NOT enough to claim — both this flag
   *  AND a non-'None' fscClaimType on the source material are required. */
  fscClaimEnabled?: boolean;
  /** Internal batch number assigned at job start (propagates to production + dispatch). */
  internalBatchNumber: string;
  /** Free-text food-safety notes (intended food use, customer-specific rules, etc.). */
  foodSafetyNotes: string;
  /** Machine assigned to run this job — drives the cleaning-log gate. */
  assignedMachineId: string;
  /** Phase 2 product changeover checklist (9 fixed items). */
  changeoverChecklist: ChangeoverChecklistItem[];
  /** Phase 2 QC plan (4 fixed stages × 13 check items per stage). */
  qcPlan: QcStageRecord[];
  /** Phase 94 — production-stage tracker. Defaults to the standard pipeline
   *  for new jobs; promote handlers also seed it. Optional so legacy jobs
   *  load cleanly. */
  pipelineStages?: PipelineStage[];
  /** Phase 117 — Blockers parking this job ("waiting for tooling from
   *  toolmaker", "waiting for paper from supplier"). Same shape as quote
   *  blockers — see WaitingOnBlocker. */
  waitingOn?: WaitingOnBlocker[];
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 94 — Job Pipeline.
 *
 * A per-job stage tracker — the single thing the user can scan to answer
 * "where is this job?" Built so a client can phone and ask, and the office
 * can answer in one click: artwork → plates → ink → paper → production →
 * finishing → packing → dispatch.
 *
 * Each stage has named items with three possible statuses:
 *   - pending  = not yet ticked
 *   - blocked  = something stopping it (Sun Chemicals out of stock, etc.)
 *   - done     = ticked complete (stamps doneAt + doneByName)
 *
 * Blockers carry a free-text note + blockedAt date so the bell/notifications
 * (Phase 96) can age them and warn when a blocker is stale > N days.
 * ────────────────────────────────────────────────────────────────────────*/

export type PipelineItemStatus = 'pending' | 'blocked' | 'done';

export interface PipelineItem {
  /** Stable key, e.g. 'plates_ordered'. Drives lookups + persistence. */
  key: string;
  /** Human label rendered in the UI. */
  label: string;
  status: PipelineItemStatus;
  doneAt?: string;
  doneByName?: string;
  blockerNote?: string;
  blockedAt?: string;
}

export type PipelineStageKey =
  | 'artwork'
  | 'plates'
  | 'ink'
  | 'paper'
  | 'production'
  | 'finishing'
  | 'packing'
  | 'dispatch';

export interface PipelineStage {
  key: PipelineStageKey;
  label: string;
  items: PipelineItem[];
}

export interface FinishedGoodsStock {
  id: string;
  /** Phase 59 — batch photos for traceability. */
  photoUrls?: string[];
  stockNumber: string;
  barcode: string;
  createdAt: string;
  storedDate: string;
  productId: string;
  productName: string;
  clientId: string;
  clientName: string;
  jobId: string;
  jobNumber: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityUnit: QuantityUnit;
  storageLocation: string;
  stockStatus: FinishedStockStatus;
  brandingStatus: string;
  notes: string;
  /** Phase 2 food-safety hold/release state. Defaults to 'In Stock' (non-food) or 'Awaiting QC' (food-contact). */
  foodSafetyHoldStatus: FoodSafetyHoldStatus;
  /** Who released this batch (must hold a release-permitted role). */
  releasedByName: string;
  releasedAt: string;
  /** Why this batch is on hold (free text). */
  holdReason: string;
}

/**
 * High-level grouping of an item in the Spares & Consumables register. The
 * category is free text in the DB but the app surfaces these as the standard
 * options. Admins can type anything custom.
 */
/**
 * Phase 63 — broadened from "spares only" to cover everything it takes
 * to run a factory. Production grouping (Spare / Consumable / Tool / PPE)
 * stays; we add categories for inks, glues, raw materials, lubricants,
 * uniforms and kitchen so the same register can hold a forklift battery,
 * a tin of glue, or a packet of coffee.
 */
export type StockItemCategory =
  | 'Machine Spare'
  | 'Consumable'
  | 'Tool'
  | 'PPE'
  | 'Uniform'
  | 'Cleaning'
  | 'Office'
  | 'Kitchen'
  | 'Ink'
  | 'Glue'
  | 'Adhesive'
  | 'Lubricant'
  | 'Raw Material'
  | 'Other';

export const STOCK_ITEM_CATEGORIES: StockItemCategory[] = [
  'Machine Spare',
  'Consumable',
  'Tool',
  'PPE',
  'Uniform',
  'Cleaning',
  'Office',
  'Kitchen',
  'Ink',
  'Glue',
  'Adhesive',
  'Lubricant',
  'Raw Material',
  'Other',
];

/**
 * `Consumable` items decrement quantity on issue (rags, tape, blades).
 * `Tool` items keep quantity but flip to `Out` when checked out and back
 * to `In Stock` on return — they don't get consumed, just borrowed.
 */
export type StockItemType = 'Consumable' | 'Tool';

export type ToolStatus = 'In Stock' | 'Out';
export type ToolCondition = '' | 'Good' | 'Damaged' | 'Lost';

export interface SparePart {
  id: string;
  /** Phase 59 — uploaded photos. Especially valuable for spares
   *  so techs can visually ID the part before swapping. */
  photoUrls?: string[];
  /** Optimistic concurrency token (phase 14). See JobCard.version. */
  version?: number;
  /** Server-side update timestamp. */
  rowUpdatedAt?: string;
  partCode: string;
  barcode: string;
  createdAt: string;
  partName: string;
  category: string;
  /** Drives issue semantics — Consumable decrements, Tool checks out. */
  itemType: StockItemType;
  /**
   * If true, every issue must be tied to a job card (production-floor items
   * like tape, rags, blades). If false, the job picker is optional/hidden
   * (kitchen, cleaning, office).
   */
  productionUse: boolean;
  /** Tool-only — current status. Consumables stay 'In Stock'. */
  currentStatus: ToolStatus;
  /** Tool-only — denormalised pointer to whoever currently holds the tool. */
  currentHolderUserId: string;
  currentHolderName: string;
  /** Optional for non-spare items (consumables, tools, PPE…). */
  machineId: string;
  machineReference: string;
  supplierId: string;
  supplierName: string;
  quantityOnHand: number;
  minimumStockLevel: number;
  reorderLevel: number;
  unitOfMeasure: QuantityUnit;
  unitCost: number;
  storageLocation: string;
  lastPurchaseDate: string;
  notes: string;
  /** Phase 66 — mark expensive / theft-prone items as high-value. Issuing
   *  one requires a foreman/ops PIN before it can leave the rack, and
   *  every movement fires an extra audit event. Examples: master die
   *  set, premium ink drums, branded uniforms with cash value. */
  isHighValue?: boolean;
}

/**
 * One row per issue / consumption / tool check-out. Inserted by the Issue
 * Stock action; updated only when a tool is returned (status flips to
 * 'Returned' and condition fields are filled).
 */
export type StockIssueStatus = 'Issued' | 'Returned';

export interface StockIssue {
  id: string;
  itemId: string;
  itemName: string;
  itemType: StockItemType;
  category: string;
  quantity: number;
  unitOfMeasure: QuantityUnit;
  issuedAt: string;
  issuedToUserId: string;
  issuedToName: string;
  issuedByUserId: string;
  issuedByName: string;
  /** Optional — empty when productionUse=false on the source item. */
  jobId: string;
  jobNumber: string;
  notes: string;
  /** Tools only. Consumables stay 'Issued' forever (effectively 'gone'). */
  status: StockIssueStatus;
  returnedAt: string;
  conditionOnReturn: ToolCondition;
  returnedByUserId: string;
  returnedByName: string;
  createdAt: string;
  /** Phase 66 — receiver's signature captured on the SignaturePad. Empty
   *  for legacy issues; enforced going forward. */
  signatureDataUrl?: string;
  /** Phase 66 — when issuing a high-value item, the foreman/ops user who
   *  approved the issue via PIN. Different from issuedBy (who held the
   *  store counter) so dual-authorisation is auditable. */
  approverUserId?: string;
  approverName?: string;
  /** Phase 66 — whether the source item was flagged high-value at the
   *  time of issue. Snapshotted so later reclassifications don't lose
   *  the security context of past issues. */
  highValueAtIssue?: boolean;
}

/**
 * A periodic physical-count session. The header captures who counted,
 * scope (e.g. "Floor consumables"), and reconciliation state. Lines are
 * stored separately so a session can cover any number of items.
 */
export interface StockCountLine {
  id: string;
  countId: string;
  itemId: string;
  itemName: string;
  systemQty: number;
  countedQty: number;
  variance: number;
  notes: string;
  createdAt: string;
  /** Phase 63 — which register this line came from. Lets reconcile
   *  write the count back to the right table even when a single count
   *  spans spares + chemicals + materials + finished goods. Optional
   *  for backwards compat with pre-Phase-63 counts. */
  itemSource?: 'General Stock' | 'Chemicals' | 'Materials' | 'Finished Goods';
}

export interface StockCount {
  id: string;
  countedAt: string;
  countedByUserId: string;
  countedByName: string;
  scope: string;
  notes: string;
  reconciled: boolean;
  reconciledAt: string;
  reconciledByUserId: string;
  reconciledByName: string;
  createdAt: string;
  lines: StockCountLine[];
}

/**
 * GHS pictograms — the 9 standard chemical hazard symbols defined by the
 * Globally Harmonized System. Used on labels and required on MSDS.
 * Each pictogram corresponds to one or more H-statement codes.
 */
export type GHSPictogram =
  | 'Explosive'
  | 'Flammable'
  | 'Oxidizing'
  | 'Compressed Gas'
  | 'Corrosive'
  | 'Toxic'
  | 'Harmful'
  | 'Health Hazard'
  | 'Environmental Hazard';

export type ChemicalState = 'Solid' | 'Liquid' | 'Gas' | 'Aerosol' | 'Powder';

/**
 * MSDS register entry. One row per chemical/hazardous substance held on site.
 * Used for the chemical & hazardous register required under SA OHS Act and
 * GHS compliance. The `msdsDocumentUrl` can point to a hosted PDF; the
 * `msdsLastReviewedDate` + `msdsReviewIntervalMonths` drive the overdue
 * warning on the list view.
 */
export interface ChemicalRegisterEntry {
  id: string;
  registerNumber: string;
  createdAt: string;
  /** Common/internal name used on the floor. */
  chemicalName: string;
  /** Manufacturer's tradename / commercial name. */
  tradeName: string;
  supplierId: string;
  supplierName: string;
  /** CAS registry number (e.g. 67-64-1 for acetone). Optional for mixtures. */
  casNumber: string;
  /** UN transport hazard number (e.g. UN1170 for ethanol). */
  unNumber: string;
  state: ChemicalState;
  /** GHS pictograms triggered by this chemical. Multi-select. */
  ghsPictograms: GHSPictogram[];
  /** H-codes + plain-language hazard statements, line-separated. */
  hazardStatements: string;
  /** P-codes + precautionary statements. */
  precautionaryStatements: string;
  storageLocation: string;
  /** Maximum quantity permitted on site, per insurance / fire reg. */
  maxOnSiteQuantity: number;
  /** Current on-site quantity (manually entered or fed from receipts). */
  currentOnSiteQuantity: number;
  quantityUnit: 'L' | 'kg' | 'g' | 'mL' | 'units';
  /** Link to hosted MSDS PDF. Empty string if not yet uploaded. */
  msdsDocumentUrl: string;
  msdsLastReviewedDate: string;
  /** Review interval in months — 12 = annual, 36 = max under SANS 10234. */
  msdsReviewIntervalMonths: number;
  /** Emergency / first aid procedure summary. */
  emergencyProcedure: string;
  /** Required PPE (gloves, eye protection, etc.). */
  requiredPPE: string;
  /** Fire-suppression type required (water, CO2, dry powder, foam). */
  fireSuppressionType: string;
  /** Internal notes (e.g. "always store away from bleach"). */
  notes: string;
  /** Phase 64 — uploaded photos (drum, label, MSDS scan). Especially
   *  the label, which carries batch number + supplier date codes that
   *  staff need to confirm against the system during stock-take. */
  photoUrls?: string[];
  /** Soft delete / archive flag. Disabled chemicals don't show on default list. */
  archived: boolean;
  /** Phase 71 — is this chemical food-safe? Drives the FG-batch food-safe
   *  derivation when this chemical is selected on a job. */
  isFoodSafe?: FoodSafeStatus;
  /** Phase 71 — solvent-based chemicals (e.g. solvent inks) require a
   *  machine cleaning + pipe changeover before the line can run a
   *  food-safe job. Drives the Phase 72 changeover gate. */
  isSolventBased?: boolean;
  /** Phase 71 — supplier food-contact certification reference. */
  foodContactCertNumber?: string;
}

export interface ChemicalRegisterFormState {
  chemicalName: string;
  tradeName: string;
  supplierId: string;
  casNumber: string;
  unNumber: string;
  state: ChemicalState;
  ghsPictograms: GHSPictogram[];
  hazardStatements: string;
  precautionaryStatements: string;
  storageLocation: string;
  maxOnSiteQuantity: string;
  currentOnSiteQuantity: string;
  quantityUnit: ChemicalRegisterEntry['quantityUnit'];
  msdsDocumentUrl: string;
  msdsLastReviewedDate: string;
  msdsReviewIntervalMonths: string;
  emergencyProcedure: string;
  requiredPPE: string;
  fireSuppressionType: string;
  notes: string;
  /** Phase 64 — drum + label photos. */
  photoUrls?: string[];
  archived: boolean;
  /** Phase 71 — food-safe + solvent flags + cert ref. */
  isFoodSafe?: FoodSafeStatus;
  isSolventBased?: boolean;
  foodContactCertNumber?: string;
}

export interface ChemicalRegisterFilters {
  search: string;
  pictogram: string;
  storageLocation: string;
  reviewStatus: 'all' | 'overdue' | 'due-soon' | 'ok';
  archived: 'active' | 'archived' | 'all';
}

export const GHS_PICTOGRAMS: GHSPictogram[] = [
  'Explosive',
  'Flammable',
  'Oxidizing',
  'Compressed Gas',
  'Corrosive',
  'Toxic',
  'Harmful',
  'Health Hazard',
  'Environmental Hazard',
];

/** Tabler icon (pictogram approximation) per GHS hazard. */
export const GHS_PICTOGRAM_ICON: Record<GHSPictogram, string> = {
  'Explosive': 'ti-bomb',
  'Flammable': 'ti-flame',
  'Oxidizing': 'ti-fire',
  'Compressed Gas': 'ti-cylinder',
  'Corrosive': 'ti-droplet-half',
  'Toxic': 'ti-skull',
  'Harmful': 'ti-alert-triangle',
  'Health Hazard': 'ti-heartbeat',
  'Environmental Hazard': 'ti-leaf',
};

// ============================================================================
// FOOD SAFETY (Phase 1 — material control loop)
// ============================================================================
//
// FoodContactLevel sets the rule strictness applied to a job. A
// 'DirectFoodContact' or 'PrintedDirectContact' job requires every material
// it uses to be on the Approved Food-Safe Material Register with
// directContactApproved=true; lower levels relax the rule progressively.
// 'NonFood' jobs bypass the food-safety gate entirely.

export type FoodContactLevel =
  | 'NonFood'
  | 'OuterPackagingOnly'
  | 'IndirectFoodContact'
  | 'DirectFoodContact'
  | 'GreaseproofLiner'
  | 'PrintedDirectContact'
  | 'HighRiskCustom';

export const FOOD_CONTACT_LEVEL_LABELS: Record<FoodContactLevel, string> = {
  NonFood: 'Non-food packaging',
  OuterPackagingOnly: 'Food packaging — outer only',
  IndirectFoodContact: 'Indirect food contact',
  DirectFoodContact: 'Direct food contact',
  GreaseproofLiner: 'Greaseproof / food liner',
  PrintedDirectContact: 'Printed direct contact',
  HighRiskCustom: 'High-risk custom job',
};

/** Whether a job at this food-contact level enforces approved-material rules. */
export function isFoodPackagingLevel(level: FoodContactLevel): boolean {
  return level !== 'NonFood';
}

/** Whether a level requires materials approved for DIRECT food contact (vs indirect). */
export function requiresDirectContactApproval(level: FoodContactLevel): boolean {
  return level === 'DirectFoodContact'
    || level === 'GreaseproofLiner'
    || level === 'PrintedDirectContact'
    || level === 'HighRiskCustom';
}

export type FoodSafetyMaterialCategory =
  | 'Paper'
  | 'Board'
  | 'Greaseproof'
  | 'Ink'
  | 'Glue'
  | 'Handle'
  | 'Carton'
  | 'CleaningChemical'
  | 'Lubricant'
  | 'Other';

export type FoodSafetyApprovalStatus =
  | 'Approved'
  | 'Pending'
  | 'Quarantined'
  | 'Suspended'
  | 'Blocked'
  | 'Expired';

export interface FoodSafeMaterial {
  id: string;
  materialNumber: string;
  createdAt: string;
  /** Common floor name, e.g. "WhitePak FoodGrade 90gsm". */
  materialName: string;
  category: FoodSafetyMaterialCategory;
  supplierId: string;
  supplierName: string;
  /** Manufacturer code/SKU, optional. */
  supplierSku: string;
  /** Approved for DIRECT food contact (paper liner, direct-print bag, etc). */
  directContactApproved: boolean;
  /** Approved for INDIRECT food contact (outer bag, carton, etc). */
  indirectContactApproved: boolean;
  /** Approved for external print only (no food contact whatsoever). */
  externalPrintOnly: boolean;
  /** Hosted URL or in-app file reference to the food-safe declaration. */
  foodSafeDeclarationUrl: string;
  /** Hosted URL or in-app file reference to MSDS. */
  msdsUrl: string;
  /** Hosted URL or in-app file reference to Certificate of Analysis. */
  certificateOfAnalysisUrl: string;
  supplierBatchNumber: string;
  internalBatchNumber: string;
  storageLocation: string;
  status: FoodSafetyApprovalStatus;
  approvalDate: string;
  reviewDate: string;
  /** Optional product-life expiry (some inks/glues expire). */
  expiryDate: string;
  /** Restrictions / approved-use notes, line-separated. */
  notes: string;
}

export interface FoodSafeMaterialFormState {
  materialName: string;
  category: FoodSafetyMaterialCategory;
  supplierId: string;
  supplierSku: string;
  directContactApproved: boolean;
  indirectContactApproved: boolean;
  externalPrintOnly: boolean;
  foodSafeDeclarationUrl: string;
  msdsUrl: string;
  certificateOfAnalysisUrl: string;
  supplierBatchNumber: string;
  internalBatchNumber: string;
  storageLocation: string;
  status: FoodSafetyApprovalStatus;
  approvalDate: string;
  reviewDate: string;
  expiryDate: string;
  notes: string;
}

export interface FoodSafeMaterialFilters {
  search: string;
  category: string;
  supplier: string;
  status: string;
  contactLevel: 'all' | 'direct' | 'indirect' | 'external';
  reviewStatus: 'all' | 'overdue' | 'due-soon' | 'ok';
}

export const FOOD_SAFETY_MATERIAL_CATEGORIES: FoodSafetyMaterialCategory[] = [
  'Paper',
  'Board',
  'Greaseproof',
  'Ink',
  'Glue',
  'Handle',
  'Carton',
  'CleaningChemical',
  'Lubricant',
  'Other',
];

/**
 * Validate a food-packaging job against the Approved Food-Safe Material
 * Register. Returns a list of human-readable blocking reasons; an empty
 * array means the job is cleared to run.
 *
 * Rules:
 *  - NonFood jobs always pass (no gate).
 *  - Food-packaging jobs (any other level) must have at least one
 *    foodSafeMaterialId selected.
 *  - Every selected material must have status='Approved'.
 *  - For DIRECT-contact levels every selected material must have
 *    directContactApproved=true. For INDIRECT levels indirectContactApproved
 *    is acceptable (direct also works — direct implies indirect).
 *  - Any material whose reviewDate is in the past blocks the job.
 *  - Any material whose expiryDate is in the past blocks the job.
 */
export interface FoodSafetyJobBlock {
  reason: string;
  /** Optional reference to the offending material (so the UI can highlight). */
  materialId?: string;
}

export function validateJobFoodSafety(
  level: FoodContactLevel,
  selectedMaterialIds: string[],
  approvedMaterials: FoodSafeMaterial[],
): FoodSafetyJobBlock[] {
  if (!isFoodPackagingLevel(level)) return [];
  const blocks: FoodSafetyJobBlock[] = [];
  if (selectedMaterialIds.length === 0) {
    blocks.push({ reason: 'Food packaging job has no approved materials selected.' });
    return blocks;
  }
  const needsDirect = requiresDirectContactApproval(level);
  const today = new Date().toISOString().slice(0, 10);
  for (const id of selectedMaterialIds) {
    const material = approvedMaterials.find((m) => m.id === id);
    if (!material) {
      blocks.push({ reason: 'Selected material is missing from the Food-Safe Material Register.', materialId: id });
      continue;
    }
    if (material.status !== 'Approved') {
      blocks.push({ reason: `${material.materialName}: status is ${material.status}, not Approved.`, materialId: id });
      continue;
    }
    if (needsDirect && !material.directContactApproved) {
      blocks.push({ reason: `${material.materialName}: not approved for direct food contact (required at this food-contact level).`, materialId: id });
    } else if (!needsDirect && !material.indirectContactApproved && !material.directContactApproved) {
      blocks.push({ reason: `${material.materialName}: not approved for any food contact.`, materialId: id });
    }
    if (material.reviewDate && material.reviewDate < today) {
      blocks.push({ reason: `${material.materialName}: approval review overdue (${material.reviewDate}).`, materialId: id });
    }
    if (material.expiryDate && material.expiryDate < today) {
      blocks.push({ reason: `${material.materialName}: material expired on ${material.expiryDate}.`, materialId: id });
    }
  }
  return blocks;
}

// ============================================================================
// FOOD SAFETY (Phase 2 — floor discipline)
// ============================================================================
//
// Cleaning logs, product changeover checklist, QC plan, and finished-goods
// hold/release. These four modules turn a food-packaging job from "we picked
// approved materials" into "we proved the machine was clean, the changeover
// was complete, QC signed off at every stage, and an authorised user
// released the batch before it shipped."

export type FactoryArea =
  // Front-of-house — safe by default. Reception can let verified visitors
  // straight in without host approval.
  | 'Reception'
  | 'Waiting Area'
  | 'Meeting Room 1'
  | 'Meeting Room 2'
  | 'Boardroom'
  | 'Client Meeting Room'
  // Production / restricted areas — visitors need host approval before
  // entry. Reception cannot self-grant these.
  | 'Flexo Printer'
  | 'Bag Machine'
  | 'Slitting Machine'
  | 'Rope Machine'
  | 'Packing Tables'
  | 'Raw Material Storage'
  | 'Finished Goods Storage'
  | 'Dispatch Area'
  | 'Warehouse'
  | 'Production Floor'
  | 'Offices'
  | 'Finance Office'
  | 'Server / Admin Area'
  | 'Other';

export const FACTORY_AREAS: FactoryArea[] = [
  'Reception',
  'Waiting Area',
  'Meeting Room 1',
  'Meeting Room 2',
  'Boardroom',
  'Client Meeting Room',
  'Flexo Printer',
  'Bag Machine',
  'Slitting Machine',
  'Rope Machine',
  'Packing Tables',
  'Raw Material Storage',
  'Finished Goods Storage',
  'Dispatch Area',
  'Warehouse',
  'Production Floor',
  'Offices',
  'Finance Office',
  'Server / Admin Area',
  'Other',
];

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 106 — Visitor Area Approval taxonomy.
 *
 * Every FactoryArea has a default safety classification:
 *   - 'safe'       → Reception can grant a verified visitor entry without
 *                    any host involvement (Reception, Waiting Area, Meeting
 *                    Rooms, Boardroom, Client Meeting Room).
 *   - 'restricted' → Reception CANNOT grant entry on their own. The visitor
 *                    sits in reception while the host (or escalation
 *                    backup) approves via their Inbox. Used for any area
 *                    where a stranger could see stock, IP, money, or be
 *                    near machinery — every production / warehouse /
 *                    office area is restricted by default.
 *
 * Admins can override these defaults at runtime via Settings (the override
 * lives on appSettings.visitorAreaPolicy, which wins over this default
 * map). The seed defaults here are deliberately conservative.
 * ────────────────────────────────────────────────────────────────────────*/
export type AreaSafety = 'safe' | 'restricted';

export const DEFAULT_AREA_SAFETY: Record<FactoryArea, AreaSafety> = {
  // Safe — front-of-house, no production exposure.
  'Reception':           'safe',
  'Waiting Area':        'safe',
  'Meeting Room 1':      'safe',
  'Meeting Room 2':      'safe',
  'Boardroom':           'safe',
  'Client Meeting Room': 'safe',
  // Restricted — production floor, warehouses, offices, finance.
  'Flexo Printer':           'restricted',
  'Bag Machine':             'restricted',
  'Slitting Machine':        'restricted',
  'Rope Machine':            'restricted',
  'Packing Tables':          'restricted',
  'Raw Material Storage':    'restricted',
  'Finished Goods Storage':  'restricted',
  'Dispatch Area':           'restricted',
  'Warehouse':               'restricted',
  'Production Floor':        'restricted',
  'Offices':                 'restricted',
  'Finance Office':          'restricted',
  'Server / Admin Area':     'restricted',
  // Generic 'Other' defaults to restricted — fail safe. Admin can flip it
  // in Settings if they're using 'Other' for, say, an outdoor smoking area.
  'Other':                   'restricted',
};

/** Effective safety class for an area, given the admin's per-area override
 *  map. Falls back to DEFAULT_AREA_SAFETY when no override is set. */
export function getAreaSafety(area: FactoryArea, override?: Partial<Record<FactoryArea, AreaSafety>>): AreaSafety {
  return override?.[area] ?? DEFAULT_AREA_SAFETY[area] ?? 'restricted';
}

export type CleaningType =
  | 'Pre-Shift'
  | 'Between Jobs'
  | 'Deep Clean'
  | 'Sanitation'
  | 'After Spill'
  | 'Scheduled Audit'
  | 'Other';

export type CleaningResult = 'Pass' | 'Fail' | 'Pass with Notes';

export interface CleaningLogEntry {
  id: string;
  logNumber: string;
  createdAt: string;
  /** What area / machine was cleaned. */
  area: FactoryArea;
  /** Free-text qualifier when area === 'Other' or there's a specific machine. */
  areaDetail: string;
  /** Optional link to a Machine record for stronger traceability. */
  machineId: string;
  cleaningType: CleaningType;
  /** ISO datetime of when cleaning was performed. */
  performedAt: string;
  performedByName: string;
  /** Chemical used — link by id to ChemicalRegisterEntry if available. */
  chemicalRegisterId: string;
  chemicalName: string;
  result: CleaningResult;
  /** Supervisor sign-off — required for Pass + Pass with Notes. */
  supervisorSignOffName: string;
  supervisorSignOffAt: string;
  /** Required when result === 'Fail'. */
  correctiveAction: string;
  /** URLs/in-app refs to before/after photos. */
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  notes: string;
}

export interface CleaningLogFormState {
  area: FactoryArea;
  areaDetail: string;
  machineId: string;
  cleaningType: CleaningType;
  performedAt: string;
  performedByName: string;
  chemicalRegisterId: string;
  chemicalName: string;
  result: CleaningResult;
  supervisorSignOffName: string;
  supervisorSignOffAt: string;
  correctiveAction: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  notes: string;
}

export interface CleaningLogFilters {
  search: string;
  area: string;
  cleaningType: string;
  result: string;
  /** 'today' | '7d' | '30d' | 'all' */
  dateWindow: 'today' | '7d' | '30d' | 'all';
}

/**
 * Look up the most recent passing cleaning log for a machine. Returns
 * `null` when no log exists OR when the latest is a Fail OR when it's
 * older than the threshold (default 24 hours). This is what the
 * food-safety job gate consults before allowing a food-packaging job to
 * be cleared for production on that machine.
 */
export function getLatestPassingClean(
  machineId: string,
  logs: CleaningLogEntry[],
  thresholdHours = 24,
): CleaningLogEntry | null {
  if (!machineId) return null;
  const candidates = logs.filter((log) => log.machineId === machineId);
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => (b.performedAt || '').localeCompare(a.performedAt || ''));
  const latest = sorted[0];
  if (latest.result === 'Fail') return null;
  const performedTime = new Date(latest.performedAt).getTime();
  if (Number.isNaN(performedTime)) return null;
  const ageHours = (Date.now() - performedTime) / (1000 * 60 * 60);
  if (ageHours > thresholdHours) return null;
  return latest;
}

// ----- Product changeover checklist (lives on the JobCard) -----

/**
 * Fixed 9-item changeover checklist per spec. Stored on the JobCard as a
 * single object; completion is per-item with timestamp + name.
 */
export interface ChangeoverChecklistItem {
  /** Stable key — drives the printed checklist row. */
  key:
    | 'PreviousMaterialRemoved'
    | 'PreviousWasteRemoved'
    | 'MachineSurfaceCleaned'
    | 'InkTraysCleaned'
    | 'PlatesRemovedOrStored'
    | 'CorrectMaterialLoaded'
    | 'CorrectInkLoaded'
    | 'JobCardConfirmed'
    | 'FirstOffSampleApproved';
  completed: boolean;
  completedAt: string;
  completedByName: string;
}

export const CHANGEOVER_CHECKLIST_KEYS: ChangeoverChecklistItem['key'][] = [
  'PreviousMaterialRemoved',
  'PreviousWasteRemoved',
  'MachineSurfaceCleaned',
  'InkTraysCleaned',
  'PlatesRemovedOrStored',
  'CorrectMaterialLoaded',
  'CorrectInkLoaded',
  'JobCardConfirmed',
  'FirstOffSampleApproved',
];

export const CHANGEOVER_CHECKLIST_LABELS: Record<ChangeoverChecklistItem['key'], string> = {
  PreviousMaterialRemoved: 'Previous material removed from machine',
  PreviousWasteRemoved: 'Previous waste cleared from area',
  MachineSurfaceCleaned: 'Machine surface cleaned (logged on Cleaning Logs)',
  InkTraysCleaned: 'Ink trays cleaned / flushed',
  PlatesRemovedOrStored: 'Previous plates removed & stored correctly',
  CorrectMaterialLoaded: 'Correct material loaded for this job',
  CorrectInkLoaded: 'Correct ink loaded for this job',
  JobCardConfirmed: 'Job card details confirmed by operator',
  FirstOffSampleApproved: 'First-off sample approved & retained',
};

export function buildBlankChangeoverChecklist(): ChangeoverChecklistItem[] {
  return CHANGEOVER_CHECKLIST_KEYS.map((key) => ({
    key,
    completed: false,
    completedAt: '',
    completedByName: '',
  }));
}

export function isChangeoverComplete(items: ChangeoverChecklistItem[]): boolean {
  return CHANGEOVER_CHECKLIST_KEYS.every((key) => items.find((item) => item.key === key)?.completed);
}

// ----- QC plan (lives on the JobCard) -----

export type QcStage = 'FirstOff' | 'InProcess' | 'FinalInspection' | 'PackingInspection';

export const QC_STAGES: QcStage[] = ['FirstOff', 'InProcess', 'FinalInspection', 'PackingInspection'];

export const QC_STAGE_LABELS: Record<QcStage, string> = {
  FirstOff: 'First-off approval',
  InProcess: 'In-process check',
  FinalInspection: 'Final inspection',
  PackingInspection: 'Packing inspection',
};

/** Each stage has the same 13 checklist items, per the spec. */
export type QcCheckKey =
  | 'CorrectSize'
  | 'CorrectMaterial'
  | 'CorrectPrint'
  | 'InkDry'
  | 'NoInkTransfer'
  | 'NoUnusualOdour'
  | 'NoVisibleContamination'
  | 'NoForeignObjects'
  | 'CorrectGlueBonding'
  | 'CorrectHandleStrength'
  | 'CorrectPacking'
  | 'CorrectBatchLabel'
  | 'CorrectQuantity';

export const QC_CHECK_KEYS: QcCheckKey[] = [
  'CorrectSize',
  'CorrectMaterial',
  'CorrectPrint',
  'InkDry',
  'NoInkTransfer',
  'NoUnusualOdour',
  'NoVisibleContamination',
  'NoForeignObjects',
  'CorrectGlueBonding',
  'CorrectHandleStrength',
  'CorrectPacking',
  'CorrectBatchLabel',
  'CorrectQuantity',
];

export const QC_CHECK_LABELS: Record<QcCheckKey, string> = {
  CorrectSize: 'Correct size',
  CorrectMaterial: 'Correct material',
  CorrectPrint: 'Correct print',
  InkDry: 'Ink dry',
  NoInkTransfer: 'No ink transfer',
  NoUnusualOdour: 'No unusual odour',
  NoVisibleContamination: 'No visible contamination',
  NoForeignObjects: 'No foreign objects',
  CorrectGlueBonding: 'Correct glue bonding',
  CorrectHandleStrength: 'Correct handle strength',
  CorrectPacking: 'Correct packing',
  CorrectBatchLabel: 'Correct batch label',
  CorrectQuantity: 'Correct quantity',
}

export type QcCheckResult = 'Pass' | 'Fail' | 'N/A' | 'Not Checked';

export interface QcStageRecord {
  stage: QcStage;
  /** Per-check result. Default 'Not Checked'. */
  checks: Array<{ key: QcCheckKey; result: QcCheckResult }>;
  /** Signed off by + datetime — required to count this stage as complete. */
  signedOffByName: string;
  signedOffAt: string;
  /** Free-text findings / corrective actions for this stage. */
  notes: string;
}

export function buildBlankQcStage(stage: QcStage): QcStageRecord {
  return {
    stage,
    checks: QC_CHECK_KEYS.map((key) => ({ key, result: 'Not Checked' as QcCheckResult })),
    signedOffByName: '',
    signedOffAt: '',
    notes: '',
  };
}

export function buildBlankQcPlan(): QcStageRecord[] {
  return QC_STAGES.map(buildBlankQcStage);
}

/** A stage counts as "passed" when every relevant check is Pass or N/A AND it's signed off. */
export function isQcStagePassed(record: QcStageRecord): boolean {
  if (!record.signedOffByName || !record.signedOffAt) return false;
  return record.checks.every((c) => c.result === 'Pass' || c.result === 'N/A');
}

// ----- Finished-goods food-safety hold / release -----

export type FoodSafetyHoldStatus =
  | 'In Stock'
  | 'Awaiting QC'
  | 'On Hold'
  | 'Released'
  | 'Rejected'
  | 'Reworked'
  | 'Dispatched'
  | 'Recalled';

export const FOOD_SAFETY_HOLD_STATUSES: FoodSafetyHoldStatus[] = [
  'In Stock',
  'Awaiting QC',
  'On Hold',
  'Released',
  'Rejected',
  'Reworked',
  'Dispatched',
  'Recalled',
];

export function isReleaseStatus(status: FoodSafetyHoldStatus): boolean {
  return status === 'Released' || status === 'Dispatched';
}

export const FOOD_SAFETY_RELEASE_ROLES: UserRole[] = ['admin', 'ops'];

export function canUserReleaseFoodSafetyBatch(role: UserRole): boolean {
  return FOOD_SAFETY_RELEASE_ROLES.includes(role);
}

// ----- Extended Phase-2 gate -----

export interface JobReleaseGateInput {
  job: JobCard;
  approvedMaterials: FoodSafeMaterial[];
  cleaningLogs: CleaningLogEntry[];
  /** Optional machines list — when provided, the maintenance gate runs. */
  machines?: Machine[];
}

/**
 * Phase-2 release gate. Called when a job is being moved towards
 * "Ready for Dispatch" / "Cleared for Production". Returns a list of
 * blocking reasons; an empty list means the job is cleared.
 *
 * Rules layered on top of `validateJobFoodSafety`:
 *  - Machine must have a recent passing cleaning log (24h window).
 *  - Changeover checklist must be complete.
 *  - First-Off AND Final QC stages must be signed off.
 *  - Any QC stage with a Fail check blocks regardless of sign-off.
 */
export function validateJobReleaseGate(
  input: JobReleaseGateInput,
): FoodSafetyJobBlock[] {
  const { job, approvedMaterials, cleaningLogs, machines } = input;
  if (!isFoodPackagingLevel(job.foodContactLevel)) return [];
  const blocks: FoodSafetyJobBlock[] = validateJobFoodSafety(
    job.foodContactLevel,
    job.foodSafeMaterialIds,
    approvedMaterials,
  );

  // Cleaning gate
  if (job.assignedMachineId) {
    const clean = getLatestPassingClean(job.assignedMachineId, cleaningLogs);
    if (!clean) {
      blocks.push({ reason: 'Assigned machine has no recent passing cleaning log within the last 24 hours.' });
    }
    // Maintenance gate (Phase 5.5): block food-packaging jobs on machines
    // with a critical maintenance issue or that are out of service.
    if (machines) {
      const machine = machines.find((m) => m.id === job.assignedMachineId);
      if (machine && isMachineFoodSafetyBlocked(machine)) {
        blocks.push({
          reason: `Assigned machine "${machine.name}" has a ${machine.maintenanceStatus} flag — resolve maintenance before running food-packaging jobs on it.`,
        });
      }
    }
  } else {
    blocks.push({ reason: 'No machine assigned — cleaning gate cannot be evaluated.' });
  }

  // Changeover gate
  if (!isChangeoverComplete(job.changeoverChecklist ?? [])) {
    blocks.push({ reason: 'Product changeover checklist is not complete.' });
  }

  // QC gate — First-Off + Final required
  const plan = job.qcPlan ?? [];
  const firstOff = plan.find((s) => s.stage === 'FirstOff');
  const final = plan.find((s) => s.stage === 'FinalInspection');
  if (!firstOff || !isQcStagePassed(firstOff)) {
    blocks.push({ reason: 'First-off QC not signed off or has open Fail items.' });
  }
  if (!final || !isQcStagePassed(final)) {
    blocks.push({ reason: 'Final inspection QC not signed off or has open Fail items.' });
  }
  // Any Fail check on any stage blocks
  for (const stage of plan) {
    if (stage.checks.some((c) => c.result === 'Fail')) {
      blocks.push({ reason: `${QC_STAGE_LABELS[stage.stage]}: has Fail items — investigate before release.` });
    }
  }

  return blocks;
}

// ============================================================================
// FOOD SAFETY (Phase 3 — traceability + complaints + recall)
// ============================================================================
//
// The traceability layer answers two questions in opposite directions:
//
//   1. "Which customers received product made from raw paper batch RCV-X?"
//      (forward trace — used during a recall: find every customer touched
//      by a contaminated raw material lot.)
//   2. "Where did the bad bags this customer is complaining about come
//      from?"  (backward trace — used during an investigation: a customer
//      complaint points at a finished-goods batch, which points at a job,
//      which points at the raw materials, ink, glue, machine and operator.)
//
// CustomerComplaint captures the complaint itself + the investigation +
// the corrective action. The investigation can pin the complaint to a
// specific finished-goods batch which then lights up the full recall trace.

export type ComplaintType =
  | 'Product Defect'
  | 'Foreign Object'
  | 'Off Odour'
  | 'Off Taste'
  | 'Wrong Quantity'
  | 'Wrong Product'
  | 'Late Delivery'
  | 'Damaged Goods'
  | 'Labelling Error'
  | 'Print Quality'
  | 'Allergen / Cross-Contamination'
  | 'Other';

export const COMPLAINT_TYPES: ComplaintType[] = [
  'Product Defect',
  'Foreign Object',
  'Off Odour',
  'Off Taste',
  'Wrong Quantity',
  'Wrong Product',
  'Late Delivery',
  'Damaged Goods',
  'Labelling Error',
  'Print Quality',
  'Allergen / Cross-Contamination',
  'Other',
];

export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'New'
  | 'Investigating'
  | 'Awaiting Customer'
  | 'Resolved'
  | 'Closed'
  | 'Escalated'
  | 'Recall Triggered';

export type ComplaintOutcome =
  | 'Pending'
  | 'Goods Replaced'
  | 'Credit Issued'
  | 'Refund Issued'
  | 'No Action (Customer Error)'
  | 'No Action (Out of Spec but Within Tolerance)'
  | 'Recall'
  | 'Other';

export interface CustomerComplaint {
  id: string;
  complaintNumber: string;
  createdAt: string;
  /** Date the complaint was received. */
  complaintDate: string;
  clientId: string;
  clientName: string;
  /** Who reported / called in the complaint. */
  reportedByName: string;
  reportedByContact: string;
  productId: string;
  productName: string;
  /** Finished-goods batch this complaint pins to. Drives the recall trace. */
  finishedGoodsStockId: string;
  finishedGoodsStockNumber: string;
  /** Job number — populated either from the FG link or manual entry. */
  jobId: string;
  jobNumber: string;
  /** Internal batch number from the job (food safety phase 1 link). */
  internalBatchNumber: string;
  /** Optional delivery note + invoice references. */
  deliveryNoteId: string;
  deliveryNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  complaintType: ComplaintType;
  severity: ComplaintSeverity;
  /** Free-text description of the issue. */
  description: string;
  /** Quantity affected by the complaint (e.g. 500 bags out of 5000). */
  quantityAffected: number;
  quantityUnit: QuantityUnit;
  /** Quantity still in customer's possession. */
  quantityWithCustomer: number;
  /** Quantity remaining in our finished-goods stock from same batch. */
  quantityInternalStock: number;
  /** URLs / refs to evidence photos. */
  photoUrls: string[];
  status: ComplaintStatus;
  /** Investigation findings. */
  investigationNotes: string;
  rootCauseAnalysis: string;
  immediateAction: string;
  /** Corrective + preventive action. */
  correctiveAction: string;
  preventiveAction: string;
  outcome: ComplaintOutcome;
  outcomeNotes: string;
  /** Closure approval — must be filled to move status to Closed. */
  closedByName: string;
  closedAt: string;
  /** Flag — when true, this complaint triggered a wider recall. */
  recallTriggered: boolean;
  recallScope: string;
}

export interface CustomerComplaintFormState {
  complaintDate: string;
  clientId: string;
  reportedByName: string;
  reportedByContact: string;
  productId: string;
  finishedGoodsStockId: string;
  jobId: string;
  deliveryNoteId: string;
  invoiceId: string;
  complaintType: ComplaintType;
  severity: ComplaintSeverity;
  description: string;
  quantityAffected: string;
  quantityUnit: QuantityUnit;
  quantityWithCustomer: string;
  quantityInternalStock: string;
  photoUrls: string[];
  status: ComplaintStatus;
  investigationNotes: string;
  rootCauseAnalysis: string;
  immediateAction: string;
  correctiveAction: string;
  preventiveAction: string;
  outcome: ComplaintOutcome;
  outcomeNotes: string;
  closedByName: string;
  recallTriggered: boolean;
  recallScope: string;
}

export interface CustomerComplaintFilters {
  search: string;
  client: string;
  complaintType: string;
  severity: string;
  status: string;
  recall: 'all' | 'recall-only' | 'no-recall';
  /** 'today' | '7d' | '30d' | '90d' | 'all' */
  dateWindow: 'today' | '7d' | '30d' | '90d' | 'all';
}

// ----- Traceability search -----

/**
 * Things you can search by. Each maps to a different starting point in
 * the trace graph.
 */
export type TraceabilitySearchType =
  | 'internalBatch'
  | 'rawMaterialReceipt'
  | 'finishedGoodsStock'
  | 'jobNumber'
  | 'deliveryNote'
  | 'invoice'
  | 'customer'
  | 'machine';

export const TRACEABILITY_SEARCH_LABELS: Record<TraceabilitySearchType, string> = {
  internalBatch: 'Internal batch number',
  rawMaterialReceipt: 'Raw material receipt #',
  finishedGoodsStock: 'Finished goods batch #',
  jobNumber: 'Job number',
  deliveryNote: 'Delivery note #',
  invoice: 'Invoice #',
  customer: 'Customer name',
  machine: 'Machine name',
};

/**
 * The complete traceability graph for a single search query. Returns
 * every record connected to the starting point, walked through:
 *   raw materials ←→ jobs ←→ production logs ←→ finished goods ←→
 *   dispatch ←→ delivery notes ←→ invoices ←→ customers.
 *
 * The arrays are in no particular order; callers can dedupe / sort
 * for display.
 */
export interface TraceabilityResult {
  query: string;
  searchType: TraceabilitySearchType;
  rawMaterialReceipts: MaterialReceipt[];
  foodSafeMaterials: FoodSafeMaterial[];
  jobs: JobCard[];
  productionLogs: ProductionLogEntry[];
  finishedGoodsStock: FinishedGoodsStock[];
  dispatchRecords: DispatchRecord[];
  deliveryNotes: DeliveryNote[];
  invoices: Invoice[];
  customers: Client[];
  complaints: CustomerComplaint[];
  /** Total batches touched. */
  batchCount: number;
  /** Distinct customers affected — the recall list. */
  affectedCustomerCount: number;
}

interface TraceabilityInput {
  searchType: TraceabilitySearchType;
  query: string;
  data: AppData;
}

/**
 * Walk the data graph from the search starting point. Returns every
 * connected record. The walk is deliberately broad — for a recall you
 * want everything that touches the suspect batch.
 */
export function traceBatch({ searchType, query, data }: TraceabilityInput): TraceabilityResult {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      query, searchType,
      rawMaterialReceipts: [], foodSafeMaterials: [], jobs: [], productionLogs: [],
      finishedGoodsStock: [], dispatchRecords: [], deliveryNotes: [], invoices: [],
      customers: [], complaints: [],
      batchCount: 0, affectedCustomerCount: 0,
    };
  }

  // 1) Seed sets based on starting point.
  const seedJobs = new Set<string>();
  const seedReceipts = new Set<string>();
  const seedFG = new Set<string>();
  const seedDeliveries = new Set<string>();
  const seedInvoices = new Set<string>();
  const seedCustomers = new Set<string>();
  const seedMachines = new Set<string>();

  switch (searchType) {
    case 'internalBatch':
      // Internal batch number lives on the job; match either job.internalBatchNumber
      // or any FG with the same batch propagated.
      for (const job of data.jobs) {
        if ((job.internalBatchNumber || '').toLowerCase() === q
          || (job.internalBatchNumber || '').toLowerCase().includes(q)) {
          seedJobs.add(job.id);
        }
      }
      for (const fg of data.finishedGoodsStock) {
        if ((fg.stockNumber || '').toLowerCase().includes(q)) seedFG.add(fg.id);
      }
      break;
    case 'rawMaterialReceipt':
      for (const r of data.materialReceipts) {
        if ((r.receiptNumber || '').toLowerCase().includes(q)
          || (r.internalRollCode || '').toLowerCase().includes(q)
          || (r.supplierBatchNumber || '').toLowerCase().includes(q)) {
          seedReceipts.add(r.id);
        }
      }
      break;
    case 'finishedGoodsStock':
      for (const fg of data.finishedGoodsStock) {
        if ((fg.stockNumber || '').toLowerCase().includes(q)
          || (fg.barcode || '').toLowerCase().includes(q)) {
          seedFG.add(fg.id);
        }
      }
      break;
    case 'jobNumber':
      for (const job of data.jobs) {
        if ((job.jobNumber || '').toLowerCase().includes(q)) seedJobs.add(job.id);
      }
      break;
    case 'deliveryNote':
      for (const dn of data.deliveryNotes) {
        if ((dn.deliveryNoteNumber || '').toLowerCase().includes(q)) seedDeliveries.add(dn.id);
      }
      break;
    case 'invoice':
      for (const inv of data.invoices) {
        if ((inv.invoiceNumber || '').toLowerCase().includes(q)) seedInvoices.add(inv.id);
      }
      break;
    case 'customer':
      for (const client of data.clients) {
        if ((client.name || '').toLowerCase().includes(q)
          || (client.companyName || '').toLowerCase().includes(q)) {
          seedCustomers.add(client.id);
        }
      }
      break;
    case 'machine':
      for (const m of data.machines) {
        if ((m.name || '').toLowerCase().includes(q)) seedMachines.add(m.id);
      }
      break;
  }

  // 2) Walk the graph. Each iteration expands the seed sets via forward + backward links.
  // We loop until no new IDs are added (fixed point), capped to avoid pathological cases.
  const MAX_ITER = 6;
  for (let i = 0; i < MAX_ITER; i++) {
    const sizeBefore = seedJobs.size + seedReceipts.size + seedFG.size
      + seedDeliveries.size + seedInvoices.size + seedCustomers.size + seedMachines.size;

    // Customer ↔ jobs: a customer's jobs (forward), a job's client (backward).
    for (const job of data.jobs) {
      if (seedCustomers.has(job.clientId)) seedJobs.add(job.id);
      if (seedJobs.has(job.id) && job.clientId) seedCustomers.add(job.clientId);
    }
    // Jobs ↔ finished goods: FG.jobId.
    for (const fg of data.finishedGoodsStock) {
      if (seedJobs.has(fg.jobId)) seedFG.add(fg.id);
      if (seedFG.has(fg.id) && fg.jobId) seedJobs.add(fg.jobId);
      if (seedFG.has(fg.id) && fg.clientId) seedCustomers.add(fg.clientId);
    }
    // Jobs ↔ dispatch records: dispatch.jobId.
    for (const d of data.dispatchRecords) {
      if (seedJobs.has(d.jobId)) {
        // Dispatch has no id we seed directly, but a downstream delivery note may.
      }
    }
    // Jobs ↔ delivery notes: deliveryNote.jobId.
    for (const dn of data.deliveryNotes) {
      if (seedJobs.has(dn.jobId)) seedDeliveries.add(dn.id);
      if (seedDeliveries.has(dn.id)) {
        if (dn.jobId) seedJobs.add(dn.jobId);
        if (dn.clientId) seedCustomers.add(dn.clientId);
        if (dn.parentInvoiceId) seedInvoices.add(dn.parentInvoiceId);
      }
    }
    // Invoices ↔ jobs / deliveries: invoice.jobId, deliveryNote.parentInvoiceId.
    for (const inv of data.invoices) {
      if (seedJobs.has(inv.jobId)) seedInvoices.add(inv.id);
      if (seedInvoices.has(inv.id)) {
        if (inv.jobId) seedJobs.add(inv.jobId);
        if (inv.clientId) seedCustomers.add(inv.clientId);
      }
    }
    // Production logs ↔ jobs: log.jobId.
    for (const log of data.productionLogs) {
      if (seedJobs.has(log.jobId) && log.machine) {
        // Production log identifies a machine name string; if we have machine-name match, link it.
        const machine = data.machines.find((m) => m.name === log.machine);
        if (machine) seedMachines.add(machine.id);
      }
      if (log.machine && data.machines.some((m) => seedMachines.has(m.id) && m.name === log.machine)) {
        if (log.jobId) seedJobs.add(log.jobId);
      }
    }
    // Material receipts ↔ jobs: a job's selected food-safe-materials may reference receipts by batch.
    // The link is loose — we walk via FoodSafeMaterial.supplierBatchNumber & MaterialReceipt.supplierBatchNumber.
    for (const job of data.jobs) {
      if (!seedJobs.has(job.id)) continue;
      const usedMaterials = data.foodSafeMaterials.filter((m) => job.foodSafeMaterialIds.includes(m.id));
      for (const m of usedMaterials) {
        const receipt = data.materialReceipts.find((r) =>
          (m.supplierBatchNumber && r.supplierBatchNumber && r.supplierBatchNumber === m.supplierBatchNumber)
          || (m.internalBatchNumber && r.internalRollCode && r.internalRollCode === m.internalBatchNumber),
        );
        if (receipt) seedReceipts.add(receipt.id);
      }
    }
    // Receipt → jobs (backward): if we seeded a receipt, find jobs that referenced its batch.
    for (const r of data.materialReceipts) {
      if (!seedReceipts.has(r.id)) continue;
      const linkedMaterials = data.foodSafeMaterials.filter((m) =>
        (m.supplierBatchNumber && r.supplierBatchNumber && m.supplierBatchNumber === r.supplierBatchNumber)
        || (m.internalBatchNumber && r.internalRollCode && m.internalBatchNumber === r.internalRollCode),
      );
      for (const m of linkedMaterials) {
        for (const job of data.jobs) {
          if (job.foodSafeMaterialIds.includes(m.id)) seedJobs.add(job.id);
        }
      }
    }

    const sizeAfter = seedJobs.size + seedReceipts.size + seedFG.size
      + seedDeliveries.size + seedInvoices.size + seedCustomers.size + seedMachines.size;
    if (sizeAfter === sizeBefore) break;
  }

  // 3) Materialise the result arrays.
  const jobs = data.jobs.filter((j) => seedJobs.has(j.id));
  const rawMaterialReceipts = data.materialReceipts.filter((r) => seedReceipts.has(r.id));
  const finishedGoodsStock = data.finishedGoodsStock.filter((fg) => seedFG.has(fg.id));
  const deliveryNotes = data.deliveryNotes.filter((dn) => seedDeliveries.has(dn.id));
  const invoices = data.invoices.filter((inv) => seedInvoices.has(inv.id));
  const customers = data.clients.filter((c) => seedCustomers.has(c.id));
  const dispatchRecords = data.dispatchRecords.filter((d) => seedJobs.has(d.jobId));
  const productionLogs = data.productionLogs.filter((l) => seedJobs.has(l.jobId));
  const foodSafeMaterialIds = new Set<string>(jobs.flatMap((j) => j.foodSafeMaterialIds));
  const foodSafeMaterials = data.foodSafeMaterials.filter((m) => foodSafeMaterialIds.has(m.id));
  const complaints = data.customerComplaints.filter((c) =>
    seedJobs.has(c.jobId) || seedFG.has(c.finishedGoodsStockId) || seedCustomers.has(c.clientId),
  );

  return {
    query, searchType,
    rawMaterialReceipts, foodSafeMaterials, jobs, productionLogs,
    finishedGoodsStock, dispatchRecords, deliveryNotes, invoices,
    customers, complaints,
    batchCount: seedJobs.size + seedFG.size,
    affectedCustomerCount: customers.length,
  };
}

// ============================================================================
// FOOD SAFETY (Phase 3.5 — Non-Conformance Register + CAPA)
// ============================================================================
//
// Floor-side issues that aren't customer complaints. A QC fail, a foreign
// object found in the raw paper, a cleaning Fail result, a missing
// supplier document detected during receiving — all of these get logged
// as a Non-Conformance Report (NCR). The CAPA fields on the same record
// track the corrective + preventive action through to closure.

export type NcrIssueType =
  | 'Wrong Material Used'
  | 'Unapproved Ink Used'
  | 'Cleaning Not Completed'
  | 'Foreign Object Found'
  | 'Pest Evidence'
  | 'Dirty Packing Area'
  | 'Machine Oil / Lubricant Risk'
  | 'Product Packed Incorrectly'
  | 'Supplier Document Expired'
  | 'Food-Safe Status Unclear'
  | 'Product Failed QC'
  | 'Maintenance Issue'
  | 'Cross-Contamination Risk'
  | 'Customer Complaint'
  | 'Customer Return'
  | 'Process Deviation'
  | 'Wrong Artwork Sent'
  | 'Equipment Failure'
  | 'Late Delivery'
  | 'Other';

export const NCR_ISSUE_TYPES: NcrIssueType[] = [
  'Wrong Material Used',
  'Unapproved Ink Used',
  'Cleaning Not Completed',
  'Foreign Object Found',
  'Pest Evidence',
  'Dirty Packing Area',
  'Machine Oil / Lubricant Risk',
  'Product Packed Incorrectly',
  'Supplier Document Expired',
  'Food-Safe Status Unclear',
  'Product Failed QC',
  'Maintenance Issue',
  'Cross-Contamination Risk',
  'Customer Complaint',
  'Customer Return',
  'Process Deviation',
  'Wrong Artwork Sent',
  'Equipment Failure',
  'Late Delivery',
  'Other',
];

export type NcrSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type NcrStatus =
  | 'Open'
  | 'In Progress'
  | 'Awaiting Verification'
  | 'Closed'
  | 'Escalated';

export interface NonConformance {
  id: string;
  ncrNumber: string;
  createdAt: string;
  issueDate: string;
  /** Which factory area the issue was found in. Re-uses the cleaning-log enum. */
  area: FactoryArea;
  areaDetail: string;
  issueType: NcrIssueType;
  severity: NcrSeverity;
  /** What happened. */
  description: string;
  /** Optional links — pin the issue to a job, batch, or FG stock for traceability. */
  jobId: string;
  jobNumber: string;
  internalBatchNumber: string;
  finishedGoodsStockId: string;
  finishedGoodsStockNumber: string;
  /** Optional link to a cleaning log (if this NCR was raised from a Fail). */
  cleaningLogId: string;
  /** Who reported the issue. */
  reportedByName: string;
  /** Immediate action — what was done in the moment to contain. */
  immediateAction: string;
  /** Root-cause analysis. */
  rootCauseAnalysis: string;
  /** CAPA — corrective + preventive. */
  correctiveAction: string;
  preventiveAction: string;
  /** Owner of the corrective action. */
  responsiblePersonName: string;
  dueDate: string;
  evidencePhotoUrls: string[];
  status: NcrStatus;
  /** Verification — confirms the corrective action worked. */
  verifiedByName: string;
  verifiedAt: string;
  closedByName: string;
  closedAt: string;
  closureNotes: string;
}

export interface NonConformanceFormState {
  issueDate: string;
  area: FactoryArea;
  areaDetail: string;
  issueType: NcrIssueType;
  severity: NcrSeverity;
  description: string;
  jobId: string;
  finishedGoodsStockId: string;
  cleaningLogId: string;
  reportedByName: string;
  immediateAction: string;
  rootCauseAnalysis: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePersonName: string;
  dueDate: string;
  evidencePhotoUrls: string[];
  status: NcrStatus;
  verifiedByName: string;
  closedByName: string;
  closureNotes: string;
}

export interface NonConformanceFilters {
  search: string;
  area: string;
  issueType: string;
  severity: string;
  status: string;
  overdue: 'all' | 'overdue-only' | 'on-track';
  dateWindow: 'today' | '7d' | '30d' | '90d' | 'all';
}

// ============================================================================
// FOOD SAFETY (Phase 4 — People, Environment, Pests)
// ============================================================================
//
// Six small registers covering the human + environmental controls
// auditors check: training, PPE, pests, foreign objects, blades / tools,
// and visitor hygiene.

// ----- Staff Training -----

export type TrainingTopic =
  | 'Food Safety'
  | 'Hygiene'
  | 'Machine Cleaning'
  | 'Chemical Handling'
  | 'Foreign Object Awareness'
  | 'PPE'
  | 'HACCP'
  | 'Allergen Control'
  | 'Pest Awareness'
  | 'Glass & Brittle Plastic Policy'
  | 'Visitor Protocol'
  | 'First Aid'
  | 'Fire Safety'
  | 'Other';

export const TRAINING_TOPICS: TrainingTopic[] = [
  'Food Safety',
  'Hygiene',
  'Machine Cleaning',
  'Chemical Handling',
  'Foreign Object Awareness',
  'PPE',
  'HACCP',
  'Allergen Control',
  'Pest Awareness',
  'Glass & Brittle Plastic Policy',
  'Visitor Protocol',
  'First Aid',
  'Fire Safety',
  'Other',
];

export interface StaffTrainingRecord {
  id: string;
  recordNumber: string;
  createdAt: string;
  staffName: string;
  staffRole: string;
  topic: TrainingTopic;
  trainingDate: string;
  trainerName: string;
  /** Optional training method (in-person, video, e-learning). */
  method: string;
  /** Boolean — staff signed acknowledgement of training. */
  acknowledged: boolean;
  acknowledgedDate: string;
  refresherIntervalMonths: number;
  nextRefresherDate: string;
  /** Optional reference to a certificate URL. */
  certificateUrl: string;
  notes: string;
}

export interface StaffTrainingFormState {
  staffName: string;
  staffRole: string;
  topic: TrainingTopic;
  trainingDate: string;
  trainerName: string;
  method: string;
  acknowledged: boolean;
  acknowledgedDate: string;
  refresherIntervalMonths: string;
  certificateUrl: string;
  notes: string;
}

export interface StaffTrainingFilters {
  search: string;
  topic: string;
  refresherStatus: 'all' | 'overdue' | 'due-soon' | 'ok';
}

// ----- PPE Issue Log -----

export type PpeItemType =
  | 'Hairnet'
  | 'Beard Net'
  | 'Gloves'
  | 'Apron'
  | 'Mask'
  | 'Safety Shoes'
  | 'Eye Protection'
  | 'Ear Protection'
  | 'Hi-Vis'
  | 'Other';

export const PPE_ITEM_TYPES: PpeItemType[] = [
  'Hairnet',
  'Beard Net',
  'Gloves',
  'Apron',
  'Mask',
  'Safety Shoes',
  'Eye Protection',
  'Ear Protection',
  'Hi-Vis',
  'Other',
];

export type PpeIssueStatus = 'Issued' | 'Returned' | 'Damaged' | 'Lost';

/** Phase 98 — PPE transaction type.
 *  Lets one table cover the full PPE lifecycle:
 *    - Request       = employee asked for PPE, awaiting issue
 *    - Issue         = handed over + acknowledged with signature
 *    - Return        = handed back (separation, role change, replacement)
 *    - Disposal      = scrapped due to damage / expiry
 *  Old records without this field default to 'Issue' so back-compat holds.
 */
export type PpeTransactionType = 'Request' | 'Issue' | 'Return' | 'Disposal';
export const PPE_TRANSACTION_TYPES: PpeTransactionType[] = ['Request', 'Issue', 'Return', 'Disposal'];

/**
 * Phase 39 — one line per PPE item in a multi-item issue. Lets a single
 * record cover everything handed to a staff member at the same time
 * (e.g. hairnet, gloves, hi-vis all on one signed slip).
 */
export interface PpeIssueLineItem {
  type: PpeItemType;
  description: string;
  quantity: number;
}

export interface PpeIssueRecord {
  id: string;
  issueNumber: string;
  createdAt: string;
  /** Phase 122 — Linked Employee record. Required for new rows captured
   *  via the picker; left empty on legacy free-text rows so they still
   *  load. Drives the Employee-profile PPE panel and the staff portal
   *  "PPE issued to you" surface. */
  employeeId?: string;
  /** Snapshot of the staff member's name at issue time. Stays useful for
   *  printables and history even if the Employee record is later renamed. */
  staffName: string;
  staffRole: string;
  /** Legacy single-item fields — still populated for back-compat. New records
   *  also write the full set into `items`; reader code prefers items when present. */
  itemType: PpeItemType;
  itemDescription: string;
  quantity: number;
  issuedByName: string;
  issuedDate: string;
  status: PpeIssueStatus;
  returnDate: string;
  /** When the PPE expires / needs replacement. */
  replacementDueDate: string;
  notes: string;
  /** Phase 39 — multi-item issue. Empty/undefined for legacy single-item rows. */
  items?: PpeIssueLineItem[];
  /** Phase 39 — employee's on-screen signature acknowledging receipt. */
  employeeSignatureDataUrl?: string;
  /** Phase 98 — which lifecycle step this row represents.
   *  Default 'Issue' for legacy rows (no SQL migration needed). */
  transactionType?: PpeTransactionType;
  /** Phase 98 — for Request rows, when the worker needs it by. */
  requiredByDate?: string;
  /** Phase 98 — for Return rows, condition of the returned item. */
  returnCondition?: 'Good' | 'Damaged' | 'Expired';
}

export interface PpeIssueFormState {
  /** Phase 122 — Required Employee picker. */
  employeeId: string;
  staffName: string;
  staffRole: string;
  itemType: PpeItemType;
  itemDescription: string;
  quantity: string;
  issuedByName: string;
  issuedDate: string;
  status: PpeIssueStatus;
  returnDate: string;
  replacementDueDate: string;
  notes: string;
  items: PpeIssueLineItem[];
  employeeSignatureDataUrl: string;
  /** Phase 98 — lifecycle step (Request / Issue / Return / Disposal). */
  transactionType: PpeTransactionType;
  requiredByDate: string;
  returnCondition: 'Good' | 'Damaged' | 'Expired';
}

export interface PpeIssueFilters {
  search: string;
  itemType: string;
  status: string;
}

// ----- Pest Control Register -----

export type PestType =
  | 'Rodent'
  | 'Insect (flying)'
  | 'Insect (crawling)'
  | 'Cockroach'
  | 'Stored Product Pest'
  | 'Bird'
  | 'Other';

export interface PestControlRecord {
  id: string;
  recordNumber: string;
  createdAt: string;
  /** Service date (when the provider attended). */
  serviceDate: string;
  /** Pest control provider name. */
  providerName: string;
  technicianName: string;
  nextServiceDate: string;
  /** Type of activity — preventive treatment vs reactive treatment vs internal sighting. */
  activityType: 'Preventive Treatment' | 'Reactive Treatment' | 'Bait Station Check' | 'Internal Sighting' | 'Other';
  /** Pest type if relevant. */
  pestType: PestType | '';
  findings: string;
  correctiveActions: string;
  /** Whether product was potentially affected. */
  productAffected: boolean;
  /** Whether any stock was placed on hold pending investigation. */
  stockOnHold: boolean;
  /** URLs/refs to service report or photos. */
  reportUrls: string[];
  /** Bait station map (URL or location reference). */
  baitStationMapUrl: string;
  notes: string;
}

export interface PestControlFormState {
  serviceDate: string;
  providerName: string;
  technicianName: string;
  nextServiceDate: string;
  activityType: PestControlRecord['activityType'];
  pestType: PestType | '';
  findings: string;
  correctiveActions: string;
  productAffected: boolean;
  stockOnHold: boolean;
  reportUrls: string[];
  baitStationMapUrl: string;
  notes: string;
}

export interface PestControlFilters {
  search: string;
  activityType: string;
  pestType: string;
  /** 'all' | 'last30' | 'last90' | 'overdue' (next service date past). */
  serviceWindow: 'all' | 'last30' | 'last90' | 'overdue';
}

// ----- Foreign Object Register -----

export type ForeignObjectMaterial =
  | 'Glass'
  | 'Brittle Plastic'
  | 'Wood Splinter'
  | 'Metal (blade)'
  | 'Metal (screw / bolt)'
  | 'Tool Part'
  | 'Staple'
  | 'Pen / Pencil'
  | 'Jewellery'
  | 'Hair'
  | 'Other';

export interface ForeignObjectRecord {
  id: string;
  recordNumber: string;
  createdAt: string;
  /** Where the foreign object risk exists (or where it was found). */
  area: FactoryArea;
  /** What the object is. */
  material: ForeignObjectMaterial;
  description: string;
  /** Whether this is an active risk (e.g. light fitting overhead) or a logged incident (found in product). */
  recordType: 'Risk Inventory' | 'Incident' | 'Inspection';
  inspectionDate: string;
  inspectedByName: string;
  /** Status — Open if action needed, Mitigated if controls in place, Closed if removed. */
  status: 'Open' | 'Mitigated' | 'Closed';
  controlMeasure: string;
  /** Linked NCR if this triggered a non-conformance. */
  linkedNcrId: string;
  photoUrls: string[];
  notes: string;
}

export interface ForeignObjectFormState {
  area: FactoryArea;
  material: ForeignObjectMaterial;
  description: string;
  recordType: ForeignObjectRecord['recordType'];
  inspectionDate: string;
  inspectedByName: string;
  status: ForeignObjectRecord['status'];
  controlMeasure: string;
  linkedNcrId: string;
  photoUrls: string[];
  notes: string;
}

export interface ForeignObjectFilters {
  search: string;
  area: string;
  material: string;
  recordType: string;
  status: string;
}

// ----- Tool & Blade Control -----

export type ToolBladeType = 'Blade' | 'Cutter' | 'Knife' | 'Tool' | 'Other';

export interface ToolBladeRecord {
  id: string;
  recordNumber: string;
  createdAt: string;
  itemType: ToolBladeType;
  /** Serial number / asset tag. */
  serialNumber: string;
  description: string;
  /** Where the tool normally lives. */
  homeLocation: string;
  /** Who currently holds it. */
  currentHolderName: string;
  /** Issue + return tracking. */
  issuedToName: string;
  issuedDate: string;
  expectedReturnDate: string;
  returnedDate: string;
  status: 'Available' | 'Issued' | 'Lost' | 'Damaged' | 'Retired';
  /** Critical flag — blades + cutters where loss = food safety incident. */
  isCritical: boolean;
  /** If lost, the linked NCR. */
  linkedNcrId: string;
  notes: string;
}

export interface ToolBladeFormState {
  itemType: ToolBladeType;
  serialNumber: string;
  description: string;
  homeLocation: string;
  currentHolderName: string;
  issuedToName: string;
  issuedDate: string;
  expectedReturnDate: string;
  returnedDate: string;
  status: ToolBladeRecord['status'];
  isCritical: boolean;
  linkedNcrId: string;
  notes: string;
}

export interface ToolBladeFilters {
  search: string;
  itemType: string;
  status: string;
  criticalOnly: boolean;
}

// ----- Visitor & Contractor Log -----

export type VisitorType = 'Customer' | 'Supplier' | 'Contractor' | 'Auditor' | 'Maintenance' | 'Pest Control' | 'Other';

export interface VisitorLogEntry {
  id: string;
  visitNumber: string;
  createdAt: string;
  visitDate: string;
  visitorName: string;
  visitorType: VisitorType;
  company: string;
  /** Who they're visiting / their host. */
  hostName: string;
  /** Purpose of visit. */
  purpose: string;
  /** Areas they're allowed in. */
  areasVisited: FactoryArea[];
  timeIn: string;
  timeOut: string;
  /** Hygiene acknowledgement signed. */
  hygieneAcknowledged: boolean;
  /** PPE issued for the visit.
   *  Phase 105 — now multi-select. Stored as a comma-joined string on the
   *  legacy `ppeIssued` column for back-compat; new code reads/writes
   *  `ppeIssuedItems` for the typed list. The serialiser writes both. */
  ppeIssued: string;
  ppeIssuedItems?: VisitorPpeItem[];
  /** Whether they entered any food-contact area. */
  enteredFoodContactArea: boolean;
  notes: string;
  /** Phase 37 — captured at the reception kiosk. Optional so existing rows load. */
  phoneNumber?: string;
  vehicleRegistration?: string;
  signatureDataUrl?: string;
  /** True when the entry was created/closed via the reception kiosk (audit). */
  kioskCheckin?: boolean;
  kioskCheckout?: boolean;
  /** Phase 38 — reception verifies kiosk check-ins (confirms details, assigns
   *  PPE and allowed areas). Pending = not yet verified. */
  staffVerified?: boolean;
  verifiedByName?: string;
  verifiedAt?: string;
}

export interface VisitorLogFormState {
  visitDate: string;
  visitorName: string;
  visitorType: VisitorType;
  company: string;
  hostName: string;
  purpose: string;
  areasVisited: FactoryArea[];
  timeIn: string;
  timeOut: string;
  hygieneAcknowledged: boolean;
  /** Phase 105 — kept for read-back of legacy rows; the form widget binds to
   *  ppeIssuedItems and the save handler serialises both. */
  ppeIssued: string;
  ppeIssuedItems: VisitorPpeItem[];
  enteredFoodContactArea: boolean;
  notes: string;
  phoneNumber: string;
  vehicleRegistration: string;
  signatureDataUrl: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 105 — Multi-select PPE catalog for visitor / contractor check-in.
 *
 * Reception ticks every PPE item handed to the visitor at check-in instead
 * of typing it free-form. Keeps the data clean for SMETA + BRCGS audits
 * and lets us count consumption per item later. Extend the list as new
 * PPE is added to stock; the form just renders ALL_VISITOR_PPE_ITEMS as
 * checkboxes.
 * ────────────────────────────────────────────────────────────────────────*/
export type VisitorPpeItem =
  | 'Hairnet'
  | 'Beard cover'
  | 'Safety boots'
  | 'Hi-viz vest'
  | 'Hard hat'
  | 'Lab coat'
  | 'Ear plugs'
  | 'Safety glasses'
  | 'Disposable gloves'
  | 'Cut-resistant gloves'
  | 'Dust mask'
  | 'Apron';

export const ALL_VISITOR_PPE_ITEMS: VisitorPpeItem[] = [
  'Hairnet', 'Beard cover', 'Safety boots', 'Hi-viz vest', 'Hard hat',
  'Lab coat', 'Ear plugs', 'Safety glasses', 'Disposable gloves',
  'Cut-resistant gloves', 'Dust mask', 'Apron',
];

export interface VisitorLogFilters {
  search: string;
  visitorType: string;
  dateWindow: 'today' | '7d' | '30d' | 'all';
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 106.2 — Visitor area approval requests.
 *
 * Created when reception verifies a visitor and ticks one or more areas
 * that are classified as 'restricted'. The visitor sits in reception
 * until the host (or the escalation backup) decides.
 *
 * Lifecycle:
 *   1. Reception ticks safe areas → confirms visitor (no request needed).
 *   2. Reception ticks any restricted area → an approval request is created
 *      with status='pending', requestedAreas = the restricted ticks. Safe
 *      area ticks pass through immediately.
 *   3. Host opens their Inbox, sees the request, picks one of:
 *        - approve-all  → all requestedAreas granted
 *        - approve-some → granted = subset of requestedAreas
 *        - decline      → visitor stays at reception, no restricted access
 *        - keep-reception → explicit "no, just keep them in reception"
 *        - delegate     → forwards to another employee, status stays pending
 *   4. Audit log records every action (Phase 106.5 will pipe this through
 *      the notification dispatcher to email/SMS/WhatsApp).
 *
 * Per Aman's spec:
 *   - All approvals + declines + delegations + overrides MUST be logged.
 *   - Access expires when visitor checks out, day ends, or admin revokes.
 * ────────────────────────────────────────────────────────────────────────*/
export type VisitorApprovalStatus =
  | 'pending'
  | 'approved'         // host approved all requested areas
  | 'approved_partial' // host approved a subset
  | 'declined'         // host said no
  | 'keep_reception'   // host says visitor stays at reception
  | 'delegated'        // forwarded to another approver, still pending
  | 'escalated'        // auto-routed to backup after timeout (Phase 106.3)
  | 'expired'          // checkout / day-end / admin revoked
  | 'overridden';      // admin overrode the chain

export type VisitorApprovalActionType =
  | 'created'
  | 'approve-all'
  | 'approve-some'
  | 'decline'
  | 'keep-reception'
  | 'delegate'
  | 'escalate'
  | 'override'
  | 'expire'
  | 'revoke';

/** Single audit row inside the approval request's history. */
export interface VisitorApprovalAuditEntry {
  at: string;                          // ISO timestamp
  action: VisitorApprovalActionType;
  /** Who took the action — employee id when available, otherwise free name. */
  actorEmployeeId?: string;
  actorName: string;
  /** When action='delegate', who it was forwarded to. */
  delegatedToEmployeeId?: string;
  delegatedToName?: string;
  /** Areas granted by this action (for approve-all / approve-some). */
  approvedAreas?: FactoryArea[];
  /** Free-text reason / note attached to the action. */
  note?: string;
}

export interface VisitorAreaApprovalRequest {
  id: string;
  visitorLogEntryId: string;
  visitorName: string;
  visitorCompany: string;
  /** The host the visitor is here to see. */
  hostEmployeeId: string;
  hostName: string;
  /** Restricted areas reception requested on behalf of the visitor. */
  requestedAreas: FactoryArea[];
  /** What the host (or backup) ultimately approved. Empty until decided. */
  approvedAreas: FactoryArea[];
  status: VisitorApprovalStatus;
  /** Who the request is currently sitting with — starts as host, changes
   *  on delegate / escalate. Drives the inbox filter so the right person
   *  sees it. */
  currentApproverEmployeeId: string;
  currentApproverName: string;
  /** ISO timestamps for SLA tracking + escalation timer. */
  createdAt: string;
  decidedAt?: string;
  /** When set, the request expires automatically and access is revoked. */
  expiresAt?: string;
  /** Full audit trail — append-only. */
  history: VisitorApprovalAuditEntry[];
  /** Reception's free-text justification ("here for boardroom meeting"). */
  requestNote: string;
  /** Phase 106.4 — when the request was satisfied by a pre-booking, the
   *  booking id is recorded so the audit trail links the two. Reception
   *  doesn't get an approval request at all when a booking is found and
   *  is valid; this field is only populated when a booking exists but
   *  the visitor asked for areas BEYOND the booking's allowed list (so
   *  the host still has to approve the extras). */
  satisfiedByBookingId?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 106.4 — Pre-approved visitor bookings.
 *
 * Hosts create a booking ahead of time with the visitor's name, company,
 * the date / time window of the meeting, and the areas they're allowed
 * in. When the visitor arrives, reception (or the kiosk) matches the
 * name+date to a booking and skips the approval flow entirely for the
 * pre-approved areas — they're already cleared.
 *
 * Lifecycle:
 *   - created  → host fills in the form on My Stuff
 *   - active   → visitor checked in, within the time window
 *   - used     → visitor has left or the meeting end time has passed
 *   - expired  → end-of-day passed without check-in (no-show)
 *   - cancelled → host cancelled before the visit
 * ────────────────────────────────────────────────────────────────────────*/
export type VisitorBookingStatus = 'created' | 'active' | 'used' | 'expired' | 'cancelled';

export interface VisitorBooking {
  id: string;
  /** What the visitor will say at reception. Name-match is how we link
   *  the booking to the kiosk check-in, so capture this faithfully. */
  visitorName: string;
  visitorCompany: string;
  /** Optional — populate when known so reception can pre-load the
   *  visitor record from the kiosk. */
  visitorEmail: string;
  visitorPhone: string;
  /** Host (the employee being visited). Required so the booking belongs
   *  to someone. */
  hostEmployeeId: string;
  hostName: string;
  /** ISO date of the visit (YYYY-MM-DD). */
  visitDate: string;
  /** Optional time window — when blank the booking is valid all day. */
  startTime: string;
  endTime: string;
  /** Areas the host is pre-approving. Reception can't add to this list
   *  on check-in — anything extra triggers a normal approval request. */
  allowedAreas: FactoryArea[];
  /** Free-text purpose / notes shown on the kiosk + reception verify. */
  purpose: string;
  notes: string;
  status: VisitorBookingStatus;
  createdAt: string;
  createdByName: string;
  /** Set when reception checks the visitor in against this booking. */
  checkedInAt?: string;
  /** Linked visitor log entry id once arrival happens. */
  visitorLogEntryId?: string;
}

export interface VisitorBookingFormState {
  visitorName: string;
  visitorCompany: string;
  visitorEmail: string;
  visitorPhone: string;
  hostEmployeeId: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  allowedAreas: FactoryArea[];
  purpose: string;
  notes: string;
}

/** Find a booking that matches this arriving visitor.
 *  Match criteria: name match (case-insensitive, partial OK), same day,
 *  status not used/expired/cancelled. Returns the most-recent matching
 *  booking if any. Used by reception verify + kiosk auto-detect. */
export function findVisitorBooking(
  bookings: VisitorBooking[],
  visitorName: string,
  visitDate: string,
): VisitorBooking | undefined {
  const needle = visitorName.trim().toLowerCase();
  if (!needle) return undefined;
  return bookings
    .filter((b) => b.visitDate === visitDate)
    .filter((b) => b.status === 'created' || b.status === 'active')
    .filter((b) => {
      const name = b.visitorName.trim().toLowerCase();
      return name === needle || name.includes(needle) || needle.includes(name);
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
}

// ============================================================================
// FOOD SAFETY (Phase 5 — HACCP risk register)
// ============================================================================
//
// One row per identified hazard in the packaging process. Tracks the
// hazard, the control measure that mitigates it, the monitoring method,
// and the corrective action when the control fails. The risk level is
// re-computed at save time from likelihood × severity.

export type HaccpHazardType = 'Physical' | 'Chemical' | 'Biological' | 'Allergen';

export type HaccpProcessStep =
  | 'Raw Material Receiving'
  | 'Storage'
  | 'Slitting / Cutting'
  | 'Printing'
  | 'Bag Making'
  | 'Finishing'
  | 'Packing'
  | 'Dispatch'
  | 'Cleaning'
  | 'Maintenance'
  | 'Other';

export const HACCP_PROCESS_STEPS: HaccpProcessStep[] = [
  'Raw Material Receiving',
  'Storage',
  'Slitting / Cutting',
  'Printing',
  'Bag Making',
  'Finishing',
  'Packing',
  'Dispatch',
  'Cleaning',
  'Maintenance',
  'Other',
];

export type HaccpRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

/** Computed risk level from a 1-5 likelihood × 1-5 severity matrix. */
export function computeHaccpRiskLevel(likelihood: number, severity: number): HaccpRiskLevel {
  const score = Math.max(1, Math.min(5, likelihood)) * Math.max(1, Math.min(5, severity));
  if (score >= 16) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

export interface HaccpHazard {
  id: string;
  hazardNumber: string;
  createdAt: string;
  processStep: HaccpProcessStep;
  hazardType: HaccpHazardType;
  /** Short hazard name shown on the register. */
  hazardName: string;
  /** Full description of the hazard. */
  description: string;
  /** Likelihood 1-5 (rare → almost certain). */
  likelihood: number;
  /** Severity 1-5 (negligible → catastrophic). */
  severity: number;
  /** Computed from likelihood × severity. */
  riskLevel: HaccpRiskLevel;
  /** The control measure that mitigates the hazard. */
  controlMeasure: string;
  /** Whether the control measure is a Critical Control Point (CCP). */
  isCCP: boolean;
  /** What we measure to confirm the control is working. */
  monitoringMethod: string;
  /** How often we monitor (e.g. "Each batch", "Daily", "Per shift"). */
  monitoringFrequency: string;
  /** Acceptable / unacceptable thresholds (e.g. "Temp 21-23 C"). */
  criticalLimits: string;
  /** What we do when monitoring detects a deviation. */
  correctiveAction: string;
  /** How we verify the control measure works (audit, test, etc.). */
  verificationMethod: string;
  /** Person responsible for the control. */
  responsiblePerson: string;
  /** Review cycle in months. */
  reviewIntervalMonths: number;
  lastReviewedDate: string;
  notes: string;
}

export interface HaccpHazardFormState {
  processStep: HaccpProcessStep;
  hazardType: HaccpHazardType;
  hazardName: string;
  description: string;
  likelihood: string;
  severity: string;
  controlMeasure: string;
  isCCP: boolean;
  monitoringMethod: string;
  monitoringFrequency: string;
  criticalLimits: string;
  correctiveAction: string;
  verificationMethod: string;
  responsiblePerson: string;
  reviewIntervalMonths: string;
  lastReviewedDate: string;
  notes: string;
}

export interface HaccpHazardFilters {
  search: string;
  processStep: string;
  hazardType: string;
  riskLevel: string;
  ccpOnly: boolean;
}

// ============================================================================
// FOOD SAFETY (Phase 5.6 — SOP document control + customer FS requirements)
// ============================================================================
//
// SOPs are versioned. A new version supersedes the previous one but
// archived versions stay in the register for audit lookups.

export type SopCategory =
  | 'Food Safety Policy'
  | 'Hygiene'
  | 'Cleaning'
  | 'Material Receiving'
  | 'Supplier Approval'
  | 'Production'
  | 'Quality Control'
  | 'Product Hold & Release'
  | 'Complaint Handling'
  | 'Recall Procedure'
  | 'Pest Control'
  | 'Chemical Handling'
  | 'Maintenance'
  | 'Waste Handling'
  | 'Visitor Policy'
  | 'Foreign Object Policy'
  | 'Training'
  | 'Other';

export const SOP_CATEGORIES: SopCategory[] = [
  'Food Safety Policy',
  'Hygiene',
  'Cleaning',
  'Material Receiving',
  'Supplier Approval',
  'Production',
  'Quality Control',
  'Product Hold & Release',
  'Complaint Handling',
  'Recall Procedure',
  'Pest Control',
  'Chemical Handling',
  'Maintenance',
  'Waste Handling',
  'Visitor Policy',
  'Foreign Object Policy',
  'Training',
  'Other',
];

export type SopStatus = 'Draft' | 'Active' | 'Under Review' | 'Archived' | 'Superseded';

export interface SopAcknowledgement {
  staffName: string;
  acknowledgedDate: string;
}

export interface SopDocument {
  id: string;
  documentNumber: string;
  createdAt: string;
  /** Human title (e.g. "Pre-Production Hygiene SOP"). */
  title: string;
  category: SopCategory;
  /** Semantic version (e.g. "1.0", "1.1", "2.0"). */
  version: string;
  /** Who owns this SOP. */
  ownerName: string;
  /** Approved by + approval date. */
  approvedByName: string;
  approvedDate: string;
  /** When the next review is due. */
  reviewDate: string;
  /** URL / in-app reference to the actual SOP file (PDF, doc, etc.). */
  documentUrl: string;
  /** Short summary of the SOP content + last-change notes. */
  summary: string;
  status: SopStatus;
  /** Staff acknowledgements collected for this version. */
  acknowledgements: SopAcknowledgement[];
  /** If this SOP supersedes a previous version, the previous SOP's id. */
  supersedesId: string;
  notes: string;
  /** Phase 53 — which roles need to read & acknowledge this SOP. Empty
   *  or undefined = no targeting (back-compat with pre-Phase-53 docs;
   *  treated as "no one is nagged" unless mandatoryForAll is set). */
  audienceRoles?: UserRole[];
  /** Phase 53 — override flag. If true, the SOP is shown to every staff
   *  member regardless of role (Code of Conduct, Fire Safety, Foreign
   *  Object Policy etc.). */
  mandatoryForAll?: boolean;
}

export interface SopDocumentFormState {
  title: string;
  category: SopCategory;
  version: string;
  ownerName: string;
  approvedByName: string;
  approvedDate: string;
  reviewDate: string;
  documentUrl: string;
  summary: string;
  status: SopStatus;
  acknowledgements: SopAcknowledgement[];
  supersedesId: string;
  notes: string;
  audienceRoles: UserRole[];
  mandatoryForAll: boolean;
}

export interface SopDocumentFilters {
  search: string;
  category: string;
  status: string;
  reviewStatus: 'all' | 'overdue' | 'due-soon' | 'ok';
}

export const FOOD_SAFETY_MATERIAL_CATEGORY_LABELS: Record<FoodSafetyMaterialCategory, string> = {
  Paper: 'Paper',
  Board: 'Board',
  Greaseproof: 'Greaseproof / liner',
  Ink: 'Ink',
  Glue: 'Glue / adhesive',
  Handle: 'Handle / cord',
  Carton: 'Carton / packaging',
  CleaningChemical: 'Cleaning chemical',
  Lubricant: 'Lubricant',
  Other: 'Other',
};

export interface MaterialReceipt {
  id: string;
  receiptNumber: string;
  barcode: string;
  createdAt: string;
  receivedDate: string;
  supplierId: string;
  supplierName: string;
  supplierBatchNumber: string;
  internalRollCode: string;
  /** Phase 16 (Task #72) — discriminator that lets one form/table capture
   *  every kind of incoming material. Defaults to `'Paper'` so existing
   *  records keep working without migration. */
  materialKind?: MaterialKind;
  /** Free-text product name used when materialKind ≠ 'Paper' (e.g. "Cyan
   *  process ink — IK-450"). Paper rows leave this blank and continue to
   *  rely on paperType/gsm/width. */
  itemName?: string;
  paperType: string;
  gsm: string;
  width: string;
  quantityReceived: number;
  quantityAvailable: number;
  quantityUnit: QuantityUnit;
  fscClaimType: FscClaimType;
  supplierCertificateCode: string;
  invoiceReference: string;
  storageLocation: string;
  inspectionNotes: string;
  fscRelated: boolean;
  /** Phase 64 — uploaded photos. For paper, this is often the supplier
   *  label/wrapper showing roll code + GSM. For inks/glues/chemicals
   *  routed through Materials Receiving it's the drum + label. */
  photoUrls?: string[];
  /** Phase 71 — is this material itself food-safe? Drives the FG-batch
   *  food-safe derivation. Defaults to 'unknown' so receivers must pick. */
  isFoodSafe?: FoodSafeStatus;
  /** Phase 71 — supplier food-contact certification reference
   *  (e.g. ISEGA, BfR XXXVI, FDA 21 CFR 176.170). */
  foodContactCertNumber?: string;
  /** Phase 75 — slit-child lineage. When a Slitting production log creates
   *  this receipt, parentMaterialReceiptId points at the parent roll. Food-safe
   *  + FSC + paper grade are inherited from the parent on creation, so the
   *  chain-of-custody walk works even if the child's own cert column is blank. */
  parentMaterialReceiptId?: string;
  /** Phase 75 — production log entry that produced this receipt (slitting). */
  producedByProductionLogId?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 93 — Traded Goods.
 *
 * Items JomoPak buys finished from a third-party supplier (Shereno, China,
 * India contract printers, etc.) and resells. Distinct from manufactured
 * FG stock — no production cost, just landed cost + markup.
 *
 * Two-level model, mirroring Products + FinishedGoodsStock:
 *  - TradedGoodsItem = catalogue entry (the SKU / product spec). Default
 *    cost + sell sit here so a buyer can quickly log new receipts without
 *    re-typing prices each time.
 *  - TradedGoodsReceipt = one purchase batch. Cost + qty are pinned at
 *    receive time so margin reporting stays accurate even if the catalogue
 *    price changes later. Inventory rolls up by sum(qtyAvailable) per item.
 *
 * Pin-to-job: receipts may carry an optional clientId/jobId when bought
 * against a specific customer order. Plain stock (e.g. plain brown boxes
 * from China) leaves these blank and ages on the shelf until invoiced.
 * ────────────────────────────────────────────────────────────────────────*/

export type TradedGoodsStatus =
  | 'On order'        // PO placed, not yet received
  | 'In stock'        // received, available
  | 'Partial'         // some already sold
  | 'Sold out'        // fully invoiced / dispatched
  | 'Pinned to job';  // reserved against a specific job — not available for general sale

export interface TradedGoodsItem {
  id: string;
  /** Internal catalogue code, e.g. `TRG-SHERENO-A4-WHT`. Auto-generated
   *  if blank, see App.tsx receipt save handler. */
  itemCode: string;
  /** Display name, e.g. "Shereno 250gsm A4 box — white". */
  name: string;
  description: string;
  /** Supplier this item is normally bought from. A given item can still be
   *  re-sourced from a different supplier on a per-receipt basis. */
  defaultSupplierId: string;
  defaultSupplierName: string;
  /** Optional dimensions / spec — informational only, not used for pricing. */
  sizeSpec?: string;
  /** Default landed cost per unit (ZAR). Snapshot copied onto each new
   *  receipt at receive time so live edits don't rewrite history. */
  defaultUnitCost: number;
  /** Default markup % (cost-plus). 25 → sell at cost × 1.25. Either this
   *  or defaultSellPrice can be set; if both are set, defaultSellPrice wins. */
  defaultMarkupPercent: number;
  /** Optional explicit sell price overriding the markup calc. */
  defaultSellPrice?: number;
  unitLabel: string;       // 'unit', 'box', 'piece', 'pack'…
  active: boolean;
  notes: string;
  /** Photo of the item (catalogue thumbnail). */
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TradedGoodsReceipt {
  id: string;
  receiptNumber: string;
  /** ISO date when the goods physically arrived (or are expected to). */
  receivedDate: string;
  /** PO / supplier invoice reference (e.g. "Shereno INV-4421"). */
  supplierInvoiceReference: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  /** Supplier this batch came from (may differ from the item default). */
  supplierId: string;
  supplierName: string;
  /** Country of origin — useful for the "China / India" tracking the user
   *  wants. Defaults to South Africa / blank. */
  countryOfOrigin?: string;
  /** Quantity originally received. */
  quantityReceived: number;
  /** Quantity still available to sell. Decremented when invoiced / DN'd. */
  quantityAvailable: number;
  unitLabel: string;
  /** Landed unit cost in ZAR (snapshot). All costs in base currency for
   *  margin maths — FX conversion happens at PO receive time, not here. */
  unitCost: number;
  /** Either markup% or sellPrice is set. If both, sellPrice wins. */
  markupPercent: number;
  sellPrice: number;
  status: TradedGoodsStatus;
  /** Optional pin: when this batch was bought against a specific
   *  client/job, stash the IDs so the stock-on-hand view can warn
   *  before someone sells it to a different customer. */
  clientId?: string;
  clientName?: string;
  jobId?: string;
  jobNumber?: string;
  /** Optional storage location — same shelf-tagging idea as MaterialReceipts. */
  storageLocation?: string;
  notes: string;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TradedGoodsItemFormState {
  itemCode: string;
  name: string;
  description: string;
  defaultSupplierId: string;
  sizeSpec: string;
  defaultUnitCost: string;
  defaultMarkupPercent: string;
  defaultSellPrice: string;
  unitLabel: string;
  active: boolean;
  notes: string;
  photoUrls: string[];
}

export interface TradedGoodsReceiptFormState {
  receiptNumber: string;
  receivedDate: string;
  supplierInvoiceReference: string;
  itemId: string;
  supplierId: string;
  countryOfOrigin: string;
  quantityReceived: string;
  unitLabel: string;
  unitCost: string;
  markupPercent: string;
  sellPrice: string;
  status: TradedGoodsStatus;
  clientId: string;
  jobId: string;
  storageLocation: string;
  notes: string;
  photoUrls: string[];
}

export interface ProductionLogEntry {
  id: string;
  logNumber: string;
  createdAt: string;
  logDate: string;
  logType: ProductionLogType;
  jobId: string;
  jobNumber: string;
  customerName: string;
  operatorName: string;
  machineId: string;
  machine: string;
  sourceMaterialId: string;
  sourceMaterialCode: string;
  setupTimeMinutes: number;
  notes: string;
  operatorSignature: string;
  fscRelated: boolean;
  rollCode: string;
  height: string;
  gusset: string;
  handleType: string;
  goodBags: number;
  rejectBags: number;
  heightChange: string;
  printingMethod: string;
  bagSize: string;
  numberOfColors: number;
  quantityPrinted: number;
  materialSourceCode: string;
  rollWidth: string;
  metersKgPrinted: number;
  rejectMetersKg: number;
  parentRollCode: string;
  parentWidth: string;
  targetChildWidth: string;
  numberOfChildRolls: number;
  childDiameter: string;
  totalWasteKg: number;
  bladeChange: string;
}

export interface WasteEntry {
  id: string;
  wasteNumber: string;
  createdAt: string;
  wasteDate: string;
  jobId: string;
  jobNumber: string;
  customerName: string;
  productName: string;
  productionLogId: string;
  productionLogNumber: string;
  wasteQuantity: number;
  wasteUnit: QuantityUnit;
  wasteReason: WasteReason;
  notes: string;
  enteredBy: string;
  fscRelated: boolean;
}

export interface PaperLog {
  id: string;
  paperLogNumber: string;
  createdAt: string;
  logDate: string;
  jobId: string;
  jobNumber: string;
  customerName: string;
  materialReceiptId: string;
  materialReceiptNumber: string;
  paperType: string;
  gsm: string;
  width: string;
  quantityUsed: number;
  quantityUnit: QuantityUnit;
  paperCode: string;
  notes: string;
  fscRelated: boolean;
}

export interface DispatchRecord {
  id: string;
  dispatchNumber: string;
  createdAt: string;
  dispatchDate: string;
  jobId: string;
  jobNumber: string;
  customerName: string;
  finishedGoodsStockId: string;
  finishedGoodsStockNumber: string;
  quantityDispatched: number;
  quantityUnit: QuantityUnit;
  labelReference: string;
  deliveryReference: string;
  issueNotes: string;
  fscRelated: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 62 — Tooling (Dies + Stereos)
 *
 * One table, two flavours via toolType discriminator. Shared plumbing
 * for photos / docs / supplier / cost / status / usage trail. Each
 * flavour has a handful of role-specific fields:
 *
 *   Die:    dimensions, bag/box type, handle style, sharpening history
 *   Stereo: client, design name, version, sign-off, supersedes link
 *
 * Lives either Internal (Jomopak warehouse / die rack) or External
 * (held at a supplier — we need to defend "supplier says it needs
 * sharpening after one run" claims with our own usage records).
 * ────────────────────────────────────────────────────────────────────────*/
export type ToolType = 'die' | 'stereo';

export type ToolingStatus =
  | 'In Service'
  | 'Needs Sharpening'
  | 'In Repair'
  | 'Damaged'
  | 'Decommissioned'
  | 'Archived';

export const TOOLING_STATUSES: ToolingStatus[] = [
  'In Service', 'Needs Sharpening', 'In Repair', 'Damaged', 'Decommissioned', 'Archived',
];

export type ToolingLocation = 'Internal' | 'External';

/** A sharpening / refurbishment / repair event on a die. Stored as a
 *  jsonb array on the tool record so the lifecycle is auditable end-
 *  to-end (supplier says "needs sharpening" → we know exactly when it
 *  was last sharpened and how many runs since). */
export interface ToolingSharpeningEvent {
  id: string;
  eventDate: string;
  performedBy: string;       // supplier name or internal tech
  runsSinceLast: number;
  cost: number;
  invoiceNumber: string;
  notes: string;
}

export interface ToolingDimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

export interface Tooling {
  id: string;
  code: string;              // DIE-202605-001 / STR-202605-001
  createdAt: string;
  toolType: ToolType;
  name: string;
  description: string;
  /** Client this tool belongs to. Required for stereos (it's their IP),
   *  optional for dies (a die can be generic / shared across clients). */
  clientId: string;
  clientName: string;
  /** Where the tool physically lives + who's holding it. */
  location: ToolingLocation;
  supplierId: string;
  supplierName: string;
  /** Their internal tag / shelf reference so we can find it during an audit. */
  supplierReference: string;
  /** Internal storage location when location === 'Internal'. */
  internalLocation: string;
  /** Cost + paid trail. */
  cost: number;
  currency: CurrencyCode;
  paidDate: string;
  supplierInvoiceNumber: string;
  /** Status — drives filters + dashboards. */
  status: ToolingStatus;
  /** Photos of the tool itself (and for stereos, the printed sample). */
  photoUrls: string[];
  /** PDF / image documents attached: drawings, sign-off forms, supplier
   *  invoices, technical specs. */
  documentUrls: string[];
  notes: string;
  active: boolean;
  /** Usage trail — bumped automatically whenever a job uses this tool. */
  lastUsedAt: string;
  runCount: number;
  /** Die-specific fields. Nullable so stereo records load cleanly. */
  dimensions?: ToolingDimensions;
  bagType?: string;          // SOS / Tote / Pinch-bottom / Box / etc.
  handleType?: HandleType;
  bottomStyle?: string;      // Flat / Block / SOS / Square / Hex
  sharpeningHistory?: ToolingSharpeningEvent[];
  /** Stereo-specific fields. Nullable so die records load cleanly. */
  designName?: string;       // "Mother's Day 2026 v3"
  designVersion?: number;
  /** When a new stereo version is approved, the OLD record gets
   *  supersededByToolId set so it's archived but searchable. */
  supersededByToolId?: string;
  supersedesToolId?: string;
  /** Client sign-off proof. */
  signedOffByName?: string;
  signedOffAt?: string;
  signatureDataUrl?: string;
  signedSampleDocumentUrl?: string;
  /** Optimistic concurrency. */
  version?: number;
  rowUpdatedAt?: string;
}

export interface ToolingFilters {
  search: string;
  status: ToolingStatus | 'all';
  location: ToolingLocation | 'all';
  client: string;
  supplier: string;
  /** Free-text dimension search — sales types "240x120" or "A4" etc.
   *  We match against the dimensions + name + description. Dies only. */
  sizeQuery: string;
  activeOnly: boolean;
}

export interface ToolingFormState {
  toolType: ToolType;
  name: string;
  description: string;
  clientId: string;
  location: ToolingLocation;
  supplierId: string;
  supplierReference: string;
  internalLocation: string;
  cost: string;
  currency: CurrencyCode;
  paidDate: string;
  supplierInvoiceNumber: string;
  status: ToolingStatus;
  photoUrls: string[];
  documentUrls: string[];
  notes: string;
  active: boolean;
  // Die-specific
  widthMm: string;
  heightMm: string;
  depthMm: string;
  bagType: string;
  handleType: HandleType;
  bottomStyle: string;
  // Stereo-specific
  designName: string;
  designVersion: string;
  supersedesToolId: string;
  signedOffByName: string;
  signedOffAt: string;
  signatureDataUrl: string;
  signedSampleDocumentUrl: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 61 — Dispatch Run (Route Sheet / Trip Sheet)
 *
 * A higher-level concept than DispatchRecord. One run = one driver +
 * one vehicle + one day + an ordered list of delivery notes (stops).
 *
 * Lifecycle:
 *   Planned   → dispatch supervisor created the run and assigned DNs
 *   Loaded    → warehouse signed off that the vehicle is physically loaded
 *   In Progress → driver left the yard (departureTime set)
 *   Completed → all stops have a POD captured (or marked Failed)
 *   Cancelled → run abandoned before departure
 *
 * The driver's PWA shows the next 'In Progress' or 'Loaded' run assigned
 * to them. They tap a stop, capture POD, swipe to the next stop. When
 * all stops are reconciled the run flips to Completed.
 *
 * The legacy DispatchRecord stays for ad-hoc / sample-out cases that
 * don't fit a planned run.
 * ────────────────────────────────────────────────────────────────────────*/
export type DispatchRunStatus = 'Planned' | 'Loaded' | 'In Progress' | 'Completed' | 'Cancelled';

export interface DispatchRunStop {
  /** Order in the route (0-indexed). Drag-to-reorder updates this. */
  sequence: number;
  /** FK to the delivery note this stop fulfils. */
  deliveryNoteId: string;
  /** Convenience copies so the driver's offline payload doesn't need to
   *  join. Rebuilt from the DN whenever the run is opened. */
  deliveryNoteNumber: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  /** Driver-captured arrival / departure times (best-effort). */
  arrivedAt?: string;
  completedAt?: string;
  /** Per-stop outcome — mirrors POD outcome. Undefined until POD captured. */
  outcome?: 'Delivered' | 'Partial' | 'Refused' | 'Failed';
  /** Notes captured at the stop (e.g. "gate closed, left at security"). */
  notes?: string;
}

export interface DispatchRun {
  id: string;
  runNumber: string;
  createdAt: string;
  /** Day the run is scheduled to depart. */
  runDate: string;
  /** Assigned driver. driverUserId points at a JomoPak profile when the
   *  driver has an account; driverName is always set for printable
   *  manifests + casual contractors. */
  driverUserId: string;
  driverName: string;
  /** Vehicle assignment — free text for now (e.g. "CA 12-345 GP / Hilux"). */
  vehicleRegistration: string;
  vehicleDescription: string;
  /** Lifecycle status. */
  status: DispatchRunStatus;
  /** Ordered list of stops (each is one delivery note). */
  stops: DispatchRunStop[];
  /** Timestamps for each lifecycle transition — drive SMETA + audit. */
  plannedAt: string;
  loadedAt: string;
  loadedByName: string;
  departureTime: string;
  returnTime: string;
  completedAt: string;
  /** Odometer captured at start / end of the run for fleet costing. */
  odometerStart: number;
  odometerEnd: number;
  /** Free-form planner notes (e.g. "Bongani — leave by 06:30 for Sandton"). */
  notes: string;
  /** Optimistic concurrency token. */
  version?: number;
  rowUpdatedAt?: string;
}

export interface DispatchRunFilters {
  search: string;
  driver: string;
  status: DispatchRunStatus | 'all';
  fromDate: string;
  toDate: string;
}

export interface DispatchRunFormState {
  runDate: string;
  driverUserId: string;
  driverName: string;
  vehicleRegistration: string;
  vehicleDescription: string;
  status: DispatchRunStatus;
  /** Selected DN ids in stop order. */
  deliveryNoteIds: string[];
  notes: string;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  createdAt: string;
  noteDate: string;
  clientId: string;
  clientName: string;
  clientContactName: string;
  clientContactPhone: string;
  clientEmail: string;
  clientAddress: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  jobId: string;
  jobNumber: string;
  dispatchRecordIds: string[];
  customerStockReleaseIds: string[];
  deliveryMethod: 'Delivery' | 'Collection' | 'Courier';
  deliveryReference: string;
  vehicleRegistration: string;
  driverName: string;
  dispatchedBy: string;
  receivedBy: string;
  status: 'Draft' | 'Issued' | 'Delivered' | 'Collected';
  clientVisible: boolean;
  lineItems: DeliveryNoteLineItem[];
  notes: string;
  /** Stock-holding link: the paid invoice this partial delivery draws against. */
  parentInvoiceId: string;
  parentInvoiceNumber: string;
  /** Phase 74 — source FG batch (set when the DN was promoted from a finished
   *  goods batch). Drives the auto-deduction on first save. */
  sourceFinishedGoodsStockId?: string;
  /** Signature / collection capture for proof-of-delivery. */
  receiptMode: DeliveryReceiptMode;
  signedByName: string;
  signedByDate: string;
  signedByContactInfo: string;
  collectedByName: string;
  collectedByDate: string;
  collectedByIdNumber: string;
  /** Phase 34 — customer-facing note printed on the delivery note. */
  customerNote?: string;
  /** Phase 61 — the Dispatch Run this DN is bundled into, if any.
   *  Empty for DNs not yet assigned to a run (the dispatcher's
   *  "ready to ship" queue) or DNs that bypass runs entirely. */
  dispatchRunId?: string;
  dispatchRunNumber?: string;
}

export interface InvoiceLineItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  unitPriceExclVat: number;
  vatRatePercent: number;
  lineTotalExclVat: number;
  lineTotalInclVat: number;
  /** Total physically delivered against this line so far (sum across delivery notes). */
  quantityDeliveredToDate: number;
}

export interface InvoicePayment {
  id: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
  /** FX settlement rate to base at payment date (foreign docs). */
  exchangeRate?: number;
  /** Whether realised FX for this payment has been posted to the GL. */
  fxPosted?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  /** Optimistic concurrency token (phase 14). See JobCard.version. */
  version?: number;
  /** Server-side update timestamp. */
  rowUpdatedAt?: string;
  /** Phase 74 — source FG batch (set when the invoice was promoted from a
   *  finished goods batch). Drives the auto-deduction on first save. */
  sourceFinishedGoodsStockId?: string;
  createdAt: string;
  invoiceDate: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  clientCompanyName: string;
  clientVatNumber: string;
  clientBillingAddress: string;
  clientContactName: string;
  clientContactEmail: string;
  clientContactPhone: string;
  /** Optional link to upstream documents. */
  jobId: string;
  jobNumber: string;
  quoteId: string;
  quoteNumber: string;
  productionSpecId: string;
  productionSpecNumber: string;
  /** Job/order reference printed on the invoice (PO number etc.). */
  customerReference: string;
  termsType: InvoiceTermsType;
  termsText: string;
  notes: string;
  footerNotes: string;
  status: InvoiceStatus;
  currency: CurrencyCode;
  /** Booking exchange rate to base (ZAR) at invoice date. 1 for ZAR. */
  exchangeRate?: number;
  lineItems: InvoiceLineItem[];
  /** Computed totals (snapshotted at save). */
  subtotalExclVat: number;
  vatTotal: number;
  totalInclVat: number;
  /** Payments captured against the invoice. */
  payments: InvoicePayment[];
  amountPaid: number;
  amountOutstanding: number;
  /** Stock-holding metadata — invoice is paid in full but stock is released over time. */
  stockHoldingApplies: boolean;
  stockHoldingStatus: StockHoldingStatus;
  stockHoldingStartDate: string;
  /** Days from start until storage agreement expires. 0 = no limit. */
  stockHoldingMaxDays: number;
  /** Linked delivery note IDs that have drawn from this invoice. */
  deliveryNoteIds: string[];
  clientVisible: boolean;
  /** Phase 34 — customer-facing note printed on the invoice. */
  customerNote?: string;
  /** Phase 120 — Parent pro-forma if this Tax Invoice was raised from a
   *  pro-forma. Empty for legacy direct invoices. Drives the audit
   *  banner "Part of pro-forma PF-2026-001 · Tax Invoice 1 of 2" and
   *  lets us roll up the full chain when SARS asks where this revenue
   *  came from. */
  proformaId?: string;
  proformaNumber?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 120 — Pro-forma invoices.
 *
 * THE FLOW:
 *   1. Quote accepted → Pro-forma issued (NOT a Tax Invoice). Pro-forma
 *      is a request for payment with no accounting impact. It is clearly
 *      marked "PRO FORMA INVOICE — NOT A TAX INVOICE" so the customer
 *      can't use it as a SARS-compliant tax document.
 *   2. Customer pays (full / 50% / a deposit). Payment is captured as a
 *      CustomerDeposit (Phase 119) linked to this pro-forma.
 *   3. Admin clicks "Generate Tax Invoice for R X received". System
 *      raises a real Invoice with VAT, links it back to the parent
 *      pro-forma, and allocates the deposit against it. VAT output
 *      triggers at this point (SARS-compliant: tax invoice = revenue
 *      recognition + VAT trigger).
 *   4. For 50/50 deals: two payments → two tax invoices, each carrying
 *      half the VAT. The pro-forma stays open until fully invoiced.
 *   5. Goods can release on payment proof (per Aman's choice — we don't
 *      block delivery just because the tax invoice hasn't been issued).
 *      Tax invoices must follow within 21 days of payment receipt per
 *      SARS rules.
 *
 * Status lifecycle:
 *   Draft → Sent → PartiallyPaid → FullyPaid
 *                                ↘ Cancelled
 *
 * Relationship to Invoice:
 *   Pro-forma is the PARENT; one pro-forma can spawn many tax invoices
 *   (one per payment received). Each Invoice.proformaId points back.
 *   Pro-forma totals are the source of truth; tax invoices sum to the
 *   pro-forma when fully paid.
 *
 * Why not just use Invoice with a "draft" flag?
 *   - Different numbering sequence (PF vs INV) for SARS clarity.
 *   - Different accounting treatment (no VAT, no revenue).
 *   - Different lifecycle (one pro-forma → many invoices).
 *   - Different printable (clearly marked "NOT A TAX INVOICE").
 *
 * The Pro-forma shape mirrors Invoice closely so the form / printable
 * can reuse most of the existing components.
 * ─────────────────────────────────────────────────────────────────── */

export type ProFormaStatus =
  | 'Draft'
  | 'Sent'
  | 'PartiallyPaid'   // one or more tax invoices issued; pro-forma not fully drawn down
  | 'FullyPaid'       // sum(linkedInvoices.totalInclVat) === totalInclVat
  | 'Cancelled';

export const PROFORMA_STATUS_LABELS: Record<ProFormaStatus, string> = {
  Draft: 'Draft',
  Sent: 'Sent',
  PartiallyPaid: 'Partially paid',
  FullyPaid: 'Fully paid',
  Cancelled: 'Cancelled',
};

export interface ProForma {
  id: string;
  proformaNumber: string;
  version?: number;
  rowUpdatedAt?: string;
  createdAt: string;
  proformaDate: string;
  validUntilDate: string;          // pro-formas typically expire — usually 30 days
  // Client snapshot (so the doc doesn't change retroactively if client is edited)
  clientId: string;
  clientName: string;
  clientCompanyName: string;
  clientVatNumber: string;
  clientBillingAddress: string;
  clientContactName: string;
  clientContactEmail: string;
  clientContactPhone: string;
  // Upstream links
  jobId: string;
  jobNumber: string;
  quoteId: string;
  quoteNumber: string;
  customerReference: string;
  // Body
  termsType: InvoiceTermsType;     // reuse the same terms semantics as Invoice
  termsText: string;
  notes: string;
  footerNotes: string;
  status: ProFormaStatus;
  currency: CurrencyCode;
  exchangeRate?: number;
  lineItems: InvoiceLineItem[];    // pro-forma uses the same line item shape
  // Totals (frozen at save — mirrors Invoice for ease of conversion)
  subtotalExclVat: number;
  vatTotal: number;                // computed but NOT a VAT liability until tax-invoiced
  totalInclVat: number;
  // Conversion tracking (Phase 120.6)
  linkedInvoiceIds: string[];      // every Tax Invoice raised from this pro-forma
  /** Sum of linked Tax Invoices' totalInclVat. */
  amountInvoiced: number;
  /** totalInclVat - amountInvoiced. Drives the "Generate Tax Invoice for R X" prompt. */
  amountStillToInvoice: number;
  /** Sum of CustomerDeposit.amount where deposit.proformaId === this.id and not yet invoiced. */
  amountReceivedNotYetInvoiced: number;
  /** Customer-facing note printed on the pro-forma. */
  customerNote?: string;
  /** Phase 120 — Payment expectation prints on the pro-forma. Inherits from
   *  client.paymentModel by default but can be overridden per pro-forma. */
  paymentExpectation?: CustomerPaymentModel;
  clientVisible: boolean;
}

/** Pro-forma form state — same field types as InvoiceFormState but
 *  status is constrained to ProFormaStatus. */
export interface ProFormaFormState {
  proformaDate: string;
  validUntilDate: string;
  clientId: string;
  jobId: string;
  jobNumber: string;
  quoteId: string;
  quoteNumber: string;
  customerReference: string;
  termsType: InvoiceTermsType;
  termsText: string;
  notes: string;
  footerNotes: string;
  status: ProFormaStatus;
  currency: CurrencyCode;
  exchangeRate: string;
  lineItems: InvoiceLineItemFormState[];
  clientVisible: boolean;
  customerNote: string;
  paymentExpectation: CustomerPaymentModel;
}

export interface ProductionSpec {
  id: string;
  specNumber: string;
  createdAt: string;
  specDate: string;
  status: ProductionSpecStatus;
  clientId: string;
  clientName: string;
  clientCompanyName: string;
  productId: string;
  productName: string;
  jobId: string;
  jobNumber: string;
  /** Physical specs. */
  sizeWidthMm: number;
  sizeHeightMm: number;
  sizeGussetMm: number;
  paperGsm: number;
  paperType: string;
  handleType: HandleType;
  finishingNotes: string;
  /** Print specs. */
  printMethod: PrintMethod;
  printColours: number;
  pantoneReferences: string;
  artworkReference: string;
  printPositionNotes: string;
  /** Order specs. */
  quantityOrdered: number;
  quantityUnit: QuantityUnit;
  leadTimeDays: number;
  packingFormat: SupplyFormat;
  packingNotes: string;
  /** Approval / sign-off. */
  approvedBy: string;
  approvedDate: string;
  notes: string;
  clientVisible: boolean;
}

export interface StockChangeLog {
  id: string;
  createdAt: string;
  finishedGoodsStockId: string;
  stockNumber: string;
  productName: string;
  action: 'created' | 'updated' | 'deleted';
  changedByUserId: string;
  changedByName: string;
  previousQuantityOnHand: number;
  nextQuantityOnHand: number;
  previousQuantityReserved: number;
  nextQuantityReserved: number;
  notes: string;
 }

export interface InventoryMovement {
  id: string;
  movementNumber: string;
  createdAt: string;
  movementDate: string;
  itemType: InventoryItemType;
  movementType: InventoryMovementType;
  barcode: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityMoved: number;
  quantityUnit: QuantityUnit;
  fromLocation: string;
  toLocation: string;
  jobId: string;
  jobNumber: string;
  movedByUserId: string;
  movedByName: string;
  notes: string;
}

export interface BiEvent {
  id: string;
  createdAt: string;
  occurredAt: string;
  sourceTable: string;
  sourceRecordId: string;
  eventCategory: string;
  eventType: string;
  action: string;
  summary: string;
  actorName: string;
  jobId: string;
  jobNumber: string;
  clientId: string;
  clientName: string;
  visibilityScope: 'internal' | 'client_shared' | 'client_only';
  details: Record<string, unknown>;
}

/**
 * Branded company details printed on every Invoice / Delivery Note /
 * Production Spec letterhead. Editable from Settings → Branding.
 */
export interface AppSettingsCompany {
  name: string;
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  vatNumber: string;
  /**
   * Public URL of the PRIMARY logo file. Kept as the backward-compatible
   * single-logo field. When the multi-logo brandLogos[] array on AppSettings
   * is non-empty, that wins per-document; otherwise we fall back here.
   */
  logoUrl: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 115 — Brand assets library.
 *
 * The CEO wants to be able to upload more than one logo (e.g. main mark,
 * FSC-certified mark, co-branded mark, festive-season alt) and pick which
 * one prints on which kind of document. One is always marked default — any
 * doc type without a specific assignment uses that.
 *
 * The picker logic lives in resolveDocumentLogo() in utils/printing.ts.
 *
 * Document kinds:
 *   We deliberately keep this list as a string-union (not just `string`)
 *   so the multi-select picker in Settings shows a finite set of options
 *   that match the actual printables in the dashboard.
 * ────────────────────────────────────────────────────────────────────────*/

export type DocumentKind =
  | 'invoice'
  | 'proforma'
  | 'quote'
  | 'deliveryNote'
  | 'productionSpec'
  | 'workTicket'
  | 'jobCard'
  | 'stockStatement'
  | 'customerStatement'
  | 'staffWarning'
  | 'ui19'
  | 'payslip'
  | 'irp5'
  | 'morningDigest'
  | 'auditCertificate'
  | 'noticeBroadcast'
  | 'ppeAcknowledgement'
  | 'firstAidSlip'
  | 'incidentReport'
  | 'sopDocument';

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  invoice: 'Tax Invoices',
  proforma: 'Pro-forma Invoices',
  quote: 'Quotes',
  deliveryNote: 'Delivery Notes',
  productionSpec: 'Production Specs',
  workTicket: 'Work Tickets',
  jobCard: 'Job Cards',
  stockStatement: 'Stock Statements',
  customerStatement: 'Customer Statements',
  staffWarning: 'Staff Warnings',
  ui19: 'UI-19 (UIF declaration)',
  payslip: 'Payslips',
  irp5: 'IRP5 / IT3a',
  morningDigest: 'Morning Digest',
  auditCertificate: 'Audit Certificates',
  noticeBroadcast: 'Notices / Broadcasts',
  ppeAcknowledgement: 'PPE Acknowledgement',
  firstAidSlip: 'First Aid Slip',
  incidentReport: 'Incident Report',
  sopDocument: 'SOP Documents',
};

export interface BrandLogo {
  id: string;
  /** Admin-facing label so the picker in Settings reads sensibly. */
  label: string;
  /** Public URL — usually a Supabase Storage URL with a cache-buster. */
  url: string;
  /** Exactly one BrandLogo should be marked default. The resolver
   *  enforces this — see resolveDocumentLogo(). */
  isDefault: boolean;
  /** Empty array = "use everywhere by default". A non-empty array pins
   *  this logo to ONLY those doc types, overriding the default for them. */
  appliesToDocumentTypes: DocumentKind[];
  uploadedAt: string;
  uploadedBy: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 109.1 — Accounting standard.
 *
 * Two flavours covered:
 *
 *   - 'IFRS'    — International Financial Reporting Standards. The default
 *                 for South African private + public companies, harmonised
 *                 with the Companies Act 2008. South Africa actually
 *                 mandates IFRS for listed entities (JSE) and IFRS for
 *                 SMEs is the safe choice for unlisted Pty (Ltd)s. Locks
 *                 inventory to FIFO / Weighted Average; capitalises all
 *                 leases > 12 months (IFRS 16); straight-line depreciation
 *                 is the default expected unless useful-life justification
 *                 says otherwise.
 *
 *   - 'US_GAAP' — US Generally Accepted Accounting Principles. Used by
 *                 US-incorporated entities and any subsidiary that
 *                 reports up to a US parent. Allows LIFO inventory
 *                 (banned under IFRS); ASC 842 lease treatment
 *                 (operating + finance distinction retained); straight-
 *                 line OR accelerated (declining balance, MACRS) depn.
 *
 * Switching the flag does NOT retroactively restate existing journals —
 * it only changes go-forward defaults (depreciation method picker on new
 * fixed assets, inventory valuation default, projection engine
 * assumptions). The accounting department still has to actually re-state
 * if you change standards mid-year. The flag is a guard rail, not a
 * legal binding. ────────────────────────────────────────────────────────*/
export type AccountingStandard = 'IFRS' | 'US_GAAP';

export const ACCOUNTING_STANDARDS: Array<{
  key: AccountingStandard;
  label: string;
  description: string;
}> = [
  {
    key: 'IFRS',
    label: 'IFRS',
    description:
      'International Financial Reporting Standards. Default for South African and most non-US entities. FIFO or weighted-average inventory only (no LIFO). Single income-statement format allowed. Operating leases capitalised under IFRS 16.',
  },
  {
    key: 'US_GAAP',
    label: 'US GAAP',
    description:
      'US Generally Accepted Accounting Principles. Required for US-incorporated entities. Allows LIFO inventory. Multi-step income statement. ASC 842 distinguishes operating vs finance leases. Allows accelerated depreciation (MACRS).',
  },
];

/** Inventory valuation methods, gated by standard. */
export type InventoryValuationMethod = 'FIFO' | 'Weighted Average' | 'LIFO' | 'Specific Identification';

/** What inventory methods are allowed under each standard. The Fixed
 *  Assets / inventory pages should validate against this — LIFO is
 *  prohibited under IFRS, so a switch from US GAAP to IFRS forces the
 *  user to confirm a re-valuation pass on any LIFO inventory. */
export const INVENTORY_METHODS_BY_STANDARD: Record<AccountingStandard, InventoryValuationMethod[]> = {
  IFRS:    ['FIFO', 'Weighted Average', 'Specific Identification'],
  US_GAAP: ['FIFO', 'Weighted Average', 'LIFO', 'Specific Identification'],
};

/** Depreciation methods allowed under each standard. Both standards
 *  permit straight-line; only US GAAP cleanly permits MACRS / accelerated
 *  for tax-aligned reporting. */
export const DEPRECIATION_METHODS_BY_STANDARD: Record<AccountingStandard, string[]> = {
  IFRS:    ['Straight-line', 'Diminishing balance', 'Units of production'],
  US_GAAP: ['Straight-line', 'Diminishing balance', 'Units of production', 'MACRS / Accelerated'],
};

/**
 * Default footer copy + payment terms that appear on each printable doc when
 * the per-doc override field is left blank. Editable from Settings → Templates.
 */
export interface AppSettingsTemplates {
  invoiceFooterLines: string[];
  deliveryNoteFooterLines: string[];
  productionSpecFooterLines: string[];
  defaultPaymentTerms: string;
  defaultInvoiceNotes: string;
  defaultDeliveryNoteNotes: string;
  /** Phase 34 — default customer-facing note that pre-fills new invoices,
   *  quotes, and delivery notes (editable per document). */
  defaultCustomerNote: string;
  /** Phase 34 — SHORT "basic terms" blurb printed on quotes & invoices only
   *  (the full T&Cs live online / in Word — see termsReferenceLine). */
  termsAndConditions: string;
  /** Phase 34 — one-line pointer to the full T&Cs, e.g. "Full terms &
   *  conditions available at jomopak.co.za/terms". Printed under basic terms. */
  termsReferenceLine: string;
}

/**
 * Stock-holding agreement defaults applied to new clients/invoices unless
 * overridden. Editable from Settings → Stock-holding.
 */
export interface AppSettingsStockHolding {
  defaultMaxDays: number;
  defaultReviewCadenceDays: number;
  defaultAgreementTermsText: string;
}

/**
 * SARS / tax-calendar configuration. Drives the deadline generator and which
 * obligations show up in the SARS Centre. Editable from the SARS Centre header.
 */
export interface AppSettingsSarsConfig {
  vatRegistered: boolean;
  /** Bi-monthly VAT category: A = periods ending odd months (Jan, Mar, …),
   *  B = periods ending even months (Feb, Apr, …). */
  vatCategory: 'A' | 'B';
  vatFrequency: 'bimonthly' | 'monthly';
  /** Whether payroll obligations (EMP201/EMP501) are tracked. */
  payrollActive: boolean;
  /** Financial year-end month, 1–12. Most SA companies use 2 (end February). */
  financialYearEndMonth: number;
}

/**
 * Multi-currency config (Phase 31). Base currency is ZAR; foreign currencies
 * carry a rate-to-base. `rateToBase` means: 1 unit of the currency = rateToBase
 * ZAR (e.g. USD rateToBase 18.50). `asOf` is when the rate was last set —
 * structured so an auto-fetch routine can update rates + asOf later.
 */
export interface ExchangeRate {
  code: string;      // e.g. 'USD'
  rateToBase: number;
  asOf: string;      // ISO date
}

export interface AppSettingsCurrencyConfig {
  baseCurrency: string; // 'ZAR'
  rates: ExchangeRate[];
}

export interface AppSettings {
  id: 'default';
  company: AppSettingsCompany;
  templates: AppSettingsTemplates;
  stockHolding: AppSettingsStockHolding;
  sarsConfig: AppSettingsSarsConfig;
  currencyConfig: AppSettingsCurrencyConfig;
  connectorConfig: AppSettingsConnectorConfig;
  /** Phase 90 — Company-wide standard margin %. Drives every quote unless
   *  an admin explicitly overrides on the line. Only the admin role can
   *  edit this in Settings. Defaults to 35% so the engine has something
   *  sensible to compute against on a fresh install. */
  standardMarginPercent?: number;
  /**
   * Phase 131.3 — Default paper-rate region for THIS deploy / branch.
   *
   * White-label foundation: when a factory has multiple branches each
   * sourcing from a different supplier warehouse, this is the per-deploy
   * setting that controls which regional price the calculator picker
   * sees. Today every catalogue row may exist as DBN/JHB/CT variants
   * with the same publicLabel; this setting tells the picker which one
   * to prefer.
   *
   * Behaviour when set:
   *   - Picker dedupes to one option per publicLabel, preferring rows
   *     matching this region.
   *   - When no matching region row exists for a label, falls back to
   *     the MOST EXPENSIVE matching row (safer cost basis).
   *
   * Behaviour when unset:
   *   - Picker picks the most expensive row per publicLabel.
   *
   * Default for the JomoPak install: 'JHB' (single-site, Joburg).
   */
  defaultPaperRegion?: PaperRegion;
  /** Phase 106 — Visitor area approval policy.
   *
   * Per-area override of DEFAULT_AREA_SAFETY. Admins flip areas from safe
   * → restricted (or back) on the Settings → Visitor access tab. Any area
   * not in this map uses the default. Stored as a partial map so a fresh
   * install needs no migration — the empty object means "all defaults". */
  visitorAreaPolicy?: Partial<Record<FactoryArea, AreaSafety>>;
  /** Phase 106.3 — Minutes the system waits for host approval before
   *  auto-escalating to the backup approver. Default 5. */
  visitorApprovalEscalationMinutes?: number;
  /** Phase 109.1 — Accounting standard the dashboard reports under.
   *  Drives downstream behaviour:
   *    - IFRS:      straight-line depreciation default, FIFO/weighted-avg
   *                 inventory only (no LIFO), capitalises operating
   *                 leases, single-step income statement allowed.
   *    - US_GAAP:   straight-line OR accelerated depreciation allowed,
   *                 FIFO / LIFO / weighted-avg inventory, ASC 842
   *                 lease treatment, multi-step income statement.
   *
   *  Defaults to 'IFRS' on a fresh install (South Africa uses IFRS for
   *  public companies, IFRS for SMEs for private — both align with the
   *  Companies Act). Change in Settings → Accounting. */
  accountingStandard?: AccountingStandard;
  /** Phase 110.1 — Payroll defaults (rates, leave, payslip layout, EFT). */
  payrollConfig?: AppSettingsPayrollConfig;
  /** Phase 119 — Default tax treatment for customer deposits. 'proforma'
   *  matches what most SA factories do (simpler bookkeeping); switching
   *  to 'taxInvoiceOnReceipt' triggers output VAT on the deposit and is
   *  the SARS-compliant treatment under deemed-supply rules. Per-deposit
   *  override is still available on capture. Settings → Accounting. */
  depositTaxTreatment?: DepositTaxTreatment;
  /** Phase 121 — Help videos per page. Key = page identifier (matches
   *  the View type for that page). Value = video URL (YouTube/Vimeo
   *  unlisted). When set, the matching page renders a "▶ Watch how to
   *  use this page" link at the bottom. Empty / missing keys hide the
   *  link entirely. Drives the low-literacy-friendly help layer. */
  helpVideos?: Record<string, string>;
  /** Phase 110.2 — Accounting defaults (VAT rates, payment terms, default
   *  retained-earnings account). Sits alongside sarsConfig — sarsConfig
   *  drives SARS filings, this drives bookkeeping behaviour. */
  accountingConfig?: AppSettingsAccountingConfig;
  /** Phase 110.3 — Document numbering — per-doc prefix + next number. */
  numberingConfig?: AppSettingsNumberingConfig;
  /** Phase 110.4 — Company bank accounts (for EFT exports + invoice footers). */
  bankAccounts?: AppSettingsBankAccount[];
  /** Phase 110.6 — Employer details + SARS filing references. */
  employerDetails?: AppSettingsEmployerDetails;
  /** Phase 110.7 — Beneficiaries (funds, medical aids, unions, garnishees). */
  beneficiaries?: AppSettingsBeneficiary[];
  /** Phase 115 — Brand assets library. Multiple uploaded logos with per-
   *  document-type assignments. Optional so existing installs keep using
   *  company.logoUrl until the admin populates this. */
  brandLogos?: BrandLogo[];
  /** Last-write metadata, surfaced in the UI so admins can see who changed what. */
  updatedAt: string;
  updatedBy: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 110.1 — Payroll defaults.
 *
 * Mirrors the "Settings" page of SimplePay. These values are read by the
 * Payroll page when computing PAYE / UIF / SDL on each payslip, and by the
 * Employees + Leave pages when defaulting entitlements.
 *
 * Statutory values are South African defaults at FY2025/26. Admin can edit
 * any of them — the values that don't apply to a particular employee get
 * overridden on the Employee profile.
 * ────────────────────────────────────────────────────────────────────────*/

export type PayFrequency = 'monthly' | 'weekly' | 'fortnightly';

export interface AppSettingsPayrollConfig {
  /** How often payslips are produced. */
  payFrequency: PayFrequency;
  /** For monthly pay: day-of-month salaries hit accounts. Default 25. */
  payDayOfMonth: number;
  /** UIF — 1% employee + 1% employer of remuneration, capped at the
   *  earnings ceiling (R17 712 / month for FY2025/26). */
  uifEmployeePercent: number;
  uifEmployerPercent: number;
  uifEarningsCeilingMonthly: number;
  /** SDL — 1% of total payroll, employer cost. Exempt if annual payroll
   *  under R500 000. */
  sdlPercent: number;
  sdlExemptionAnnualPayrollUnder: number;
  /** PAYE tax rebates (annual amounts in ZAR). */
  payePrimaryRebateAnnual: number;
  payeSecondaryRebateAnnual: number;
  payeTertiaryRebateAnnual: number;
  /** BCEA leave defaults. */
  annualLeaveDaysPerYear: number;
  sickLeaveDaysPerCycle: number;
  sickLeaveCycleMonths: number;
  familyResponsibilityDaysPerYear: number;
  /** Public holidays observed this year — ISO yyyy-mm-dd strings. */
  publicHolidays: string[];
  /** Employee number format. e.g. "EMP-{seq:4}" → EMP-0001. */
  employeeNumberPrefix: string;
  employeeNumberNextSeq: number;
  employeeNumberPadding: number;
  /** Payslip layout flags. */
  payslipShowYtd: boolean;
  payslipShowLeaveBalance: boolean;
  payslipShowLoanBalance: boolean;
  payslipFooterNote: string;
  /** EFT batch defaults — bank file format + delivery cadence. */
  eftBatchFormat: 'ACB' | 'ABSA' | 'FNB' | 'Standard Bank' | 'Generic CSV';
  eftBatchSendCcEmails: string;
  /** Phase 110.9 — Payroll Calculations (Sundays/PH multiplier, ETI,
   *  garnishees, CTC, pro-rata, etc). */
  calculations?: PayrollCalculationsConfig;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 110.9 — Payroll Calculations.
 *
 * SimplePay-equivalent computation rules. These are the "how" of payroll,
 * sitting alongside the "what" (rates + leave entitlements above).
 * ────────────────────────────────────────────────────────────────────────*/

export interface PayrollCalculationsConfig {
  /** Basic Pay calculation. */
  sundayRateMultiplier: number;
  publicHolidayRateMultiplier: number;
  /** Termination preferences (BCEA notice period). */
  terminationNoticeDaysUnder6Months: number;
  terminationNoticeDays6MonthsTo1Year: number;
  terminationNoticeDaysOver1Year: number;
  payTerminationLeaveInLieu: boolean;
  /** BCEA Leave Pay — which days do you average over? */
  leavePayBasis: 'last13Weeks' | 'last4Weeks' | 'monthlyAverage';
  /** ETI (Employment Tax Incentive) — youth wage subsidy for 18-29. */
  etiEnabled: boolean;
  etiMinimumWageMonthly: number;
  /** Garnishees — cap on % of net salary that can be garnished. */
  garnisheeMaxPercentOfNet: number;
  garnisheeAdminFeePercent: number;
  /** SDL exemption auto-check (annual payroll bill threshold). */
  sdlAutoExemptionCheck: boolean;
  /** Cost-to-Company convention. */
  ctcIncludesUif: boolean;
  ctcIncludesSdl: boolean;
  ctcIncludesPension: boolean;
  ctcIncludesMedicalAid: boolean;
  /** Pro-rata method when an employee joins / leaves mid-month. */
  proRataMethod: 'calendarDays' | 'workingDays' | 'fixed22Days';
}

export const DEFAULT_PAYROLL_CALCULATIONS: PayrollCalculationsConfig = {
  sundayRateMultiplier: 1.5,
  publicHolidayRateMultiplier: 2.0,
  terminationNoticeDaysUnder6Months: 7,
  terminationNoticeDays6MonthsTo1Year: 14,
  terminationNoticeDaysOver1Year: 28,
  payTerminationLeaveInLieu: true,
  leavePayBasis: 'last13Weeks',
  etiEnabled: true,
  etiMinimumWageMonthly: 2000,
  garnisheeMaxPercentOfNet: 25,
  garnisheeAdminFeePercent: 0,
  sdlAutoExemptionCheck: true,
  ctcIncludesUif: true,
  ctcIncludesSdl: true,
  ctcIncludesPension: true,
  ctcIncludesMedicalAid: true,
  proRataMethod: 'calendarDays',
};

export const DEFAULT_PAYROLL_CONFIG: AppSettingsPayrollConfig = {
  payFrequency: 'monthly',
  payDayOfMonth: 25,
  uifEmployeePercent: 1,
  uifEmployerPercent: 1,
  uifEarningsCeilingMonthly: 17712,
  sdlPercent: 1,
  sdlExemptionAnnualPayrollUnder: 500000,
  payePrimaryRebateAnnual: 17235,
  payeSecondaryRebateAnnual: 9444,
  payeTertiaryRebateAnnual: 3145,
  annualLeaveDaysPerYear: 15,
  sickLeaveDaysPerCycle: 30,
  sickLeaveCycleMonths: 36,
  familyResponsibilityDaysPerYear: 3,
  publicHolidays: [
    // 2026 SA public holidays.
    '2026-01-01', '2026-03-21', '2026-04-03', '2026-04-06', '2026-04-27',
    '2026-05-01', '2026-06-16', '2026-08-09', '2026-09-24', '2026-12-16',
    '2026-12-25', '2026-12-26',
  ],
  employeeNumberPrefix: 'EMP-',
  employeeNumberNextSeq: 1,
  employeeNumberPadding: 4,
  payslipShowYtd: true,
  payslipShowLeaveBalance: true,
  payslipShowLoanBalance: true,
  payslipFooterNote: 'Queries: payroll@jomopak.co.za',
  eftBatchFormat: 'Generic CSV',
  eftBatchSendCcEmails: '',
  calculations: DEFAULT_PAYROLL_CALCULATIONS,
};

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 110.2 — Accounting defaults.
 *
 * Captures bookkeeping policy — VAT rates the business uses, default
 * payment terms applied to new invoices, which GL account retained earnings
 * sits in, and whether multi-currency is on. Most of these surface on the
 * AccountingTab so the books behave consistently.
 * ────────────────────────────────────────────────────────────────────────*/

export interface VatRateConfig {
  id: string;
  /** Display code — e.g. "STD", "ZER", "EXM". */
  code: string;
  label: string;
  /** Percentage. */
  ratePercent: number;
  /** Whether the rate is the default for new invoice lines. */
  isDefault: boolean;
  /** Whether to surface this as selectable in the line-item dropdown. */
  active: boolean;
}

export interface AppSettingsAccountingConfig {
  /** Last day of the financial year — for IS/BS captioning + projection roll. */
  fiscalYearEndMonth: number;
  fiscalYearEndDay: number;
  /** VAT codes the business uses. Edited inline on the Accounting tab. */
  vatRates: VatRateConfig[];
  /** Default payment terms applied to new invoices ("Net 30", "Net 7", "COD", etc.). */
  defaultPaymentTermDays: number;
  defaultPaymentTermLabel: string;
  /** GL account where the year-end net income is closed. Code-only — the
   *  Chart of Accounts is the source of truth for the account itself. */
  retainedEarningsAccountCode: string;
  /** Default expense / revenue accounts for quick capture flows. */
  defaultSalesAccountCode: string;
  defaultPurchaseAccountCode: string;
  defaultBankAccountCode: string;
  /** Auto-create journals when invoices / bills are posted? */
  autoPostInvoicesToGl: boolean;
  autoPostBillsToGl: boolean;
  /** Multi-currency toggle. When off, all docs default to baseCurrency. */
  enableMultiCurrency: boolean;
  /** Round line totals to nearest cent. */
  roundingMode: 'nearest' | 'up' | 'down';
}

export const DEFAULT_ACCOUNTING_CONFIG: AppSettingsAccountingConfig = {
  fiscalYearEndMonth: 2,
  fiscalYearEndDay: 28,
  vatRates: [
    { id: 'vat-std', code: 'STD', label: 'Standard rate', ratePercent: 15, isDefault: true, active: true },
    { id: 'vat-zer', code: 'ZER', label: 'Zero-rated', ratePercent: 0, isDefault: false, active: true },
    { id: 'vat-exm', code: 'EXM', label: 'Exempt', ratePercent: 0, isDefault: false, active: true },
  ],
  defaultPaymentTermDays: 30,
  defaultPaymentTermLabel: 'Net 30 days',
  retainedEarningsAccountCode: '3500',
  defaultSalesAccountCode: '4000',
  defaultPurchaseAccountCode: '5000',
  defaultBankAccountCode: '1100',
  autoPostInvoicesToGl: true,
  autoPostBillsToGl: true,
  enableMultiCurrency: false,
  roundingMode: 'nearest',
};

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 110.3 — Document numbering.
 *
 * Each doc kind gets a prefix + next sequence + padding. The number generator
 * (utils/numbering.ts) reads this map and increments the seq when a doc is
 * saved. Today's number generators are scattered across pages — this gives
 * one place to change them.
 * ────────────────────────────────────────────────────────────────────────*/

export type DocumentNumberKind =
  | 'invoice'
  | 'quote'
  | 'deliveryNote'
  | 'purchaseOrder'
  | 'jobCard'
  | 'supplierBill'
  | 'creditNote'
  | 'payslip';

export interface DocumentNumberRule {
  prefix: string;
  nextSeq: number;
  padding: number;
  /** Include a yyyy-mm date prefix in the number? */
  includeDate: boolean;
  /** Reset sequence each year? */
  resetAnnually: boolean;
}

export type AppSettingsNumberingConfig = Record<DocumentNumberKind, DocumentNumberRule>;

export const DEFAULT_NUMBERING_CONFIG: AppSettingsNumberingConfig = {
  invoice: { prefix: 'INV-', nextSeq: 1, padding: 5, includeDate: false, resetAnnually: false },
  quote: { prefix: 'QUO-', nextSeq: 1, padding: 5, includeDate: false, resetAnnually: false },
  deliveryNote: { prefix: 'DN-', nextSeq: 1, padding: 5, includeDate: false, resetAnnually: false },
  purchaseOrder: { prefix: 'PO-', nextSeq: 1, padding: 5, includeDate: false, resetAnnually: false },
  jobCard: { prefix: 'JC-', nextSeq: 1, padding: 5, includeDate: false, resetAnnually: false },
  supplierBill: { prefix: 'BILL-', nextSeq: 1, padding: 5, includeDate: false, resetAnnually: false },
  creditNote: { prefix: 'CN-', nextSeq: 1, padding: 5, includeDate: false, resetAnnually: false },
  payslip: { prefix: 'PS-', nextSeq: 1, padding: 6, includeDate: true, resetAnnually: true },
};

export const DOCUMENT_NUMBER_LABELS: Record<DocumentNumberKind, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  deliveryNote: 'Delivery Note',
  purchaseOrder: 'Purchase Order',
  jobCard: 'Job Card',
  supplierBill: 'Supplier Bill',
  creditNote: 'Credit Note',
  payslip: 'Payslip',
};

/** Render the next document number for a rule (without incrementing). */
export function previewDocumentNumber(rule: DocumentNumberRule, todayIso?: string): string {
  const seq = String(rule.nextSeq).padStart(rule.padding, '0');
  if (!rule.includeDate) return `${rule.prefix}${seq}`;
  const today = todayIso ?? new Date().toISOString().slice(0, 10);
  const yyyymm = today.slice(0, 7).replace('-', '');
  return `${rule.prefix}${yyyymm}-${seq}`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 110.4 — Company bank accounts.
 *
 * Used by:
 *   - Payroll EFT exports (which account salaries are paid from)
 *   - Invoice footers (which account customers should pay into)
 *   - Bank reconciliation (matching imported transactions back to an account)
 *
 * One account is marked primary; the invoice footer shows it by default.
 * ────────────────────────────────────────────────────────────────────────*/

export type BankAccountType = 'cheque' | 'savings' | 'transmission' | 'credit_card';

export interface AppSettingsBankAccount {
  id: string;
  accountName: string;
  bankName: string;
  branchCode: string;
  accountNumber: string;
  accountType: BankAccountType;
  /** Primary account = the one shown on invoice footers by default. */
  isPrimary: boolean;
  /** Toggle to surface the account number on printed invoices. */
  showOnInvoice: boolean;
  /** GL account code this bank account maps to in the chart of accounts. */
  glAccountCode?: string;
  /** Optional SWIFT code for foreign payments. */
  swiftCode?: string;
  notes?: string;
}

export const DEFAULT_BANK_ACCOUNTS: AppSettingsBankAccount[] = [];

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  cheque: 'Cheque',
  savings: 'Savings',
  transmission: 'Transmission',
  credit_card: 'Credit Card',
};

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 113 — Page intents (deep-link from Admin Hub).
 *
 * One-shot "do the thing on landing" signals so quick actions like "Post a
 * notice" don't just dump the user on a list page where they still have to
 * click "+ New" — they land directly in the new-record form.
 *
 * The receiving page consumes the intent in a useEffect and calls
 * onIntentConsumed so it doesn't re-fire on re-renders. The `nonce` field
 * guarantees a fresh intent (e.g. clicking the same button twice) still
 * triggers the effect.
 *
 * Intents are page-local strings — 'new' is the common one, but each page
 * is free to define its own (e.g. PayrollPage might accept 'newRun', the
 * SHE register 'minutesFromLast').
 * ────────────────────────────────────────────────────────────────────────*/

export interface PageIntent {
  view: View;
  intent: string;
  /** Cheap unique-per-click value so the receiving useEffect re-fires when
   *  the admin clicks the same button twice in a row. */
  nonce: number;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 110.6 — Employer Details + SARS Filing.
 *
 * Captures every reference number the business holds with SARS / DoL / FSCA
 * so that EMP201, EMP501, UI-19, OID return, and ROE forms can be auto-
 * filled. Separate from the marketing-facing AppSettingsCompany (which
 * drives letterheads).
 *
 * Filing contact = the person SARS calls when EMP201 is late.
 * ────────────────────────────────────────────────────────────────────────*/

export interface AppSettingsEmployerDetails {
  /** Income tax reference (10-digit). */
  incomeTaxReference: string;
  /** PAYE reference (10-digit, starts with 7). */
  payeReference: string;
  /** UIF reference (8-digit). */
  uifReference: string;
  /** SDL reference (10-digit, starts with L). */
  sdlReference: string;
  /** UIF Department of Labour reference (used on UI-19). */
  uifDolReference: string;
  /** COIDA / Workmen's Comp registration number. */
  coidaReference: string;
  /** WCC industry classification code. */
  wcCommissionerCode: string;
  /** Companies & Intellectual Property Commission (CIPC) registration number. */
  cipcRegistrationNumber: string;
  /** Trading name (if different from legal name). Goes on EMP201. */
  emp201TradingName: string;
  /** SETA the business is registered with (for WSP/ATR). */
  setaCode: string;
  /** Date the business registered as an employer (used on EMP501). */
  employerRegistrationDate: string;
  /** Whether the business is a "small business corporation" for tax purposes. */
  isSmallBusinessCorporation: boolean;
  /** SARS eFiling filing contact. */
  filingContactName: string;
  filingContactEmail: string;
  filingContactPhone: string;
  /** Optional secondary contact for vacation cover. */
  backupContactName: string;
  backupContactEmail: string;
}

export const DEFAULT_EMPLOYER_DETAILS: AppSettingsEmployerDetails = {
  incomeTaxReference: '',
  payeReference: '',
  uifReference: '',
  sdlReference: '',
  uifDolReference: '',
  coidaReference: '',
  wcCommissionerCode: '',
  cipcRegistrationNumber: '',
  emp201TradingName: '',
  setaCode: 'FP&M SETA',
  employerRegistrationDate: '',
  isSmallBusinessCorporation: false,
  filingContactName: '',
  filingContactEmail: '',
  filingContactPhone: '',
  backupContactName: '',
  backupContactEmail: '',
};

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 110.7 — Beneficiaries.
 *
 * Third parties who receive money on behalf of employees:
 *   - Pension / provident / retirement annuity funds (FSCA-registered)
 *   - Medical aid schemes (CMS-registered)
 *   - Unions (Labour Relations Act regulated)
 *   - Garnishees (emolument attachment orders)
 *   - Other (loans, savings clubs)
 *
 * Each carries the registration number + bank details. PayrollPage uses
 * these when generating EFT batches — the deduction shows the beneficiary's
 * bank account, not the employee's.
 * ────────────────────────────────────────────────────────────────────────*/

export type BeneficiaryKind =
  | 'pension'
  | 'provident'
  | 'retirementAnnuity'
  | 'medicalAid'
  | 'union'
  | 'garnishee'
  | 'other';

export const BENEFICIARY_KIND_LABELS: Record<BeneficiaryKind, string> = {
  pension: 'Pension Fund',
  provident: 'Provident Fund',
  retirementAnnuity: 'Retirement Annuity',
  medicalAid: 'Medical Aid',
  union: 'Union',
  garnishee: 'Garnishee',
  other: 'Other',
};

export interface AppSettingsBeneficiary {
  id: string;
  kind: BeneficiaryKind;
  name: string;
  /** FSCA / CMS / Court registration number depending on kind. */
  registrationNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  bankName: string;
  branchCode: string;
  accountNumber: string;
  accountType: BankAccountType;
  /** Tax certificate code for IRP5 (e.g. 4001 for pension, 4474 for medical aid employer contribution). */
  irp5Code: string;
  /** Optional reference / member number prefix shown on EFT line. */
  paymentReferencePrefix: string;
  active: boolean;
  notes: string;
}

export const DEFAULT_BENEFICIARIES: AppSettingsBeneficiary[] = [];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'default',
  company: {
    name: 'JomoPak',
    legalName: 'SAVA ONLINE T/A JomoPak Pty Ltd',
    addressLine1: '52A 4th Street Brentwood Park',
    addressLine2: 'Benoni, Gauteng 1501',
    phone: '+27663049951',
    email: 'aman@jomopak.co.za',
    vatNumber: '4930295326',
    logoUrl: '',
  },
  templates: {
    invoiceFooterLines: [
      '50% deposit to be made to secure your stock and balance of payment upon receipt of full order.',
      'Please send POP when payment is made.',
      'Limited Stock available.',
    ],
    deliveryNoteFooterLines: [
      'Please inspect goods on receipt and report any damage within 24 hours.',
      'Stock-holding releases are tracked against the parent invoice number above.',
    ],
    productionSpecFooterLines: [
      'Specs are confidential and intended only for internal production handover.',
    ],
    defaultPaymentTerms: '50% deposit, balance on collection.',
    defaultInvoiceNotes: '',
    defaultDeliveryNoteNotes: '',
    defaultCustomerNote: 'Thank you for your business. Please reference the document number on all correspondence and payments.',
    termsAndConditions:
      'Quotes valid 30 days. 50% deposit to commence production, balance before dispatch. '
      + 'Printed colours may vary slightly from proofs. E&OE.',
    termsReferenceLine: 'Full terms & conditions are available on request or at jomopak.co.za.',
  },
  stockHolding: {
    defaultMaxDays: 90,
    defaultReviewCadenceDays: 30,
    defaultAgreementTermsText:
      'Stock will be held free of charge for the agreed storage period from the invoice date. Releases are subject to written instruction from an authorised contact at the client.',
  },
  sarsConfig: {
    vatRegistered: true,
    vatCategory: 'A',
    vatFrequency: 'bimonthly',
    payrollActive: true,
    financialYearEndMonth: 2,
  },
  currencyConfig: {
    baseCurrency: 'ZAR',
    rates: [
      { code: 'USD', rateToBase: 18.5, asOf: '' },
      { code: 'EUR', rateToBase: 20.0, asOf: '' },
      { code: 'GBP', rateToBase: 23.5, asOf: '' },
    ],
  },
  connectorConfig: {
    enabled: true,
    disabledTileKeys: [],
    contractVersion: 1,
    lastPublishedAt: '',
  },
  standardMarginPercent: 35,
  updatedAt: '',
  updatedBy: '',
};

export interface AppSettingsFormState {
  company: AppSettingsCompany;
  templates: {
    invoiceFooterLines: string;
    deliveryNoteFooterLines: string;
    productionSpecFooterLines: string;
    defaultPaymentTerms: string;
    defaultInvoiceNotes: string;
    defaultDeliveryNoteNotes: string;
    defaultCustomerNote: string;
    termsAndConditions: string;
    termsReferenceLine: string;
  };
  stockHolding: {
    defaultMaxDays: string;
    defaultReviewCadenceDays: string;
    defaultAgreementTermsText: string;
  };
  /** Phase 92 — company-wide standard margin %, edited as a string so the
   *  input stays controlled. Persisted back to AppSettings.standardMarginPercent. */
  standardMarginPercent: string;
  /** Phase 121 — Help-video URLs keyed by page. Editable in Settings →
   *  Help videos; rendered as "Watch how to use this page" at the bottom
   *  of the matching page. */
  helpVideos: Record<string, string>;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 22 — Document Vault.
 *
 * Stores compliance + commercial documents against a supplier or client.
 * The file lives in Supabase Storage; the row holds metadata + an optional
 * expiry date so the notification bell can warn before a cert lapses.
 * ────────────────────────────────────────────────────────────────────────*/
/** Phase 96 — Doc Vault expansion.
 *  Added 'employee' (HR docs attach to a specific employee) and 'sars'
 *  (SARS correspondence attaches to the SARS Centre). */
export type DocumentOwnerType = 'supplier' | 'client' | 'internal' | 'employee' | 'sars';

export type DocumentCategory =
  // Compliance / on-file docs (client + supplier)
  | 'Certification'
  | 'FSC Certificate'
  | 'ISO Certificate'
  | 'Food Safety / HACCP'
  | 'MSDS'
  | 'Credit Application'
  | 'Stock-Level Agreement'
  | 'ID Document'
  | 'Bank Details'
  | 'Signed Terms / Contract'
  | 'Price List'
  | 'Tax / VAT Certificate'
  // Operational (mostly client-linked)
  | 'Delivery Note'
  | 'Credit Note'
  | 'Signed POD'
  | 'Proof of Payment'
  | 'Invoice Copy'
  | 'Quote Copy'
  | 'Job Card'
  // Internal company docs
  | 'HR Document'
  | 'Staff Handbook'
  | 'Factory Policy'
  | 'Health & Safety'
  | 'Insurance'
  | 'Lease / Property'
  | 'License / Permit'
  | 'Tax / Compliance'
  | 'Accounting Record'
  | 'Other Internal'
  // Phase 96 — HR (attach to ownerType = 'employee')
  | 'Employment Contract'
  | 'Contract Extension'
  | 'Warning Letter'
  | 'Performance Review'
  | 'Disciplinary Record'
  | 'Resignation Letter'
  | 'Reference Letter'
  | 'Training Certificate'
  | 'Medical Record'
  | 'Payslip Acknowledgement'
  | 'IRP5 / IT3a'
  | 'Employee ID Copy'
  // Phase 96 — Correspondence
  | 'SARS Correspondence'
  | 'Client Correspondence'
  | 'Supplier Correspondence'
  | 'Legal Correspondence'
  | 'General Correspondence'
  | 'Other';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Certification', 'FSC Certificate', 'ISO Certificate', 'Food Safety / HACCP',
  'MSDS', 'Credit Application', 'Stock-Level Agreement', 'ID Document',
  'Bank Details', 'Signed Terms / Contract', 'Price List', 'Tax / VAT Certificate',
  'Delivery Note', 'Credit Note', 'Signed POD', 'Proof of Payment',
  'Invoice Copy', 'Quote Copy', 'Job Card',
  'HR Document', 'Staff Handbook', 'Factory Policy', 'Health & Safety',
  'Insurance', 'Lease / Property', 'License / Permit', 'Tax / Compliance',
  'Accounting Record', 'Other Internal',
  // Phase 96 — HR per-employee documents.
  'Employment Contract', 'Contract Extension', 'Warning Letter',
  'Performance Review', 'Disciplinary Record', 'Resignation Letter',
  'Reference Letter', 'Training Certificate', 'Medical Record',
  'Payslip Acknowledgement', 'IRP5 / IT3a', 'Employee ID Copy',
  // Phase 96 — Correspondence buckets.
  'SARS Correspondence', 'Client Correspondence', 'Supplier Correspondence',
  'Legal Correspondence', 'General Correspondence',
  'Other',
];

/**
 * Phase 96 — Default retention period in days per category.
 *
 * Drives the "past retention" flag on Doc Vault and the auto-archive view.
 * Documents past their retention are kept (file + metadata) but greyed
 * out / hidden from default views so the active list stays focused on
 * current paperwork. Tuned to SA legal minimums where applicable.
 *
 *   - SARS Correspondence       = 5 years (SARS rule)
 *   - Tax / Compliance / VAT    = 5 years (SARS rule)
 *   - Employment Contract       = 5 years past termination
 *   - Warning Letter            = 12 months (CCMA presumption)
 *   - Disciplinary Record       = 3 years
 *   - IRP5 / IT3a               = 5 years (employer side)
 *   - Health & Safety / Cleaning = 3 years
 *   - General Correspondence    = 3 years
 *   - Insurance                 = 5 years past expiry
 *   - Lease                     = 5 years past expiry
 *   - Everything else           = no auto-flag (keep forever)
 */
export const DOCUMENT_CATEGORY_RETENTION_DAYS: Partial<Record<DocumentCategory, number>> = {
  'SARS Correspondence': 5 * 365,
  'Tax / Compliance': 5 * 365,
  'Tax / VAT Certificate': 5 * 365,
  'IRP5 / IT3a': 5 * 365,
  'Employment Contract': 5 * 365,
  'Contract Extension': 5 * 365,
  'Warning Letter': 365,
  'Disciplinary Record': 3 * 365,
  'Performance Review': 3 * 365,
  'Payslip Acknowledgement': 5 * 365,
  'Insurance': 5 * 365,
  'Lease / Property': 5 * 365,
  'Health & Safety': 3 * 365,
  'Client Correspondence': 3 * 365,
  'Supplier Correspondence': 3 * 365,
  'Legal Correspondence': 5 * 365,
  'General Correspondence': 3 * 365,
  'Medical Record': 30 * 365,
};

/**
 * Sensible default roles that can VIEW each internal document category.
 * 'admin' always implicitly sees everything; the page filters by these for
 * non-admin roles. Empty = everyone sees it (used for factory-wide policies).
 * Uploader can override per document.
 */
export const DOCUMENT_CATEGORY_ROLE_DEFAULTS: Partial<Record<DocumentCategory, UserRole[]>> = {
  'HR Document': ['admin'],
  'Staff Handbook': [],                                            // everyone
  'Factory Policy': [],                                            // everyone
  'Health & Safety': [],                                           // everyone
  'Insurance': ['admin'],
  'Lease / Property': ['admin'],
  'License / Permit': ['admin', 'accounts'],
  'Tax / Compliance': ['admin', 'accounts'],
  'Accounting Record': ['admin', 'accounts'],
  'Other Internal': ['admin'],
  // Phase 96 — HR docs: admin only by default. Employee themselves can
  // still see their own docs via My Stuff (separate gate).
  'Employment Contract': ['admin'],
  'Contract Extension': ['admin'],
  'Warning Letter': ['admin'],
  'Performance Review': ['admin'],
  'Disciplinary Record': ['admin'],
  'Resignation Letter': ['admin'],
  'Reference Letter': ['admin'],
  'Training Certificate': ['admin'],
  'Medical Record': ['admin'],
  'Payslip Acknowledgement': ['admin', 'accounts'],
  'IRP5 / IT3a': ['admin', 'accounts'],
  'Employee ID Copy': ['admin'],
  // Phase 96 — Correspondence buckets.
  'SARS Correspondence': ['admin', 'accounts'],
  'Client Correspondence': ['admin', 'sales', 'accounts'],
  'Supplier Correspondence': ['admin', 'accounts', 'ops'],
  'Legal Correspondence': ['admin'],
  'General Correspondence': ['admin'],
};

export interface DocumentRecord {
  id: string;
  createdAt: string;
  ownerType: DocumentOwnerType;
  /** Empty when ownerType = 'internal'. */
  ownerId: string;
  ownerName: string;
  category: DocumentCategory;
  title: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
  fileUrl: string;       // signed URL (refreshable)
  storagePath: string;
  issueDate: string;
  /** Optional — drives the "document expiring" notification. */
  expiryDate: string;
  uploadedByName: string;
  notes: string;
  /** Phase 36 — for client-owned operational docs, optionally tie to the
   *  specific invoice / job / quote / delivery note so it shows on that record. */
  linkedInvoiceId?: string;
  linkedJobId?: string;
  linkedQuoteId?: string;
  linkedDeliveryNoteId?: string;
  /** Phase 36 — role-based visibility for internal documents.
   *  - Empty array = visible to everyone (e.g. factory policies).
   *  - Non-empty = visible only to listed roles (+ admin always).
   *  Ignored for client/supplier-owned docs (those are gated by the owner). */
  visibleToRoles?: UserRole[];
  /** Phase 96 — retention period in days. When set, the doc is flagged
   *  past-retention and hidden from default views once (today - issueDate)
   *  exceeds it. The file + metadata stay; the auditor can still find it
   *  via the "Past retention" toggle. Falls back to the category default
   *  (DOCUMENT_CATEGORY_RETENTION_DAYS) when unset. */
  retentionDays?: number;
  /** Phase 96 — admin marker once an admin has eyeballed the doc as
   *  no-longer-needed. Lets you bulk-delete later with a clear conscience. */
  markedForArchive?: boolean;
  /** Phase 96 — true when ownerType = 'employee'. Empty otherwise. */
  employeeId?: string;
}

/** Phase 96 — is this doc past its retention window?
 *  Per-doc retentionDays wins; else the category default; else never. */
export function isDocumentPastRetention(doc: DocumentRecord, today: Date = new Date()): boolean {
  const days = doc.retentionDays ?? DOCUMENT_CATEGORY_RETENTION_DAYS[doc.category];
  if (!days || !doc.issueDate) return false;
  const ageMs = today.getTime() - new Date(doc.issueDate).getTime();
  return ageMs > days * 86400000;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 23 — Imports / Shipments tracker.
 *
 * Tracks inbound shipments from overseas (and local) suppliers: what's on
 * order, on the water, clearing customs, and landed. Captures landed cost
 * (goods + freight + duty + clearing) so you know the true cost of stock,
 * and a "receive into stock" action turns shipment lines into material
 * receipts.
 * ────────────────────────────────────────────────────────────────────────*/
export type ShipmentStatus =
  | 'Ordered'
  | 'In Production'
  | 'In Transit'
  | 'Arrived at Port'
  | 'Customs Clearance'
  | 'Received'
  | 'Cancelled';

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'Ordered', 'In Production', 'In Transit', 'Arrived at Port',
  'Customs Clearance', 'Received', 'Cancelled',
];

export interface ShipmentLineItem {
  id: string;
  description: string;
  materialKind: MaterialKind;
  quantity: number;
  unit: string;
  /** Unit cost in the shipment's currency. */
  unitCost: number;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  createdAt: string;
  supplierId: string;
  supplierName: string;
  /** Supplier PO / proforma reference. */
  reference: string;
  status: ShipmentStatus;
  /** Incoterm — FOB, CIF, EXW, DDP, etc. */
  incoterm: string;
  currency: string;
  orderDate: string;
  expectedArrivalDate: string;
  actualArrivalDate: string;
  containerNumber: string;
  billOfLadingNumber: string;
  vessel: string;
  lineItems: ShipmentLineItem[];
  /** Sum of line item (qty × unit cost), in shipment currency. */
  goodsValue: number;
  freightCost: number;
  dutyCost: number;
  clearingCost: number;
  otherCost: number;
  /** goods + freight + duty + clearing + other. */
  landedCostTotal: number;
  notes: string;
  /** True once the shipment's lines have been booked into material receipts. */
  receivedIntoStock: boolean;
  /** Phase 78 — uploaded shipping documents (bill of lading, packing list,
   *  customs paperwork, commercial invoice). Captured via the global
   *  drag-drop dropzone or directly on the Shipment form. */
  documentUrls?: string[];
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 24 — Accounting core (Chart of Accounts + Accounts Payable).
 * ────────────────────────────────────────────────────────────────────────*/
export type LedgerAccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export const LEDGER_ACCOUNT_TYPES: LedgerAccountType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

export interface LedgerAccount {
  id: string;
  /** Numeric account code, e.g. "1000". */
  code: string;
  name: string;
  type: LedgerAccountType;
  /** Free-text grouping, e.g. "Current Asset", "Cost of Sales", "Overheads". */
  subType: string;
  /** Whether transactions on this account usually carry VAT. */
  vatApplicable: boolean;
  active: boolean;
  notes: string;
}

export type SupplierBillStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Disputed' | 'Cancelled';

export interface SupplierBillPayment {
  id: string;
  paymentDate: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
  /** FX settlement rate to base at payment date (foreign docs). */
  exchangeRate?: number;
  /** Whether realised FX for this payment has been posted to the GL. */
  fxPosted?: boolean;
}

export interface SupplierBill {
  id: string;
  /** Internal bill reference. */
  billNumber: string;
  /** The supplier's own invoice number. */
  supplierInvoiceNumber: string;
  createdAt: string;
  billDate: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  /** Chart-of-accounts expense account this bill posts to. */
  expenseAccountId: string;
  expenseAccountName: string;
  currency: string;
  /** Booking exchange rate to base (ZAR) at bill date. 1 for ZAR. */
  exchangeRate?: number;
  subtotalExclVat: number;
  vatAmount: number;
  totalInclVat: number;
  payments: SupplierBillPayment[];
  amountPaid: number;
  amountOutstanding: number;
  status: SupplierBillStatus;
  /** Optional links back to where the bill came from. */
  sourceShipmentId: string;
  sourceInboxId: string;
  notes: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 25 — SARS Centre (tax organizer / prep, NOT a tax engine).
 *
 * Tracks SARS obligations, their deadlines, the figures that go on each return
 * (auto-pulled from accounting data where we can, with manual override), and the
 * submission + payment trail. It does not file anything or compute tax owed
 * beyond simple VAT arithmetic — it makes the admin side of SARS easier.
 * ────────────────────────────────────────────────────────────────────────*/
export type SarsObligationType = 'VAT201' | 'EMP201' | 'EMP501' | 'IRP6' | 'ITR14';

export const SARS_OBLIGATION_LABELS: Record<SarsObligationType, string> = {
  VAT201: 'VAT201 — Value-Added Tax',
  EMP201: 'EMP201 — PAYE / UIF / SDL',
  EMP501: 'EMP501 — Employer Reconciliation',
  IRP6: 'IRP6 — Provisional Tax',
  ITR14: 'ITR14 — Company Income Tax',
};

export const SARS_OBLIGATION_SHORT: Record<SarsObligationType, string> = {
  VAT201: 'VAT',
  EMP201: 'PAYE',
  EMP501: 'Recon',
  IRP6: 'Provisional',
  ITR14: 'Income Tax',
};

export type SarsFilingStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Paid';

export const SARS_FILING_STATUSES: SarsFilingStatus[] = ['Not Started', 'In Progress', 'Submitted', 'Paid'];

/** A single editable line on a return worksheet (e.g. "Standard-rated sales"). */
export interface SarsFilingFigure {
  id: string;
  label: string;
  amount: number;
  /** 'auto' lines are computed from accounting data; 'manual' are user-entered. */
  source: 'auto' | 'manual';
  note: string;
}

export interface SarsFiling {
  id: string;
  obligationType: SarsObligationType;
  /** Stable key matching a generated calendar slot, e.g. "VAT201-2026-04". */
  periodKey: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: SarsFilingStatus;
  /** VAT-specific headline figures (zero for non-VAT returns). */
  outputVat: number;
  inputVat: number;
  manualAdjustment: number;
  netVatPayable: number;
  /** Generic headline payable for non-VAT returns (PAYE total, provisional payment…). */
  amountPayable: number;
  figures: SarsFilingFigure[];
  /** Submission + payment trail. */
  submittedDate: string;
  submittedBy: string;
  paymentDate: string;
  paymentReference: string;
  /** Optional link to a proof-of-submission / receipt in the Document Vault. */
  proofDocumentId: string;
  notes: string;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 26 — Payroll.
 *
 * Deliberately a manual-entry payroll: the operator (or accountant) enters each
 * employee's PAYE and other deductions, and the system records, totals, and
 * produces payslips + a bank payment file + EMP201 totals. We pre-fill UIF (1%,
 * capped) and SDL (1%) as editable conveniences, but DO NOT compute PAYE from
 * SARS tax tables — that stays in human hands so the books can't go stale.
 * ────────────────────────────────────────────────────────────────────────*/
export type PayCycle = 'Monthly' | 'Weekly';

export interface Employee {
  id: string;
  /** Phase 59 — profile photo(s). First one shows on payslip / My Stuff. */
  photoUrls?: string[];
  employeeNumber: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  taxNumber: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  payCycle: PayCycle;
  /** Gross pay per period (the basic salary/wage). */
  basicSalary: number;
  bankName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  accountType: string;
  uifContributor: boolean;
  startDate: string;
  endDate: string;
  active: boolean;
  notes: string;
  /** Phase 55 — SMETA fields. Hourly rate displayed on payslip; if 0 we
   *  compute from basicSalary / standardMonthlyHours. */
  hourlyRate?: number;
  /** Standard monthly hours, BCEA default 173.33 (40hr week × 52/12). */
  standardMonthlyHours?: number;
  /* ─── Phase 106.3 — Host availability for visitor approval workflow ───
   * availabilityStatus lets the employee tell the system whether they
   * can pick up a visitor approval request right now. When it's anything
   * other than 'Available', incoming approval requests skip them and
   * route directly to backupApproverEmployeeId (without waiting for the
   * escalation timer). When status='Delegate', requests go to
   * delegateApprovalToEmployeeId instead — explicit delegation rather
   * than backup-on-failure. */
  availabilityStatus?: EmployeeAvailabilityStatus;
  /** Employee id of the person who picks up approvals when this person is
   *  not Available (or when the escalation timer fires). Required for
   *  anyone who can host visitors; the system surfaces a warning when an
   *  employee hosts visits but has no backup set. */
  backupApproverEmployeeId?: string;
  /** When availabilityStatus='Delegate', requests go here instead of the
   *  backup. Lets someone forward approvals while on leave / on-site
   *  without setting it as a permanent backup. */
  delegateApprovalToEmployeeId?: string;
  /** When true, this employee can approve visitor area requests. Defaults
   *  to true for any employee with a backup set — but admins can flip it
   *  off so cleaners / production-only roles aren't asked. */
  canApproveVisitorAreas?: boolean;
}

/** Phase 106.3 — Possible availability states for visitor approval. */
export type EmployeeAvailabilityStatus =
  | 'Available'
  | 'Busy'
  | 'On the road'
  | 'In a meeting'
  | 'Away'
  | 'Delegate';

export const ALL_EMPLOYEE_AVAILABILITY_STATUSES: EmployeeAvailabilityStatus[] = [
  'Available', 'Busy', 'On the road', 'In a meeting', 'Away', 'Delegate',
];

/** Returns true when an employee is fit to receive an approval request
 *  directly (vs. their backup needing to pick it up). 'Available' = yes,
 *  everything else = no. Undefined defaults to Available (legacy rows). */
export function isEmployeeAvailableForApproval(e: Pick<Employee, 'availabilityStatus' | 'active'>): boolean {
  if (e.active === false) return false;
  const status = e.availabilityStatus ?? 'Available';
  return status === 'Available';
}

export type PayrollRunStatus = 'Draft' | 'Approved' | 'Paid';

export const PAYROLL_RUN_STATUSES: PayrollRunStatus[] = ['Draft', 'Approved', 'Paid'];

export interface PayslipHoursLine {
  /** "Normal", "Overtime 1.5x", "Sunday", "Public Holiday", "Piece Work" etc. */
  type: string;
  /** Hours / units worked. */
  quantity: number;
  /** Rand per hour / unit. */
  rate: number;
}

export interface PayslipLineItem {
  /** Display label, e.g. "Performance bonus", "Travel allowance", "Salary advance". */
  label: string;
  /** Always positive — sign comes from which list it lives in. */
  amount: number;
}

export interface PayslipLeaveSnapshot {
  type: string;
  balance: number;
  /** Adjustments applied this period (manual top-ups / corrections). */
  adjustment: number;
  /** Days taken during this period. */
  taken: number;
  /** Days scheduled (approved but not yet taken). */
  scheduled: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  basicSalary: number;
  allowances: number;
  grossPay: number;
  paye: number;
  uifEmployee: number;
  otherDeductions: number;
  netPay: number;
  /** Employer-side contributions — not deducted from the employee, but part of
   *  the EMP201 the company pays SARS. */
  uifEmployer: number;
  sdl: number;
  notes: string;
  /** Phase 55 — SMETA-compliant fields (all optional for back-compat). */
  /** Itemized hours / rates table. Required by SMETA auditors so they can
   *  cross-reference timekeeping records against the payslip. */
  hoursLines?: PayslipHoursLine[];
  /** Itemized additional income (bonuses, commissions, allowances, 13th).
   *  Shown as separate lines under Basic Salary. */
  additionalIncome?: PayslipLineItem[];
  /** Itemized additional deductions (loan repayments, advances, garnishees,
   *  voluntary deductions). Shown as separate lines under PAYE / UIF. */
  additionalDeductions?: PayslipLineItem[];
  /** Per-leave-type balance snapshot at the end of this pay period. */
  leaveSnapshot?: PayslipLeaveSnapshot[];
  /** Phase 56 — overtime hours captured per run. SA BCEA premiums:
   *  1.5× weekday OT, 2× Sunday + Public Holiday. */
  overtime15Hours?: number;
  overtime2Hours?: number;
  sundayHours?: number;
  publicHolidayHours?: number;
}

export interface PayrollRun {
  id: string;
  runNumber: string;
  createdAt: string;
  payCycle: PayCycle;
  periodMonth: number; // 1–12
  periodYear: number;
  periodLabel: string; // e.g. "May 2026"
  payDate: string;
  status: PayrollRunStatus;
  payslips: Payslip[];
  /** Phase 45 — per-employee adjustments (bonuses, 13th cheque, etc.).
   *  Applied when the run is approved. */
  adjustments?: PayrollAdjustment[];
  totalGross: number;
  totalPaye: number;
  totalUifEmployee: number;
  totalUifEmployer: number;
  totalSdl: number;
  totalOtherDeductions: number;
  totalNet: number;
  notes: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 27 — Bank reconciliation.
 *
 * Import a bank statement (CSV), then match each line to the record it relates
 * to — a customer invoice (money in), a supplier bill or payroll run (money
 * out), or straight to a ledger account (bank charges, etc.) — and tick it
 * reconciled. This records the match; it does not auto-post payments.
 * ────────────────────────────────────────────────────────────────────────*/
export type BankTxnMatchType = 'none' | 'invoice' | 'bill' | 'payroll' | 'account';

export interface BankTransaction {
  id: string;
  /** Groups transactions that came in from the same CSV import. */
  importBatch: string;
  bankAccountName: string;
  date: string;
  description: string;
  reference: string;
  /** Signed: positive = money in, negative = money out. */
  amount: number;
  matchType: BankTxnMatchType;
  matchId: string;
  matchLabel: string;
  /** Ledger account when matchType === 'account'. */
  ledgerAccountId: string;
  reconciled: boolean;
  notes: string;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 28 — General Ledger (double-entry journal entries).
 *
 * The formal books. Each journal entry has two or more lines that must balance
 * (total debits == total credits). Entries can be posted by hand (accruals,
 * depreciation, opening balances, payroll journals) or generated in a batch
 * from the sub-ledgers (invoices, supplier bills, payments). The Trial Balance,
 * Balance Sheet and Income Statement are computed from POSTED entries.
 * ────────────────────────────────────────────────────────────────────────*/
export type JournalEntryStatus = 'Draft' | 'Posted';

export const JOURNAL_ENTRY_STATUSES: JournalEntryStatus[] = ['Draft', 'Posted'];

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string;
  description: string;
  status: JournalEntryStatus;
  /** 'manual' or e.g. 'auto:invoice', 'auto:bill' from the batch generator. */
  source: string;
  lines: JournalLine[];
  createdAt: string;
  notes: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 29 — Fixed-asset register + depreciation.
 *
 * Straight-line depreciation: annual = (cost − residual) / useful life. The
 * register shows accumulated depreciation and book value as at today; a
 * depreciation run posts the period's charge to the GL (Dr Depreciation 6150
 * / Cr Accumulated Depreciation 1590).
 * ────────────────────────────────────────────────────────────────────────*/
export type FixedAssetStatus = 'Active' | 'Disposed';

export interface FixedAsset {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  acquisitionDate: string;
  cost: number;
  residualValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'Straight Line';
  status: FixedAssetStatus;
  /** Date through which depreciation has been posted to the GL. */
  depreciationPostedToDate: string;
  disposalDate: string;
  disposalProceeds: number;
  notes: string;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 30 — Maintenance scheduler / work orders.
 *
 * Preventive + corrective maintenance against machines. A completed preventive
 * work order advances the machine's next-service date by the interval, so PM
 * stays on a rolling schedule and the "service due" alerts keep firing.
 * ────────────────────────────────────────────────────────────────────────*/
export type MaintenanceType = 'Preventive' | 'Corrective' | 'Inspection' | 'Breakdown';
export const MAINTENANCE_TYPES: MaintenanceType[] = ['Preventive', 'Corrective', 'Inspection', 'Breakdown'];

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export const MAINTENANCE_PRIORITIES: MaintenancePriority[] = ['Low', 'Medium', 'High', 'Critical'];

export type MaintenanceStatus = 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
export const MAINTENANCE_WO_STATUSES: MaintenanceStatus[] = ['Open', 'In Progress', 'Completed', 'Cancelled'];

export interface MaintenanceWorkOrder {
  id: string;
  woNumber: string;
  machineId: string;
  machineName: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate: string;
  assignedTo: string;
  description: string;
  partsUsed: string;
  labourHours: number;
  downtimeHours: number;
  cost: number;
  /** When a Preventive WO is completed, advance the machine's next service by
   *  this many days. */
  nextServiceIntervalDays: number;
  createdAt: string;
  notes: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 32 — Aman OS Connector (publisher side).
 *
 * JomoPak publishes a curated, read-only set of metric "tiles" that an external
 * operating system (Aman OS) can read via a token-secured edge function. Never
 * raw rows — only the aggregated tiles below, and only the ones toggled on.
 * ────────────────────────────────────────────────────────────────────────*/
export type ConnectorTileCategory = 'Finance' | 'Sales' | 'Production' | 'Stock' | 'Compliance' | 'Tax';

export interface ConnectorTile {
  /** Stable, namespaced key, e.g. 'jomopak.finance.ar_outstanding'. */
  key: string;
  category: ConnectorTileCategory;
  label: string;
  value: number;
  /** 'ZAR' | '%' | 'count' | 'days' | ''. */
  unit: string;
  /** Optional secondary context, e.g. "3 overdue". */
  detail: string;
}

export interface AppSettingsConnectorConfig {
  /** Master on/off for the whole connector. */
  enabled: boolean;
  /** Tile keys explicitly turned OFF (default = every tile published). */
  disabledTileKeys: string[];
  /** Contract version the publisher currently speaks. */
  contractVersion: number;
  lastPublishedAt: string;
}

export interface AppData {
  suppliers: Supplier[];
  machines: Machine[];
  leads: Lead[];
  quoteEstimates: QuoteEstimate[];
  artworkRecords: ArtworkRecord[];
  customerStockReleases: CustomerStockRelease[];
  deliveryNotes: DeliveryNote[];
  invoices: Invoice[];
  productionSpecs: ProductionSpec[];
  paperRates: PaperRate[];
  /** Phase 127.1 — Consumable rates (glue/tape/ink/etc.). Optional so
   *  legacy saved state still loads cleanly. */
  consumableRates?: ConsumableRate[];
  /** Phase 128.1 — UNIFIED material rates. Single source of truth for
   *  every cost master. paperRates + consumableRates are now deprecated;
   *  this is what the UI + calculator engine read. Optional so legacy
   *  state loads cleanly until the migration runs. */
  materialRates?: MaterialRate[];
  costProfiles: CostProfile[];
  inkRates: InkRate[];
  finishingOperations: FinishingOperation[];
  pressRates: PressRate[];
  plateCosts: PlateCost[];
  workTickets: WorkTicket[];
  pricingTiers: PricingTier[];
  clients: Client[];
  products: Product[];
  productPriceVersions: ProductPriceVersion[];
  clientProductPrices: ClientProductPrice[];
  jobs: JobCard[];
  finishedGoodsStock: FinishedGoodsStock[];
  spareParts: SparePart[];
  stockIssues: StockIssue[];
  stockCounts: StockCount[];
  materialReceipts: MaterialReceipt[];
  /** Phase 93 — Traded Goods (bought-in finished items for resale). Optional
   *  so legacy saved state continues to load cleanly. */
  tradedGoodsItems?: TradedGoodsItem[];
  tradedGoodsReceipts?: TradedGoodsReceipt[];
  chemicalRegisterEntries: ChemicalRegisterEntry[];
  foodSafeMaterials: FoodSafeMaterial[];
  cleaningLogs: CleaningLogEntry[];
  customerComplaints: CustomerComplaint[];
  nonConformances: NonConformance[];
  staffTrainingRecords: StaffTrainingRecord[];
  ppeIssueRecords: PpeIssueRecord[];
  pestControlRecords: PestControlRecord[];
  foreignObjectRecords: ForeignObjectRecord[];
  toolBladeRecords: ToolBladeRecord[];
  // Phase 82 — First Aid Register.
  firstAidEntries?: FirstAidEntry[];
  firstAidAiders?: DesignatedFirstAider[];
  // Phase 95 — SMETA safety registers.
  incidentEntries?: IncidentEntry[];
  drillEntries?: DrillEntry[];
  toolboxTalkEntries?: ToolboxTalkEntry[];
  sheMeetingEntries?: SheMeetingEntry[];
  // Phase 103.2 — Audit programmes register (SMETA, FSC, FSSC, ISO, etc.)
  auditProgrammes?: AuditProgramme[];
  // Phase 106.2 — Visitor area approval requests (host approval workflow
  // for restricted areas). Optional so legacy state loads cleanly.
  visitorAreaApprovalRequests?: VisitorAreaApprovalRequest[];
  // Phase 106.4 — Pre-approved visitor bookings (host invites visitor in
  // advance with allowed areas + time window).
  visitorBookings?: VisitorBooking[];
  visitorLogEntries: VisitorLogEntry[];
  sopDocuments: SopDocument[];
  haccpHazards: HaccpHazard[];
  productionLogs: ProductionLogEntry[];
  wasteEntries: WasteEntry[];
  paperLogs: PaperLog[];
  dispatchRecords: DispatchRecord[];
  /** Phase 61 — Dispatch Runs (route sheets). Optional so legacy saved
   *  state without runs continues to load cleanly. */
  dispatchRuns?: DispatchRun[];
  /** Phase 62 — Tooling (Dies + Stereos). Single table, two flavours
   *  via toolType. Optional so legacy state loads. */
  tooling?: Tooling[];
  proofOfDeliveries: ProofOfDelivery[];
  invoiceInboxItems: InvoiceInboxItem[];
  documents: DocumentRecord[];
  shipments: Shipment[];
  ledgerAccounts: LedgerAccount[];
  supplierBills: SupplierBill[];
  sarsFilings: SarsFiling[];
  employees: Employee[];
  payrollRuns: PayrollRun[];
  bankTransactions: BankTransaction[];
  journalEntries: JournalEntry[];
  fixedAssets: FixedAsset[];
  maintenanceWorkOrders: MaintenanceWorkOrder[];
  stockChangeLogs: StockChangeLog[];
  materialOrderRequests: MaterialOrderRequest[];
  inventoryMovements: InventoryMovement[];
  biEvents: BiEvent[];
  notices: Notice[];
  staffWarnings: StaffWarning[];
  stockRequests: StockRequest[];
  leaveRequests: LeaveRequest[];
  staffLoans: StaffLoan[];
  expenseClaims: ExpenseClaim[];
  companies: Company[];
  appSettings: AppSettings;
  /** Phase 109.2 — Financial projection scenarios (3, 6, 12, 36-month forecasts
   *  of P&L, Balance Sheet, Cash Flow). Optional so legacy state loads. */
  financialProjections?: FinancialProjection[];
  /** Phase 119 — Customer deposit ledger. Sits as a liability ("we owe
   *  these customers stock or money"), separate from invoices.
   *  Optional so legacy state loads cleanly. */
  customerDeposits?: CustomerDeposit[];
  /** Phase 120 — Pro-forma invoices. Every customer sale now starts as
   *  a pro-forma (request for payment, no VAT). A pro-forma spawns one
   *  or more Tax Invoices as payments arrive. Optional so legacy state
   *  without pro-formas continues to load. */
  proformas?: ProForma[];
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 40 — Staff portal: company notices.
 *
 * Admin posts a notice → every relevant staff member sees it on their "My
 * Stuff" page until it expires or is taken down. Optional audienceRoles
 * scopes who sees it (empty = everyone).
 * ────────────────────────────────────────────────────────────────────────*/
export interface Notice {
  id: string;
  title: string;
  body: string;
  /** When the notice was posted. */
  postedAt: string;
  postedByName: string;
  /** Optional auto-expiry — after this date the notice drops off staff feeds. */
  expiresAt?: string;
  /** Empty = everyone; otherwise visible only to the listed roles (admin always sees). */
  audienceRoles?: UserRole[];
  /** Pinned notices sort to the top of My Stuff. */
  pinned?: boolean;
}

export interface NoticeFormState {
  title: string;
  body: string;
  expiresAt: string;
  audienceRoles: UserRole[];
  pinned: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 41 — Staff warnings, commendations & manager notes
 * ----------------------------------------------------------------------
 * One register that captures everything a manager writes about a staff
 * member: formal warnings (progressive discipline), commendations for good
 * work, and free-form notes (e.g. "asked for leave Friday"). Warnings
 * require an on-screen signature acknowledgement; commendations and notes
 * just appear on the staff member's My Stuff page.
 * ──────────────────────────────────────────────────────────────────────── */

export type StaffWarningType =
  | 'Verbal Warning'
  | 'Written Warning 1'
  | 'Written Warning 2'
  | 'Final Written Warning'
  | 'Commendation'
  | 'Note';

export const STAFF_WARNING_TYPES: StaffWarningType[] = [
  'Verbal Warning',
  'Written Warning 1',
  'Written Warning 2',
  'Final Written Warning',
  'Commendation',
  'Note',
];

/** Disciplinary categories — used for filtering + reporting. */
export type StaffWarningCategory =
  | 'Performance'
  | 'Conduct'
  | 'Attendance'
  | 'Safety'
  | 'Hygiene'
  | 'Recognition'
  | 'Other';

export const STAFF_WARNING_CATEGORIES: StaffWarningCategory[] = [
  'Performance',
  'Conduct',
  'Attendance',
  'Safety',
  'Hygiene',
  'Recognition',
  'Other',
];

export interface StaffWarning {
  id: string;
  recordNumber: string;
  createdAt: string;
  /** Linked employee. We store both id and name so the record survives if
   *  the employee row is later renamed or removed. */
  employeeId: string;
  employeeName: string;
  type: StaffWarningType;
  category: StaffWarningCategory;
  /** Date the incident / commendation happened. */
  incidentDate: string;
  /** Date the warning was issued (formal record date). */
  issuedDate: string;
  issuedByName: string;
  /** What happened — the body of the warning / commendation / note. */
  description: string;
  /** Optional remediation action / agreed next steps. */
  correctiveAction: string;
  /** Optional date the warning falls off the record (HR policies often
   *  have warnings expire after 6 or 12 months). */
  expiresAt: string;
  /** Optional file URL (signed letter PDF, photo evidence, etc.). */
  attachmentUrl: string;
  /** Set when the staff member signs to acknowledge they received it. */
  acknowledged: boolean;
  acknowledgedDate: string;
  acknowledgedSignatureDataUrl: string;
  notes: string;
}

export interface StaffWarningFormState {
  employeeId: string;
  employeeName: string;
  type: StaffWarningType;
  category: StaffWarningCategory;
  incidentDate: string;
  issuedDate: string;
  issuedByName: string;
  description: string;
  correctiveAction: string;
  expiresAt: string;
  attachmentUrl: string;
  notes: string;
}

export interface StaffWarningFilters {
  search: string;
  type: string;
  category: string;
  employeeId: string;
  acknowledged: 'all' | 'yes' | 'no';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 42 — Stock requests (purchase request workflow)
 * ----------------------------------------------------------------------
 * Three-stage flow for ad-hoc stock requests from the factory floor:
 *
 *   1. Floor staff opens a request ("I need 2 rolls of packing tape")
 *      → status = 'Pending Manager'
 *   2. Manager approves or declines (requires 'stockRequestsApprove')
 *      → status = 'Approved' or 'Declined'
 *   3. Buyer fulfills approved request (requires 'stockRequestsBuy'):
 *        a. Issue from current spare-parts stock — auto-deducts qty from
 *           the linked SparePart's onHand → status = 'Issued from Stock'
 *        b. Raise a purchase order against a supplier → status = 'PO Created'
 *        c. When goods arrive → status = 'Received'
 *      Or decline → status = 'Declined'
 * ──────────────────────────────────────────────────────────────────────── */

export type StockRequestStatus =
  | 'Pending Manager'
  | 'Approved'
  | 'Issued from Stock'
  | 'PO Created'
  | 'Received'
  | 'Declined'
  | 'Cancelled';

export const STOCK_REQUEST_STATUSES: StockRequestStatus[] = [
  'Pending Manager',
  'Approved',
  'Issued from Stock',
  'PO Created',
  'Received',
  'Declined',
  'Cancelled',
];

export type StockRequestUrgency = 'Low' | 'Normal' | 'Urgent';

export const STOCK_REQUEST_URGENCIES: StockRequestUrgency[] = ['Low', 'Normal', 'Urgent'];

export interface StockRequest {
  id: string;
  requestNumber: string;
  createdAt: string;
  /** Who raised the request (display name). */
  requestedByName: string;
  /** Optional area / department / machine / workstation. */
  requestedFor: string;
  /** Free-text item name (e.g. "Packing tape, 48mm clear"). */
  itemName: string;
  /** Optional link to a known spare part. If set, "issue from stock"
   *  decrements that spare's on-hand quantity. */
  sparePartId: string;
  sparePartName: string;
  quantity: number;
  unit: string;
  neededByDate: string;
  reason: string;
  urgency: StockRequestUrgency;
  status: StockRequestStatus;
  // Manager approval -----------------------------------------------------
  approvedByName: string;
  approvedAt: string;
  approvalNotes: string;
  // Buyer fulfilment ----------------------------------------------------
  fulfilledByName: string;
  fulfilledAt: string;
  fulfilmentNotes: string;
  /** Set when buyer chooses "raise PO" — the chosen supplier. */
  supplierId: string;
  supplierName: string;
  /** Optional estimated unit cost — useful for the PO record. */
  estimatedUnitCost: number;
  /** When goods arrived (if PO route). */
  receivedAt: string;
}

export interface StockRequestFormState {
  requestedByName: string;
  requestedFor: string;
  itemName: string;
  sparePartId: string;
  sparePartName: string;
  quantity: string;
  unit: string;
  neededByDate: string;
  reason: string;
  urgency: StockRequestUrgency;
}

export interface StockRequestFilters {
  search: string;
  status: string;
  urgency: string;
  tab: 'mine' | 'approval' | 'buying' | 'all';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 43 — Leave management (SimplePay-style)
 * ----------------------------------------------------------------------
 * BCEA defaults baked in:
 *   • Annual leave: 21 working days per year (≈ 1.75 days per month worked)
 *   • Sick leave: 30 days per 3-year cycle (10 days/year average)
 *   • Family responsibility: 3 days per year
 *   • Unpaid / Maternity / Paternity / Study: tracked but not auto-accrued
 *
 * Workflow: staff applies via My Stuff → manager approves/declines →
 * payroll deducts unpaid days from the next run.
 * ──────────────────────────────────────────────────────────────────────── */

export type LeaveType =
  | 'Annual'
  | 'Sick'
  | 'Family Responsibility'
  | 'Unpaid'
  | 'Maternity'
  | 'Paternity'
  | 'Study'
  | 'Other';

export const LEAVE_TYPES: LeaveType[] = [
  'Annual',
  'Sick',
  'Family Responsibility',
  'Unpaid',
  'Maternity',
  'Paternity',
  'Study',
  'Other',
];

/** BCEA annual entitlements in working days. Used by the accrual helper to
 *  compute "days available" against days taken to date. */
export const BCEA_LEAVE_ENTITLEMENTS: Record<LeaveType, number> = {
  Annual: 21,
  Sick: 10,                  // 30 over 3-year cycle = 10/year average
  'Family Responsibility': 3,
  Unpaid: 0,                 // unlimited; tracked but no accrual
  Maternity: 120,            // 4 months unpaid by default
  Paternity: 10,
  Study: 0,
  Other: 0,
};

export type LeaveStatus =
  | 'Pending'
  | 'Approved'
  | 'Declined'
  | 'Cancelled'
  | 'Taken';

export const LEAVE_STATUSES: LeaveStatus[] = [
  'Pending',
  'Approved',
  'Declined',
  'Cancelled',
  'Taken',
];

export interface LeaveRequest {
  id: string;
  requestNumber: string;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  /** Working days requested (computed at save time; excludes weekends). */
  days: number;
  reason: string;
  status: LeaveStatus;
  // Approval -------------------------------------------------------------
  approvedByName: string;
  approvedAt: string;
  approvalNotes: string;
  /** Optional URL to medical certificate, school letter, etc. */
  attachmentUrl: string;
}

export interface LeaveRequestFormState {
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl: string;
}

export interface LeaveRequestFilters {
  search: string;
  type: string;
  status: string;
  employeeId: string;
  tab: 'mine' | 'approval' | 'all';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 44 — Staff loans & salary advances
 * ----------------------------------------------------------------------
 * One loan record per agreement. monthlyRepayment is auto-deducted from
 * the employee's next payslip (added to otherDeductions). Loan balance
 * decrements as each repayment is applied; status flips to 'Settled' when
 * balance hits zero.
 * ──────────────────────────────────────────────────────────────────────── */

export type StaffLoanStatus = 'Active' | 'Settled' | 'Cancelled' | 'Written Off';
export const STAFF_LOAN_STATUSES: StaffLoanStatus[] = ['Active', 'Settled', 'Cancelled', 'Written Off'];

export interface StaffLoan {
  id: string;
  loanNumber: string;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  /** Original loan amount. */
  principalAmount: number;
  /** Recovered per payslip until balance hits zero. */
  monthlyRepayment: number;
  startDate: string;
  expectedEndDate: string;
  /** Remaining balance after repayments. */
  balance: number;
  status: StaffLoanStatus;
  reason: string;
  notes: string;
}

export interface StaffLoanFormState {
  employeeId: string;
  employeeName: string;
  principalAmount: string;
  monthlyRepayment: string;
  startDate: string;
  expectedEndDate: string;
  reason: string;
  notes: string;
}

export interface StaffLoanFilters {
  search: string;
  status: string;
  employeeId: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 45 — Payroll adjustments (bonuses, 13th cheque, ad-hoc additions)
 * ----------------------------------------------------------------------
 * Per-employee adjustments attached to a payroll run. Additions flow into
 * grossPay; deductions flow into otherDeductions. Taxable adjustments are
 * folded into PAYE recalc; non-taxable (e.g. reimbursements) bypass tax.
 * ──────────────────────────────────────────────────────────────────────── */

export type PayrollAdjustmentType =
  | 'Bonus'
  | 'Commission'
  | '13th Cheque'
  | 'Reimbursement'
  | 'Allowance'
  | 'Loan Repayment'
  | 'Other Addition'
  | 'Other Deduction';

export const PAYROLL_ADJUSTMENT_TYPES: PayrollAdjustmentType[] = [
  'Bonus',
  'Commission',
  '13th Cheque',
  'Reimbursement',
  'Allowance',
  'Loan Repayment',
  'Other Addition',
  'Other Deduction',
];

export interface PayrollAdjustment {
  id: string;
  employeeId: string;
  type: PayrollAdjustmentType;
  /** Always positive — sign is derived from `type`. */
  amount: number;
  /** If true, included in PAYE calc; if false, e.g. reimbursement, skipped. */
  taxable: boolean;
  description: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 49 — Expense / claim requests
 * ----------------------------------------------------------------------
 * Staff submits a claim (e.g. R350 for petrol to deliver Job JC-123),
 * manager approves, accountant marks it paid. Paid claims can flow back
 * into the next payroll run as a 'Reimbursement' adjustment (non-taxable)
 * or be paid out via banking.
 * ──────────────────────────────────────────────────────────────────────── */

export type ExpenseClaimCategory =
  | 'Travel / Petrol'
  | 'Parking / Tolls'
  | 'Tools & Materials'
  | 'Customer Entertainment'
  | 'Office Supplies'
  | 'Cellphone / Data'
  | 'Other';

export const EXPENSE_CLAIM_CATEGORIES: ExpenseClaimCategory[] = [
  'Travel / Petrol',
  'Parking / Tolls',
  'Tools & Materials',
  'Customer Entertainment',
  'Office Supplies',
  'Cellphone / Data',
  'Other',
];

export type ExpenseClaimStatus = 'Pending' | 'Approved' | 'Declined' | 'Paid' | 'Cancelled';
export const EXPENSE_CLAIM_STATUSES: ExpenseClaimStatus[] = ['Pending', 'Approved', 'Declined', 'Paid', 'Cancelled'];

export type ExpenseClaimPayMethod = 'Cash' | 'EFT' | 'Next Payslip' | 'Petty Cash';
export const EXPENSE_CLAIM_PAY_METHODS: ExpenseClaimPayMethod[] = ['Cash', 'EFT', 'Next Payslip', 'Petty Cash'];

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  category: ExpenseClaimCategory;
  incidentDate: string;
  amount: number;
  description: string;
  /** Optional URL to scanned receipt / photo. */
  receiptUrl: string;
  /** Optional link to the job this claim relates to. */
  jobId: string;
  jobNumber: string;
  status: ExpenseClaimStatus;
  approvedByName: string;
  approvedAt: string;
  approvalNotes: string;
  paidByName: string;
  paidAt: string;
  payMethod: ExpenseClaimPayMethod;
}

export interface ExpenseClaimFormState {
  employeeId: string;
  employeeName: string;
  category: ExpenseClaimCategory;
  incidentDate: string;
  amount: string;
  description: string;
  receiptUrl: string;
  jobId: string;
  jobNumber: string;
}

export interface ExpenseClaimFilters {
  search: string;
  status: string;
  category: string;
  employeeId: string;
  tab: 'mine' | 'approval' | 'payment' | 'all';
}

export interface MaterialOrderRequest {
  id: string;
  orderNumber: string;
  createdAt: string;
  requestedDate: string;
  status: ProcurementOrderStatus;
  jobId: string;
  jobNumber: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  paperType: string;
  gsm: string;
  quantityRequired: number;
  quantityUnit: QuantityUnit;
  shortageQuantity: number;
  supplierId: string;
  supplierName: string;
  requestedBy: string;
  notes: string;
}

export interface SupplierFormState {
  name: string;
  /** Phase 58 — optional pointer to a unified Company. */
  companyId?: string;
  contactPerson: string;
  phone: string;
  email: string;
  contacts: SupplierContact[];
  address: string;
  billingAddress: string;
  city: string;
  country: string;
  website: string;
  supplierType: SupplierType;
  certificateCode: string;
  accountNumber: string;
  paymentTerms: string;
  creditLimit: string;
  currentBalance: string;
  currency: CurrencyCode;
  isAlsoClient: boolean;
  linkedClientId: string;
  lastCheckInDate: string;
  nextReviewDate: string;
  reviewFrequencyMonths: string;
  internalOwner: string;
  certifications: SupplierCertification[];
  suppliedProducts: SupplierProductLink[];
  notes: string;
  active: boolean;
}

export interface MachineFormState {
  name: string;
  code: string;
  department: string;
  processType: string;
  status: MachineStatus;
  notes: string;
  active: boolean;
}

export interface LeadFormState {
  enquiryDate: string;
  clientId: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  source: LeadSource;
  /** Phase 99 — who referred / which page / which campaign. */
  sourceDetail: string;
  assignedTo: string;
  productId: string;
  requestedQuantity: string;
  dueDate: string;
  status: LeadStatus;
  quickbooksEstimateNumber: string;
  linkedQuoteId: string;
  notes: string;
  nextFollowUpDate: string;
  activities: LeadActivity[];
  lostReason: LostReason | '';
  estimatedValue: string;
  /** Phase 99 — multi-item enquiry. */
  items: LeadItem[];
  /** Phase 99 — onboarding form tracking. */
  onboardingFormReceived: boolean;
  onboardingFormReceivedDate: string;
  onboardingFormNote: string;
}

/**
 * Phase 119.3 — Form state for capturing a customer deposit. Numeric
 * fields stay as strings while the user types; we parse on save.
 */
export interface CustomerDepositFormState {
  receivedDate: string;
  clientId: string;
  amount: string;
  currency: CurrencyCode;
  paymentMethod: string;
  bankReference: string;
  proformaId: string;
  proformaNumber: string;
  jobId: string;
  jobNumber: string;
  purpose: DepositPurpose;
  notes: string;
}

export interface QuoteEstimateFormState {
  quoteDate: string;
  quickbooksEstimateNumber: string;
  linkedLeadId: string;
  clientId: string;
  productId: string;
  pricingTierId: string;
  paperRateId: string;
  costProfileId: string;
  quantity: string;
  sizeSpec: string;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: string;
  unitCost: string;
  quotedUnitPrice: string;
  totalQuote: string;
  status: QuoteStatus;
  notes: string;
  customerNote: string;
  /** Phase 117 — Blockers. Edited inline on the form. */
  waitingOn: WaitingOnBlocker[];
}

export interface ArtworkFormState {
  jobId: string;
  artworkReceivedDate: string;
  proofSentDate: string;
  approvalDate: string;
  stage: ArtworkStage;
  changesRequested: string;
  notes: string;
}

export interface CustomerStockReleaseFormState {
  releaseDate: string;
  clientId: string;
  finishedGoodsStockId: string;
  jobId: string;
  quantityReleased: string;
  quantityUnit: QuantityUnit;
  destination: string;
  notes: string;
}

export interface DeliveryNoteFormState {
  noteDate: string;
  clientId: string;
  clientContactName: string;
  clientContactPhone: string;
  clientEmail: string;
  clientAddress: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  jobId: string;
  dispatchRecordId: string;
  customerStockReleaseId: string;
  deliveryMethod: 'Delivery' | 'Collection' | 'Courier';
  deliveryReference: string;
  vehicleRegistration: string;
  driverName: string;
  dispatchedBy: string;
  receivedBy: string;
  status: 'Draft' | 'Issued' | 'Delivered' | 'Collected';
  clientVisible: boolean;
  lineItems: DeliveryNoteLineItem[];
  notes: string;
  customerNote: string;
  parentInvoiceId: string;
  /** Phase 74 — FG batch this DN draws from (Phase 73 prefill sets it). */
  sourceFinishedGoodsStockId?: string;
  receiptMode: DeliveryReceiptMode;
  signedByName: string;
  signedByDate: string;
  signedByContactInfo: string;
  collectedByName: string;
  collectedByDate: string;
  collectedByIdNumber: string;
}

export interface PricingTierFormState {
  name: string;
  type: PricingTierType;
  defaultMarginPercent: string;
  brandingMarginPercent: string;
  notes: string;
}

export interface PaperRateFormState {
  name: string;
  supplierId: string;
  /** Phase 126.1 — Supplier's product code (e.g. "PrimePak U"). Private. */
  productCode: string;
  /** Phase 126.3 — End-uses (multi-select). Same paper can serve more
   *  than one purpose, so this is an array, not a single value. */
  useCases: PaperUseCase[];
  /** Phase 126.3 — Production flag: this paper has to go through the
   *  slitter before it can be used on the bag machine / patch line. */
  requiresSlitting: boolean;
  /** Phase 126.1 — Reels vs Sheets. */
  form: PaperForm | '';
  /** Phase 126.4 — Supplier dispatch region (DBN/JHB/CT/Other). */
  region: PaperRegion | '';
  /** Phase 126.1 — What non-admin staff see in the calculator picker. */
  publicLabel: string;
  paperType: string;
  gsm: string;
  /** Phase 126.1 — Cost per ton (what we pay supplier). Stored as
   *  pricePerTon in DB for compatibility. */
  pricePerTon: string;
  /** Phase 126.1 — Charge per ton (what the calculator uses). */
  chargePerTon: string;
  /** Phase 126.1 — Contract valid-from date. */
  validFrom: string;
  /** Phase 126.1 — Contract valid-to date. */
  validTo: string;
  notes: string;
  active: boolean;
}

export interface CostProfileFormState {
  name: string;
  wastagePercent: string;
  defaultMarginPercent: string;
  baseGlueCostPerBag: string;
  hotMeltCostPerBag: string;
  flatHandleCostPerBag: string;
  ropeHandleCostPerBag: string;
  rollHandleCostPerBag: string;
  screenPrintSetupCost: string;
  screenPrintCostPerColor: string;
  flexoInkCostPer1000PerColor: string;
  plateCostPerColor: string;
  labourCostPer1000: string;
  packagingCostPer1000: string;
  transportCostPerJob: string;
  sideSeamAllowanceMm: string;
  topFoldAllowanceMm: string;
  bottomFoldAllowanceMm: string;
  flexoThresholdQty: string;
  active: boolean;
  notes: string;
}

export interface InkRateFormState {
  name: string;
  inkType: 'Process' | 'Pantone' | 'Varnish' | 'Metallic' | 'Other';
  supplierId: string;
  costPerKg: string;
  coverageSqmPerKg: string;
  defaultCoveragePercent: string;
  notes: string;
  active: boolean;
}

export interface FinishingOperationFormState {
  name: string;
  machineName: string;
  rateType: 'PerThousand' | 'PerHour';
  rate: string;
  setupCost: string;
  runSpeedPerHour: string;
  notes: string;
  active: boolean;
}

export interface PressRateFormState {
  machineId: string;
  ratePerHour: string;
  makeReadySheets: string;
  makeReadyMinutes: string;
  runSpeedSheetsPerHour: string;
  notes: string;
  active: boolean;
}

export interface PlateCostFormState {
  name: string;
  format: string;
  costPerColor: string;
  originationCost: string;
  notes: string;
  active: boolean;
}

/** Single form representing an editable work-ticket. The cost engine reads
 *  this state, computes line items, and pushes the resolved values back so
 *  the user always sees the calculated breakdown next to the inputs. */
export interface WorkTicketFormState {
  ticketDate: string;
  linkedQuoteId: string;
  linkedJobId: string;
  clientId: string;
  productId: string;
  productDescription: string;
  sizeSpec: string;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: string;
  quantity: string;
  sheets: string;
  sheetSize: string;
  paperRateId: string;
  plateCostId: string;
  pressRateId: string;
  guillotineRateId: string;
  /** Editable ink picks; the cost engine fills `cost` + `estimatedKg`. */
  inkLines: WorkTicketInkLine[];
  /** Editable finishing operations; the engine resolves cost when not overridden. */
  finishingLines: WorkTicketFinishingLine[];
  despatchCost: string;
  despatchNotes: string;
  /** Margin override; if blank the engine uses the client's pricing tier. */
  marginPercentOverride: string;
  status: WorkTicketStatus;
  notes: string;
}

export interface CalculatorQuoteFormState {
  clientId: string;
  productId: string;
  pricingTierId: string;
  paperRateId: string;
  costProfileId: string;
  bagWidthMm: string;
  bagHeightMm: string;
  gussetMm: string;
  quantity: string;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: string;
  customMarginPercent: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Calculator v2 — multi-line quote builder.
 *
 * Replaces CalculatorQuoteFormState. Shared header fields live once on
 * the CalculatorState; everything that varies per SKU goes onto a
 * CalculatorLineItem. The calculator engine computes per-line totals
 * and a quote-level rollup.
 * ────────────────────────────────────────────────────────────────────────*/
/** Print coverage band — replaces hard-to-measure exact coverage %. The rep
 *  eyeballs how much of the bag is inked. Drives the per-bag print charge. */
export type PrintCoverageBand = 'None' | 'Light' | 'Medium' | 'Heavy';

export interface CalculatorLineItem {
  /** Stable client-side id used as a React key + when posting to a quote. */
  id: string;
  productId: string;
  /** Free-text override if the user wants to describe a custom SKU. */
  productName: string;
  description: string;
  bagWidthMm: string;
  bagHeightMm: string;
  gussetMm: string;
  quantity: string;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: string;
  /** Print artwork area in cm² — used to price plates (area × colours ×
   *  plate rate). One plate per colour, each sized to this area. */
  printAreaCm2: string;
  /** Coverage band drives the per-bag ink/print charge. */
  coverageBand: PrintCoverageBand;
  /** Per-line cost-master overrides. Empty string = inherit from shared. */
  paperRateIdOverride: string;
  costProfileIdOverride: string;
  /** Per-line margin override; empty inherits the quote-level margin. */
  customMarginPercent: string;
  /** Phase 91 — Free-text discount reason captured by an admin when a
   *  margin override is applied on this line. Stored on the saved quote
   *  for the audit trail. */
  discountReason?: string;
}

/** How plate charges are billed on the quote.
 *   upfront   — plates shown as a separate one-off setup line.
 *   amortized — plate charge spread across the run, baked into the per-bag
 *               price (no separate plate line). Same total, different shape.
 *  Some clients insist on no upfront plate cost; this toggles per quote. */
export type PlateBillingMode = 'upfront' | 'amortized';

export interface CalculatorSharedState {
  clientId: string;
  /** Optional CRM lead to attribute the quote to. */
  leadId: string;
  pricingTierId: string;
  paperRateId: string;
  costProfileId: string;
  customMarginPercent: string;
  quoteDate: string;
  notes: string;
  salesOwnerName: string;
  plateBilling: PlateBillingMode;
}

export interface CalculatorState {
  shared: CalculatorSharedState;
  lines: CalculatorLineItem[];
}

export interface ClientFormState {
  name: string;
  /** Phase 58 — optional pointer to a unified Company (the parent business
   *  entity). When set, the Client inherits shared fields visually but the
   *  role-specific data on this record stays canonical. */
  companyId?: string;
  companyName: string;
  accountManagerName: string;
  /** Phase 116 — Per-client brand logo. Empty string = use dashboard default. */
  preferredLogoId?: string;
  /** Phase 119 — AR payment model selector on the Client form. */
  paymentModel: CustomerPaymentModel;
  /** Phase 119 — String for form input convenience; parsed on save. */
  defaultDepositPercent: string;
  code: string;
  pricingTierId: string;
  brandingDefault: boolean;
  defaultMarginPercent: string;
  creditLimit: string;
  currentBalance: string;
  paymentTerms: string;
  primaryPaymentMethod: PaymentMethod;
  currency: CurrencyCode;
  invoiceLanguage: string;
  vatNumber: string;
  openingBalance: string;
  openingBalanceAsOf: string;
  accountHold: boolean;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  contactName: string;
  contactEmail: string;
  phoneNumber: string;
  mobileNumber: string;
  otherPhone: string;
  faxNumber: string;
  ccEmail: string;
  bccEmail: string;
  website: string;
  marketingConsent: boolean;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  stockHoldingEnabled: boolean;
  stockHoldingAgreementSigned: boolean;
  stockHoldingAgreementSignedDate: string;
  stockHoldingAgreementReference: string;
  stockHoldingReviewDate: string;
  /** Phase 5.6 — customer-specific food safety requirements. Optional so
   *  existing records load without forcing a migration. */
  foodSafeDeclarationRequired?: boolean;
  batchNumberRequiredOnDeliveryNote?: boolean;
  coaRequired?: boolean;
  productSpecRequired?: boolean;
  specialPackingRules?: string;
  specialDeliveryRules?: string;
  approvedMaterialRestrictions?: string;
  creditAgreementSigned: boolean;
  creditAgreementSignedDate: string;
  creditAgreementReference: string;
  storageGracePeriodDays: string;
  maxStoragePeriodDays: string;
  storageFeeApplies: boolean;
  storageFeeType: StorageFeeType;
  storageFeeRate: string;
  depositRequiredPercent: string;
  minimumMonthlyReleaseQuantity: string;
  minimumMonthlyReleaseUnit: QuantityUnit;
  minimumReleaseQuantity: string;
  deliveryChargePolicy: DeliveryChargePolicy;
  releaseApprovalRequired: boolean;
  portalEnabled: boolean;
  portalViewQuotes: boolean;
  portalViewInvoices: boolean;
  portalViewStock: boolean;
  portalRequestRelease: boolean;
  notes: string;
  active: boolean;
}

export interface ProductFormState {
  name: string;
  sku: string;
  category: ProductCategory;
  supplyType: ProductSupplyType;
  defaultSupplierId: string;
  brandingAllowed: boolean;
  defaultUnit: QuantityUnit;
  defaultPaperType: string;
  defaultGsm: string;
  notes: string;
  active: boolean;
  /** Phase 33 — standard pricing spec (all as form strings). */
  pricingEnabled: boolean;
  bagWidthMm: string;
  bagHeightMm: string;
  gussetMm: string;
  handleType: HandleType;
  printMethod: PrintMethod;
  colors: string;
  printAreaCm2: string;
  coverageBand: PrintCoverageBand;
  paperRateId: string;
  costProfileId: string;
  plateBilling: PlateBillingMode;
  baseMarginPercent: string;
  baseQuantity: string;
  /** Comma-separated MOQ break quantities, e.g. "5000, 10000, 25000". */
  breakQuantities: string;
  /** Phase 85 — packing / sale units the product is offered in. */
  salesUnits?: ProductSalesUnit[];
  /** Phase 59 — Supabase public URLs for product photos. */
  photoUrls?: string[];
}

export interface JobFormState {
  jobDate: string;
  dueDate: string;
  leadId: string;
  leadNumber: string;
  quoteId: string;
  quoteNumber: string;
  quickbooksEstimateNumber: string;
  invoiceNumber: string;
  orderValue: string;
  paymentRequirement: PaymentRequirement;
  paymentStatus: PaymentStatus;
  creditCheckStatus: CreditCheckStatus;
  availableCreditAtApproval: string;
  commercialReleaseStatus: CommercialReleaseStatus;
  clientId: string;
  pricingTierId: string;
  productId: string;
  productCategory: ProductCategory;
  customerName: string;
  customerReference: string;
  productName: string;
  description: string;
  sizeSpec: string;
  paperType: string;
  gsm: string;
  paperQuantityRequired: string;
  paperQuantityUnit: QuantityUnit;
  paperAllocationStatus: PaperAllocationStatus;
  printRequired: boolean;
  printMethod: PrintMethod;
  colorCount: string;
  supplyFormat: SupplyFormat;
  packingNotes: string;
  printNotes: string;
  quantityPlanned: string;
  quantityCompleted: string;
  status: JobStatus;
  artworkReceived: boolean;
  proofSent: boolean;
  approvalStatus: ApprovalStatus;
  approvalDate: string;
  artworkPreparationStatus: ArtworkPreparationStatus;
  addElementsRequired: boolean;
  colorChangesRequired: boolean;
  artworkChangeSummary: string;
  artworkAssignedDate: string;
  artworkAssignedTo: string;
  proofSharedDate: string;
  proofSharedBy: string;
  finalApprovalReceivedDate: string;
  finalApprovalClearedBy: string;
  factoryReleaseDate: string;
  factoryReleasedBy: string;
  productionStartDate: string;
  productionStartedBy: string;
  readyForDispatchDate: string;
  readyForDispatchBy: string;
  collectionOrDeliveryStatus: 'Client Collecting' | 'Delivery Required' | 'Not Confirmed';
  changesRequested: string;
  artworkNotes: string;
  reserveFromStock: boolean;
  reservedFinishedGoodsStockId: string;
  reservedQuantity: string;
  stockReservationStatus: StockReservationStatus;
  dispatchStatus: string;
  qualityNotes: string;
  capturedBy: string;
  releasedBy: string;
  notes: string;
  fscRelated: boolean;
  foodContactLevel: FoodContactLevel;
  foodSafeMaterialIds: string[];
  /** Phase 71 — chemicals (inks/glues/adhesives/lubricants) used. */
  chemicalIds?: string[];
  /** Phase 76 — claim FSC on this job's outputs. */
  fscClaimEnabled?: boolean;
  internalBatchNumber: string;
  foodSafetyNotes: string;
  assignedMachineId: string;
  changeoverChecklist: ChangeoverChecklistItem[];
  qcPlan: QcStageRecord[];
  /** Phase 59 — proof / sample photos for the job. */
  photoUrls?: string[];
  /** Phase 62 — Tooling references (die + stereo). */
  dieToolId?: string;
  stereoToolId?: string;
  /** Phase 94 — production-stage tracker, edited via JobPipelineTracker
   *  on the form and persisted with the job. */
  pipelineStages?: PipelineStage[];
  /** Phase 117 — Blockers parking this job. */
  waitingOn: WaitingOnBlocker[];
}

export interface FinishedGoodsStockFormState {
  storedDate: string;
  productId: string;
  clientId: string;
  jobId: string;
  barcode: string;
  quantityOnHand: string;
  quantityReserved: string;
  quantityUnit: QuantityUnit;
  storageLocation: string;
  stockStatus: FinishedStockStatus;
  brandingStatus: string;
  notes: string;
  /** Phase 59 — batch photos. */
  photoUrls?: string[];
}

export interface SparePartFormState {
  partName: string;
  /** Phase 59 — uploaded photo URLs. */
  photoUrls?: string[];
  category: StockItemCategory;
  itemType: StockItemType;
  productionUse: boolean;
  machineId: string;
  machineReference: string;
  supplierId: string;
  supplierName: string;
  barcode: string;
  quantityOnHand: string;
  minimumStockLevel: string;
  reorderLevel: string;
  unitOfMeasure: QuantityUnit;
  unitCost: string;
  storageLocation: string;
  lastPurchaseDate: string;
  notes: string;
  /** Phase 66 — flag as theft-prone / high-value. */
  isHighValue?: boolean;
}

export interface MaterialReceiptFormState {
  receivedDate: string;
  supplierId: string;
  supplierName: string;
  supplierBatchNumber: string;
  internalRollCode: string;
  barcode: string;
  /** Phase 16 (Task #72). Defaults to 'Paper' for backward compat. */
  materialKind: MaterialKind;
  /** Used when materialKind ≠ 'Paper'. */
  itemName: string;
  paperType: string;
  gsm: string;
  width: string;
  quantityReceived: string;
  quantityUnit: QuantityUnit;
  fscClaimType: FscClaimType;
  supplierCertificateCode: string;
  invoiceReference: string;
  storageLocation: string;
  inspectionNotes: string;
  fscRelated: boolean;
  /** Phase 64 — roll wrapper / label / drum photos. */
  photoUrls?: string[];
  /** Phase 71 — food-safety flag + cert ref. */
  isFoodSafe?: FoodSafeStatus;
  foodContactCertNumber?: string;
}

export interface InventoryScanFormState {
  barcode: string;
  movementDate: string;
  movementType: InventoryMovementType;
  quantityMoved: string;
  toLocation: string;
  jobId: string;
  notes: string;
}

export interface ProductionLogFormState {
  logDate: string;
  logType: ProductionLogType;
  jobId: string;
  operatorName: string;
  machineId: string;
  machine: string;
  sourceMaterialId: string;
  setupTimeMinutes: string;
  notes: string;
  operatorSignature: string;
  fscRelated: boolean;
  rollCode: string;
  height: string;
  gusset: string;
  handleType: string;
  goodBags: string;
  rejectBags: string;
  heightChange: string;
  printingMethod: string;
  bagSize: string;
  numberOfColors: string;
  quantityPrinted: string;
  materialSourceCode: string;
  rollWidth: string;
  metersKgPrinted: string;
  rejectMetersKg: string;
  parentRollCode: string;
  parentWidth: string;
  targetChildWidth: string;
  numberOfChildRolls: string;
  childDiameter: string;
  totalWasteKg: string;
  bladeChange: string;
}

export interface WasteFormState {
  wasteDate: string;
  jobId: string;
  productionLogId: string;
  wasteQuantity: string;
  wasteUnit: QuantityUnit;
  wasteReason: WasteReason;
  notes: string;
  enteredBy: string;
  fscRelated: boolean;
}

export interface PaperFormState {
  logDate: string;
  jobId: string;
  materialReceiptId: string;
  paperType: string;
  gsm: string;
  width: string;
  quantityUsed: string;
  quantityUnit: QuantityUnit;
  paperCode: string;
  notes: string;
  fscRelated: boolean;
}

export interface DispatchFormState {
  dispatchDate: string;
  jobId: string;
  finishedGoodsStockId: string;
  quantityDispatched: string;
  quantityUnit: QuantityUnit;
  labelReference: string;
  deliveryReference: string;
  issueNotes: string;
  fscRelated: boolean;
}

/** Editor shape — kept as strings so number fields can be empty while typing. */
export interface InvoiceLineItemFormState {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: string;
  quantityUnit: QuantityUnit;
  unitPriceExclVat: string;
  vatRatePercent: string;
}

export interface InvoicePaymentFormState {
  id: string;
  paymentDate: string;
  amount: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

export interface InvoiceFormState {
  invoiceDate: string;
  dueDate: string;
  clientId: string;
  jobId: string;
  /** Phase 74 — FG batch this invoice draws from (Phase 73 prefill sets it). */
  sourceFinishedGoodsStockId?: string;
  quoteId: string;
  productionSpecId: string;
  customerReference: string;
  termsType: InvoiceTermsType;
  termsText: string;
  notes: string;
  footerNotes: string;
  customerNote: string;
  status: InvoiceStatus;
  currency: CurrencyCode;
  lineItems: InvoiceLineItemFormState[];
  payments: InvoicePaymentFormState[];
  stockHoldingApplies: boolean;
  stockHoldingStartDate: string;
  stockHoldingMaxDays: string;
  clientVisible: boolean;
}

export interface ProductionSpecFormState {
  specDate: string;
  status: ProductionSpecStatus;
  clientId: string;
  productId: string;
  jobId: string;
  sizeWidthMm: string;
  sizeHeightMm: string;
  sizeGussetMm: string;
  paperGsm: string;
  paperType: string;
  handleType: HandleType;
  finishingNotes: string;
  printMethod: PrintMethod;
  printColours: string;
  pantoneReferences: string;
  artworkReference: string;
  printPositionNotes: string;
  quantityOrdered: string;
  quantityUnit: QuantityUnit;
  leadTimeDays: string;
  packingFormat: SupplyFormat;
  packingNotes: string;
  approvedBy: string;
  approvedDate: string;
  notes: string;
  clientVisible: boolean;
}

export interface JobFilters { search: string; month: string; status: string; customer: string; fsc: string; }
export interface PaperRateFilters { search: string; active: string; }
export interface SupplierFilters { search: string; supplierType: string; active: string; }
export interface MachineFilters { search: string; status: string; processType: string; active: string; }
export interface LeadFilters {
  search: string;
  month: string;
  status: string;
  source: string;
  owner: string;
  /** Follow-up state filter — 'all' / 'due-today' / 'overdue' / 'this-week' / 'unscheduled'. */
  followUp?: 'all' | 'due-today' | 'overdue' | 'this-week' | 'unscheduled';
}
export interface QuoteEstimateFilters { search: string; month: string; status: string; client: string; }
export interface ArtworkFilters { search: string; stage: string; client: string; }
export interface CustomerStockReleaseFilters { search: string; month: string; client: string; }
export interface DeliveryNoteFilters { search: string; month: string; client: string; status: string; visibility: string; }
export interface InvoiceFilters { search: string; month: string; client: string; status: string; stockHolding: string; }
export interface ProductionSpecFilters { search: string; client: string; status: string; product: string; }
export interface CostProfileFilters { search: string; active: string; }
export interface InkRateFilters { search: string; inkType: string; active: string; }
export interface FinishingOperationFilters { search: string; rateType: string; active: string; }
export interface PressRateFilters { search: string; active: string; }
export interface PlateCostFilters { search: string; active: string; }
export interface WorkTicketFilters { search: string; month: string; status: string; client: string; }
export interface FinishedGoodsStockFilters { search: string; client: string; status: string; product: string; }
export interface SparePartFilters { search: string; category: string; lowStock: string; supplier: string; }
export interface StockIssueFormState {
  itemId: string;
  quantity: string;
  issuedToName: string;
  issuedByName: string;
  jobId: string;
  jobNumber: string;
  notes: string;
  /** Phase 66 — captured signature + approver fields. */
  signatureDataUrl?: string;
  approverPin?: string;
  approverName?: string;
}
export interface StockIssueFilters { search: string; status: string; itemType: string; }
export interface StockCountFormState {
  scope: string;
  countedByName: string;
  notes: string;
  selectedItemIds: string[];
  countedQty: Record<string, string>; // itemId -> entered qty
}
export interface MaterialFilters { search: string; month: string; supplier: string; paperType: string; fsc: string; }
export interface ProductionFilters { search: string; month: string; logType: string; machine: string; fsc: string; }
export interface WasteFilters { search: string; month: string; customer: string; reason: string; fsc: string; }
export interface PaperFilters { search: string; month: string; paperType: string; gsm: string; fsc: string; }
export interface DispatchFilters { search: string; month: string; customer: string; fsc: string; }
export interface ProductFilters { search: string; category: string; supplyType: string; active: string; }
export interface ClientFilters { search: string; clientType: string; active: string; }
export interface PricingTierFilters { search: string; type: string; }
export interface ReportFilters {
  month: string;
  dateFrom: string;
  dateTo: string;
  jobNumber: string;
  customer: string;
  fsc: string;
  status: string;
  wasteReason: string;
  paperType: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 16 — Auto-derived notifications (Task #96)
 *
 * Notifications are computed live from app data — we don't persist them to
 * the DB. The "read" state is kept in localStorage keyed by `id`, so the
 * bell in the topbar can show an unread badge that survives reloads.
 *
 * Each notification has a `link` describing the view + optional entity to
 * navigate to when the user clicks it, so the bell doubles as a launcher.
 * ────────────────────────────────────────────────────────────────────────*/
export type NotificationKind =
  | 'invoiceOverdue'
  | 'jobMissingArtwork'
  | 'leadFollowUpDue'
  | 'sparePartLowStock'
  | 'cleaningOverdue'
  | 'sopExpiring'
  | 'materialLowCover'
  | 'maintenanceDue'
  | 'creditBlock'
  | 'sarsDeadline'
  | 'podCaptured'
  | 'podRefused'
  | 'podCodReady';

export type NotificationSeverity = 'info' | 'warn' | 'urgent';

export interface NotificationLink {
  view: View;
  entityId?: string;
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: NotificationLink;
  createdAt: string;
}

/** Material kind — Phase 16 (Task #72). The original schema was paper-only;
 *  we add a kind discriminator so the Materials Receiving page can capture
 *  inks, plates, adhesives, foils, chemicals, etc. without spawning new
 *  forms. Paper-specific fields (gsm/width/fsc) remain optional. */
// Phase 80 — single materials-receiving dropdown covers everything that
// physically arrives at the factory door. Paper-specific fields (GSM,
// width, FSC) only render for 'Paper'; everything else uses itemName.
// Existing rows tagged 'Chemical' still work — the new options just
// give the receiver finer-grained choices when categorising a delivery.
export type MaterialKind =
  | 'Paper'
  | 'Raw material'
  | 'Ink'
  | 'Plate'
  | 'Adhesive'
  | 'Foil'
  | 'Lubricant'
  | 'Solvent'
  | 'Chemical'
  | 'Spare part'
  | 'Consumable'
  | 'PPE'
  | 'Uniform'
  | 'Kitchen'
  | 'Office'
  | 'Other';

export const MATERIAL_KINDS: MaterialKind[] = [
  'Paper',
  'Raw material',
  'Ink',
  'Plate',
  'Adhesive',
  'Foil',
  'Lubricant',
  'Solvent',
  'Chemical',
  'Spare part',
  'Consumable',
  'PPE',
  'Uniform',
  'Kitchen',
  'Office',
  'Other',
];

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 17 — Driver POD (Task #81)
 *
 * A POD record attaches to a dispatch record. The driver captures every
 * piece of proof on a phone, the dashboard records it. We keep a single
 * row per dispatch (one delivery attempt) — if a delivery fails and is
 * re-attempted, that's a new POD row linked to the same dispatch.
 *
 * Files (signature image, photos) live in Supabase Storage; the record
 * stores only public URLs/paths. The signatureDataUrl is the *captured*
 * PNG before upload (used as a fallback when offline) and is set to
 * empty string once the upload succeeds.
 * ────────────────────────────────────────────────────────────────────────*/
export type PodDeliveryOutcome = 'Delivered' | 'Partial' | 'Refused' | 'Failed';

export type PodGoodsCondition = 'Good' | 'Minor damage' | 'Major damage' | 'Wet' | 'Other';

export interface ProofOfDelivery {
  id: string;
  podNumber: string;
  createdAt: string;
  /** FK back to the dispatch this POD certifies. */
  dispatchRecordId: string;
  dispatchNumber: string;
  /** Optional convenience copies of dispatch context, so a POD row alone
   *  is sufficient on the printable receipt without re-joining. */
  jobId: string;
  jobNumber: string;
  clientId: string;
  clientName: string;
  /** Who was driving. Linked to a user profile when possible, else free
   *  text (we have casual contractors who don't have JomoPak accounts). */
  driverName: string;
  driverUserId: string;
  /** Receiver-side capture. */
  receiverName: string;
  receiverRole: string;        // e.g. "Storeman", "Owner"
  receiverCompany: string;
  receiverIdNumber: string;
  receiverPhone: string;
  /** Outcome + reason for anything other than Delivered. */
  outcome: PodDeliveryOutcome;
  failureReason: string;
  /** Delivered quantity (driver-verified, may differ from dispatch). */
  quantityDelivered: number;
  quantityUnit: QuantityUnit;
  goodsCondition: PodGoodsCondition;
  conditionNotes: string;
  /** Auto-captured GPS + timestamp at moment of confirmation. */
  capturedAt: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracyMeters: number;
  /** Public URLs after upload, or empty until sync. */
  signatureUrl: string;
  signatureDataUrl: string;    // fallback inline copy until uploaded
  signedDocumentPhotoUrl: string;
  goodsPhotoUrls: string[];
  notes: string;
  /** Sync state for offline queue. Local rows start as 'pending'. */
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 17 — Supplier-invoice OCR Inbox (Task #82)
 *
 * Every uploaded supplier invoice lands in invoice_inbox_items with a
 * source tag so we can later wire WhatsApp / email / internal-messaging
 * intakes without changing the table. The OCR pipeline writes the
 * raw extraction into `extractedJson`; the validation pass (Claude)
 * writes the normalized version into `validatedJson`.
 *
 * Review status:
 *   pending      — uploaded, OCR not run
 *   ocr_running  — sent to Document AI
 *   ocr_failed   — Document AI errored, see ocrError
 *   ocr_done     — extracted, awaiting human review
 *   reviewed     — operator confirmed the values
 *   posted       — operator pushed the values into Materials Receiving
 *                  (or wherever) and the inbox item is now archived
 *   duplicate    — fingerprint matched an already-posted invoice
 * ────────────────────────────────────────────────────────────────────────*/
export type InvoiceInboxSource =
  | 'materialsUpload'
  | 'manualUpload'
  | 'email'
  | 'whatsapp'
  | 'messaging';

export const INVOICE_INBOX_SOURCES: InvoiceInboxSource[] = [
  'materialsUpload', 'manualUpload', 'email', 'whatsapp', 'messaging',
];

export type InvoiceInboxStatus =
  | 'pending'
  | 'ocr_running'
  | 'ocr_failed'
  | 'ocr_done'
  | 'reviewed'
  | 'posted'
  | 'duplicate';

export interface InvoiceLineExtraction {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
}

export interface InvoiceExtraction {
  supplierGuess: string;
  matchedSupplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  supplierVatNumber: string;
  currency: string;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  paymentTerms: string;
  bankName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  lines: InvoiceLineExtraction[];
}

export interface InvoiceInboxItem {
  id: string;
  inboxNumber: string;
  createdAt: string;
  source: InvoiceInboxSource;
  uploaderName: string;
  uploaderUserId: string;
  /** File metadata. The file itself sits in Supabase Storage. */
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
  fileUrl: string;
  storagePath: string;
  /** Stable fingerprint (sha256 of file bytes) for duplicate detection. */
  fileHash: string;
  status: InvoiceInboxStatus;
  ocrError: string;
  /** Raw extraction from Document AI. */
  extractedJson: InvoiceExtraction | null;
  /** Cleaned/validated by Claude API. */
  validatedJson: InvoiceExtraction | null;
  /** Reviewer attribution. */
  reviewedByName: string;
  reviewedAt: string;
  reviewNotes: string;
  /** Once posted, point at downstream records. */
  postedAsMaterialReceiptId: string;
  postedAsMaterialReceiptNumber: string;
  postedAsApInvoiceId: string;
  postedAt: string;
  /** Forward-link to candidate matches found by the duplicate detector. */
  duplicateCandidateIds: string[];
  /** Sender context — used by future inbound channels (WhatsApp/email). */
  senderHandle: string;
  senderSubject: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 24 — default South African small-business chart of accounts.
 *
 * Deliberately compact: enough structure to classify every supplier bill and
 * map cleanly onto a SARS / accountant export later, without drowning a small
 * factory team in ledger codes. Codes follow the common SA convention:
 *   1000s Assets · 2000s Liabilities · 3000s Equity · 4000s Income ·
 *   5000s Cost of Sales · 6000s+ Expenses (overheads).
 * ────────────────────────────────────────────────────────────────────────*/
export function buildDefaultChartOfAccounts(): LedgerAccount[] {
  const rows: Array<Omit<LedgerAccount, 'id' | 'active' | 'notes'>> = [
    // Assets
    { code: '1000', name: 'Bank — Current Account', type: 'Asset', subType: 'Current Asset', vatApplicable: false },
    { code: '1100', name: 'Accounts Receivable (Debtors)', type: 'Asset', subType: 'Current Asset', vatApplicable: false },
    { code: '1200', name: 'Inventory — Raw Materials', type: 'Asset', subType: 'Current Asset', vatApplicable: false },
    { code: '1210', name: 'Inventory — Finished Goods', type: 'Asset', subType: 'Current Asset', vatApplicable: false },
    { code: '1400', name: 'VAT Input (claimable)', type: 'Asset', subType: 'Tax', vatApplicable: false },
    { code: '1500', name: 'Plant & Machinery', type: 'Asset', subType: 'Fixed Asset', vatApplicable: true },
    { code: '1510', name: 'Office & Computer Equipment', type: 'Asset', subType: 'Fixed Asset', vatApplicable: true },
    { code: '1520', name: 'Motor Vehicles', type: 'Asset', subType: 'Fixed Asset', vatApplicable: true },
    { code: '1590', name: 'Accumulated Depreciation', type: 'Asset', subType: 'Fixed Asset', vatApplicable: false },
    // Liabilities
    { code: '2000', name: 'Accounts Payable (Creditors)', type: 'Liability', subType: 'Current Liability', vatApplicable: false },
    { code: '2100', name: 'VAT Output (payable)', type: 'Liability', subType: 'Tax', vatApplicable: false },
    { code: '2200', name: 'PAYE / SDL / UIF Payable', type: 'Liability', subType: 'Payroll Liability', vatApplicable: false },
    { code: '2300', name: 'Loans Payable', type: 'Liability', subType: 'Long-term Liability', vatApplicable: false },
    // Equity
    { code: '3000', name: "Owner's Capital", type: 'Equity', subType: 'Equity', vatApplicable: false },
    { code: '3100', name: 'Retained Earnings', type: 'Equity', subType: 'Equity', vatApplicable: false },
    { code: '3200', name: "Owner's Drawings", type: 'Equity', subType: 'Equity', vatApplicable: false },
    // Income
    { code: '4000', name: 'Sales — Paper Bags', type: 'Income', subType: 'Revenue', vatApplicable: true },
    { code: '4010', name: 'Sales — Printing & Plates', type: 'Income', subType: 'Revenue', vatApplicable: true },
    { code: '4900', name: 'Other Income', type: 'Income', subType: 'Revenue', vatApplicable: true },
    { code: '4920', name: 'Foreign Exchange Gain / (Loss)', type: 'Income', subType: 'Revenue', vatApplicable: false },
    // Cost of Sales
    { code: '5000', name: 'Paper & Board', type: 'Expense', subType: 'Cost of Sales', vatApplicable: true },
    { code: '5010', name: 'Ink & Coatings', type: 'Expense', subType: 'Cost of Sales', vatApplicable: true },
    { code: '5020', name: 'Plates & Origination', type: 'Expense', subType: 'Cost of Sales', vatApplicable: true },
    { code: '5030', name: 'Glue & Consumables', type: 'Expense', subType: 'Cost of Sales', vatApplicable: true },
    { code: '5040', name: 'Outsourced / Subcontract', type: 'Expense', subType: 'Cost of Sales', vatApplicable: true },
    { code: '5050', name: 'Freight & Import Duty', type: 'Expense', subType: 'Cost of Sales', vatApplicable: true },
    // Overheads / Expenses
    { code: '6000', name: 'Salaries & Wages', type: 'Expense', subType: 'Overheads', vatApplicable: false },
    { code: '6010', name: 'Rent', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6020', name: 'Electricity & Water', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6030', name: 'Machine Maintenance & Spares', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6040', name: 'Vehicle & Fuel', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6050', name: 'Telephone & Internet', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6060', name: 'Insurance', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6070', name: 'Bank Charges', type: 'Expense', subType: 'Overheads', vatApplicable: false },
    { code: '6080', name: 'Professional Fees (Accounting/Legal)', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6090', name: 'Cleaning & Sanitation', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6100', name: 'Office & Admin', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6110', name: 'Marketing & Advertising', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6120', name: 'Software & Subscriptions', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6130', name: 'Staff Training & PPE', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6140', name: 'Pest Control & Compliance', type: 'Expense', subType: 'Overheads', vatApplicable: true },
    { code: '6150', name: 'Depreciation', type: 'Expense', subType: 'Overheads', vatApplicable: false },
    { code: '6900', name: 'Sundry / Other Expenses', type: 'Expense', subType: 'Overheads', vatApplicable: true },
  ];
  return rows.map((row) => ({
    ...row,
    id: `acct-${row.code}`,
    active: true,
    notes: '',
  }));
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 109.2 — Financial Projections.
 *
 * A FinancialProjection is one named scenario (e.g. "Base case FY26", "If
 * we land the QSR contract", "Recession"). Each scenario carries a set of
 * assumptions and an opening balance sheet. The engine then projects N
 * periods of Income Statement, Balance Sheet, and Cash Flow.
 *
 * The model is monthly under the hood (cash flow needs that resolution),
 * but the UI can roll up to quarterly or annual views.
 *
 * Design principles:
 *  1. Pure function: computeProjection() is deterministic — given the same
 *     scenario, you always get the same numbers. No DB calls.
 *  2. Articulation: the three statements ARTICULATE — net income flows to
 *     retained earnings on the balance sheet, the balance sheet movements
 *     reconcile to the cash flow statement.
 *  3. Standard-aware: depreciation methods and inventory valuation
 *     respect the AccountingStandard set in AppSettings.
 *  4. Growth modelled as month-over-month %. Annual growth is split.
 * ────────────────────────────────────────────────────────────────────────*/

export type ProjectionPeriodKind = 'month' | 'quarter' | 'year';

/** What the scenario costs are driven by. "Percent of revenue" is the
 *  simplest model (most realistic for a small manufacturer). "Fixed amount"
 *  is for things like rent and insurance. */
export type ProjectionCostDriver = 'percentRevenue' | 'fixedMonthly' | 'perUnit';

/** A single line on the assumption sheet. Each line generates an expense
 *  in the P&L for every period of the projection. */
export interface ProjectionCostLine {
  id: string;
  /** Display label, e.g. "Paper", "Salaries", "Rent". */
  label: string;
  /** Maps to a Chart of Accounts code (5000-range = COGS, 6000-range = Overheads). */
  accountCode?: string;
  driver: ProjectionCostDriver;
  /** Drives the value. For percentRevenue: 0–100. For fixedMonthly: ZAR. For perUnit: ZAR per produced unit. */
  amount: number;
  /** Optional inflation rate (annual %) — applied to fixedMonthly lines. */
  inflationPercent?: number;
  /** Optional one-off month (1-indexed) the cost kicks in — useful for new hires. */
  startMonth?: number;
}

/** Capital expenditure plan (new machine, building expansion, etc.). */
export interface ProjectionCapexItem {
  id: string;
  label: string;
  /** ZAR amount of the spend. */
  amount: number;
  /** 1-indexed month within the projection when the cash leaves. */
  month: number;
  /** Useful life in years — drives the depreciation schedule. */
  usefulLifeYears: number;
  /** Default 'Straight Line'. Engine ignores method that's not allowed under
   *  the active accounting standard. */
  depreciationMethod?: string;
}

/** Funding events — new loan drawdown, equity injection. */
export interface ProjectionFundingItem {
  id: string;
  label: string;
  kind: 'loan' | 'equity' | 'grant';
  amount: number;
  /** 1-indexed month within the projection when the cash arrives. */
  month: number;
  /** For loans: annual interest rate %, monthly repayment ZAR. */
  interestRatePercent?: number;
  monthlyRepayment?: number;
}

/** Opening Balance Sheet — what the business looks like on day 0 of the
 *  projection. Drives the starting balances on the projected Balance Sheet. */
export interface ProjectionOpeningBalances {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  otherCurrentAssets: number;
  ppe: number;
  accumulatedDepreciation: number;
  otherNonCurrentAssets: number;
  accountsPayable: number;
  shortTermDebt: number;
  otherCurrentLiabilities: number;
  longTermDebt: number;
  otherNonCurrentLiabilities: number;
  shareCapital: number;
  retainedEarnings: number;
}

export function emptyOpeningBalances(): ProjectionOpeningBalances {
  return {
    cash: 0,
    accountsReceivable: 0,
    inventory: 0,
    otherCurrentAssets: 0,
    ppe: 0,
    accumulatedDepreciation: 0,
    otherNonCurrentAssets: 0,
    accountsPayable: 0,
    shortTermDebt: 0,
    otherCurrentLiabilities: 0,
    longTermDebt: 0,
    otherNonCurrentLiabilities: 0,
    shareCapital: 0,
    retainedEarnings: 0,
  };
}

/** Revenue assumption block. */
export interface ProjectionRevenueAssumptions {
  /** Opening monthly revenue (ZAR). */
  baselineMonthlyRevenue: number;
  /** Annual growth %, distributed monthly (1 + g/100)^(1/12) – 1. */
  annualGrowthPercent: number;
  /** Average gross margin %, used to derive a default COGS line if no
   *  specific COGS cost lines are supplied. */
  grossMarginPercent: number;
  /** Optional units sold per month, baseline. Drives perUnit cost lines. */
  baselineUnitsPerMonth?: number;
}

/** Working-capital assumption block — drives the indirect cash flow. */
export interface ProjectionWorkingCapitalAssumptions {
  /** Days Sales Outstanding — average collection time. Drives AR. */
  dso: number;
  /** Days Payables Outstanding — average payment time. Drives AP. */
  dpo: number;
  /** Days Inventory Outstanding — average days of stock on hand. Drives Inventory. */
  dio: number;
}

/** Tax assumption block — South Africa default is 27% corporate tax. */
export interface ProjectionTaxAssumptions {
  corporateTaxRatePercent: number;
  /** VAT is netted out (revenue is ex-VAT), but recorded for cash flow. */
  vatRatePercent: number;
}

/** The full scenario. Persisted on AppData.financialProjections. */
export interface FinancialProjection {
  id: string;
  name: string;
  description?: string;
  /** Date the scenario was created. */
  createdAt: string;
  createdBy?: string;
  /** Optional last-edited stamp. */
  updatedAt?: string;
  /** Scenario tag for compare view — Base / Optimistic / Pessimistic / Custom. */
  scenarioKind?: 'base' | 'optimistic' | 'pessimistic' | 'custom';
  /** Number of months to project (3, 6, 12, 24, 36). */
  horizonMonths: number;
  /** First month of the projection — usually "next month after today". ISO yyyy-mm-01. */
  startMonth: string;
  /** Which accounting standard the projection is presented in. Defaults to
   *  AppSettings.accountingStandard when omitted. */
  accountingStandard?: AccountingStandard;
  revenue: ProjectionRevenueAssumptions;
  workingCapital: ProjectionWorkingCapitalAssumptions;
  tax: ProjectionTaxAssumptions;
  /** Cost lines — depreciation/interest are auto-generated by the engine. */
  costLines: ProjectionCostLine[];
  capex: ProjectionCapexItem[];
  funding: ProjectionFundingItem[];
  opening: ProjectionOpeningBalances;
  /** Inventory valuation method — defaults to FIFO. Used in disclosure. */
  inventoryMethod?: InventoryValuationMethod;
}

/* ----------------- Computed output structures (engine result) ---------------- */

/** Income Statement (Profit & Loss) for one period. */
export interface ProjectedIncomeStatement {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  depreciationAmortisation: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  tax: number;
  netIncome: number;
  /** Line-level breakdown for the printable view. */
  costBreakdown: Array<{ label: string; amount: number; accountCode?: string }>;
}

/** Balance Sheet at end of one period. */
export interface ProjectedBalanceSheet {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  ppe: number;
  accumulatedDepreciation: number;
  netPpe: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  totalAssets: number;
  accountsPayable: number;
  shortTermDebt: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  totalLiabilities: number;
  shareCapital: number;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  /** Articulation check — should be ~0. */
  balanceCheck: number;
}

/** Cash Flow Statement (indirect method) for one period. */
export interface ProjectedCashFlow {
  netIncome: number;
  depreciationAmortisation: number;
  changeInAR: number;
  changeInInventory: number;
  changeInAP: number;
  changeInOtherWC: number;
  cashFromOperations: number;
  capex: number;
  cashFromInvesting: number;
  loanDrawdown: number;
  equityInjection: number;
  loanRepayment: number;
  cashFromFinancing: number;
  netCashChange: number;
  openingCash: number;
  closingCash: number;
}

/** One period's worth of all three statements, plus the timestamp. */
export interface ProjectedPeriod {
  /** ISO yyyy-mm-01 of the period. */
  periodStart: string;
  /** Display label, e.g. "Jun 2026". */
  label: string;
  incomeStatement: ProjectedIncomeStatement;
  balanceSheet: ProjectedBalanceSheet;
  cashFlow: ProjectedCashFlow;
}

/** Total result from running the engine on one scenario. */
export interface ProjectionResult {
  scenarioId: string;
  scenarioName: string;
  accountingStandard: AccountingStandard;
  inventoryMethod: InventoryValuationMethod;
  periods: ProjectedPeriod[];
  /** Roll-up totals for the headline tiles. */
  totals: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netIncome: number;
    closingCash: number;
    /** Smallest closing-cash value over the horizon — flags going-concern risk. */
    minClosingCash: number;
    /** First period where closing cash goes negative, or null. */
    cashRunwayBreakMonth: string | null;
  };
  /** Articulation diagnostic — biggest |balanceCheck| across periods. */
  worstBalanceDelta: number;
}

/* ------------------- Helpers: empty scenario + sample seed ------------------- */

export function emptyFinancialProjection(overrides?: Partial<FinancialProjection>): FinancialProjection {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const isoStart = nextMonth.toISOString().slice(0, 10);
  return {
    id: `proj-${Date.now()}`,
    name: 'New scenario',
    createdAt: now.toISOString(),
    scenarioKind: 'base',
    horizonMonths: 12,
    startMonth: isoStart,
    revenue: {
      baselineMonthlyRevenue: 0,
      annualGrowthPercent: 0,
      grossMarginPercent: 30,
    },
    workingCapital: { dso: 45, dpo: 30, dio: 30 },
    tax: { corporateTaxRatePercent: 27, vatRatePercent: 15 },
    costLines: [],
    capex: [],
    funding: [],
    opening: emptyOpeningBalances(),
    inventoryMethod: 'FIFO',
    ...overrides,
  };
}

/* ----------------------- The engine: computeProjection ----------------------- */

/** Format a yyyy-mm-01 start date plus offset N months back to ISO date. */
function addMonthsISO(isoStart: string, monthsToAdd: number): string {
  const [y, m] = isoStart.split('-').map(Number);
  const d = new Date(y, m - 1 + monthsToAdd, 1);
  return d.toISOString().slice(0, 10);
}

function monthLabel(isoStart: string): string {
  const [y, m] = isoStart.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
}

/** Convert annual growth % to monthly compound rate. */
function annualToMonthlyRate(annualPercent: number): number {
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

/**
 * Pure projection engine. Given a scenario, produces N periods of
 * articulated financial statements.
 *
 * Tested via the Financial Projections page; no DB calls.
 */
export function computeProjection(
  scenario: FinancialProjection,
  defaultStandard: AccountingStandard = 'IFRS',
): ProjectionResult {
  const standard = scenario.accountingStandard ?? defaultStandard;
  const inventoryMethod = scenario.inventoryMethod ?? 'FIFO';
  const monthlyRevGrowth = annualToMonthlyRate(scenario.revenue.annualGrowthPercent);

  // Build depreciation schedule from opening PPE plus capex.
  // For simplicity: straight-line on a 10-year default useful life for opening
  // PPE; each capex item respects its own usefulLifeYears.
  const openingPpeNet = scenario.opening.ppe - scenario.opening.accumulatedDepreciation;
  const openingDepPerMonth = openingPpeNet > 0 ? openingPpeNet / (10 * 12) : 0;

  // Track running balances.
  let cash = scenario.opening.cash;
  let ar = scenario.opening.accountsReceivable;
  let inventory = scenario.opening.inventory;
  let otherCA = scenario.opening.otherCurrentAssets;
  let ppe = scenario.opening.ppe;
  let accDep = scenario.opening.accumulatedDepreciation;
  let otherNCA = scenario.opening.otherNonCurrentAssets;
  let ap = scenario.opening.accountsPayable;
  let stDebt = scenario.opening.shortTermDebt;
  let otherCL = scenario.opening.otherCurrentLiabilities;
  let ltDebt = scenario.opening.longTermDebt;
  let otherNCL = scenario.opening.otherNonCurrentLiabilities;
  let shareCap = scenario.opening.shareCapital;
  let retainedEarnings = scenario.opening.retainedEarnings;

  const periods: ProjectedPeriod[] = [];
  let minClosingCash = cash;
  let cashRunwayBreakMonth: string | null = null;
  let worstBalanceDelta = 0;

  for (let i = 0; i < scenario.horizonMonths; i++) {
    const periodStart = addMonthsISO(scenario.startMonth, i);
    const label = monthLabel(periodStart);

    // ----------- Revenue -----------
    const revenue = scenario.revenue.baselineMonthlyRevenue * Math.pow(1 + monthlyRevGrowth, i);

    // ----------- COGS -----------
    // If no costLine with accountCode 5xxx provided, derive from gross margin.
    const explicitCogs = scenario.costLines
      .filter((c) => c.accountCode?.startsWith('5'))
      .reduce(
        (sum, c) => sum + costLineAmount(c, revenue, scenario.revenue.baselineUnitsPerMonth ?? 0, i),
        0,
      );
    const cogs =
      explicitCogs > 0
        ? explicitCogs
        : revenue * (1 - scenario.revenue.grossMarginPercent / 100);
    const grossProfit = revenue - cogs;

    // ----------- Operating expenses -----------
    const opexLines = scenario.costLines.filter((c) => !c.accountCode?.startsWith('5'));
    const opexBreakdown = opexLines.map((c) => ({
      label: c.label,
      amount: costLineAmount(c, revenue, scenario.revenue.baselineUnitsPerMonth ?? 0, i),
      accountCode: c.accountCode,
    }));
    const operatingExpenses = opexBreakdown.reduce((sum, l) => sum + l.amount, 0);

    // ----------- Capex landing this period -----------
    const capexThisMonth = scenario.capex
      .filter((c) => c.month === i + 1)
      .reduce((sum, c) => sum + c.amount, 0);
    ppe += capexThisMonth;

    // ----------- Depreciation -----------
    const newCapexDep = scenario.capex
      .filter((c) => c.month <= i + 1)
      .reduce((sum, c) => {
        const monthsSinceLanded = i + 1 - c.month;
        if (monthsSinceLanded < 0) return sum;
        const monthlyDep = c.amount / (c.usefulLifeYears * 12);
        return sum + monthlyDep;
      }, 0);
    const depreciationAmortisation = openingDepPerMonth + newCapexDep;
    accDep += depreciationAmortisation;

    // ----------- Funding events landing this period -----------
    const fundingThisMonth = scenario.funding.filter((f) => f.month === i + 1);
    const loanDrawdown = fundingThisMonth
      .filter((f) => f.kind === 'loan')
      .reduce((sum, f) => sum + f.amount, 0);
    const equityInjection = fundingThisMonth
      .filter((f) => f.kind === 'equity' || f.kind === 'grant')
      .reduce((sum, f) => sum + f.amount, 0);
    ltDebt += loanDrawdown;
    shareCap += equityInjection;

    // ----------- Interest expense -----------
    const interestExpense = scenario.funding
      .filter((f) => f.kind === 'loan' && f.month <= i + 1 && f.interestRatePercent)
      .reduce((sum, f) => sum + (f.amount * (f.interestRatePercent ?? 0)) / 100 / 12, 0);

    // ----------- Loan repayments -----------
    const loanRepayment = scenario.funding
      .filter((f) => f.kind === 'loan' && f.month <= i + 1 && f.monthlyRepayment)
      .reduce((sum, f) => sum + (f.monthlyRepayment ?? 0), 0);
    ltDebt = Math.max(0, ltDebt - loanRepayment);

    // ----------- P&L roll-up -----------
    const ebit = grossProfit - operatingExpenses - depreciationAmortisation;
    const ebt = ebit - interestExpense;
    const tax = ebt > 0 ? ebt * (scenario.tax.corporateTaxRatePercent / 100) : 0;
    const netIncome = ebt - tax;

    // ----------- Working capital movements -----------
    const newAr = (revenue * scenario.workingCapital.dso) / 30;
    const newInventory = (cogs * scenario.workingCapital.dio) / 30;
    const newAp = (cogs * scenario.workingCapital.dpo) / 30;
    const changeInAR = newAr - ar;
    const changeInInventory = newInventory - inventory;
    const changeInAP = newAp - ap;
    ar = newAr;
    inventory = newInventory;
    ap = newAp;

    // ----------- Indirect cash flow -----------
    const cashFromOperations =
      netIncome + depreciationAmortisation - changeInAR - changeInInventory + changeInAP;
    const cashFromInvesting = -capexThisMonth;
    const cashFromFinancing = loanDrawdown + equityInjection - loanRepayment;
    const netCashChange = cashFromOperations + cashFromInvesting + cashFromFinancing;
    const openingCash = cash;
    cash += netCashChange;

    // ----------- Equity articulation -----------
    retainedEarnings += netIncome;

    // ----------- Build statements -----------
    const incomeStatement: ProjectedIncomeStatement = {
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      depreciationAmortisation,
      ebit,
      interestExpense,
      ebt,
      tax,
      netIncome,
      costBreakdown: [
        { label: 'COGS', amount: cogs, accountCode: '5000' },
        ...opexBreakdown,
        { label: 'Depreciation & amortisation', amount: depreciationAmortisation, accountCode: '6500' },
        { label: 'Interest expense', amount: interestExpense, accountCode: '6600' },
      ],
    };

    const totalCurrentAssets = cash + ar + inventory + otherCA;
    const netPpe = ppe - accDep;
    const totalNonCurrentAssets = netPpe + otherNCA;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
    const totalCurrentLiabilities = ap + stDebt + otherCL;
    const totalNonCurrentLiabilities = ltDebt + otherNCL;
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
    const totalEquity = shareCap + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const balanceCheck = totalAssets - totalLiabilitiesAndEquity;

    if (Math.abs(balanceCheck) > Math.abs(worstBalanceDelta)) {
      worstBalanceDelta = balanceCheck;
    }
    if (cash < minClosingCash) minClosingCash = cash;
    if (cash < 0 && !cashRunwayBreakMonth) cashRunwayBreakMonth = periodStart;

    const balanceSheet: ProjectedBalanceSheet = {
      cash,
      accountsReceivable: ar,
      inventory,
      otherCurrentAssets: otherCA,
      totalCurrentAssets,
      ppe,
      accumulatedDepreciation: accDep,
      netPpe,
      otherNonCurrentAssets: otherNCA,
      totalNonCurrentAssets,
      totalAssets,
      accountsPayable: ap,
      shortTermDebt: stDebt,
      otherCurrentLiabilities: otherCL,
      totalCurrentLiabilities,
      longTermDebt: ltDebt,
      otherNonCurrentLiabilities: otherNCL,
      totalNonCurrentLiabilities,
      totalLiabilities,
      shareCapital: shareCap,
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity,
      balanceCheck,
    };

    const cashFlow: ProjectedCashFlow = {
      netIncome,
      depreciationAmortisation,
      changeInAR,
      changeInInventory,
      changeInAP,
      changeInOtherWC: 0,
      cashFromOperations,
      capex: -capexThisMonth,
      cashFromInvesting,
      loanDrawdown,
      equityInjection,
      loanRepayment,
      cashFromFinancing,
      netCashChange,
      openingCash,
      closingCash: cash,
    };

    periods.push({ periodStart, label, incomeStatement, balanceSheet, cashFlow });
  }

  // Roll up totals.
  const totals = periods.reduce(
    (acc, p) => ({
      revenue: acc.revenue + p.incomeStatement.revenue,
      cogs: acc.cogs + p.incomeStatement.cogs,
      grossProfit: acc.grossProfit + p.incomeStatement.grossProfit,
      operatingExpenses: acc.operatingExpenses + p.incomeStatement.operatingExpenses,
      netIncome: acc.netIncome + p.incomeStatement.netIncome,
    }),
    { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, netIncome: 0 },
  );

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    accountingStandard: standard,
    inventoryMethod,
    periods,
    totals: {
      ...totals,
      closingCash: cash,
      minClosingCash,
      cashRunwayBreakMonth,
    },
    worstBalanceDelta,
  };
}

/** Compute one cost line's amount for a given period. */
function costLineAmount(
  line: ProjectionCostLine,
  revenueThisMonth: number,
  unitsThisMonth: number,
  monthIndex: number,
): number {
  if (line.startMonth && monthIndex + 1 < line.startMonth) return 0;
  if (line.driver === 'percentRevenue') return revenueThisMonth * (line.amount / 100);
  if (line.driver === 'perUnit') return unitsThisMonth * line.amount;
  // fixedMonthly with inflation
  const inflation = line.inflationPercent ? Math.pow(1 + line.inflationPercent / 100, monthIndex / 12) : 1;
  return line.amount * inflation;
}

/** Group monthly periods into quarterly or annual rollups for the UI. */
export function rollUpPeriods(periods: ProjectedPeriod[], kind: ProjectionPeriodKind): ProjectedPeriod[] {
  if (kind === 'month') return periods;
  const chunkSize = kind === 'quarter' ? 3 : 12;
  const chunks: ProjectedPeriod[] = [];
  for (let i = 0; i < periods.length; i += chunkSize) {
    const slice = periods.slice(i, i + chunkSize);
    if (slice.length === 0) continue;
    const last = slice[slice.length - 1];
    const first = slice[0];
    // P&L sums; Balance Sheet is the END of the period; Cash flow sums.
    const sumPL = slice.reduce(
      (acc, p) => ({
        revenue: acc.revenue + p.incomeStatement.revenue,
        cogs: acc.cogs + p.incomeStatement.cogs,
        grossProfit: acc.grossProfit + p.incomeStatement.grossProfit,
        operatingExpenses: acc.operatingExpenses + p.incomeStatement.operatingExpenses,
        depreciationAmortisation:
          acc.depreciationAmortisation + p.incomeStatement.depreciationAmortisation,
        ebit: acc.ebit + p.incomeStatement.ebit,
        interestExpense: acc.interestExpense + p.incomeStatement.interestExpense,
        ebt: acc.ebt + p.incomeStatement.ebt,
        tax: acc.tax + p.incomeStatement.tax,
        netIncome: acc.netIncome + p.incomeStatement.netIncome,
      }),
      {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        depreciationAmortisation: 0,
        ebit: 0,
        interestExpense: 0,
        ebt: 0,
        tax: 0,
        netIncome: 0,
      },
    );
    const sumCF = slice.reduce(
      (acc, p) => ({
        netIncome: acc.netIncome + p.cashFlow.netIncome,
        depreciationAmortisation: acc.depreciationAmortisation + p.cashFlow.depreciationAmortisation,
        changeInAR: acc.changeInAR + p.cashFlow.changeInAR,
        changeInInventory: acc.changeInInventory + p.cashFlow.changeInInventory,
        changeInAP: acc.changeInAP + p.cashFlow.changeInAP,
        changeInOtherWC: acc.changeInOtherWC + p.cashFlow.changeInOtherWC,
        cashFromOperations: acc.cashFromOperations + p.cashFlow.cashFromOperations,
        capex: acc.capex + p.cashFlow.capex,
        cashFromInvesting: acc.cashFromInvesting + p.cashFlow.cashFromInvesting,
        loanDrawdown: acc.loanDrawdown + p.cashFlow.loanDrawdown,
        equityInjection: acc.equityInjection + p.cashFlow.equityInjection,
        loanRepayment: acc.loanRepayment + p.cashFlow.loanRepayment,
        cashFromFinancing: acc.cashFromFinancing + p.cashFlow.cashFromFinancing,
        netCashChange: acc.netCashChange + p.cashFlow.netCashChange,
      }),
      {
        netIncome: 0,
        depreciationAmortisation: 0,
        changeInAR: 0,
        changeInInventory: 0,
        changeInAP: 0,
        changeInOtherWC: 0,
        cashFromOperations: 0,
        capex: 0,
        cashFromInvesting: 0,
        loanDrawdown: 0,
        equityInjection: 0,
        loanRepayment: 0,
        cashFromFinancing: 0,
        netCashChange: 0,
      },
    );
    chunks.push({
      periodStart: first.periodStart,
      label:
        kind === 'quarter'
          ? `${first.label.split(' ')[0]}–${last.label}`
          : last.label.split(' ')[1] ?? last.label,
      incomeStatement: {
        ...sumPL,
        costBreakdown: last.incomeStatement.costBreakdown,
      },
      // Balance sheet = end of last period in chunk.
      balanceSheet: last.balanceSheet,
      cashFlow: {
        ...sumCF,
        openingCash: first.cashFlow.openingCash,
        closingCash: last.cashFlow.closingCash,
      },
    });
  }
  return chunks;
}
