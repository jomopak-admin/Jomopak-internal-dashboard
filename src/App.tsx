import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { ArtworkPage } from './pages/Artwork/ArtworkPage';
import { CalculatorPage } from './pages/Calculator/CalculatorPage';
import { CostInputsPage } from './pages/CostInputs/CostInputsPage';
import { ClientsPage } from './pages/Clients/ClientsPage';
import { CustomerStockPage } from './pages/CustomerStock/CustomerStockPage';
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
import { ProductionLogsPage } from './pages/ProductionLogs/ProductionLogsPage';
import { QuotesPage } from './pages/Quotes/QuotesPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SalesDeskPage } from './pages/Sales/SalesDeskPage';
import { SparePartsPage } from './pages/SpareParts/SparePartsPage';
import { SuppliersPage } from './pages/Suppliers/SuppliersPage';
import { WasteLogPage } from './pages/WasteLog/WasteLogPage';
import {
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
  DispatchFilters,
  DispatchFormState,
  DispatchRecord,
  FinishedGoodsStock,
  FinishedGoodsStockFilters,
  FinishedGoodsStockFormState,
  JobCard,
  JobFilters,
  JobFormState,
  Lead,
  LeadFilters,
  LeadFormState,
  Machine,
  MachineFilters,
  MachineFormState,
  MaterialFilters,
  MaterialOrderRequest,
  MaterialReceipt,
  MaterialReceiptFormState,
  PaperFilters,
  PaperFormState,
  PaperLog,
  PaperRate,
  PaperRateFilters,
  PaperRateFormState,
  PricingTier,
  PricingTierFilters,
  PricingTierFormState,
  Product,
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
  Supplier,
  SupplierFilters,
  SupplierFormState,
  VIEW_LABELS,
  View,
  WasteEntry,
  WasteFilters,
  WasteFormState,
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
import { supabase } from './utils/supabase';

const currentMonth = getCurrentMonthValue();
const VIEW_ORDER: View[] = [
  'dashboard',
  'salesDesk',
  'leads',
  'calculator',
  'costInputs',
  'permissions',
  'suppliers',
  'machines',
  'quotes',
  'artwork',
  'customerStock',
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
  category: '',
  machineId: '',
  machineReference: '',
  supplierId: '',
  supplierName: '',
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

const createInitialPricingTierForm = (): PricingTierFormState => ({
  name: '',
  type: 'Wholesale',
  defaultMarginPercent: '',
  brandingMarginPercent: '',
  notes: '',
});

const createInitialClientForm = (): ClientFormState => ({
  name: '',
  code: '',
  pricingTierId: '',
  brandingDefault: false,
  defaultMarginPercent: '',
  creditLimit: '',
  currentBalance: '',
  paymentTerms: '30 Days',
  accountHold: false,
  contactName: '',
  contactEmail: '',
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
});

function App() {
  const { session, profile, loading: authLoading, recoveryMode, clearRecoveryMode } = useAuth();
  const { profiles, loading: profilesLoading, saveProfile, createUser } = useProfiles(profile?.role === 'admin');
  const { data, setData, loading } = useProductionData();
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

  const [calculatorQuoteForm, setCalculatorQuoteForm] = useState(createInitialCalculatorQuoteForm);

  const [supplierForm, setSupplierForm] = useState(createInitialSupplierForm);
  const [supplierEditingId, setSupplierEditingId] = useState<string | null>(null);
  const [supplierMessage, setSupplierMessage] = useState('');
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
  const [jobFilters, setJobFilters] = useState<JobFilters>({ search: '', month: '', status: '', customer: '', fsc: 'all' });

  const [stockForm, setStockForm] = useState(createInitialFinishedStockForm);
  const [stockEditingId, setStockEditingId] = useState<string | null>(null);
  const [stockMessage, setStockMessage] = useState('');
  const [stockFilters, setStockFilters] = useState<FinishedGoodsStockFilters>({ search: '', client: '', status: '', product: '' });

  const [spareForm, setSpareForm] = useState(createInitialSpareForm);
  const [spareEditingId, setSpareEditingId] = useState<string | null>(null);
  const [spareMessage, setSpareMessage] = useState('');
  const [spareFilters, setSpareFilters] = useState<SparePartFilters>({ search: '', category: '', lowStock: 'all', supplier: '' });

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
    () => [...(profile?.permissions ?? [])]
      .sort((left, right) => VIEW_ORDER.indexOf(left) - VIEW_ORDER.indexOf(right))
      .map((permission) => ({ key: permission, label: VIEW_LABELS[permission] })),
    [profile?.permissions],
  );
  const allowedViews = useMemo(() => new Set(navItems.map((item) => item.key)), [navItems]);
  const canManageCostInputs = allowedViews.has('costInputs');
  const canViewInternalCalculatorCosts = canManageCostInputs;

  useEffect(() => {
    if (!allowedViews.has(view)) {
      setView(navItems[0]?.key ?? 'dashboard');
    }
  }, [allowedViews, navItems, view]);

  async function handleSignOut() {
    await supabase.auth.signOut();
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

  const dashboardJobs = useMemo(() => data.jobs.filter((job) => getMonthKey(job.jobDate) === dashboardMonth), [dashboardMonth, data.jobs]);
  const dashboardMaterials = useMemo(() => data.materialReceipts.filter((receipt) => getMonthKey(receipt.receivedDate) === dashboardMonth), [dashboardMonth, data.materialReceipts]);
  const dashboardProductionLogs = useMemo(() => data.productionLogs.filter((log) => getMonthKey(log.logDate) === dashboardMonth), [dashboardMonth, data.productionLogs]);
  const dashboardWaste = useMemo(() => data.wasteEntries.filter((entry) => getMonthKey(entry.wasteDate) === dashboardMonth), [dashboardMonth, data.wasteEntries]);
  const dashboardPaper = useMemo(() => data.paperLogs.filter((log) => getMonthKey(log.logDate) === dashboardMonth), [dashboardMonth, data.paperLogs]);
  const dashboardDispatch = useMemo(() => data.dispatchRecords.filter((record) => getMonthKey(record.dispatchDate) === dashboardMonth), [dashboardMonth, data.dispatchRecords]);
  const dashboardFinishedStock = useMemo(() => data.finishedGoodsStock.filter((item) => getMonthKey(item.storedDate) === dashboardMonth), [dashboardMonth, data.finishedGoodsStock]);

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
    const matchesSearch = !jobFilters.search || [job.jobNumber, job.customerName, job.productName, job.paperType, job.customerReference].some((value) => matchesText(value, jobFilters.search));
    const matchesMonth = !jobFilters.month || getMonthKey(job.jobDate) === jobFilters.month;
    const matchesStatus = !jobFilters.status || job.status === jobFilters.status;
    const matchesCustomer = !jobFilters.customer || matchesText(job.customerName, jobFilters.customer);
    const matchesFsc = jobFilters.fsc === 'all' || (jobFilters.fsc === 'yes' ? job.fscRelated : !job.fscRelated);
    return matchesSearch && matchesMonth && matchesStatus && matchesCustomer && matchesFsc;
  }), [data.jobs, jobFilters]);

  const filteredFinishedStock = useMemo(() => data.finishedGoodsStock.filter((item) => {
    const matchesSearch = !stockFilters.search || [item.stockNumber, item.productName, item.clientName, item.jobNumber, item.storageLocation].some((value) => matchesText(value, stockFilters.search));
    const matchesClient = !stockFilters.client || matchesText(item.clientName, stockFilters.client);
    const matchesStatus = !stockFilters.status || item.stockStatus === stockFilters.status;
    const matchesProduct = !stockFilters.product || matchesText(item.productName, stockFilters.product);
    return matchesSearch && matchesClient && matchesStatus && matchesProduct;
  }), [data.finishedGoodsStock, stockFilters]);

  const filteredSpareParts = useMemo(() => data.spareParts.filter((part) => {
    const matchesSearch = !spareFilters.search || [part.partName, part.partCode, part.machineReference, part.storageLocation].some((value) => matchesText(value, spareFilters.search));
    const matchesCategory = !spareFilters.category || matchesText(part.category, spareFilters.category);
    const matchesSupplier = !spareFilters.supplier || matchesText(part.supplierName, spareFilters.supplier);
    const isLowStock = part.quantityOnHand <= (part.reorderLevel || part.minimumStockLevel);
    const matchesLowStock = spareFilters.lowStock === 'all' || (spareFilters.lowStock === 'yes' ? isLowStock : !isLowStock);
    return matchesSearch && matchesCategory && matchesSupplier && matchesLowStock;
  }), [data.spareParts, spareFilters]);

  const filteredMaterialReceipts = useMemo(() => data.materialReceipts.filter((receipt) => {
    const matchesSearch = !materialFilters.search || [receipt.receiptNumber, receipt.internalRollCode, receipt.supplierName, receipt.supplierBatchNumber].some((value) => matchesText(value, materialFilters.search));
    const matchesMonth = !materialFilters.month || getMonthKey(receipt.receivedDate) === materialFilters.month;
    const matchesSupplier = !materialFilters.supplier || matchesText(receipt.supplierName, materialFilters.supplier);
    const matchesPaperType = !materialFilters.paperType || matchesText(receipt.paperType, materialFilters.paperType);
    const matchesFsc = materialFilters.fsc === 'all' || (materialFilters.fsc === 'yes' ? receipt.fscRelated : !receipt.fscRelated);
    return matchesSearch && matchesMonth && matchesSupplier && matchesPaperType && matchesFsc;
  }), [data.materialReceipts, materialFilters]);

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
    const matchesSearch = !dispatchFilters.search || [record.dispatchNumber, record.jobNumber, record.customerName, record.labelReference, record.deliveryReference].some((value) => matchesText(value, dispatchFilters.search));
    const matchesMonth = !dispatchFilters.month || getMonthKey(record.dispatchDate) === dispatchFilters.month;
    const matchesCustomer = !dispatchFilters.customer || matchesText(record.customerName, dispatchFilters.customer);
    const matchesFsc = dispatchFilters.fsc === 'all' || (dispatchFilters.fsc === 'yes' ? record.fscRelated : !record.fscRelated);
    return matchesSearch && matchesMonth && matchesCustomer && matchesFsc;
  }), [data.dispatchRecords, dispatchFilters]);

  const filteredQuoteEstimates = useMemo(() => data.quoteEstimates.filter((quote) => {
    const matchesSearch = !quoteFilters.search || [quote.quoteNumber, quote.quickbooksEstimateNumber, quote.clientName, quote.productName, quote.sizeSpec].some((value) => matchesText(value, quoteFilters.search));
    const matchesMonth = !quoteFilters.month || getMonthKey(quote.quoteDate) === quoteFilters.month;
    const matchesStatus = !quoteFilters.status || quote.status === quoteFilters.status;
    const matchesClient = !quoteFilters.client || matchesText(quote.clientName, quoteFilters.client);
    return matchesSearch && matchesMonth && matchesStatus && matchesClient;
  }), [data.quoteEstimates, quoteFilters]);

  const filteredLeads = useMemo(() => data.leads.filter((lead) => {
    const matchesSearch = !leadFilters.search || [lead.leadNumber, lead.quickbooksEstimateNumber, lead.companyName, lead.contactName, lead.clientName, lead.productName, lead.notes].some((value) => matchesText(value, leadFilters.search));
    const matchesMonth = !leadFilters.month || getMonthKey(lead.enquiryDate) === leadFilters.month;
    const matchesStatus = !leadFilters.status || lead.status === leadFilters.status;
    const matchesSource = !leadFilters.source || lead.source === leadFilters.source;
    const matchesOwner = !leadFilters.owner || matchesText(lead.assignedTo, leadFilters.owner);
    return matchesSearch && matchesMonth && matchesStatus && matchesSource && matchesOwner;
  }), [data.leads, leadFilters]);

  const filteredArtworkRecords = useMemo(() => data.artworkRecords.filter((record) => {
    const matchesSearch = !artworkFilters.search || [record.artworkNumber, record.jobNumber, record.clientName, record.notes].some((value) => matchesText(value, artworkFilters.search));
    const matchesStage = !artworkFilters.stage || record.stage === artworkFilters.stage;
    const matchesClient = !artworkFilters.client || matchesText(record.clientName, artworkFilters.client);
    return matchesSearch && matchesStage && matchesClient;
  }), [data.artworkRecords, artworkFilters]);

  const filteredCustomerStockReleases = useMemo(() => data.customerStockReleases.filter((release) => {
    const matchesSearch = !customerStockReleaseFilters.search || [release.releaseNumber, release.clientName, release.finishedGoodsStockNumber, release.jobNumber, release.destination].some((value) => matchesText(value, customerStockReleaseFilters.search));
    const matchesMonth = !customerStockReleaseFilters.month || getMonthKey(release.releaseDate) === customerStockReleaseFilters.month;
    const matchesClient = !customerStockReleaseFilters.client || matchesText(release.clientName, customerStockReleaseFilters.client);
    return matchesSearch && matchesMonth && matchesClient;
  }), [data.customerStockReleases, customerStockReleaseFilters]);

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
  function resetSupplierEditor() { setSupplierForm(createInitialSupplierForm()); setSupplierEditingId(null); setSupplierMessage(''); }
  function resetMachineEditor() { setMachineForm(createInitialMachineForm()); setMachineEditingId(null); setMachineMessage(''); }
  function resetLeadEditor() { setLeadForm(createInitialLeadForm()); setLeadEditingId(null); setLeadMessage(''); }
  function resetQuoteEditor() { setQuoteForm(createInitialQuoteForm()); setQuoteEditingId(null); setQuoteMessage(''); }
  function resetArtworkEditor() { setArtworkForm(createInitialArtworkForm()); setArtworkEditingId(null); setArtworkMessage(''); }
  function resetCustomerStockReleaseEditor() { setCustomerStockReleaseForm(createInitialCustomerStockReleaseForm()); setCustomerStockReleaseEditingId(null); setCustomerStockReleaseMessage(''); }
  function resetPaperRateEditor() { setPaperRateForm(createInitialPaperRateForm()); setPaperRateEditingId(null); setPaperRateMessage(''); }
  function resetCostProfileEditor() { setCostProfileForm(createInitialCostProfileForm()); setCostProfileEditingId(null); setCostProfileMessage(''); }
  function resetStockEditor() { setStockForm(createInitialFinishedStockForm()); setStockEditingId(null); setStockMessage(''); }
  function resetSpareEditor() { setSpareForm(createInitialSpareForm()); setSpareEditingId(null); setSpareMessage(''); }
  function resetTierEditor() { setTierForm(createInitialPricingTierForm()); setTierEditingId(null); setTierMessage(''); }
  function resetClientEditor() { setClientForm(createInitialClientForm()); setClientEditingId(null); setClientMessage(''); }
  function resetProductEditor() { setProductForm(createInitialProductForm()); setProductEditingId(null); setProductMessage(''); }
  function resetMaterialEditor() { setMaterialForm(createInitialMaterialForm()); setMaterialEditingId(null); setMaterialMessage(''); }
  function resetProductionEditor() { setProductionForm(createInitialProductionForm()); setProductionEditingId(null); setProductionMessage(''); }
  function resetWasteEditor() { setWasteForm(createInitialWasteForm()); setWasteEditingId(null); setWasteMessage(''); }
  function resetPaperEditor() { setPaperForm(createInitialPaperForm()); setPaperEditingId(null); setPaperMessage(''); }
  function resetDispatchEditor() { setDispatchForm(createInitialDispatchForm()); setDispatchEditingId(null); setDispatchMessage(''); }

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
      setData((current) => ({
        ...current,
        suppliers: current.suppliers.map((supplier) => supplier.id === supplierEditingId ? { ...supplier, ...payload } : supplier),
        paperRates: current.paperRates.map((rate) => rate.supplierId === supplierEditingId ? { ...rate, supplierName: payload.name } : rate),
        spareParts: current.spareParts.map((part) => part.supplierId === supplierEditingId ? { ...part, supplierName: payload.name } : part),
        materialReceipts: current.materialReceipts.map((receipt) => receipt.supplierId === supplierEditingId ? { ...receipt, supplierName: payload.name } : receipt),
      }));
    } else {
      setData((current) => ({ ...current, suppliers: [{ id: `supplier-${Date.now()}`, ...payload }, ...current.suppliers] }));
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
    };
    if (quoteEditingId) {
      setData((current) => ({ ...current, quoteEstimates: current.quoteEstimates.map((quote) => quote.id === quoteEditingId ? { ...quote, ...payload } : quote) }));
    } else {
      const quoteNumber = generateCode('QTE', data.quoteEstimates.map((quote) => quote.quoteNumber), quoteForm.quoteDate);
      const newQuote: QuoteEstimate = { id: quoteNumber, quoteNumber, createdAt: new Date().toISOString(), ...payload };
      setData((current) => ({ ...current, quoteEstimates: [newQuote, ...current.quoteEstimates] }));
    }
    resetQuoteEditor();
  }

  function handleSaveLead() {
    if (!leadForm.companyName && !leadForm.clientId) {
      setLeadMessage('Company name or an existing client is required.');
      return;
    }
    if (!leadForm.contactName && !leadForm.phone && !leadForm.email) {
      setLeadMessage('Add at least one contact detail for the lead.');
      return;
    }
    if (leadForm.status === 'Quoted' && !leadForm.quickbooksEstimateNumber.trim()) {
      setLeadMessage('QuickBooks estimate number is required once the lead is marked as quoted.');
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
    if (artworkEditingId) {
      setData((current) => ({ ...current, artworkRecords: current.artworkRecords.map((record) => record.id === artworkEditingId ? { ...record, ...payload } : record) }));
    } else {
      const artworkNumber = generateCode('ART', data.artworkRecords.map((record) => record.artworkNumber), artworkForm.artworkReceivedDate || getToday());
      const newRecord: ArtworkRecord = { id: artworkNumber, artworkNumber, createdAt: new Date().toISOString(), ...payload };
      setData((current) => ({ ...current, artworkRecords: [newRecord, ...current.artworkRecords] }));
    }
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

  function handleSaveJob() {
    if (!jobForm.jobDate || !jobForm.customerName || !jobForm.productName || !jobForm.quantityPlanned || !jobForm.status) {
      setJobMessage('Job date, customer, product, quantity planned, and status are required.');
      return;
    }
    const previousJob = jobEditingId ? data.jobs.find((job) => job.id === jobEditingId) : undefined;
    const linkedClient = jobForm.clientId ? clientsById.get(jobForm.clientId) : undefined;
    const linkedProduct = jobForm.productId ? productsById.get(jobForm.productId) : undefined;
    const linkedQuote = jobForm.quoteId ? quotesById.get(jobForm.quoteId) : undefined;
    const linkedReservationStock = jobForm.reservedFinishedGoodsStockId ? finishedStockById.get(jobForm.reservedFinishedGoodsStockId) : undefined;
    const reservedQuantity = Number(jobForm.reservedQuantity || 0);
    const commercialCleared = jobForm.commercialReleaseStatus === 'Cleared for Production';
    const orderValue = Number(jobForm.orderValue || linkedQuote?.totalQuote || 0);
    const availableCredit = linkedClient ? Math.max(linkedClient.creditLimit - linkedClient.currentBalance, 0) : 0;
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
          setJobMessage(`Order value exceeds available credit. Available credit: ${availableCredit.toFixed(2)}.`);
          return;
        }
      }
    }

    const matchingReceipts = data.materialReceipts.filter((receipt) =>
      matchesText(receipt.paperType, jobForm.paperType) &&
      matchesText(receipt.gsm, jobForm.gsm) &&
      receipt.quantityUnit === jobForm.paperQuantityUnit,
    );
    const availablePaperQuantity = Math.max(
      matchingReceipts.reduce((sum, receipt) => sum + receipt.quantityReceived, 0) -
      data.paperLogs
        .filter((log) =>
          matchesText(log.paperType, jobForm.paperType) &&
          matchesText(log.gsm, jobForm.gsm) &&
          log.quantityUnit === jobForm.paperQuantityUnit,
        )
        .reduce((sum, log) => sum + log.quantityUsed, 0),
      0,
    );
    const paperShortage = commercialCleared && paperQuantityRequired > 0
      ? Math.max(paperQuantityRequired - availablePaperQuantity, 0)
      : 0;

    setJobMessage('');
    if (jobEditingId) {
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
          } : job),
        };
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
        finishedGoodsStock: current.finishedGoodsStock.map((item) => commercialCleared && jobForm.reserveFromStock && linkedReservationStock && item.id === linkedReservationStock.id ? {
          ...item,
          quantityReserved: item.quantityReserved + reservedQuantity,
          quantityAvailable: Math.max(item.quantityAvailable - reservedQuantity, 0),
          stockStatus: 'Reserved',
        } : item),
        materialOrderRequests: nextMaterialOrders,
        jobs: [newJob, ...current.jobs],
      }));
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
    const actorName = profile?.fullName || profile?.email || 'Unknown user';
    const actorId = profile?.id || 'unknown-user';
    const payload = {
      storedDate: stockForm.storedDate,
      productId: linkedProduct.id,
      productName: linkedProduct.name,
      clientId: linkedClient?.id ?? '',
      clientName: linkedClient?.name ?? '',
      jobId: linkedJob?.id ?? '',
      jobNumber: linkedJob?.jobNumber ?? '',
      quantityOnHand,
      quantityReserved,
      quantityAvailable: Math.max(quantityOnHand - quantityReserved, 0),
      quantityUnit: stockForm.quantityUnit,
      storageLocation: stockForm.storageLocation,
      stockStatus: stockForm.stockStatus,
      brandingStatus: stockForm.brandingStatus,
      notes: stockForm.notes,
    };
    if (stockEditingId) {
      const previousItem = data.finishedGoodsStock.find((item) => item.id === stockEditingId);
      setData((current) => ({
        ...current,
        finishedGoodsStock: current.finishedGoodsStock.map((item) => item.id === stockEditingId ? { ...item, ...payload } : item),
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
      };
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
    const payload = {
      partName: spareForm.partName,
      category: spareForm.category,
      machineId: linkedMachine?.id ?? '',
      machineReference: linkedMachine?.name ?? spareForm.machineReference,
      supplierId: linkedSupplier?.id ?? '',
      supplierName: linkedSupplier?.name ?? spareForm.supplierName,
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
      };
      setData((current) => ({ ...current, spareParts: [newPart, ...current.spareParts] }));
    }
    resetSpareEditor();
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

  function handleSaveClient() {
    if (!clientForm.name) {
      setClientMessage('Client name is required.');
      return;
    }
    const tier = clientForm.pricingTierId ? tiersById.get(clientForm.pricingTierId) : undefined;
    const payload = {
      name: clientForm.name,
      code: clientForm.code,
      pricingTierId: clientForm.pricingTierId,
      pricingTierName: tier?.name ?? '',
      clientType: tier?.type ?? 'Custom',
      brandingDefault: clientForm.brandingDefault,
      defaultMarginPercent: Number(clientForm.defaultMarginPercent || tier?.defaultMarginPercent || 0),
      creditLimit: Number(clientForm.creditLimit || 0),
      currentBalance: Number(clientForm.currentBalance || 0),
      paymentTerms: clientForm.paymentTerms,
      accountHold: clientForm.accountHold,
      contactName: clientForm.contactName,
      contactEmail: clientForm.contactEmail,
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
      ...productForm,
      defaultSupplierId: linkedSupplier?.id ?? '',
      defaultSupplierName: linkedSupplier?.name ?? '',
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
        materialReceipts: current.materialReceipts.map((receipt) => receipt.id === materialEditingId ? {
          ...receipt,
          receivedDate: materialForm.receivedDate,
          supplierId: linkedSupplier?.id ?? materialForm.supplierId,
          supplierName: linkedSupplier?.name ?? materialForm.supplierName,
          supplierBatchNumber: materialForm.supplierBatchNumber,
          internalRollCode: materialForm.internalRollCode,
          paperType: materialForm.paperType,
          gsm: materialForm.gsm,
          width: materialForm.width,
          quantityReceived: Number(materialForm.quantityReceived),
          quantityUnit: materialForm.quantityUnit,
          fscClaimType: materialForm.fscClaimType,
          supplierCertificateCode: materialForm.supplierCertificateCode,
          invoiceReference: materialForm.invoiceReference,
          storageLocation: materialForm.storageLocation,
          inspectionNotes: materialForm.inspectionNotes,
          fscRelated: materialForm.fscRelated,
        } : receipt),
      }));
    } else {
      const receiptNumber = generateCode('RCV', data.materialReceipts.map((receipt) => receipt.receiptNumber), materialForm.receivedDate);
      const newReceipt: MaterialReceipt = {
        id: receiptNumber,
        receiptNumber,
        createdAt: new Date().toISOString(),
        receivedDate: materialForm.receivedDate,
        supplierId: linkedSupplier?.id ?? materialForm.supplierId,
        supplierName: linkedSupplier?.name ?? materialForm.supplierName,
        supplierBatchNumber: materialForm.supplierBatchNumber,
        internalRollCode: materialForm.internalRollCode,
        paperType: materialForm.paperType,
        gsm: materialForm.gsm,
        width: materialForm.width,
        quantityReceived: Number(materialForm.quantityReceived),
        quantityUnit: materialForm.quantityUnit,
        fscClaimType: materialForm.fscClaimType,
        supplierCertificateCode: materialForm.supplierCertificateCode,
        invoiceReference: materialForm.invoiceReference,
        storageLocation: materialForm.storageLocation,
        inspectionNotes: materialForm.inspectionNotes,
        fscRelated: materialForm.fscRelated,
      };
      setData((current) => ({ ...current, materialReceipts: [newReceipt, ...current.materialReceipts] }));
    }
    resetMaterialEditor();
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

      if (dispatchEditingId) {
        return {
          ...current,
          finishedGoodsStock: nextFinishedStock,
          dispatchRecords: current.dispatchRecords.map((record) => record.id === dispatchEditingId ? { ...record, ...payload } : record),
        };
      }

      const dispatchNumber = generateCode('DSP', current.dispatchRecords.map((record) => record.dispatchNumber), dispatchForm.dispatchDate);
      const newRecord: DispatchRecord = { id: dispatchNumber, dispatchNumber, createdAt: new Date().toISOString(), ...payload };
      return {
        ...current,
        finishedGoodsStock: nextFinishedStock,
        dispatchRecords: [newRecord, ...current.dispatchRecords],
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
      category: part.category,
      machineId: part.machineId,
      machineReference: part.machineReference,
      supplierId: part.supplierId,
      supplierName: part.supplierName,
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
    });
    setView('quotes');
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
      code: client.code,
      pricingTierId: client.pricingTierId,
      brandingDefault: client.brandingDefault,
      defaultMarginPercent: String(client.defaultMarginPercent),
      creditLimit: String(client.creditLimit),
      currentBalance: String(client.currentBalance),
      paymentTerms: client.paymentTerms,
      accountHold: client.accountHold,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      notes: client.notes,
      active: client.active,
    });
    setView('clients');
  }

  function editProduct(product: Product) {
    setProductEditingId(product.id);
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

  function exportReports() {
    downloadCsv(
      `jomopak-report-${reportFilters.month || 'custom-range'}.csv`,
      reportProductionRows.map((row) => ({
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
        FSC: row.fscRelated,
      })),
    );
  }

  return (
    authLoading ? (
      <div className="login-shell">
        <div className="login-card">
          <p className="muted">Loading access...</p>
        </div>
      </div>
    ) : !session || recoveryMode ? (
      <LoginPage recoveryMode={recoveryMode} onRecoveryComplete={clearRecoveryMode} />
    ) : (
    <AppLayout view={view} onViewChange={setView} navItems={navItems} profile={profile} onSignOut={handleSignOut}>
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
          quoteForm={calculatorQuoteForm}
          setQuoteForm={setCalculatorQuoteForm}
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
          onSave={handleSaveJob}
          onReset={resetJobEditor}
          jobFilters={jobFilters}
          setJobFilters={setJobFilters}
          filteredJobs={filteredJobs}
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
        />
      )}

      {view === 'products' && (
        <ProductsPage
          suppliers={data.suppliers}
          canSeeSupplier={profile?.role === 'admin' || profile?.role === 'ops'}
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

      {view === 'clients' && (
        <ClientsPage
          pricingTiers={data.pricingTiers}
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
        />
      )}

      {view === 'spares' && (
        <SparePartsPage
          machines={data.machines}
          suppliers={data.suppliers}
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
        />
      )}

      {view === 'materials' && (
        <MaterialsReceivingPage
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
          onEdit={editMaterial}
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
          onExport={exportReports}
          onPrint={() => window.print()}
        />
      )}
        </>
      )}
    </AppLayout>
    )
  );
}

export default App;
