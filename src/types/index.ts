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
  | 'fixedAssets'
  | 'currencies'
  | 'maintenance'
  | 'production'
  | 'waste'
  | 'paper'
  | 'dispatch'
  | 'reports'
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
  | 'stockMovements';
export type UserRole = 'admin' | 'ops' | 'production' | 'sales' | 'artwork' | 'accounts' | 'driver';
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
  invoices: 'Invoices',
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
  fixedAssets: 'Fixed Assets',
  currencies: 'Currencies & FX',
  maintenance: 'Maintenance',
  production: 'Production Logs',
  waste: 'Waste Log',
  paper: 'Paper Log',
  dispatch: 'Dispatch',
  reports: 'Reports',
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
};

export const ROLE_DEFAULT_VIEWS: Record<UserRole, View[]> = {
  admin: [
    'dashboard',
    'salesDesk',
    'calculator',
    'workTicket',
    'costMasters',
    'costInputs',
    'leads',
    'permissions',
    'settings',
    'osConnector',
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
    'visitorLog',
    'visitorKiosk',
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
  const valid = source.filter((permission): permission is View => permission in VIEW_LABELS);
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
export type QuantityUnit = 'kg' | 'sheets' | 'rolls' | 'units';
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
export type LeadStatus = 'New' | 'Qualified' | 'Awaiting Info' | 'Quoted' | 'Won' | 'Lost';
export type LeadSource = 'WhatsApp' | 'Phone' | 'Email' | 'Referral' | 'Walk-in' | 'Existing Customer' | 'Website' | 'Social Media' | 'Other';

export const LEAD_SOURCES: LeadSource[] = [
  'WhatsApp', 'Phone', 'Email', 'Referral', 'Walk-in', 'Existing Customer', 'Website', 'Social Media', 'Other',
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
  assignedTo: string;
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

export interface PaperRate {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  paperType: string;
  gsm: string;
  pricePerTon: number;
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
  accountType: 'internal' | 'client';
  publicDisplayName: string;
  publicDisplayRole: string;
  role: UserRole;
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
  | 'Flexo Printer'
  | 'Bag Machine'
  | 'Slitting Machine'
  | 'Rope Machine'
  | 'Packing Tables'
  | 'Raw Material Storage'
  | 'Finished Goods Storage'
  | 'Dispatch Area'
  | 'Other';

export const FACTORY_AREAS: FactoryArea[] = [
  'Flexo Printer',
  'Bag Machine',
  'Slitting Machine',
  'Rope Machine',
  'Packing Tables',
  'Raw Material Storage',
  'Finished Goods Storage',
  'Dispatch Area',
  'Other',
];

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
}

export interface PpeIssueFormState {
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
  /** PPE issued for the visit (free text list). */
  ppeIssued: string;
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
  ppeIssued: string;
  enteredFoodContactArea: boolean;
  notes: string;
  phoneNumber: string;
  vehicleRegistration: string;
  signatureDataUrl: string;
}

export interface VisitorLogFilters {
  search: string;
  visitorType: string;
  dateWindow: 'today' | '7d' | '30d' | 'all';
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
   * Public URL of the logo file. Empty string falls back to the stylised
   * "JomoPak / PAPER BAGS" text mark used historically.
   */
  logoUrl: string;
}

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
  /** Last-write metadata, surfaced in the UI so admins can see who changed what. */
  updatedAt: string;
  updatedBy: string;
}

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
}

/* ─────────────────────────────────────────────────────────────────────────
 * Phase 22 — Document Vault.
 *
 * Stores compliance + commercial documents against a supplier or client.
 * The file lives in Supabase Storage; the row holds metadata + an optional
 * expiry date so the notification bell can warn before a cert lapses.
 * ────────────────────────────────────────────────────────────────────────*/
export type DocumentOwnerType = 'supplier' | 'client' | 'internal';

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
  'Other',
];

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
  paperType: string;
  gsm: string;
  pricePerTon: string;
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
export type MaterialKind =
  | 'Paper'
  | 'Ink'
  | 'Plate'
  | 'Adhesive'
  | 'Foil'
  | 'Chemical'
  | 'Other';

export const MATERIAL_KINDS: MaterialKind[] = [
  'Paper', 'Ink', 'Plate', 'Adhesive', 'Foil', 'Chemical', 'Other',
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

