import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { UndoToast, UndoToastState } from './components/UndoToast';
import { HistoryDrawer, HistoryDrawerTarget } from './components/HistoryDrawer';
import { CommandPalette } from './components/CommandPalette';
import { ArtworkPage } from './pages/Artwork/ArtworkPage';
import { CalculatorPage } from './pages/Calculator/CalculatorPage';
import { CostInputsPage } from './pages/CostInputs/CostInputsPage';
import { CostMastersPage } from './pages/CostMasters/CostMastersPage';
import { ChemicalRegisterPage } from './pages/ChemicalRegister/ChemicalRegisterPage';
import { FoodSafeMaterialsPage } from './pages/FoodSafeMaterials/FoodSafeMaterialsPage';
import { CleaningLogsPage } from './pages/CleaningLogs/CleaningLogsPage';
import { AgedDebtorsPage } from './pages/Reports/AgedDebtorsPage';
import { ProfitabilityPage } from './pages/Reports/ProfitabilityPage';
import { SalesPipelinePage } from './pages/SalesPipeline/SalesPipelinePage';
import { ProductionSchedulePage } from './pages/ProductionSchedule/ProductionSchedulePage';
import { MaterialRequirementsPage } from './pages/Reports/MaterialRequirementsPage';
import { CashFlowPage } from './pages/Reports/CashFlowPage';
import { MorningDigestPage } from './pages/MorningDigest/MorningDigestPage';
import { LeadAnalyticsPage } from './pages/LeadAnalytics/LeadAnalyticsPage';
import { ReorderRemindersPage } from './pages/ReorderReminders/ReorderRemindersPage';
import { NotificationBell } from './components/NotificationBell';
import { useNotifications } from './hooks/useNotifications';
import { DriverPodPage } from './pages/DriverPod/DriverPodPage';
import { InvoiceInboxPage } from './pages/InvoiceInbox/InvoiceInboxPage';
import { runOcrOnInboxItem } from './utils/ocrRunner';
import { attachAutoFlush, flushPodQueue } from './utils/podSync';
import { uploadInvoiceInboxFile } from './utils/invoiceInboxStorage';
import { getRate, RealisedFxResult } from './utils/currency';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { computeQuote, emptyCalculatorState } from './utils/calculatorEngine';
import { FoodSafeCertificatePrint } from './pages/Phase5/FoodSafeCertificatePrint';
import { QuotePrint } from './pages/Quotes/QuotePrint';
import { JobCardPrint } from './pages/JobCards/JobCardPrint';
import { SopRegisterPage } from './pages/Phase5/SopRegisterPage';
import { TraceabilityPage } from './pages/Traceability/TraceabilityPage';
import { ComplaintsPage } from './pages/Complaints/ComplaintsPage';
import { FoodSafetyControlCentrePage } from './pages/FoodSafetyControlCentre/FoodSafetyControlCentrePage';
import { HaccpRegisterPage } from './pages/HaccpRegister/HaccpRegisterPage';
import { NonConformancePage } from './pages/NonConformance/NonConformancePage';
import { StaffTrainingPage } from './pages/Phase4/StaffTrainingPage';
import { PpeIssuePage } from './pages/Phase4/PpeIssuePage';
import { PestControlPage } from './pages/Phase4/PestControlPage';
import { ForeignObjectPage } from './pages/Phase4/ForeignObjectPage';
import { ToolBladePage } from './pages/Phase4/ToolBladePage';
import { VisitorLogPage } from './pages/Phase4/VisitorLogPage';
import { VisitorKioskPage } from './pages/VisitorKiosk/VisitorKioskPage';
import { NoticesPage } from './pages/Notices/NoticesPage';
import { StaffPortalPage } from './pages/StaffPortal/StaffPortalPage';
import { ContaminationControlPage } from './pages/ContaminationControl/ContaminationControlPage';
import { WorkTicketPage, emptyWorkTicketForm } from './pages/WorkTicket/WorkTicketPage';
import { WorkTicketPrint } from './pages/WorkTicket/WorkTicketPrint';
import { DeliveryNotePrint } from './pages/DeliveryNotes/DeliveryNotePrint';
import { ClientsPage } from './pages/Clients/ClientsPage';
import { CustomerStockPage } from './pages/CustomerStock/CustomerStockPage';
import { DeliveryNotesPage } from './pages/DeliveryNotes/DeliveryNotesPage';
import { InvoicesPage } from './pages/Invoices/InvoicesPage';
import { ProductionSpecsPage } from './pages/ProductionSpecs/ProductionSpecsPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { useAuth } from './hooks/useAuth';
import { useProfiles } from './hooks/useProfiles';
import { useProductionData } from './hooks/useProductionData';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { DispatchPage } from './pages/Dispatch/DispatchPage';
import { FinishedGoodsStockPage } from './pages/FinishedGoodsStock/FinishedGoodsStockPage';
import { JobCardsPage } from './pages/JobCards/JobCardsPage';
import { LeadsPage } from './pages/Leads/LeadsPage';
import { MaterialsReceivingPage } from './pages/MaterialsReceiving/MaterialsReceivingPage';
import { MachinesPage } from './pages/Machines/MachinesPage';
import { PaperLogPage } from './pages/PaperLog/PaperLogPage';
import { PermissionsPage } from './pages/Permissions/PermissionsPage';
import { PricingTiersPage } from './pages/PricingTiers/PricingTiersPage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { PriceListPage, ClientPriceDraft } from './pages/PriceList/PriceListPage';
import { formToPricingSpec, buildPriceVersionDraft } from './utils/productPricing';
import { ProductionLogsPage } from './pages/ProductionLogs/ProductionLogsPage';
import { QuotesPage } from './pages/Quotes/QuotesPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SalesDeskPage } from './pages/Sales/SalesDeskPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SparePartsPage } from './pages/SpareParts/SparePartsPage';
import { StockTakePage } from './pages/StockTake/StockTakePage';
import { DocumentVaultPage } from './pages/DocumentVault/DocumentVaultPage';
import { uploadDocumentFile } from './utils/documentStorage';
import { DocumentRecord, Shipment, MaterialReceipt as MaterialReceiptType, LedgerAccount, SupplierBill, SarsFiling, AppSettingsSarsConfig } from './types';
import { ShipmentsPage } from './pages/Shipments/ShipmentsPage';
import { ChartOfAccountsPage } from './pages/Accounting/ChartOfAccountsPage';
import { AccountsPayablePage } from './pages/Accounting/AccountsPayablePage';
import { SarsCentrePage } from './pages/Sars/SarsCentrePage';
import { FinanceSummaryPage } from './pages/Sars/FinanceSummaryPage';
import { CustomerStatementsPage } from './pages/Sars/CustomerStatementsPage';
import { EmployeesPage } from './pages/Payroll/EmployeesPage';
import { PayrollPage } from './pages/Payroll/PayrollPage';
import { BankReconciliationPage } from './pages/Sars/BankReconciliationPage';
import { GeneralLedgerPage } from './pages/Sars/GeneralLedgerPage';
import { FinancialStatementsPage } from './pages/Sars/FinancialStatementsPage';
import { FixedAssetsPage } from './pages/Sars/FixedAssetsPage';
import { MaintenancePage } from './pages/Maintenance/MaintenancePage';
import { CurrenciesPage } from './pages/Sars/CurrenciesPage';
import { OsConnectorPage } from './pages/OsConnector/OsConnectorPage';
import { publishConnectorFeed } from './utils/supabaseData';
import { Employee, PayrollRun, BankTransaction, JournalEntry, FixedAsset, MaintenanceWorkOrder, AppSettingsCurrencyConfig, AppSettingsConnectorConfig, AppData } from './types';
import { SuppliersPage } from './pages/Suppliers/SuppliersPage';
import { WasteLogPage } from './pages/WasteLog/WasteLogPage';
import {
  AppSettings,
  AppSettingsFormState,
  ArtworkFilters,
  ArtworkFormState,
  ArtworkRecord,
  Client,
  ClientFilters,
  ClientFormState,
  CalculatorQuoteFormState,
  CostProfile,
  CostProfileFilters,
  CostProfileFormState,
  CustomerStockRelease,
  CustomerStockReleaseFilters,
  CustomerStockReleaseFormState,
  DeliveryNote,
  DeliveryNoteFilters,
  DeliveryNoteFormState,
  Invoice,
  InvoiceFilters,
  InvoiceFormState,
  ProductionSpec,
  ProductionSpecFilters,
  ProductionSpecFormState,
  DispatchFilters,
  DispatchFormState,
  DispatchRecord,
  FinishedGoodsStock,
  FinishedGoodsStockFilters,
  FinishedGoodsStockFormState,
  InventoryItemType,
  InventoryMovement,
  InventoryMovementType,
  InventoryScanFormState,
  JobCard,
  JobFilters,
  JobFormState,
  Lead,
  LeadActivity,
  LeadFilters,
  LeadFormState,
  Machine,
  MachineFilters,
  MachineFormState,
  MaterialFilters,
  MaterialOrderRequest,
  MaterialReceipt,
  ChemicalRegisterEntry,
  ChemicalRegisterFilters,
  ChemicalRegisterFormState,
  FoodSafeMaterial,
  FoodSafeMaterialFilters,
  FoodSafeMaterialFormState,
  FoodSafetyApprovalStatus,
  FoodContactLevel,
  FoodSafetyHoldStatus,
  validateJobFoodSafety,
  validateJobReleaseGate,
  isFoodPackagingLevel,
  canUserReleaseFoodSafetyBatch,
  buildBlankChangeoverChecklist,
  buildBlankQcPlan,
  CleaningLogEntry,
  CleaningLogFilters,
  CleaningLogFormState,
  FactoryArea,
  CustomerComplaint,
  CustomerComplaintFilters,
  CustomerComplaintFormState,
  ComplaintType,
  ComplaintStatus,
  ComplaintOutcome,
  TraceabilitySearchType,
  HaccpHazard,
  HaccpHazardFilters,
  HaccpHazardFormState,
  computeHaccpRiskLevel,
  NonConformance,
  NonConformanceFilters,
  NonConformanceFormState,
  NcrSeverity,
  NcrStatus,
  NcrIssueType,
  StaffTrainingRecord,
  StaffTrainingFilters,
  StaffTrainingFormState,
  Notice,
  NoticeFormState,
  PpeIssueRecord,
  PpeIssueFilters,
  PpeIssueFormState,
  PestControlRecord,
  PestControlFilters,
  PestControlFormState,
  ForeignObjectRecord,
  ForeignObjectFilters,
  ForeignObjectFormState,
  ToolBladeRecord,
  ToolBladeFilters,
  ToolBladeFormState,
  VisitorLogEntry,
  VisitorLogFilters,
  VisitorLogFormState,
  SopDocument,
  SopDocumentFilters,
  SopDocumentFormState,
  MaterialReceiptFormState,
  PaperFilters,
  PaperFormState,
  PaperLog,
  PaperRate,
  PaperRateFilters,
  PaperRateFormState,
  InkRate,
  InkRateFilters,
  InkRateFormState,
  FinishingOperation,
  FinishingOperationFilters,
  FinishingOperationFormState,
  PressRate,
  PressRateFilters,
  PressRateFormState,
  PlateCost,
  PlateCostFilters,
  PlateCostFormState,
  WorkTicket,
  WorkTicketFilters,
  WorkTicketFormState,
  WorkTicketStatus,
  PricingTier,
  PricingTierFilters,
  PricingTierFormState,
  Product,
  ProductPriceVersion,
  ClientProductPrice,
  ProductFilters,
  ProductFormState,
  ProductionFilters,
  ProductionLogEntry,
  ProductionLogFormState,
  QuoteEstimate,
  QuoteEstimateFilters,
  QuoteEstimateFormState,
  ReportFilters,
  SparePart,
  SparePartFilters,
  SparePartFormState,
  StockCount,
  StockCountFormState,
  StockCountLine,
  StockIssue,
  StockIssueFilters,
  StockIssueFormState,
  StockItemCategory,
  STOCK_ITEM_CATEGORIES,
  Supplier,
  SupplierFilters,
  SupplierFormState,
  VIEW_LABELS,
  View,
  WasteEntry,
  WasteFilters,
  WasteFormState,
  ProofOfDelivery,
  InvoiceInboxItem,
  InvoiceExtraction,
} from './types';
import {
  PRODUCTION_LOG_TYPES,
  calculateAverageWastePerCompletedJob,
  calculateAverageWastePerJob,
  downloadCsv,
  formatFlag,
  getCurrentMonthValue,
  getMonthKey,
  getMonthOptions,
  getPaperUsedForJob,
  getProductionLogsForJob,
  getToday,
  getWasteForJob,
  getWastePercentForJob,
  groupTotals,
  isWithinDateRange,
  matchesText,
} from './utils/calculations';
import { generateCode } from './utils/codeGenerator';
import { syncJobThread } from './utils/messagingSync';
import { supabase } from './utils/supabase';
import { detectVersionConflict, recordAuditEvent } from './utils/supabaseData';

const currentMonth = getCurrentMonthValue();
/** Recompute an invoice's paid/outstanding/status from its payments array.
 *  Used when bank reconciliation adds or removes an auto-payment. */
function recomputeInvoiceFromPayments(inv: Invoice): Invoice {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const amountPaid = inv.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const amountOutstanding = Math.max(0, (Number(inv.totalInclVat) || 0) - amountPaid);
  let status = inv.status;
  if (status !== 'Cancelled' && status !== 'Draft') {
    if (amountPaid <= 0) {
      if (status === 'Paid' || status === 'Partially Paid') status = 'Sent';
    } else if (amountOutstanding <= 0) {
      status = 'Paid';
    } else {
      status = 'Partially Paid';
    }
  }
  return { ...inv, amountPaid: round2(amountPaid), amountOutstanding: round2(amountOutstanding), status };
}

/** Recompute a supplier bill's paid/outstanding/status from its payments. */
function recomputeBillFromPayments(b: SupplierBill): SupplierBill {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const total = Number(b.totalInclVat) || 0;
  const paid = b.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  let status = b.status;
  if (status !== 'Disputed' && status !== 'Cancelled') {
    if (paid <= 0) status = 'Unpaid';
    else if (total - paid <= 0) status = 'Paid';
    else status = 'Partially Paid';
  }
  return { ...b, amountPaid: round2(paid), amountOutstanding: round2(total - paid), status };
}

const VIEW_ORDER: View[] = [
  'dashboard',
  'salesDesk',
  'leads',
  'calculator',
  'workTicket',
  'costMasters',
  'costInputs',
  'permissions',
  'suppliers',
  'machines',
  'quotes',
  'artwork',
  'customerStock',
  'deliveryNotes',
  'invoices',
  'productionSpecs',
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
  'maintenance',
  'osConnector',
];
const createInitialJobForm = (): JobFormState => ({
  jobDate: getToday(),
  dueDate: getToday(),
  leadId: '',
  leadNumber: '',
  quoteId: '',
  quoteNumber: '',
  quickbooksEstimateNumber: '',
  invoiceNumber: '',
  orderValue: '',
  paymentRequirement: '50% Deposit',
  paymentStatus: 'Pending',
  creditCheckStatus: 'Not Required',
  availableCreditAtApproval: '',
  commercialReleaseStatus: 'Pending',
  clientId: '',
  pricingTierId: '',
  productId: '',
  productCategory: 'Paper Bags',
  customerName: '',
  customerReference: '',
  productName: '',
  description: '',
  sizeSpec: '',
  paperType: '',
  gsm: '',
  paperQuantityRequired: '',
  paperQuantityUnit: 'kg',
  paperAllocationStatus: 'Not Checked',
  printRequired: false,
  printMethod: 'Plain',
  colorCount: '0',
  supplyFormat: 'Boxes',
  packingNotes: '',
  printNotes: '',
  quantityPlanned: '',
  quantityCompleted: '',
  status: 'Draft',
  artworkReceived: false,
  proofSent: false,
  approvalStatus: 'Not Sent',
  approvalDate: '',
  artworkPreparationStatus: 'Needs Design',
  addElementsRequired: false,
  colorChangesRequired: false,
  artworkChangeSummary: '',
  artworkAssignedDate: '',
  artworkAssignedTo: '',
  proofSharedDate: '',
  proofSharedBy: '',
  finalApprovalReceivedDate: '',
  finalApprovalClearedBy: '',
  factoryReleaseDate: '',
  factoryReleasedBy: '',
  productionStartDate: '',
  productionStartedBy: '',
  readyForDispatchDate: '',
  readyForDispatchBy: '',
  collectionOrDeliveryStatus: 'Not Confirmed',
  changesRequested: '',
  artworkNotes: '',
  reserveFromStock: false,
  reservedFinishedGoodsStockId: '',
  reservedQuantity: '',
  stockReservationStatus: 'Not Checked',
  dispatchStatus: '',
  qualityNotes: '',
  capturedBy: '',
  releasedBy: '',
  notes: '',
  fscRelated: false,
  foodContactLevel: 'NonFood',
  foodSafeMaterialIds: [],
  internalBatchNumber: '',
  foodSafetyNotes: '',
  assignedMachineId: '',
  changeoverChecklist: buildBlankChangeoverChecklist(),
  qcPlan: buildBlankQcPlan(),
});

const createInitialPaperRateForm = (): PaperRateFormState => ({
  name: '',
  supplierId: '',
  paperType: '',
  gsm: '',
  pricePerTon: '',
  notes: '',
  active: true,
});

const createInitialSupplierForm = (): SupplierFormState => ({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  contacts: [],
  address: '',
  billingAddress: '',
  city: '',
  country: '',
  website: '',
  supplierType: 'General',
  certificateCode: '',
  accountNumber: '',
  paymentTerms: '',
  creditLimit: '',
  currentBalance: '',
  currency: 'ZAR',
  isAlsoClient: false,
  linkedClientId: '',
  lastCheckInDate: '',
  nextReviewDate: '',
  reviewFrequencyMonths: '12',
  internalOwner: '',
  certifications: [],
  suppliedProducts: [],
  notes: '',
  active: true,
});

const createInitialMachineForm = (): MachineFormState => ({
  name: '',
  code: '',
  department: '',
  processType: '',
  status: 'Active',
  notes: '',
  active: true,
});

const createInitialQuoteForm = (): QuoteEstimateFormState => ({
  quoteDate: getToday(),
  quickbooksEstimateNumber: '',
  linkedLeadId: '',
  clientId: '',
  productId: '',
  pricingTierId: '',
  paperRateId: '',
  costProfileId: '',
  quantity: '',
  sizeSpec: '',
  handleType: 'None',
  printMethod: 'Auto',
  colors: '0',
  unitCost: '',
  quotedUnitPrice: '',
  totalQuote: '',
  status: 'Draft',
  notes: '',
  customerNote: '',
});

const createInitialLeadForm = (): LeadFormState => ({
  enquiryDate: getToday(),
  clientId: '',
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  source: 'WhatsApp',
  assignedTo: '',
  productId: '',
  requestedQuantity: '',
  dueDate: '',
  status: 'New',
  quickbooksEstimateNumber: '',
  linkedQuoteId: '',
  notes: '',
  nextFollowUpDate: '',
  activities: [],
  lostReason: '',
  estimatedValue: '',
});

const createInitialArtworkForm = (): ArtworkFormState => ({
  jobId: '',
  artworkReceivedDate: '',
  proofSentDate: '',
  approvalDate: '',
  stage: 'Awaiting Artwork',
  changesRequested: '',
  notes: '',
});

const createInitialCustomerStockReleaseForm = (): CustomerStockReleaseFormState => ({
  releaseDate: getToday(),
  clientId: '',
  finishedGoodsStockId: '',
  jobId: '',
  quantityReleased: '',
  quantityUnit: 'units',
  destination: '',
  notes: '',
});

const createInitialCostProfileForm = (): CostProfileFormState => ({
  name: 'Default',
  wastagePercent: '10',
  defaultMarginPercent: '20',
  baseGlueCostPerBag: '0',
  hotMeltCostPerBag: '0',
  flatHandleCostPerBag: '0',
  ropeHandleCostPerBag: '0',
  rollHandleCostPerBag: '0',
  screenPrintSetupCost: '0',
  screenPrintCostPerColor: '0',
  flexoInkCostPer1000PerColor: '0',
  plateCostPerColor: '0',
  labourCostPer1000: '0',
  packagingCostPer1000: '0',
  transportCostPerJob: '0',
  sideSeamAllowanceMm: '30',
  topFoldAllowanceMm: '40',
  bottomFoldAllowanceMm: '40',
  flexoThresholdQty: '5000',
  active: true,
  notes: '',
});

const createInitialCalculatorQuoteForm = (): CalculatorQuoteFormState => ({
  clientId: '',
  productId: '',
  pricingTierId: '',
  paperRateId: '',
  costProfileId: '',
  bagWidthMm: '',
  bagHeightMm: '',
  gussetMm: '',
  quantity: '',
  handleType: 'None',
  printMethod: 'Auto',
  colors: '0',
  customMarginPercent: '',
});

const createInitialFinishedStockForm = (): FinishedGoodsStockFormState => ({
  storedDate: getToday(),
  productId: '',
  clientId: '',
  jobId: '',
  barcode: '',
  quantityOnHand: '',
  quantityReserved: '0',
  quantityUnit: 'units',
  storageLocation: '',
  stockStatus: 'In Storage',
  brandingStatus: '',
  notes: '',
});

const createInitialSpareForm = (): SparePartFormState => ({
  partName: '',
  category: 'Consumable',
  itemType: 'Consumable',
  productionUse: true,
  machineId: '',
  machineReference: '',
  supplierId: '',
  supplierName: '',
  barcode: '',
  quantityOnHand: '',
  minimumStockLevel: '',
  reorderLevel: '',
  unitOfMeasure: 'units',
  unitCost: '',
  storageLocation: '',
  lastPurchaseDate: getToday(),
  notes: '',
});

const createInitialMaterialForm = (): MaterialReceiptFormState => ({
  receivedDate: getToday(),
  supplierId: '',
  supplierName: '',
  supplierBatchNumber: '',
  internalRollCode: '',
  barcode: '',
  materialKind: 'Paper',
  itemName: '',
  paperType: '',
  gsm: '',
  width: '',
  quantityReceived: '',
  quantityUnit: 'kg',
  fscClaimType: 'None',
  supplierCertificateCode: '',
  invoiceReference: '',
  storageLocation: '',
  inspectionNotes: '',
  fscRelated: false,
});

const createInitialInventoryScanForm = (): InventoryScanFormState => ({
  barcode: '',
  movementDate: getToday(),
  movementType: 'Issued to Job',
  quantityMoved: '',
  toLocation: '',
  jobId: '',
  notes: '',
});

const createInitialProductionForm = (): ProductionLogFormState => ({
  logDate: getToday(),
  logType: 'Bag Making',
  jobId: '',
  operatorName: '',
  machineId: '',
  machine: '',
  sourceMaterialId: '',
  setupTimeMinutes: '',
  notes: '',
  operatorSignature: '',
  fscRelated: false,
  rollCode: '',
  height: '',
  gusset: '',
  handleType: '',
  goodBags: '',
  rejectBags: '',
  heightChange: '',
  printingMethod: '',
  bagSize: '',
  numberOfColors: '',
  quantityPrinted: '',
  materialSourceCode: '',
  rollWidth: '',
  metersKgPrinted: '',
  rejectMetersKg: '',
  parentRollCode: '',
  parentWidth: '',
  targetChildWidth: '',
  numberOfChildRolls: '',
  childDiameter: '',
  totalWasteKg: '',
  bladeChange: '',
});

const createInitialWasteForm = (): WasteFormState => ({
  wasteDate: getToday(),
  jobId: '',
  productionLogId: '',
  wasteQuantity: '',
  wasteUnit: 'kg',
  wasteReason: 'Setup waste',
  notes: '',
  enteredBy: '',
  fscRelated: false,
});

const createInitialPaperForm = (): PaperFormState => ({
  logDate: getToday(),
  jobId: '',
  materialReceiptId: '',
  paperType: '',
  gsm: '',
  width: '',
  quantityUsed: '',
  quantityUnit: 'kg',
  paperCode: '',
  notes: '',
  fscRelated: false,
});

const createInitialDispatchForm = (): DispatchFormState => ({
  dispatchDate: getToday(),
  jobId: '',
  finishedGoodsStockId: '',
  quantityDispatched: '',
  quantityUnit: 'units',
  labelReference: '',
  deliveryReference: '',
  issueNotes: '',
  fscRelated: false,
});

const createInitialDeliveryNoteForm = (): DeliveryNoteFormState => ({
  noteDate: getToday(),
  clientId: '',
  clientContactName: '',
  clientContactPhone: '',
  clientEmail: '',
  clientAddress: '',
  companyName: 'JomoPak',
  companyPhone: '',
  companyEmail: '',
  companyAddress: '',
  jobId: '',
  dispatchRecordId: '',
  customerStockReleaseId: '',
  deliveryMethod: 'Delivery',
  deliveryReference: '',
  vehicleRegistration: '',
  driverName: '',
  dispatchedBy: '',
  receivedBy: '',
  status: 'Draft',
  clientVisible: true,
  lineItems: [],
  notes: '',
  customerNote: '',
  parentInvoiceId: '',
  receiptMode: 'Pending',
  signedByName: '',
  signedByDate: '',
  signedByContactInfo: '',
  collectedByName: '',
  collectedByDate: '',
  collectedByIdNumber: '',
});

const createInitialCleaningLogForm = (): CleaningLogFormState => ({
  area: 'Bag Machine',
  areaDetail: '',
  machineId: '',
  cleaningType: 'Pre-Shift',
  performedAt: new Date().toISOString().slice(0, 16),
  performedByName: '',
  chemicalRegisterId: '',
  chemicalName: '',
  result: 'Pass',
  supervisorSignOffName: '',
  supervisorSignOffAt: '',
  correctiveAction: '',
  beforePhotoUrl: '',
  afterPhotoUrl: '',
  notes: '',
});

const createInitialNcrForm = (): NonConformanceFormState => ({
  issueDate: getToday(),
  area: 'Bag Machine',
  areaDetail: '',
  issueType: 'Cleaning Not Completed',
  severity: 'Medium',
  description: '',
  jobId: '',
  finishedGoodsStockId: '',
  cleaningLogId: '',
  reportedByName: '',
  immediateAction: '',
  rootCauseAnalysis: '',
  correctiveAction: '',
  preventiveAction: '',
  responsiblePersonName: '',
  dueDate: '',
  evidencePhotoUrls: [],
  status: 'Open',
  verifiedByName: '',
  closedByName: '',
  closureNotes: '',
});

const createInitialTrainingForm = (): StaffTrainingFormState => ({
  staffName: '',
  staffRole: '',
  topic: 'Food Safety',
  trainingDate: getToday(),
  trainerName: '',
  method: '',
  acknowledged: false,
  acknowledgedDate: '',
  refresherIntervalMonths: '12',
  certificateUrl: '',
  notes: '',
});

const createInitialNoticeForm = (): NoticeFormState => ({
  title: '',
  body: '',
  expiresAt: '',
  audienceRoles: [],
  pinned: false,
});

const createInitialPpeForm = (): PpeIssueFormState => ({
  staffName: '',
  staffRole: '',
  itemType: 'Hairnet',
  itemDescription: '',
  quantity: '1',
  issuedByName: '',
  issuedDate: getToday(),
  status: 'Issued',
  returnDate: '',
  replacementDueDate: '',
  notes: '',
  items: [],
  employeeSignatureDataUrl: '',
});

const createInitialPestForm = (): PestControlFormState => ({
  serviceDate: getToday(),
  providerName: '',
  technicianName: '',
  nextServiceDate: '',
  activityType: 'Preventive Treatment',
  pestType: '',
  findings: '',
  correctiveActions: '',
  productAffected: false,
  stockOnHold: false,
  reportUrls: [],
  baitStationMapUrl: '',
  notes: '',
});

const createInitialForeignObjectForm = (): ForeignObjectFormState => ({
  area: 'Bag Machine',
  material: 'Glass',
  description: '',
  recordType: 'Risk Inventory',
  inspectionDate: getToday(),
  inspectedByName: '',
  status: 'Open',
  controlMeasure: '',
  linkedNcrId: '',
  photoUrls: [],
  notes: '',
});

const createInitialToolBladeForm = (): ToolBladeFormState => ({
  itemType: 'Blade',
  serialNumber: '',
  description: '',
  homeLocation: '',
  currentHolderName: '',
  issuedToName: '',
  issuedDate: '',
  expectedReturnDate: '',
  returnedDate: '',
  status: 'Available',
  isCritical: true,
  linkedNcrId: '',
  notes: '',
});

const createInitialSopForm = (): SopDocumentFormState => ({
  title: '',
  category: 'Food Safety Policy',
  version: '1.0',
  ownerName: '',
  approvedByName: '',
  approvedDate: '',
  reviewDate: '',
  documentUrl: '',
  summary: '',
  status: 'Draft',
  acknowledgements: [],
  supersedesId: '',
  notes: '',
});

const createInitialVisitorForm = (): VisitorLogFormState => ({
  visitDate: getToday(),
  visitorName: '',
  visitorType: 'Contractor',
  company: '',
  hostName: '',
  purpose: '',
  areasVisited: [],
  timeIn: '',
  timeOut: '',
  hygieneAcknowledged: false,
  ppeIssued: '',
  enteredFoodContactArea: false,
  notes: '',
  phoneNumber: '',
  vehicleRegistration: '',
  signatureDataUrl: '',
});

const createInitialHaccpForm = (): HaccpHazardFormState => ({
  processStep: 'Raw Material Receiving',
  hazardType: 'Physical',
  hazardName: '',
  description: '',
  likelihood: '3',
  severity: '3',
  controlMeasure: '',
  isCCP: false,
  monitoringMethod: '',
  monitoringFrequency: '',
  criticalLimits: '',
  correctiveAction: '',
  verificationMethod: '',
  responsiblePerson: '',
  reviewIntervalMonths: '12',
  lastReviewedDate: '',
  notes: '',
});

const createInitialComplaintForm = (): CustomerComplaintFormState => ({
  complaintDate: getToday(),
  clientId: '',
  reportedByName: '',
  reportedByContact: '',
  productId: '',
  finishedGoodsStockId: '',
  jobId: '',
  deliveryNoteId: '',
  invoiceId: '',
  complaintType: 'Product Defect',
  severity: 'Medium',
  description: '',
  quantityAffected: '',
  quantityUnit: 'units',
  quantityWithCustomer: '',
  quantityInternalStock: '',
  photoUrls: [],
  status: 'New',
  investigationNotes: '',
  rootCauseAnalysis: '',
  immediateAction: '',
  correctiveAction: '',
  preventiveAction: '',
  outcome: 'Pending',
  outcomeNotes: '',
  closedByName: '',
  recallTriggered: false,
  recallScope: '',
});

const createInitialFoodSafeMaterialForm = (): FoodSafeMaterialFormState => ({
  materialName: '',
  category: 'Paper',
  supplierId: '',
  supplierSku: '',
  directContactApproved: false,
  indirectContactApproved: false,
  externalPrintOnly: false,
  foodSafeDeclarationUrl: '',
  msdsUrl: '',
  certificateOfAnalysisUrl: '',
  supplierBatchNumber: '',
  internalBatchNumber: '',
  storageLocation: '',
  status: 'Pending',
  approvalDate: '',
  reviewDate: '',
  expiryDate: '',
  notes: '',
});

const createInitialChemicalForm = (): ChemicalRegisterFormState => ({
  chemicalName: '',
  tradeName: '',
  supplierId: '',
  casNumber: '',
  unNumber: '',
  state: 'Liquid',
  ghsPictograms: [],
  hazardStatements: '',
  precautionaryStatements: '',
  storageLocation: '',
  maxOnSiteQuantity: '',
  currentOnSiteQuantity: '',
  quantityUnit: 'L',
  msdsDocumentUrl: '',
  msdsLastReviewedDate: '',
  msdsReviewIntervalMonths: '12',
  emergencyProcedure: '',
  requiredPPE: '',
  fireSuppressionType: '',
  notes: '',
  archived: false,
});

const createInitialInvoiceForm = (): InvoiceFormState => ({
  invoiceDate: getToday(),
  dueDate: '',
  clientId: '',
  jobId: '',
  quoteId: '',
  productionSpecId: '',
  customerReference: '',
  termsType: '50% Deposit',
  termsText: '50% deposit, balance on collection / delivery.',
  notes: '',
  footerNotes: '',
  customerNote: '',
  status: 'Draft',
  currency: 'ZAR',
  lineItems: [],
  payments: [],
  stockHoldingApplies: false,
  stockHoldingStartDate: getToday(),
  stockHoldingMaxDays: '90',
  clientVisible: true,
});

/**
 * Build the editable form state for Settings → all tabs from a saved AppSettings
 * record. The form keeps numeric / multi-line fields as raw strings so the
 * inputs remain forgiving while the user types; conversion happens on save.
 */
const buildSettingsForm = (settings: AppSettings): AppSettingsFormState => ({
  company: { ...settings.company },
  templates: {
    invoiceFooterLines: settings.templates.invoiceFooterLines.join('\n'),
    deliveryNoteFooterLines: settings.templates.deliveryNoteFooterLines.join('\n'),
    productionSpecFooterLines: settings.templates.productionSpecFooterLines.join('\n'),
    defaultPaymentTerms: settings.templates.defaultPaymentTerms,
    defaultInvoiceNotes: settings.templates.defaultInvoiceNotes,
    defaultDeliveryNoteNotes: settings.templates.defaultDeliveryNoteNotes,
    defaultCustomerNote: settings.templates.defaultCustomerNote ?? '',
    termsAndConditions: settings.templates.termsAndConditions ?? '',
    termsReferenceLine: settings.templates.termsReferenceLine ?? '',
  },
  stockHolding: {
    defaultMaxDays: String(settings.stockHolding.defaultMaxDays),
    defaultReviewCadenceDays: String(settings.stockHolding.defaultReviewCadenceDays),
    defaultAgreementTermsText: settings.stockHolding.defaultAgreementTermsText,
  },
});

const createInitialProductionSpecForm = (): ProductionSpecFormState => ({
  specDate: getToday(),
  status: 'Draft',
  clientId: '',
  productId: '',
  jobId: '',
  sizeWidthMm: '',
  sizeHeightMm: '',
  sizeGussetMm: '',
  paperGsm: '',
  paperType: '',
  handleType: 'None',
  finishingNotes: '',
  printMethod: 'Plain',
  printColours: '0',
  pantoneReferences: '',
  artworkReference: '',
  printPositionNotes: '',
  quantityOrdered: '',
  quantityUnit: 'units',
  leadTimeDays: '',
  packingFormat: 'Boxes',
  packingNotes: '',
  approvedBy: '',
  approvedDate: '',
  notes: '',
  clientVisible: true,
});

const createInitialPricingTierForm = (): PricingTierFormState => ({
  name: '',
  type: 'Wholesale',
  defaultMarginPercent: '',
  brandingMarginPercent: '',
  notes: '',
});

const createInitialClientForm = (): ClientFormState => ({
  name: '',
  companyName: '',
  accountManagerName: '',
  code: '',
  pricingTierId: '',
  brandingDefault: false,
  defaultMarginPercent: '',
  creditLimit: '',
  currentBalance: '',
  paymentTerms: '30 Days',
  primaryPaymentMethod: 'EFT',
  currency: 'ZAR',
  invoiceLanguage: 'English',
  vatNumber: '',
  openingBalance: '',
  openingBalanceAsOf: getToday(),
  accountHold: false,
  title: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  contactName: '',
  contactEmail: '',
  phoneNumber: '',
  mobileNumber: '',
  otherPhone: '',
  faxNumber: '',
  ccEmail: '',
  bccEmail: '',
  website: '',
  marketingConsent: false,
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: '',
  billingCountry: 'South Africa',
  deliveryAddressLine1: '',
  deliveryAddressLine2: '',
  deliveryCity: '',
  deliveryState: '',
  deliveryPostalCode: '',
  deliveryCountry: 'South Africa',
  stockHoldingEnabled: false,
  stockHoldingAgreementSigned: false,
  stockHoldingAgreementSignedDate: '',
  stockHoldingAgreementReference: '',
  stockHoldingReviewDate: '',
  creditAgreementSigned: false,
  creditAgreementSignedDate: '',
  creditAgreementReference: '',
  storageGracePeriodDays: '0',
  maxStoragePeriodDays: '30',
  storageFeeApplies: false,
  storageFeeType: 'None',
  storageFeeRate: '',
  depositRequiredPercent: '40',
  minimumMonthlyReleaseQuantity: '',
  minimumMonthlyReleaseUnit: 'units',
  minimumReleaseQuantity: '',
  deliveryChargePolicy: 'Charge Every Release',
  releaseApprovalRequired: true,
  portalEnabled: false,
  portalViewQuotes: true,
  portalViewInvoices: true,
  portalViewStock: true,
  portalRequestRelease: false,
  notes: '',
  active: true,
});

const createInitialProductForm = (): ProductFormState => ({
  name: '',
  sku: '',
  category: 'Paper Bags',
  supplyType: 'Manufactured',
  defaultSupplierId: '',
  brandingAllowed: true,
  defaultUnit: 'units',
  defaultPaperType: '',
  defaultGsm: '',
  notes: '',
  active: true,
  pricingEnabled: false,
  bagWidthMm: '',
  bagHeightMm: '',
  gussetMm: '',
  handleType: 'None',
  printMethod: 'Plain',
  colors: '0',
  printAreaCm2: '',
  coverageBand: 'None',
  paperRateId: '',
  costProfileId: '',
  plateBilling: 'amortized',
  baseMarginPercent: '',
  baseQuantity: '1000',
  breakQuantities: '5000, 10000, 25000',
});

function App() {
  const { session, profile, loading: authLoading, recoveryMode, clearRecoveryMode } = useAuth();
  const { profiles, loading: profilesLoading, saveProfile, createUser } = useProfiles(profile?.role === 'admin');
  const { data, setData, loading } = useProductionData(!authLoading && Boolean(session));
  // Internal staff names — used for client account-manager + handover dropdowns.
  const staffOptions = useMemo(
    () => Array.from(new Set(
      profiles
        .filter((p) => p.accountType === 'internal')
        .map((p) => p.fullName || p.email)
        .filter((n): n is string => Boolean(n)),
    )).sort((a, b) => a.localeCompare(b)),
    [profiles],
  );
  const [view, setView] = useState<View>('dashboard');
  const [dashboardMonth, setDashboardMonth] = useState(currentMonth);

  const [paperRateForm, setPaperRateForm] = useState(createInitialPaperRateForm);
  const [paperRateEditingId, setPaperRateEditingId] = useState<string | null>(null);
  const [paperRateMessage, setPaperRateMessage] = useState('');
  const [paperRateFilters, setPaperRateFilters] = useState<PaperRateFilters>({ search: '', active: 'all' });

  const [costProfileForm, setCostProfileForm] = useState(createInitialCostProfileForm);
  const [costProfileEditingId, setCostProfileEditingId] = useState<string | null>(null);
  const [costProfileMessage, setCostProfileMessage] = useState('');
  const [costProfileFilters, setCostProfileFilters] = useState<CostProfileFilters>({ search: '', active: 'all' });

  // ----- Phase 15: work-ticket masters -----
  const [inkRateForm, setInkRateForm] = useState<InkRateFormState>({
    name: '', inkType: 'Pantone', supplierId: '', costPerKg: '', coverageSqmPerKg: '100', defaultCoveragePercent: '50', notes: '', active: true,
  });
  const [inkRateEditingId, setInkRateEditingId] = useState<string | null>(null);
  const [inkRateMessage, setInkRateMessage] = useState('');
  const [inkRateFilters, setInkRateFilters] = useState<InkRateFilters>({ search: '', inkType: '', active: 'all' });

  const [finishingForm, setFinishingForm] = useState<FinishingOperationFormState>({
    name: '', machineName: '', rateType: 'PerThousand', rate: '', setupCost: '', runSpeedPerHour: '', notes: '', active: true,
  });
  const [finishingEditingId, setFinishingEditingId] = useState<string | null>(null);
  const [finishingMessage, setFinishingMessage] = useState('');
  const [finishingFilters, setFinishingFilters] = useState<FinishingOperationFilters>({ search: '', rateType: '', active: 'all' });

  const [pressRateForm, setPressRateForm] = useState<PressRateFormState>({
    machineId: '', ratePerHour: '', makeReadySheets: '0', makeReadyMinutes: '0', runSpeedSheetsPerHour: '0', notes: '', active: true,
  });
  const [pressRateEditingId, setPressRateEditingId] = useState<string | null>(null);
  const [pressRateMessage, setPressRateMessage] = useState('');
  const [pressRateFilters, setPressRateFilters] = useState<PressRateFilters>({ search: '', active: 'all' });

  const [plateCostForm, setPlateCostForm] = useState<PlateCostFormState>({
    name: '', format: '', costPerColor: '', originationCost: '', notes: '', active: true,
  });
  const [plateCostEditingId, setPlateCostEditingId] = useState<string | null>(null);
  const [plateCostMessage, setPlateCostMessage] = useState('');
  const [plateCostFilters, setPlateCostFilters] = useState<PlateCostFilters>({ search: '', active: 'all' });

  const [workTicketForm, setWorkTicketForm] = useState<WorkTicketFormState>(() => emptyWorkTicketForm(getToday()));
  const [workTicketEditingId, setWorkTicketEditingId] = useState<string | null>(null);
  const [workTicketMessage, setWorkTicketMessage] = useState('');
  const [workTicketFilters, setWorkTicketFilters] = useState<WorkTicketFilters>({ search: '', month: '', status: '', client: '' });
  /** When set, the WorkTicketPrint overlay is shown over the page. */
  const [workTicketPrintTarget, setWorkTicketPrintTarget] = useState<WorkTicket | null>(null);
  /** When set, the DeliveryNotePrint overlay is shown over the page. */
  const [deliveryNotePrintTarget, setDeliveryNotePrintTarget] = useState<DeliveryNote | null>(null);
  /** When set, the Food-Safe Certificate print overlay is shown. */
  const [foodSafeCertificateJob, setFoodSafeCertificateJob] = useState<JobCard | null>(null);
  const [quotePrintTarget, setQuotePrintTarget] = useState<QuoteEstimate | null>(null);
  const [jobCardPrintTarget, setJobCardPrintTarget] = useState<JobCard | null>(null);

  // Legacy single-line calculator state. Kept around so other code that
  // still references it doesn't break, but the page itself no longer
  // reads from it. The new multi-line state lives below.
  const [calculatorQuoteForm, setCalculatorQuoteForm] = useState(createInitialCalculatorQuoteForm);
  // Calculator v2 — multi-line.
  const [calculatorState, setCalculatorState] = useState(() => emptyCalculatorState(getToday()));

  const [supplierForm, setSupplierForm] = useState(createInitialSupplierForm);
  const [supplierEditingId, setSupplierEditingId] = useState<string | null>(null);
  const [supplierMessage, setSupplierMessage] = useState('');
  const [supplierSaveCount, setSupplierSaveCount] = useState(0);
  const [supplierFilters, setSupplierFilters] = useState<SupplierFilters>({ search: '', supplierType: '', active: 'all' });

  const [machineForm, setMachineForm] = useState(createInitialMachineForm);
  const [machineEditingId, setMachineEditingId] = useState<string | null>(null);
  const [machineMessage, setMachineMessage] = useState('');
  const [machineFilters, setMachineFilters] = useState<MachineFilters>({ search: '', status: '', processType: '', active: 'all' });

  const [quoteForm, setQuoteForm] = useState(createInitialQuoteForm);
  const [quoteEditingId, setQuoteEditingId] = useState<string | null>(null);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteFilters, setQuoteFilters] = useState<QuoteEstimateFilters>({ search: '', month: '', status: '', client: '' });

  const [leadForm, setLeadForm] = useState(createInitialLeadForm);
  const [leadEditingId, setLeadEditingId] = useState<string | null>(null);
  const [leadMessage, setLeadMessage] = useState('');
  const [leadFilters, setLeadFilters] = useState<LeadFilters>({ search: '', month: '', status: '', source: '', owner: '' });

  const [artworkForm, setArtworkForm] = useState(createInitialArtworkForm);
  const [artworkEditingId, setArtworkEditingId] = useState<string | null>(null);
  const [artworkMessage, setArtworkMessage] = useState('');
  const [artworkFilters, setArtworkFilters] = useState<ArtworkFilters>({ search: '', stage: '', client: '' });

  const [customerStockReleaseForm, setCustomerStockReleaseForm] = useState(createInitialCustomerStockReleaseForm);
  const [customerStockReleaseEditingId, setCustomerStockReleaseEditingId] = useState<string | null>(null);
  const [customerStockReleaseMessage, setCustomerStockReleaseMessage] = useState('');
  const [customerStockReleaseFilters, setCustomerStockReleaseFilters] = useState<CustomerStockReleaseFilters>({ search: '', month: '', client: '' });

  const [jobForm, setJobForm] = useState(createInitialJobForm);
  const [jobEditingId, setJobEditingId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState('');
  const [jobSaveCount, setJobSaveCount] = useState(0);
  const [jobFilters, setJobFilters] = useState<JobFilters>({ search: '', month: '', status: '', customer: '', fsc: 'all' });

  const [stockForm, setStockForm] = useState(createInitialFinishedStockForm);
  const [stockEditingId, setStockEditingId] = useState<string | null>(null);
  const [stockMessage, setStockMessage] = useState('');
  const [stockFilters, setStockFilters] = useState<FinishedGoodsStockFilters>({ search: '', client: '', status: '', product: '' });

  const [spareForm, setSpareForm] = useState(createInitialSpareForm);
  const [spareEditingId, setSpareEditingId] = useState<string | null>(null);
  const [spareMessage, setSpareMessage] = useState('');
  const [spareFilters, setSpareFilters] = useState<SparePartFilters>({ search: '', category: '', lowStock: 'all', supplier: '' });
  const [stockIssueForm, setStockIssueForm] = useState<StockIssueFormState>({
    itemId: '',
    quantity: '',
    issuedToName: '',
    issuedByName: '',
    jobId: '',
    jobNumber: '',
    notes: '',
  });
  const [stockIssueMessage, setStockIssueMessage] = useState('');
  const [stockIssueFilters, setStockIssueFilters] = useState<StockIssueFilters>({ search: '', status: 'all', itemType: 'all' });
  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  // History drawer slot — set to a target to open, null to close. Any page can
  // call openHistory(target) (passed via context-style prop drilling on the
  // detail screens that need it).
  const [historyTarget, setHistoryTarget] = useState<HistoryDrawerTarget | null>(null);
  const openHistory = useCallback((target: HistoryDrawerTarget) => {
    setHistoryTarget(target);
  }, []);
  // Cmd-K palette open/close. The shortcut is registered globally in a useEffect
  // below so it works regardless of which view is active.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [stockCountForm, setStockCountForm] = useState<StockCountFormState>({
    scope: '',
    countedByName: '',
    notes: '',
    selectedItemIds: [],
    countedQty: {},
  });
  const [stockCountMessage, setStockCountMessage] = useState('');

  const [tierForm, setTierForm] = useState(createInitialPricingTierForm);
  const [tierEditingId, setTierEditingId] = useState<string | null>(null);
  const [tierMessage, setTierMessage] = useState('');
  const [tierFilters, setTierFilters] = useState<PricingTierFilters>({ search: '', type: '' });

  const [clientForm, setClientForm] = useState(createInitialClientForm);
  const [clientEditingId, setClientEditingId] = useState<string | null>(null);
  const [clientMessage, setClientMessage] = useState('');
  const [clientFilters, setClientFilters] = useState<ClientFilters>({ search: '', clientType: '', active: 'all' });

  const [productForm, setProductForm] = useState(createInitialProductForm);
  const [productEditingId, setProductEditingId] = useState<string | null>(null);
  const [productMessage, setProductMessage] = useState('');
  const [productFilters, setProductFilters] = useState<ProductFilters>({ search: '', category: '', supplyType: '', active: 'all' });

  const [materialForm, setMaterialForm] = useState(createInitialMaterialForm);
  const [materialEditingId, setMaterialEditingId] = useState<string | null>(null);
  const [materialMessage, setMaterialMessage] = useState('');
  const [materialFilters, setMaterialFilters] = useState<MaterialFilters>({ search: '', month: '', supplier: '', paperType: '', fsc: 'all' });
  const [inventoryScanForm, setInventoryScanForm] = useState(createInitialInventoryScanForm);
  const [inventoryScanMessage, setInventoryScanMessage] = useState('');

  const [chemicalForm, setChemicalForm] = useState<ChemicalRegisterFormState>(createInitialChemicalForm);
  const [chemicalEditingId, setChemicalEditingId] = useState<string | null>(null);
  const [chemicalMessage, setChemicalMessage] = useState('');
  const [chemicalFilters, setChemicalFilters] = useState<ChemicalRegisterFilters>({
    search: '',
    pictogram: '',
    storageLocation: '',
    reviewStatus: 'all',
    archived: 'active',
  });

  // Food Safety - Phase 1: Approved Food-Safe Material Register
  const [foodSafeMaterialForm, setFoodSafeMaterialForm] = useState<FoodSafeMaterialFormState>(createInitialFoodSafeMaterialForm);
  const [foodSafeMaterialEditingId, setFoodSafeMaterialEditingId] = useState<string | null>(null);
  const [foodSafeMaterialMessage, setFoodSafeMaterialMessage] = useState('');
  const [foodSafeMaterialFilters, setFoodSafeMaterialFilters] = useState<FoodSafeMaterialFilters>({
    search: '',
    category: '',
    supplier: '',
    status: '',
    contactLevel: 'all',
    reviewStatus: 'all',
  });

  // Food Safety - Phase 2: Cleaning logs
  const [cleaningLogForm, setCleaningLogForm] = useState<CleaningLogFormState>(createInitialCleaningLogForm);
  const [cleaningLogEditingId, setCleaningLogEditingId] = useState<string | null>(null);
  const [cleaningLogMessage, setCleaningLogMessage] = useState('');
  const [cleaningLogFilters, setCleaningLogFilters] = useState<CleaningLogFilters>({
    search: '',
    area: '',
    cleaningType: '',
    result: '',
    dateWindow: '7d',
  });

  // Food Safety - Phase 3: Complaints + Traceability
  const [complaintForm, setComplaintForm] = useState<CustomerComplaintFormState>(createInitialComplaintForm);
  const [complaintEditingId, setComplaintEditingId] = useState<string | null>(null);
  const [complaintMessage, setComplaintMessage] = useState('');
  const [complaintFilters, setComplaintFilters] = useState<CustomerComplaintFilters>({
    search: '',
    client: '',
    complaintType: '',
    severity: '',
    status: '',
    recall: 'all',
    dateWindow: '90d',
  });
  /** Traceability seed — when set, opens Traceability with this query pre-filled. */
  const [traceabilitySeed, setTraceabilitySeed] = useState<{ type: TraceabilitySearchType; query: string } | null>(null);

  // Food Safety - Phase 5: HACCP register
  const [haccpForm, setHaccpForm] = useState<HaccpHazardFormState>(createInitialHaccpForm);
  const [haccpEditingId, setHaccpEditingId] = useState<string | null>(null);
  const [haccpMessage, setHaccpMessage] = useState('');
  const [haccpFilters, setHaccpFilters] = useState<HaccpHazardFilters>({
    search: '',
    processStep: '',
    hazardType: '',
    riskLevel: '',
    ccpOnly: false,
  });

  // Food Safety - Phase 4 registers
  const [trainingForm, setTrainingForm] = useState<StaffTrainingFormState>(createInitialTrainingForm);
  const [trainingEditingId, setTrainingEditingId] = useState<string | null>(null);
  const [trainingMessage, setTrainingMessage] = useState('');
  const [trainingFilters, setTrainingFilters] = useState<StaffTrainingFilters>({ search: '', topic: '', refresherStatus: 'all' });

  const [ppeForm, setPpeForm] = useState<PpeIssueFormState>(createInitialPpeForm);
  const [ppeEditingId, setPpeEditingId] = useState<string | null>(null);
  const [ppeMessage, setPpeMessage] = useState('');
  const [ppeFilters, setPpeFilters] = useState<PpeIssueFilters>({ search: '', itemType: '', status: '' });

  // Phase 40 — staff portal (notices)
  const [noticeForm, setNoticeForm] = useState<NoticeFormState>(createInitialNoticeForm);
  const [noticeEditingId, setNoticeEditingId] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState('');

  const [pestForm, setPestForm] = useState<PestControlFormState>(createInitialPestForm);
  const [pestEditingId, setPestEditingId] = useState<string | null>(null);
  const [pestMessage, setPestMessage] = useState('');
  const [pestFilters, setPestFilters] = useState<PestControlFilters>({ search: '', activityType: '', pestType: '', serviceWindow: 'all' });

  const [foreignObjectForm, setForeignObjectForm] = useState<ForeignObjectFormState>(createInitialForeignObjectForm);
  const [foreignObjectEditingId, setForeignObjectEditingId] = useState<string | null>(null);
  const [foreignObjectMessage, setForeignObjectMessage] = useState('');
  const [foreignObjectFilters, setForeignObjectFilters] = useState<ForeignObjectFilters>({ search: '', area: '', material: '', recordType: '', status: '' });

  const [toolBladeForm, setToolBladeForm] = useState<ToolBladeFormState>(createInitialToolBladeForm);
  const [toolBladeEditingId, setToolBladeEditingId] = useState<string | null>(null);
  const [toolBladeMessage, setToolBladeMessage] = useState('');
  const [toolBladeFilters, setToolBladeFilters] = useState<ToolBladeFilters>({ search: '', itemType: '', status: '', criticalOnly: false });

  const [visitorForm, setVisitorForm] = useState<VisitorLogFormState>(createInitialVisitorForm);
  const [visitorEditingId, setVisitorEditingId] = useState<string | null>(null);
  const [visitorMessage, setVisitorMessage] = useState('');
  const [visitorFilters, setVisitorFilters] = useState<VisitorLogFilters>({ search: '', visitorType: '', dateWindow: '30d' });

  const [sopForm, setSopForm] = useState<SopDocumentFormState>(createInitialSopForm);
  const [sopEditingId, setSopEditingId] = useState<string | null>(null);
  const [sopMessage, setSopMessage] = useState('');
  const [sopFilters, setSopFilters] = useState<SopDocumentFilters>({ search: '', category: '', status: '', reviewStatus: 'all' });

  // Food Safety - Phase 3.5: NCR + CAPA
  const [ncrForm, setNcrForm] = useState<NonConformanceFormState>(createInitialNcrForm);
  const [ncrEditingId, setNcrEditingId] = useState<string | null>(null);
  const [ncrMessage, setNcrMessage] = useState('');
  const [ncrFilters, setNcrFilters] = useState<NonConformanceFilters>({
    search: '',
    area: '',
    issueType: '',
    severity: '',
    status: '',
    overdue: 'all',
    dateWindow: '30d',
  });

  const [productionForm, setProductionForm] = useState(createInitialProductionForm);
  const [productionEditingId, setProductionEditingId] = useState<string | null>(null);
  const [productionMessage, setProductionMessage] = useState('');
  const [productionFilters, setProductionFilters] = useState<ProductionFilters>({ search: '', month: '', logType: '', machine: '', fsc: 'all' });

  const [wasteForm, setWasteForm] = useState(createInitialWasteForm);
  const [wasteEditingId, setWasteEditingId] = useState<string | null>(null);
  const [wasteMessage, setWasteMessage] = useState('');
  const [wasteFilters, setWasteFilters] = useState<WasteFilters>({ search: '', month: '', customer: '', reason: '', fsc: 'all' });

  const [paperForm, setPaperForm] = useState(createInitialPaperForm);
  const [paperEditingId, setPaperEditingId] = useState<string | null>(null);
  const [paperMessage, setPaperMessage] = useState('');
  const [paperFilters, setPaperFilters] = useState<PaperFilters>({ search: '', month: '', paperType: '', gsm: '', fsc: 'all' });

  const [dispatchForm, setDispatchForm] = useState(createInitialDispatchForm);
  const [dispatchEditingId, setDispatchEditingId] = useState<string | null>(null);
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchFilters, setDispatchFilters] = useState<DispatchFilters>({ search: '', month: '', customer: '', fsc: 'all' });
  const [deliveryNoteForm, setDeliveryNoteForm] = useState(createInitialDeliveryNoteForm);
  const [deliveryNoteEditingId, setDeliveryNoteEditingId] = useState<string | null>(null);
  const [deliveryNoteMessage, setDeliveryNoteMessage] = useState('');
  const [deliveryNoteFilters, setDeliveryNoteFilters] = useState<DeliveryNoteFilters>({ search: '', month: '', client: '', status: '', visibility: 'all' });
  const [invoiceForm, setInvoiceForm] = useState(createInitialInvoiceForm);
  const [invoiceEditingId, setInvoiceEditingId] = useState<string | null>(null);
  const [invoiceMessage, setInvoiceMessage] = useState('');
  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceFilters>({ search: '', month: '', client: '', status: '', stockHolding: '' });
  const [productionSpecForm, setProductionSpecForm] = useState(createInitialProductionSpecForm);
  const [productionSpecEditingId, setProductionSpecEditingId] = useState<string | null>(null);
  const [productionSpecMessage, setProductionSpecMessage] = useState('');
  const [productionSpecFilters, setProductionSpecFilters] = useState<ProductionSpecFilters>({ search: '', client: '', status: '', product: '' });
  const [settingsForm, setSettingsForm] = useState<AppSettingsFormState>(() => buildSettingsForm(data.appSettings));
  const [settingsMessage, setSettingsMessage] = useState('');
  const settingsHydratedAt = useRef<string>('');

  // Reload the form state when Supabase responds with a fresh settings row, but
  // only if the user hasn't started editing — otherwise we'd stomp their typing.
  useEffect(() => {
    const fingerprint = JSON.stringify(data.appSettings);
    if (settingsHydratedAt.current === fingerprint) return;
    if (settingsHydratedAt.current === '' || !settingsMessage) {
      setSettingsForm(buildSettingsForm(data.appSettings));
    }
    settingsHydratedAt.current = fingerprint;
  }, [data.appSettings, settingsMessage]);

  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    month: currentMonth,
    dateFrom: '',
    dateTo: '',
    jobNumber: '',
    customer: '',
    fsc: 'all',
    status: '',
    wasteReason: '',
    paperType: '',
  });

  const navItems = useMemo(
    () => {
      const perms = [...(profile?.permissions ?? [])];
      // Phase 38b: surface the combined Contamination Control nav entry for
      // anyone with either underlying permission — they still go to the same
      // wrapper page; the tabs inside gate by their actual access.
      if ((perms.includes('foreignObjectControl') || perms.includes('pestControl')) && !perms.includes('contaminationControl')) {
        perms.push('contaminationControl');
      }
      return perms
        .sort((left, right) => VIEW_ORDER.indexOf(left) - VIEW_ORDER.indexOf(right))
        .map((permission) => ({ key: permission, label: VIEW_LABELS[permission] }));
    },
    [profile?.permissions],
  );
  const allowedViews = useMemo(() => new Set(navItems.map((item) => item.key)), [navItems]);
  const canManageCostInputs = allowedViews.has('costInputs');
  const canViewInternalCalculatorCosts = canManageCostInputs;

  // Live accounts-receivable balance per client, derived from unpaid invoices,
  // so credit checks fire on real numbers rather than a stale stored field.
  const clientArOutstanding = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of data.invoices) {
      if (inv.status === 'Draft' || inv.status === 'Cancelled') continue;
      map.set(inv.clientId, (map.get(inv.clientId) || 0) + (Number(inv.amountOutstanding) || 0));
    }
    return map;
  }, [data.invoices]);
  function effectiveClientBalance(client: Client): number {
    if (clientArOutstanding.has(client.id)) {
      return Math.round((clientArOutstanding.get(client.id)! + (Number(client.openingBalance) || 0)) * 100) / 100;
    }
    return Number(client.currentBalance) || 0;
  }

  // Cmd-K / Ctrl-K — toggle the global command palette. Registered once at the
  // App level so the shortcut works on any view. Skip if the user is typing in
  // a textarea or contenteditable region.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (!isCmdK) return;
      e.preventDefault();
      setPaletteOpen((open) => !open);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!allowedViews.has(view)) {
      setView(navItems[0]?.key ?? 'dashboard');
    }
  }, [allowedViews, navItems, view]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleChangePassword() {
    const newPassword = window.prompt('Enter a new password (at least 6 characters):');
    if (newPassword === null) return; // cancelled
    if (newPassword.length < 6) {
      window.alert('Password must be at least 6 characters.');
      return;
    }
    const confirmPassword = window.prompt('Re-enter the new password to confirm:');
    if (confirmPassword === null) return;
    if (confirmPassword !== newPassword) {
      window.alert('The passwords did not match — nothing was changed.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    window.alert(error ? `Could not change password: ${error.message}` : 'Your password has been updated.');
  }

  const monthOptions = useMemo(() => getMonthOptions(data), [data]);
  const suppliersById = useMemo(() => new Map(data.suppliers.map((supplier) => [supplier.id, supplier])), [data.suppliers]);
  const machinesById = useMemo(() => new Map(data.machines.map((machine) => [machine.id, machine])), [data.machines]);
  const paperRatesById = useMemo(() => new Map(data.paperRates.map((rate) => [rate.id, rate])), [data.paperRates]);
  const costProfilesById = useMemo(() => new Map(data.costProfiles.map((profile) => [profile.id, profile])), [data.costProfiles]);
  const tiersById = useMemo(() => new Map(data.pricingTiers.map((tier) => [tier.id, tier])), [data.pricingTiers]);
  const clientsById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const productsById = useMemo(() => new Map(data.products.map((product) => [product.id, product])), [data.products]);
  const quotesById = useMemo(() => new Map(data.quoteEstimates.map((quote) => [quote.id, quote])), [data.quoteEstimates]);
  const jobsById = useMemo(() => new Map(data.jobs.map((job) => [job.id, job])), [data.jobs]);
  const finishedStockById = useMemo(() => new Map(data.finishedGoodsStock.map((item) => [item.id, item])), [data.finishedGoodsStock]);
  const materialsById = useMemo(() => new Map(data.materialReceipts.map((receipt) => [receipt.id, receipt])), [data.materialReceipts]);
  const productionLogsById = useMemo(() => new Map(data.productionLogs.map((log) => [log.id, log])), [data.productionLogs]);
  const barcodeIndex = useMemo(() => {
    const entries: Array<[string, { itemType: InventoryItemType; item: FinishedGoodsStock | SparePart | MaterialReceipt }]> = [];
    data.finishedGoodsStock.forEach((item) => {
      if (item.barcode) entries.push([item.barcode.toLowerCase(), { itemType: 'Finished Goods', item }]);
    });
    data.spareParts.forEach((item) => {
      if (item.barcode) entries.push([item.barcode.toLowerCase(), { itemType: 'Spare Part', item }]);
    });
    data.materialReceipts.forEach((item) => {
      if (item.barcode) entries.push([item.barcode.toLowerCase(), { itemType: 'Material Lot', item }]);
    });
    return new Map(entries);
  }, [data.finishedGoodsStock, data.materialReceipts, data.spareParts]);
  const isSalesUser = profile?.role === 'sales';
  const currentSalesOwner = profile?.fullName || profile?.email || '';

  const dashboardJobs = useMemo(() => data.jobs.filter((job) => getMonthKey(job.jobDate) === dashboardMonth), [dashboardMonth, data.jobs]);
  const dashboardMaterials = useMemo(() => data.materialReceipts.filter((receipt) => getMonthKey(receipt.receivedDate) === dashboardMonth), [dashboardMonth, data.materialReceipts]);
  const dashboardProductionLogs = useMemo(() => data.productionLogs.filter((log) => getMonthKey(log.logDate) === dashboardMonth), [dashboardMonth, data.productionLogs]);
  const dashboardWaste = useMemo(() => data.wasteEntries.filter((entry) => getMonthKey(entry.wasteDate) === dashboardMonth), [dashboardMonth, data.wasteEntries]);
  const dashboardPaper = useMemo(() => data.paperLogs.filter((log) => getMonthKey(log.logDate) === dashboardMonth), [dashboardMonth, data.paperLogs]);
  const dashboardDispatch = useMemo(() => data.dispatchRecords.filter((record) => getMonthKey(record.dispatchDate) === dashboardMonth), [dashboardMonth, data.dispatchRecords]);
  const dashboardFinishedStock = useMemo(() => data.finishedGoodsStock.filter((item) => getMonthKey(item.storedDate) === dashboardMonth), [dashboardMonth, data.finishedGoodsStock]);

  // Phase 18 realtime sync — TEMPORARILY DISABLED.
  // The naive implementation created a write storm: a save fires a
  // postgres_changes event, the hook merged it back into `data`, which
  // re-triggered the auto-save effect in useProductionData, looping
  // forever and deadlocking the `clients` table. Re-enable only once the
  // hook tags remote-originated changes so they don't re-trigger a save.
  // useRealtimeSync(setData, { selfUserId: profile?.id });
  void useRealtimeSync;

  // Phase 16 — auto-derived notifications powering the topbar bell.
  const { notifications, unreadCount, markRead, markAllRead, isRead } = useNotifications(data);

  // Phase 17 cleanup — flush queued PODs on mount + when the device
  // comes back online. Synced PODs get merged into React state so the
  // POD list updates without a full reload.
  useEffect(() => {
    const detach = attachAutoFlush(({ synced, failed }) => {
      if (synced.length === 0 && failed.length === 0) return;
      setData((current) => {
        const byId = new Map(current.proofOfDeliveries.map((p) => [p.id, p]));
        for (const p of [...synced, ...failed]) byId.set(p.id, p);
        return { ...current, proofOfDeliveries: Array.from(byId.values()) };
      });
    });
    return detach;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const topbarAction = (
    <NotificationBell
      notifications={notifications}
      unreadCount={unreadCount}
      isRead={isRead}
      onOpen={(n) => markRead(n.id)}
      onMarkAllRead={markAllRead}
      onNavigate={(v) => setView(v)}
    />
  );

  const topbarSummary = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    type Chip = { label: string; value: number | string; tone?: 'warn' | 'alert' };
    const renderChips = (items: Chip[]) => (
      <>
        {items.map((item) => (
          <span key={item.label} className={item.tone ? `topbar-chip is-${item.tone}` : 'topbar-chip'}>
            <span className="topbar-chip-label">{item.label}</span>
            <strong className="topbar-chip-value">{item.value}</strong>
          </span>
        ))}
      </>
    );

    switch (view) {
      case 'dashboard': {
        const openJobs = dashboardJobs.filter((job) => job.status !== 'Completed').length;
        const awaitingArtwork = dashboardJobs.filter((job) => !job.artworkReceived && job.status !== 'Completed').length;
        const overdue = dashboardJobs.filter((job) => job.dueDate && job.dueDate < todayStr && job.status !== 'Completed').length;
        const overCredit = data.clients.filter((client) => client.creditLimit > 0 && effectiveClientBalance(client) > client.creditLimit).length;
        const onHold = data.clients.filter((client) => client.accountHold).length;
        return renderChips([
          { label: 'Open jobs', value: openJobs },
          { label: 'Awaiting artwork', value: awaitingArtwork, tone: awaitingArtwork > 0 ? 'warn' : undefined },
          { label: 'Overdue', value: overdue, tone: overdue > 0 ? 'alert' : undefined },
          { label: 'Over credit', value: overCredit, tone: overCredit > 0 ? 'alert' : undefined },
          { label: 'On hold', value: onHold, tone: onHold > 0 ? 'warn' : undefined },
        ]);
      }
      case 'salesDesk': {
        const open = data.quoteEstimates.filter((q) => q.status === 'Draft' || q.status === 'Quoted' || q.status === 'Approved').length;
        const converted = data.quoteEstimates.filter((q) => q.status === 'Converted to Job').length;
        const lost = data.quoteEstimates.filter((q) => q.status === 'Lost').length;
        const activeOrders = data.jobs.filter((j) => j.status !== 'Completed').length;
        return renderChips([
          { label: 'Open quotes', value: open },
          { label: 'Converted', value: converted },
          { label: 'Active orders', value: activeOrders },
          { label: 'Lost', value: lost, tone: lost > 0 ? 'warn' : undefined },
        ]);
      }
      case 'leads': {
        const newLeads = data.leads.filter((l) => l.status === 'New').length;
        const qualified = data.leads.filter((l) => l.status === 'Qualified').length;
        const awaitingInfo = data.leads.filter((l) => l.status === 'Awaiting Info').length;
        const won = data.leads.filter((l) => l.status === 'Won').length;
        return renderChips([
          { label: 'New', value: newLeads, tone: newLeads > 0 ? 'warn' : undefined },
          { label: 'Qualified', value: qualified },
          { label: 'Awaiting info', value: awaitingInfo, tone: awaitingInfo > 0 ? 'warn' : undefined },
          { label: 'Won', value: won },
        ]);
      }
      case 'quotes': {
        const draft = data.quoteEstimates.filter((q) => q.status === 'Draft').length;
        const quoted = data.quoteEstimates.filter((q) => q.status === 'Quoted').length;
        const approved = data.quoteEstimates.filter((q) => q.status === 'Approved').length;
        const converted = data.quoteEstimates.filter((q) => q.status === 'Converted to Job').length;
        return renderChips([
          { label: 'Draft', value: draft },
          { label: 'Quoted', value: quoted },
          { label: 'Approved', value: approved, tone: approved > 0 ? 'warn' : undefined },
          { label: 'Converted', value: converted },
        ]);
      }
      case 'artwork': {
        const awaiting = data.artworkRecords.filter((a) => a.stage === 'Awaiting Artwork').length;
        const proof = data.artworkRecords.filter((a) => a.stage === 'Proof Sent').length;
        const changes = data.artworkRecords.filter((a) => a.stage === 'Changes Requested').length;
        const approved = data.artworkRecords.filter((a) => a.stage === 'Approved').length;
        return renderChips([
          { label: 'Awaiting', value: awaiting, tone: awaiting > 0 ? 'warn' : undefined },
          { label: 'Proof sent', value: proof },
          { label: 'Changes', value: changes, tone: changes > 0 ? 'alert' : undefined },
          { label: 'Approved', value: approved },
        ]);
      }
      case 'jobs': {
        const open = data.jobs.filter((j) => j.status !== 'Completed').length;
        const awaitingArtwork = data.jobs.filter((j) => !j.artworkReceived && j.status !== 'Completed').length;
        const overdue = data.jobs.filter((j) => j.dueDate && j.dueDate < todayStr && j.status !== 'Completed').length;
        const completed = data.jobs.filter((j) => j.status === 'Completed').length;
        return renderChips([
          { label: 'Open', value: open },
          { label: 'Awaiting artwork', value: awaitingArtwork, tone: awaitingArtwork > 0 ? 'warn' : undefined },
          { label: 'Overdue', value: overdue, tone: overdue > 0 ? 'alert' : undefined },
          { label: 'Completed', value: completed },
        ]);
      }
      case 'clients': {
        const active = data.clients.filter((c) => c.active).length;
        const onHold = data.clients.filter((c) => c.accountHold).length;
        const overCredit = data.clients.filter((c) => c.creditLimit > 0 && effectiveClientBalance(c) > c.creditLimit).length;
        return renderChips([
          { label: 'Active', value: active },
          { label: 'On hold', value: onHold, tone: onHold > 0 ? 'warn' : undefined },
          { label: 'Over credit', value: overCredit, tone: overCredit > 0 ? 'alert' : undefined },
        ]);
      }
      case 'finishedStock': {
        const inStorage = data.finishedGoodsStock.filter((s) => s.stockStatus === 'In Storage').length;
        const reserved = data.finishedGoodsStock.filter((s) => s.stockStatus === 'Reserved').length;
        const ready = data.finishedGoodsStock.filter((s) => s.stockStatus === 'Ready to Dispatch').length;
        const dispatched = data.finishedGoodsStock.filter((s) => s.stockStatus === 'Dispatched').length;
        return renderChips([
          { label: 'In storage', value: inStorage },
          { label: 'Reserved', value: reserved, tone: reserved > 0 ? 'warn' : undefined },
          { label: 'Ready', value: ready },
          { label: 'Dispatched', value: dispatched },
        ]);
      }
      case 'spares': {
        const total = data.spareParts.length;
        const lowStock = data.spareParts.filter((s) => s.reorderLevel > 0 && s.quantityOnHand <= s.reorderLevel).length;
        return renderChips([
          { label: 'Parts', value: total },
          { label: 'Low stock', value: lowStock, tone: lowStock > 0 ? 'alert' : undefined },
        ]);
      }
      case 'suppliers': {
        const active = data.suppliers.filter((s) => s.active).length;
        const inactive = data.suppliers.filter((s) => !s.active).length;
        return renderChips([
          { label: 'Active', value: active },
          { label: 'Inactive', value: inactive },
        ]);
      }
      case 'machines': {
        const active = data.machines.filter((m) => m.active && m.status === 'Active').length;
        const maintenance = data.machines.filter((m) => m.status === 'Maintenance').length;
        const offline = data.machines.filter((m) => m.status === 'Offline').length;
        return renderChips([
          { label: 'Active', value: active },
          { label: 'Maintenance', value: maintenance, tone: maintenance > 0 ? 'warn' : undefined },
          { label: 'Offline', value: offline, tone: offline > 0 ? 'alert' : undefined },
        ]);
      }
      case 'products': {
        const active = data.products.filter((p) => p.active).length;
        const total = data.products.length;
        return renderChips([
          { label: 'Active', value: active },
          { label: 'Total', value: total },
        ]);
      }
      case 'pricing': {
        return renderChips([
          { label: 'Tiers', value: data.pricingTiers.length },
        ]);
      }
      case 'materials': {
        const monthReceipts = data.materialReceipts.filter((r) => getMonthKey(r.receivedDate) === dashboardMonth);
        const fsc = monthReceipts.filter((r) => r.fscRelated).length;
        return renderChips([
          { label: 'This month', value: monthReceipts.length },
          { label: 'FSC related', value: fsc },
        ]);
      }
      case 'production': {
        const monthLogs = data.productionLogs.filter((l) => getMonthKey(l.logDate) === dashboardMonth);
        const fsc = monthLogs.filter((l) => l.fscRelated).length;
        return renderChips([
          { label: 'This month', value: monthLogs.length },
          { label: 'FSC related', value: fsc },
        ]);
      }
      case 'waste': {
        const monthEntries = data.wasteEntries.filter((e) => getMonthKey(e.wasteDate) === dashboardMonth);
        const fsc = monthEntries.filter((e) => e.fscRelated).length;
        return renderChips([
          { label: 'Records (month)', value: monthEntries.length },
          { label: 'FSC related', value: fsc },
        ]);
      }
      case 'paper': {
        const monthLogs = data.paperLogs.filter((l) => getMonthKey(l.logDate) === dashboardMonth);
        return renderChips([
          { label: 'Logs (month)', value: monthLogs.length },
        ]);
      }
      case 'dispatch': {
        const monthDispatch = data.dispatchRecords.filter((r) => getMonthKey(r.dispatchDate) === dashboardMonth);
        return renderChips([
          { label: 'Dispatched (month)', value: monthDispatch.length },
        ]);
      }
      case 'deliveryNotes': {
        const draft = data.deliveryNotes.filter((d) => d.status === 'Draft').length;
        const issued = data.deliveryNotes.filter((d) => d.status === 'Issued').length;
        const delivered = data.deliveryNotes.filter((d) => d.status === 'Delivered').length;
        return renderChips([
          { label: 'Draft', value: draft, tone: draft > 0 ? 'warn' : undefined },
          { label: 'Issued', value: issued },
          { label: 'Delivered', value: delivered },
        ]);
      }
      case 'customerStock': {
        const monthReleases = data.customerStockReleases.filter((r) => getMonthKey(r.releaseDate) === dashboardMonth);
        return renderChips([
          { label: 'Releases (month)', value: monthReleases.length },
        ]);
      }
      case 'invoices': {
        const total = data.invoices.length;
        const outstanding = data.invoices.reduce((acc, inv) => acc + (inv.amountOutstanding || 0), 0);
        const stockHolding = data.invoices.filter((inv) => inv.stockHoldingApplies && inv.stockHoldingStatus === 'Active').length;
        return renderChips([
          { label: 'Invoices', value: total },
          { label: 'Outstanding', value: outstanding > 0 ? `R ${outstanding.toFixed(0)}` : '0' },
          { label: 'Active stock-holding', value: stockHolding, tone: stockHolding > 0 ? 'warn' : undefined },
        ]);
      }
      case 'productionSpecs': {
        const total = data.productionSpecs.length;
        const inProduction = data.productionSpecs.filter((s) => s.status === 'In Production').length;
        return renderChips([
          { label: 'Specs', value: total },
          { label: 'In production', value: inProduction },
        ]);
      }
      default:
        return undefined;
    }
  }, [view, dashboardJobs, dashboardMonth, data]);

  useEffect(() => {
    if (loading) {
      return;
    }
    const hasCurrentMonthData = data.jobs.some((job) => getMonthKey(job.jobDate) === dashboardMonth)
      || data.materialReceipts.some((receipt) => getMonthKey(receipt.receivedDate) === dashboardMonth)
      || data.productionLogs.some((log) => getMonthKey(log.logDate) === dashboardMonth)
      || data.wasteEntries.some((entry) => getMonthKey(entry.wasteDate) === dashboardMonth)
      || data.paperLogs.some((log) => getMonthKey(log.logDate) === dashboardMonth)
      || data.dispatchRecords.some((record) => getMonthKey(record.dispatchDate) === dashboardMonth)
      || data.finishedGoodsStock.some((item) => getMonthKey(item.storedDate) === dashboardMonth);

    if (!hasCurrentMonthData && monthOptions.length && dashboardMonth === currentMonth) {
      setDashboardMonth(monthOptions[0]);
    }
  }, [dashboardMonth, data.dispatchRecords, data.finishedGoodsStock, data.jobs, data.materialReceipts, data.paperLogs, data.productionLogs, data.wasteEntries, loading, monthOptions]);

  const filteredSuppliers = useMemo(() => data.suppliers.filter((supplier) => {
    const contactValues = supplier.contacts.flatMap((contact) => [contact.fullName, contact.role, contact.email, contact.phone]);
    const matchesSearch = !supplierFilters.search || [supplier.name, supplier.contactPerson, supplier.email, supplier.phone, ...contactValues].some((value) => matchesText(value, supplierFilters.search));
    const matchesType = !supplierFilters.supplierType || supplier.supplierType === supplierFilters.supplierType;
    const matchesActive = supplierFilters.active === 'all' || (supplierFilters.active === 'yes' ? supplier.active : !supplier.active);
    return matchesSearch && matchesType && matchesActive;
  }), [data.suppliers, supplierFilters]);

  const filteredMachines = useMemo(() => data.machines.filter((machine) => {
    const matchesSearch = !machineFilters.search || [machine.name, machine.code, machine.department, machine.processType].some((value) => matchesText(value, machineFilters.search));
    const matchesStatus = !machineFilters.status || machine.status === machineFilters.status;
    const matchesProcess = !machineFilters.processType || matchesText(machine.processType, machineFilters.processType);
    const matchesActive = machineFilters.active === 'all' || (machineFilters.active === 'yes' ? machine.active : !machine.active);
    return matchesSearch && matchesStatus && matchesProcess && matchesActive;
  }), [data.machines, machineFilters]);

  const filteredPricingTiers = useMemo(() => data.pricingTiers.filter((tier) => {
    const matchesSearch = !tierFilters.search || [tier.name, tier.type].some((value) => matchesText(value, tierFilters.search));
    const matchesType = !tierFilters.type || tier.type === tierFilters.type;
    return matchesSearch && matchesType;
  }), [data.pricingTiers, tierFilters]);

  const filteredPaperRates = useMemo(() => data.paperRates.filter((rate) => {
    const matchesSearch = !paperRateFilters.search || [rate.name, rate.supplierName, rate.paperType, rate.gsm].some((value) => matchesText(value, paperRateFilters.search));
    const matchesActive = paperRateFilters.active === 'all' || (paperRateFilters.active === 'yes' ? rate.active : !rate.active);
    return matchesSearch && matchesActive;
  }), [data.paperRates, paperRateFilters]);

  const filteredCostProfiles = useMemo(() => data.costProfiles.filter((profile) => {
    const matchesSearch = !costProfileFilters.search || matchesText(profile.name, costProfileFilters.search);
    const matchesActive = costProfileFilters.active === 'all' || (costProfileFilters.active === 'yes' ? profile.active : !profile.active);
    return matchesSearch && matchesActive;
  }), [data.costProfiles, costProfileFilters]);

  const filteredClients = useMemo(() => data.clients.filter((client) => {
    const matchesSearch = !clientFilters.search || [client.name, client.code, client.pricingTierName].some((value) => matchesText(value, clientFilters.search));
    const matchesType = !clientFilters.clientType || client.clientType === clientFilters.clientType;
    const matchesActive = clientFilters.active === 'all' || (clientFilters.active === 'yes' ? client.active : !client.active);
    return matchesSearch && matchesType && matchesActive;
  }), [data.clients, clientFilters]);

  const filteredProducts = useMemo(() => data.products.filter((product) => {
    const matchesSearch = !productFilters.search || [product.name, product.sku, product.category].some((value) => matchesText(value, productFilters.search));
    const matchesCategory = !productFilters.category || product.category === productFilters.category;
    const matchesSupply = !productFilters.supplyType || product.supplyType === productFilters.supplyType;
    const matchesActive = productFilters.active === 'all' || (productFilters.active === 'yes' ? product.active : !product.active);
    return matchesSearch && matchesCategory && matchesSupply && matchesActive;
  }), [data.products, productFilters]);

  const filteredJobs = useMemo(() => data.jobs.filter((job) => {
    const matchesSalesOwner = !isSalesUser || matchesText(job.salesOwnerName, currentSalesOwner);
    const matchesSearch = !jobFilters.search || [job.jobNumber, job.customerName, job.productName, job.paperType, job.customerReference].some((value) => matchesText(value, jobFilters.search));
    const matchesMonth = !jobFilters.month || getMonthKey(job.jobDate) === jobFilters.month;
    const matchesStatus = !jobFilters.status || job.status === jobFilters.status;
    const matchesCustomer = !jobFilters.customer || matchesText(job.customerName, jobFilters.customer);
    const matchesFsc = jobFilters.fsc === 'all' || (jobFilters.fsc === 'yes' ? job.fscRelated : !job.fscRelated);
    return matchesSalesOwner && matchesSearch && matchesMonth && matchesStatus && matchesCustomer && matchesFsc;
  }), [currentSalesOwner, data.jobs, isSalesUser, jobFilters]);

  const filteredFinishedStock = useMemo(() => data.finishedGoodsStock.filter((item) => {
    const matchesSearch = !stockFilters.search || [item.stockNumber, item.barcode, item.productName, item.clientName, item.jobNumber, item.storageLocation].some((value) => matchesText(value, stockFilters.search));
    const matchesClient = !stockFilters.client || matchesText(item.clientName, stockFilters.client);
    const matchesStatus = !stockFilters.status || item.stockStatus === stockFilters.status;
    const matchesProduct = !stockFilters.product || matchesText(item.productName, stockFilters.product);
    return matchesSearch && matchesClient && matchesStatus && matchesProduct;
  }), [data.finishedGoodsStock, stockFilters]);

  const filteredSpareParts = useMemo(() => data.spareParts.filter((part) => {
    const matchesSearch = !spareFilters.search || [part.partName, part.partCode, part.barcode, part.machineReference, part.storageLocation].some((value) => matchesText(value, spareFilters.search));
    const matchesCategory = !spareFilters.category || matchesText(part.category, spareFilters.category);
    const matchesSupplier = !spareFilters.supplier || matchesText(part.supplierName, spareFilters.supplier);
    const isLowStock = part.quantityOnHand <= (part.reorderLevel || part.minimumStockLevel);
    const matchesLowStock = spareFilters.lowStock === 'all' || (spareFilters.lowStock === 'yes' ? isLowStock : !isLowStock);
    return matchesSearch && matchesCategory && matchesSupplier && matchesLowStock;
  }), [data.spareParts, spareFilters]);

  const filteredStockIssues = useMemo(() => data.stockIssues.filter((issue) => {
    const matchesSearch = !stockIssueFilters.search
      || [issue.itemName, issue.issuedToName, issue.issuedByName, issue.jobNumber, issue.notes].some((value) => matchesText(value, stockIssueFilters.search));
    const matchesStatus = stockIssueFilters.status === 'all' || issue.status === stockIssueFilters.status;
    const matchesType = stockIssueFilters.itemType === 'all' || issue.itemType === stockIssueFilters.itemType;
    return matchesSearch && matchesStatus && matchesType;
  }), [data.stockIssues, stockIssueFilters]);

  const filteredMaterialReceipts = useMemo(() => data.materialReceipts.filter((receipt) => {
    const matchesSearch = !materialFilters.search || [receipt.receiptNumber, receipt.internalRollCode, receipt.barcode, receipt.supplierName, receipt.supplierBatchNumber].some((value) => matchesText(value, materialFilters.search));
    const matchesMonth = !materialFilters.month || getMonthKey(receipt.receivedDate) === materialFilters.month;
    const matchesSupplier = !materialFilters.supplier || matchesText(receipt.supplierName, materialFilters.supplier);
    const matchesPaperType = !materialFilters.paperType || matchesText(receipt.paperType, materialFilters.paperType);
    const matchesFsc = materialFilters.fsc === 'all' || (materialFilters.fsc === 'yes' ? receipt.fscRelated : !receipt.fscRelated);
    return matchesSearch && matchesMonth && matchesSupplier && matchesPaperType && matchesFsc;
  }), [data.materialReceipts, materialFilters]);

  const scannedInventoryMatch = useMemo(() => {
    const barcode = inventoryScanForm.barcode.trim().toLowerCase();
    return barcode ? barcodeIndex.get(barcode) ?? null : null;
  }, [barcodeIndex, inventoryScanForm.barcode]);

  const filteredProductionLogs = useMemo(() => data.productionLogs.filter((log) => {
    const matchesSearch = !productionFilters.search || [log.logNumber, log.jobNumber, log.operatorName, log.machine, log.sourceMaterialCode].some((value) => matchesText(value, productionFilters.search));
    const matchesMonth = !productionFilters.month || getMonthKey(log.logDate) === productionFilters.month;
    const matchesType = !productionFilters.logType || log.logType === productionFilters.logType;
    const matchesMachine = !productionFilters.machine || matchesText(log.machine, productionFilters.machine);
    const matchesFsc = productionFilters.fsc === 'all' || (productionFilters.fsc === 'yes' ? log.fscRelated : !log.fscRelated);
    return matchesSearch && matchesMonth && matchesType && matchesMachine && matchesFsc;
  }), [data.productionLogs, productionFilters]);

  const filteredWasteEntries = useMemo(() => data.wasteEntries.filter((entry) => {
    const matchesSearch = !wasteFilters.search || [entry.wasteNumber, entry.jobNumber, entry.customerName, entry.productName, entry.productionLogNumber].some((value) => matchesText(value, wasteFilters.search));
    const matchesMonth = !wasteFilters.month || getMonthKey(entry.wasteDate) === wasteFilters.month;
    const matchesCustomer = !wasteFilters.customer || matchesText(entry.customerName, wasteFilters.customer);
    const matchesReason = !wasteFilters.reason || entry.wasteReason === wasteFilters.reason;
    const matchesFsc = wasteFilters.fsc === 'all' || (wasteFilters.fsc === 'yes' ? entry.fscRelated : !entry.fscRelated);
    return matchesSearch && matchesMonth && matchesCustomer && matchesReason && matchesFsc;
  }), [data.wasteEntries, wasteFilters]);

  const filteredPaperLogs = useMemo(() => data.paperLogs.filter((log) => {
    const matchesSearch = !paperFilters.search || [log.paperLogNumber, log.jobNumber, log.paperType, log.paperCode, log.customerName, log.materialReceiptNumber].some((value) => matchesText(value, paperFilters.search));
    const matchesMonth = !paperFilters.month || getMonthKey(log.logDate) === paperFilters.month;
    const matchesPaperType = !paperFilters.paperType || matchesText(log.paperType, paperFilters.paperType);
    const matchesGsm = !paperFilters.gsm || matchesText(log.gsm, paperFilters.gsm);
    const matchesFsc = paperFilters.fsc === 'all' || (paperFilters.fsc === 'yes' ? log.fscRelated : !log.fscRelated);
    return matchesSearch && matchesMonth && matchesPaperType && matchesGsm && matchesFsc;
  }), [data.paperLogs, paperFilters]);

  const filteredDispatchRecords = useMemo(() => data.dispatchRecords.filter((record) => {
    const linkedJob = record.jobId ? jobsById.get(record.jobId) : undefined;
    const matchesSalesOwner = !isSalesUser || matchesText(linkedJob?.salesOwnerName ?? '', currentSalesOwner);
    const matchesSearch = !dispatchFilters.search || [record.dispatchNumber, record.jobNumber, record.customerName, record.labelReference, record.deliveryReference].some((value) => matchesText(value, dispatchFilters.search));
    const matchesMonth = !dispatchFilters.month || getMonthKey(record.dispatchDate) === dispatchFilters.month;
    const matchesCustomer = !dispatchFilters.customer || matchesText(record.customerName, dispatchFilters.customer);
    const matchesFsc = dispatchFilters.fsc === 'all' || (dispatchFilters.fsc === 'yes' ? record.fscRelated : !record.fscRelated);
    return matchesSalesOwner && matchesSearch && matchesMonth && matchesCustomer && matchesFsc;
  }), [currentSalesOwner, data.dispatchRecords, dispatchFilters, isSalesUser, jobsById]);

  const filteredQuoteEstimates = useMemo(() => data.quoteEstimates.filter((quote) => {
    const matchesSalesOwner = !isSalesUser || matchesText(quote.salesOwnerName, currentSalesOwner);
    const matchesSearch = !quoteFilters.search || [quote.quoteNumber, quote.quickbooksEstimateNumber, quote.clientName, quote.productName, quote.sizeSpec].some((value) => matchesText(value, quoteFilters.search));
    const matchesMonth = !quoteFilters.month || getMonthKey(quote.quoteDate) === quoteFilters.month;
    const matchesStatus = !quoteFilters.status || quote.status === quoteFilters.status;
    const matchesClient = !quoteFilters.client || matchesText(quote.clientName, quoteFilters.client);
    return matchesSalesOwner && matchesSearch && matchesMonth && matchesStatus && matchesClient;
  }), [currentSalesOwner, data.quoteEstimates, isSalesUser, quoteFilters]);

  const filteredWorkTickets = useMemo(() => data.workTickets.filter((ticket) => {
    const matchesSearch = !workTicketFilters.search || [ticket.ticketNumber, ticket.linkedQuoteNumber, ticket.linkedJobNumber, ticket.clientName, ticket.productName, ticket.productDescription, ticket.sizeSpec].some((value) => matchesText(value, workTicketFilters.search));
    const matchesMonth = !workTicketFilters.month || getMonthKey(ticket.ticketDate) === workTicketFilters.month;
    const matchesStatus = !workTicketFilters.status || ticket.status === workTicketFilters.status;
    const matchesClient = !workTicketFilters.client || matchesText(ticket.clientName, workTicketFilters.client);
    return matchesSearch && matchesMonth && matchesStatus && matchesClient;
  }), [data.workTickets, workTicketFilters]);

  const filteredLeads = useMemo(() => data.leads.filter((lead) => {
    const matchesSalesOwner = !isSalesUser || matchesText(lead.assignedTo, currentSalesOwner);
    const matchesSearch = !leadFilters.search || [lead.leadNumber, lead.quickbooksEstimateNumber, lead.companyName, lead.contactName, lead.clientName, lead.productName, lead.notes].some((value) => matchesText(value, leadFilters.search));
    const matchesMonth = !leadFilters.month || getMonthKey(lead.enquiryDate) === leadFilters.month;
    const matchesStatus = !leadFilters.status || lead.status === leadFilters.status;
    const matchesSource = !leadFilters.source || lead.source === leadFilters.source;
    const matchesOwner = !leadFilters.owner || matchesText(lead.assignedTo, leadFilters.owner);
    return matchesSalesOwner && matchesSearch && matchesMonth && matchesStatus && matchesSource && matchesOwner;
  }), [currentSalesOwner, data.leads, isSalesUser, leadFilters]);

  const filteredArtworkRecords = useMemo(() => data.artworkRecords.filter((record) => {
    const matchesSearch = !artworkFilters.search || [record.artworkNumber, record.jobNumber, record.clientName, record.notes].some((value) => matchesText(value, artworkFilters.search));
    const matchesStage = !artworkFilters.stage || record.stage === artworkFilters.stage;
    const matchesClient = !artworkFilters.client || matchesText(record.clientName, artworkFilters.client);
    return matchesSearch && matchesStage && matchesClient;
  }), [data.artworkRecords, artworkFilters]);

  const filteredCustomerStockReleases = useMemo(() => data.customerStockReleases.filter((release) => {
    const linkedJob = release.jobId ? jobsById.get(release.jobId) : undefined;
    const matchesSalesOwner = !isSalesUser || matchesText(linkedJob?.salesOwnerName ?? '', currentSalesOwner);
    const matchesSearch = !customerStockReleaseFilters.search || [release.releaseNumber, release.clientName, release.finishedGoodsStockNumber, release.jobNumber, release.destination].some((value) => matchesText(value, customerStockReleaseFilters.search));
    const matchesMonth = !customerStockReleaseFilters.month || getMonthKey(release.releaseDate) === customerStockReleaseFilters.month;
    const matchesClient = !customerStockReleaseFilters.client || matchesText(release.clientName, customerStockReleaseFilters.client);
    return matchesSalesOwner && matchesSearch && matchesMonth && matchesClient;
  }), [currentSalesOwner, customerStockReleaseFilters, data.customerStockReleases, isSalesUser, jobsById]);
  const filteredDeliveryNotes = useMemo(() => data.deliveryNotes.filter((note) => {
    const linkedJob = note.jobId ? jobsById.get(note.jobId) : undefined;
    const matchesSalesOwner = !isSalesUser || matchesText(linkedJob?.salesOwnerName ?? '', currentSalesOwner);
    const matchesSearch = !deliveryNoteFilters.search || [note.deliveryNoteNumber, note.clientName, note.deliveryReference, note.jobNumber].some((value) => matchesText(value, deliveryNoteFilters.search));
    const matchesMonth = !deliveryNoteFilters.month || getMonthKey(note.noteDate) === deliveryNoteFilters.month;
    const matchesClient = !deliveryNoteFilters.client || matchesText(note.clientName, deliveryNoteFilters.client);
    const matchesStatus = !deliveryNoteFilters.status || note.status === deliveryNoteFilters.status;
    const matchesVisibility = deliveryNoteFilters.visibility === 'all' || (deliveryNoteFilters.visibility === 'client' ? note.clientVisible : !note.clientVisible);
    return matchesSalesOwner && matchesSearch && matchesMonth && matchesClient && matchesStatus && matchesVisibility;
  }), [currentSalesOwner, data.deliveryNotes, deliveryNoteFilters, isSalesUser, jobsById]);

  const filteredInvoices = useMemo(() => data.invoices.filter((invoice) => {
    const matchesSearch = !invoiceFilters.search || [invoice.invoiceNumber, invoice.clientName, invoice.clientCompanyName, invoice.customerReference, invoice.jobNumber].some((value) => matchesText(value, invoiceFilters.search));
    const matchesMonth = !invoiceFilters.month || getMonthKey(invoice.invoiceDate) === invoiceFilters.month;
    const matchesClient = !invoiceFilters.client || matchesText(invoice.clientName, invoiceFilters.client) || matchesText(invoice.clientCompanyName, invoiceFilters.client);
    const matchesStatus = !invoiceFilters.status || invoice.status === invoiceFilters.status;
    const matchesStockHolding = !invoiceFilters.stockHolding
      || (invoiceFilters.stockHolding === 'active' && invoice.stockHoldingApplies)
      || (invoiceFilters.stockHolding === 'standard' && !invoice.stockHoldingApplies);
    return matchesSearch && matchesMonth && matchesClient && matchesStatus && matchesStockHolding;
  }), [data.invoices, invoiceFilters]);

  const filteredProductionSpecs = useMemo(() => data.productionSpecs.filter((spec) => {
    const matchesSearch = !productionSpecFilters.search || [spec.specNumber, spec.clientName, spec.productName, spec.jobNumber, spec.artworkReference].some((value) => matchesText(value, productionSpecFilters.search));
    const matchesClient = !productionSpecFilters.client || matchesText(spec.clientName, productionSpecFilters.client);
    const matchesProduct = !productionSpecFilters.product || matchesText(spec.productName, productionSpecFilters.product);
    const matchesStatus = !productionSpecFilters.status || spec.status === productionSpecFilters.status;
    return matchesSearch && matchesClient && matchesProduct && matchesStatus;
  }), [data.productionSpecs, productionSpecFilters]);

  const reportJobs = useMemo(() => data.jobs.filter((job) => {
    const matchesMonth = !reportFilters.month || getMonthKey(job.jobDate) === reportFilters.month;
    const matchesDate = isWithinDateRange(job.jobDate, reportFilters.dateFrom, reportFilters.dateTo);
    const matchesJobNumber = !reportFilters.jobNumber || matchesText(job.jobNumber, reportFilters.jobNumber);
    const matchesCustomer = !reportFilters.customer || matchesText(job.customerName, reportFilters.customer);
    const matchesStatus = !reportFilters.status || job.status === reportFilters.status;
    const matchesFsc = reportFilters.fsc === 'all' || (reportFilters.fsc === 'yes' ? job.fscRelated : !job.fscRelated);
    return matchesMonth && matchesDate && matchesJobNumber && matchesCustomer && matchesStatus && matchesFsc;
  }), [data.jobs, reportFilters]);

  const reportJobIds = useMemo(() => new Set(reportJobs.map((job) => job.id)), [reportJobs]);

  const reportWasteEntries = useMemo(() => data.wasteEntries.filter((entry) => {
    const matchesJob = !reportJobIds.size || reportJobIds.has(entry.jobId);
    const matchesMonth = !reportFilters.month || getMonthKey(entry.wasteDate) === reportFilters.month;
    const matchesDate = isWithinDateRange(entry.wasteDate, reportFilters.dateFrom, reportFilters.dateTo);
    const matchesJobNumber = !reportFilters.jobNumber || matchesText(entry.jobNumber, reportFilters.jobNumber);
    const matchesCustomer = !reportFilters.customer || matchesText(entry.customerName, reportFilters.customer);
    const matchesReason = !reportFilters.wasteReason || entry.wasteReason === reportFilters.wasteReason;
    const matchesFsc = reportFilters.fsc === 'all' || (reportFilters.fsc === 'yes' ? entry.fscRelated : !entry.fscRelated);
    return matchesJob && matchesMonth && matchesDate && matchesJobNumber && matchesCustomer && matchesReason && matchesFsc;
  }), [data.wasteEntries, reportFilters, reportJobIds]);

  const reportPaperLogs = useMemo(() => data.paperLogs.filter((log) => {
    const matchesJob = !reportJobIds.size || reportJobIds.has(log.jobId);
    const matchesMonth = !reportFilters.month || getMonthKey(log.logDate) === reportFilters.month;
    const matchesDate = isWithinDateRange(log.logDate, reportFilters.dateFrom, reportFilters.dateTo);
    const matchesJobNumber = !reportFilters.jobNumber || matchesText(log.jobNumber, reportFilters.jobNumber);
    const matchesCustomer = !reportFilters.customer || matchesText(log.customerName, reportFilters.customer);
    const matchesPaperType = !reportFilters.paperType || matchesText(log.paperType, reportFilters.paperType);
    const matchesFsc = reportFilters.fsc === 'all' || (reportFilters.fsc === 'yes' ? log.fscRelated : !log.fscRelated);
    return matchesJob && matchesMonth && matchesDate && matchesJobNumber && matchesCustomer && matchesPaperType && matchesFsc;
  }), [data.paperLogs, reportFilters, reportJobIds]);
  const reportDispatchRecords = useMemo(() => data.dispatchRecords.filter((record) => {
    const matchesJob = !reportJobIds.size || reportJobIds.has(record.jobId);
    const matchesMonth = !reportFilters.month || getMonthKey(record.dispatchDate) === reportFilters.month;
    const matchesDate = isWithinDateRange(record.dispatchDate, reportFilters.dateFrom, reportFilters.dateTo);
    const matchesJobNumber = !reportFilters.jobNumber || matchesText(record.jobNumber, reportFilters.jobNumber);
    const matchesCustomer = !reportFilters.customer || matchesText(record.customerName, reportFilters.customer);
    const matchesFsc = reportFilters.fsc === 'all' || (reportFilters.fsc === 'yes' ? record.fscRelated : !record.fscRelated);
    return matchesJob && matchesMonth && matchesDate && matchesJobNumber && matchesCustomer && matchesFsc;
  }), [data.dispatchRecords, reportFilters, reportJobIds]);
  const reportArtworkRecords = useMemo(() => data.artworkRecords.filter((record) => {
    const matchesJob = !reportJobIds.size || reportJobIds.has(record.jobId);
    const candidateDate = record.approvalDate || record.proofSentDate || record.artworkReceivedDate || record.createdAt;
    const dateValue = candidateDate.slice(0, 10);
    const matchesMonth = !reportFilters.month || getMonthKey(dateValue) === reportFilters.month;
    const matchesDate = isWithinDateRange(dateValue, reportFilters.dateFrom, reportFilters.dateTo);
    const matchesJobNumber = !reportFilters.jobNumber || matchesText(record.jobNumber, reportFilters.jobNumber);
    const matchesCustomer = !reportFilters.customer || matchesText(record.clientName, reportFilters.customer);
    return matchesJob && matchesMonth && matchesDate && matchesJobNumber && matchesCustomer;
  }), [data.artworkRecords, reportFilters, reportJobIds]);
  const reportProductionLogs = useMemo(() => data.productionLogs.filter((entry) => {
    const matchesJob = !reportJobIds.size || reportJobIds.has(entry.jobId);
    const matchesMonth = !reportFilters.month || getMonthKey(entry.logDate) === reportFilters.month;
    const matchesDate = isWithinDateRange(entry.logDate, reportFilters.dateFrom, reportFilters.dateTo);
    const matchesJobNumber = !reportFilters.jobNumber || matchesText(entry.jobNumber, reportFilters.jobNumber);
    const matchesCustomer = !reportFilters.customer || matchesText(entry.customerName, reportFilters.customer);
    const matchesFsc = reportFilters.fsc === 'all' || (reportFilters.fsc === 'yes' ? entry.fscRelated : !entry.fscRelated);
    return matchesJob && matchesMonth && matchesDate && matchesJobNumber && matchesCustomer && matchesFsc;
  }), [data.productionLogs, reportFilters, reportJobIds]);
  const reportBiEvents = useMemo(() => data.biEvents.filter((event) => {
    const eventDate = (event.occurredAt || event.createdAt || '').slice(0, 10);
    const matchesJob = !reportJobIds.size || (event.jobId ? reportJobIds.has(event.jobId) : true);
    const matchesMonth = !reportFilters.month || (eventDate ? getMonthKey(eventDate) === reportFilters.month : false);
    const matchesDate = eventDate ? isWithinDateRange(eventDate, reportFilters.dateFrom, reportFilters.dateTo) : false;
    const matchesJobNumber = !reportFilters.jobNumber || matchesText(event.jobNumber || '', reportFilters.jobNumber);
    const matchesCustomer = !reportFilters.customer || matchesText(event.clientName || '', reportFilters.customer);
    return matchesJob && matchesMonth && matchesDate && matchesJobNumber && matchesCustomer;
  }), [data.biEvents, reportFilters, reportJobIds]);

  const dashboardWasteByReason = useMemo(() => groupTotals(dashboardWaste, (entry) => entry.wasteReason, (entry) => entry.wasteQuantity).slice(0, 5), [dashboardWaste]);
  const dashboardTopPaper = useMemo(() => groupTotals(dashboardPaper, (log) => log.paperType, (log) => log.quantityUsed).slice(0, 5), [dashboardPaper]);
  const reportWasteByReason = useMemo(() => groupTotals(reportWasteEntries, (entry) => entry.wasteReason, (entry) => entry.wasteQuantity), [reportWasteEntries]);
  const reportWasteByJob = useMemo(() => groupTotals(reportWasteEntries, (entry) => entry.jobNumber, (entry) => entry.wasteQuantity), [reportWasteEntries]);
  const reportPaperByJob = useMemo(() => groupTotals(reportPaperLogs, (log) => log.jobNumber, (log) => log.quantityUsed), [reportPaperLogs]);
  const reportPaperByType = useMemo(() => groupTotals(reportPaperLogs, (log) => log.paperType, (log) => log.quantityUsed), [reportPaperLogs]);

  const reportProductionRows = useMemo(() => reportJobs.map((job) => ({
    jobNumber: job.jobNumber,
    jobDate: job.jobDate,
    customerName: job.customerName,
    productName: job.productName,
    status: job.status,
    quantityPlanned: job.quantityPlanned,
    quantityCompleted: job.quantityCompleted,
    paperUsed: getPaperUsedForJob(job.id, reportPaperLogs),
    totalWaste: getWasteForJob(job.id, reportWasteEntries),
    wastePercent: Number(getWastePercentForJob(job, reportWasteEntries).toFixed(2)),
    fscRelated: formatFlag(job.fscRelated),
  })), [reportJobs, reportPaperLogs, reportWasteEntries]);
  const reportDueSoonCutoff = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 3);
    return next.toISOString().slice(0, 10);
  }, []);
  const reportTimelineRows = useMemo(() => {
    if (reportBiEvents.length) {
      return reportBiEvents
        .map((event) => ({
          id: event.id,
          eventDate: event.occurredAt || event.createdAt,
          jobNumber: event.jobNumber || 'Not linked',
          customerName: event.clientName || 'Not linked',
          event: event.summary || event.action,
          owner: event.actorName || 'System',
          source: event.sourceTable || event.eventCategory || 'BI event',
        }))
        .slice(0, 25);
    }

    const items: Array<{
      id: string;
      eventDate: string;
      jobNumber: string;
      customerName: string;
      event: string;
      owner: string;
      source: string;
    }> = [];

    reportJobs.forEach((job) => {
      items.push({
        id: `${job.id}-created`,
        eventDate: job.createdAt || job.jobDate,
        jobNumber: job.jobNumber,
        customerName: job.customerName,
        event: 'Job created',
        owner: job.capturedBy || job.salesOwnerName || 'System',
        source: 'Job card',
      });
      if (job.artworkAssignedDate) {
        items.push({
          id: `${job.id}-artwork-assigned`,
          eventDate: job.artworkAssignedDate,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          event: 'Artwork assigned',
          owner: job.artworkAssignedTo || 'Design',
          source: 'Artwork',
        });
      }
      if (job.proofSharedDate) {
        items.push({
          id: `${job.id}-proof`,
          eventDate: job.proofSharedDate,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          event: 'Proof shared',
          owner: job.proofSharedBy || job.salesOwnerName || 'Sales',
          source: 'Artwork',
        });
      }
      if (job.finalApprovalReceivedDate) {
        items.push({
          id: `${job.id}-approval`,
          eventDate: job.finalApprovalReceivedDate,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          event: 'Final approval received',
          owner: job.finalApprovalClearedBy || 'Client approval',
          source: 'Artwork',
        });
      }
      if (job.productionStartDate) {
        items.push({
          id: `${job.id}-production-start`,
          eventDate: job.productionStartDate,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          event: 'Production started',
          owner: job.productionStartedBy || 'Production',
          source: 'Production',
        });
      }
      if (job.readyForDispatchDate) {
        items.push({
          id: `${job.id}-dispatch-ready`,
          eventDate: job.readyForDispatchDate,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          event: 'Ready for dispatch',
          owner: job.readyForDispatchBy || 'Dispatch',
          source: 'Dispatch',
        });
      }
    });

    reportProductionLogs.forEach((entry) => {
      items.push({
        id: `production-${entry.id}`,
        eventDate: entry.logDate,
        jobNumber: entry.jobNumber,
        customerName: entry.customerName,
        event: `${entry.logType} logged`,
        owner: entry.operatorName || 'Production',
        source: 'Production log',
      });
    });

    reportDispatchRecords.forEach((record) => {
      items.push({
        id: `dispatch-${record.id}`,
        eventDate: record.dispatchDate,
        jobNumber: record.jobNumber,
        customerName: record.customerName,
        event: 'Dispatch recorded',
        owner: record.deliveryReference || record.labelReference || 'Dispatch',
        source: 'Dispatch',
      });
    });

    return items
      .sort((left, right) => String(right.eventDate).localeCompare(String(left.eventDate)))
      .slice(0, 25);
  }, [reportBiEvents, reportDispatchRecords, reportJobs, reportProductionLogs]);
  const reportStaffWorkload = useMemo(() => {
    const totals = new Map<string, {
      name: string;
      role: string;
      activeJobs: number;
      overdueJobs: number;
      dueSoonJobs: number;
      completedJobs: number;
    }>();
    const today = getToday();

    function touch(name: string, role: string) {
      const key = `${role}:${name}`;
      if (!totals.has(key)) {
        totals.set(key, { name, role, activeJobs: 0, overdueJobs: 0, dueSoonJobs: 0, completedJobs: 0 });
      }
      return totals.get(key)!;
    }

    reportJobs.forEach((job) => {
      const owners = [
        job.salesOwnerName ? { name: job.salesOwnerName, role: 'Sales / client care' } : null,
        job.artworkAssignedTo ? { name: job.artworkAssignedTo, role: 'Design' } : null,
        job.productionStartedBy ? { name: job.productionStartedBy, role: 'Production' } : null,
        job.readyForDispatchBy ? { name: job.readyForDispatchBy, role: 'Dispatch' } : null,
      ].filter(Boolean) as Array<{ name: string; role: string }>;

      owners.forEach((owner) => {
        const row = touch(owner.name, owner.role);
        if (job.status === 'Completed') {
          row.completedJobs += 1;
        } else {
          row.activeJobs += 1;
        }
        if (job.dueDate && job.dueDate < today && job.status !== 'Completed') {
          row.overdueJobs += 1;
        }
        if (job.dueDate && job.dueDate >= today && job.dueDate <= reportDueSoonCutoff && job.status !== 'Completed') {
          row.dueSoonJobs += 1;
        }
      });
    });

    return [...totals.values()]
      .sort((left, right) =>
        (right.activeJobs + right.overdueJobs * 2) - (left.activeJobs + left.overdueJobs * 2))
      .slice(0, 12);
  }, [reportDueSoonCutoff, reportJobs]);
  const reportBottlenecks = useMemo(() => {
    const today = getToday();
    const overdueJobs = reportJobs.filter((job) => job.dueDate && job.dueDate < today && job.status !== 'Completed');
    const awaitingArtwork = reportJobs.filter((job) => ['Needs Design', 'Ready but Not Print Ready'].includes(job.artworkPreparationStatus));
    const awaitingApproval = reportJobs.filter((job) => job.approvalStatus === 'Awaiting Approval');
    const productionNotStarted = reportJobs.filter((job) =>
      job.status === 'Ready for Production' && !job.productionStartDate
    );
    const dispatchBlocked = reportJobs.filter((job) =>
      ['Ready for Dispatch', 'Partially Dispatched'].includes(job.status) && !reportDispatchRecords.some((record) => record.jobId === job.id)
    );

    return [
      {
        title: 'Overdue jobs',
        count: overdueJobs.length,
        detail: overdueJobs.length ? overdueJobs.slice(0, 3).map((job) => job.jobNumber).join(', ') : 'No overdue jobs in the current report window.',
      },
      {
        title: 'Awaiting artwork prep',
        count: awaitingArtwork.length,
        detail: awaitingArtwork.length ? awaitingArtwork.slice(0, 3).map((job) => job.jobNumber).join(', ') : 'No artwork-prep backlog right now.',
      },
      {
        title: 'Client approval pending',
        count: awaitingApproval.length,
        detail: awaitingApproval.length ? awaitingApproval.slice(0, 3).map((job) => job.jobNumber).join(', ') : 'No client approvals outstanding.',
      },
      {
        title: 'Production not started',
        count: productionNotStarted.length,
        detail: productionNotStarted.length ? productionNotStarted.slice(0, 3).map((job) => job.jobNumber).join(', ') : 'All production-ready jobs have started.',
      },
      {
        title: 'Dispatch follow-up needed',
        count: dispatchBlocked.length,
        detail: dispatchBlocked.length ? dispatchBlocked.slice(0, 3).map((job) => job.jobNumber).join(', ') : 'No dispatch exceptions in the current report window.',
      },
    ].filter((item) => item.count > 0 || item.title === 'Overdue jobs');
  }, [reportDispatchRecords, reportJobs]);
  const reportClientTrackingRows = useMemo(() => {
    const grouped = new Map<string, {
      clientName: string;
      activeJobs: number;
      completedJobs: number;
      overdueJobs: number;
      dispatches: number;
      totalOrderValue: number;
      lastActivityDate: string;
      lastActivityLabel: string;
    }>();
    const dispatchesByClient = groupTotals(reportDispatchRecords, (record) => record.customerName, () => 1);
    const dispatchLookup = new Map(dispatchesByClient.map((item) => [item.label, item.value]));
    const activityDates = new Map<string, { date: string; label: string }>();

    reportTimelineRows.forEach((row) => {
      const current = activityDates.get(row.customerName);
      if (!current || String(row.eventDate) > current.date) {
        activityDates.set(row.customerName, { date: String(row.eventDate), label: row.event });
      }
    });

    reportJobs.forEach((job) => {
      const current = grouped.get(job.customerName) ?? {
        clientName: job.customerName,
        activeJobs: 0,
        completedJobs: 0,
        overdueJobs: 0,
        dispatches: dispatchLookup.get(job.customerName) ?? 0,
        totalOrderValue: 0,
        lastActivityDate: activityDates.get(job.customerName)?.date ?? '',
        lastActivityLabel: activityDates.get(job.customerName)?.label ?? 'No recent activity',
      };
      if (job.status === 'Completed') {
        current.completedJobs += 1;
      } else {
        current.activeJobs += 1;
      }
      if (job.dueDate && job.dueDate < getToday() && job.status !== 'Completed') {
        current.overdueJobs += 1;
      }
      current.totalOrderValue += job.orderValue || 0;
      grouped.set(job.customerName, current);
    });

    return [...grouped.values()].sort((left, right) => (right.activeJobs + right.completedJobs) - (left.activeJobs + left.completedJobs));
  }, [reportDispatchRecords, reportJobs, reportTimelineRows]);
  const reportAuditRows = useMemo(() => {
    if (reportBiEvents.length) {
      return reportBiEvents
        .map((event) => ({
          id: event.id,
          eventDate: event.occurredAt || event.createdAt,
          source: event.sourceTable || event.eventCategory || 'BI event',
          action: event.action || event.eventType,
          reference: event.jobNumber || event.sourceRecordId,
          actor: event.actorName || 'System',
        }))
        .slice(0, 40);
    }

    const rows = [
      ...reportJobs.map((job) => ({
        id: `job-${job.id}`,
        eventDate: job.createdAt || job.jobDate,
        source: 'Job card',
        action: 'Job captured',
        reference: job.jobNumber,
        actor: job.capturedBy || job.salesOwnerName || 'System',
      })),
      ...reportArtworkRecords.map((record) => ({
        id: `art-${record.id}`,
        eventDate: record.approvalDate || record.proofSentDate || record.artworkReceivedDate || record.createdAt,
        source: 'Artwork',
        action: record.stage,
        reference: record.jobNumber,
        actor: record.notes || 'Artwork workflow',
      })),
      ...reportProductionLogs.map((entry) => ({
        id: `prod-${entry.id}`,
        eventDate: entry.logDate,
        source: 'Production log',
        action: entry.logType,
        reference: entry.jobNumber,
        actor: entry.operatorName || 'Production',
      })),
      ...reportWasteEntries.map((entry) => ({
        id: `waste-${entry.id}`,
        eventDate: entry.wasteDate,
        source: 'Waste log',
        action: entry.wasteReason,
        reference: entry.jobNumber,
        actor: entry.enteredBy || 'Production',
      })),
      ...reportPaperLogs.map((log) => ({
        id: `paper-${log.id}`,
        eventDate: log.logDate,
        source: 'Paper log',
        action: `${log.paperType} used`,
        reference: log.jobNumber,
        actor: log.paperCode || 'Paper movement',
      })),
      ...reportDispatchRecords.map((record) => ({
        id: `dispatch-${record.id}`,
        eventDate: record.dispatchDate,
        source: 'Dispatch',
        action: 'Stock dispatched',
        reference: record.dispatchNumber,
        actor: record.deliveryReference || record.labelReference || 'Dispatch',
      })),
      ...data.inventoryMovements
        .filter((movement) => !reportJobIds.size || reportJobIds.has(movement.jobId))
        .map((movement) => ({
          id: `movement-${movement.id}`,
          eventDate: movement.movementDate,
          source: 'Inventory',
          action: `${movement.movementType} ${movement.itemName}`,
          reference: movement.jobNumber || movement.movementNumber,
          actor: movement.movedByName || 'Inventory',
        })),
    ];

    return rows
      .sort((left, right) => String(right.eventDate).localeCompare(String(left.eventDate)))
      .slice(0, 40);
  }, [data.inventoryMovements, reportArtworkRecords, reportBiEvents, reportDispatchRecords, reportJobIds, reportJobs, reportPaperLogs, reportProductionLogs, reportWasteEntries]);

  const selectedWasteJob = wasteForm.jobId ? jobsById.get(wasteForm.jobId) : undefined;
  const selectedPaperJob = paperForm.jobId ? jobsById.get(paperForm.jobId) : undefined;
  const selectedJob = selectedJobId ? jobsById.get(selectedJobId) ?? null : null;
  const selectedJobMaterials = useMemo(() => {
    if (!selectedJob) return [];
    const receiptIds = new Set(
      data.paperLogs.filter((log) => log.jobId === selectedJob.id && log.materialReceiptId).map((log) => log.materialReceiptId),
    );
    data.productionLogs
      .filter((log) => log.jobId === selectedJob.id && log.sourceMaterialId)
      .forEach((log) => receiptIds.add(log.sourceMaterialId));
    return data.materialReceipts.filter((receipt) => receiptIds.has(receipt.id));
  }, [data.materialReceipts, data.paperLogs, data.productionLogs, selectedJob]);
  const selectedJobProductionLogs = useMemo(() => selectedJob ? data.productionLogs.filter((log) => log.jobId === selectedJob.id) : [], [data.productionLogs, selectedJob]);
  const selectedJobWasteEntries = useMemo(() => selectedJob ? data.wasteEntries.filter((entry) => entry.jobId === selectedJob.id) : [], [data.wasteEntries, selectedJob]);
  const selectedJobPaperLogs = useMemo(() => selectedJob ? data.paperLogs.filter((log) => log.jobId === selectedJob.id) : [], [data.paperLogs, selectedJob]);
  const selectedJobDispatchRecords = useMemo(() => selectedJob ? data.dispatchRecords.filter((record) => record.jobId === selectedJob.id) : [], [data.dispatchRecords, selectedJob]);

  function resetJobEditor() { setJobForm(createInitialJobForm()); setJobEditingId(null); setJobMessage(''); }
  function deriveArtworkStageFromJob(job: JobCard): ArtworkRecord['stage'] {
    if (job.approvalStatus === 'Approved') return 'Approved';
    if (job.approvalStatus === 'Changes Requested') return 'Changes Requested';
    if (job.proofSent) return 'Proof Sent';
    if (job.artworkReceived) return 'Artwork Received';
    return 'Awaiting Artwork';
  }
  function syncArtworkRecordWithJob(
    artworkRecords: ArtworkRecord[],
    job: JobCard,
  ): ArtworkRecord[] {
    if (!job.printRequired) {
      return artworkRecords.filter((record) => record.jobId !== job.id);
    }

    const stage = deriveArtworkStageFromJob(job);
    const existingRecord = artworkRecords.find((record) => record.jobId === job.id);
    const payload = {
      jobId: job.id,
      jobNumber: job.jobNumber,
      clientId: job.clientId,
      clientName: job.customerName,
      artworkReceivedDate: job.artworkAssignedDate || '',
      proofSentDate: job.proofSharedDate || '',
      approvalDate: job.finalApprovalReceivedDate || job.approvalDate || '',
      stage,
      changesRequested: job.changesRequested,
      notes: job.artworkNotes,
    };

    if (existingRecord) {
      return artworkRecords.map((record) => record.id === existingRecord.id ? { ...record, ...payload } : record);
    }

    const artworkNumber = generateCode('ART', artworkRecords.map((record) => record.artworkNumber), job.jobDate);
    const newRecord: ArtworkRecord = {
      id: artworkNumber,
      artworkNumber,
      createdAt: new Date().toISOString(),
      ...payload,
    };
    return [newRecord, ...artworkRecords];
  }
  function focusSavedJob(job: JobCard) {
    const jobMonth = getMonthKey(job.jobDate);
    setSelectedJobId(job.id);
    setJobFilters((current) => ({
      ...current,
      search: '',
      month: jobMonth,
      status: '',
      customer: '',
    }));
    setDashboardMonth(jobMonth);
    setJobSaveCount((current) => current + 1);
  }
  function focusSavedSupplier(supplier: Supplier) {
    setSupplierFilters({
      search: supplier.name,
      supplierType: '',
      active: 'all',
    });
    setSupplierSaveCount((current) => current + 1);
  }
  function resetSupplierEditor() { setSupplierForm(createInitialSupplierForm()); setSupplierEditingId(null); setSupplierMessage(''); }
  function resetMachineEditor() { setMachineForm(createInitialMachineForm()); setMachineEditingId(null); setMachineMessage(''); }
  function resetLeadEditor() { setLeadForm(createInitialLeadForm()); setLeadEditingId(null); setLeadMessage(''); }
  function resetQuoteEditor() { setQuoteForm({ ...createInitialQuoteForm(), customerNote: data.appSettings.templates.defaultCustomerNote }); setQuoteEditingId(null); setQuoteMessage(''); }
  function resetArtworkEditor() { setArtworkForm(createInitialArtworkForm()); setArtworkEditingId(null); setArtworkMessage(''); }
  function resetCustomerStockReleaseEditor() { setCustomerStockReleaseForm(createInitialCustomerStockReleaseForm()); setCustomerStockReleaseEditingId(null); setCustomerStockReleaseMessage(''); }
  function resetDeliveryNoteEditor() { setDeliveryNoteForm({ ...createInitialDeliveryNoteForm(), customerNote: data.appSettings.templates.defaultCustomerNote }); setDeliveryNoteEditingId(null); setDeliveryNoteMessage(''); }
  function resetInvoiceEditor() { setInvoiceForm({ ...createInitialInvoiceForm(), customerNote: data.appSettings.templates.defaultCustomerNote }); setInvoiceEditingId(null); setInvoiceMessage(''); }
  function resetProductionSpecEditor() { setProductionSpecForm(createInitialProductionSpecForm()); setProductionSpecEditingId(null); setProductionSpecMessage(''); }
  function resetSettingsEditor() {
    setSettingsForm(buildSettingsForm(data.appSettings));
    setSettingsMessage('');
  }
  function handleSaveSettings() {
    const splitLines = (value: string): string[] => value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const numeric = (value: string, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
    };
    const next: AppSettings = {
      id: 'default',
      company: { ...settingsForm.company },
      templates: {
        invoiceFooterLines: splitLines(settingsForm.templates.invoiceFooterLines),
        deliveryNoteFooterLines: splitLines(settingsForm.templates.deliveryNoteFooterLines),
        productionSpecFooterLines: splitLines(settingsForm.templates.productionSpecFooterLines),
        defaultPaymentTerms: settingsForm.templates.defaultPaymentTerms,
        defaultInvoiceNotes: settingsForm.templates.defaultInvoiceNotes,
        defaultDeliveryNoteNotes: settingsForm.templates.defaultDeliveryNoteNotes,
        defaultCustomerNote: settingsForm.templates.defaultCustomerNote,
        termsAndConditions: settingsForm.templates.termsAndConditions,
        termsReferenceLine: settingsForm.templates.termsReferenceLine,
      },
      stockHolding: {
        defaultMaxDays: numeric(settingsForm.stockHolding.defaultMaxDays, data.appSettings.stockHolding.defaultMaxDays),
        defaultReviewCadenceDays: numeric(settingsForm.stockHolding.defaultReviewCadenceDays, data.appSettings.stockHolding.defaultReviewCadenceDays),
        defaultAgreementTermsText: settingsForm.stockHolding.defaultAgreementTermsText,
      },
      // SARS config is edited from the SARS Centre, not this form — preserve it.
      sarsConfig: data.appSettings.sarsConfig,
      // Currency config is edited from Currencies & FX — preserve it.
      currencyConfig: data.appSettings.currencyConfig,
      // Connector config is edited from the Aman OS Connector page — preserve it.
      connectorConfig: data.appSettings.connectorConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: profile?.fullName || profile?.email || data.appSettings.updatedBy,
    };
    setData((current) => ({ ...current, appSettings: next }));
    setSettingsMessage('Settings saved.');
  }
  function resetPaperRateEditor() { setPaperRateForm(createInitialPaperRateForm()); setPaperRateEditingId(null); setPaperRateMessage(''); }
  function resetCostProfileEditor() { setCostProfileForm(createInitialCostProfileForm()); setCostProfileEditingId(null); setCostProfileMessage(''); }
  function resetStockEditor() { setStockForm(createInitialFinishedStockForm()); setStockEditingId(null); setStockMessage(''); }
  function resetSpareEditor() { setSpareForm(createInitialSpareForm()); setSpareEditingId(null); setSpareMessage(''); }
  function resetTierEditor() { setTierForm(createInitialPricingTierForm()); setTierEditingId(null); setTierMessage(''); }
  function resetClientEditor() { setClientForm(createInitialClientForm()); setClientEditingId(null); setClientMessage(''); }
  function resetProductEditor() { setProductForm(createInitialProductForm()); setProductEditingId(null); setProductMessage(''); }
  function resetMaterialEditor() { setMaterialForm(createInitialMaterialForm()); setMaterialEditingId(null); setMaterialMessage(''); }
  function resetChemicalEditor() { setChemicalForm(createInitialChemicalForm()); setChemicalEditingId(null); setChemicalMessage(''); }
  function resetFoodSafeMaterialEditor() { setFoodSafeMaterialForm(createInitialFoodSafeMaterialForm()); setFoodSafeMaterialEditingId(null); setFoodSafeMaterialMessage(''); }
  function resetCleaningLogEditor() { setCleaningLogForm(createInitialCleaningLogForm()); setCleaningLogEditingId(null); setCleaningLogMessage(''); }
  function resetComplaintEditor() { setComplaintForm(createInitialComplaintForm()); setComplaintEditingId(null); setComplaintMessage(''); }
  function resetHaccpEditor() { setHaccpForm(createInitialHaccpForm()); setHaccpEditingId(null); setHaccpMessage(''); }
  function resetNcrEditor() { setNcrForm(createInitialNcrForm()); setNcrEditingId(null); setNcrMessage(''); }
  function resetTrainingEditor() { setTrainingForm(createInitialTrainingForm()); setTrainingEditingId(null); setTrainingMessage(''); }
  function resetPpeEditor() { setPpeForm(createInitialPpeForm()); setPpeEditingId(null); setPpeMessage(''); }
  function resetPestEditor() { setPestForm(createInitialPestForm()); setPestEditingId(null); setPestMessage(''); }
  function resetForeignObjectEditor() { setForeignObjectForm(createInitialForeignObjectForm()); setForeignObjectEditingId(null); setForeignObjectMessage(''); }
  function resetToolBladeEditor() { setToolBladeForm(createInitialToolBladeForm()); setToolBladeEditingId(null); setToolBladeMessage(''); }
  function resetVisitorEditor() { setVisitorForm(createInitialVisitorForm()); setVisitorEditingId(null); setVisitorMessage(''); }
  function resetSopEditor() { setSopForm(createInitialSopForm()); setSopEditingId(null); setSopMessage(''); }
  function resetInventoryScan() { setInventoryScanForm(createInitialInventoryScanForm()); setInventoryScanMessage(''); }
  function resetProductionEditor() { setProductionForm(createInitialProductionForm()); setProductionEditingId(null); setProductionMessage(''); }
  function resetWasteEditor() { setWasteForm(createInitialWasteForm()); setWasteEditingId(null); setWasteMessage(''); }
  function resetPaperEditor() { setPaperForm(createInitialPaperForm()); setPaperEditingId(null); setPaperMessage(''); }
  function resetDispatchEditor() { setDispatchForm(createInitialDispatchForm()); setDispatchEditingId(null); setDispatchMessage(''); }

  function buildBarcode(code: string) {
    return code.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  }

  function getActor() {
    return {
      actorId: profile?.id || 'unknown-user',
      actorName: profile?.fullName || profile?.email || 'Unknown user',
    };
  }

  function createInventoryMovement(input: {
    movementDate: string;
    movementType: InventoryMovementType;
    itemType: InventoryItemType;
    barcode: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    quantityMoved: number;
    quantityUnit: FinishedGoodsStock['quantityUnit'];
    fromLocation?: string;
    toLocation?: string;
    jobId?: string;
    jobNumber?: string;
    notes?: string;
  }): InventoryMovement {
    const movementNumber = generateCode(
      'IVM',
      data.inventoryMovements.map((movement) => movement.movementNumber),
      input.movementDate,
    );
    const { actorId, actorName } = getActor();
    return {
      id: movementNumber,
      movementNumber,
      createdAt: new Date().toISOString(),
      movementDate: input.movementDate,
      itemType: input.itemType,
      movementType: input.movementType,
      barcode: input.barcode,
      itemId: input.itemId,
      itemCode: input.itemCode,
      itemName: input.itemName,
      quantityMoved: input.quantityMoved,
      quantityUnit: input.quantityUnit,
      fromLocation: input.fromLocation ?? '',
      toLocation: input.toLocation ?? '',
      jobId: input.jobId ?? '',
      jobNumber: input.jobNumber ?? '',
      movedByUserId: actorId,
      movedByName: actorName,
      notes: input.notes ?? '',
    };
  }

  function handleSaveSupplier() {
    if (!supplierForm.name) {
      setSupplierMessage('Supplier name is required.');
      return;
    }
    const linkedClient = supplierForm.linkedClientId ? clientsById.get(supplierForm.linkedClientId) : undefined;
    const payload = {
      name: supplierForm.name,
      contactPerson: supplierForm.contactPerson,
      phone: supplierForm.phone,
      email: supplierForm.email,
      contacts: supplierForm.contacts,
      address: supplierForm.address,
      billingAddress: supplierForm.billingAddress,
      city: supplierForm.city,
      country: supplierForm.country,
      website: supplierForm.website,
      supplierType: supplierForm.supplierType,
      certificateCode: supplierForm.certificateCode,
      accountNumber: supplierForm.accountNumber,
      paymentTerms: supplierForm.paymentTerms,
      creditLimit: Number(supplierForm.creditLimit || 0),
      currentBalance: Number(supplierForm.currentBalance || 0),
      currency: supplierForm.currency,
      isAlsoClient: supplierForm.isAlsoClient,
      linkedClientId: linkedClient?.id ?? '',
      linkedClientName: linkedClient?.name ?? '',
      lastCheckInDate: supplierForm.lastCheckInDate,
      nextReviewDate: supplierForm.nextReviewDate,
      reviewFrequencyMonths: Number(supplierForm.reviewFrequencyMonths || 12),
      internalOwner: supplierForm.internalOwner,
      certifications: supplierForm.certifications,
      suppliedProducts: supplierForm.suppliedProducts.map((item) => {
        const linkedProduct = item.productId ? productsById.get(item.productId) : undefined;
        return {
          ...item,
          productName: linkedProduct?.name ?? item.productName,
          defaultPrice: Number(item.defaultPrice || 0),
          minimumOrderQuantity: Number(item.minimumOrderQuantity || 0),
          leadTimeDays: Number(item.leadTimeDays || 0),
        };
      }),
      notes: supplierForm.notes,
      active: supplierForm.active,
    };
    if (supplierEditingId) {
      const updatedSupplier = { ...data.suppliers.find((supplier) => supplier.id === supplierEditingId), ...payload } as Supplier;
      setData((current) => ({
        ...current,
        suppliers: current.suppliers.map((supplier) => supplier.id === supplierEditingId ? { ...supplier, ...payload } : supplier),
        paperRates: current.paperRates.map((rate) => rate.supplierId === supplierEditingId ? { ...rate, supplierName: payload.name } : rate),
        spareParts: current.spareParts.map((part) => part.supplierId === supplierEditingId ? { ...part, supplierName: payload.name } : part),
        materialReceipts: current.materialReceipts.map((receipt) => receipt.supplierId === supplierEditingId ? { ...receipt, supplierName: payload.name } : receipt),
      }));
      focusSavedSupplier(updatedSupplier);
    } else {
      const newSupplier: Supplier = { id: `supplier-${Date.now()}`, ...payload };
      setData((current) => ({ ...current, suppliers: [newSupplier, ...current.suppliers] }));
      focusSavedSupplier(newSupplier);
    }
    resetSupplierEditor();
  }

  function handleDeleteSupplier() {
    if (!supplierEditingId) {
      return;
    }

    const supplier = data.suppliers.find((item) => item.id === supplierEditingId);
    if (!supplier) {
      return;
    }

    const isUsedInPaperRates = data.paperRates.some((rate) => rate.supplierId === supplier.id);
    const isUsedInSpareParts = data.spareParts.some((part) => part.supplierId === supplier.id);
    const isUsedInMaterialReceipts = data.materialReceipts.some((receipt) => receipt.supplierId === supplier.id);
    const isUsedInProducts = data.products.some((product) => product.defaultSupplierId === supplier.id);

    if (isUsedInPaperRates || isUsedInSpareParts || isUsedInMaterialReceipts || isUsedInProducts) {
      setSupplierMessage('This supplier is linked to paper rates, materials, products, or spare parts and cannot be deleted. Mark it inactive or amend it instead.');
      return;
    }

    const confirmed = window.confirm(`Delete supplier ${supplier.name}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      suppliers: current.suppliers.filter((item) => item.id !== supplier.id),
    }));
    resetSupplierEditor();
  }

  function handleSaveMachine() {
    if (!machineForm.name) {
      setMachineMessage('Machine name is required.');
      return;
    }
    const payload = {
      name: machineForm.name,
      code: machineForm.code,
      department: machineForm.department,
      processType: machineForm.processType,
      status: machineForm.status,
      notes: machineForm.notes,
      active: machineForm.active,
    };
    if (machineEditingId) {
      setData((current) => ({
        ...current,
        machines: current.machines.map((machine) => machine.id === machineEditingId ? { ...machine, ...payload } : machine),
        productionLogs: current.productionLogs.map((log) => log.machineId === machineEditingId ? { ...log, machine: payload.name } : log),
        spareParts: current.spareParts.map((part) => part.machineId === machineEditingId ? { ...part, machineReference: payload.name } : part),
      }));
    } else {
      setData((current) => ({ ...current, machines: [{ id: `machine-${Date.now()}`, ...payload }, ...current.machines] }));
    }
    resetMachineEditor();
  }

  function handleSaveQuote() {
    if (!quoteForm.quoteDate || !quoteForm.clientId || !quoteForm.productId || !quoteForm.quantity || !quoteForm.quotedUnitPrice) {
      setQuoteMessage('Quote date, client, product, quantity, and quoted unit price are required.');
      return;
    }
    const client = clientsById.get(quoteForm.clientId);
    const product = productsById.get(quoteForm.productId);
    const linkedLead = quoteForm.linkedLeadId ? data.leads.find((lead) => lead.id === quoteForm.linkedLeadId) : undefined;
    if (!client || !product) {
      setQuoteMessage('Select a valid client and product before saving.');
      return;
    }
    const tier = quoteForm.pricingTierId ? tiersById.get(quoteForm.pricingTierId) : undefined;
    const paperRate = quoteForm.paperRateId ? paperRatesById.get(quoteForm.paperRateId) : undefined;
    const costProfile = quoteForm.costProfileId ? costProfilesById.get(quoteForm.costProfileId) : undefined;
    const payload = {
      quoteDate: quoteForm.quoteDate,
      quickbooksEstimateNumber: quoteForm.quickbooksEstimateNumber.trim(),
      linkedLeadId: linkedLead?.id ?? '',
      linkedLeadNumber: linkedLead?.leadNumber ?? '',
      salesOwnerName: linkedLead?.assignedTo ?? '',
      clientId: client.id,
      clientName: client.name,
      productId: product.id,
      productName: product.name,
      pricingTierId: tier?.id ?? '',
      pricingTierName: tier?.name ?? '',
      paperRateId: paperRate?.id ?? '',
      paperRateName: paperRate?.name ?? '',
      costProfileId: costProfile?.id ?? '',
      costProfileName: costProfile?.name ?? '',
      quantity: Number(quoteForm.quantity),
      sizeSpec: quoteForm.sizeSpec,
      handleType: quoteForm.handleType,
      printMethod: quoteForm.printMethod,
      colors: Number(quoteForm.colors || 0),
      unitCost: Number(quoteForm.unitCost || 0),
      quotedUnitPrice: Number(quoteForm.quotedUnitPrice),
      totalQuote: Number(quoteForm.totalQuote || 0),
      status: quoteForm.status,
      notes: quoteForm.notes,
      customerNote: quoteForm.customerNote,
    };
    if (quoteEditingId) {
      setData((current) => ({
        ...current,
        quoteEstimates: current.quoteEstimates.map((quote) => quote.id === quoteEditingId ? { ...quote, ...payload } : quote),
        leads: current.leads.map((lead) => linkedLead?.id && lead.id === linkedLead.id ? {
          ...lead,
          linkedQuoteId: quoteEditingId,
          linkedQuoteNumber: current.quoteEstimates.find((quote) => quote.id === quoteEditingId)?.quoteNumber ?? lead.linkedQuoteNumber,
          status: lead.status === 'Won' || lead.status === 'Lost' ? lead.status : 'Quoted',
        } : lead),
      }));
    } else {
      const quoteNumber = generateCode('QTE', data.quoteEstimates.map((quote) => quote.quoteNumber), quoteForm.quoteDate);
      const newQuote: QuoteEstimate = { id: quoteNumber, quoteNumber, createdAt: new Date().toISOString(), ...payload };
      setData((current) => ({
        ...current,
        quoteEstimates: [newQuote, ...current.quoteEstimates],
        leads: current.leads.map((lead) => linkedLead?.id && lead.id === linkedLead.id ? {
          ...lead,
          linkedQuoteId: newQuote.id,
          linkedQuoteNumber: newQuote.quoteNumber,
          quickbooksEstimateNumber: newQuote.quickbooksEstimateNumber || lead.quickbooksEstimateNumber,
          status: lead.status === 'Won' || lead.status === 'Lost' ? lead.status : 'Quoted',
        } : lead),
      }));
    }
    resetQuoteEditor();
  }

  // Calculator → Quote bridge. Phase 2 — turn the multi-line calculator
  // state into one QuoteEstimate per SKU. The data model is single-SKU
  // per quote today, so we emit N quotes sharing a common parent number
  // (Q-202605-001-A, -B, -C). Returns the resulting quote numbers so the
  // calculator can show a confirmation.
  async function handleSaveCalculatorAsQuote(state: import('./types').CalculatorState): Promise<{ quoteNumbers: string[] }> {
    const client = clientsById.get(state.shared.clientId);
    if (!client) throw new Error('Client not found');
    const linkedLead = state.shared.leadId ? data.leads.find((l) => l.id === state.shared.leadId) : undefined;
    const pricingTier = state.shared.pricingTierId
      ? tiersById.get(state.shared.pricingTierId)
      : (client.pricingTierId ? tiersById.get(client.pricingTierId) : undefined);
    const sharedPaperRate = state.shared.paperRateId ? paperRatesById.get(state.shared.paperRateId) : undefined;
    const sharedProfile = state.shared.costProfileId ? costProfilesById.get(state.shared.costProfileId) : undefined;

    // Compute every line so we capture the priced-at-save snapshot.
    const computation = computeQuote(state, {
      clients: data.clients,
      pricingTiers: data.pricingTiers,
      paperRates: data.paperRates,
      costProfiles: data.costProfiles,
    });

    const baseNumber = generateCode('QTE', data.quoteEstimates.map((q) => q.quoteNumber), state.shared.quoteDate);
    const created: import('./types').QuoteEstimate[] = [];

    state.lines.forEach((line, idx) => {
      const result = computation.lines[idx];
      const product = line.productId ? productsById.get(line.productId) : undefined;
      const paperRate = line.paperRateIdOverride
        ? paperRatesById.get(line.paperRateIdOverride)
        : sharedPaperRate;
      const profile = line.costProfileIdOverride
        ? costProfilesById.get(line.costProfileIdOverride)
        : sharedProfile;

      // One quote number per line. Single-line quotes get the bare base
      // number to match the existing convention; multi-line quotes get
      // -A / -B / -C suffixes so they group naturally on listing pages.
      const quoteNumber = state.lines.length === 1 ? baseNumber : `${baseNumber}-${String.fromCharCode(65 + idx)}`;
      const id = quoteNumber;

      const sizeSpec = [line.bagWidthMm, line.bagHeightMm, line.gussetMm]
        .filter(Boolean)
        .join('x');

      created.push({
        id,
        quoteNumber,
        quickbooksEstimateNumber: '',
        createdAt: new Date().toISOString(),
        quoteDate: state.shared.quoteDate,
        linkedLeadId: linkedLead?.id ?? '',
        linkedLeadNumber: linkedLead?.leadNumber ?? '',
        salesOwnerName: state.shared.salesOwnerName,
        clientId: client.id,
        clientName: client.name,
        productId: product?.id ?? '',
        productName: line.productName || product?.name || '',
        pricingTierId: pricingTier?.id ?? '',
        pricingTierName: pricingTier?.name ?? '',
        paperRateId: paperRate?.id ?? '',
        paperRateName: paperRate?.name ?? '',
        costProfileId: profile?.id ?? '',
        costProfileName: profile?.name ?? '',
        quantity: Number(line.quantity || 0),
        sizeSpec,
        handleType: line.handleType,
        printMethod: result.resolvedPrintMethod,
        colors: Number(line.colors || 0),
        unitCost: result.unitCost,
        quotedUnitPrice: result.quotedUnitPrice,
        totalQuote: result.lineTotal,
        status: 'Quoted',
        notes: [state.shared.notes, line.description].filter(Boolean).join('\n'),
      });
    });

    setData((current) => ({
      ...current,
      quoteEstimates: [...created, ...current.quoteEstimates],
      leads: linkedLead
        ? current.leads.map((l) =>
            l.id === linkedLead.id
              ? {
                  ...l,
                  linkedQuoteId: created[0]?.id ?? l.linkedQuoteId,
                  linkedQuoteNumber: created[0]?.quoteNumber ?? l.linkedQuoteNumber,
                  status: l.status === 'Won' || l.status === 'Lost' ? l.status : 'Quoted',
                }
              : l,
          )
        : current.leads,
    }));

    // Reset calculator to a fresh state for the next quote.
    setCalculatorState(emptyCalculatorState(getToday()));

    return { quoteNumbers: created.map((q) => q.quoteNumber) };
  }

  function handleSaveLead() {
    // Minimal validation — leads are often captured fast with partial info.
    // We only require *some* way to identify who this is (name, phone, email,
    // company, or a linked client). Everything else is filled in over time.
    const hasIdentity = !!(
      leadForm.contactName.trim()
      || leadForm.phone.trim()
      || leadForm.email.trim()
      || leadForm.companyName.trim()
      || leadForm.clientId
    );
    if (!hasIdentity) {
      setLeadMessage('Add at least a name, phone, email, company, or linked client.');
      return;
    }
    // QuickBooks estimate guard only applies on edits where status moves to
    // Quoted — capture-stage saves remain unrestricted.
    if (leadEditingId && leadForm.status === 'Quoted' && !leadForm.quickbooksEstimateNumber.trim() && !leadForm.linkedQuoteId) {
      setLeadMessage('Link a quote or add a QuickBooks estimate number once the lead is marked as Quoted.');
      return;
    }
    const client = leadForm.clientId ? clientsById.get(leadForm.clientId) : undefined;
    const product = leadForm.productId ? productsById.get(leadForm.productId) : undefined;
    const quote = leadForm.linkedQuoteId ? data.quoteEstimates.find((item) => item.id === leadForm.linkedQuoteId) : undefined;
    const payload = {
      enquiryDate: leadForm.enquiryDate,
      clientId: client?.id ?? '',
      clientName: client?.name ?? '',
      companyName: client?.name ?? leadForm.companyName,
      contactName: leadForm.contactName,
      phone: leadForm.phone,
      email: leadForm.email,
      source: leadForm.source,
      assignedTo: leadForm.assignedTo,
      productId: product?.id ?? '',
      productName: product?.name ?? '',
      requestedQuantity: Number(leadForm.requestedQuantity || 0),
      dueDate: leadForm.dueDate,
      status: leadForm.status,
      quickbooksEstimateNumber: leadForm.quickbooksEstimateNumber.trim(),
      linkedQuoteId: quote?.id ?? '',
      linkedQuoteNumber: quote?.quoteNumber ?? '',
      notes: leadForm.notes,
      nextFollowUpDate: leadForm.nextFollowUpDate,
      activities: leadForm.activities ?? [],
      lostReason: leadForm.lostReason,
      estimatedValue: Number(leadForm.estimatedValue || 0),
    };
    if (leadEditingId) {
      setData((current) => ({ ...current, leads: current.leads.map((lead) => lead.id === leadEditingId ? { ...lead, ...payload } : lead) }));
    } else {
      const leadNumber = generateCode('LED', data.leads.map((lead) => lead.leadNumber), leadForm.enquiryDate || getToday());
      const newLead: Lead = {
        id: leadNumber,
        leadNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setData((current) => ({ ...current, leads: [newLead, ...current.leads] }));
    }
    resetLeadEditor();
  }

  /** Re-schedule a job to a new date / machine from the Production Schedule. */
  function handleRescheduleJob(jobId: string, newDate: string, newMachineId: string) {
    setData((current) => ({
      ...current,
      jobs: current.jobs.map((j) => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          // Use productionStartDate as the scheduling anchor since that's what the
          // grid reads. Keep dueDate untouched (it's a commercial commitment).
          productionStartDate: newDate,
          assignedMachineId: newMachineId,
        };
      }),
    }));
  }

  /** Hand over a leaving rep's selected clients, open leads and open jobs to a
   *  new owner in one shot (phase 35). */
  function handleHandoverOwner(payload: { toName: string; clientIds: string[]; leadIds: string[]; jobIds: string[] }) {
    const { toName } = payload;
    const cs = new Set(payload.clientIds);
    const ls = new Set(payload.leadIds);
    const js = new Set(payload.jobIds);
    if (!toName || (!cs.size && !ls.size && !js.size)) return;
    setData((current) => ({
      ...current,
      clients: current.clients.map((c) => (cs.has(c.id) ? { ...c, accountManagerName: toName } : c)),
      leads: current.leads.map((l) => (ls.has(l.id) ? { ...l, assignedTo: toName } : l)),
      jobs: current.jobs.map((j) => (js.has(j.id) ? { ...j, salesOwnerName: toName } : j)),
    }));
  }

  /** Re-assign a batch of leads to a new salesperson in one shot. */
  function handleBulkReassignLeads(leadIds: string[], newOwner: string) {
    if (leadIds.length === 0 || !newOwner.trim()) return;
    const idSet = new Set(leadIds);
    setData((current) => ({
      ...current,
      leads: current.leads.map((l) => {
        if (!idSet.has(l.id)) return l;
        const reassignNote: LeadActivity = {
          id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          at: new Date().toISOString(),
          type: 'Note',
          byName: profile?.email || 'Manager',
          summary: `Re-assigned from ${l.assignedTo || 'unassigned'} to ${newOwner}.`,
        };
        return {
          ...l,
          assignedTo: newOwner,
          activities: [reassignNote, ...(l.activities ?? [])],
        };
      }),
    }));
    setLeadMessage(`Re-assigned ${leadIds.length} lead(s) to ${newOwner}.`);
  }

  /**
   * Fast capture path used by the pinned Quick Add strip on the Leads page.
   * Persists immediately — no extra confirmation. Returns nothing; the page
   * resets its local capture state on submit so the user can move on.
   */
  function handleQuickAddLead(capture: { contactName: string; phone: string; email: string; source: Lead['source']; productHint: string; requestedQuantity: string }) {
    const today = getToday();
    const leadNumber = generateCode('LED', data.leads.map((l) => l.leadNumber), today);
    const newLead: Lead = {
      id: leadNumber,
      leadNumber,
      createdAt: new Date().toISOString(),
      enquiryDate: today,
      clientId: '',
      clientName: '',
      companyName: capture.contactName.trim() || capture.phone.trim() || 'New enquiry',
      contactName: capture.contactName.trim(),
      phone: capture.phone.trim(),
      email: capture.email.trim(),
      source: capture.source,
      assignedTo: profile?.email || '',
      productId: '',
      productName: capture.productHint.trim(),
      requestedQuantity: Number(capture.requestedQuantity || 0),
      dueDate: '',
      status: 'New',
      quickbooksEstimateNumber: '',
      linkedQuoteId: '',
      linkedQuoteNumber: '',
      notes: '',
      nextFollowUpDate: today,
      activities: [{
        id: `act-${Date.now().toString(36)}`,
        at: new Date().toISOString(),
        type: 'Note',
        byName: profile?.email || 'Quick capture',
        summary: `Captured via Quick Add. ${capture.productHint.trim() ? `Wants: ${capture.productHint.trim()}.` : ''}`.trim(),
      }],
      lostReason: '',
      estimatedValue: 0,
    };
    setData((current) => ({ ...current, leads: [newLead, ...current.leads] }));
    setLeadMessage(`Lead ${leadNumber} captured. Click Open to add detail.`);
  }

  function handleSaveArtwork() {
    if (!artworkForm.jobId || !artworkForm.stage) {
      setArtworkMessage('Linked job and artwork stage are required.');
      return;
    }
    const job = jobsById.get(artworkForm.jobId);
    if (!job) {
      setArtworkMessage('Select a valid job card before saving.');
      return;
    }
    const payload = {
      jobId: job.id,
      jobNumber: job.jobNumber,
      clientId: job.clientId,
      clientName: job.customerName,
      artworkReceivedDate: artworkForm.artworkReceivedDate,
      proofSentDate: artworkForm.proofSentDate,
      approvalDate: artworkForm.approvalDate,
      stage: artworkForm.stage,
      changesRequested: artworkForm.changesRequested,
      notes: artworkForm.notes,
    };
    setData((current) => {
      const nextArtworkRecords = artworkEditingId
        ? current.artworkRecords.map((record) => record.id === artworkEditingId ? { ...record, ...payload } : record)
        : [
          {
            id: generateCode('ART', current.artworkRecords.map((record) => record.artworkNumber), artworkForm.artworkReceivedDate || getToday()),
            artworkNumber: generateCode('ART', current.artworkRecords.map((record) => record.artworkNumber), artworkForm.artworkReceivedDate || getToday()),
            createdAt: new Date().toISOString(),
            ...payload,
          },
          ...current.artworkRecords,
        ];

      return {
        ...current,
        artworkRecords: nextArtworkRecords,
        jobs: current.jobs.map((currentJob) => currentJob.id === job.id ? {
          ...currentJob,
          artworkReceived: artworkForm.stage !== 'Awaiting Artwork' || Boolean(artworkForm.artworkReceivedDate),
          proofSent: ['Proof Sent', 'Approved', 'Changes Requested'].includes(artworkForm.stage) || Boolean(artworkForm.proofSentDate),
          approvalStatus:
            artworkForm.stage === 'Approved'
              ? 'Approved'
              : artworkForm.stage === 'Changes Requested'
                ? 'Changes Requested'
                : artworkForm.stage === 'Proof Sent'
                  ? 'Awaiting Approval'
                  : currentJob.approvalStatus,
          artworkAssignedDate: artworkForm.artworkReceivedDate || currentJob.artworkAssignedDate,
          proofSharedDate: artworkForm.proofSentDate || currentJob.proofSharedDate,
          finalApprovalReceivedDate: artworkForm.approvalDate || currentJob.finalApprovalReceivedDate,
          changesRequested: artworkForm.changesRequested,
          artworkNotes: artworkForm.notes,
        } : currentJob),
      };
    });
    resetArtworkEditor();
  }

  function handleSaveCustomerStockRelease() {
    if (!customerStockReleaseForm.releaseDate || !customerStockReleaseForm.finishedGoodsStockId || !customerStockReleaseForm.quantityReleased) {
      setCustomerStockReleaseMessage('Release date, stock batch, and quantity released are required.');
      return;
    }
    const stock = finishedStockById.get(customerStockReleaseForm.finishedGoodsStockId);
    if (!stock) {
      setCustomerStockReleaseMessage('Select a valid stock batch before saving.');
      return;
    }
    const client = customerStockReleaseForm.clientId ? clientsById.get(customerStockReleaseForm.clientId) : undefined;
    const job = customerStockReleaseForm.jobId ? jobsById.get(customerStockReleaseForm.jobId) : undefined;
    const payload = {
      releaseDate: customerStockReleaseForm.releaseDate,
      clientId: client?.id ?? stock.clientId,
      clientName: client?.name ?? stock.clientName,
      finishedGoodsStockId: stock.id,
      finishedGoodsStockNumber: stock.stockNumber,
      jobId: job?.id ?? '',
      jobNumber: job?.jobNumber ?? '',
      quantityReleased: Number(customerStockReleaseForm.quantityReleased),
      quantityUnit: customerStockReleaseForm.quantityUnit,
      destination: customerStockReleaseForm.destination,
      notes: customerStockReleaseForm.notes,
    };
    if (customerStockReleaseEditingId) {
      setData((current) => ({ ...current, customerStockReleases: current.customerStockReleases.map((release) => release.id === customerStockReleaseEditingId ? { ...release, ...payload } : release) }));
    } else {
      const releaseNumber = generateCode('REL', data.customerStockReleases.map((release) => release.releaseNumber), customerStockReleaseForm.releaseDate);
      const newRelease: CustomerStockRelease = { id: releaseNumber, releaseNumber, createdAt: new Date().toISOString(), ...payload };
      setData((current) => ({ ...current, customerStockReleases: [newRelease, ...current.customerStockReleases] }));
    }
    resetCustomerStockReleaseEditor();
  }

  function addDispatchLineToDeliveryNote(dispatchRecordId: string) {
    if (!dispatchRecordId) {
      setDeliveryNoteMessage('Select a dispatch record before adding a delivery line.');
      return;
    }
    const record = data.dispatchRecords.find((entry) => entry.id === dispatchRecordId);
    if (!record) {
      setDeliveryNoteMessage('Select a valid dispatch record before adding a delivery line.');
      return;
    }
    const linkedJob = record.jobId ? jobsById.get(record.jobId) : undefined;
    const linkedClient = linkedJob?.clientId ? clientsById.get(linkedJob.clientId) : data.clients.find((client) => client.name === record.customerName);
    const linkedStock = record.finishedGoodsStockId ? finishedStockById.get(record.finishedGoodsStockId) : undefined;
    const nextLine = {
      id: `delivery-line-dispatch-${record.id}`,
      description: `${record.jobNumber || 'Dispatch'} delivery`,
      productName: linkedStock?.productName || linkedJob?.productName || 'Dispatched stock',
      stockNumber: record.finishedGoodsStockNumber || '',
      quantity: record.quantityDispatched,
      quantityUnit: record.quantityUnit,
      dispatchRecordId: record.id,
      customerStockReleaseId: '',
    };

    setDeliveryNoteForm((current) => ({
      ...current,
      clientId: current.clientId || linkedClient?.id || '',
      clientContactName: current.clientContactName || linkedClient?.contactName || '',
      clientEmail: current.clientEmail || linkedClient?.contactEmail || '',
      jobId: current.jobId || record.jobId,
      deliveryReference: current.deliveryReference || record.deliveryReference,
      dispatchRecordId: '',
      lineItems: current.lineItems.some((item) => item.dispatchRecordId === record.id)
        ? current.lineItems
        : [...current.lineItems, nextLine],
    }));
    setDeliveryNoteMessage('');
  }

  function addReleaseLineToDeliveryNote(releaseId: string) {
    if (!releaseId) {
      setDeliveryNoteMessage('Select a customer stock release before adding a delivery line.');
      return;
    }
    const release = data.customerStockReleases.find((entry) => entry.id === releaseId);
    if (!release) {
      setDeliveryNoteMessage('Select a valid customer stock release before adding a delivery line.');
      return;
    }
    const linkedStock = release.finishedGoodsStockId ? finishedStockById.get(release.finishedGoodsStockId) : undefined;
    const linkedClient = release.clientId ? clientsById.get(release.clientId) : data.clients.find((client) => client.name === release.clientName);
    const nextLine = {
      id: `delivery-line-release-${release.id}`,
      description: `${release.destination || 'Customer stock'} release`,
      productName: linkedStock?.productName || 'Held stock',
      stockNumber: release.finishedGoodsStockNumber,
      quantity: release.quantityReleased,
      quantityUnit: release.quantityUnit,
      dispatchRecordId: '',
      customerStockReleaseId: release.id,
    };

    setDeliveryNoteForm((current) => ({
      ...current,
      clientId: current.clientId || linkedClient?.id || release.clientId,
      clientContactName: current.clientContactName || linkedClient?.contactName || '',
      clientEmail: current.clientEmail || linkedClient?.contactEmail || '',
      jobId: current.jobId || release.jobId,
      customerStockReleaseId: '',
      lineItems: current.lineItems.some((item) => item.customerStockReleaseId === release.id)
        ? current.lineItems
        : [...current.lineItems, nextLine],
    }));
    setDeliveryNoteMessage('');
  }

  function removeDeliveryLineItem(lineItemId: string) {
    setDeliveryNoteForm((current) => ({
      ...current,
      lineItems: current.lineItems.filter((item) => item.id !== lineItemId),
    }));
  }

  function handleSaveDeliveryNote() {
    if (!deliveryNoteForm.noteDate || !deliveryNoteForm.clientId) {
      setDeliveryNoteMessage('Note date and linked client are required.');
      return;
    }
    if (!deliveryNoteForm.lineItems.length) {
      setDeliveryNoteMessage('Add at least one stock line from dispatch or customer stock release.');
      return;
    }
    const client = clientsById.get(deliveryNoteForm.clientId);
    if (!client) {
      setDeliveryNoteMessage('Select a valid client before saving the delivery note.');
      return;
    }
    const job = deliveryNoteForm.jobId ? jobsById.get(deliveryNoteForm.jobId) : undefined;
    const dispatchRecordIds = Array.from(new Set(deliveryNoteForm.lineItems.map((item) => item.dispatchRecordId).filter(Boolean)));
    const customerStockReleaseIds = Array.from(new Set(deliveryNoteForm.lineItems.map((item) => item.customerStockReleaseId).filter(Boolean)));
    const payload = {
      noteDate: deliveryNoteForm.noteDate,
      clientId: client.id,
      clientName: client.name,
      clientContactName: deliveryNoteForm.clientContactName || client.contactName,
      clientContactPhone: deliveryNoteForm.clientContactPhone,
      clientEmail: deliveryNoteForm.clientEmail || client.contactEmail,
      clientAddress: deliveryNoteForm.clientAddress,
      companyName: deliveryNoteForm.companyName,
      companyPhone: deliveryNoteForm.companyPhone,
      companyEmail: deliveryNoteForm.companyEmail,
      companyAddress: deliveryNoteForm.companyAddress,
      jobId: job?.id ?? '',
      jobNumber: job?.jobNumber ?? '',
      dispatchRecordIds,
      customerStockReleaseIds,
      deliveryMethod: deliveryNoteForm.deliveryMethod,
      deliveryReference: deliveryNoteForm.deliveryReference,
      vehicleRegistration: deliveryNoteForm.vehicleRegistration,
      driverName: deliveryNoteForm.driverName,
      dispatchedBy: deliveryNoteForm.dispatchedBy || currentSalesOwner,
      receivedBy: deliveryNoteForm.receivedBy,
      status: deliveryNoteForm.status,
      clientVisible: deliveryNoteForm.clientVisible,
      lineItems: deliveryNoteForm.lineItems,
      notes: deliveryNoteForm.notes,
      customerNote: deliveryNoteForm.customerNote,
      parentInvoiceId: deliveryNoteForm.parentInvoiceId,
      parentInvoiceNumber: deliveryNoteForm.parentInvoiceId
        ? (data.invoices.find((inv) => inv.id === deliveryNoteForm.parentInvoiceId)?.invoiceNumber ?? '')
        : '',
      receiptMode: deliveryNoteForm.receiptMode,
      signedByName: deliveryNoteForm.signedByName,
      signedByDate: deliveryNoteForm.signedByDate,
      signedByContactInfo: deliveryNoteForm.signedByContactInfo,
      collectedByName: deliveryNoteForm.collectedByName,
      collectedByDate: deliveryNoteForm.collectedByDate,
      collectedByIdNumber: deliveryNoteForm.collectedByIdNumber,
    };

    if (deliveryNoteEditingId) {
      setData((current) => ({
        ...current,
        deliveryNotes: current.deliveryNotes.map((note) => note.id === deliveryNoteEditingId ? { ...note, ...payload } : note),
      }));
    } else {
      const deliveryNoteNumber = generateCode('DLV', data.deliveryNotes.map((note) => note.deliveryNoteNumber), deliveryNoteForm.noteDate);
      const newNote: DeliveryNote = {
        id: deliveryNoteNumber,
        deliveryNoteNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setData((current) => ({
        ...current,
        deliveryNotes: [newNote, ...current.deliveryNotes],
      }));
    }
    resetDeliveryNoteEditor();
  }

  function handleSaveInvoice() {
    if (!invoiceForm.invoiceDate || !invoiceForm.clientId) {
      setInvoiceMessage('Invoice date and client are required.');
      return;
    }
    const usableLines = invoiceForm.lineItems.filter(
      (line) => Number(line.quantity || 0) > 0 && Number(line.unitPriceExclVat || 0) > 0,
    );
    if (!usableLines.length) {
      setInvoiceMessage('Add at least one line with quantity and unit price.');
      return;
    }
    const client = clientsById.get(invoiceForm.clientId);
    if (!client) {
      setInvoiceMessage('Select a valid client before saving the invoice.');
      return;
    }
    const job = invoiceForm.jobId ? jobsById.get(invoiceForm.jobId) : undefined;
    const quote = invoiceForm.quoteId ? quotesById.get(invoiceForm.quoteId) : undefined;
    const spec = invoiceForm.productionSpecId ? data.productionSpecs.find((s) => s.id === invoiceForm.productionSpecId) : undefined;

    const lineItems = invoiceForm.lineItems.map((line) => {
      const qty = Number(line.quantity || 0);
      const price = Number(line.unitPriceExclVat || 0);
      const vatPct = Number(line.vatRatePercent || 0);
      const lineExcl = qty * price;
      const lineIncl = lineExcl * (1 + vatPct / 100);
      return {
        id: line.id,
        productId: line.productId,
        productName: line.productName,
        description: line.description,
        quantity: qty,
        quantityUnit: line.quantityUnit,
        unitPriceExclVat: price,
        vatRatePercent: vatPct,
        lineTotalExclVat: lineExcl,
        lineTotalInclVat: lineIncl,
        quantityDeliveredToDate: 0,
      };
    });
    const subtotalExclVat = lineItems.reduce((acc, l) => acc + l.lineTotalExclVat, 0);
    const totalInclVat = lineItems.reduce((acc, l) => acc + l.lineTotalInclVat, 0);
    const vatTotal = totalInclVat - subtotalExclVat;
    const payments = invoiceForm.payments.map((pay) => ({
      id: pay.id,
      paymentDate: pay.paymentDate,
      amount: Number(pay.amount || 0),
      method: pay.method,
      reference: pay.reference,
      notes: pay.notes,
    }));
    const amountPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const amountOutstanding = Math.max(0, totalInclVat - amountPaid);

    const billingAddress = [
      client.billingAddressLine1,
      client.billingAddressLine2,
      [client.billingCity, client.billingState, client.billingPostalCode].filter(Boolean).join(', '),
      client.billingCountry,
    ].filter(Boolean).join('\n');

    const payload = {
      invoiceDate: invoiceForm.invoiceDate,
      dueDate: invoiceForm.dueDate,
      clientId: client.id,
      clientName: client.name,
      clientCompanyName: client.companyName,
      clientVatNumber: client.vatNumber,
      clientBillingAddress: billingAddress,
      clientContactName: client.contactName,
      clientContactEmail: client.contactEmail,
      clientContactPhone: client.phoneNumber || client.mobileNumber,
      jobId: job?.id ?? '',
      jobNumber: job?.jobNumber ?? '',
      quoteId: quote?.id ?? '',
      quoteNumber: quote?.quoteNumber ?? '',
      productionSpecId: spec?.id ?? '',
      productionSpecNumber: spec?.specNumber ?? '',
      customerReference: invoiceForm.customerReference,
      termsType: invoiceForm.termsType,
      termsText: invoiceForm.termsText,
      notes: invoiceForm.notes,
      footerNotes: invoiceForm.footerNotes,
      customerNote: invoiceForm.customerNote,
      status: invoiceForm.status,
      currency: invoiceForm.currency,
      exchangeRate: getRate(invoiceForm.currency, data.appSettings.currencyConfig),
      lineItems,
      subtotalExclVat,
      vatTotal,
      totalInclVat,
      payments,
      amountPaid,
      amountOutstanding,
      stockHoldingApplies: invoiceForm.stockHoldingApplies,
      stockHoldingStatus: invoiceForm.stockHoldingApplies
        ? (amountOutstanding > 0 ? 'Active' : (lineItems.every((l) => l.quantityDeliveredToDate >= l.quantity) ? 'Fully Released' : 'Active'))
        : 'Not Applicable',
      stockHoldingStartDate: invoiceForm.stockHoldingStartDate,
      stockHoldingMaxDays: Number(invoiceForm.stockHoldingMaxDays || 0),
      deliveryNoteIds: [] as string[],
      clientVisible: invoiceForm.clientVisible,
    } as const;

    if (invoiceEditingId) {
      setData((current) => ({
        ...current,
        invoices: current.invoices.map((inv) => inv.id === invoiceEditingId ? { ...inv, ...payload } : inv),
      }));
    } else {
      const invoiceNumber = generateCode('INV', data.invoices.map((inv) => inv.invoiceNumber), invoiceForm.invoiceDate);
      const newInvoice: Invoice = {
        id: invoiceNumber,
        invoiceNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setData((current) => ({
        ...current,
        invoices: [newInvoice, ...current.invoices],
      }));
    }
    resetInvoiceEditor();
  }

  function handleSaveProductionSpec() {
    if (!productionSpecForm.clientId || !productionSpecForm.productId) {
      setProductionSpecMessage('Client and product are required.');
      return;
    }
    const client = clientsById.get(productionSpecForm.clientId);
    const product = productsById.get(productionSpecForm.productId);
    if (!client || !product) {
      setProductionSpecMessage('Select a valid client and product.');
      return;
    }
    const job = productionSpecForm.jobId ? jobsById.get(productionSpecForm.jobId) : undefined;
    const payload = {
      specDate: productionSpecForm.specDate,
      status: productionSpecForm.status,
      clientId: client.id,
      clientName: client.name,
      clientCompanyName: client.companyName,
      productId: product.id,
      productName: product.name,
      jobId: job?.id ?? '',
      jobNumber: job?.jobNumber ?? '',
      sizeWidthMm: Number(productionSpecForm.sizeWidthMm || 0),
      sizeHeightMm: Number(productionSpecForm.sizeHeightMm || 0),
      sizeGussetMm: Number(productionSpecForm.sizeGussetMm || 0),
      paperGsm: Number(productionSpecForm.paperGsm || 0),
      paperType: productionSpecForm.paperType,
      handleType: productionSpecForm.handleType,
      finishingNotes: productionSpecForm.finishingNotes,
      printMethod: productionSpecForm.printMethod,
      printColours: Number(productionSpecForm.printColours || 0),
      pantoneReferences: productionSpecForm.pantoneReferences,
      artworkReference: productionSpecForm.artworkReference,
      printPositionNotes: productionSpecForm.printPositionNotes,
      quantityOrdered: Number(productionSpecForm.quantityOrdered || 0),
      quantityUnit: productionSpecForm.quantityUnit,
      leadTimeDays: Number(productionSpecForm.leadTimeDays || 0),
      packingFormat: productionSpecForm.packingFormat,
      packingNotes: productionSpecForm.packingNotes,
      approvedBy: productionSpecForm.approvedBy,
      approvedDate: productionSpecForm.approvedDate,
      notes: productionSpecForm.notes,
      clientVisible: productionSpecForm.clientVisible,
    };

    if (productionSpecEditingId) {
      setData((current) => ({
        ...current,
        productionSpecs: current.productionSpecs.map((s) => s.id === productionSpecEditingId ? { ...s, ...payload } : s),
      }));
    } else {
      const specNumber = generateCode('SPEC', data.productionSpecs.map((s) => s.specNumber), productionSpecForm.specDate);
      const newSpec: ProductionSpec = {
        id: specNumber,
        specNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      setData((current) => ({
        ...current,
        productionSpecs: [newSpec, ...current.productionSpecs],
      }));
    }
    resetProductionSpecEditor();
  }

  async function handleSaveJob() {
    if (!jobForm.jobDate || !jobForm.customerName || !jobForm.productName || !jobForm.quantityPlanned || !jobForm.status) {
      setJobMessage('Job date, customer, product, quantity planned, and status are required.');
      return;
    }
    const previousJob = jobEditingId ? data.jobs.find((job) => job.id === jobEditingId) : undefined;
    // Optimistic concurrency guard (phase 14). Only meaningful on edits — a
    // fresh insert has no row to conflict with. We don't BLOCK the save on
    // an "unknown" result (RLS, missing column, network) so the UX degrades
    // gracefully to last-write-wins, matching pre-phase-14 behaviour.
    if (previousJob && previousJob.version !== undefined) {
      const versionCheck = await detectVersionConflict('jobs', previousJob.id, previousJob.version);
      if (versionCheck.kind === 'conflict') {
        setJobMessage(
          `This job was modified by someone else (their version ${versionCheck.dbVersion}, yours ${previousJob.version}). Refresh to see their changes, then re-apply yours.`,
        );
        return;
      }
    }
    const linkedClient = jobForm.clientId ? clientsById.get(jobForm.clientId) : undefined;
    const linkedProduct = jobForm.productId ? productsById.get(jobForm.productId) : undefined;
    const linkedQuote = jobForm.quoteId ? quotesById.get(jobForm.quoteId) : undefined;
    const linkedLead = jobForm.leadId ? data.leads.find((lead) => lead.id === jobForm.leadId) : undefined;
    const linkedReservationStock = jobForm.reservedFinishedGoodsStockId ? finishedStockById.get(jobForm.reservedFinishedGoodsStockId) : undefined;
    const reservedQuantity = Number(jobForm.reservedQuantity || 0);
    const commercialCleared = jobForm.commercialReleaseStatus === 'Cleared for Production';
    const orderValue = Number(jobForm.orderValue || linkedQuote?.totalQuote || 0);
    const availableCredit = linkedClient ? Math.max(linkedClient.creditLimit - effectiveClientBalance(linkedClient), 0) : 0;
    const paymentRequirement = jobForm.paymentRequirement;
    const paymentStatus = jobForm.paymentStatus;
    const creditCheckStatus = paymentRequirement === 'Credit Terms'
      ? (paymentStatus === 'Credit Limit Applied' && orderValue > 0 && orderValue <= availableCredit ? 'Within Limit' : 'Blocked')
      : 'Not Required';
    const paperQuantityRequired = Number(jobForm.paperQuantityRequired || 0);

    if (jobForm.reserveFromStock && !commercialCleared) {
      setJobMessage('Commercial clearance is required before reserving finished stock.');
      return;
    }

    if (jobForm.reserveFromStock) {
      if (!linkedReservationStock || !reservedQuantity) {
        setJobMessage('Select a stock batch and reserved quantity when reserving stock.');
        return;
      }
      const restoredAvailable =
        previousJob && previousJob.reservedFinishedGoodsStockId === linkedReservationStock.id
          ? linkedReservationStock.quantityAvailable + previousJob.reservedQuantity
          : linkedReservationStock.quantityAvailable;
      if (reservedQuantity > restoredAvailable) {
        setJobMessage(`Reserved quantity exceeds available stock. Available: ${restoredAvailable} ${linkedReservationStock.quantityUnit}.`);
        return;
      }
    }

    // Food-safety gate (Phase 1 + Phase 2). A food-packaging job (any level
    // != NonFood) must have approved materials selected at draft, and once
    // cleared for production it must pass the full release gate: approved
    // materials + recent cleaning + complete changeover + QC sign-off.
    if (isFoodPackagingLevel(jobForm.foodContactLevel)) {
      if (commercialCleared) {
        // Build a hypothetical post-save JobCard so the release-gate validator
        // can examine the about-to-be-saved state, not stale DB state.
        const hypothetical = {
          id: previousJob?.id ?? 'pending',
          jobNumber: previousJob?.jobNumber ?? 'pending',
          foodContactLevel: jobForm.foodContactLevel,
          foodSafeMaterialIds: jobForm.foodSafeMaterialIds,
          assignedMachineId: jobForm.assignedMachineId,
          changeoverChecklist: jobForm.changeoverChecklist,
          qcPlan: jobForm.qcPlan,
        } as unknown as JobCard;
        const blocks = validateJobReleaseGate({
          job: hypothetical,
          approvedMaterials: data.foodSafeMaterials,
          cleaningLogs: data.cleaningLogs,
          machines: data.machines,
        });
        if (blocks.length > 0) {
          setJobMessage(`Food safety release block — ${blocks.map((b) => b.reason).join(' · ')}`);
          return;
        }
      } else {
        // Pre-release: at minimum require materials to be selected.
        const blocks = validateJobFoodSafety(
          jobForm.foodContactLevel,
          jobForm.foodSafeMaterialIds,
          data.foodSafeMaterials,
        );
        const blockingNow = blocks.filter((b) => b.reason.includes('no approved materials'));
        if (blockingNow.length > 0) {
          setJobMessage(`Food safety block — ${blockingNow.map((b) => b.reason).join(' · ')}`);
          return;
        }
      }
    }

    if (commercialCleared) {
      if (!linkedClient) {
        setJobMessage('Select a linked client before clearing a job for production.');
        return;
      }
      if (linkedClient.accountHold) {
        setJobMessage(`Client account is on hold. ${linkedClient.name} cannot be released to production.`);
        return;
      }
      if (!jobForm.invoiceNumber.trim()) {
        setJobMessage('Invoice number is required before clearing a job for production.');
        return;
      }
      if (paymentRequirement === '50% Deposit' && paymentStatus !== '50% Paid' && paymentStatus !== 'Full Payment Received') {
        setJobMessage('This client requires a deposit before the job can be cleared.');
        return;
      }
      if (paymentRequirement === 'Full Payment' && paymentStatus !== 'Full Payment Received') {
        setJobMessage('Full payment must be received before the job can be cleared.');
        return;
      }
      if (paymentRequirement === 'Credit Terms') {
        if (paymentStatus !== 'Credit Limit Applied') {
          setJobMessage('Mark the job as Credit Limit Applied once the credit check passes.');
          return;
        }
        if (orderValue <= 0) {
          setJobMessage('Order value is required to validate the client credit limit.');
          return;
        }
        if (orderValue > availableCredit) {
          setJobMessage(`Order value exceeds available credit. Available credit: R ${availableCredit.toFixed(2)}.`);
          return;
        }
      }
    }

    // Credit smart-block (applies to every payment requirement, not just
    // Credit Terms). Even on deposit / full-payment jobs, if this client
    // is already over their credit limit OR the new order tips them over,
    // we block production clearance.
    if (commercialCleared && linkedClient && linkedClient.creditLimit > 0) {
      const liveBalance = effectiveClientBalance(linkedClient);
      const projectedBalance = liveBalance + orderValue;
      if (projectedBalance > linkedClient.creditLimit) {
        const overflow = projectedBalance - linkedClient.creditLimit;
        setJobMessage(
          `Credit block — ${linkedClient.name} would be R ${overflow.toFixed(2)} over their R ${linkedClient.creditLimit.toFixed(0)} credit limit. Current balance: R ${liveBalance.toFixed(2)}. Collect outstanding before clearing this job.`,
        );
        return;
      }
      // Soft warning at 90% — saves but flags in the message so the
      // salesperson sees it before pressing again.
      const utilisation = projectedBalance / linkedClient.creditLimit;
      if (utilisation >= 0.9) {
        setJobMessage(
          `Saved. Heads up — ${linkedClient.name} will be at ${Math.round(utilisation * 100)}% of credit limit after this job (R ${projectedBalance.toFixed(2)} / R ${linkedClient.creditLimit.toFixed(0)}). Chase outstanding before the next order.`,
        );
        // Don't return — let save proceed.
      }
    }

    const matchingReceipts = data.materialReceipts.filter((receipt) =>
      matchesText(receipt.paperType, jobForm.paperType) &&
      matchesText(receipt.gsm, jobForm.gsm) &&
      receipt.quantityUnit === jobForm.paperQuantityUnit,
    );
    const availablePaperQuantity = Math.max(
      matchingReceipts.reduce((sum, receipt) => sum + receipt.quantityAvailable, 0),
      0,
    );
    const paperShortage = commercialCleared && paperQuantityRequired > 0
      ? Math.max(paperQuantityRequired - availablePaperQuantity, 0)
      : 0;

    const buildJobSnapshot = (base: JobCard): JobCard => ({
      ...base,
      jobDate: jobForm.jobDate,
      dueDate: jobForm.dueDate,
      leadId: jobForm.leadId,
      leadNumber: jobForm.leadNumber,
      quoteId: jobForm.quoteId,
      quoteNumber: jobForm.quoteNumber,
      quickbooksEstimateNumber: jobForm.quickbooksEstimateNumber,
      invoiceNumber: jobForm.invoiceNumber,
      salesOwnerName: linkedQuote?.salesOwnerName || linkedLead?.assignedTo || base.salesOwnerName || '',
      orderValue,
      paymentRequirement,
      paymentStatus,
      creditCheckStatus,
      availableCreditAtApproval: paymentRequirement === 'Credit Terms' ? availableCredit : 0,
      commercialReleaseStatus: jobForm.commercialReleaseStatus,
      clientId: jobForm.clientId,
      pricingTierId: jobForm.pricingTierId,
      productId: jobForm.productId,
      productCategory: jobForm.productCategory,
      customerName: jobForm.customerName,
      customerReference: jobForm.customerReference,
      productName: jobForm.productName,
      description: jobForm.description,
      sizeSpec: jobForm.sizeSpec,
      paperType: jobForm.paperType,
      gsm: jobForm.gsm,
      paperQuantityRequired,
      paperQuantityUnit: jobForm.paperQuantityUnit,
      paperAllocationStatus: commercialCleared
        ? (paperQuantityRequired > 0 ? (paperShortage > 0 ? 'Order Required' : 'In Stock') : 'Not Checked')
        : 'Not Checked',
      printRequired: jobForm.printRequired,
      printMethod: jobForm.printMethod,
      colorCount: Number(jobForm.colorCount || 0),
      supplyFormat: jobForm.supplyFormat,
      packingNotes: jobForm.packingNotes,
      printNotes: jobForm.printNotes,
      quantityPlanned: Number(jobForm.quantityPlanned),
      quantityCompleted: Number(jobForm.quantityCompleted || 0),
      status: jobForm.status,
      artworkReceived: jobForm.artworkReceived,
      proofSent: jobForm.proofSent,
      approvalStatus: jobForm.approvalStatus,
      approvalDate: jobForm.approvalDate,
      artworkPreparationStatus: jobForm.artworkPreparationStatus,
      addElementsRequired: jobForm.addElementsRequired,
      colorChangesRequired: jobForm.colorChangesRequired,
      artworkChangeSummary: jobForm.artworkChangeSummary,
      artworkAssignedDate: jobForm.artworkAssignedDate,
      artworkAssignedTo: jobForm.artworkAssignedTo,
      proofSharedDate: jobForm.proofSharedDate,
      proofSharedBy: jobForm.proofSharedBy,
      finalApprovalReceivedDate: jobForm.finalApprovalReceivedDate,
      finalApprovalClearedBy: jobForm.finalApprovalClearedBy,
      factoryReleaseDate: jobForm.factoryReleaseDate,
      factoryReleasedBy: jobForm.factoryReleasedBy,
      productionStartDate: jobForm.productionStartDate,
      productionStartedBy: jobForm.productionStartedBy,
      readyForDispatchDate: jobForm.readyForDispatchDate,
      readyForDispatchBy: jobForm.readyForDispatchBy,
      collectionOrDeliveryStatus: jobForm.collectionOrDeliveryStatus,
      changesRequested: jobForm.changesRequested,
      artworkNotes: jobForm.artworkNotes,
      reserveFromStock: jobForm.reserveFromStock,
      reservedFinishedGoodsStockId: commercialCleared && jobForm.reserveFromStock ? linkedReservationStock?.id ?? '' : '',
      reservedFinishedGoodsStockNumber: commercialCleared && jobForm.reserveFromStock ? linkedReservationStock?.stockNumber ?? '' : '',
      reservedQuantity: commercialCleared && jobForm.reserveFromStock ? reservedQuantity : 0,
      stockReservationStatus: commercialCleared ? (jobForm.reserveFromStock && linkedReservationStock ? 'Reserved' : 'Production Needed') : 'Not Checked',
      dispatchStatus: jobForm.dispatchStatus,
      qualityNotes: jobForm.qualityNotes,
      capturedBy: jobForm.capturedBy,
      releasedBy: jobForm.releasedBy,
      notes: jobForm.notes,
      fscRelated: jobForm.fscRelated,
      foodContactLevel: jobForm.foodContactLevel,
      foodSafeMaterialIds: jobForm.foodSafeMaterialIds,
      internalBatchNumber: jobForm.internalBatchNumber,
      foodSafetyNotes: jobForm.foodSafetyNotes,
      assignedMachineId: jobForm.assignedMachineId,
      changeoverChecklist: jobForm.changeoverChecklist,
      qcPlan: jobForm.qcPlan,
    });

    setJobMessage('');
    if (jobEditingId) {
      if (!previousJob) {
        setJobMessage('The selected job could not be found.');
        return;
      }
      const nextEditedJob = buildJobSnapshot(previousJob);
      setData((current) => {
        let nextFinishedStock = current.finishedGoodsStock.map((item) => ({ ...item }));
        let nextMaterialOrderRequests = current.materialOrderRequests.map((request) => ({ ...request }));

        if (previousJob?.reservedFinishedGoodsStockId) {
          nextFinishedStock = nextFinishedStock.map((item) => item.id === previousJob.reservedFinishedGoodsStockId ? {
            ...item,
            quantityReserved: Math.max(item.quantityReserved - previousJob.reservedQuantity, 0),
            quantityAvailable: item.quantityAvailable + previousJob.reservedQuantity,
            stockStatus: Math.max(item.quantityReserved - previousJob.reservedQuantity, 0) > 0 ? item.stockStatus : 'In Storage',
          } : item);
        }
        if (commercialCleared && jobForm.reserveFromStock && linkedReservationStock) {
          nextFinishedStock = nextFinishedStock.map((item) => item.id === linkedReservationStock.id ? {
            ...item,
            quantityReserved: item.quantityReserved + reservedQuantity,
            quantityAvailable: Math.max(item.quantityAvailable - reservedQuantity, 0),
            stockStatus: 'Reserved',
          } : item);
        }

        let linkedMaterialOrderId = previousJob?.linkedMaterialOrderId ?? '';
        let paperAllocationStatus: JobCard['paperAllocationStatus'] = commercialCleared
          ? (paperQuantityRequired > 0 ? (paperShortage > 0 ? 'Order Required' : 'In Stock') : 'Not Checked')
          : 'Not Checked';

        if (previousJob?.linkedMaterialOrderId && paperShortage <= 0) {
          nextMaterialOrderRequests = nextMaterialOrderRequests.map((request) =>
            request.id === previousJob.linkedMaterialOrderId
              ? { ...request, status: 'Cancelled', notes: 'Cancelled automatically after job paper availability was updated.' }
              : request,
          );
          linkedMaterialOrderId = '';
        }

        if (paperShortage > 0) {
          if (previousJob?.linkedMaterialOrderId) {
            nextMaterialOrderRequests = nextMaterialOrderRequests.map((request) =>
              request.id === previousJob.linkedMaterialOrderId
                ? {
                    ...request,
                    requestedDate: jobForm.jobDate,
                    status: request.status === 'Received' ? request.status : 'Requested',
                    clientId: linkedClient?.id ?? '',
                    clientName: linkedClient?.name ?? jobForm.customerName,
                    productId: linkedProduct?.id ?? '',
                    productName: linkedProduct?.name ?? jobForm.productName,
                    paperType: jobForm.paperType,
                    gsm: jobForm.gsm,
                    quantityRequired: paperQuantityRequired,
                    quantityUnit: jobForm.paperQuantityUnit,
                    shortageQuantity: paperShortage,
                    supplierId: linkedProduct?.defaultSupplierId ?? '',
                    supplierName: linkedProduct?.defaultSupplierName ?? '',
                    requestedBy: profile?.fullName || profile?.email || 'Unknown user',
                    notes: `Auto-updated from ${jobForm.jobDate} job release.`,
                  }
                : request,
            );
            linkedMaterialOrderId = previousJob.linkedMaterialOrderId;
          } else {
            const orderNumber = generateCode('POR', current.materialOrderRequests.map((request) => request.orderNumber), jobForm.jobDate);
            const newOrder: MaterialOrderRequest = {
              id: orderNumber,
              orderNumber,
              createdAt: new Date().toISOString(),
              requestedDate: jobForm.jobDate,
              status: 'Requested',
              jobId: jobEditingId,
              jobNumber: previousJob?.jobNumber ?? '',
              clientId: linkedClient?.id ?? '',
              clientName: linkedClient?.name ?? jobForm.customerName,
              productId: linkedProduct?.id ?? '',
              productName: linkedProduct?.name ?? jobForm.productName,
              paperType: jobForm.paperType,
              gsm: jobForm.gsm,
              quantityRequired: paperQuantityRequired,
              quantityUnit: jobForm.paperQuantityUnit,
              shortageQuantity: paperShortage,
              supplierId: linkedProduct?.defaultSupplierId ?? '',
              supplierName: linkedProduct?.defaultSupplierName ?? '',
              requestedBy: profile?.fullName || profile?.email || 'Unknown user',
              notes: `Auto-created from ${previousJob?.jobNumber ?? 'job'} because paper stock is short.`,
            };
            nextMaterialOrderRequests = [newOrder, ...nextMaterialOrderRequests];
            linkedMaterialOrderId = newOrder.id;
          }
        }

        return {
          ...current,
          artworkRecords: syncArtworkRecordWithJob(current.artworkRecords, nextEditedJob),
          finishedGoodsStock: nextFinishedStock,
          materialOrderRequests: nextMaterialOrderRequests,
          jobs: current.jobs.map((job) => job.id === jobEditingId ? {
            ...job,
            jobDate: jobForm.jobDate,
            dueDate: jobForm.dueDate,
            leadId: jobForm.leadId,
            leadNumber: jobForm.leadNumber,
            quoteId: jobForm.quoteId,
            quoteNumber: jobForm.quoteNumber,
            quickbooksEstimateNumber: jobForm.quickbooksEstimateNumber,
            invoiceNumber: jobForm.invoiceNumber,
            salesOwnerName: linkedQuote?.salesOwnerName || linkedLead?.assignedTo || job.salesOwnerName || '',
            orderValue,
            paymentRequirement,
            paymentStatus,
            creditCheckStatus,
            availableCreditAtApproval: paymentRequirement === 'Credit Terms' ? availableCredit : 0,
            commercialReleaseStatus: jobForm.commercialReleaseStatus,
            clientId: jobForm.clientId,
            pricingTierId: jobForm.pricingTierId,
            productId: jobForm.productId,
            productCategory: jobForm.productCategory,
            customerName: jobForm.customerName,
            customerReference: jobForm.customerReference,
            productName: jobForm.productName,
            description: jobForm.description,
            sizeSpec: jobForm.sizeSpec,
            paperType: jobForm.paperType,
            gsm: jobForm.gsm,
            paperQuantityRequired,
            paperQuantityUnit: jobForm.paperQuantityUnit,
            paperAllocationStatus,
            linkedMaterialOrderId,
            printRequired: jobForm.printRequired,
            printMethod: jobForm.printMethod,
            colorCount: Number(jobForm.colorCount || 0),
            supplyFormat: jobForm.supplyFormat,
            packingNotes: jobForm.packingNotes,
            printNotes: jobForm.printNotes,
            quantityPlanned: Number(jobForm.quantityPlanned),
            quantityCompleted: Number(jobForm.quantityCompleted || 0),
            status: jobForm.status,
            artworkReceived: jobForm.artworkReceived,
            proofSent: jobForm.proofSent,
            approvalStatus: jobForm.approvalStatus,
            approvalDate: jobForm.approvalDate,
            artworkPreparationStatus: jobForm.artworkPreparationStatus,
            addElementsRequired: jobForm.addElementsRequired,
            colorChangesRequired: jobForm.colorChangesRequired,
            artworkChangeSummary: jobForm.artworkChangeSummary,
            artworkAssignedDate: jobForm.artworkAssignedDate,
            artworkAssignedTo: jobForm.artworkAssignedTo,
            proofSharedDate: jobForm.proofSharedDate,
            proofSharedBy: jobForm.proofSharedBy,
            finalApprovalReceivedDate: jobForm.finalApprovalReceivedDate,
            finalApprovalClearedBy: jobForm.finalApprovalClearedBy,
            factoryReleaseDate: jobForm.factoryReleaseDate,
            factoryReleasedBy: jobForm.factoryReleasedBy,
            productionStartDate: jobForm.productionStartDate,
            productionStartedBy: jobForm.productionStartedBy,
            readyForDispatchDate: jobForm.readyForDispatchDate,
            readyForDispatchBy: jobForm.readyForDispatchBy,
            collectionOrDeliveryStatus: jobForm.collectionOrDeliveryStatus,
            changesRequested: jobForm.changesRequested,
            artworkNotes: jobForm.artworkNotes,
            reserveFromStock: jobForm.reserveFromStock,
            reservedFinishedGoodsStockId: commercialCleared && jobForm.reserveFromStock ? linkedReservationStock?.id ?? '' : '',
            reservedFinishedGoodsStockNumber: commercialCleared && jobForm.reserveFromStock ? linkedReservationStock?.stockNumber ?? '' : '',
            reservedQuantity: commercialCleared && jobForm.reserveFromStock ? reservedQuantity : 0,
            stockReservationStatus: commercialCleared ? (jobForm.reserveFromStock && linkedReservationStock ? 'Reserved' : 'Production Needed') : 'Not Checked',
            dispatchStatus: jobForm.dispatchStatus,
            qualityNotes: jobForm.qualityNotes,
            capturedBy: jobForm.capturedBy,
            releasedBy: jobForm.releasedBy,
            notes: jobForm.notes,
            fscRelated: jobForm.fscRelated,
            foodContactLevel: jobForm.foodContactLevel,
            foodSafeMaterialIds: jobForm.foodSafeMaterialIds,
            internalBatchNumber: jobForm.internalBatchNumber,
            foodSafetyNotes: jobForm.foodSafetyNotes,
            assignedMachineId: jobForm.assignedMachineId,
            changeoverChecklist: jobForm.changeoverChecklist,
            qcPlan: jobForm.qcPlan,
          } : job),
        };
      });
      focusSavedJob(nextEditedJob);
      void syncJobThread(nextEditedJob, previousJob, profile).catch((error) => {
        console.error('Failed to sync job thread', error);
      });
    } else {
      const jobNumber = generateCode('JOB', data.jobs.map((job) => job.jobNumber), jobForm.jobDate);
      let linkedMaterialOrderId = '';
      let paperAllocationStatus: JobCard['paperAllocationStatus'] = commercialCleared
        ? (paperQuantityRequired > 0 ? (paperShortage > 0 ? 'Order Required' : 'In Stock') : 'Not Checked')
        : 'Not Checked';
      const newJob: JobCard = {
        id: jobNumber,
        jobNumber,
        createdAt: new Date().toISOString(),
        jobDate: jobForm.jobDate,
        dueDate: jobForm.dueDate,
        leadId: jobForm.leadId,
        leadNumber: jobForm.leadNumber,
        quoteId: jobForm.quoteId,
        quoteNumber: jobForm.quoteNumber,
        quickbooksEstimateNumber: jobForm.quickbooksEstimateNumber,
        invoiceNumber: jobForm.invoiceNumber,
        salesOwnerName: linkedQuote?.salesOwnerName || linkedLead?.assignedTo || '',
        orderValue,
        paymentRequirement,
        paymentStatus,
        creditCheckStatus,
        availableCreditAtApproval: paymentRequirement === 'Credit Terms' ? availableCredit : 0,
        commercialReleaseStatus: jobForm.commercialReleaseStatus,
        clientId: jobForm.clientId,
        pricingTierId: jobForm.pricingTierId,
        productId: jobForm.productId,
        productCategory: jobForm.productCategory,
        customerName: jobForm.customerName,
        customerReference: jobForm.customerReference,
        productName: jobForm.productName,
        description: jobForm.description,
        sizeSpec: jobForm.sizeSpec,
        paperType: jobForm.paperType,
        gsm: jobForm.gsm,
        paperQuantityRequired,
        paperQuantityUnit: jobForm.paperQuantityUnit,
        paperAllocationStatus,
        linkedMaterialOrderId: '',
        printRequired: jobForm.printRequired,
        printMethod: jobForm.printMethod,
        colorCount: Number(jobForm.colorCount || 0),
        supplyFormat: jobForm.supplyFormat,
        packingNotes: jobForm.packingNotes,
        printNotes: jobForm.printNotes,
        quantityPlanned: Number(jobForm.quantityPlanned),
        quantityCompleted: Number(jobForm.quantityCompleted || 0),
        status: jobForm.status,
        artworkReceived: jobForm.artworkReceived,
        proofSent: jobForm.proofSent,
        approvalStatus: jobForm.approvalStatus,
        approvalDate: jobForm.approvalDate,
        artworkPreparationStatus: jobForm.artworkPreparationStatus,
        addElementsRequired: jobForm.addElementsRequired,
        colorChangesRequired: jobForm.colorChangesRequired,
        artworkChangeSummary: jobForm.artworkChangeSummary,
        artworkAssignedDate: jobForm.artworkAssignedDate,
        artworkAssignedTo: jobForm.artworkAssignedTo,
        proofSharedDate: jobForm.proofSharedDate,
        proofSharedBy: jobForm.proofSharedBy,
        finalApprovalReceivedDate: jobForm.finalApprovalReceivedDate,
        finalApprovalClearedBy: jobForm.finalApprovalClearedBy,
        factoryReleaseDate: jobForm.factoryReleaseDate,
        factoryReleasedBy: jobForm.factoryReleasedBy,
        productionStartDate: jobForm.productionStartDate,
        productionStartedBy: jobForm.productionStartedBy,
        readyForDispatchDate: jobForm.readyForDispatchDate,
        readyForDispatchBy: jobForm.readyForDispatchBy,
        collectionOrDeliveryStatus: jobForm.collectionOrDeliveryStatus,
        changesRequested: jobForm.changesRequested,
        artworkNotes: jobForm.artworkNotes,
        reserveFromStock: jobForm.reserveFromStock,
        reservedFinishedGoodsStockId: commercialCleared && jobForm.reserveFromStock ? linkedReservationStock?.id ?? '' : '',
        reservedFinishedGoodsStockNumber: commercialCleared && jobForm.reserveFromStock ? linkedReservationStock?.stockNumber ?? '' : '',
        reservedQuantity: commercialCleared && jobForm.reserveFromStock ? reservedQuantity : 0,
        stockReservationStatus: commercialCleared ? (jobForm.reserveFromStock && linkedReservationStock ? 'Reserved' : 'Production Needed') : 'Not Checked',
        dispatchStatus: jobForm.dispatchStatus,
        qualityNotes: jobForm.qualityNotes,
        capturedBy: jobForm.capturedBy,
        releasedBy: jobForm.releasedBy,
        notes: jobForm.notes,
        fscRelated: jobForm.fscRelated,
        foodContactLevel: jobForm.foodContactLevel,
        foodSafeMaterialIds: jobForm.foodSafeMaterialIds,
        internalBatchNumber: jobForm.internalBatchNumber
          || (isFoodPackagingLevel(jobForm.foodContactLevel)
            ? generateCode('FSB', data.foodSafeMaterials.map((m) => m.internalBatchNumber).filter(Boolean), jobForm.jobDate)
            : ''),
        foodSafetyNotes: jobForm.foodSafetyNotes,
        assignedMachineId: jobForm.assignedMachineId,
        changeoverChecklist: jobForm.changeoverChecklist,
        qcPlan: jobForm.qcPlan,
      };

      const nextMaterialOrders = [...data.materialOrderRequests];
      if (paperShortage > 0) {
        const orderNumber = generateCode('POR', data.materialOrderRequests.map((request) => request.orderNumber), jobForm.jobDate);
        const newOrder: MaterialOrderRequest = {
          id: orderNumber,
          orderNumber,
          createdAt: new Date().toISOString(),
          requestedDate: jobForm.jobDate,
          status: 'Requested',
          jobId: newJob.id,
          jobNumber: newJob.jobNumber,
          clientId: linkedClient?.id ?? '',
          clientName: linkedClient?.name ?? jobForm.customerName,
          productId: linkedProduct?.id ?? '',
          productName: linkedProduct?.name ?? jobForm.productName,
          paperType: jobForm.paperType,
          gsm: jobForm.gsm,
          quantityRequired: paperQuantityRequired,
          quantityUnit: jobForm.paperQuantityUnit,
          shortageQuantity: paperShortage,
          supplierId: linkedProduct?.defaultSupplierId ?? '',
          supplierName: linkedProduct?.defaultSupplierName ?? '',
          requestedBy: profile?.fullName || profile?.email || 'Unknown user',
          notes: `Auto-created from ${newJob.jobNumber} because paper stock is short.`,
        };
        nextMaterialOrders.unshift(newOrder);
        newJob.linkedMaterialOrderId = newOrder.id;
        paperAllocationStatus = 'Order Required';
        newJob.paperAllocationStatus = paperAllocationStatus;
      }

      setData((current) => ({
        ...current,
        artworkRecords: syncArtworkRecordWithJob(current.artworkRecords, newJob),
        finishedGoodsStock: current.finishedGoodsStock.map((item) => commercialCleared && jobForm.reserveFromStock && linkedReservationStock && item.id === linkedReservationStock.id ? {
          ...item,
          quantityReserved: item.quantityReserved + reservedQuantity,
          quantityAvailable: Math.max(item.quantityAvailable - reservedQuantity, 0),
          stockStatus: 'Reserved',
        } : item),
        materialOrderRequests: nextMaterialOrders,
        jobs: [newJob, ...current.jobs],
        // When a job is created from a quote, auto-mark the quote as
        // "Converted to Job" so the sales pipeline reflects reality and the
        // same quote isn't double-converted.
        quoteEstimates: jobForm.quoteId
          ? current.quoteEstimates.map((q) =>
              q.id === jobForm.quoteId && q.status !== 'Converted to Job'
                ? { ...q, status: 'Converted to Job' as const }
                : q,
            )
          : current.quoteEstimates,
      }));
      focusSavedJob(newJob);
      void syncJobThread(newJob, null, profile).catch((error) => {
        console.error('Failed to sync job thread', error);
      });
    }
    resetJobEditor();
  }

  function handleSaveFinishedStock() {
    if (!stockForm.storedDate || !stockForm.productId || !stockForm.quantityOnHand) {
      setStockMessage('Stored date, product, and quantity on hand are required.');
      return;
    }
    const linkedProduct = productsById.get(stockForm.productId);
    if (!linkedProduct) {
      setStockMessage('Select a valid product before saving.');
      return;
    }
    const linkedClient = stockForm.clientId ? clientsById.get(stockForm.clientId) : undefined;
    const linkedJob = stockForm.jobId ? jobsById.get(stockForm.jobId) : undefined;
    const quantityOnHand = Number(stockForm.quantityOnHand);
    const quantityReserved = Number(stockForm.quantityReserved || 0);
    const { actorId, actorName } = getActor();
    const barcode = stockForm.barcode.trim();
    const payload = {
      storedDate: stockForm.storedDate,
      productId: linkedProduct.id,
      productName: linkedProduct.name,
      clientId: linkedClient?.id ?? '',
      clientName: linkedClient?.name ?? '',
      jobId: linkedJob?.id ?? '',
      jobNumber: linkedJob?.jobNumber ?? '',
      barcode,
      quantityOnHand,
      quantityReserved,
      quantityAvailable: Math.max(quantityOnHand - quantityReserved, 0),
      quantityUnit: stockForm.quantityUnit,
      storageLocation: stockForm.storageLocation,
      stockStatus: stockForm.stockStatus,
      brandingStatus: stockForm.brandingStatus,
      notes: stockForm.notes,
      // Phase 2 food-safety fields. New batches default to "In Production"
      // and pick up the food-contact level from the linked job (if any).
      foodSafetyHoldStatus: (linkedJob && isFoodPackagingLevel(linkedJob.foodContactLevel ?? 'NonFood') ? 'Awaiting QC' : 'In Production') as FoodSafetyHoldStatus,
      releasedByName: '',
      releasedAt: '',
      holdReason: '',
    };
    if (stockEditingId) {
      const previousItem = data.finishedGoodsStock.find((item) => item.id === stockEditingId);
      setData((current) => ({
        ...current,
        // Preserve existing food-safety hold state on edit — only the Hold/Release
        // action mutates those fields; a normal save shouldn't clear them.
        finishedGoodsStock: current.finishedGoodsStock.map((item) => item.id === stockEditingId
          ? {
              ...item,
              ...payload,
              foodSafetyHoldStatus: item.foodSafetyHoldStatus,
              releasedByName: item.releasedByName,
              releasedAt: item.releasedAt,
              holdReason: item.holdReason,
            }
          : item),
        stockChangeLogs: previousItem ? [
          {
            id: `stock-log-${Date.now()}`,
            createdAt: new Date().toISOString(),
            finishedGoodsStockId: previousItem.id,
            stockNumber: previousItem.stockNumber,
            productName: linkedProduct.name,
            action: 'updated',
            changedByUserId: actorId,
            changedByName: actorName,
            previousQuantityOnHand: previousItem.quantityOnHand,
            nextQuantityOnHand: quantityOnHand,
            previousQuantityReserved: previousItem.quantityReserved,
            nextQuantityReserved: quantityReserved,
            notes: previousItem.quantityOnHand !== quantityOnHand || previousItem.quantityReserved !== quantityReserved
              ? `Stock amended from ${previousItem.quantityOnHand}/${previousItem.quantityReserved} to ${quantityOnHand}/${quantityReserved}.`
              : 'Stock details amended with no quantity movement.',
          },
          ...current.stockChangeLogs,
        ] : current.stockChangeLogs,
      }));
    } else {
      const stockNumber = generateCode('FGS', data.finishedGoodsStock.map((item) => item.stockNumber), stockForm.storedDate);
      const newItem: FinishedGoodsStock = {
        id: stockNumber,
        stockNumber,
        createdAt: new Date().toISOString(),
        ...payload,
        barcode: barcode || buildBarcode(stockNumber),
      };
      const movement = createInventoryMovement({
        movementDate: stockForm.storedDate,
        movementType: 'Received',
        itemType: 'Finished Goods',
        barcode: newItem.barcode,
        itemId: newItem.id,
        itemCode: newItem.stockNumber,
        itemName: newItem.productName,
        quantityMoved: quantityOnHand,
        quantityUnit: newItem.quantityUnit,
        toLocation: newItem.storageLocation,
        jobId: newItem.jobId,
        jobNumber: newItem.jobNumber,
        notes: 'Finished stock received into inventory.',
      });
      setData((current) => ({
        ...current,
        finishedGoodsStock: [newItem, ...current.finishedGoodsStock],
        stockChangeLogs: [
          {
            id: `stock-log-${Date.now()}`,
            createdAt: new Date().toISOString(),
            finishedGoodsStockId: newItem.id,
            stockNumber: newItem.stockNumber,
            productName: newItem.productName,
            action: 'created',
            changedByUserId: actorId,
            changedByName: actorName,
            previousQuantityOnHand: 0,
            nextQuantityOnHand: quantityOnHand,
            previousQuantityReserved: 0,
            nextQuantityReserved: quantityReserved,
            notes: 'Finished stock item created.',
          },
          ...current.stockChangeLogs,
        ],
        inventoryMovements: [movement, ...current.inventoryMovements],
      }));
    }
    resetStockEditor();
  }

  function handleDeleteFinishedStock(item: FinishedGoodsStock) {
    const hasReservedJobs = data.jobs.some((job) => job.reservedFinishedGoodsStockId === item.id);
    const hasCustomerReleases = data.customerStockReleases.some((release) => release.finishedGoodsStockId === item.id);

    if (hasReservedJobs || hasCustomerReleases) {
      setStockMessage('This stock item is linked to jobs or customer releases and cannot be deleted. Amend it instead.');
      setStockEditingId(item.id);
      return;
    }

    const confirmed = window.confirm(`Delete finished stock ${item.stockNumber}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const actorName = profile?.fullName || profile?.email || 'Unknown user';
    const actorId = profile?.id || 'unknown-user';

    setData((current) => ({
      ...current,
      finishedGoodsStock: current.finishedGoodsStock.filter((stock) => stock.id !== item.id),
      stockChangeLogs: [
        {
          id: `stock-log-${Date.now()}`,
          createdAt: new Date().toISOString(),
          finishedGoodsStockId: item.id,
          stockNumber: item.stockNumber,
          productName: item.productName,
          action: 'deleted',
          changedByUserId: actorId,
          changedByName: actorName,
          previousQuantityOnHand: item.quantityOnHand,
          nextQuantityOnHand: 0,
          previousQuantityReserved: item.quantityReserved,
          nextQuantityReserved: 0,
          notes: 'Finished stock item deleted.',
        },
        ...current.stockChangeLogs,
      ],
    }));

    if (stockEditingId === item.id) {
      resetStockEditor();
    } else {
      setStockMessage('');
    }
  }

  function handleDeleteCurrentFinishedStock() {
    if (!stockEditingId) {
      return;
    }
    const item = data.finishedGoodsStock.find((entry) => entry.id === stockEditingId);
    if (!item) {
      return;
    }
    handleDeleteFinishedStock(item);
  }

  function handleSaveSparePart() {
    if (!spareForm.partName || !spareForm.quantityOnHand) {
      setSpareMessage('Part name and quantity on hand are required.');
      return;
    }
    const linkedSupplier = spareForm.supplierId ? suppliersById.get(spareForm.supplierId) : undefined;
    const linkedMachine = spareForm.machineId ? machinesById.get(spareForm.machineId) : undefined;
    const barcode = spareForm.barcode.trim();
    const payload = {
      partName: spareForm.partName,
      category: spareForm.category,
      itemType: spareForm.itemType,
      productionUse: spareForm.productionUse,
      machineId: linkedMachine?.id ?? '',
      machineReference: linkedMachine?.name ?? spareForm.machineReference,
      supplierId: linkedSupplier?.id ?? '',
      supplierName: linkedSupplier?.name ?? spareForm.supplierName,
      barcode,
      quantityOnHand: Number(spareForm.quantityOnHand),
      minimumStockLevel: Number(spareForm.minimumStockLevel || 0),
      reorderLevel: Number(spareForm.reorderLevel || 0),
      unitOfMeasure: spareForm.unitOfMeasure,
      unitCost: Number(spareForm.unitCost || 0),
      storageLocation: spareForm.storageLocation,
      lastPurchaseDate: spareForm.lastPurchaseDate,
      notes: spareForm.notes,
    };
    if (spareEditingId) {
      setData((current) => ({
        ...current,
        spareParts: current.spareParts.map((part) => part.id === spareEditingId ? { ...part, ...payload } : part),
      }));
    } else {
      const partCode = generateCode('SPR', data.spareParts.map((part) => part.partCode), spareForm.lastPurchaseDate || getToday());
      const newPart: SparePart = {
        id: partCode,
        partCode,
        createdAt: new Date().toISOString(),
        ...payload,
        barcode: barcode || buildBarcode(partCode),
        itemType: 'Consumable',
        productionUse: true,
        currentStatus: 'In Stock',
        currentHolderUserId: '',
        currentHolderName: '',
      };
      const movement = createInventoryMovement({
        movementDate: spareForm.lastPurchaseDate || getToday(),
        movementType: 'Received',
        itemType: 'Spare Part',
        barcode: newPart.barcode,
        itemId: newPart.id,
        itemCode: newPart.partCode,
        itemName: newPart.partName,
        quantityMoved: newPart.quantityOnHand,
        quantityUnit: newPart.unitOfMeasure,
        toLocation: newPart.storageLocation,
        notes: 'Spare part received into inventory.',
      });
      setData((current) => ({ ...current, spareParts: [newPart, ...current.spareParts], inventoryMovements: [movement, ...current.inventoryMovements] }));
    }
    resetSpareEditor();
  }

  function resetStockIssueForm() {
    setStockIssueForm({
      itemId: '',
      quantity: '',
      issuedToName: '',
      issuedByName: '',
      jobId: '',
      jobNumber: '',
      notes: '',
    });
    setStockIssueMessage('');
  }

  function startStockIssue(itemId: string) {
    setStockIssueMessage('');
    setStockIssueForm({
      itemId,
      quantity: '',
      issuedToName: '',
      issuedByName: '',
      jobId: '',
      jobNumber: '',
      notes: '',
    });
  }

  function handleSaveStockIssue() {
    const item = data.spareParts.find((part) => part.id === stockIssueForm.itemId);
    if (!item) {
      setStockIssueMessage('Pick an item first.');
      return;
    }
    if (!stockIssueForm.issuedToName.trim()) {
      setStockIssueMessage('Who is this being issued to?');
      return;
    }
    const isTool = item.itemType === 'Tool';
    const quantity = isTool ? 1 : Number(stockIssueForm.quantity);
    if (!isTool && (!quantity || quantity <= 0)) {
      setStockIssueMessage('Quantity must be greater than zero.');
      return;
    }
    if (!isTool && quantity > item.quantityOnHand) {
      setStockIssueMessage(`Only ${item.quantityOnHand} ${item.unitOfMeasure} on hand.`);
      return;
    }
    if (item.productionUse && !stockIssueForm.jobId) {
      setStockIssueMessage('This item is for production — pick the job it is being used on.');
      return;
    }
    if (isTool && item.currentStatus === 'Out') {
      setStockIssueMessage(`This tool is already checked out to ${item.currentHolderName || 'someone'}. Mark it returned first.`);
      return;
    }
    const issueId = generateCode('SI', data.stockIssues.map((issue) => issue.id), getToday());
    const issue: StockIssue = {
      id: issueId,
      itemId: item.id,
      itemName: item.partName,
      itemType: item.itemType,
      category: item.category,
      quantity,
      unitOfMeasure: item.unitOfMeasure,
      issuedAt: new Date().toISOString(),
      issuedToUserId: '',
      issuedToName: stockIssueForm.issuedToName.trim(),
      issuedByUserId: '',
      issuedByName: stockIssueForm.issuedByName.trim(),
      jobId: stockIssueForm.jobId,
      jobNumber: stockIssueForm.jobNumber,
      notes: stockIssueForm.notes,
      status: isTool ? 'Issued' : 'Issued',
      returnedAt: '',
      conditionOnReturn: '',
      returnedByUserId: '',
      returnedByName: '',
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({
      ...current,
      stockIssues: [issue, ...current.stockIssues],
      spareParts: current.spareParts.map((part) => {
        if (part.id !== item.id) return part;
        if (isTool) {
          return {
            ...part,
            currentStatus: 'Out',
            currentHolderUserId: '',
            currentHolderName: stockIssueForm.issuedToName.trim(),
          };
        }
        return {
          ...part,
          quantityOnHand: Math.max(0, part.quantityOnHand - quantity),
        };
      }),
    }));
    setStockIssueMessage(isTool ? 'Tool checked out.' : 'Stock issued and on-hand decremented.');
    resetStockIssueForm();
  }

  function resetStockCountForm() {
    setStockCountForm({
      scope: '',
      countedByName: '',
      notes: '',
      selectedItemIds: [],
      countedQty: {},
    });
    setStockCountMessage('');
  }

  function handleSaveStockCount() {
    if (stockCountForm.selectedItemIds.length === 0) {
      setStockCountMessage('Pick at least one item to count.');
      return;
    }
    if (!stockCountForm.countedByName.trim()) {
      setStockCountMessage('Who is doing the count?');
      return;
    }
    const today = getToday();
    const countId = generateCode('SC', data.stockCounts.map((count) => count.id), today);
    const scope = stockCountForm.scope;
    // Resolve each counted item's system quantity + label from the right
    // source for the scope. Paper/Finished use quantityAvailable; spares (the
    // default, incl. the existing free-text spares scope) use quantityOnHand.
    const lines: StockCountLine[] = stockCountForm.selectedItemIds.map((itemId, index) => {
      let systemQty = 0;
      let itemName = 'Unknown item';
      if (scope === 'Paper / Materials') {
        const r = data.materialReceipts.find((m) => m.id === itemId);
        systemQty = r?.quantityAvailable ?? 0;
        itemName = r
          ? `${(r.paperType || r.itemName || 'Material')} ${r.gsm || ''} · ${r.internalRollCode || r.receiptNumber}`.replace(/\s+/g, ' ').trim()
          : 'Unknown material';
      } else if (scope === 'Finished Goods') {
        const f = data.finishedGoodsStock.find((s) => s.id === itemId);
        systemQty = f?.quantityAvailable ?? 0;
        itemName = f ? `${f.productName} · ${f.stockNumber}` : 'Unknown stock';
      } else {
        const item = data.spareParts.find((part) => part.id === itemId);
        systemQty = item?.quantityOnHand ?? 0;
        itemName = item?.partName ?? 'Unknown item';
      }
      const countedQty = Number(stockCountForm.countedQty[itemId] ?? 0);
      return {
        id: `${countId}-L${String(index + 1).padStart(3, '0')}`,
        countId,
        itemId,
        itemName,
        systemQty,
        countedQty,
        variance: countedQty - systemQty,
        notes: '',
        createdAt: new Date().toISOString(),
      };
    });
    const count: StockCount = {
      id: countId,
      countedAt: new Date().toISOString(),
      countedByUserId: '',
      countedByName: stockCountForm.countedByName.trim(),
      scope: stockCountForm.scope,
      notes: stockCountForm.notes,
      reconciled: false,
      reconciledAt: '',
      reconciledByUserId: '',
      reconciledByName: '',
      createdAt: new Date().toISOString(),
      lines,
    };
    setData((current) => ({
      ...current,
      stockCounts: [count, ...current.stockCounts],
    }));
    setStockCountMessage(`Count saved (${countId}). Variance ready for review.`);
    resetStockCountForm();
  }

  function handleReconcileStockCount(countId: string, reconciledByName: string) {
    const target = data.stockCounts.find((count) => count.id === countId);
    if (!target || target.reconciled) return;
    const lineById = new Map(target.lines.map((l) => [l.itemId, l]));
    setData((current) => {
      const stockCounts = current.stockCounts.map((count) => count.id === countId
        ? {
            ...count,
            reconciled: true,
            reconciledAt: new Date().toISOString(),
            reconciledByName: reconciledByName || 'Admin',
          }
        : count);

      // Apply the counted quantities back to the right stock source for the
      // count's scope. Paper/Finished adjust quantityAvailable (and keep any
      // reserved qty intact); spares set quantityOnHand directly.
      if (target.scope === 'Paper / Materials') {
        return {
          ...current,
          stockCounts,
          materialReceipts: current.materialReceipts.map((m) => {
            const line = lineById.get(m.id);
            return line ? { ...m, quantityAvailable: line.countedQty } : m;
          }),
        };
      }
      if (target.scope === 'Finished Goods') {
        return {
          ...current,
          stockCounts,
          finishedGoodsStock: current.finishedGoodsStock.map((s) => {
            const line = lineById.get(s.id);
            if (!line) return s;
            const reserved = s.quantityReserved || 0;
            return { ...s, quantityAvailable: line.countedQty, quantityOnHand: line.countedQty + reserved };
          }),
        };
      }
      return {
        ...current,
        stockCounts,
        spareParts: current.spareParts.map((part) => {
          const line = lineById.get(part.id);
          return line ? { ...part, quantityOnHand: line.countedQty } : part;
        }),
      };
    });
  }

  function handleReturnTool(issueId: string, condition: 'Good' | 'Damaged' | 'Lost') {
    const issue = data.stockIssues.find((entry) => entry.id === issueId);
    if (!issue || issue.status === 'Returned') return;
    setData((current) => ({
      ...current,
      stockIssues: current.stockIssues.map((entry) => entry.id === issueId
        ? {
            ...entry,
            status: 'Returned',
            returnedAt: new Date().toISOString(),
            conditionOnReturn: condition,
          }
        : entry),
      spareParts: current.spareParts.map((part) => part.id === issue.itemId
        ? {
            ...part,
            currentStatus: 'In Stock',
            currentHolderUserId: '',
            currentHolderName: '',
            quantityOnHand: condition === 'Lost' ? Math.max(0, part.quantityOnHand - 1) : part.quantityOnHand,
          }
        : part),
    }));
  }

  function handleSaveTier() {
    if (!tierForm.name || !tierForm.defaultMarginPercent) {
      setTierMessage('Tier name and default margin are required.');
      return;
    }
    const payload = {
      name: tierForm.name,
      type: tierForm.type,
      defaultMarginPercent: Number(tierForm.defaultMarginPercent),
      brandingMarginPercent: Number(tierForm.brandingMarginPercent || 0),
      notes: tierForm.notes,
    };
    if (tierEditingId) {
      setData((current) => ({ ...current, pricingTiers: current.pricingTiers.map((tier) => tier.id === tierEditingId ? { ...tier, ...payload } : tier) }));
    } else {
      setData((current) => ({ ...current, pricingTiers: [{ id: `tier-${Date.now()}`, ...payload }, ...current.pricingTiers] }));
    }
    resetTierEditor();
  }

  function handleSavePaperRate() {
    if (!paperRateForm.name || !paperRateForm.pricePerTon) {
      setPaperRateMessage('Paper rate name and price per ton are required.');
      return;
    }
    const linkedSupplier = paperRateForm.supplierId ? suppliersById.get(paperRateForm.supplierId) : undefined;
    const payload = {
      name: paperRateForm.name,
      supplierId: linkedSupplier?.id ?? '',
      supplierName: linkedSupplier?.name ?? '',
      paperType: paperRateForm.paperType,
      gsm: paperRateForm.gsm,
      pricePerTon: Number(paperRateForm.pricePerTon),
      notes: paperRateForm.notes,
      active: paperRateForm.active,
    };
    if (paperRateEditingId) {
      setData((current) => ({ ...current, paperRates: current.paperRates.map((rate) => rate.id === paperRateEditingId ? { ...rate, ...payload } : rate) }));
    } else {
      setData((current) => ({ ...current, paperRates: [{ id: `paper-${Date.now()}`, ...payload }, ...current.paperRates] }));
    }
    resetPaperRateEditor();
  }

  function handleSaveCostProfile() {
    if (!costProfileForm.name) {
      setCostProfileMessage('Profile name is required.');
      return;
    }
    const payload = {
      name: costProfileForm.name,
      wastagePercent: Number(costProfileForm.wastagePercent || 0),
      defaultMarginPercent: Number(costProfileForm.defaultMarginPercent || 0),
      baseGlueCostPerBag: Number(costProfileForm.baseGlueCostPerBag || 0),
      hotMeltCostPerBag: Number(costProfileForm.hotMeltCostPerBag || 0),
      flatHandleCostPerBag: Number(costProfileForm.flatHandleCostPerBag || 0),
      ropeHandleCostPerBag: Number(costProfileForm.ropeHandleCostPerBag || 0),
      rollHandleCostPerBag: Number(costProfileForm.rollHandleCostPerBag || 0),
      screenPrintSetupCost: Number(costProfileForm.screenPrintSetupCost || 0),
      screenPrintCostPerColor: Number(costProfileForm.screenPrintCostPerColor || 0),
      flexoInkCostPer1000PerColor: Number(costProfileForm.flexoInkCostPer1000PerColor || 0),
      plateCostPerColor: Number(costProfileForm.plateCostPerColor || 0),
      labourCostPer1000: Number(costProfileForm.labourCostPer1000 || 0),
      packagingCostPer1000: Number(costProfileForm.packagingCostPer1000 || 0),
      transportCostPerJob: Number(costProfileForm.transportCostPerJob || 0),
      sideSeamAllowanceMm: Number(costProfileForm.sideSeamAllowanceMm || 0),
      topFoldAllowanceMm: Number(costProfileForm.topFoldAllowanceMm || 0),
      bottomFoldAllowanceMm: Number(costProfileForm.bottomFoldAllowanceMm || 0),
      flexoThresholdQty: Number(costProfileForm.flexoThresholdQty || 0),
      active: costProfileForm.active,
      notes: costProfileForm.notes,
    };
    if (costProfileEditingId) {
      setData((current) => ({ ...current, costProfiles: current.costProfiles.map((profile) => profile.id === costProfileEditingId ? { ...profile, ...payload } : profile) }));
    } else {
      setData((current) => ({ ...current, costProfiles: [{ id: `cost-${Date.now()}`, ...payload }, ...current.costProfiles] }));
    }
    resetCostProfileEditor();
  }

  // ============================================================
  // Phase 15: work-ticket master + ticket handlers.
  //
  // The four masters (ink rates / finishing operations / press rates /
  // plate costs) follow the same shape as paperRates / costProfiles
  // above — small payloads, no DB sync (yet), localStorage round-trip
  // via useProductionData. The full WorkTicket save is a bit chunkier:
  // it pre-computes the breakdown so the saved record matches what the
  // quoter saw on screen.
  // ============================================================

  function resetInkRateEditor() {
    setInkRateForm({ name: '', inkType: 'Pantone', supplierId: '', costPerKg: '', coverageSqmPerKg: '100', defaultCoveragePercent: '50', notes: '', active: true });
    setInkRateEditingId(null);
    setInkRateMessage('');
  }
  function editInkRate(rate: InkRate) {
    setInkRateForm({
      name: rate.name,
      inkType: rate.inkType,
      supplierId: rate.supplierId,
      costPerKg: String(rate.costPerKg),
      coverageSqmPerKg: String(rate.coverageSqmPerKg),
      defaultCoveragePercent: String(rate.defaultCoveragePercent),
      notes: rate.notes,
      active: rate.active,
    });
    setInkRateEditingId(rate.id);
    setInkRateMessage('');
  }
  function handleSaveInkRate() {
    if (!inkRateForm.name) { setInkRateMessage('Ink name is required.'); return; }
    const supplier = inkRateForm.supplierId ? suppliersById.get(inkRateForm.supplierId) : undefined;
    const payload: Omit<InkRate, 'id'> = {
      name: inkRateForm.name,
      inkType: inkRateForm.inkType,
      supplierId: supplier?.id ?? '',
      supplierName: supplier?.name ?? '',
      costPerKg: Number(inkRateForm.costPerKg || 0),
      coverageSqmPerKg: Number(inkRateForm.coverageSqmPerKg || 0),
      defaultCoveragePercent: Number(inkRateForm.defaultCoveragePercent || 0),
      notes: inkRateForm.notes,
      active: inkRateForm.active,
    };
    if (inkRateEditingId) {
      setData((current) => ({ ...current, inkRates: current.inkRates.map((r) => r.id === inkRateEditingId ? { ...r, ...payload } : r) }));
    } else {
      setData((current) => ({ ...current, inkRates: [{ id: `ink-${Date.now()}`, ...payload }, ...current.inkRates] }));
    }
    resetInkRateEditor();
  }
  function handleDeleteInkRate(rate: InkRate) {
    setData((current) => ({ ...current, inkRates: current.inkRates.filter((r) => r.id !== rate.id) }));
  }

  function resetFinishingEditor() {
    setFinishingForm({ name: '', machineName: '', rateType: 'PerThousand', rate: '', setupCost: '', runSpeedPerHour: '', notes: '', active: true });
    setFinishingEditingId(null);
    setFinishingMessage('');
  }
  function editFinishingOp(op: FinishingOperation) {
    setFinishingForm({
      name: op.name,
      machineName: op.machineName,
      rateType: op.rateType,
      rate: String(op.rate),
      setupCost: String(op.setupCost),
      runSpeedPerHour: String(op.runSpeedPerHour),
      notes: op.notes,
      active: op.active,
    });
    setFinishingEditingId(op.id);
    setFinishingMessage('');
  }
  function handleSaveFinishingOp() {
    if (!finishingForm.name) { setFinishingMessage('Operation name is required.'); return; }
    const payload: Omit<FinishingOperation, 'id'> = {
      name: finishingForm.name,
      machineName: finishingForm.machineName,
      rateType: finishingForm.rateType,
      rate: Number(finishingForm.rate || 0),
      setupCost: Number(finishingForm.setupCost || 0),
      runSpeedPerHour: Number(finishingForm.runSpeedPerHour || 0),
      notes: finishingForm.notes,
      active: finishingForm.active,
    };
    if (finishingEditingId) {
      setData((current) => ({ ...current, finishingOperations: current.finishingOperations.map((o) => o.id === finishingEditingId ? { ...o, ...payload } : o) }));
    } else {
      setData((current) => ({ ...current, finishingOperations: [{ id: `fin-${Date.now()}`, ...payload }, ...current.finishingOperations] }));
    }
    resetFinishingEditor();
  }
  function handleDeleteFinishingOp(op: FinishingOperation) {
    setData((current) => ({ ...current, finishingOperations: current.finishingOperations.filter((o) => o.id !== op.id) }));
  }

  function resetPressRateEditor() {
    setPressRateForm({ machineId: '', ratePerHour: '', makeReadySheets: '0', makeReadyMinutes: '0', runSpeedSheetsPerHour: '0', notes: '', active: true });
    setPressRateEditingId(null);
    setPressRateMessage('');
  }
  function editPressRate(rate: PressRate) {
    setPressRateForm({
      machineId: rate.machineId,
      ratePerHour: String(rate.ratePerHour),
      makeReadySheets: String(rate.makeReadySheets),
      makeReadyMinutes: String(rate.makeReadyMinutes),
      runSpeedSheetsPerHour: String(rate.runSpeedSheetsPerHour),
      notes: rate.notes,
      active: rate.active,
    });
    setPressRateEditingId(rate.id);
    setPressRateMessage('');
  }
  function handleSavePressRate() {
    if (!pressRateForm.machineId) { setPressRateMessage('Pick a machine first.'); return; }
    const machine = machinesById.get(pressRateForm.machineId);
    if (!machine) { setPressRateMessage('Selected machine no longer exists.'); return; }
    const payload: Omit<PressRate, 'id'> = {
      machineId: machine.id,
      machineName: machine.name,
      ratePerHour: Number(pressRateForm.ratePerHour || 0),
      makeReadySheets: Number(pressRateForm.makeReadySheets || 0),
      makeReadyMinutes: Number(pressRateForm.makeReadyMinutes || 0),
      runSpeedSheetsPerHour: Number(pressRateForm.runSpeedSheetsPerHour || 0),
      notes: pressRateForm.notes,
      active: pressRateForm.active,
    };
    if (pressRateEditingId) {
      setData((current) => ({ ...current, pressRates: current.pressRates.map((r) => r.id === pressRateEditingId ? { ...r, ...payload } : r) }));
    } else {
      setData((current) => ({ ...current, pressRates: [{ id: `press-${Date.now()}`, ...payload }, ...current.pressRates] }));
    }
    resetPressRateEditor();
  }
  function handleDeletePressRate(rate: PressRate) {
    setData((current) => ({ ...current, pressRates: current.pressRates.filter((r) => r.id !== rate.id) }));
  }

  function resetPlateCostEditor() {
    setPlateCostForm({ name: '', format: '', costPerColor: '', originationCost: '', notes: '', active: true });
    setPlateCostEditingId(null);
    setPlateCostMessage('');
  }
  function editPlateCost(rate: PlateCost) {
    setPlateCostForm({
      name: rate.name,
      format: rate.format,
      costPerColor: String(rate.costPerColor),
      originationCost: String(rate.originationCost),
      notes: rate.notes,
      active: rate.active,
    });
    setPlateCostEditingId(rate.id);
    setPlateCostMessage('');
  }
  function handleSavePlateCost() {
    if (!plateCostForm.name) { setPlateCostMessage('Plate name is required.'); return; }
    const payload: Omit<PlateCost, 'id'> = {
      name: plateCostForm.name,
      format: plateCostForm.format,
      costPerColor: Number(plateCostForm.costPerColor || 0),
      originationCost: Number(plateCostForm.originationCost || 0),
      notes: plateCostForm.notes,
      active: plateCostForm.active,
    };
    if (plateCostEditingId) {
      setData((current) => ({ ...current, plateCosts: current.plateCosts.map((r) => r.id === plateCostEditingId ? { ...r, ...payload } : r) }));
    } else {
      setData((current) => ({ ...current, plateCosts: [{ id: `plate-${Date.now()}`, ...payload }, ...current.plateCosts] }));
    }
    resetPlateCostEditor();
  }
  function handleDeletePlateCost(rate: PlateCost) {
    setData((current) => ({ ...current, plateCosts: current.plateCosts.filter((r) => r.id !== rate.id) }));
  }

  // ----- Work tickets themselves -----
  function resetWorkTicketEditor() {
    setWorkTicketForm(emptyWorkTicketForm(getToday()));
    setWorkTicketEditingId(null);
    setWorkTicketMessage('');
  }
  function editWorkTicket(ticket: WorkTicket) {
    setWorkTicketForm({
      ticketDate: ticket.ticketDate,
      linkedQuoteId: ticket.linkedQuoteId,
      linkedJobId: ticket.linkedJobId,
      clientId: ticket.clientId,
      productId: ticket.productId,
      productDescription: ticket.productDescription,
      sizeSpec: ticket.sizeSpec,
      handleType: ticket.handleType,
      printMethod: ticket.printMethod,
      colors: String(ticket.colors),
      quantity: String(ticket.quantity),
      sheets: String(ticket.sheets),
      sheetSize: ticket.sheetSize,
      paperRateId: ticket.paperRateId,
      plateCostId: ticket.plateCostId,
      pressRateId: ticket.pressLines[0]?.pressRateId ?? '',
      guillotineRateId: ticket.guillotineLines[0]?.pressRateId ?? '',
      inkLines: ticket.inkLines,
      finishingLines: ticket.finishingLines,
      despatchCost: String(ticket.despatchCost),
      despatchNotes: ticket.despatchNotes,
      marginPercentOverride: String(ticket.marginPercent),
      status: ticket.status,
      notes: ticket.notes,
    });
    setWorkTicketEditingId(ticket.id);
    setWorkTicketMessage('');
  }
  async function handleSaveWorkTicket() {
    if (!workTicketForm.clientId) { setWorkTicketMessage('Pick a client.'); return; }
    if (!workTicketForm.quantity || Number(workTicketForm.quantity) <= 0) {
      setWorkTicketMessage('Quantity must be > 0.');
      return;
    }
    // Recompute the breakdown one last time so the saved row matches what
    // the user sees in the form. Avoids drift between display + persistence.
    const { computeWorkTicket, parseSheetAreaSqm } = await import('./utils/workTicketEngine');
    const sheetAreaSqm = parseSheetAreaSqm(workTicketForm.sheetSize);
    const marginOverrideRaw = workTicketForm.marginPercentOverride.trim();
    const marginPercentOverride = marginOverrideRaw === '' ? null : Number(marginOverrideRaw);
    const breakdown = computeWorkTicket(
      {
        quantity: Number(workTicketForm.quantity || 0),
        sheets: Number(workTicketForm.sheets || 0),
        sheetAreaSqm,
        colors: Number(workTicketForm.colors || 0),
        paperRateId: workTicketForm.paperRateId,
        plateCostId: workTicketForm.plateCostId,
        pressRateId: workTicketForm.pressRateId,
        guillotineRateId: workTicketForm.guillotineRateId,
        inkLines: workTicketForm.inkLines,
        finishingLines: workTicketForm.finishingLines,
        marginPercentOverride: Number.isFinite(marginPercentOverride) ? marginPercentOverride : null,
        clientId: workTicketForm.clientId,
        despatchCost: Number(workTicketForm.despatchCost || 0),
      },
      {
        paperRates: data.paperRates,
        costProfiles: data.costProfiles,
        inkRates: data.inkRates,
        finishingOperations: data.finishingOperations,
        pressRates: data.pressRates,
        plateCosts: data.plateCosts,
        pricingTiers: data.pricingTiers,
        clients: data.clients,
        machines: data.machines,
      },
    );
    const client = clientsById.get(workTicketForm.clientId);
    const product = workTicketForm.productId ? productsById.get(workTicketForm.productId) : undefined;
    const plate = workTicketForm.plateCostId ? data.plateCosts.find((p) => p.id === workTicketForm.plateCostId) : undefined;
    const sheets = Number(workTicketForm.sheets || 0) || (Number(workTicketForm.quantity || 0) + (data.pressRates.find((p) => p.id === workTicketForm.pressRateId)?.makeReadySheets ?? 0));

    const payloadCommon = {
      ticketDate: workTicketForm.ticketDate,
      linkedQuoteId: workTicketForm.linkedQuoteId,
      linkedQuoteNumber: data.quoteEstimates.find((q) => q.id === workTicketForm.linkedQuoteId)?.quoteNumber ?? '',
      linkedJobId: workTicketForm.linkedJobId,
      linkedJobNumber: data.jobs.find((j) => j.id === workTicketForm.linkedJobId)?.jobNumber ?? '',
      clientId: workTicketForm.clientId,
      clientName: client?.name ?? '',
      productId: product?.id ?? '',
      productName: product?.name ?? '',
      productDescription: workTicketForm.productDescription,
      sizeSpec: workTicketForm.sizeSpec,
      handleType: workTicketForm.handleType,
      printMethod: workTicketForm.printMethod,
      colors: Number(workTicketForm.colors || 0),
      quantity: Number(workTicketForm.quantity || 0),
      sheets,
      sheetSize: workTicketForm.sheetSize,
      paperRateId: workTicketForm.paperRateId,
      paperRateName: breakdown.paperRateName,
      paperType: breakdown.paperType,
      paperGsm: breakdown.paperGsm,
      paperKg: breakdown.paperKg,
      paperCost: breakdown.paperCost,
      plateCostId: workTicketForm.plateCostId,
      plateCostName: plate?.name ?? '',
      prePressCost: breakdown.prePressCost,
      inkLines: breakdown.inkLines,
      inkSubtotal: breakdown.inkSubtotal,
      pressLines: breakdown.pressLines,
      pressSubtotal: breakdown.pressSubtotal,
      guillotineLines: breakdown.guillotineLines,
      guillotineSubtotal: breakdown.guillotineSubtotal,
      finishingLines: breakdown.finishingLines,
      finishingSubtotal: breakdown.finishingSubtotal,
      despatchCost: breakdown.despatchCost,
      despatchNotes: workTicketForm.despatchNotes,
      totalCost: breakdown.totalCost,
      marginPercent: breakdown.marginPercentApplied,
      sellingPricePerUnit: breakdown.sellingPricePerUnit,
      sellingPriceTotal: breakdown.sellingPriceTotal,
      status: workTicketForm.status,
      notes: workTicketForm.notes,
      pricedFromMasters: true,
    };

    if (workTicketEditingId) {
      setData((current) => ({
        ...current,
        workTickets: current.workTickets.map((t) =>
          t.id === workTicketEditingId ? { ...t, ...payloadCommon } : t,
        ),
      }));
    } else {
      const ticketNumber = generateCode('WT', data.workTickets.map((t) => t.ticketNumber), workTicketForm.ticketDate);
      const newTicket: WorkTicket = {
        id: ticketNumber,
        ticketNumber,
        createdAt: new Date().toISOString(),
        ...payloadCommon,
      };
      setData((current) => ({ ...current, workTickets: [newTicket, ...current.workTickets] }));
    }
    resetWorkTicketEditor();
    setWorkTicketMessage('Saved.');
  }

  function handleSaveClient() {
    if (!clientForm.name) {
      setClientMessage('Client name is required.');
      return;
    }
    const tier = clientForm.pricingTierId ? tiersById.get(clientForm.pricingTierId) : undefined;
    const payload = {
      name: clientForm.name,
      companyName: clientForm.companyName,
      accountManagerName: clientForm.accountManagerName,
      code: clientForm.code,
      pricingTierId: clientForm.pricingTierId,
      pricingTierName: tier?.name ?? '',
      clientType: tier?.type ?? 'Custom',
      brandingDefault: clientForm.brandingDefault,
      defaultMarginPercent: Number(clientForm.defaultMarginPercent || tier?.defaultMarginPercent || 0),
      creditLimit: Number(clientForm.creditLimit || 0),
      currentBalance: Number(clientForm.currentBalance || 0),
      paymentTerms: clientForm.paymentTerms,
      primaryPaymentMethod: clientForm.primaryPaymentMethod,
      currency: clientForm.currency,
      invoiceLanguage: clientForm.invoiceLanguage,
      vatNumber: clientForm.vatNumber,
      openingBalance: Number(clientForm.openingBalance || 0),
      openingBalanceAsOf: clientForm.openingBalanceAsOf,
      accountHold: clientForm.accountHold,
      title: clientForm.title,
      firstName: clientForm.firstName,
      middleName: clientForm.middleName,
      lastName: clientForm.lastName,
      suffix: clientForm.suffix,
      contactName: clientForm.contactName,
      contactEmail: clientForm.contactEmail,
      phoneNumber: clientForm.phoneNumber,
      mobileNumber: clientForm.mobileNumber,
      otherPhone: clientForm.otherPhone,
      faxNumber: clientForm.faxNumber,
      ccEmail: clientForm.ccEmail,
      bccEmail: clientForm.bccEmail,
      website: clientForm.website,
      marketingConsent: clientForm.marketingConsent,
      billingAddressLine1: clientForm.billingAddressLine1,
      billingAddressLine2: clientForm.billingAddressLine2,
      billingCity: clientForm.billingCity,
      billingState: clientForm.billingState,
      billingPostalCode: clientForm.billingPostalCode,
      billingCountry: clientForm.billingCountry,
      deliveryAddressLine1: clientForm.deliveryAddressLine1,
      deliveryAddressLine2: clientForm.deliveryAddressLine2,
      deliveryCity: clientForm.deliveryCity,
      deliveryState: clientForm.deliveryState,
      deliveryPostalCode: clientForm.deliveryPostalCode,
      deliveryCountry: clientForm.deliveryCountry,
      stockHoldingEnabled: clientForm.stockHoldingEnabled,
      stockHoldingAgreementSigned: clientForm.stockHoldingAgreementSigned,
      stockHoldingAgreementSignedDate: clientForm.stockHoldingAgreementSignedDate,
      stockHoldingAgreementReference: clientForm.stockHoldingAgreementReference,
      stockHoldingReviewDate: clientForm.stockHoldingReviewDate,
      creditAgreementSigned: clientForm.creditAgreementSigned,
      creditAgreementSignedDate: clientForm.creditAgreementSignedDate,
      creditAgreementReference: clientForm.creditAgreementReference,
      storageGracePeriodDays: Number(clientForm.storageGracePeriodDays || 0),
      maxStoragePeriodDays: Number(clientForm.maxStoragePeriodDays || 0),
      storageFeeApplies: clientForm.storageFeeApplies,
      storageFeeType: clientForm.storageFeeType,
      storageFeeRate: Number(clientForm.storageFeeRate || 0),
      depositRequiredPercent: Number(clientForm.depositRequiredPercent || 0),
      minimumMonthlyReleaseQuantity: Number(clientForm.minimumMonthlyReleaseQuantity || 0),
      minimumMonthlyReleaseUnit: clientForm.minimumMonthlyReleaseUnit,
      minimumReleaseQuantity: Number(clientForm.minimumReleaseQuantity || 0),
      deliveryChargePolicy: clientForm.deliveryChargePolicy,
      releaseApprovalRequired: clientForm.releaseApprovalRequired,
      portalEnabled: clientForm.portalEnabled,
      portalViewQuotes: clientForm.portalViewQuotes,
      portalViewInvoices: clientForm.portalViewInvoices,
      portalViewStock: clientForm.portalViewStock,
      portalRequestRelease: clientForm.portalRequestRelease,
      notes: clientForm.notes,
      active: clientForm.active,
    };
    if (clientEditingId) {
      setData((current) => ({ ...current, clients: current.clients.map((client) => client.id === clientEditingId ? { ...client, ...payload } : client) }));
    } else {
      setData((current) => ({ ...current, clients: [{ id: `client-${Date.now()}`, ...payload }, ...current.clients] }));
    }
    resetClientEditor();
  }

  function handleSaveProduct() {
    if (!productForm.name) {
      setProductMessage('Product name is required.');
      return;
    }
    const linkedSupplier = productForm.defaultSupplierId ? suppliersById.get(productForm.defaultSupplierId) : undefined;
    const payload = {
      name: productForm.name,
      sku: productForm.sku,
      category: productForm.category,
      supplyType: productForm.supplyType,
      defaultSupplierId: linkedSupplier?.id ?? '',
      defaultSupplierName: linkedSupplier?.name ?? '',
      brandingAllowed: productForm.brandingAllowed,
      defaultUnit: productForm.defaultUnit,
      defaultPaperType: productForm.defaultPaperType,
      defaultGsm: productForm.defaultGsm,
      notes: productForm.notes,
      active: productForm.active,
      pricingEnabled: productForm.pricingEnabled,
      pricingSpec: productForm.pricingEnabled ? formToPricingSpec(productForm) : undefined,
    };
    if (productEditingId) {
      setData((current) => ({ ...current, products: current.products.map((product) => product.id === productEditingId ? { ...product, ...payload } : product) }));
    } else {
      setData((current) => ({ ...current, products: [{ id: `product-${Date.now()}`, ...payload }, ...current.products] }));
    }
    resetProductEditor();
  }

  function handleDeleteProduct(product: Product) {
    const isUsedInQuotes = data.quoteEstimates.some((quote) => quote.productId === product.id);
    const isUsedInJobs = data.jobs.some((job) => job.productId === product.id);
    const isUsedInFinishedStock = data.finishedGoodsStock.some((item) => item.productId === product.id);

    if (isUsedInQuotes || isUsedInJobs || isUsedInFinishedStock) {
      setProductMessage('This product is linked to quotes, jobs, or finished stock and cannot be deleted. Mark it inactive or amend it instead.');
      return;
    }

    const confirmed = window.confirm(`Delete product ${product.name}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== product.id),
    }));

    // Deletes don't fire any DB trigger (the row is already gone), so we
    // explicitly record the audit event here. This keeps the History drawer
    // truthful — every destructive op leaves a trace.
    void recordAuditEvent({
      sourceTable: 'products',
      sourceRecordId: product.id,
      eventCategory: 'product',
      eventType: 'product_deleted',
      action: 'deleted',
      summary: `Product ${product.name} deleted`,
      actorName: profile?.fullName || profile?.email || 'Unknown user',
      details: {
        productSku: product.sku,
        productName: product.name,
        category: product.category,
      },
    });

    if (productEditingId === product.id) {
      resetProductEditor();
    } else {
      setProductMessage('');
    }
  }

  function handleDeleteCurrentProduct() {
    if (!productEditingId) {
      return;
    }
    const product = data.products.find((item) => item.id === productEditingId);
    if (!product) {
      return;
    }
    handleDeleteProduct(product);
  }

  // ── Price List (phase 33) ──────────────────────────────────────────────
  function handleApproveProductPrice(productId: string, note: string) {
    const product = data.products.find((p) => p.id === productId);
    if (!product || !product.pricingSpec) {
      return;
    }
    const refs = { pricingTiers: data.pricingTiers, paperRates: data.paperRates, costProfiles: data.costProfiles };
    const existing = data.productPriceVersions.filter((v) => v.productId === productId);
    const nextNumber = existing.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;
    const now = new Date().toISOString();
    const actor = profile?.fullName || profile?.email || 'Unknown user';
    const draft = buildPriceVersionDraft(product, refs, { versionNumber: nextNumber, createdByName: actor, createdAt: now, note });
    if (!draft) {
      setProductMessage('Could not compute a price — check the product has a paper rate and cost profile selected.');
      return;
    }
    const approved: ProductPriceVersion = { ...draft, status: 'Approved', approvedAt: now, approvedByName: actor };
    setData((current) => ({
      ...current,
      productPriceVersions: [
        approved,
        ...current.productPriceVersions.map((v) =>
          v.productId === productId && v.status === 'Approved' ? { ...v, status: 'Superseded' as const } : v,
        ),
      ],
    }));
  }

  function handleAddClientPrice(draft: ClientPriceDraft) {
    const client = data.clients.find((c) => c.id === draft.clientId);
    const product = data.products.find((p) => p.id === draft.productId);
    if (!client || !product) {
      return;
    }
    const now = new Date().toISOString();
    const actor = profile?.fullName || profile?.email || 'Unknown user';
    const record: ClientProductPrice = {
      id: `cpp-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      productId: product.id,
      productName: product.name,
      mode: draft.mode,
      marginPercent: draft.marginPercent,
      fixedUnitPrice: draft.fixedUnitPrice,
      minQuantity: draft.minQuantity,
      note: draft.note,
      active: true,
      createdAt: now,
      createdByName: actor,
    };
    setData((current) => ({ ...current, clientProductPrices: [record, ...current.clientProductPrices] }));
  }

  function handleDeleteClientPrice(id: string) {
    setData((current) => ({ ...current, clientProductPrices: current.clientProductPrices.filter((o) => o.id !== id) }));
  }

  function handleSaveMaterial() {
    if (!materialForm.receivedDate || !materialForm.supplierName || !materialForm.internalRollCode || !materialForm.quantityReceived) {
      setMaterialMessage('Received date, supplier, internal roll code, and quantity are required.');
      return;
    }
    const linkedSupplier = materialForm.supplierId ? suppliersById.get(materialForm.supplierId) : undefined;
    setMaterialMessage('');
    if (materialEditingId) {
      setData((current) => ({
        ...current,
        materialReceipts: current.materialReceipts.map((receipt) => {
          if (receipt.id !== materialEditingId) {
            return receipt;
          }
          const nextQuantityReceived = Number(materialForm.quantityReceived);
          const quantityDelta = nextQuantityReceived - receipt.quantityReceived;
          return {
            ...receipt,
            receivedDate: materialForm.receivedDate,
            supplierId: linkedSupplier?.id ?? materialForm.supplierId,
            supplierName: linkedSupplier?.name ?? materialForm.supplierName,
            supplierBatchNumber: materialForm.supplierBatchNumber,
            internalRollCode: materialForm.internalRollCode,
            barcode: materialForm.barcode.trim() || materialForm.internalRollCode,
            materialKind: materialForm.materialKind || 'Paper',
            itemName: materialForm.itemName,
            paperType: materialForm.paperType,
            gsm: materialForm.gsm,
            width: materialForm.width,
            quantityReceived: nextQuantityReceived,
            quantityAvailable: Math.max(receipt.quantityAvailable + quantityDelta, 0),
            quantityUnit: materialForm.quantityUnit,
            fscClaimType: materialForm.fscClaimType,
            supplierCertificateCode: materialForm.supplierCertificateCode,
            invoiceReference: materialForm.invoiceReference,
            storageLocation: materialForm.storageLocation,
            inspectionNotes: materialForm.inspectionNotes,
            fscRelated: materialForm.fscRelated,
          };
        }),
      }));
    } else {
      const receiptNumber = generateCode('RCV', data.materialReceipts.map((receipt) => receipt.receiptNumber), materialForm.receivedDate);
      const newReceipt: MaterialReceipt = {
        id: receiptNumber,
        receiptNumber,
        barcode: materialForm.barcode.trim() || buildBarcode(materialForm.internalRollCode || receiptNumber),
        createdAt: new Date().toISOString(),
        receivedDate: materialForm.receivedDate,
        supplierId: linkedSupplier?.id ?? materialForm.supplierId,
        supplierName: linkedSupplier?.name ?? materialForm.supplierName,
        supplierBatchNumber: materialForm.supplierBatchNumber,
        internalRollCode: materialForm.internalRollCode,
        materialKind: materialForm.materialKind || 'Paper',
        itemName: materialForm.itemName,
        paperType: materialForm.paperType,
        gsm: materialForm.gsm,
        width: materialForm.width,
        quantityReceived: Number(materialForm.quantityReceived),
        quantityAvailable: Number(materialForm.quantityReceived),
        quantityUnit: materialForm.quantityUnit,
        fscClaimType: materialForm.fscClaimType,
        supplierCertificateCode: materialForm.supplierCertificateCode,
        invoiceReference: materialForm.invoiceReference,
        storageLocation: materialForm.storageLocation,
        inspectionNotes: materialForm.inspectionNotes,
        fscRelated: materialForm.fscRelated,
      };
      const movement = createInventoryMovement({
        movementDate: materialForm.receivedDate,
        movementType: 'Received',
        itemType: 'Material Lot',
        barcode: newReceipt.barcode,
        itemId: newReceipt.id,
        itemCode: newReceipt.receiptNumber,
        itemName: `${newReceipt.paperType} ${newReceipt.gsm}`.trim() || newReceipt.internalRollCode,
        quantityMoved: newReceipt.quantityReceived,
        quantityUnit: newReceipt.quantityUnit,
        toLocation: newReceipt.storageLocation,
        notes: 'Material receipt added to inventory.',
      });
      setData((current) => ({ ...current, materialReceipts: [newReceipt, ...current.materialReceipts], inventoryMovements: [movement, ...current.inventoryMovements] }));
    }
    resetMaterialEditor();
  }

  function handleInventoryScanAction() {
    const barcode = inventoryScanForm.barcode.trim().toLowerCase();
    const quantityMoved = Number(inventoryScanForm.quantityMoved || 0);

    if (!barcode || !quantityMoved) {
      setInventoryScanMessage('Scan a barcode and enter a quantity.');
      return;
    }

    const match = barcodeIndex.get(barcode);
    if (!match) {
      setInventoryScanMessage('Barcode not found in inventory.');
      return;
    }

    const linkedJob = inventoryScanForm.jobId ? jobsById.get(inventoryScanForm.jobId) : undefined;
    const { itemType, item } = match;
    const { actorName } = getActor();

    if (inventoryScanForm.movementType === 'Issued to Job' && !linkedJob) {
      setInventoryScanMessage('Select a job before issuing stock to production.');
      return;
    }

    setData((current) => {
      let nextFinishedStock = current.finishedGoodsStock;
      let nextSpareParts = current.spareParts;
      let nextMaterialReceipts = current.materialReceipts;

      if (itemType === 'Finished Goods') {
        const currentItem = item as FinishedGoodsStock;
        if (inventoryScanForm.movementType === 'Issued to Job' || inventoryScanForm.movementType === 'Adjusted') {
          if (quantityMoved > currentItem.quantityAvailable) {
            setInventoryScanMessage(`Only ${currentItem.quantityAvailable} ${currentItem.quantityUnit} available on this stock lot.`);
            return current;
          }
          nextFinishedStock = current.finishedGoodsStock.map((entry) => entry.id === currentItem.id ? {
            ...entry,
            quantityOnHand: inventoryScanForm.movementType === 'Adjusted' ? Math.max(entry.quantityOnHand - quantityMoved, 0) : entry.quantityOnHand,
            quantityAvailable: Math.max(entry.quantityAvailable - quantityMoved, 0),
          } : entry);
        } else if (inventoryScanForm.movementType === 'Returned') {
          nextFinishedStock = current.finishedGoodsStock.map((entry) => entry.id === currentItem.id ? {
            ...entry,
            quantityOnHand: entry.quantityOnHand + quantityMoved,
            quantityAvailable: entry.quantityAvailable + quantityMoved,
          } : entry);
        } else if (inventoryScanForm.movementType === 'Transferred') {
          nextFinishedStock = current.finishedGoodsStock.map((entry) => entry.id === currentItem.id ? {
            ...entry,
            storageLocation: inventoryScanForm.toLocation,
          } : entry);
        }
      }

      if (itemType === 'Spare Part') {
        const currentItem = item as SparePart;
        if ((inventoryScanForm.movementType === 'Issued to Job' || inventoryScanForm.movementType === 'Adjusted') && quantityMoved > currentItem.quantityOnHand) {
          setInventoryScanMessage(`Only ${currentItem.quantityOnHand} ${currentItem.unitOfMeasure} available on this spare item.`);
          return current;
        }
        nextSpareParts = current.spareParts.map((entry) => entry.id === currentItem.id ? {
          ...entry,
          quantityOnHand:
            inventoryScanForm.movementType === 'Returned'
              ? entry.quantityOnHand + quantityMoved
              : inventoryScanForm.movementType === 'Transferred'
                ? entry.quantityOnHand
                : Math.max(entry.quantityOnHand - quantityMoved, 0),
          storageLocation: inventoryScanForm.movementType === 'Transferred' ? inventoryScanForm.toLocation : entry.storageLocation,
        } : entry);
      }

      if (itemType === 'Material Lot') {
        const currentItem = item as MaterialReceipt;
        if ((inventoryScanForm.movementType === 'Issued to Job' || inventoryScanForm.movementType === 'Adjusted') && quantityMoved > currentItem.quantityAvailable) {
          setInventoryScanMessage(`Only ${currentItem.quantityAvailable} ${currentItem.quantityUnit} available on this material lot.`);
          return current;
        }
        nextMaterialReceipts = current.materialReceipts.map((entry) => entry.id === currentItem.id ? {
          ...entry,
          quantityAvailable:
            inventoryScanForm.movementType === 'Returned'
              ? Math.min(entry.quantityAvailable + quantityMoved, entry.quantityReceived)
              : inventoryScanForm.movementType === 'Transferred'
                ? entry.quantityAvailable
                : Math.max(entry.quantityAvailable - quantityMoved, 0),
          storageLocation: inventoryScanForm.movementType === 'Transferred' ? inventoryScanForm.toLocation : entry.storageLocation,
        } : entry);
      }

      const movement = createInventoryMovement({
        movementDate: inventoryScanForm.movementDate,
        movementType: inventoryScanForm.movementType,
        itemType,
        barcode: item.barcode,
        itemId: item.id,
        itemCode: itemType === 'Finished Goods' ? (item as FinishedGoodsStock).stockNumber : itemType === 'Spare Part' ? (item as SparePart).partCode : (item as MaterialReceipt).receiptNumber,
        itemName: itemType === 'Finished Goods' ? (item as FinishedGoodsStock).productName : itemType === 'Spare Part' ? (item as SparePart).partName : `${(item as MaterialReceipt).paperType} ${(item as MaterialReceipt).gsm}`.trim(),
        quantityMoved,
        quantityUnit: itemType === 'Finished Goods' ? (item as FinishedGoodsStock).quantityUnit : itemType === 'Spare Part' ? (item as SparePart).unitOfMeasure : (item as MaterialReceipt).quantityUnit,
        fromLocation: 'storageLocation' in item ? item.storageLocation : '',
        toLocation: inventoryScanForm.toLocation,
        jobId: linkedJob?.id ?? '',
        jobNumber: linkedJob?.jobNumber ?? '',
        notes: inventoryScanForm.notes || `${inventoryScanForm.movementType} by ${actorName}`,
      });

      return {
        ...current,
        finishedGoodsStock: nextFinishedStock,
        spareParts: nextSpareParts,
        materialReceipts: nextMaterialReceipts,
        inventoryMovements: [movement, ...current.inventoryMovements],
      };
    });

    setInventoryScanForm(createInitialInventoryScanForm());
    setInventoryScanMessage('Inventory movement recorded.');
  }

  function handleSaveProduction() {
    if (!productionForm.logDate || !productionForm.jobId || !productionForm.logType || !productionForm.operatorName) {
      setProductionMessage('Log date, process type, linked job, and operator are required.');
      return;
    }
    const linkedJob = jobsById.get(productionForm.jobId);
    if (!linkedJob) {
      setProductionMessage('Select a valid job card before saving.');
      return;
    }
    const linkedMaterial = productionForm.sourceMaterialId ? materialsById.get(productionForm.sourceMaterialId) : undefined;
    const linkedMachine = productionForm.machineId ? machinesById.get(productionForm.machineId) : undefined;
    setProductionMessage('');
    const payload = {
      logDate: productionForm.logDate,
      logType: productionForm.logType,
      jobId: linkedJob.id,
      jobNumber: linkedJob.jobNumber,
      customerName: linkedJob.customerName,
      operatorName: productionForm.operatorName,
      machineId: linkedMachine?.id ?? '',
      machine: linkedMachine?.name ?? productionForm.machine,
      sourceMaterialId: productionForm.sourceMaterialId,
      sourceMaterialCode: linkedMaterial?.internalRollCode ?? '',
      setupTimeMinutes: Number(productionForm.setupTimeMinutes || 0),
      notes: productionForm.notes,
      operatorSignature: productionForm.operatorSignature,
      fscRelated: productionForm.fscRelated,
      rollCode: productionForm.rollCode,
      height: productionForm.height,
      gusset: productionForm.gusset,
      handleType: productionForm.handleType,
      goodBags: Number(productionForm.goodBags || 0),
      rejectBags: Number(productionForm.rejectBags || 0),
      heightChange: productionForm.heightChange,
      printingMethod: productionForm.printingMethod,
      bagSize: productionForm.bagSize,
      numberOfColors: Number(productionForm.numberOfColors || 0),
      quantityPrinted: Number(productionForm.quantityPrinted || 0),
      materialSourceCode: productionForm.materialSourceCode,
      rollWidth: productionForm.rollWidth,
      metersKgPrinted: Number(productionForm.metersKgPrinted || 0),
      rejectMetersKg: Number(productionForm.rejectMetersKg || 0),
      parentRollCode: productionForm.parentRollCode,
      parentWidth: productionForm.parentWidth,
      targetChildWidth: productionForm.targetChildWidth,
      numberOfChildRolls: Number(productionForm.numberOfChildRolls || 0),
      childDiameter: productionForm.childDiameter,
      totalWasteKg: Number(productionForm.totalWasteKg || 0),
      bladeChange: productionForm.bladeChange,
    };
    if (productionEditingId) {
      setData((current) => ({
        ...current,
        productionLogs: current.productionLogs.map((log) => log.id === productionEditingId ? { ...log, ...payload } : log),
      }));
    } else {
      const logNumber = generateCode('PRD', data.productionLogs.map((log) => log.logNumber), productionForm.logDate);
      const newLog: ProductionLogEntry = { id: logNumber, logNumber, createdAt: new Date().toISOString(), ...payload };
      setData((current) => ({ ...current, productionLogs: [newLog, ...current.productionLogs] }));
    }
    resetProductionEditor();
  }

  function handleSaveWaste() {
    if (!wasteForm.wasteDate || !wasteForm.jobId || !wasteForm.wasteQuantity || !wasteForm.wasteReason) {
      setWasteMessage('Date, linked job, waste quantity, and waste reason are required.');
      return;
    }
    const linkedJob = jobsById.get(wasteForm.jobId);
    if (!linkedJob) {
      setWasteMessage('Select a valid job card before saving.');
      return;
    }
    const linkedLog = wasteForm.productionLogId ? productionLogsById.get(wasteForm.productionLogId) : undefined;
    setWasteMessage('');
    const payload = {
      wasteDate: wasteForm.wasteDate,
      jobId: linkedJob.id,
      jobNumber: linkedJob.jobNumber,
      customerName: linkedJob.customerName,
      productName: linkedJob.productName,
      productionLogId: wasteForm.productionLogId,
      productionLogNumber: linkedLog?.logNumber ?? '',
      wasteQuantity: Number(wasteForm.wasteQuantity),
      wasteUnit: wasteForm.wasteUnit,
      wasteReason: wasteForm.wasteReason,
      notes: wasteForm.notes,
      enteredBy: wasteForm.enteredBy,
      fscRelated: wasteForm.fscRelated,
    };
    if (wasteEditingId) {
      setData((current) => ({ ...current, wasteEntries: current.wasteEntries.map((entry) => entry.id === wasteEditingId ? { ...entry, ...payload } : entry) }));
    } else {
      const wasteNumber = generateCode('WST', data.wasteEntries.map((entry) => entry.wasteNumber), wasteForm.wasteDate);
      const newEntry: WasteEntry = { id: wasteNumber, wasteNumber, createdAt: new Date().toISOString(), ...payload };
      setData((current) => ({ ...current, wasteEntries: [newEntry, ...current.wasteEntries] }));
    }
    resetWasteEditor();
  }

  function handleSavePaper() {
    if (!paperForm.logDate || !paperForm.jobId || !paperForm.paperType || !paperForm.quantityUsed) {
      setPaperMessage('Date, linked job, paper type, and quantity used are required.');
      return;
    }
    const linkedJob = jobsById.get(paperForm.jobId);
    if (!linkedJob) {
      setPaperMessage('Select a valid job card before saving.');
      return;
    }
    const linkedReceipt = paperForm.materialReceiptId ? materialsById.get(paperForm.materialReceiptId) : undefined;
    setPaperMessage('');
    const payload = {
      logDate: paperForm.logDate,
      jobId: linkedJob.id,
      jobNumber: linkedJob.jobNumber,
      customerName: linkedJob.customerName,
      materialReceiptId: paperForm.materialReceiptId,
      materialReceiptNumber: linkedReceipt?.receiptNumber ?? '',
      paperType: paperForm.paperType,
      gsm: paperForm.gsm,
      width: paperForm.width,
      quantityUsed: Number(paperForm.quantityUsed),
      quantityUnit: paperForm.quantityUnit,
      paperCode: paperForm.paperCode,
      notes: paperForm.notes,
      fscRelated: paperForm.fscRelated,
    };
    if (paperEditingId) {
      setData((current) => ({ ...current, paperLogs: current.paperLogs.map((log) => log.id === paperEditingId ? { ...log, ...payload } : log) }));
    } else {
      const paperLogNumber = generateCode('PPR', data.paperLogs.map((log) => log.paperLogNumber), paperForm.logDate);
      const newLog: PaperLog = { id: paperLogNumber, paperLogNumber, createdAt: new Date().toISOString(), ...payload };
      setData((current) => ({ ...current, paperLogs: [newLog, ...current.paperLogs] }));
    }
    resetPaperEditor();
  }

  function handleSaveDispatch() {
    if (!dispatchForm.dispatchDate || !dispatchForm.jobId || !dispatchForm.quantityDispatched) {
      setDispatchMessage('Dispatch date, linked job, and quantity dispatched are required.');
      return;
    }
    const linkedJob = jobsById.get(dispatchForm.jobId);
    if (!linkedJob) {
      setDispatchMessage('Select a valid job card before saving.');
      return;
    }
    const dispatchQuantity = Number(dispatchForm.quantityDispatched);
    const previousRecord = dispatchEditingId ? data.dispatchRecords.find((record) => record.id === dispatchEditingId) : undefined;
    const linkedStock = dispatchForm.finishedGoodsStockId ? finishedStockById.get(dispatchForm.finishedGoodsStockId) : undefined;
    if (dispatchForm.finishedGoodsStockId && !linkedStock) {
      setDispatchMessage('Select a valid finished stock batch before saving.');
      return;
    }
    if (linkedStock) {
      const restoredAvailable =
        previousRecord && previousRecord.finishedGoodsStockId === linkedStock.id
          ? linkedStock.quantityAvailable + previousRecord.quantityDispatched
          : linkedStock.quantityAvailable;
      if (dispatchQuantity > restoredAvailable) {
        setDispatchMessage(`Dispatch quantity exceeds available stock. Available: ${restoredAvailable} ${linkedStock.quantityUnit}.`);
        return;
      }
    }
    setDispatchMessage('');
    const payload = {
      dispatchDate: dispatchForm.dispatchDate,
      jobId: linkedJob.id,
      jobNumber: linkedJob.jobNumber,
      customerName: linkedJob.customerName,
      finishedGoodsStockId: linkedStock?.id ?? '',
      finishedGoodsStockNumber: linkedStock?.stockNumber ?? '',
      quantityDispatched: dispatchQuantity,
      quantityUnit: dispatchForm.quantityUnit,
      labelReference: dispatchForm.labelReference,
      deliveryReference: dispatchForm.deliveryReference,
      issueNotes: dispatchForm.issueNotes,
      fscRelated: dispatchForm.fscRelated,
    };
    setData((current) => {
      let nextFinishedStock = current.finishedGoodsStock.map((item) => ({ ...item }));

      if (previousRecord?.finishedGoodsStockId) {
        nextFinishedStock = nextFinishedStock.map((item) => item.id === previousRecord.finishedGoodsStockId ? {
          ...item,
          quantityOnHand: item.quantityOnHand + previousRecord.quantityDispatched,
          quantityAvailable: item.quantityAvailable + previousRecord.quantityDispatched,
        } : item);
      }

      if (payload.finishedGoodsStockId) {
        nextFinishedStock = nextFinishedStock.map((item) => item.id === payload.finishedGoodsStockId ? {
          ...item,
          quantityOnHand: Math.max(item.quantityOnHand - payload.quantityDispatched, 0),
          quantityAvailable: Math.max(item.quantityAvailable - payload.quantityDispatched, 0),
          stockStatus: item.quantityOnHand - payload.quantityDispatched <= 0 ? 'Dispatched' : item.stockStatus,
        } : item);
      }

      // Build the next dispatch list first so we can total up everything
      // dispatched for this job (existing + this save) and auto-advance the
      // job's status.
      let nextDispatch: DispatchRecord[];
      if (dispatchEditingId) {
        nextDispatch = current.dispatchRecords.map((record) =>
          record.id === dispatchEditingId ? { ...record, ...payload } : record,
        );
      } else {
        const dispatchNumber = generateCode('DSP', current.dispatchRecords.map((record) => record.dispatchNumber), dispatchForm.dispatchDate);
        const newRecord: DispatchRecord = { id: dispatchNumber, dispatchNumber, createdAt: new Date().toISOString(), ...payload };
        nextDispatch = [newRecord, ...current.dispatchRecords];
      }

      // Auto-status: total dispatched for this job vs planned quantity.
      //   fully dispatched (or no planned qty set) → Completed
      //   partial                                  → Partially Dispatched
      // Never downgrade a job a human already marked Completed.
      const dispatchedForJob = nextDispatch
        .filter((r) => r.jobId === linkedJob.id)
        .reduce((sum, r) => sum + (r.quantityDispatched || 0), 0);
      const planned = linkedJob.quantityPlanned || 0;
      const autoStatus: JobCard['status'] =
        planned > 0 && dispatchedForJob < planned ? 'Partially Dispatched' : 'Completed';
      const nextJobs = current.jobs.map((j) => {
        if (j.id !== linkedJob.id) return j;
        if (j.status === 'Completed' && autoStatus !== 'Completed') return j; // don't revert
        return { ...j, status: autoStatus };
      });

      return {
        ...current,
        finishedGoodsStock: nextFinishedStock,
        dispatchRecords: nextDispatch,
        jobs: nextJobs,
      };
    });
    resetDispatchEditor();
  }

  function editJob(job: JobCard) {
    setJobEditingId(job.id);
    setSelectedJobId(job.id);
    setJobForm({
      jobDate: job.jobDate,
      dueDate: job.dueDate,
      leadId: job.leadId,
      leadNumber: job.leadNumber,
      quoteId: job.quoteId,
      quoteNumber: job.quoteNumber,
      quickbooksEstimateNumber: job.quickbooksEstimateNumber,
      invoiceNumber: job.invoiceNumber,
      orderValue: String(job.orderValue),
      paymentRequirement: job.paymentRequirement,
      paymentStatus: job.paymentStatus,
      creditCheckStatus: job.creditCheckStatus,
      availableCreditAtApproval: String(job.availableCreditAtApproval),
      commercialReleaseStatus: job.commercialReleaseStatus,
      clientId: job.clientId,
      pricingTierId: job.pricingTierId,
      productId: job.productId,
      productCategory: job.productCategory,
      customerName: job.customerName,
      customerReference: job.customerReference,
      productName: job.productName,
      description: job.description,
      sizeSpec: job.sizeSpec,
      paperType: job.paperType,
      gsm: job.gsm,
      paperQuantityRequired: String(job.paperQuantityRequired),
      paperQuantityUnit: job.paperQuantityUnit,
      paperAllocationStatus: job.paperAllocationStatus,
      printRequired: job.printRequired,
      printMethod: job.printMethod,
      colorCount: String(job.colorCount),
      supplyFormat: job.supplyFormat,
      packingNotes: job.packingNotes,
      printNotes: job.printNotes,
      quantityPlanned: String(job.quantityPlanned),
      quantityCompleted: String(job.quantityCompleted),
      status: job.status,
      artworkReceived: job.artworkReceived,
      proofSent: job.proofSent,
      approvalStatus: job.approvalStatus,
      approvalDate: job.approvalDate,
      artworkPreparationStatus: job.artworkPreparationStatus,
      addElementsRequired: job.addElementsRequired,
      colorChangesRequired: job.colorChangesRequired,
      artworkChangeSummary: job.artworkChangeSummary,
      artworkAssignedDate: job.artworkAssignedDate,
      artworkAssignedTo: job.artworkAssignedTo,
      proofSharedDate: job.proofSharedDate,
      proofSharedBy: job.proofSharedBy,
      finalApprovalReceivedDate: job.finalApprovalReceivedDate,
      finalApprovalClearedBy: job.finalApprovalClearedBy,
      factoryReleaseDate: job.factoryReleaseDate,
      factoryReleasedBy: job.factoryReleasedBy,
      productionStartDate: job.productionStartDate,
      productionStartedBy: job.productionStartedBy,
      readyForDispatchDate: job.readyForDispatchDate,
      readyForDispatchBy: job.readyForDispatchBy,
      collectionOrDeliveryStatus: job.collectionOrDeliveryStatus,
      changesRequested: job.changesRequested,
      artworkNotes: job.artworkNotes,
      reserveFromStock: job.reserveFromStock,
      reservedFinishedGoodsStockId: job.reservedFinishedGoodsStockId,
      reservedQuantity: String(job.reservedQuantity),
      stockReservationStatus: job.stockReservationStatus,
      dispatchStatus: job.dispatchStatus,
      qualityNotes: job.qualityNotes,
      capturedBy: job.capturedBy,
      releasedBy: job.releasedBy,
      notes: job.notes,
      fscRelated: job.fscRelated,
      foodContactLevel: job.foodContactLevel ?? 'NonFood',
      foodSafeMaterialIds: job.foodSafeMaterialIds ?? [],
      internalBatchNumber: job.internalBatchNumber ?? '',
      foodSafetyNotes: job.foodSafetyNotes ?? '',
      assignedMachineId: job.assignedMachineId ?? '',
      changeoverChecklist: job.changeoverChecklist?.length === 9 ? job.changeoverChecklist : buildBlankChangeoverChecklist(),
      qcPlan: job.qcPlan?.length === 4 ? job.qcPlan : buildBlankQcPlan(),
    });
    setView('jobs');
  }

  function editFinishedStock(item: FinishedGoodsStock) {
    setStockEditingId(item.id);
    setStockForm({
      storedDate: item.storedDate,
      productId: item.productId,
      clientId: item.clientId,
      jobId: item.jobId,
      barcode: item.barcode,
      quantityOnHand: String(item.quantityOnHand),
      quantityReserved: String(item.quantityReserved),
      quantityUnit: item.quantityUnit,
      storageLocation: item.storageLocation,
      stockStatus: item.stockStatus,
      brandingStatus: item.brandingStatus,
      notes: item.notes,
    });
    setView('finishedStock');
  }

  function editSparePart(part: SparePart) {
    setSpareEditingId(part.id);
    setSpareForm({
      partName: part.partName,
      category: (part.category as StockItemCategory) || 'Consumable',
      itemType: part.itemType,
      productionUse: part.productionUse,
      machineId: part.machineId,
      machineReference: part.machineReference,
      supplierId: part.supplierId,
      supplierName: part.supplierName,
      barcode: part.barcode,
      quantityOnHand: String(part.quantityOnHand),
      minimumStockLevel: String(part.minimumStockLevel),
      reorderLevel: String(part.reorderLevel),
      unitOfMeasure: part.unitOfMeasure,
      unitCost: String(part.unitCost),
      storageLocation: part.storageLocation,
      lastPurchaseDate: part.lastPurchaseDate,
      notes: part.notes,
    });
    setView('spares');
  }

  /**
   * Mark a job as Completed in one click. Used from the Job Cards list and
   * the Job Detail panel — gives ops a fast way to close out overdue or
   * finished jobs without opening the full edit form.
   */
  function handleMarkJobComplete(job: JobCard) {
    setData((current) => ({
      ...current,
      jobs: current.jobs.map((j) => j.id === job.id
        ? { ...j, status: 'Completed' as const }
        : j),
    }));
  }

  function duplicateJob(job: JobCard) {
    setJobEditingId(null);
    setJobForm({
      jobDate: getToday(),
      dueDate: job.dueDate,
      leadId: job.leadId,
      leadNumber: job.leadNumber,
      quoteId: job.quoteId,
      quoteNumber: job.quoteNumber,
      quickbooksEstimateNumber: job.quickbooksEstimateNumber,
      invoiceNumber: job.invoiceNumber,
      orderValue: String(job.orderValue),
      paymentRequirement: job.paymentRequirement,
      paymentStatus: job.paymentStatus,
      creditCheckStatus: job.creditCheckStatus,
      availableCreditAtApproval: String(job.availableCreditAtApproval),
      commercialReleaseStatus: job.commercialReleaseStatus,
      clientId: job.clientId,
      pricingTierId: job.pricingTierId,
      productId: job.productId,
      productCategory: job.productCategory,
      customerName: job.customerName,
      customerReference: job.customerReference,
      productName: job.productName,
      description: job.description,
      sizeSpec: job.sizeSpec,
      paperType: job.paperType,
      gsm: job.gsm,
      paperQuantityRequired: String(job.paperQuantityRequired),
      paperQuantityUnit: job.paperQuantityUnit,
      paperAllocationStatus: job.paperAllocationStatus,
      printRequired: job.printRequired,
      printMethod: job.printMethod,
      colorCount: String(job.colorCount),
      supplyFormat: job.supplyFormat,
      packingNotes: job.packingNotes,
      printNotes: job.printNotes,
      quantityPlanned: String(job.quantityPlanned),
      quantityCompleted: '0',
      status: 'Draft',
      artworkReceived: job.artworkReceived,
      proofSent: job.proofSent,
      approvalStatus: job.approvalStatus,
      approvalDate: job.approvalDate,
      artworkPreparationStatus: job.artworkPreparationStatus,
      addElementsRequired: job.addElementsRequired,
      colorChangesRequired: job.colorChangesRequired,
      artworkChangeSummary: job.artworkChangeSummary,
      artworkAssignedDate: job.artworkAssignedDate,
      artworkAssignedTo: job.artworkAssignedTo,
      proofSharedDate: job.proofSharedDate,
      proofSharedBy: job.proofSharedBy,
      finalApprovalReceivedDate: job.finalApprovalReceivedDate,
      finalApprovalClearedBy: job.finalApprovalClearedBy,
      factoryReleaseDate: job.factoryReleaseDate,
      factoryReleasedBy: job.factoryReleasedBy,
      productionStartDate: job.productionStartDate,
      productionStartedBy: job.productionStartedBy,
      readyForDispatchDate: job.readyForDispatchDate,
      readyForDispatchBy: job.readyForDispatchBy,
      collectionOrDeliveryStatus: job.collectionOrDeliveryStatus,
      changesRequested: job.changesRequested,
      artworkNotes: job.artworkNotes,
      reserveFromStock: false,
      reservedFinishedGoodsStockId: '',
      reservedQuantity: '',
      stockReservationStatus: 'Not Checked',
      dispatchStatus: '',
      qualityNotes: job.qualityNotes,
      capturedBy: job.capturedBy,
      releasedBy: job.releasedBy,
      notes: job.notes,
      fscRelated: job.fscRelated,
      foodContactLevel: job.foodContactLevel ?? 'NonFood',
      foodSafeMaterialIds: job.foodSafeMaterialIds ?? [],
      internalBatchNumber: '',
      foodSafetyNotes: job.foodSafetyNotes ?? '',
      assignedMachineId: job.assignedMachineId ?? '',
      // Fresh checklist + fresh QC plan — these are per-run, not per-product.
      changeoverChecklist: buildBlankChangeoverChecklist(),
      qcPlan: buildBlankQcPlan(),
    });
    setJobMessage('Duplicate loaded. Saving will create a new job number.');
    setView('jobs');
  }

  function quickAddProduction(job: JobCard) {
    setProductionForm((current) => ({
      ...createInitialProductionForm(),
      jobId: job.id,
      bagSize: job.sizeSpec,
      fscRelated: job.fscRelated,
    }));
    setProductionEditingId(null);
    setProductionMessage('');
    setView('production');
  }

  function quickAddWaste(job: JobCard) {
    setWasteForm({ ...createInitialWasteForm(), jobId: job.id, fscRelated: job.fscRelated });
    setWasteEditingId(null);
    setWasteMessage('');
    setView('waste');
  }

  function quickAddPaper(job: JobCard) {
    setPaperForm({
      ...createInitialPaperForm(),
      jobId: job.id,
      paperType: job.paperType,
      gsm: job.gsm,
      fscRelated: job.fscRelated,
    });
    setPaperEditingId(null);
    setPaperMessage('');
    setView('paper');
  }

  function quickAddDispatch(job: JobCard) {
    setDispatchForm({
      ...createInitialDispatchForm(),
      jobId: job.id,
      fscRelated: job.fscRelated,
    });
    setDispatchEditingId(null);
    setDispatchMessage('');
    setView('dispatch');
  }

  function editMaterial(receipt: MaterialReceipt) {
    setMaterialEditingId(receipt.id);
    setMaterialForm({
      receivedDate: receipt.receivedDate,
      supplierId: receipt.supplierId,
      supplierName: receipt.supplierName,
      supplierBatchNumber: receipt.supplierBatchNumber,
      internalRollCode: receipt.internalRollCode,
      barcode: receipt.barcode,
      materialKind: receipt.materialKind || 'Paper',
      itemName: receipt.itemName || '',
      paperType: receipt.paperType,
      gsm: receipt.gsm,
      width: receipt.width,
      quantityReceived: String(receipt.quantityReceived),
      quantityUnit: receipt.quantityUnit,
      fscClaimType: receipt.fscClaimType,
      supplierCertificateCode: receipt.supplierCertificateCode,
      invoiceReference: receipt.invoiceReference,
      storageLocation: receipt.storageLocation,
      inspectionNotes: receipt.inspectionNotes,
      fscRelated: receipt.fscRelated,
    });
    setView('materials');
  }

  function editChemical(entry: ChemicalRegisterEntry) {
    setChemicalEditingId(entry.id);
    setChemicalForm({
      chemicalName: entry.chemicalName,
      tradeName: entry.tradeName,
      supplierId: entry.supplierId,
      casNumber: entry.casNumber,
      unNumber: entry.unNumber,
      state: entry.state,
      ghsPictograms: [...entry.ghsPictograms],
      hazardStatements: entry.hazardStatements,
      precautionaryStatements: entry.precautionaryStatements,
      storageLocation: entry.storageLocation,
      maxOnSiteQuantity: String(entry.maxOnSiteQuantity ?? ''),
      currentOnSiteQuantity: String(entry.currentOnSiteQuantity ?? ''),
      quantityUnit: entry.quantityUnit,
      msdsDocumentUrl: entry.msdsDocumentUrl,
      msdsLastReviewedDate: entry.msdsLastReviewedDate,
      msdsReviewIntervalMonths: String(entry.msdsReviewIntervalMonths || 12),
      emergencyProcedure: entry.emergencyProcedure,
      requiredPPE: entry.requiredPPE,
      fireSuppressionType: entry.fireSuppressionType,
      notes: entry.notes,
      archived: entry.archived,
    });
    setView('chemicalRegister');
  }

  function handleSaveChemical() {
    if (!chemicalForm.chemicalName.trim()) {
      setChemicalMessage('Chemical name is required.');
      return;
    }
    if (!chemicalForm.supplierId) {
      setChemicalMessage('Supplier is required.');
      return;
    }
    const supplier = data.suppliers.find((s) => s.id === chemicalForm.supplierId);
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.chemicalRegisterEntries.map((e) => e.registerNumber);
      const payload: Omit<ChemicalRegisterEntry, 'id' | 'registerNumber' | 'createdAt'> = {
        chemicalName: chemicalForm.chemicalName.trim(),
        tradeName: chemicalForm.tradeName.trim(),
        supplierId: chemicalForm.supplierId,
        supplierName: supplier?.name || '',
        casNumber: chemicalForm.casNumber.trim(),
        unNumber: chemicalForm.unNumber.trim(),
        state: chemicalForm.state,
        ghsPictograms: chemicalForm.ghsPictograms,
        hazardStatements: chemicalForm.hazardStatements,
        precautionaryStatements: chemicalForm.precautionaryStatements,
        storageLocation: chemicalForm.storageLocation.trim(),
        maxOnSiteQuantity: Number(chemicalForm.maxOnSiteQuantity || 0),
        currentOnSiteQuantity: Number(chemicalForm.currentOnSiteQuantity || 0),
        quantityUnit: chemicalForm.quantityUnit,
        msdsDocumentUrl: chemicalForm.msdsDocumentUrl.trim(),
        msdsLastReviewedDate: chemicalForm.msdsLastReviewedDate,
        msdsReviewIntervalMonths: Number(chemicalForm.msdsReviewIntervalMonths || 12),
        emergencyProcedure: chemicalForm.emergencyProcedure,
        requiredPPE: chemicalForm.requiredPPE,
        fireSuppressionType: chemicalForm.fireSuppressionType,
        notes: chemicalForm.notes,
        archived: chemicalForm.archived,
      };
      if (chemicalEditingId) {
        return {
          ...current,
          chemicalRegisterEntries: current.chemicalRegisterEntries.map((e) =>
            e.id === chemicalEditingId ? { ...e, ...payload } : e,
          ),
        };
      }
      const newId = `chem-${Date.now().toString(36)}`;
      const registerNumber = generateCode('CHEM', existingNumbers, today);
      const newEntry: ChemicalRegisterEntry = {
        id: newId,
        registerNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, chemicalRegisterEntries: [newEntry, ...current.chemicalRegisterEntries] };
    });
    setChemicalMessage(chemicalEditingId ? 'Chemical updated.' : 'Chemical added to register.');
    resetChemicalEditor();
  }

  function handleArchiveChemicalToggle(entry: ChemicalRegisterEntry) {
    setData((current) => ({
      ...current,
      chemicalRegisterEntries: current.chemicalRegisterEntries.map((e) =>
        e.id === entry.id ? { ...e, archived: !e.archived } : e,
      ),
    }));
  }

  function editFoodSafeMaterial(m: FoodSafeMaterial) {
    setFoodSafeMaterialEditingId(m.id);
    setFoodSafeMaterialForm({
      materialName: m.materialName,
      category: m.category,
      supplierId: m.supplierId,
      supplierSku: m.supplierSku,
      directContactApproved: m.directContactApproved,
      indirectContactApproved: m.indirectContactApproved,
      externalPrintOnly: m.externalPrintOnly,
      foodSafeDeclarationUrl: m.foodSafeDeclarationUrl,
      msdsUrl: m.msdsUrl,
      certificateOfAnalysisUrl: m.certificateOfAnalysisUrl,
      supplierBatchNumber: m.supplierBatchNumber,
      internalBatchNumber: m.internalBatchNumber,
      storageLocation: m.storageLocation,
      status: m.status,
      approvalDate: m.approvalDate,
      reviewDate: m.reviewDate,
      expiryDate: m.expiryDate,
      notes: m.notes,
    });
    setView('foodSafeMaterials');
  }

  function handleSaveFoodSafeMaterial() {
    if (!foodSafeMaterialForm.materialName.trim()) {
      setFoodSafeMaterialMessage('Material name is required.');
      return;
    }
    if (!foodSafeMaterialForm.supplierId) {
      setFoodSafeMaterialMessage('Supplier is required.');
      return;
    }
    const supplier = data.suppliers.find((s) => s.id === foodSafeMaterialForm.supplierId);
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.foodSafeMaterials.map((m) => m.materialNumber);
      const internalBatch = foodSafeMaterialForm.internalBatchNumber.trim()
        || generateCode('FSB', current.foodSafeMaterials.map((m) => m.internalBatchNumber).filter(Boolean), today);
      const payload: Omit<FoodSafeMaterial, 'id' | 'materialNumber' | 'createdAt'> = {
        materialName: foodSafeMaterialForm.materialName.trim(),
        category: foodSafeMaterialForm.category,
        supplierId: foodSafeMaterialForm.supplierId,
        supplierName: supplier?.name || '',
        supplierSku: foodSafeMaterialForm.supplierSku.trim(),
        directContactApproved: foodSafeMaterialForm.directContactApproved,
        indirectContactApproved: foodSafeMaterialForm.indirectContactApproved,
        externalPrintOnly: foodSafeMaterialForm.externalPrintOnly,
        foodSafeDeclarationUrl: foodSafeMaterialForm.foodSafeDeclarationUrl.trim(),
        msdsUrl: foodSafeMaterialForm.msdsUrl.trim(),
        certificateOfAnalysisUrl: foodSafeMaterialForm.certificateOfAnalysisUrl.trim(),
        supplierBatchNumber: foodSafeMaterialForm.supplierBatchNumber.trim(),
        internalBatchNumber: internalBatch,
        storageLocation: foodSafeMaterialForm.storageLocation.trim(),
        status: foodSafeMaterialForm.status,
        approvalDate: foodSafeMaterialForm.approvalDate,
        reviewDate: foodSafeMaterialForm.reviewDate,
        expiryDate: foodSafeMaterialForm.expiryDate,
        notes: foodSafeMaterialForm.notes,
      };
      if (foodSafeMaterialEditingId) {
        return {
          ...current,
          foodSafeMaterials: current.foodSafeMaterials.map((m) =>
            m.id === foodSafeMaterialEditingId ? { ...m, ...payload } : m,
          ),
        };
      }
      const newId = `fsm-${Date.now().toString(36)}`;
      const materialNumber = generateCode('FSM', existingNumbers, today);
      const newMaterial: FoodSafeMaterial = {
        id: newId,
        materialNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, foodSafeMaterials: [newMaterial, ...current.foodSafeMaterials] };
    });
    setFoodSafeMaterialMessage(foodSafeMaterialEditingId ? 'Material updated.' : 'Material added to the approved register.');
    resetFoodSafeMaterialEditor();
  }

  function handleFoodSafeMaterialStatusChange(m: FoodSafeMaterial, status: FoodSafetyApprovalStatus) {
    setData((current) => ({
      ...current,
      foodSafeMaterials: current.foodSafeMaterials.map((existing) =>
        existing.id === m.id ? { ...existing, status } : existing,
      ),
    }));
  }

  function editCleaningLog(log: CleaningLogEntry) {
    setCleaningLogEditingId(log.id);
    setCleaningLogForm({
      area: log.area,
      areaDetail: log.areaDetail,
      machineId: log.machineId,
      cleaningType: log.cleaningType,
      performedAt: log.performedAt,
      performedByName: log.performedByName,
      chemicalRegisterId: log.chemicalRegisterId,
      chemicalName: log.chemicalName,
      result: log.result,
      supervisorSignOffName: log.supervisorSignOffName,
      supervisorSignOffAt: log.supervisorSignOffAt,
      correctiveAction: log.correctiveAction,
      beforePhotoUrl: log.beforePhotoUrl,
      afterPhotoUrl: log.afterPhotoUrl,
      notes: log.notes,
    });
    setView('cleaningLogs');
  }

  function handleSaveCleaningLog() {
    if (!cleaningLogForm.performedAt) {
      setCleaningLogMessage('Performed at datetime is required.');
      return;
    }
    if (!cleaningLogForm.performedByName.trim()) {
      setCleaningLogMessage('Performed by name is required.');
      return;
    }
    if (cleaningLogForm.result === 'Fail' && !cleaningLogForm.correctiveAction.trim()) {
      setCleaningLogMessage('A Fail result needs a corrective action.');
      return;
    }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.cleaningLogs.map((l) => l.logNumber);
      const payload: Omit<CleaningLogEntry, 'id' | 'logNumber' | 'createdAt'> = {
        area: cleaningLogForm.area,
        areaDetail: cleaningLogForm.areaDetail.trim(),
        machineId: cleaningLogForm.machineId,
        cleaningType: cleaningLogForm.cleaningType,
        performedAt: cleaningLogForm.performedAt,
        performedByName: cleaningLogForm.performedByName.trim(),
        chemicalRegisterId: cleaningLogForm.chemicalRegisterId,
        chemicalName: cleaningLogForm.chemicalName.trim(),
        result: cleaningLogForm.result,
        supervisorSignOffName: cleaningLogForm.supervisorSignOffName.trim(),
        supervisorSignOffAt: cleaningLogForm.supervisorSignOffAt,
        correctiveAction: cleaningLogForm.correctiveAction,
        beforePhotoUrl: cleaningLogForm.beforePhotoUrl.trim(),
        afterPhotoUrl: cleaningLogForm.afterPhotoUrl.trim(),
        notes: cleaningLogForm.notes,
      };
      if (cleaningLogEditingId) {
        return {
          ...current,
          cleaningLogs: current.cleaningLogs.map((l) => l.id === cleaningLogEditingId ? { ...l, ...payload } : l),
        };
      }
      const newId = `cln-${Date.now().toString(36)}`;
      const logNumber = generateCode('CLN', existingNumbers, today);
      const newLog: CleaningLogEntry = {
        id: newId,
        logNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, cleaningLogs: [newLog, ...current.cleaningLogs] };
    });
    setCleaningLogMessage(cleaningLogEditingId ? 'Cleaning log updated.' : 'Cleaning log saved.');
    resetCleaningLogEditor();
  }

  /**
   * Set the food-safety hold status on a finished-goods batch. Only roles in
   * FOOD_SAFETY_RELEASE_ROLES (admin / ops) can move a batch to Released or
   * Dispatched. Anyone can mark a batch as On Hold / Rejected / Reworked.
   */
  function editComplaint(c: CustomerComplaint) {
    setComplaintEditingId(c.id);
    setComplaintForm({
      complaintDate: c.complaintDate,
      clientId: c.clientId,
      reportedByName: c.reportedByName,
      reportedByContact: c.reportedByContact,
      productId: c.productId,
      finishedGoodsStockId: c.finishedGoodsStockId,
      jobId: c.jobId,
      deliveryNoteId: c.deliveryNoteId,
      invoiceId: c.invoiceId,
      complaintType: c.complaintType,
      severity: c.severity,
      description: c.description,
      quantityAffected: String(c.quantityAffected ?? ''),
      quantityUnit: c.quantityUnit,
      quantityWithCustomer: String(c.quantityWithCustomer ?? ''),
      quantityInternalStock: String(c.quantityInternalStock ?? ''),
      photoUrls: [...c.photoUrls],
      status: c.status,
      investigationNotes: c.investigationNotes,
      rootCauseAnalysis: c.rootCauseAnalysis,
      immediateAction: c.immediateAction,
      correctiveAction: c.correctiveAction,
      preventiveAction: c.preventiveAction,
      outcome: c.outcome,
      outcomeNotes: c.outcomeNotes,
      closedByName: c.closedByName,
      recallTriggered: c.recallTriggered,
      recallScope: c.recallScope,
    });
    setView('complaints');
  }

  function handleSaveComplaint() {
    if (!complaintForm.complaintDate) {
      setComplaintMessage('Complaint date is required.');
      return;
    }
    if (!complaintForm.clientId) {
      setComplaintMessage('Client is required.');
      return;
    }
    if (!complaintForm.description.trim()) {
      setComplaintMessage('Description is required.');
      return;
    }
    const client = data.clients.find((c) => c.id === complaintForm.clientId);
    const product = complaintForm.productId ? data.products.find((p) => p.id === complaintForm.productId) : undefined;
    const fg = complaintForm.finishedGoodsStockId ? data.finishedGoodsStock.find((f) => f.id === complaintForm.finishedGoodsStockId) : undefined;
    const job = complaintForm.jobId ? data.jobs.find((j) => j.id === complaintForm.jobId) : undefined;
    const dn = complaintForm.deliveryNoteId ? data.deliveryNotes.find((d) => d.id === complaintForm.deliveryNoteId) : undefined;
    const inv = complaintForm.invoiceId ? data.invoices.find((i) => i.id === complaintForm.invoiceId) : undefined;
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.customerComplaints.map((c) => c.complaintNumber);
      // Auto-elevate status to Recall Triggered when the recall flag is on.
      const finalStatus: ComplaintStatus = complaintForm.recallTriggered ? 'Recall Triggered' : complaintForm.status;
      // Auto-stamp closure if closed-by-name is set and status is Closed/Resolved.
      const closedAt = (finalStatus === 'Closed' || finalStatus === 'Resolved') && complaintForm.closedByName.trim()
        ? new Date().toISOString()
        : '';
      const payload: Omit<CustomerComplaint, 'id' | 'complaintNumber' | 'createdAt'> = {
        complaintDate: complaintForm.complaintDate,
        clientId: complaintForm.clientId,
        clientName: client?.name || '',
        reportedByName: complaintForm.reportedByName.trim(),
        reportedByContact: complaintForm.reportedByContact.trim(),
        productId: complaintForm.productId,
        productName: product?.name || '',
        finishedGoodsStockId: complaintForm.finishedGoodsStockId,
        finishedGoodsStockNumber: fg?.stockNumber || '',
        jobId: complaintForm.jobId || (fg?.jobId ?? ''),
        jobNumber: job?.jobNumber || fg?.jobNumber || '',
        internalBatchNumber: job?.internalBatchNumber || '',
        deliveryNoteId: complaintForm.deliveryNoteId,
        deliveryNoteNumber: dn?.deliveryNoteNumber || '',
        invoiceId: complaintForm.invoiceId,
        invoiceNumber: inv?.invoiceNumber || '',
        complaintType: complaintForm.complaintType,
        severity: complaintForm.severity,
        description: complaintForm.description.trim(),
        quantityAffected: Number(complaintForm.quantityAffected || 0),
        quantityUnit: complaintForm.quantityUnit,
        quantityWithCustomer: Number(complaintForm.quantityWithCustomer || 0),
        quantityInternalStock: Number(complaintForm.quantityInternalStock || 0),
        photoUrls: complaintForm.photoUrls,
        status: finalStatus,
        investigationNotes: complaintForm.investigationNotes,
        rootCauseAnalysis: complaintForm.rootCauseAnalysis,
        immediateAction: complaintForm.immediateAction,
        correctiveAction: complaintForm.correctiveAction,
        preventiveAction: complaintForm.preventiveAction,
        outcome: complaintForm.outcome,
        outcomeNotes: complaintForm.outcomeNotes,
        closedByName: complaintForm.closedByName.trim(),
        closedAt,
        recallTriggered: complaintForm.recallTriggered,
        recallScope: complaintForm.recallScope,
      };
      if (complaintEditingId) {
        return {
          ...current,
          customerComplaints: current.customerComplaints.map((c) =>
            c.id === complaintEditingId ? { ...c, ...payload } : c,
          ),
        };
      }
      const newId = `cmp-${Date.now().toString(36)}`;
      const complaintNumber = generateCode('CMP', existingNumbers, today);
      const newComplaint: CustomerComplaint = {
        id: newId,
        complaintNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, customerComplaints: [newComplaint, ...current.customerComplaints] };
    });
    setComplaintMessage(complaintEditingId ? 'Complaint updated.' : 'Complaint logged.');
    resetComplaintEditor();
  }

  function editHaccpHazard(h: HaccpHazard) {
    setHaccpEditingId(h.id);
    setHaccpForm({
      processStep: h.processStep,
      hazardType: h.hazardType,
      hazardName: h.hazardName,
      description: h.description,
      likelihood: String(h.likelihood),
      severity: String(h.severity),
      controlMeasure: h.controlMeasure,
      isCCP: h.isCCP,
      monitoringMethod: h.monitoringMethod,
      monitoringFrequency: h.monitoringFrequency,
      criticalLimits: h.criticalLimits,
      correctiveAction: h.correctiveAction,
      verificationMethod: h.verificationMethod,
      responsiblePerson: h.responsiblePerson,
      reviewIntervalMonths: String(h.reviewIntervalMonths),
      lastReviewedDate: h.lastReviewedDate,
      notes: h.notes,
    });
    setView('haccpRegister');
  }

  function handleSaveHaccpHazard() {
    if (!haccpForm.hazardName.trim()) {
      setHaccpMessage('Hazard name is required.');
      return;
    }
    if (!haccpForm.controlMeasure.trim()) {
      setHaccpMessage('Control measure is required.');
      return;
    }
    const likelihood = Number(haccpForm.likelihood || 0);
    const severity = Number(haccpForm.severity || 0);
    const riskLevel = computeHaccpRiskLevel(likelihood, severity);
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.haccpHazards.map((h) => h.hazardNumber);
      const payload: Omit<HaccpHazard, 'id' | 'hazardNumber' | 'createdAt'> = {
        processStep: haccpForm.processStep,
        hazardType: haccpForm.hazardType,
        hazardName: haccpForm.hazardName.trim(),
        description: haccpForm.description,
        likelihood,
        severity,
        riskLevel,
        controlMeasure: haccpForm.controlMeasure,
        isCCP: haccpForm.isCCP,
        monitoringMethod: haccpForm.monitoringMethod,
        monitoringFrequency: haccpForm.monitoringFrequency,
        criticalLimits: haccpForm.criticalLimits,
        correctiveAction: haccpForm.correctiveAction,
        verificationMethod: haccpForm.verificationMethod,
        responsiblePerson: haccpForm.responsiblePerson.trim(),
        reviewIntervalMonths: Number(haccpForm.reviewIntervalMonths || 12),
        lastReviewedDate: haccpForm.lastReviewedDate,
        notes: haccpForm.notes,
      };
      if (haccpEditingId) {
        return {
          ...current,
          haccpHazards: current.haccpHazards.map((h) =>
            h.id === haccpEditingId ? { ...h, ...payload } : h,
          ),
        };
      }
      const newId = `haz-${Date.now().toString(36)}`;
      const hazardNumber = generateCode('HAZ', existingNumbers, today);
      const newHazard: HaccpHazard = {
        id: newId,
        hazardNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, haccpHazards: [newHazard, ...current.haccpHazards] };
    });
    setHaccpMessage(haccpEditingId ? 'Hazard updated.' : 'Hazard added to register.');
    resetHaccpEditor();
  }

  function editNcr(n: NonConformance) {
    setNcrEditingId(n.id);
    setNcrForm({
      issueDate: n.issueDate,
      area: n.area,
      areaDetail: n.areaDetail,
      issueType: n.issueType,
      severity: n.severity,
      description: n.description,
      jobId: n.jobId,
      finishedGoodsStockId: n.finishedGoodsStockId,
      cleaningLogId: n.cleaningLogId,
      reportedByName: n.reportedByName,
      immediateAction: n.immediateAction,
      rootCauseAnalysis: n.rootCauseAnalysis,
      correctiveAction: n.correctiveAction,
      preventiveAction: n.preventiveAction,
      responsiblePersonName: n.responsiblePersonName,
      dueDate: n.dueDate,
      evidencePhotoUrls: [...n.evidencePhotoUrls],
      status: n.status,
      verifiedByName: n.verifiedByName,
      closedByName: n.closedByName,
      closureNotes: n.closureNotes,
    });
    setView('nonConformance');
  }

  function handleSaveNcr() {
    if (!ncrForm.issueDate) {
      setNcrMessage('Issue date is required.');
      return;
    }
    if (!ncrForm.description.trim()) {
      setNcrMessage('Description is required.');
      return;
    }
    if (!ncrForm.reportedByName.trim()) {
      setNcrMessage('Reported-by name is required.');
      return;
    }
    const job = ncrForm.jobId ? data.jobs.find((j) => j.id === ncrForm.jobId) : undefined;
    const fg = ncrForm.finishedGoodsStockId ? data.finishedGoodsStock.find((f) => f.id === ncrForm.finishedGoodsStockId) : undefined;
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.nonConformances.map((n) => n.ncrNumber);
      // Auto-stamp closure timestamp if status is Closed and closedByName is set.
      const closedAt = ncrForm.status === 'Closed' && ncrForm.closedByName.trim()
        ? new Date().toISOString()
        : '';
      const verifiedAt = ncrForm.verifiedByName.trim() ? new Date().toISOString() : '';
      const payload: Omit<NonConformance, 'id' | 'ncrNumber' | 'createdAt'> = {
        issueDate: ncrForm.issueDate,
        area: ncrForm.area,
        areaDetail: ncrForm.areaDetail.trim(),
        issueType: ncrForm.issueType,
        severity: ncrForm.severity,
        description: ncrForm.description.trim(),
        jobId: ncrForm.jobId,
        jobNumber: job?.jobNumber || '',
        internalBatchNumber: job?.internalBatchNumber || '',
        finishedGoodsStockId: ncrForm.finishedGoodsStockId,
        finishedGoodsStockNumber: fg?.stockNumber || '',
        cleaningLogId: ncrForm.cleaningLogId,
        reportedByName: ncrForm.reportedByName.trim(),
        immediateAction: ncrForm.immediateAction,
        rootCauseAnalysis: ncrForm.rootCauseAnalysis,
        correctiveAction: ncrForm.correctiveAction,
        preventiveAction: ncrForm.preventiveAction,
        responsiblePersonName: ncrForm.responsiblePersonName.trim(),
        dueDate: ncrForm.dueDate,
        evidencePhotoUrls: ncrForm.evidencePhotoUrls,
        status: ncrForm.status,
        verifiedByName: ncrForm.verifiedByName.trim(),
        verifiedAt,
        closedByName: ncrForm.closedByName.trim(),
        closedAt,
        closureNotes: ncrForm.closureNotes,
      };
      if (ncrEditingId) {
        return {
          ...current,
          nonConformances: current.nonConformances.map((n) => n.id === ncrEditingId ? { ...n, ...payload } : n),
        };
      }
      const newId = `ncr-${Date.now().toString(36)}`;
      const ncrNumber = generateCode('NCR', existingNumbers, today);
      const newNcr: NonConformance = {
        id: newId,
        ncrNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, nonConformances: [newNcr, ...current.nonConformances] };
    });
    setNcrMessage(ncrEditingId ? 'NCR updated.' : 'NCR logged.');
    resetNcrEditor();
  }

  // ----- Phase 4: Staff training -----
  function editTraining(r: StaffTrainingRecord) {
    setTrainingEditingId(r.id);
    setTrainingForm({
      staffName: r.staffName, staffRole: r.staffRole, topic: r.topic,
      trainingDate: r.trainingDate, trainerName: r.trainerName, method: r.method,
      acknowledged: r.acknowledged, acknowledgedDate: r.acknowledgedDate,
      refresherIntervalMonths: String(r.refresherIntervalMonths),
      certificateUrl: r.certificateUrl, notes: r.notes,
    });
    setView('staffTraining');
  }
  function handleSaveTraining() {
    if (!trainingForm.staffName.trim()) { setTrainingMessage('Staff name is required.'); return; }
    if (!trainingForm.trainingDate) { setTrainingMessage('Training date is required.'); return; }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.staffTrainingRecords.map((r) => r.recordNumber);
      const interval = Number(trainingForm.refresherIntervalMonths || 12);
      const nextRefresher = trainingForm.trainingDate
        ? new Date(new Date(trainingForm.trainingDate).getTime() + interval * 30 * 86400000).toISOString().slice(0, 10)
        : '';
      const payload: Omit<StaffTrainingRecord, 'id' | 'recordNumber' | 'createdAt'> = {
        staffName: trainingForm.staffName.trim(),
        staffRole: trainingForm.staffRole.trim(),
        topic: trainingForm.topic,
        trainingDate: trainingForm.trainingDate,
        trainerName: trainingForm.trainerName.trim(),
        method: trainingForm.method.trim(),
        acknowledged: trainingForm.acknowledged,
        acknowledgedDate: trainingForm.acknowledgedDate,
        refresherIntervalMonths: interval,
        nextRefresherDate: nextRefresher,
        certificateUrl: trainingForm.certificateUrl.trim(),
        notes: trainingForm.notes,
      };
      if (trainingEditingId) {
        return { ...current, staffTrainingRecords: current.staffTrainingRecords.map((r) => r.id === trainingEditingId ? { ...r, ...payload } : r) };
      }
      const newRec: StaffTrainingRecord = {
        id: `trn-${Date.now().toString(36)}`,
        recordNumber: generateCode('TRN', existingNumbers, today),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, staffTrainingRecords: [newRec, ...current.staffTrainingRecords] };
    });
    setTrainingMessage(trainingEditingId ? 'Training record updated.' : 'Training logged.');
    resetTrainingEditor();
  }

  // ----- Phase 4: PPE issue -----
  function editPpe(r: PpeIssueRecord) {
    setPpeEditingId(r.id);
    // If a record was saved with the new multi-item shape use that;
    // otherwise wrap the legacy single-item fields as a one-line list.
    const items = (r.items && r.items.length > 0)
      ? r.items
      : [{ type: r.itemType, description: r.itemDescription, quantity: r.quantity || 1 }];
    setPpeForm({
      staffName: r.staffName, staffRole: r.staffRole, itemType: r.itemType,
      itemDescription: r.itemDescription, quantity: String(r.quantity),
      issuedByName: r.issuedByName, issuedDate: r.issuedDate, status: r.status,
      returnDate: r.returnDate, replacementDueDate: r.replacementDueDate, notes: r.notes,
      items,
      employeeSignatureDataUrl: r.employeeSignatureDataUrl ?? '',
    });
    setView('ppeControl');
  }
  function handleSavePpe() {
    if (!ppeForm.staffName.trim()) { setPpeMessage('Staff name is required.'); return; }
    if (!ppeForm.issuedDate) { setPpeMessage('Issue date is required.'); return; }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.ppeIssueRecords.map((r) => r.issueNumber);
      // If the form has the new multi-item list, use it; the legacy singular
      // fields are still populated from the first line so old code paths
      // (reports, the list table) keep working.
      const items = ppeForm.items.length > 0
        ? ppeForm.items
        : [{ type: ppeForm.itemType, description: ppeForm.itemDescription.trim(), quantity: Number(ppeForm.quantity || 1) }];
      const first = items[0];
      const payload: Omit<PpeIssueRecord, 'id' | 'issueNumber' | 'createdAt'> = {
        staffName: ppeForm.staffName.trim(),
        staffRole: ppeForm.staffRole.trim(),
        itemType: first.type,
        itemDescription: first.description,
        quantity: first.quantity,
        issuedByName: ppeForm.issuedByName.trim(),
        issuedDate: ppeForm.issuedDate,
        status: ppeForm.status,
        returnDate: ppeForm.returnDate,
        replacementDueDate: ppeForm.replacementDueDate,
        notes: ppeForm.notes,
        items,
        employeeSignatureDataUrl: ppeForm.employeeSignatureDataUrl || undefined,
      };
      if (ppeEditingId) {
        return { ...current, ppeIssueRecords: current.ppeIssueRecords.map((r) => r.id === ppeEditingId ? { ...r, ...payload } : r) };
      }
      const newRec: PpeIssueRecord = {
        id: `ppe-${Date.now().toString(36)}`,
        issueNumber: generateCode('PPE', existingNumbers, today),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, ppeIssueRecords: [newRec, ...current.ppeIssueRecords] };
    });
    setPpeMessage(ppeEditingId ? 'PPE record updated.' : 'PPE record saved.');
    resetPpeEditor();
  }

  // ----- Phase 40: Notice board -----
  function resetNoticeEditor() {
    setNoticeForm(createInitialNoticeForm());
    setNoticeEditingId(null);
    setNoticeMessage('');
  }
  function editNotice(n: Notice) {
    setNoticeEditingId(n.id);
    setNoticeForm({
      title: n.title,
      body: n.body,
      expiresAt: n.expiresAt ?? '',
      audienceRoles: n.audienceRoles ?? [],
      pinned: !!n.pinned,
    });
    setNoticeMessage('');
  }
  function handleSaveNotice() {
    if (!noticeForm.title.trim()) { setNoticeMessage('Title is required.'); return; }
    if (!noticeForm.body.trim()) { setNoticeMessage('Message is required.'); return; }
    setData((current) => {
      const payload: Omit<Notice, 'id' | 'postedAt' | 'postedByName'> = {
        title: noticeForm.title.trim(),
        body: noticeForm.body.trim(),
        expiresAt: noticeForm.expiresAt || undefined,
        audienceRoles: noticeForm.audienceRoles.length > 0 ? noticeForm.audienceRoles : undefined,
        pinned: noticeForm.pinned,
      };
      const existing = current.notices ?? [];
      if (noticeEditingId) {
        return { ...current, notices: existing.map((n) => n.id === noticeEditingId ? { ...n, ...payload } : n) };
      }
      const newNotice: Notice = {
        id: `notice-${Date.now().toString(36)}`,
        postedAt: new Date().toISOString(),
        postedByName: profile?.fullName || profile?.email || 'Admin',
        ...payload,
      };
      return { ...current, notices: [newNotice, ...existing] };
    });
    setNoticeMessage(noticeEditingId ? 'Notice updated.' : 'Notice posted.');
    resetNoticeEditor();
  }
  function handleDeleteNotice(id: string) {
    setData((current) => ({ ...current, notices: (current.notices ?? []).filter((n) => n.id !== id) }));
  }

  // ----- Phase 40: Staff acknowledgements -----
  function handleAcknowledgeTraining(trainingId: string) {
    setData((current) => ({
      ...current,
      staffTrainingRecords: current.staffTrainingRecords.map((t) => t.id === trainingId
        ? { ...t, acknowledged: true, acknowledgedDate: getToday() }
        : t),
    }));
  }
  function handleAcknowledgeSop(sopId: string, staffName: string) {
    if (!staffName.trim()) return;
    setData((current) => ({
      ...current,
      sopDocuments: current.sopDocuments.map((s) => {
        if (s.id !== sopId) return s;
        if (s.acknowledgements.some((a) => a.staffName.trim().toLowerCase() === staffName.trim().toLowerCase())) return s;
        return { ...s, acknowledgements: [...s.acknowledgements, { staffName: staffName.trim(), acknowledgedDate: getToday() }] };
      }),
    }));
  }

  // ----- Phase 4: Pest control -----
  function editPest(r: PestControlRecord) {
    setPestEditingId(r.id);
    setPestForm({
      serviceDate: r.serviceDate, providerName: r.providerName, technicianName: r.technicianName,
      nextServiceDate: r.nextServiceDate, activityType: r.activityType, pestType: r.pestType,
      findings: r.findings, correctiveActions: r.correctiveActions,
      productAffected: r.productAffected, stockOnHold: r.stockOnHold,
      reportUrls: [...r.reportUrls], baitStationMapUrl: r.baitStationMapUrl, notes: r.notes,
    });
    setView('pestControl');
  }
  function handleSavePest() {
    if (!pestForm.serviceDate) { setPestMessage('Service date is required.'); return; }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.pestControlRecords.map((r) => r.recordNumber);
      const payload: Omit<PestControlRecord, 'id' | 'recordNumber' | 'createdAt'> = {
        serviceDate: pestForm.serviceDate,
        providerName: pestForm.providerName.trim(),
        technicianName: pestForm.technicianName.trim(),
        nextServiceDate: pestForm.nextServiceDate,
        activityType: pestForm.activityType,
        pestType: pestForm.pestType,
        findings: pestForm.findings,
        correctiveActions: pestForm.correctiveActions,
        productAffected: pestForm.productAffected,
        stockOnHold: pestForm.stockOnHold,
        reportUrls: pestForm.reportUrls,
        baitStationMapUrl: pestForm.baitStationMapUrl.trim(),
        notes: pestForm.notes,
      };
      if (pestEditingId) {
        return { ...current, pestControlRecords: current.pestControlRecords.map((r) => r.id === pestEditingId ? { ...r, ...payload } : r) };
      }
      const newRec: PestControlRecord = {
        id: `pest-${Date.now().toString(36)}`,
        recordNumber: generateCode('PEST', existingNumbers, today),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, pestControlRecords: [newRec, ...current.pestControlRecords] };
    });
    setPestMessage(pestEditingId ? 'Pest entry updated.' : 'Pest entry logged.');
    resetPestEditor();
  }

  // ----- Phase 4: Foreign object -----
  function editForeignObject(r: ForeignObjectRecord) {
    setForeignObjectEditingId(r.id);
    setForeignObjectForm({
      area: r.area, material: r.material, description: r.description,
      recordType: r.recordType, inspectionDate: r.inspectionDate,
      inspectedByName: r.inspectedByName, status: r.status,
      controlMeasure: r.controlMeasure, linkedNcrId: r.linkedNcrId,
      photoUrls: [...r.photoUrls], notes: r.notes,
    });
    setView('foreignObjectControl');
  }
  function handleSaveForeignObject() {
    if (!foreignObjectForm.description.trim()) { setForeignObjectMessage('Description is required.'); return; }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.foreignObjectRecords.map((r) => r.recordNumber);
      const payload: Omit<ForeignObjectRecord, 'id' | 'recordNumber' | 'createdAt'> = {
        area: foreignObjectForm.area,
        material: foreignObjectForm.material,
        description: foreignObjectForm.description.trim(),
        recordType: foreignObjectForm.recordType,
        inspectionDate: foreignObjectForm.inspectionDate,
        inspectedByName: foreignObjectForm.inspectedByName.trim(),
        status: foreignObjectForm.status,
        controlMeasure: foreignObjectForm.controlMeasure,
        linkedNcrId: foreignObjectForm.linkedNcrId,
        photoUrls: foreignObjectForm.photoUrls,
        notes: foreignObjectForm.notes,
      };
      if (foreignObjectEditingId) {
        return { ...current, foreignObjectRecords: current.foreignObjectRecords.map((r) => r.id === foreignObjectEditingId ? { ...r, ...payload } : r) };
      }
      const newRec: ForeignObjectRecord = {
        id: `for-${Date.now().toString(36)}`,
        recordNumber: generateCode('FOR', existingNumbers, today),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, foreignObjectRecords: [newRec, ...current.foreignObjectRecords] };
    });
    setForeignObjectMessage(foreignObjectEditingId ? 'FO record updated.' : 'FO record saved.');
    resetForeignObjectEditor();
  }

  // ----- Phase 4: Tool / blade -----
  function editToolBlade(r: ToolBladeRecord) {
    setToolBladeEditingId(r.id);
    setToolBladeForm({
      itemType: r.itemType, serialNumber: r.serialNumber, description: r.description,
      homeLocation: r.homeLocation, currentHolderName: r.currentHolderName,
      issuedToName: r.issuedToName, issuedDate: r.issuedDate,
      expectedReturnDate: r.expectedReturnDate, returnedDate: r.returnedDate,
      status: r.status, isCritical: r.isCritical, linkedNcrId: r.linkedNcrId, notes: r.notes,
    });
    setView('toolBladeControl');
  }
  function handleSaveToolBlade() {
    if (!toolBladeForm.serialNumber.trim()) { setToolBladeMessage('Serial number is required.'); return; }
    if (!toolBladeForm.description.trim()) { setToolBladeMessage('Description is required.'); return; }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.toolBladeRecords.map((r) => r.recordNumber);
      const payload: Omit<ToolBladeRecord, 'id' | 'recordNumber' | 'createdAt'> = {
        itemType: toolBladeForm.itemType,
        serialNumber: toolBladeForm.serialNumber.trim(),
        description: toolBladeForm.description.trim(),
        homeLocation: toolBladeForm.homeLocation.trim(),
        currentHolderName: toolBladeForm.currentHolderName.trim(),
        issuedToName: toolBladeForm.issuedToName.trim(),
        issuedDate: toolBladeForm.issuedDate,
        expectedReturnDate: toolBladeForm.expectedReturnDate,
        returnedDate: toolBladeForm.returnedDate,
        status: toolBladeForm.status,
        isCritical: toolBladeForm.isCritical,
        linkedNcrId: toolBladeForm.linkedNcrId,
        notes: toolBladeForm.notes,
      };
      if (toolBladeEditingId) {
        return { ...current, toolBladeRecords: current.toolBladeRecords.map((r) => r.id === toolBladeEditingId ? { ...r, ...payload } : r) };
      }
      const newRec: ToolBladeRecord = {
        id: `tlb-${Date.now().toString(36)}`,
        recordNumber: generateCode('TLB', existingNumbers, today),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, toolBladeRecords: [newRec, ...current.toolBladeRecords] };
    });
    setToolBladeMessage(toolBladeEditingId ? 'Tool record updated.' : 'Tool record saved.');
    resetToolBladeEditor();
  }

  // ----- Phase 4: Visitor log -----
  function editVisitor(r: VisitorLogEntry) {
    setVisitorEditingId(r.id);
    setVisitorForm({
      visitDate: r.visitDate, visitorName: r.visitorName, visitorType: r.visitorType,
      company: r.company, hostName: r.hostName, purpose: r.purpose,
      areasVisited: [...r.areasVisited], timeIn: r.timeIn, timeOut: r.timeOut,
      hygieneAcknowledged: r.hygieneAcknowledged, ppeIssued: r.ppeIssued,
      enteredFoodContactArea: r.enteredFoodContactArea, notes: r.notes,
      phoneNumber: r.phoneNumber ?? '',
      vehicleRegistration: r.vehicleRegistration ?? '',
      signatureDataUrl: r.signatureDataUrl ?? '',
    });
    setView('visitorLog');
  }
  function handleSaveVisitor() {
    if (!visitorForm.visitDate) { setVisitorMessage('Visit date is required.'); return; }
    if (!visitorForm.visitorName.trim()) { setVisitorMessage('Visitor name is required.'); return; }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.visitorLogEntries.map((r) => r.visitNumber);
      const payload: Omit<VisitorLogEntry, 'id' | 'visitNumber' | 'createdAt'> = {
        visitDate: visitorForm.visitDate,
        visitorName: visitorForm.visitorName.trim(),
        visitorType: visitorForm.visitorType,
        company: visitorForm.company.trim(),
        hostName: visitorForm.hostName.trim(),
        purpose: visitorForm.purpose,
        areasVisited: visitorForm.areasVisited,
        timeIn: visitorForm.timeIn,
        timeOut: visitorForm.timeOut,
        hygieneAcknowledged: visitorForm.hygieneAcknowledged,
        ppeIssued: visitorForm.ppeIssued.trim(),
        enteredFoodContactArea: visitorForm.enteredFoodContactArea,
        notes: visitorForm.notes,
      };
      if (visitorEditingId) {
        return { ...current, visitorLogEntries: current.visitorLogEntries.map((r) => r.id === visitorEditingId ? { ...r, ...payload } : r) };
      }
      const newRec: VisitorLogEntry = {
        id: `vis-${Date.now().toString(36)}`,
        visitNumber: generateCode('VIS', existingNumbers, today),
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, visitorLogEntries: [newRec, ...current.visitorLogEntries] };
    });
    setVisitorMessage(visitorEditingId ? 'Visitor entry updated.' : 'Visitor logged.');
    resetVisitorEditor();
  }

  // ----- Phase 37: Reception kiosk -----
  function handleKioskCheckIn(payload: Omit<VisitorLogEntry, 'id' | 'createdAt' | 'visitNumber'>) {
    setData((current) => {
      const visitNumber = generateCode('VIS', current.visitorLogEntries.map((r) => r.visitNumber), payload.visitDate);
      const newRec: VisitorLogEntry = {
        id: `vis-${Date.now().toString(36)}`,
        visitNumber,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      return { ...current, visitorLogEntries: [newRec, ...current.visitorLogEntries] };
    });
  }
  function handleKioskSignOut(id: string, signatureDataUrl: string) {
    const timeStr = new Date().toTimeString().slice(0, 5);
    setData((current) => ({
      ...current,
      visitorLogEntries: current.visitorLogEntries.map((v) =>
        v.id === id
          ? {
              ...v,
              timeOut: v.timeOut || timeStr,
              signatureDataUrl: signatureDataUrl || v.signatureDataUrl,
              kioskCheckout: true,
            }
          : v,
      ),
    }));
  }
  /** Reception confirms a kiosk check-in: assigns PPE + allowed areas and stamps verification. */
  function handleVerifyVisitor(id: string, payload: { ppeIssued: string; areasVisited: FactoryArea[] }) {
    const actor = profile?.fullName || profile?.email || 'Reception';
    setData((current) => ({
      ...current,
      visitorLogEntries: current.visitorLogEntries.map((v) =>
        v.id === id
          ? {
              ...v,
              ppeIssued: payload.ppeIssued,
              areasVisited: payload.areasVisited,
              staffVerified: true,
              verifiedByName: actor,
              verifiedAt: new Date().toISOString(),
            }
          : v,
      ),
    }));
  }

  // ----- Phase 5.6: SOPs -----
  function editSop(d: SopDocument) {
    setSopEditingId(d.id);
    setSopForm({
      title: d.title, category: d.category, version: d.version,
      ownerName: d.ownerName, approvedByName: d.approvedByName, approvedDate: d.approvedDate,
      reviewDate: d.reviewDate, documentUrl: d.documentUrl, summary: d.summary,
      status: d.status, acknowledgements: [...d.acknowledgements],
      supersedesId: d.supersedesId, notes: d.notes,
    });
    setView('sopRegister');
  }
  function handleSaveSop() {
    if (!sopForm.title.trim()) { setSopMessage('Title is required.'); return; }
    if (!sopForm.version.trim()) { setSopMessage('Version is required.'); return; }
    setData((current) => {
      const today = getToday();
      const existingNumbers = current.sopDocuments.map((d) => d.documentNumber);
      const payload: Omit<SopDocument, 'id' | 'documentNumber' | 'createdAt'> = {
        title: sopForm.title.trim(),
        category: sopForm.category,
        version: sopForm.version.trim(),
        ownerName: sopForm.ownerName.trim(),
        approvedByName: sopForm.approvedByName.trim(),
        approvedDate: sopForm.approvedDate,
        reviewDate: sopForm.reviewDate,
        documentUrl: sopForm.documentUrl.trim(),
        summary: sopForm.summary,
        status: sopForm.status,
        acknowledgements: sopForm.acknowledgements.filter((a) => a.staffName.trim()),
        supersedesId: sopForm.supersedesId,
        notes: sopForm.notes,
      };
      let nextDocs = current.sopDocuments;
      if (sopEditingId) {
        nextDocs = nextDocs.map((d) => d.id === sopEditingId ? { ...d, ...payload } : d);
      } else {
        const newDoc: SopDocument = {
          id: `sop-${Date.now().toString(36)}`,
          documentNumber: generateCode('SOP', existingNumbers, today),
          createdAt: new Date().toISOString(),
          ...payload,
        };
        // If this new doc supersedes an existing one, mark the predecessor as Superseded.
        if (newDoc.supersedesId) {
          nextDocs = nextDocs.map((d) => d.id === newDoc.supersedesId ? { ...d, status: 'Superseded' as const } : d);
        }
        nextDocs = [newDoc, ...nextDocs];
      }
      return { ...current, sopDocuments: nextDocs };
    });
    setSopMessage(sopEditingId ? 'SOP updated.' : 'SOP saved.');
    resetSopEditor();
  }
  function handleCreateNewSopVersion(predecessor: SopDocument) {
    // Bump the version (semantic-ish: x.y → x.(y+1), or major bump if integer).
    const parts = predecessor.version.split('.');
    let nextVersion = predecessor.version + '.1';
    if (parts.length >= 2) {
      const minor = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(minor)) {
        parts[parts.length - 1] = String(minor + 1);
        nextVersion = parts.join('.');
      }
    } else {
      const major = parseInt(predecessor.version, 10);
      nextVersion = Number.isNaN(major) ? predecessor.version + '.1' : `${major + 1}.0`;
    }
    setSopEditingId(null);
    setSopForm({
      title: predecessor.title,
      category: predecessor.category,
      version: nextVersion,
      ownerName: predecessor.ownerName,
      approvedByName: '',
      approvedDate: '',
      reviewDate: '',
      documentUrl: predecessor.documentUrl,
      summary: `Supersedes ${predecessor.documentNumber} (${predecessor.version}). Changes: `,
      status: 'Draft',
      acknowledgements: [],
      supersedesId: predecessor.id,
      notes: '',
    });
    setSopMessage(`Drafting new version of ${predecessor.documentNumber}. Save to mark the previous version as Superseded.`);
    setView('sopRegister');
  }

  function handleOpenTraceabilityFromComplaint(c: CustomerComplaint) {
    // Pick the most-specific identifier the complaint carries.
    if (c.finishedGoodsStockNumber) {
      setTraceabilitySeed({ type: 'finishedGoodsStock', query: c.finishedGoodsStockNumber });
    } else if (c.internalBatchNumber) {
      setTraceabilitySeed({ type: 'internalBatch', query: c.internalBatchNumber });
    } else if (c.jobNumber) {
      setTraceabilitySeed({ type: 'jobNumber', query: c.jobNumber });
    } else if (c.clientName) {
      setTraceabilitySeed({ type: 'customer', query: c.clientName });
    }
    setView('traceability');
  }

  function handleFoodSafetyHoldChange(stockId: string, nextStatus: FoodSafetyHoldStatus, reason?: string) {
    const role = profile?.role ?? 'production';
    if ((nextStatus === 'Released' || nextStatus === 'Dispatched') && !canUserReleaseFoodSafetyBatch(role)) {
      return;
    }
    setData((current) => ({
      ...current,
      finishedGoodsStock: current.finishedGoodsStock.map((item) => {
        if (item.id !== stockId) return item;
        return {
          ...item,
          foodSafetyHoldStatus: nextStatus,
          releasedByName: nextStatus === 'Released' || nextStatus === 'Dispatched'
            ? (profile?.email || 'Unknown')
            : item.releasedByName,
          releasedAt: nextStatus === 'Released' || nextStatus === 'Dispatched'
            ? new Date().toISOString()
            : item.releasedAt,
          holdReason: nextStatus === 'On Hold' ? (reason ?? item.holdReason) : item.holdReason,
        };
      }),
    }));
  }

  function editTier(tier: PricingTier) {
    setTierEditingId(tier.id);
    setTierForm({
      name: tier.name,
      type: tier.type,
      defaultMarginPercent: String(tier.defaultMarginPercent),
      brandingMarginPercent: String(tier.brandingMarginPercent),
      notes: tier.notes,
    });
    setView('pricing');
  }

  function editPaperRate(rate: PaperRate) {
    setPaperRateEditingId(rate.id);
    setPaperRateForm({
      name: rate.name,
      supplierId: rate.supplierId,
      paperType: rate.paperType,
      gsm: rate.gsm,
      pricePerTon: String(rate.pricePerTon),
      notes: rate.notes,
      active: rate.active,
    });
    setView('costInputs');
  }

  function editCostProfile(profile: CostProfile) {
    setCostProfileEditingId(profile.id);
    setCostProfileForm({
      name: profile.name,
      wastagePercent: String(profile.wastagePercent),
      defaultMarginPercent: String(profile.defaultMarginPercent),
      baseGlueCostPerBag: String(profile.baseGlueCostPerBag),
      hotMeltCostPerBag: String(profile.hotMeltCostPerBag),
      flatHandleCostPerBag: String(profile.flatHandleCostPerBag),
      ropeHandleCostPerBag: String(profile.ropeHandleCostPerBag),
      rollHandleCostPerBag: String(profile.rollHandleCostPerBag),
      screenPrintSetupCost: String(profile.screenPrintSetupCost),
      screenPrintCostPerColor: String(profile.screenPrintCostPerColor),
      flexoInkCostPer1000PerColor: String(profile.flexoInkCostPer1000PerColor),
      plateCostPerColor: String(profile.plateCostPerColor),
      labourCostPer1000: String(profile.labourCostPer1000),
      packagingCostPer1000: String(profile.packagingCostPer1000),
      transportCostPerJob: String(profile.transportCostPerJob),
      sideSeamAllowanceMm: String(profile.sideSeamAllowanceMm),
      topFoldAllowanceMm: String(profile.topFoldAllowanceMm),
      bottomFoldAllowanceMm: String(profile.bottomFoldAllowanceMm),
      flexoThresholdQty: String(profile.flexoThresholdQty),
      active: profile.active,
      notes: profile.notes,
    });
    setView('costInputs');
  }

  function editSupplier(supplier: Supplier) {
    setSupplierEditingId(supplier.id);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      contacts: supplier.contacts,
      address: supplier.address,
      billingAddress: supplier.billingAddress,
      city: supplier.city,
      country: supplier.country,
      website: supplier.website,
      supplierType: supplier.supplierType,
      certificateCode: supplier.certificateCode,
      accountNumber: supplier.accountNumber,
      paymentTerms: supplier.paymentTerms,
      creditLimit: String(supplier.creditLimit),
      currentBalance: String(supplier.currentBalance),
      currency: supplier.currency,
      isAlsoClient: supplier.isAlsoClient,
      linkedClientId: supplier.linkedClientId,
      lastCheckInDate: supplier.lastCheckInDate,
      nextReviewDate: supplier.nextReviewDate,
      reviewFrequencyMonths: String(supplier.reviewFrequencyMonths),
      internalOwner: supplier.internalOwner,
      certifications: supplier.certifications,
      suppliedProducts: supplier.suppliedProducts,
      notes: supplier.notes,
      active: supplier.active,
    });
    setView('suppliers');
  }

  function editMachine(machine: Machine) {
    setMachineEditingId(machine.id);
    setMachineForm({
      name: machine.name,
      code: machine.code,
      department: machine.department,
      processType: machine.processType,
      status: machine.status,
      notes: machine.notes,
      active: machine.active,
    });
    setView('machines');
  }

  function editQuote(quote: QuoteEstimate) {
    setQuoteEditingId(quote.id);
    setQuoteForm({
      quoteDate: quote.quoteDate,
      quickbooksEstimateNumber: quote.quickbooksEstimateNumber,
      linkedLeadId: quote.linkedLeadId,
      clientId: quote.clientId,
      productId: quote.productId,
      pricingTierId: quote.pricingTierId,
      paperRateId: quote.paperRateId,
      costProfileId: quote.costProfileId,
      quantity: String(quote.quantity),
      sizeSpec: quote.sizeSpec,
      handleType: quote.handleType,
      printMethod: quote.printMethod,
      colors: String(quote.colors),
      unitCost: String(quote.unitCost),
      quotedUnitPrice: String(quote.quotedUnitPrice),
      totalQuote: String(quote.totalQuote),
      status: quote.status,
      notes: quote.notes,
      customerNote: quote.customerNote ?? '',
    });
    setView('quotes');
  }

  /**
   * Promote a Quote to a new Job. Eliminates retyping by pre-filling the job
   * form from the quote + the linked Product master. Auto-marks the quote as
   * Won when the job is saved (handled in handleSaveJob's existing flow when
   * `quoteId` is set on the form).
   *
   * UX: switches the view to 'jobs' with the form pre-populated. The user
   * just confirms / tweaks dates and hits Save.
   */
  function handleConvertQuoteToJob(quote: QuoteEstimate) {
    const product = data.products.find((p) => p.id === quote.productId);
    const client = data.clients.find((c) => c.id === quote.clientId);
    setJobEditingId(null);
    setJobForm({
      ...createInitialJobForm(),
      jobDate: getToday(),
      dueDate: quote.quoteDate || getToday(),
      leadId: quote.linkedLeadId || '',
      leadNumber: quote.linkedLeadNumber || '',
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      quickbooksEstimateNumber: quote.quickbooksEstimateNumber,
      orderValue: String(quote.totalQuote),
      clientId: quote.clientId,
      pricingTierId: quote.pricingTierId,
      productId: quote.productId,
      productCategory: product?.category ?? 'Paper Bags',
      customerName: client?.name ?? quote.clientName,
      productName: quote.productName,
      sizeSpec: quote.sizeSpec,
      paperType: product?.defaultPaperType ?? '',
      gsm: product?.defaultGsm ?? '',
      printRequired: quote.printMethod !== 'Plain',
      printMethod: quote.printMethod,
      colorCount: String(quote.colors),
      quantityPlanned: String(quote.quantity),
      status: 'Draft',
      notes: quote.notes,
    });
    setJobMessage(`Pre-filled from quote ${quote.quoteNumber}. Confirm dates + tier and save.`);
    setView('jobs');
  }

  function editLead(lead: Lead) {
    setLeadEditingId(lead.id);
    setLeadForm({
      enquiryDate: lead.enquiryDate,
      clientId: lead.clientId,
      companyName: lead.companyName,
      contactName: lead.contactName,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      assignedTo: lead.assignedTo,
      productId: lead.productId,
      requestedQuantity: String(lead.requestedQuantity),
      dueDate: lead.dueDate,
      status: lead.status,
      quickbooksEstimateNumber: lead.quickbooksEstimateNumber,
      linkedQuoteId: lead.linkedQuoteId,
      notes: lead.notes,
      nextFollowUpDate: lead.nextFollowUpDate ?? '',
      activities: lead.activities ? [...lead.activities] : [],
      lostReason: lead.lostReason ?? '',
      estimatedValue: String(lead.estimatedValue ?? ''),
    });
    setView('leads');
  }

  function editArtwork(record: ArtworkRecord) {
    setArtworkEditingId(record.id);
    setArtworkForm({
      jobId: record.jobId,
      artworkReceivedDate: record.artworkReceivedDate,
      proofSentDate: record.proofSentDate,
      approvalDate: record.approvalDate,
      stage: record.stage,
      changesRequested: record.changesRequested,
      notes: record.notes,
    });
    setView('artwork');
  }

  function editCustomerStockRelease(release: CustomerStockRelease) {
    setCustomerStockReleaseEditingId(release.id);
    setCustomerStockReleaseForm({
      releaseDate: release.releaseDate,
      clientId: release.clientId,
      finishedGoodsStockId: release.finishedGoodsStockId,
      jobId: release.jobId,
      quantityReleased: String(release.quantityReleased),
      quantityUnit: release.quantityUnit,
      destination: release.destination,
      notes: release.notes,
    });
    setView('customerStock');
  }

  function editClient(client: Client) {
    setClientEditingId(client.id);
    setClientForm({
      name: client.name,
      companyName: client.companyName ?? '',
      accountManagerName: client.accountManagerName ?? '',
      code: client.code,
      pricingTierId: client.pricingTierId,
      brandingDefault: client.brandingDefault,
      defaultMarginPercent: String(client.defaultMarginPercent),
      creditLimit: String(client.creditLimit),
      currentBalance: String(client.currentBalance),
      paymentTerms: client.paymentTerms,
      primaryPaymentMethod: client.primaryPaymentMethod ?? 'EFT',
      currency: client.currency ?? 'ZAR',
      invoiceLanguage: client.invoiceLanguage ?? 'English',
      vatNumber: client.vatNumber ?? '',
      openingBalance: String(client.openingBalance ?? 0),
      openingBalanceAsOf: client.openingBalanceAsOf ?? '',
      accountHold: client.accountHold,
      title: client.title ?? '',
      firstName: client.firstName ?? '',
      middleName: client.middleName ?? '',
      lastName: client.lastName ?? '',
      suffix: client.suffix ?? '',
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      phoneNumber: client.phoneNumber ?? '',
      mobileNumber: client.mobileNumber ?? '',
      otherPhone: client.otherPhone ?? '',
      faxNumber: client.faxNumber ?? '',
      ccEmail: client.ccEmail ?? '',
      bccEmail: client.bccEmail ?? '',
      website: client.website ?? '',
      marketingConsent: client.marketingConsent ?? false,
      billingAddressLine1: client.billingAddressLine1 ?? '',
      billingAddressLine2: client.billingAddressLine2 ?? '',
      billingCity: client.billingCity ?? '',
      billingState: client.billingState ?? '',
      billingPostalCode: client.billingPostalCode ?? '',
      billingCountry: client.billingCountry ?? 'South Africa',
      deliveryAddressLine1: client.deliveryAddressLine1 ?? '',
      deliveryAddressLine2: client.deliveryAddressLine2 ?? '',
      deliveryCity: client.deliveryCity ?? '',
      deliveryState: client.deliveryState ?? '',
      deliveryPostalCode: client.deliveryPostalCode ?? '',
      deliveryCountry: client.deliveryCountry ?? 'South Africa',
      stockHoldingEnabled: client.stockHoldingEnabled ?? false,
      stockHoldingAgreementSigned: client.stockHoldingAgreementSigned ?? false,
      stockHoldingAgreementSignedDate: client.stockHoldingAgreementSignedDate ?? '',
      stockHoldingAgreementReference: client.stockHoldingAgreementReference ?? '',
      stockHoldingReviewDate: client.stockHoldingReviewDate ?? '',
      creditAgreementSigned: client.creditAgreementSigned ?? false,
      creditAgreementSignedDate: client.creditAgreementSignedDate ?? '',
      creditAgreementReference: client.creditAgreementReference ?? '',
      storageGracePeriodDays: String(client.storageGracePeriodDays ?? 0),
      maxStoragePeriodDays: String(client.maxStoragePeriodDays ?? 0),
      storageFeeApplies: client.storageFeeApplies ?? false,
      storageFeeType: client.storageFeeType ?? 'None',
      storageFeeRate: String(client.storageFeeRate ?? 0),
      depositRequiredPercent: String(client.depositRequiredPercent ?? 0),
      minimumMonthlyReleaseQuantity: String(client.minimumMonthlyReleaseQuantity ?? 0),
      minimumMonthlyReleaseUnit: client.minimumMonthlyReleaseUnit ?? 'units',
      minimumReleaseQuantity: String(client.minimumReleaseQuantity ?? 0),
      deliveryChargePolicy: client.deliveryChargePolicy ?? 'Charge Every Release',
      releaseApprovalRequired: client.releaseApprovalRequired ?? true,
      portalEnabled: client.portalEnabled ?? false,
      portalViewQuotes: client.portalViewQuotes ?? true,
      portalViewInvoices: client.portalViewInvoices ?? true,
      portalViewStock: client.portalViewStock ?? true,
      portalRequestRelease: client.portalRequestRelease ?? false,
      notes: client.notes,
      active: client.active,
    });
    setView('clients');
  }

  function editProduct(product: Product) {
    setProductEditingId(product.id);
    const spec = product.pricingSpec;
    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      supplyType: product.supplyType,
      defaultSupplierId: product.defaultSupplierId,
      brandingAllowed: product.brandingAllowed,
      defaultUnit: product.defaultUnit,
      defaultPaperType: product.defaultPaperType,
      defaultGsm: product.defaultGsm,
      notes: product.notes,
      active: product.active,
      pricingEnabled: product.pricingEnabled ?? false,
      bagWidthMm: spec ? String(spec.bagWidthMm) : '',
      bagHeightMm: spec ? String(spec.bagHeightMm) : '',
      gussetMm: spec ? String(spec.gussetMm) : '',
      handleType: spec?.handleType ?? 'None',
      printMethod: spec?.printMethod ?? 'Plain',
      colors: spec ? String(spec.colors) : '0',
      printAreaCm2: spec ? String(spec.printAreaCm2) : '',
      coverageBand: spec?.coverageBand ?? 'None',
      paperRateId: spec?.paperRateId ?? '',
      costProfileId: spec?.costProfileId ?? '',
      plateBilling: spec?.plateBilling ?? 'amortized',
      baseMarginPercent: spec ? String(spec.baseMarginPercent) : '',
      baseQuantity: spec ? String(spec.baseQuantity) : '1000',
      breakQuantities: spec ? spec.breakQuantities.join(', ') : '5000, 10000, 25000',
    });
    setView('products');
  }

  function editProduction(log: ProductionLogEntry) {
    setProductionEditingId(log.id);
    setProductionForm({
      logDate: log.logDate,
      logType: log.logType,
      jobId: log.jobId,
      operatorName: log.operatorName,
      machineId: log.machineId,
      machine: log.machine,
      sourceMaterialId: log.sourceMaterialId,
      setupTimeMinutes: String(log.setupTimeMinutes),
      notes: log.notes,
      operatorSignature: log.operatorSignature,
      fscRelated: log.fscRelated,
      rollCode: log.rollCode,
      height: log.height,
      gusset: log.gusset,
      handleType: log.handleType,
      goodBags: String(log.goodBags),
      rejectBags: String(log.rejectBags),
      heightChange: log.heightChange,
      printingMethod: log.printingMethod,
      bagSize: log.bagSize,
      numberOfColors: String(log.numberOfColors),
      quantityPrinted: String(log.quantityPrinted),
      materialSourceCode: log.materialSourceCode,
      rollWidth: log.rollWidth,
      metersKgPrinted: String(log.metersKgPrinted),
      rejectMetersKg: String(log.rejectMetersKg),
      parentRollCode: log.parentRollCode,
      parentWidth: log.parentWidth,
      targetChildWidth: log.targetChildWidth,
      numberOfChildRolls: String(log.numberOfChildRolls),
      childDiameter: log.childDiameter,
      totalWasteKg: String(log.totalWasteKg),
      bladeChange: log.bladeChange,
    });
    setView('production');
  }

  function editWaste(entry: WasteEntry) {
    setWasteEditingId(entry.id);
    setWasteForm({
      wasteDate: entry.wasteDate,
      jobId: entry.jobId,
      productionLogId: entry.productionLogId,
      wasteQuantity: String(entry.wasteQuantity),
      wasteUnit: entry.wasteUnit,
      wasteReason: entry.wasteReason,
      notes: entry.notes,
      enteredBy: entry.enteredBy,
      fscRelated: entry.fscRelated,
    });
    setView('waste');
  }

  function editPaper(log: PaperLog) {
    setPaperEditingId(log.id);
    setPaperForm({
      logDate: log.logDate,
      jobId: log.jobId,
      materialReceiptId: log.materialReceiptId,
      paperType: log.paperType,
      gsm: log.gsm,
      width: log.width,
      quantityUsed: String(log.quantityUsed),
      quantityUnit: log.quantityUnit,
      paperCode: log.paperCode,
      notes: log.notes,
      fscRelated: log.fscRelated,
    });
    setView('paper');
  }

  function editDispatch(record: DispatchRecord) {
    setDispatchEditingId(record.id);
    setDispatchForm({
      dispatchDate: record.dispatchDate,
      jobId: record.jobId,
      finishedGoodsStockId: record.finishedGoodsStockId,
      quantityDispatched: String(record.quantityDispatched),
      quantityUnit: record.quantityUnit,
      labelReference: record.labelReference,
      deliveryReference: record.deliveryReference,
      issueNotes: record.issueNotes,
      fscRelated: record.fscRelated,
    });
    setView('dispatch');
  }

  function editDeliveryNote(note: DeliveryNote) {
    setDeliveryNoteEditingId(note.id);
    setDeliveryNoteForm({
      noteDate: note.noteDate,
      clientId: note.clientId,
      clientContactName: note.clientContactName,
      clientContactPhone: note.clientContactPhone,
      clientEmail: note.clientEmail,
      clientAddress: note.clientAddress,
      companyName: note.companyName,
      companyPhone: note.companyPhone,
      companyEmail: note.companyEmail,
      companyAddress: note.companyAddress,
      jobId: note.jobId,
      dispatchRecordId: '',
      customerStockReleaseId: '',
      deliveryMethod: note.deliveryMethod,
      deliveryReference: note.deliveryReference,
      vehicleRegistration: note.vehicleRegistration,
      driverName: note.driverName,
      dispatchedBy: note.dispatchedBy,
      receivedBy: note.receivedBy,
      status: note.status,
      clientVisible: note.clientVisible,
      lineItems: note.lineItems,
      notes: note.notes,
      customerNote: note.customerNote ?? '',
      parentInvoiceId: note.parentInvoiceId || '',
      receiptMode: note.receiptMode || 'Pending',
      signedByName: note.signedByName || '',
      signedByDate: note.signedByDate || '',
      signedByContactInfo: note.signedByContactInfo || '',
      collectedByName: note.collectedByName || '',
      collectedByDate: note.collectedByDate || '',
      collectedByIdNumber: note.collectedByIdNumber || '',
    });
    setView('deliveryNotes');
  }

  /**
   * Promote a Job to a new Delivery Note. Pre-fills the delivery note form
   * from the job's client, product and quantity. The user picks the dispatch
   * record (filtered to this job by the existing form filter logic) and
   * confirms recipient details.
   *
   * On save, downstream handler logic flips the job's `dispatchStatus` and
   * `readyForDispatchDate` so the production board reflects the move.
   */
  function handleCreateDeliveryFromJob(job: JobCard) {
    const client = data.clients.find((c) => c.id === job.clientId);
    const deliveryAddress = client
      ? [client.deliveryAddressLine1, client.deliveryAddressLine2, client.deliveryCity, client.deliveryState, client.deliveryPostalCode, client.deliveryCountry]
          .filter(Boolean)
          .join(', ')
      : '';
    setDeliveryNoteEditingId(null);
    setDeliveryNoteForm({
      ...createInitialDeliveryNoteForm(),
      noteDate: getToday(),
      clientId: job.clientId,
      clientContactName: client?.contactName ?? '',
      clientContactPhone: client?.phoneNumber ?? client?.mobileNumber ?? '',
      clientEmail: client?.contactEmail ?? '',
      clientAddress: deliveryAddress,
      companyName: data.appSettings.company.name,
      companyPhone: data.appSettings.company.phone,
      companyEmail: data.appSettings.company.email,
      companyAddress: `${data.appSettings.company.addressLine1}\n${data.appSettings.company.addressLine2}`,
      jobId: job.id,
      // Seed a single line item for this job. The user can append dispatch
      // records on top via the form's existing picker.
      lineItems: [
        {
          id: `dl-${Date.now().toString(36)}`,
          productName: job.productName,
          stockNumber: '',
          description: job.description || job.sizeSpec || '',
          quantity: Math.max(job.quantityCompleted || job.quantityPlanned, 0),
          quantityUnit: 'units' as const,
          dispatchRecordId: '',
          customerStockReleaseId: '',
        },
      ],
    });
    setDeliveryNoteMessage(`Pre-filled from job ${job.jobNumber}. Confirm recipient details and save.`);
    setView('deliveryNotes');
  }

  function editInvoice(invoice: Invoice) {
    setInvoiceEditingId(invoice.id);
    setInvoiceForm({
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      clientId: invoice.clientId,
      jobId: invoice.jobId,
      quoteId: invoice.quoteId,
      productionSpecId: invoice.productionSpecId,
      customerReference: invoice.customerReference,
      termsType: invoice.termsType,
      termsText: invoice.termsText,
      notes: invoice.notes,
      footerNotes: invoice.footerNotes,
      customerNote: invoice.customerNote ?? '',
      status: invoice.status,
      currency: invoice.currency,
      lineItems: invoice.lineItems.map((line) => ({
        id: line.id,
        productId: line.productId,
        productName: line.productName,
        description: line.description,
        quantity: String(line.quantity ?? ''),
        quantityUnit: line.quantityUnit,
        unitPriceExclVat: String(line.unitPriceExclVat ?? ''),
        vatRatePercent: String(line.vatRatePercent ?? ''),
      })),
      payments: invoice.payments.map((pay) => ({
        id: pay.id,
        paymentDate: pay.paymentDate,
        amount: String(pay.amount ?? ''),
        method: pay.method,
        reference: pay.reference,
        notes: pay.notes,
      })),
      stockHoldingApplies: invoice.stockHoldingApplies,
      stockHoldingStartDate: invoice.stockHoldingStartDate,
      stockHoldingMaxDays: String(invoice.stockHoldingMaxDays ?? ''),
      clientVisible: invoice.clientVisible,
    });
    setView('invoices');
  }

  /**
   * Promote a Job directly to an Invoice (skip the delivery note step). Used
   * when the client is direct-billed: invoice goes out, then dispatch follows.
   * Pre-fills the invoice form with one line item from the job.
   */
  function handleCreateInvoiceFromJob(job: JobCard) {
    const linkedQuote = job.quoteId ? data.quoteEstimates.find((q) => q.id === job.quoteId) : undefined;
    const unitPrice = linkedQuote?.quotedUnitPrice ?? (job.orderValue && job.quantityPlanned ? job.orderValue / job.quantityPlanned : 0);
    setInvoiceEditingId(null);
    setInvoiceForm({
      ...createInitialInvoiceForm(),
      invoiceDate: getToday(),
      clientId: job.clientId,
      jobId: job.id,
      quoteId: job.quoteId || '',
      customerReference: job.customerReference || '',
      lineItems: [
        {
          id: `il-${Date.now().toString(36)}`,
          productId: job.productId,
          productName: job.productName,
          description: job.description || job.sizeSpec || '',
          quantity: String(job.quantityCompleted || job.quantityPlanned || ''),
          quantityUnit: 'units' as const,
          unitPriceExclVat: String(unitPrice || ''),
          vatRatePercent: '15',
        },
      ],
    });
    setInvoiceMessage(`Pre-filled from job ${job.jobNumber}. Confirm pricing and save.`);
    setView('invoices');
  }

  /**
   * Promote a Delivery Note to an Invoice. Pre-fills the invoice with one
   * line item per delivery line (qty + product), and seeds the link via
   * `jobId` so the parent job is referenced.
   */
  function handleCreateInvoiceFromDeliveryNote(note: DeliveryNote) {
    const linkedJob = note.jobId ? data.jobs.find((j) => j.id === note.jobId) : undefined;
    const linkedQuote = linkedJob?.quoteId
      ? data.quoteEstimates.find((q) => q.id === linkedJob.quoteId)
      : undefined;
    const unitPrice = linkedQuote?.quotedUnitPrice ?? 0;
    setInvoiceEditingId(null);
    setInvoiceForm({
      ...createInitialInvoiceForm(),
      invoiceDate: getToday(),
      clientId: note.clientId,
      jobId: note.jobId || '',
      quoteId: linkedJob?.quoteId || '',
      lineItems: note.lineItems.map((line, idx) => ({
        id: `il-${Date.now().toString(36)}-${idx}`,
        productId: '',
        productName: line.productName,
        description: line.description,
        quantity: String(line.quantity || ''),
        quantityUnit: line.quantityUnit,
        unitPriceExclVat: String(unitPrice || ''),
        vatRatePercent: '15',
      })),
    });
    setInvoiceMessage(`Pre-filled from delivery note ${note.deliveryNoteNumber}. Confirm pricing and save.`);
    setView('invoices');
  }

  function editProductionSpec(spec: ProductionSpec) {
    setProductionSpecEditingId(spec.id);
    setProductionSpecForm({
      specDate: spec.specDate,
      status: spec.status,
      clientId: spec.clientId,
      productId: spec.productId,
      jobId: spec.jobId,
      sizeWidthMm: String(spec.sizeWidthMm ?? ''),
      sizeHeightMm: String(spec.sizeHeightMm ?? ''),
      sizeGussetMm: String(spec.sizeGussetMm ?? ''),
      paperGsm: String(spec.paperGsm ?? ''),
      paperType: spec.paperType,
      handleType: spec.handleType,
      finishingNotes: spec.finishingNotes,
      printMethod: spec.printMethod,
      printColours: String(spec.printColours ?? ''),
      pantoneReferences: spec.pantoneReferences,
      artworkReference: spec.artworkReference,
      printPositionNotes: spec.printPositionNotes,
      quantityOrdered: String(spec.quantityOrdered ?? ''),
      quantityUnit: spec.quantityUnit,
      leadTimeDays: String(spec.leadTimeDays ?? ''),
      packingFormat: spec.packingFormat,
      packingNotes: spec.packingNotes,
      approvedBy: spec.approvedBy,
      approvedDate: spec.approvedDate,
      notes: spec.notes,
      clientVisible: spec.clientVisible,
    });
    setView('productionSpecs');
  }

  function exportReports() {
    downloadCsv(
      `jomopak-report-${reportFilters.month || 'custom-range'}.csv`,
      reportProductionRows.map((row) => {
        const linkedClient = reportClientTrackingRows.find((client) => client.clientName === row.customerName);
        return {
          'Job Number': row.jobNumber,
          'Job Date': row.jobDate,
          Customer: row.customerName,
          Product: row.productName,
          Status: row.status,
          'Qty Planned': row.quantityPlanned,
          'Qty Completed': row.quantityCompleted,
          'Production Logs': getProductionLogsForJob(reportJobs.find((job) => job.jobNumber === row.jobNumber)?.id ?? '', data.productionLogs),
          'Paper Used': row.paperUsed,
          'Total Waste': row.totalWaste,
          'Waste %': row.wastePercent,
          'Client Active Jobs': linkedClient?.activeJobs ?? 0,
          'Client Completed Jobs': linkedClient?.completedJobs ?? 0,
          'Client Overdue Jobs': linkedClient?.overdueJobs ?? 0,
          'Last Client Activity': linkedClient?.lastActivityLabel ?? '',
          FSC: row.fscRelated,
        };
      }),
    );
  }

  return (
    <>
    {authLoading ? (
      <div className="login-shell">
        <div className="login-card">
          <p className="muted">Loading access...</p>
        </div>
      </div>
    ) : !session || recoveryMode ? (
      <LoginPage recoveryMode={recoveryMode} onRecoveryComplete={clearRecoveryMode} />
    ) : view === 'visitorKiosk' ? (
      <VisitorKioskPage
        visitors={data.visitorLogEntries}
        staffOptions={staffOptions}
        company={data.appSettings.company}
        onCheckIn={handleKioskCheckIn}
        onSignOut={handleKioskSignOut}
        onExitKiosk={() => setView('dashboard')}
      />
    ) : (
    <AppLayout
      view={view}
      onViewChange={setView}
      navItems={navItems}
      profile={profile}
      onSignOut={handleSignOut}
      onChangePassword={handleChangePassword}
      topbarAction={topbarAction}
      topbarSummary={topbarSummary}
      onOpenSearch={() => setPaletteOpen(true)}
    >
      {loading && (
        <div className="card">
          <p className="muted">Loading shared JomoPak data from Supabase...</p>
        </div>
      )}

      {!loading && (
        <>
      {view === 'dashboard' && (
        <DashboardPage
          dashboardMonth={dashboardMonth}
          setDashboardMonth={setDashboardMonth}
          monthOptions={monthOptions}
          jobs={data.jobs}
          clients={data.clients}
          finishedGoodsStock={data.finishedGoodsStock}
          spareParts={data.spareParts}
          materialReceipts={data.materialReceipts}
          productionLogs={data.productionLogs}
          wasteEntries={data.wasteEntries}
          paperLogs={data.paperLogs}
          dispatchRecords={data.dispatchRecords}
          dashboardJobs={dashboardJobs}
          dashboardMaterials={dashboardMaterials}
          dashboardProductionLogs={dashboardProductionLogs}
          dashboardWaste={dashboardWaste}
          dashboardPaper={dashboardPaper}
          dashboardDispatch={dashboardDispatch}
          dashboardFinishedStock={dashboardFinishedStock}
          dashboardWasteByReason={dashboardWasteByReason}
          dashboardTopPaper={dashboardTopPaper}
          visibleWidgets={profile?.dashboardWidgets ?? []}
          leads={data.leads}
          onOpenLead={(id) => {
            const lead = data.leads.find((l) => l.id === id);
            if (lead) {
              editLead(lead);
            }
          }}
        />
      )}

      {view === 'salesDesk' && (
        <SalesDeskPage
          profile={profile}
          monthOptions={monthOptions}
          quotes={filteredQuoteEstimates}
          jobs={filteredJobs}
          onOpenQuote={editQuote}
          onOpenJob={editJob}
          onOpenQuotesRegister={() => setView('quotes')}
          onOpenJobsRegister={() => setView('jobs')}
        />
      )}

      {view === 'leads' && (
        <LeadsPage
          monthOptions={monthOptions}
          clients={data.clients}
          products={data.products}
          quotes={data.quoteEstimates}
          leadForm={leadForm}
          setLeadForm={setLeadForm}
          leadEditingId={leadEditingId}
          leadMessage={leadMessage}
          onSave={handleSaveLead}
          onReset={resetLeadEditor}
          leadFilters={leadFilters}
          setLeadFilters={setLeadFilters}
          filteredLeads={filteredLeads}
          onEdit={editLead}
          onQuickAdd={handleQuickAddLead}
          onBulkReassign={handleBulkReassignLeads}
        />
      )}

      {view === 'calculator' && (
        <CalculatorPage
          canViewInternalCosts={canViewInternalCalculatorCosts}
          clients={data.clients}
          products={data.products}
          pricingTiers={data.pricingTiers}
          paperRates={data.paperRates}
          costProfiles={data.costProfiles}
          leads={data.leads}
          state={calculatorState}
          setState={setCalculatorState}
          onSaveAsQuote={handleSaveCalculatorAsQuote}
          company={data.appSettings.company}
          defaultFooterLines={data.appSettings.templates.invoiceFooterLines}
          preparedByName={profile?.fullName || profile?.email || ''}
          today={getToday()}
        />
      )}

      {view === 'workTicket' && (
        <WorkTicketPage
          monthOptions={monthOptions}
          clients={data.clients}
          products={data.products}
          pricingTiers={data.pricingTiers}
          paperRates={data.paperRates}
          inkRates={data.inkRates}
          finishingOperations={data.finishingOperations}
          pressRates={data.pressRates}
          plateCosts={data.plateCosts}
          machines={data.machines}
          workTickets={data.workTickets}
          workTicketForm={workTicketForm}
          setWorkTicketForm={setWorkTicketForm}
          workTicketEditingId={workTicketEditingId}
          workTicketMessage={workTicketMessage}
          onSave={handleSaveWorkTicket}
          onReset={resetWorkTicketEditor}
          onPrint={(ticket) => setWorkTicketPrintTarget(ticket)}
          workTicketFilters={workTicketFilters}
          setWorkTicketFilters={setWorkTicketFilters}
          filteredWorkTickets={filteredWorkTickets}
          onEdit={editWorkTicket}
        />
      )}

      {view === 'costMasters' && canManageCostInputs && (
        <CostMastersPage
          inkRates={data.inkRates}
          finishingOperations={data.finishingOperations}
          pressRates={data.pressRates}
          plateCosts={data.plateCosts}
          suppliers={data.suppliers}
          machines={data.machines}
          inkRateForm={inkRateForm}
          setInkRateForm={setInkRateForm}
          inkRateEditingId={inkRateEditingId}
          inkRateMessage={inkRateMessage}
          onSaveInkRate={handleSaveInkRate}
          onResetInkRate={resetInkRateEditor}
          onEditInkRate={editInkRate}
          onDeleteInkRate={handleDeleteInkRate}
          finishingForm={finishingForm}
          setFinishingForm={setFinishingForm}
          finishingEditingId={finishingEditingId}
          finishingMessage={finishingMessage}
          onSaveFinishing={handleSaveFinishingOp}
          onResetFinishing={resetFinishingEditor}
          onEditFinishing={editFinishingOp}
          onDeleteFinishing={handleDeleteFinishingOp}
          pressRateForm={pressRateForm}
          setPressRateForm={setPressRateForm}
          pressRateEditingId={pressRateEditingId}
          pressRateMessage={pressRateMessage}
          onSavePressRate={handleSavePressRate}
          onResetPressRate={resetPressRateEditor}
          onEditPressRate={editPressRate}
          onDeletePressRate={handleDeletePressRate}
          plateCostForm={plateCostForm}
          setPlateCostForm={setPlateCostForm}
          plateCostEditingId={plateCostEditingId}
          plateCostMessage={plateCostMessage}
          onSavePlateCost={handleSavePlateCost}
          onResetPlateCost={resetPlateCostEditor}
          onEditPlateCost={editPlateCost}
          onDeletePlateCost={handleDeletePlateCost}
        />
      )}

      {view === 'costInputs' && canManageCostInputs && (
        <CostInputsPage
          suppliers={data.suppliers}
          paperRates={data.paperRates}
          costProfiles={data.costProfiles}
          paperRateForm={paperRateForm}
          setPaperRateForm={setPaperRateForm}
          paperRateEditingId={paperRateEditingId}
          paperRateMessage={paperRateMessage}
          onSavePaperRate={handleSavePaperRate}
          onResetPaperRate={resetPaperRateEditor}
          paperRateFilters={paperRateFilters}
          setPaperRateFilters={setPaperRateFilters}
          filteredPaperRates={filteredPaperRates}
          onEditPaperRate={editPaperRate}
          costProfileForm={costProfileForm}
          setCostProfileForm={setCostProfileForm}
          costProfileEditingId={costProfileEditingId}
          costProfileMessage={costProfileMessage}
          onSaveCostProfile={handleSaveCostProfile}
          onResetCostProfile={resetCostProfileEditor}
          costProfileFilters={costProfileFilters}
          setCostProfileFilters={setCostProfileFilters}
          filteredCostProfiles={filteredCostProfiles}
          onEditCostProfile={editCostProfile}
        />
      )}

      {view === 'permissions' && allowedViews.has('permissions') && (
        <PermissionsPage
          profiles={profiles}
          loading={profilesLoading}
          onSave={saveProfile}
          onCreateUser={createUser}
          staffOptions={staffOptions}
          clients={data.clients}
          leads={data.leads}
          jobs={data.jobs}
          employees={data.employees}
          onHandover={handleHandoverOwner}
        />
      )}

      {view === 'settings' && allowedViews.has('settings') && (
        <SettingsPage
          settings={data.appSettings}
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          onSave={handleSaveSettings}
          onReset={resetSettingsEditor}
          saveMessage={settingsMessage}
          accountName={profile?.fullName || profile?.email || 'Signed in'}
          accountEmail={profile?.email || 'No email stored'}
          accountRole={profile?.role || 'ops'}
          onSignOut={handleSignOut}
        />
      )}

      {view === 'suppliers' && (
        <SuppliersPage
          clients={data.clients}
          products={data.products}
          supplierForm={supplierForm}
          setSupplierForm={setSupplierForm}
          supplierEditingId={supplierEditingId}
          supplierMessage={supplierMessage}
          supplierSaveCount={supplierSaveCount}
          onSave={handleSaveSupplier}
          onDelete={handleDeleteSupplier}
          onReset={resetSupplierEditor}
          supplierFilters={supplierFilters}
          setSupplierFilters={setSupplierFilters}
          filteredSuppliers={filteredSuppliers}
          onEdit={editSupplier}
        />
      )}

      {view === 'machines' && (
        <MachinesPage
          machineForm={machineForm}
          setMachineForm={setMachineForm}
          machineEditingId={machineEditingId}
          machineMessage={machineMessage}
          onSave={handleSaveMachine}
          onReset={resetMachineEditor}
          machineFilters={machineFilters}
          setMachineFilters={setMachineFilters}
          filteredMachines={filteredMachines}
          onEdit={editMachine}
        />
      )}

      {view === 'quotes' && (
        <QuotesPage
          monthOptions={monthOptions}
          clients={data.clients}
          leads={data.leads}
          products={data.products}
          pricingTiers={data.pricingTiers}
          paperRates={data.paperRates}
          costProfiles={data.costProfiles}
          quoteForm={quoteForm}
          setQuoteForm={setQuoteForm}
          quoteEditingId={quoteEditingId}
          quoteMessage={quoteMessage}
          onSave={handleSaveQuote}
          onReset={resetQuoteEditor}
          quoteFilters={quoteFilters}
          setQuoteFilters={setQuoteFilters}
          filteredQuotes={filteredQuoteEstimates}
          onEdit={editQuote}
          onConvertToJob={handleConvertQuoteToJob}
          onPrint={(quote) => setQuotePrintTarget(quote)}
        />
      )}

      {view === 'artwork' && (
        <ArtworkPage
          jobs={data.jobs}
          artworkForm={artworkForm}
          setArtworkForm={setArtworkForm}
          artworkEditingId={artworkEditingId}
          artworkMessage={artworkMessage}
          onSave={handleSaveArtwork}
          onReset={resetArtworkEditor}
          artworkFilters={artworkFilters}
          setArtworkFilters={setArtworkFilters}
          filteredArtworkRecords={filteredArtworkRecords}
          onEdit={editArtwork}
        />
      )}

      {view === 'customerStock' && (
        <CustomerStockPage
          monthOptions={monthOptions}
          clients={data.clients}
          finishedGoodsStock={data.finishedGoodsStock}
          jobs={data.jobs}
          releaseForm={customerStockReleaseForm}
          setReleaseForm={setCustomerStockReleaseForm}
          releaseEditingId={customerStockReleaseEditingId}
          releaseMessage={customerStockReleaseMessage}
          onSave={handleSaveCustomerStockRelease}
          onReset={resetCustomerStockReleaseEditor}
          releaseFilters={customerStockReleaseFilters}
          setReleaseFilters={setCustomerStockReleaseFilters}
          filteredReleases={filteredCustomerStockReleases}
          onEdit={editCustomerStockRelease}
        />
      )}

      {view === 'deliveryNotes' && (
        <DeliveryNotesPage
          monthOptions={monthOptions}
          clients={data.clients}
          jobs={data.jobs}
          dispatchRecords={data.dispatchRecords}
          customerStockReleases={data.customerStockReleases}
          invoices={data.invoices}
          allDeliveryNotes={data.deliveryNotes}
          deliveryNoteForm={deliveryNoteForm}
          setDeliveryNoteForm={setDeliveryNoteForm}
          deliveryNoteEditingId={deliveryNoteEditingId}
          deliveryNoteMessage={deliveryNoteMessage}
          onSave={handleSaveDeliveryNote}
          onReset={resetDeliveryNoteEditor}
          onAddDispatchLine={addDispatchLineToDeliveryNote}
          onAddReleaseLine={addReleaseLineToDeliveryNote}
          onRemoveLineItem={removeDeliveryLineItem}
          deliveryNoteFilters={deliveryNoteFilters}
          setDeliveryNoteFilters={setDeliveryNoteFilters}
          filteredDeliveryNotes={filteredDeliveryNotes}
          onEdit={editDeliveryNote}
          onCreateInvoice={handleCreateInvoiceFromDeliveryNote}
          onPrint={(note) => setDeliveryNotePrintTarget(note)}
        />
      )}

      {view === 'invoices' && (
        <InvoicesPage
          monthOptions={monthOptions}
          clients={data.clients}
          jobs={data.jobs}
          quotes={data.quoteEstimates}
          productionSpecs={data.productionSpecs}
          products={data.products}
          deliveryNotes={data.deliveryNotes}
          settings={data.appSettings}
          invoiceForm={invoiceForm}
          setInvoiceForm={setInvoiceForm}
          invoiceEditingId={invoiceEditingId}
          invoiceMessage={invoiceMessage}
          onSave={handleSaveInvoice}
          onReset={resetInvoiceEditor}
          invoiceFilters={invoiceFilters}
          setInvoiceFilters={setInvoiceFilters}
          filteredInvoices={filteredInvoices}
          onEdit={editInvoice}
          currentUser={{ id: profile?.id, name: profile?.fullName || profile?.email }}
        />
      )}

      {view === 'productionSpecs' && (
        <ProductionSpecsPage
          clients={data.clients}
          products={data.products}
          jobs={data.jobs}
          settings={data.appSettings}
          productionSpecForm={productionSpecForm}
          setProductionSpecForm={setProductionSpecForm}
          productionSpecEditingId={productionSpecEditingId}
          productionSpecMessage={productionSpecMessage}
          onSave={handleSaveProductionSpec}
          onReset={resetProductionSpecEditor}
          productionSpecFilters={productionSpecFilters}
          setProductionSpecFilters={setProductionSpecFilters}
          filteredProductionSpecs={filteredProductionSpecs}
          onEdit={editProductionSpec}
        />
      )}

      {view === 'jobs' && (
        <JobCardsPage
          monthOptions={monthOptions}
          clients={data.clients}
          products={data.products}
          pricingTiers={data.pricingTiers}
          finishedGoodsStock={data.finishedGoodsStock}
          jobForm={jobForm}
          setJobForm={setJobForm}
          jobEditingId={jobEditingId}
          jobMessage={jobMessage}
          jobSaveCount={jobSaveCount}
          onSave={handleSaveJob}
          onReset={resetJobEditor}
          jobFilters={jobFilters}
          setJobFilters={setJobFilters}
          filteredJobs={filteredJobs}
          allJobs={data.jobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          selectedJobMaterials={selectedJobMaterials}
          selectedJobProductionLogs={selectedJobProductionLogs}
          selectedJobWasteEntries={selectedJobWasteEntries}
          selectedJobPaperLogs={selectedJobPaperLogs}
          selectedJobDispatchRecords={selectedJobDispatchRecords}
          onEdit={editJob}
          onDuplicate={duplicateJob}
          onQuickAddProduction={quickAddProduction}
          onQuickAddWaste={quickAddWaste}
          onQuickAddPaper={quickAddPaper}
          onQuickAddDispatch={quickAddDispatch}
          onOpenHistory={openHistory}
          userId={profile?.id || 'default'}
          onCreateDelivery={handleCreateDeliveryFromJob}
          onCreateInvoice={handleCreateInvoiceFromJob}
          foodSafeMaterials={data.foodSafeMaterials}
          machines={data.machines}
          cleaningLogs={data.cleaningLogs}
          onPrintFoodSafeCertificate={(job) => setFoodSafeCertificateJob(job)}
          onPrintJobCard={(job) => setJobCardPrintTarget(job)}
          onMarkComplete={handleMarkJobComplete}
          currentUser={{ id: profile?.id, name: profile?.fullName || profile?.email }}
        />
      )}

      {view === 'products' && (
        <ProductsPage
          suppliers={data.suppliers}
          canSeeSupplier={profile?.role === 'admin' || profile?.role === 'ops'}
          paperRates={data.paperRates}
          costProfiles={data.costProfiles}
          pricingTiers={data.pricingTiers}
          productForm={productForm}
          setProductForm={setProductForm}
          productEditingId={productEditingId}
          productMessage={productMessage}
          onSave={handleSaveProduct}
          onReset={resetProductEditor}
          productFilters={productFilters}
          setProductFilters={setProductFilters}
          filteredProducts={filteredProducts}
          onEdit={editProduct}
          onDelete={handleDeleteCurrentProduct}
        />
      )}

      {view === 'priceList' && (
        <PriceListPage
          products={data.products}
          paperRates={data.paperRates}
          costProfiles={data.costProfiles}
          pricingTiers={data.pricingTiers}
          clients={data.clients}
          productPriceVersions={data.productPriceVersions}
          clientProductPrices={data.clientProductPrices}
          canApprove={profile?.role === 'admin' || profile?.role === 'accounts'}
          onApproveProduct={handleApproveProductPrice}
          onAddClientPrice={handleAddClientPrice}
          onDeleteClientPrice={handleDeleteClientPrice}
        />
      )}

      {view === 'clients' && (
        <ClientsPage
          staffOptions={staffOptions}
          pricingTiers={data.pricingTiers}
          invoices={data.invoices}
          deliveryNotes={data.deliveryNotes}
          dispatchRecords={data.dispatchRecords}
          clientForm={clientForm}
          setClientForm={setClientForm}
          clientEditingId={clientEditingId}
          clientMessage={clientMessage}
          onSave={handleSaveClient}
          onReset={resetClientEditor}
          clientFilters={clientFilters}
          setClientFilters={setClientFilters}
          filteredClients={filteredClients}
          onEdit={editClient}
          currentUser={{ id: profile?.id, name: profile?.fullName || profile?.email }}
        />
      )}

      {view === 'pricing' && (
        <PricingTiersPage
          tierForm={tierForm}
          setTierForm={setTierForm}
          tierEditingId={tierEditingId}
          tierMessage={tierMessage}
          onSave={handleSaveTier}
          onReset={resetTierEditor}
          tierFilters={tierFilters}
          setTierFilters={setTierFilters}
          filteredPricingTiers={filteredPricingTiers}
          onEdit={editTier}
        />
      )}

      {view === 'finishedStock' && (
        <FinishedGoodsStockPage
          products={data.products}
          clients={data.clients}
          jobs={data.jobs}
          stockForm={stockForm}
          setStockForm={setStockForm}
          stockEditingId={stockEditingId}
          stockMessage={stockMessage}
          onSave={handleSaveFinishedStock}
          onReset={resetStockEditor}
          stockFilters={stockFilters}
          setStockFilters={setStockFilters}
          filteredStock={filteredFinishedStock}
          stockChangeLogs={data.stockChangeLogs}
          onEdit={editFinishedStock}
          onDelete={handleDeleteCurrentFinishedStock}
          onFoodSafetyHoldChange={handleFoodSafetyHoldChange}
          canReleaseFoodSafetyBatches={canUserReleaseFoodSafetyBatch(profile?.role ?? 'production')}
        />
      )}

      {view === 'spares' && (
        <SparePartsPage
          machines={data.machines}
          suppliers={data.suppliers}
          jobs={data.jobs}
          spareForm={spareForm}
          setSpareForm={setSpareForm}
          spareEditingId={spareEditingId}
          spareMessage={spareMessage}
          onSave={handleSaveSparePart}
          onReset={resetSpareEditor}
          spareFilters={spareFilters}
          setSpareFilters={setSpareFilters}
          filteredSpares={filteredSpareParts}
          onEdit={editSparePart}
          stockIssues={data.stockIssues}
          filteredStockIssues={filteredStockIssues}
          stockIssueForm={stockIssueForm}
          setStockIssueForm={setStockIssueForm}
          stockIssueMessage={stockIssueMessage}
          stockIssueFilters={stockIssueFilters}
          setStockIssueFilters={setStockIssueFilters}
          onStartIssue={startStockIssue}
          onSaveStockIssue={handleSaveStockIssue}
          onCancelStockIssue={resetStockIssueForm}
          onReturnTool={handleReturnTool}
          stockCounts={data.stockCounts}
          stockCountForm={stockCountForm}
          setStockCountForm={setStockCountForm}
          stockCountMessage={stockCountMessage}
          onSaveStockCount={handleSaveStockCount}
          onCancelStockCount={resetStockCountForm}
          onReconcileStockCount={handleReconcileStockCount}
          isAdmin={profile?.role === 'admin'}
        />
      )}

      {view === 'materials' && (
        <MaterialsReceivingPage
          jobs={filteredJobs}
          suppliers={data.suppliers}
          monthOptions={monthOptions}
          materialForm={materialForm}
          setMaterialForm={setMaterialForm}
          materialEditingId={materialEditingId}
          materialMessage={materialMessage}
          onSave={handleSaveMaterial}
          onReset={resetMaterialEditor}
          materialFilters={materialFilters}
          setMaterialFilters={setMaterialFilters}
          filteredMaterialReceipts={filteredMaterialReceipts}
          materialOrderRequests={data.materialOrderRequests}
          inventoryScanForm={inventoryScanForm}
          setInventoryScanForm={setInventoryScanForm}
          inventoryScanMessage={inventoryScanMessage}
          inventoryScannedItem={scannedInventoryMatch}
          inventoryMovements={data.inventoryMovements}
          onInventoryScanAction={handleInventoryScanAction}
          onEdit={editMaterial}
        />
      )}

      {view === 'chemicalRegister' && (
        <ChemicalRegisterPage
          entries={data.chemicalRegisterEntries}
          suppliers={data.suppliers}
          filters={chemicalFilters}
          setFilters={setChemicalFilters}
          form={chemicalForm}
          setForm={setChemicalForm}
          editingId={chemicalEditingId}
          message={chemicalMessage}
          onSave={handleSaveChemical}
          onReset={resetChemicalEditor}
          onEdit={editChemical}
          onArchiveToggle={handleArchiveChemicalToggle}
        />
      )}

      {view === 'foodSafeMaterials' && (
        <FoodSafeMaterialsPage
          materials={data.foodSafeMaterials}
          suppliers={data.suppliers}
          filters={foodSafeMaterialFilters}
          setFilters={setFoodSafeMaterialFilters}
          form={foodSafeMaterialForm}
          setForm={setFoodSafeMaterialForm}
          editingId={foodSafeMaterialEditingId}
          message={foodSafeMaterialMessage}
          onSave={handleSaveFoodSafeMaterial}
          onReset={resetFoodSafeMaterialEditor}
          onEdit={editFoodSafeMaterial}
          onStatusChange={handleFoodSafeMaterialStatusChange}
        />
      )}

      {view === 'agedDebtors' && (
        <AgedDebtorsPage
          invoices={data.invoices}
          clients={data.clients}
          onOpenInvoice={(id) => {
            const invoice = data.invoices.find((inv) => inv.id === id);
            if (invoice) {
              editInvoice(invoice);
            }
          }}
        />
      )}

      {view === 'productionSchedule' && (
        <ProductionSchedulePage
          jobs={data.jobs}
          machines={data.machines}
          onReschedule={handleRescheduleJob}
          onOpenJob={(id) => {
            const job = data.jobs.find((j) => j.id === id);
            if (job) editJob(job);
          }}
        />
      )}

      {view === 'materialRequirements' && (
        <MaterialRequirementsPage
          jobs={data.jobs}
          materialReceipts={data.materialReceipts}
        />
      )}

      {view === 'cashFlow' && (
        <CashFlowPage
          invoices={data.invoices}
          jobs={data.jobs}
        />
      )}

      {view === 'morningDigest' && (
        <MorningDigestPage data={data} company={data.appSettings.company} />
      )}

      {view === 'leadAnalytics' && (
        <LeadAnalyticsPage leads={data.leads} />
      )}

      {view === 'reorderReminders' && (
        <ReorderRemindersPage
          finishedGoodsStock={data.finishedGoodsStock}
          customerStockReleases={data.customerStockReleases}
          clients={data.clients}
          products={data.products}
          onNavigate={(v) => setView(v)}
        />
      )}

      {view === 'driverPod' && (
        <DriverPodPage
          dispatches={data.dispatchRecords}
          proofOfDeliveries={data.proofOfDeliveries}
          clients={data.clients}
          profile={profile}
          onPodCaptured={(pod: ProofOfDelivery) => {
            setData((current) => ({
              ...current,
              proofOfDeliveries: [pod, ...current.proofOfDeliveries.filter((p) => p.id !== pod.id)],
            }));
            // Best-effort: try to sync immediately. If offline, the queue
            // listener will pick it up when the device reconnects.
            void flushPodQueue().then(({ synced, failed }) => {
              if (synced.length === 0 && failed.length === 0) return;
              setData((current) => {
                const byId = new Map(current.proofOfDeliveries.map((p) => [p.id, p]));
                for (const p of [...synced, ...failed]) byId.set(p.id, p);
                return { ...current, proofOfDeliveries: Array.from(byId.values()) };
              });
            });
          }}
        />
      )}

      {view === 'documentVault' && (
        <DocumentVaultPage
          documents={data.documents}
          suppliers={data.suppliers}
          clients={data.clients}
          invoices={data.invoices}
          jobs={data.jobs}
          quoteEstimates={data.quoteEstimates}
          deliveryNotes={data.deliveryNotes}
          uploaderName={profile?.fullName || profile?.email || ''}
          currentUserRole={profile?.role || 'ops'}
          onUploadFile={(file, docId) => uploadDocumentFile(file, docId)}
          onSave={(doc: DocumentRecord) => {
            setData((current) => {
              const exists = current.documents.some((d) => d.id === doc.id);
              return {
                ...current,
                documents: exists
                  ? current.documents.map((d) => (d.id === doc.id ? doc : d))
                  : [doc, ...current.documents],
              };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({
              ...current,
              documents: current.documents.filter((d) => d.id !== id),
            }));
          }}
        />
      )}

      {view === 'shipments' && (
        <ShipmentsPage
          shipments={data.shipments}
          suppliers={data.suppliers}
          onSave={(shipment: Shipment) => {
            setData((current) => {
              if (shipment.id) {
                return { ...current, shipments: current.shipments.map((s) => (s.id === shipment.id ? shipment : s)) };
              }
              const num = generateCode('SHP', current.shipments.map((s) => s.shipmentNumber), shipment.orderDate || getToday());
              const created: Shipment = { ...shipment, id: num, shipmentNumber: num, createdAt: new Date().toISOString() };
              return { ...current, shipments: [created, ...current.shipments] };
            });
          }}
          onReceiveIntoStock={(shipment: Shipment) => {
            setData((current) => {
              const today = getToday();
              const newReceipts: MaterialReceiptType[] = [];
              shipment.lineItems.forEach((line) => {
                const num = generateCode(
                  'RCV',
                  [...current.materialReceipts.map((r) => r.receiptNumber), ...newReceipts.map((r) => r.receiptNumber)],
                  today,
                );
                newReceipts.push({
                  id: num,
                  receiptNumber: num,
                  barcode: '',
                  createdAt: new Date().toISOString(),
                  receivedDate: shipment.actualArrivalDate || today,
                  supplierId: shipment.supplierId,
                  supplierName: shipment.supplierName,
                  supplierBatchNumber: shipment.reference || '',
                  internalRollCode: '',
                  materialKind: line.materialKind,
                  itemName: line.description,
                  paperType: line.materialKind === 'Paper' ? line.description : '',
                  gsm: '',
                  width: '',
                  quantityReceived: Number(line.quantity) || 0,
                  quantityAvailable: Number(line.quantity) || 0,
                  quantityUnit: (line.unit || 'units') as MaterialReceiptType['quantityUnit'],
                  fscClaimType: 'None',
                  supplierCertificateCode: '',
                  invoiceReference: shipment.shipmentNumber,
                  storageLocation: '',
                  inspectionNotes: `Received from shipment ${shipment.shipmentNumber}`,
                  fscRelated: false,
                });
              });
              // Raise an Accounts Payable bill for the goods value owed to the
              // supplier — unless one already exists for this shipment.
              const alreadyBilled = current.supplierBills.some((b) => b.sourceShipmentId === shipment.id);
              let supplierBills = current.supplierBills;
              if (!alreadyBilled && (Number(shipment.goodsValue) || 0) > 0) {
                const billNum = generateCode('BILL', current.supplierBills.map((b) => b.billNumber), today);
                const goods = Number(shipment.goodsValue) || 0;
                const newBill: SupplierBill = {
                  id: billNum,
                  billNumber: billNum,
                  supplierInvoiceNumber: shipment.reference || '',
                  createdAt: new Date().toISOString(),
                  billDate: shipment.actualArrivalDate || today,
                  dueDate: '',
                  supplierId: shipment.supplierId || '',
                  supplierName: shipment.supplierName || '',
                  expenseAccountId: '',
                  expenseAccountName: '',
                  currency: shipment.currency || 'USD',
                  subtotalExclVat: goods,
                  vatAmount: 0,
                  totalInclVat: goods,
                  payments: [],
                  amountPaid: 0,
                  amountOutstanding: goods,
                  status: 'Unpaid',
                  sourceShipmentId: shipment.id,
                  sourceInboxId: '',
                  notes: `Goods value from shipment ${shipment.shipmentNumber}. Freight/duty/clearing billed separately.`,
                };
                supplierBills = [newBill, ...current.supplierBills];
              }
              return {
                ...current,
                materialReceipts: [...newReceipts, ...current.materialReceipts],
                supplierBills,
                shipments: current.shipments.map((s) =>
                  s.id === shipment.id ? { ...s, receivedIntoStock: true, status: 'Received' } : s,
                ),
              };
            });
          }}
        />
      )}

      {view === 'chartOfAccounts' && (
        <ChartOfAccountsPage
          ledgerAccounts={data.ledgerAccounts}
          onSave={(account: LedgerAccount) => {
            setData((current) => {
              if (account.id) {
                const exists = current.ledgerAccounts.some((a) => a.id === account.id);
                return {
                  ...current,
                  ledgerAccounts: exists
                    ? current.ledgerAccounts.map((a) => (a.id === account.id ? account : a))
                    : [...current.ledgerAccounts, account],
                };
              }
              const created: LedgerAccount = { ...account, id: `acct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
              return { ...current, ledgerAccounts: [...current.ledgerAccounts, created] };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, ledgerAccounts: current.ledgerAccounts.filter((a) => a.id !== id) }));
          }}
        />
      )}

      {view === 'accountsPayable' && (
        <AccountsPayablePage
          supplierBills={data.supplierBills}
          suppliers={data.suppliers}
          ledgerAccounts={data.ledgerAccounts}
          onSave={(bill: SupplierBill) => {
            setData((current) => {
              if (bill.id) {
                return { ...current, supplierBills: current.supplierBills.map((b) => (b.id === bill.id ? bill : b)) };
              }
              const num = generateCode('BILL', current.supplierBills.map((b) => b.billNumber), bill.billDate || getToday());
              const created: SupplierBill = { ...bill, id: num, billNumber: num, createdAt: new Date().toISOString(), exchangeRate: getRate(bill.currency, current.appSettings.currencyConfig) };
              return { ...current, supplierBills: [created, ...current.supplierBills] };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, supplierBills: current.supplierBills.filter((b) => b.id !== id) }));
          }}
        />
      )}

      {view === 'sarsCentre' && (
        <SarsCentrePage
          sarsFilings={data.sarsFilings}
          sarsConfig={data.appSettings.sarsConfig}
          invoices={data.invoices}
          supplierBills={data.supplierBills}
          payrollRuns={data.payrollRuns}
          documents={data.documents}
          today={getToday()}
          onSaveFiling={(filing: SarsFiling) => {
            setData((current) => {
              const id = filing.id || `sars-${filing.periodKey}`;
              const createdAt = filing.createdAt || new Date().toISOString();
              const next: SarsFiling = { ...filing, id, createdAt };
              const exists = current.sarsFilings.some((f) => f.id === id || f.periodKey === filing.periodKey);
              return {
                ...current,
                sarsFilings: exists
                  ? current.sarsFilings.map((f) => (f.id === id || f.periodKey === filing.periodKey ? next : f))
                  : [next, ...current.sarsFilings],
              };
            });
          }}
          onSaveConfig={(config: AppSettingsSarsConfig) => {
            setData((current) => ({
              ...current,
              appSettings: {
                ...current.appSettings,
                sarsConfig: config,
                updatedAt: new Date().toISOString(),
                updatedBy: profile?.fullName || profile?.email || current.appSettings.updatedBy,
              },
            }));
          }}
        />
      )}

      {view === 'financeSummary' && (
        <FinanceSummaryPage
          invoices={data.invoices}
          supplierBills={data.supplierBills}
          ledgerAccounts={data.ledgerAccounts}
          sarsConfig={data.appSettings.sarsConfig}
          today={getToday()}
        />
      )}

      {view === 'customerStatements' && (
        <CustomerStatementsPage
          invoices={data.invoices}
          clients={data.clients}
          company={data.appSettings.company}
          today={getToday()}
        />
      )}

      {view === 'employees' && (
        <EmployeesPage
          employees={data.employees}
          onSave={(employee: Employee) => {
            setData((current) => {
              if (employee.id) {
                return { ...current, employees: current.employees.map((e) => (e.id === employee.id ? employee : e)) };
              }
              const seq = current.employees.length + 1;
              const created: Employee = {
                ...employee,
                id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                employeeNumber: employee.employeeNumber || `EMP-${String(seq).padStart(3, '0')}`,
              };
              return { ...current, employees: [...current.employees, created] };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, employees: current.employees.filter((e) => e.id !== id) }));
          }}
        />
      )}

      {view === 'payroll' && (
        <PayrollPage
          payrollRuns={data.payrollRuns}
          employees={data.employees}
          company={data.appSettings.company}
          onSave={(run: PayrollRun) => {
            setData((current) => {
              if (run.id) {
                return { ...current, payrollRuns: current.payrollRuns.map((r) => (r.id === run.id ? run : r)) };
              }
              const num = `PAY-${run.periodYear}${String(run.periodMonth).padStart(2, '0')}`;
              const created: PayrollRun = { ...run, id: num, runNumber: num, createdAt: new Date().toISOString() };
              return { ...current, payrollRuns: [created, ...current.payrollRuns] };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, payrollRuns: current.payrollRuns.filter((r) => r.id !== id) }));
          }}
        />
      )}

      {view === 'bankRec' && (
        <BankReconciliationPage
          bankTransactions={data.bankTransactions}
          invoices={data.invoices}
          supplierBills={data.supplierBills}
          payrollRuns={data.payrollRuns}
          ledgerAccounts={data.ledgerAccounts}
          onImport={(transactions: BankTransaction[]) => {
            setData((current) => ({ ...current, bankTransactions: [...transactions, ...current.bankTransactions] }));
          }}
          onUpdate={(transaction: BankTransaction) => {
            setData((current) => {
              const bankTransactions = current.bankTransactions.map((t) => (t.id === transaction.id ? transaction : t));
              const payId = `bankpay-${transaction.id}`;
              const payDate = transaction.date || getToday();
              const reference = transaction.reference || `Bank ${transaction.date}`;
              const amount = Math.abs(Number(transaction.amount) || 0);
              // Reverse any prior auto-payment from this txn across invoices + bills.
              let invoices = current.invoices.map((inv) =>
                inv.payments.some((p) => p.id === payId)
                  ? recomputeInvoiceFromPayments({ ...inv, payments: inv.payments.filter((p) => p.id !== payId) })
                  : inv,
              );
              let supplierBills = current.supplierBills.map((b) =>
                b.payments.some((p) => p.id === payId)
                  ? recomputeBillFromPayments({ ...b, payments: b.payments.filter((p) => p.id !== payId) })
                  : b,
              );
              // Re-apply when reconciled + matched to an invoice or bill.
              if (transaction.reconciled && transaction.matchId && amount > 0) {
                if (transaction.matchType === 'invoice') {
                  invoices = invoices.map((inv) =>
                    inv.id === transaction.matchId
                      ? recomputeInvoiceFromPayments({ ...inv, payments: [...inv.payments, { id: payId, paymentDate: payDate, amount, method: 'EFT', reference, notes: 'Auto from bank reconciliation' }] })
                      : inv,
                  );
                } else if (transaction.matchType === 'bill') {
                  supplierBills = supplierBills.map((b) =>
                    b.id === transaction.matchId
                      ? recomputeBillFromPayments({ ...b, payments: [...b.payments, { id: payId, paymentDate: payDate, amount, method: 'EFT', reference, notes: 'Auto from bank reconciliation' }] })
                      : b,
                  );
                }
              }
              return { ...current, bankTransactions, invoices, supplierBills };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, bankTransactions: current.bankTransactions.filter((t) => t.id !== id) }));
          }}
        />
      )}

      {view === 'generalLedger' && (
        <GeneralLedgerPage
          journalEntries={data.journalEntries}
          ledgerAccounts={data.ledgerAccounts}
          invoices={data.invoices}
          supplierBills={data.supplierBills}
          today={getToday()}
          onSave={(entry: JournalEntry) => {
            setData((current) => {
              if (entry.id) {
                const exists = current.journalEntries.some((j) => j.id === entry.id);
                return {
                  ...current,
                  journalEntries: exists
                    ? current.journalEntries.map((j) => (j.id === entry.id ? entry : j))
                    : [entry, ...current.journalEntries],
                };
              }
              const num = generateCode('JNL', current.journalEntries.map((j) => j.entryNumber), entry.date || getToday());
              const created: JournalEntry = { ...entry, id: num, entryNumber: num, createdAt: new Date().toISOString() };
              return { ...current, journalEntries: [created, ...current.journalEntries] };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, journalEntries: current.journalEntries.filter((j) => j.id !== id) }));
          }}
          onGenerate={(entries: JournalEntry[]) => {
            setData((current) => {
              const existingNumbers = current.journalEntries.map((j) => j.entryNumber);
              const numbered = entries.map((e) => {
                const num = generateCode('JNL', existingNumbers, e.date || getToday());
                existingNumbers.push(num);
                return { ...e, entryNumber: num };
              });
              return { ...current, journalEntries: [...numbered, ...current.journalEntries] };
            });
          }}
        />
      )}

      {view === 'financialStatements' && (
        <FinancialStatementsPage
          journalEntries={data.journalEntries}
          ledgerAccounts={data.ledgerAccounts}
          sarsConfig={data.appSettings.sarsConfig}
          today={getToday()}
        />
      )}

      {view === 'fixedAssets' && (
        <FixedAssetsPage
          fixedAssets={data.fixedAssets}
          ledgerAccounts={data.ledgerAccounts}
          today={getToday()}
          onSave={(asset: FixedAsset) => {
            setData((current) => {
              if (asset.id) {
                return { ...current, fixedAssets: current.fixedAssets.map((a) => (a.id === asset.id ? asset : a)) };
              }
              const num = generateCode('FA', current.fixedAssets.map((a) => a.assetNumber), asset.acquisitionDate || getToday());
              const created: FixedAsset = {
                ...asset,
                id: num,
                assetNumber: asset.assetNumber || num,
                createdAt: new Date().toISOString(),
              };
              return { ...current, fixedAssets: [...current.fixedAssets, created] };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, fixedAssets: current.fixedAssets.filter((a) => a.id !== id) }));
          }}
          onPostDepreciation={(journal: JournalEntry, postedToDate: string) => {
            setData((current) => {
              const num = generateCode('JNL', current.journalEntries.map((j) => j.entryNumber), journal.date || getToday());
              const created: JournalEntry = { ...journal, id: num, entryNumber: num, createdAt: new Date().toISOString() };
              return {
                ...current,
                journalEntries: [created, ...current.journalEntries],
                fixedAssets: current.fixedAssets.map((a) =>
                  a.status === 'Active' ? { ...a, depreciationPostedToDate: postedToDate } : a,
                ),
              };
            });
          }}
        />
      )}

      {view === 'currencies' && (
        <CurrenciesPage
          currencyConfig={data.appSettings.currencyConfig}
          invoices={data.invoices}
          supplierBills={data.supplierBills}
          ledgerAccounts={data.ledgerAccounts}
          today={getToday()}
          onSaveConfig={(config: AppSettingsCurrencyConfig) => {
            setData((current) => ({
              ...current,
              appSettings: {
                ...current.appSettings,
                currencyConfig: config,
                updatedAt: new Date().toISOString(),
                updatedBy: profile?.fullName || profile?.email || current.appSettings.updatedBy,
              },
            }));
          }}
          onPostRevaluation={(journal: JournalEntry) => {
            setData((current) => {
              const num = generateCode('JNL', current.journalEntries.map((j) => j.entryNumber), journal.date || getToday());
              const created: JournalEntry = { ...journal, id: num, entryNumber: num, createdAt: new Date().toISOString() };
              return { ...current, journalEntries: [created, ...current.journalEntries] };
            });
          }}
          onPostRealisedFx={(result: RealisedFxResult) => {
            if (!result.journal) return;
            setData((current) => {
              const num = generateCode('JNL', current.journalEntries.map((j) => j.entryNumber), result.journal!.date || getToday());
              const created: JournalEntry = { ...result.journal!, id: num, entryNumber: num, createdAt: new Date().toISOString() };
              const invKeys = new Set(result.postedPayments.filter((p) => p.kind === 'invoice').map((p) => `${p.docId}::${p.paymentId}`));
              const billKeys = new Set(result.postedPayments.filter((p) => p.kind === 'bill').map((p) => `${p.docId}::${p.paymentId}`));
              return {
                ...current,
                journalEntries: [created, ...current.journalEntries],
                invoices: current.invoices.map((inv) =>
                  result.postedPayments.some((p) => p.kind === 'invoice' && p.docId === inv.id)
                    ? { ...inv, payments: inv.payments.map((p) => (invKeys.has(`${inv.id}::${p.id}`) ? { ...p, fxPosted: true } : p)) }
                    : inv,
                ),
                supplierBills: current.supplierBills.map((b) =>
                  result.postedPayments.some((p) => p.kind === 'bill' && p.docId === b.id)
                    ? { ...b, payments: b.payments.map((p) => (billKeys.has(`${b.id}::${p.id}`) ? { ...p, fxPosted: true } : p)) }
                    : b,
                ),
              };
            });
          }}
        />
      )}

      {view === 'osConnector' && (
        <OsConnectorPage
          data={data}
          connectorConfig={data.appSettings.connectorConfig}
          today={getToday()}
          onSaveConfig={(config: AppSettingsConnectorConfig) => {
            setData((current) => ({
              ...current,
              appSettings: {
                ...current.appSettings,
                connectorConfig: config,
                updatedAt: new Date().toISOString(),
                updatedBy: profile?.fullName || profile?.email || current.appSettings.updatedBy,
              },
            }));
          }}
          onPublishNow={async () => {
            const stamped: AppData = {
              ...data,
              appSettings: { ...data.appSettings, connectorConfig: { ...data.appSettings.connectorConfig, lastPublishedAt: new Date().toISOString() } },
            };
            await publishConnectorFeed(stamped);
            setData((current) => ({
              ...current,
              appSettings: { ...current.appSettings, connectorConfig: { ...current.appSettings.connectorConfig, lastPublishedAt: stamped.appSettings.connectorConfig.lastPublishedAt } },
            }));
          }}
        />
      )}

      {view === 'maintenance' && (
        <MaintenancePage
          workOrders={data.maintenanceWorkOrders}
          machines={data.machines}
          today={getToday()}
          onSave={(wo: MaintenanceWorkOrder) => {
            setData((current) => {
              if (wo.id) {
                return { ...current, maintenanceWorkOrders: current.maintenanceWorkOrders.map((w) => (w.id === wo.id ? wo : w)) };
              }
              const num = generateCode('WO', current.maintenanceWorkOrders.map((w) => w.woNumber), wo.scheduledDate || getToday());
              const created: MaintenanceWorkOrder = { ...wo, id: num, woNumber: num, createdAt: new Date().toISOString() };
              return { ...current, maintenanceWorkOrders: [created, ...current.maintenanceWorkOrders] };
            });
          }}
          onDelete={(id: string) => {
            setData((current) => ({ ...current, maintenanceWorkOrders: current.maintenanceWorkOrders.filter((w) => w.id !== id) }));
          }}
          onComplete={(wo: MaintenanceWorkOrder) => {
            setData((current) => {
              const completedDate = wo.completedDate || getToday();
              const id = wo.id || generateCode('WO', current.maintenanceWorkOrders.map((w) => w.woNumber), wo.scheduledDate || getToday());
              const finished: MaintenanceWorkOrder = { ...wo, id, woNumber: wo.woNumber || id, status: 'Completed', completedDate, createdAt: wo.createdAt || new Date().toISOString() };
              const exists = current.maintenanceWorkOrders.some((w) => w.id === id);
              // Advance the machine's next-service date for preventive jobs.
              let machinesNext = current.machines;
              if (wo.type === 'Preventive' && wo.machineId && wo.nextServiceIntervalDays > 0) {
                const next = new Date(`${completedDate}T00:00:00Z`);
                next.setUTCDate(next.getUTCDate() + wo.nextServiceIntervalDays);
                const nextStr = next.toISOString().slice(0, 10);
                machinesNext = current.machines.map((m) =>
                  m.id === wo.machineId ? { ...m, lastServicedDate: completedDate, nextServiceDate: nextStr, maintenanceStatus: 'OK' as const } : m,
                );
              }
              return {
                ...current,
                machines: machinesNext,
                maintenanceWorkOrders: exists
                  ? current.maintenanceWorkOrders.map((w) => (w.id === id ? finished : w))
                  : [finished, ...current.maintenanceWorkOrders],
              };
            });
          }}
        />
      )}

      {view === 'stockTake' && (
        <StockTakePage
          spareParts={data.spareParts}
          materialReceipts={data.materialReceipts}
          finishedGoodsStock={data.finishedGoodsStock}
          stockCounts={data.stockCounts}
          form={stockCountForm}
          setForm={setStockCountForm}
          message={stockCountMessage}
          onSave={handleSaveStockCount}
          onReconcile={handleReconcileStockCount}
        />
      )}

      {view === 'invoiceInbox' && (
        <InvoiceInboxPage
          items={data.invoiceInboxItems}
          suppliers={data.suppliers}
          onSave={(item: InvoiceInboxItem) => {
            setData((current) => {
              const exists = current.invoiceInboxItems.some((it) => it.id === item.id);
              return {
                ...current,
                invoiceInboxItems: exists
                  ? current.invoiceInboxItems.map((it) => (it.id === item.id ? item : it))
                  : [item, ...current.invoiceInboxItems],
              };
            });
          }}
          onRunOcr={async (item: InvoiceInboxItem): Promise<InvoiceExtraction> => {
            return runOcrOnInboxItem(item);
          }}
          onUploadFile={(file, inboxItemId) => uploadInvoiceInboxFile(file, inboxItemId)}
          onPostToMaterialReceipt={(item: InvoiceInboxItem) => {
            // Pre-fill the materials receiving form with what we extracted,
            // jump there. Marking the inbox item posted happens once the
            // receipt is actually saved (out of scope for this stub).
            const ex = item.extractedJson;
            if (ex) {
              setMaterialForm((prev) => ({
                ...prev,
                supplierId: ex.matchedSupplierId || prev.supplierId,
                supplierName: ex.supplierGuess || prev.supplierName,
                invoiceReference: ex.invoiceNumber || prev.invoiceReference,
                receivedDate: ex.invoiceDate || prev.receivedDate,
              }));
            }
            setView('materials');
            setData((current) => ({
              ...current,
              invoiceInboxItems: current.invoiceInboxItems.map((it) =>
                it.id === item.id
                  ? { ...it, status: 'posted', postedAt: new Date().toISOString() }
                  : it,
              ),
            }));
          }}
          onPostToAccountsPayable={(item: InvoiceInboxItem) => {
            const ex = item.extractedJson;
            if (!ex) return;
            setData((current) => {
              const billDate = ex.invoiceDate || getToday();
              const num = generateCode('BILL', current.supplierBills.map((b) => b.billNumber), billDate);
              const supplier = current.suppliers.find((s) => s.id === ex.matchedSupplierId);
              const subtotal = Number(ex.subtotal) || 0;
              const vat = Number(ex.vatTotal) || 0;
              const total = Number(ex.grandTotal) || subtotal + vat;
              const bill: SupplierBill = {
                id: num,
                billNumber: num,
                supplierInvoiceNumber: ex.invoiceNumber || '',
                createdAt: new Date().toISOString(),
                billDate,
                dueDate: ex.dueDate || '',
                supplierId: ex.matchedSupplierId || '',
                supplierName: supplier?.name || ex.supplierGuess || '',
                expenseAccountId: '',
                expenseAccountName: '',
                currency: ex.currency || 'ZAR',
                subtotalExclVat: subtotal,
                vatAmount: vat,
                totalInclVat: total,
                payments: [],
                amountPaid: 0,
                amountOutstanding: total,
                status: 'Unpaid',
                sourceShipmentId: '',
                sourceInboxId: item.id,
                notes: `Posted from OCR inbox ${item.inboxNumber || item.id}`,
              };
              return {
                ...current,
                supplierBills: [bill, ...current.supplierBills],
                invoiceInboxItems: current.invoiceInboxItems.map((it) =>
                  it.id === item.id
                    ? { ...it, status: 'posted', postedAt: new Date().toISOString(), postedAsApInvoiceId: num }
                    : it,
                ),
              };
            });
            setView('accountsPayable');
          }}
        />
      )}

      {view === 'salesPipeline' && (
        <SalesPipelinePage
          leads={data.leads}
          quotes={data.quoteEstimates}
          jobs={data.jobs}
          invoices={data.invoices}
          clients={data.clients}
          onNavigate={(v) => setView(v)}
        />
      )}

      {view === 'profitability' && (
        <ProfitabilityPage
          jobs={data.jobs}
          workTickets={data.workTickets}
          invoices={data.invoices}
          quoteEstimates={data.quoteEstimates}
          products={data.products}
        />
      )}

      {view === 'foodSafetyControlCentre' && (
        <FoodSafetyControlCentrePage data={data} onNavigate={(v) => setView(v)} />
      )}

      {view === 'nonConformance' && (
        <NonConformancePage
          ncrs={data.nonConformances}
          jobs={data.jobs}
          finishedGoodsStock={data.finishedGoodsStock}
          cleaningLogs={data.cleaningLogs}
          filters={ncrFilters}
          setFilters={setNcrFilters}
          form={ncrForm}
          setForm={setNcrForm}
          editingId={ncrEditingId}
          message={ncrMessage}
          onSave={handleSaveNcr}
          onReset={resetNcrEditor}
          onEdit={editNcr}
        />
      )}

      {view === 'sopRegister' && (
        <SopRegisterPage
          documents={data.sopDocuments}
          filters={sopFilters}
          setFilters={setSopFilters}
          form={sopForm}
          setForm={setSopForm}
          editingId={sopEditingId}
          message={sopMessage}
          onSave={handleSaveSop}
          onReset={resetSopEditor}
          onEdit={editSop}
          onCreateNewVersion={handleCreateNewSopVersion}
        />
      )}

      {view === 'staffTraining' && (
        <StaffTrainingPage
          records={data.staffTrainingRecords}
          filters={trainingFilters}
          setFilters={setTrainingFilters}
          form={trainingForm}
          setForm={setTrainingForm}
          editingId={trainingEditingId}
          message={trainingMessage}
          onSave={handleSaveTraining}
          onReset={resetTrainingEditor}
          onEdit={editTraining}
        />
      )}

      {view === 'myPortal' && profile && (
        <StaffPortalPage
          profile={profile}
          role={profile.role}
          notices={data.notices ?? []}
          trainingRecords={data.staffTrainingRecords}
          sopDocuments={data.sopDocuments}
          payrollRuns={data.payrollRuns}
          employees={data.employees}
          onAcknowledgeTraining={handleAcknowledgeTraining}
          onAcknowledgeSop={handleAcknowledgeSop}
        />
      )}

      {view === 'notices' && (
        <NoticesPage
          notices={data.notices ?? []}
          form={noticeForm}
          setForm={setNoticeForm}
          editingId={noticeEditingId}
          message={noticeMessage}
          onSave={handleSaveNotice}
          onReset={resetNoticeEditor}
          onEdit={editNotice}
          onDelete={handleDeleteNotice}
        />
      )}

      {view === 'ppeControl' && (
        <PpeIssuePage
          records={data.ppeIssueRecords}
          filters={ppeFilters}
          setFilters={setPpeFilters}
          form={ppeForm}
          setForm={setPpeForm}
          editingId={ppeEditingId}
          message={ppeMessage}
          onSave={handleSavePpe}
          onReset={resetPpeEditor}
          onEdit={editPpe}
        />
      )}

      {view === 'pestControl' && (
        <PestControlPage
          records={data.pestControlRecords}
          filters={pestFilters}
          setFilters={setPestFilters}
          form={pestForm}
          setForm={setPestForm}
          editingId={pestEditingId}
          message={pestMessage}
          onSave={handleSavePest}
          onReset={resetPestEditor}
          onEdit={editPest}
        />
      )}

      {view === 'foreignObjectControl' && (
        <ForeignObjectPage
          records={data.foreignObjectRecords}
          filters={foreignObjectFilters}
          setFilters={setForeignObjectFilters}
          form={foreignObjectForm}
          setForm={setForeignObjectForm}
          editingId={foreignObjectEditingId}
          message={foreignObjectMessage}
          onSave={handleSaveForeignObject}
          onReset={resetForeignObjectEditor}
          onEdit={editForeignObject}
        />
      )}

      {view === 'contaminationControl' && (
        <ContaminationControlPage
          canForeign={allowedViews.has('foreignObjectControl')}
          canPest={allowedViews.has('pestControl')}
          foreignContent={
            <ForeignObjectPage
              records={data.foreignObjectRecords}
              filters={foreignObjectFilters}
              setFilters={setForeignObjectFilters}
              form={foreignObjectForm}
              setForm={setForeignObjectForm}
              editingId={foreignObjectEditingId}
              message={foreignObjectMessage}
              onSave={handleSaveForeignObject}
              onReset={resetForeignObjectEditor}
              onEdit={editForeignObject}
            />
          }
          pestContent={
            <PestControlPage
              records={data.pestControlRecords}
              filters={pestFilters}
              setFilters={setPestFilters}
              form={pestForm}
              setForm={setPestForm}
              editingId={pestEditingId}
              message={pestMessage}
              onSave={handleSavePest}
              onReset={resetPestEditor}
              onEdit={editPest}
            />
          }
        />
      )}

      {view === 'toolBladeControl' && (
        <ToolBladePage
          records={data.toolBladeRecords}
          filters={toolBladeFilters}
          setFilters={setToolBladeFilters}
          form={toolBladeForm}
          setForm={setToolBladeForm}
          editingId={toolBladeEditingId}
          message={toolBladeMessage}
          onSave={handleSaveToolBlade}
          onReset={resetToolBladeEditor}
          onEdit={editToolBlade}
        />
      )}

      {view === 'visitorLog' && (
        <VisitorLogPage
          records={data.visitorLogEntries}
          filters={visitorFilters}
          setFilters={setVisitorFilters}
          form={visitorForm}
          setForm={setVisitorForm}
          editingId={visitorEditingId}
          message={visitorMessage}
          onSave={handleSaveVisitor}
          onReset={resetVisitorEditor}
          onEdit={editVisitor}
          onVerify={handleVerifyVisitor}
        />
      )}

      {view === 'haccpRegister' && (
        <HaccpRegisterPage
          hazards={data.haccpHazards}
          filters={haccpFilters}
          setFilters={setHaccpFilters}
          form={haccpForm}
          setForm={setHaccpForm}
          editingId={haccpEditingId}
          message={haccpMessage}
          onSave={handleSaveHaccpHazard}
          onReset={resetHaccpEditor}
          onEdit={editHaccpHazard}
        />
      )}

      {view === 'traceability' && (
        <TraceabilityPage
          data={data}
          seed={traceabilitySeed}
          onSeedConsumed={() => setTraceabilitySeed(null)}
        />
      )}

      {view === 'complaints' && (
        <ComplaintsPage
          complaints={data.customerComplaints}
          clients={data.clients}
          products={data.products}
          jobs={data.jobs}
          finishedGoodsStock={data.finishedGoodsStock}
          deliveryNotes={data.deliveryNotes}
          invoices={data.invoices}
          filters={complaintFilters}
          setFilters={setComplaintFilters}
          form={complaintForm}
          setForm={setComplaintForm}
          editingId={complaintEditingId}
          message={complaintMessage}
          onSave={handleSaveComplaint}
          onReset={resetComplaintEditor}
          onEdit={editComplaint}
          onOpenTraceability={handleOpenTraceabilityFromComplaint}
        />
      )}

      {view === 'cleaningLogs' && (
        <CleaningLogsPage
          logs={data.cleaningLogs}
          machines={data.machines}
          chemicals={data.chemicalRegisterEntries}
          filters={cleaningLogFilters}
          setFilters={setCleaningLogFilters}
          form={cleaningLogForm}
          setForm={setCleaningLogForm}
          editingId={cleaningLogEditingId}
          message={cleaningLogMessage}
          onSave={handleSaveCleaningLog}
          onReset={resetCleaningLogEditor}
          onEdit={editCleaningLog}
        />
      )}

      {view === 'production' && (
        <ProductionLogsPage
          jobs={data.jobs}
          machines={data.machines}
          materialReceipts={data.materialReceipts}
          monthOptions={monthOptions}
          productionForm={productionForm}
          setProductionForm={setProductionForm}
          productionEditingId={productionEditingId}
          productionMessage={productionMessage}
          onSave={handleSaveProduction}
          onReset={resetProductionEditor}
          productionFilters={productionFilters}
          setProductionFilters={setProductionFilters}
          filteredProductionLogs={filteredProductionLogs}
          onEdit={editProduction}
        />
      )}

      {view === 'waste' && (
        <WasteLogPage
          jobs={data.jobs}
          productionLogs={data.productionLogs}
          monthOptions={monthOptions}
          wasteForm={wasteForm}
          setWasteForm={setWasteForm}
          wasteEditingId={wasteEditingId}
          wasteMessage={wasteMessage}
          onSave={handleSaveWaste}
          onReset={resetWasteEditor}
          selectedWasteJob={selectedWasteJob}
          wasteFilters={wasteFilters}
          setWasteFilters={setWasteFilters}
          filteredWasteEntries={filteredWasteEntries}
          onEdit={editWaste}
        />
      )}

      {view === 'paper' && (
        <PaperLogPage
          jobs={data.jobs}
          materialReceipts={data.materialReceipts}
          monthOptions={monthOptions}
          paperForm={paperForm}
          setPaperForm={setPaperForm}
          paperEditingId={paperEditingId}
          paperMessage={paperMessage}
          onSave={handleSavePaper}
          onReset={resetPaperEditor}
          selectedPaperJob={selectedPaperJob}
          paperFilters={paperFilters}
          setPaperFilters={setPaperFilters}
          filteredPaperLogs={filteredPaperLogs}
          onEdit={editPaper}
        />
      )}

      {view === 'dispatch' && (
        <DispatchPage
          jobs={data.jobs}
          finishedGoodsStock={data.finishedGoodsStock}
          monthOptions={monthOptions}
          dispatchForm={dispatchForm}
          setDispatchForm={setDispatchForm}
          dispatchEditingId={dispatchEditingId}
          dispatchMessage={dispatchMessage}
          onSave={handleSaveDispatch}
          onReset={resetDispatchEditor}
          dispatchFilters={dispatchFilters}
          setDispatchFilters={setDispatchFilters}
          filteredDispatchRecords={filteredDispatchRecords}
          onEdit={editDispatch}
        />
      )}

      {view === 'reports' && (
        <ReportsPage
          monthOptions={monthOptions}
          reportFilters={reportFilters}
          setReportFilters={setReportFilters}
          reportJobsCount={reportJobs.length}
          reportWasteTotal={reportWasteEntries.reduce((sum, entry) => sum + entry.wasteQuantity, 0)}
          reportPaperLogsCount={reportPaperLogs.length}
          reportFscTaggedCount={
            reportJobs.filter((job) => job.fscRelated).length +
            reportWasteEntries.filter((entry) => entry.fscRelated).length +
            reportPaperLogs.filter((log) => log.fscRelated).length
          }
          averageWastePerJob={calculateAverageWastePerJob(reportWasteEntries, reportJobs)}
          averageWastePerCompletedJob={calculateAverageWastePerCompletedJob(reportWasteEntries, reportJobs)}
          productionRows={reportProductionRows}
          wasteByReason={reportWasteByReason}
          wasteByJob={reportWasteByJob}
          paperByJob={reportPaperByJob}
          paperByType={reportPaperByType}
          timelineRows={reportTimelineRows}
          staffWorkloadRows={reportStaffWorkload}
          bottleneckRows={reportBottlenecks}
          clientTrackingRows={reportClientTrackingRows}
          auditRows={reportAuditRows}
          onExport={exportReports}
          onPrint={() => window.print()}
        />
      )}
        </>
      )}
    </AppLayout>
    )}
    {undoToast ? (
      <UndoToast
        id={undoToast.id}
        message={undoToast.message}
        onUndo={undoToast.onUndo}
        durationMs={undoToast.durationMs}
        onDismiss={() => setUndoToast(null)}
      />
    ) : null}
    {historyTarget ? (
      <HistoryDrawer
        target={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    ) : null}
    <CommandPalette
      open={paletteOpen}
      onClose={() => setPaletteOpen(false)}
      jobs={data.jobs}
      clients={data.clients}
      products={data.products}
      spareParts={data.spareParts}
      invoices={data.invoices}
      leads={data.leads}
      setView={setView}
      setSelectedJobId={setSelectedJobId}
      navItems={navItems}
    />
    {workTicketPrintTarget ? (
      <WorkTicketPrint
        ticket={workTicketPrintTarget}
        company={data.appSettings.company}
        onClose={() => setWorkTicketPrintTarget(null)}
      />
    ) : null}
    {foodSafeCertificateJob ? (
      <FoodSafeCertificatePrint
        job={foodSafeCertificateJob}
        approvedMaterials={data.foodSafeMaterials}
        company={data.appSettings.company}
        onClose={() => setFoodSafeCertificateJob(null)}
      />
    ) : null}
    {quotePrintTarget ? (
      <QuotePrint
        quote={quotePrintTarget}
        client={data.clients.find((c) => c.id === quotePrintTarget.clientId)}
        company={data.appSettings.company}
        termsAndConditions={data.appSettings.templates.termsAndConditions}
        onClose={() => setQuotePrintTarget(null)}
      />
    ) : null}
    {jobCardPrintTarget ? (
      <JobCardPrint
        job={jobCardPrintTarget}
        company={data.appSettings.company}
        machineName={data.machines.find((m) => m.id === jobCardPrintTarget.assignedMachineId)?.name}
        onClose={() => setJobCardPrintTarget(null)}
      />
    ) : null}
    {deliveryNotePrintTarget ? (
      <DeliveryNotePrint
        note={deliveryNotePrintTarget}
        parentInvoice={
          deliveryNotePrintTarget.parentInvoiceId
            ? data.invoices.find((inv) => inv.id === deliveryNotePrintTarget.parentInvoiceId)
            : undefined
        }
        allDeliveryNotes={data.deliveryNotes}
        company={data.appSettings.company}
        onClose={() => setDeliveryNotePrintTarget(null)}
      />
    ) : null}
    </>
  );
}

export default App;
