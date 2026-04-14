export type View =
  | 'dashboard'
  | 'salesDesk'
  | 'calculator'
  | 'costInputs'
  | 'leads'
  | 'permissions'
  | 'suppliers'
  | 'quotes'
  | 'artwork'
  | 'customerStock'
  | 'machines'
  | 'jobs'
  | 'products'
  | 'clients'
  | 'pricing'
  | 'finishedStock'
  | 'spares'
  | 'materials'
  | 'production'
  | 'waste'
  | 'paper'
  | 'dispatch'
  | 'reports';
export type UserRole = 'admin' | 'ops' | 'production' | 'sales' | 'artwork';
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
  | 'topPaper';

export const VIEW_LABELS: Record<View, string> = {
  dashboard: 'Dashboard',
  salesDesk: 'Sales Desk',
  calculator: 'Calculator',
  costInputs: 'Cost Inputs',
  leads: 'Leads',
  permissions: 'Permissions',
  suppliers: 'Suppliers',
  quotes: 'Quotes & Estimates',
  artwork: 'Artwork',
  customerStock: 'Customer Stock',
  machines: 'Machines',
  jobs: 'Job Cards',
  products: 'Products',
  clients: 'Clients',
  pricing: 'Pricing Tiers',
  finishedStock: 'Finished Stock',
  spares: 'Parts & Spares',
  materials: 'Materials Receiving',
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
    'costInputs',
    'leads',
    'permissions',
    'suppliers',
    'quotes',
    'artwork',
    'customerStock',
    'machines',
    'jobs',
    'products',
    'clients',
    'pricing',
    'finishedStock',
    'spares',
    'materials',
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
    'suppliers',
    'quotes',
    'artwork',
    'customerStock',
    'machines',
    'jobs',
    'products',
    'finishedStock',
    'spares',
    'materials',
    'production',
    'waste',
    'paper',
    'dispatch',
    'reports',
  ],
  production: [
    'dashboard',
    'jobs',
    'finishedStock',
    'materials',
    'production',
    'waste',
    'paper',
    'dispatch',
  ],
  sales: [
    'dashboard',
    'salesDesk',
    'leads',
    'calculator',
    'quotes',
    'artwork',
    'jobs',
    'products',
    'reports',
  ],
  artwork: [
    'dashboard',
    'artwork',
    'quotes',
    'jobs',
    'products',
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
};

export const ROLE_DEFAULT_DASHBOARD_WIDGETS: Record<UserRole, DashboardWidget[]> = {
  admin: Object.keys(DASHBOARD_WIDGET_LABELS) as DashboardWidget[],
  ops: [
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
export type PrintMethod = 'Plain' | 'Auto' | 'Screen Print' | 'Flexo';
export type SupplierType = 'Paper' | 'Packaging' | 'Spares' | 'General';
export type QuoteStatus = 'Draft' | 'Quoted' | 'Approved' | 'Converted to Job' | 'Lost';
export type LeadStatus = 'New' | 'Qualified' | 'Awaiting Info' | 'Quoted' | 'Won' | 'Lost';
export type LeadSource = 'WhatsApp' | 'Phone' | 'Email' | 'Referral' | 'Walk-in' | 'Existing Customer' | 'Website' | 'Other';
export type MachineStatus = 'Active' | 'Maintenance' | 'Offline';
export type ArtworkStage = 'Awaiting Artwork' | 'Artwork Received' | 'Proof Sent' | 'Approved' | 'Changes Requested';
export type CertificationType = 'FSC' | 'ISO' | 'Food Safety' | 'Other';
export type CertificationStatus = 'Active' | 'Expiring Soon' | 'Expired';
export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP';

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
}

export interface QuoteEstimate {
  id: string;
  quoteNumber: string;
  quickbooksEstimateNumber: string;
  createdAt: string;
  quoteDate: string;
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

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: View[];
  dashboardWidgets: DashboardWidget[];
}

export interface Client {
  id: string;
  name: string;
  code: string;
  pricingTierId: string;
  pricingTierName: string;
  clientType: PricingTierType;
  brandingDefault: boolean;
  defaultMarginPercent: number;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: string;
  accountHold: boolean;
  contactName: string;
  contactEmail: string;
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
  createdAt: string;
  jobDate: string;
  dueDate: string;
  clientId: string;
  pricingTierId: string;
  productId: string;
  customerName: string;
  customerReference: string;
  productName: string;
  description: string;
  sizeSpec: string;
  paperType: string;
  gsm: string;
  quantityPlanned: number;
  quantityCompleted: number;
  status: JobStatus;
  artworkReceived: boolean;
  proofSent: boolean;
  approvalStatus: ApprovalStatus;
  approvalDate: string;
  changesRequested: string;
  artworkNotes: string;
  reserveFromStock: boolean;
  reservedFinishedGoodsStockId: string;
  reservedFinishedGoodsStockNumber: string;
  reservedQuantity: number;
  stockReservationStatus: StockReservationStatus;
  dispatchStatus: string;
  qualityNotes: string;
  notes: string;
  fscRelated: boolean;
}

export interface FinishedGoodsStock {
  id: string;
  stockNumber: string;
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
}

export interface SparePart {
  id: string;
  partCode: string;
  createdAt: string;
  partName: string;
  category: string;
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

export interface MaterialReceipt {
  id: string;
  receiptNumber: string;
  createdAt: string;
  receivedDate: string;
  supplierId: string;
  supplierName: string;
  supplierBatchNumber: string;
  internalRollCode: string;
  paperType: string;
  gsm: string;
  width: string;
  quantityReceived: number;
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

export interface AppData {
  suppliers: Supplier[];
  machines: Machine[];
  leads: Lead[];
  quoteEstimates: QuoteEstimate[];
  artworkRecords: ArtworkRecord[];
  customerStockReleases: CustomerStockRelease[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  pricingTiers: PricingTier[];
  clients: Client[];
  products: Product[];
  jobs: JobCard[];
  finishedGoodsStock: FinishedGoodsStock[];
  spareParts: SparePart[];
  materialReceipts: MaterialReceipt[];
  productionLogs: ProductionLogEntry[];
  wasteEntries: WasteEntry[];
  paperLogs: PaperLog[];
  dispatchRecords: DispatchRecord[];
  stockChangeLogs: StockChangeLog[];
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
}

export interface QuoteEstimateFormState {
  quoteDate: string;
  quickbooksEstimateNumber: string;
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

export interface ClientFormState {
  name: string;
  code: string;
  pricingTierId: string;
  brandingDefault: boolean;
  defaultMarginPercent: string;
  creditLimit: string;
  currentBalance: string;
  paymentTerms: string;
  accountHold: boolean;
  contactName: string;
  contactEmail: string;
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
  clientId: string;
  pricingTierId: string;
  productId: string;
  customerName: string;
  customerReference: string;
  productName: string;
  description: string;
  sizeSpec: string;
  paperType: string;
  gsm: string;
  quantityPlanned: string;
  quantityCompleted: string;
  status: JobStatus;
  artworkReceived: boolean;
  proofSent: boolean;
  approvalStatus: ApprovalStatus;
  approvalDate: string;
  changesRequested: string;
  artworkNotes: string;
  reserveFromStock: boolean;
  reservedFinishedGoodsStockId: string;
  reservedQuantity: string;
  stockReservationStatus: StockReservationStatus;
  dispatchStatus: string;
  qualityNotes: string;
  notes: string;
  fscRelated: boolean;
}

export interface FinishedGoodsStockFormState {
  storedDate: string;
  productId: string;
  clientId: string;
  jobId: string;
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
  category: string;
  machineId: string;
  machineReference: string;
  supplierId: string;
  supplierName: string;
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

export interface JobFilters { search: string; month: string; status: string; customer: string; fsc: string; }
export interface PaperRateFilters { search: string; active: string; }
export interface SupplierFilters { search: string; supplierType: string; active: string; }
export interface MachineFilters { search: string; status: string; processType: string; active: string; }
export interface LeadFilters { search: string; month: string; status: string; source: string; owner: string; }
export interface QuoteEstimateFilters { search: string; month: string; status: string; client: string; }
export interface ArtworkFilters { search: string; stage: string; client: string; }
export interface CustomerStockReleaseFilters { search: string; month: string; client: string; }
export interface CostProfileFilters { search: string; active: string; }
export interface FinishedGoodsStockFilters { search: string; client: string; status: string; product: string; }
export interface SparePartFilters { search: string; category: string; lowStock: string; supplier: string; }
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
