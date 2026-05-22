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
  | 'toolBladeControl'
  | 'visitorLog'
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
  | 'production'
  | 'waste'
  | 'paper'
  | 'dispatch'
  | 'reports';
export type UserRole = 'admin' | 'ops' | 'production' | 'sales' | 'artwork' | 'accounts';
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
  finishedStock: 'Finished Stock',
  spares: 'Spares & Consumables',
  materials: 'Materials Receiving',
  chemicalRegister: 'Chemical Register (MSDS)',
  foodSafeMaterials: 'Food-Safe Materials',
  cleaningLogs: 'Cleaning & Sanitation Logs',
  foodSafetyControlCentre: 'Food Safety Control Centre',
  haccpRegister: 'HACCP Hazard Register',
  nonConformance: 'Non-Conformance Register',
  sopRegister: 'SOP Document Register',
  staffTraining: 'Staff Training & Hygiene',
  ppeControl: 'PPE Issue & Control',
  pestControl: 'Pest Control Register',
  foreignObjectControl: 'Foreign Object Register',
  toolBladeControl: 'Tools & Blade Control',
  visitorLog: 'Visitor & Contractor Log',
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
  production: 'Production Logs',
  waste: 'Waste Log',
  paper: 'Paper Log',
  dispatch: 'Dispatch',
  reports: 'Reports',
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
    'suppliers',
    'quotes',
    'artwork',
    'customerStock',
    'deliveryNotes',
    'invoices',
    'productionSpecs',
    'machines',
    'jobs',
    'products',
    'clients',
    'pricing',
    'finishedStock',
    'stockTake',
    'spares',
    'materials',
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
    'leadAnalytics',
    'reorderReminders',
    'driverPod',
    'invoiceInbox',
    'production',
    'waste',
    'paper',
    'dispatch',
    'reports',
  ],
  ops: [
    'dashboard',
    'leads',
    'calculator',
    'workTicket',
    'suppliers',
    'quotes',
    'artwork',
    'customerStock',
    'deliveryNotes',
    'invoices',
    'productionSpecs',
    'machines',
    'jobs',
    'products',
    'finishedStock',
    'stockTake',
    'spares',
    'materials',
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
    'invoiceInbox',
    'production',
    'waste',
    'paper',
    'dispatch',
    'reports',
  ],
  production: [
    'dashboard',
    'jobs',
    'productionSchedule',
    'materialRequirements',
    'finishedStock',
    'stockTake',
    'driverPod',
    'materials',
    'chemicalRegister',
    'foodSafeMaterials',
    'cleaningLogs',
    'production',
    'waste',
    'paper',
    'dispatch',
  ],
  sales: [
    'dashboard',
    'salesDesk',
    'salesPipeline',
    'leadAnalytics',
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
  accounts: [
    'dashboard',
    'invoices',
    'invoiceInbox',
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
  const required = new Set<View>(['dashboard']);
  if (role === 'admin') {
    required.add('permissions');
    required.add('settings');
  }
  required.forEach((permission) => {
    if (!valid.includes(permission)) {
      valid.push(permission);
    }
  });
  return Array.from(new Set(valid));
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
}

export interface Client {
  id: string;
  name: string;
  /** Optimistic concurrency token (phase 14). See JobCard.version. */
  version?: number;
  /** Server-side update timestamp. */
  rowUpdatedAt?: string;
  companyName: string;
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

export interface Product {
  id: string;
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
}

export interface JobCard {
  id: string;
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
  /** Phase 2 food-safety hold/release state. Defaults to 'In Production'. */
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
export type StockItemCategory =
  | 'Machine Spare'
  | 'Consumable'
  | 'Tool'
  | 'PPE'
  | 'Cleaning'
  | 'Office'
  | 'Other';

export const STOCK_ITEM_CATEGORIES: StockItemCategory[] = [
  'Machine Spare',
  'Consumable',
  'Tool',
  'PPE',
  'Cleaning',
  'Office',
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
  /** Soft delete / archive flag. Disabled chemicals don't show on default list. */
  archived: boolean;
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
  archived: boolean;
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
  | 'In Production'
  | 'Awaiting QC'
  | 'On Hold'
  | 'Released'
  | 'Rejected'
  | 'Reworked'
  | 'Dispatched'
  | 'Recalled';

export const FOOD_SAFETY_HOLD_STATUSES: FoodSafetyHoldStatus[] = [
  'In Production',
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

export interface PpeIssueRecord {
  id: string;
  issueNumber: string;
  createdAt: string;
  staffName: string;
  staffRole: string;
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
  /** Signature / collection capture for proof-of-delivery. */
  receiptMode: DeliveryReceiptMode;
  signedByName: string;
  signedByDate: string;
  signedByContactInfo: string;
  collectedByName: string;
  collectedByDate: string;
  collectedByIdNumber: string;
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
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  /** Optimistic concurrency token (phase 14). See JobCard.version. */
  version?: number;
  /** Server-side update timestamp. */
  rowUpdatedAt?: string;
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

export interface AppSettings {
  id: 'default';
  company: AppSettingsCompany;
  templates: AppSettingsTemplates;
  stockHolding: AppSettingsStockHolding;
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
  },
  stockHolding: {
    defaultMaxDays: 90,
    defaultReviewCadenceDays: 30,
    defaultAgreementTermsText:
      'Stock will be held free of charge for the agreed storage period from the invoice date. Releases are subject to written instruction from an authorised contact at the client.',
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
  };
  stockHolding: {
    defaultMaxDays: string;
    defaultReviewCadenceDays: string;
    defaultAgreementTermsText: string;
  };
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
  proofOfDeliveries: ProofOfDelivery[];
  invoiceInboxItems: InvoiceInboxItem[];
  stockChangeLogs: StockChangeLog[];
  materialOrderRequests: MaterialOrderRequest[];
  inventoryMovements: InventoryMovement[];
  biEvents: BiEvent[];
  appSettings: AppSettings;
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
  parentInvoiceId: string;
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
  companyName: string;
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
  internalBatchNumber: string;
  foodSafetyNotes: string;
  assignedMachineId: string;
  changeoverChecklist: ChangeoverChecklistItem[];
  qcPlan: QcStageRecord[];
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
}

export interface SparePartFormState {
  partName: string;
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
  quoteId: string;
  productionSpecId: string;
  customerReference: string;
  termsType: InvoiceTermsType;
  termsText: string;
  notes: string;
  footerNotes: string;
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
  | 'creditBlock';

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

