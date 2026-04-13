import { buildSeedData } from '../data/seedData';
import {
  AppData,
  ArtworkRecord,
  CustomerStockRelease,
  DispatchRecord,
  JobCard,
  Machine,
  MaterialReceipt,
  PaperLog,
  PaperRate,
  ProductionLogEntry,
  QuoteEstimate,
  SparePart,
  StockChangeLog,
  Supplier,
  WasteEntry,
} from '../types';
import { getToday } from './calculations';

const STORAGE_KEY = 'jomopak-dashboard-data-v4';

function normalizeJob(raw: any): JobCard {
  const code = raw.jobNumber ?? raw.id;
  return {
    id: code,
    jobNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.jobDate ?? raw.date ?? getToday()}T08:00:00.000Z`).toISOString(),
    jobDate: raw.jobDate ?? raw.date ?? getToday(),
    dueDate: raw.dueDate ?? raw.jobDate ?? raw.date ?? getToday(),
    clientId: raw.clientId ?? '',
    pricingTierId: raw.pricingTierId ?? '',
    productId: raw.productId ?? '',
    customerName: raw.customerName ?? raw.customer ?? '',
    customerReference: raw.customerReference ?? '',
    productName: raw.productName ?? raw.product ?? '',
    description: raw.description ?? '',
    sizeSpec: raw.sizeSpec ?? raw.size ?? '',
    paperType: raw.paperType ?? '',
    gsm: raw.gsm ?? '',
    quantityPlanned: Number(raw.quantityPlanned ?? 0),
    quantityCompleted: Number(raw.quantityCompleted ?? 0),
    status: raw.status ?? 'Draft',
    artworkReceived: Boolean(raw.artworkReceived),
    proofSent: Boolean(raw.proofSent),
    approvalStatus: raw.approvalStatus ?? 'Not Sent',
    approvalDate: raw.approvalDate ?? '',
    changesRequested: raw.changesRequested ?? '',
    artworkNotes: raw.artworkNotes ?? '',
    reserveFromStock: Boolean(raw.reserveFromStock),
    reservedFinishedGoodsStockId: raw.reservedFinishedGoodsStockId ?? '',
    reservedFinishedGoodsStockNumber: raw.reservedFinishedGoodsStockNumber ?? '',
    reservedQuantity: Number(raw.reservedQuantity ?? 0),
    stockReservationStatus: raw.stockReservationStatus ?? 'Not Checked',
    dispatchStatus: raw.dispatchStatus ?? '',
    qualityNotes: raw.qualityNotes ?? '',
    notes: raw.notes ?? '',
    fscRelated: Boolean(raw.fscRelated),
  };
}

function normalizeSupplier(raw: any): Supplier {
  const contacts = Array.isArray(raw.contacts)
    ? raw.contacts.map((contact: any, index: number) => ({
        id: contact.id ?? `supplier-contact-${Date.now()}-${index}`,
        fullName: contact.fullName ?? contact.name ?? '',
        role: contact.role ?? '',
        phone: contact.phone ?? '',
        email: contact.email ?? '',
      }))
    : [];

  return {
    id: raw.id ?? `supplier-${Date.now()}`,
    name: raw.name ?? '',
    contactPerson: raw.contactPerson ?? '',
    phone: raw.phone ?? '',
    email: raw.email ?? '',
    contacts,
    address: raw.address ?? '',
    supplierType: raw.supplierType ?? 'General',
    certificateCode: raw.certificateCode ?? '',
    notes: raw.notes ?? '',
    active: raw.active !== false,
  };
}

function normalizePaperRate(raw: any): PaperRate {
  return {
    id: raw.id ?? `paper-${Date.now()}`,
    name: raw.name ?? '',
    supplierId: raw.supplierId ?? '',
    supplierName: raw.supplierName ?? '',
    paperType: raw.paperType ?? '',
    gsm: raw.gsm ?? '',
    pricePerTon: Number(raw.pricePerTon ?? 0),
    notes: raw.notes ?? '',
    active: raw.active !== false,
  };
}

function normalizeMachine(raw: any): Machine {
  return {
    id: raw.id ?? `machine-${Date.now()}`,
    name: raw.name ?? '',
    code: raw.code ?? '',
    department: raw.department ?? '',
    processType: raw.processType ?? '',
    status: raw.status ?? 'Active',
    notes: raw.notes ?? '',
    active: raw.active !== false,
  };
}

function normalizeQuoteEstimate(raw: any): QuoteEstimate {
  const code = raw.quoteNumber ?? raw.id ?? '';
  return {
    id: code,
    quoteNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.quoteDate ?? getToday()}T08:00:00.000Z`).toISOString(),
    quoteDate: raw.quoteDate ?? getToday(),
    clientId: raw.clientId ?? '',
    clientName: raw.clientName ?? '',
    productId: raw.productId ?? '',
    productName: raw.productName ?? '',
    pricingTierId: raw.pricingTierId ?? '',
    pricingTierName: raw.pricingTierName ?? '',
    paperRateId: raw.paperRateId ?? '',
    paperRateName: raw.paperRateName ?? '',
    costProfileId: raw.costProfileId ?? '',
    costProfileName: raw.costProfileName ?? '',
    quantity: Number(raw.quantity ?? 0),
    sizeSpec: raw.sizeSpec ?? '',
    handleType: raw.handleType ?? 'None',
    printMethod: raw.printMethod ?? 'Auto',
    colors: Number(raw.colors ?? 0),
    unitCost: Number(raw.unitCost ?? 0),
    quotedUnitPrice: Number(raw.quotedUnitPrice ?? 0),
    totalQuote: Number(raw.totalQuote ?? 0),
    status: raw.status ?? 'Draft',
    notes: raw.notes ?? '',
  };
}

function normalizeArtwork(raw: any): ArtworkRecord {
  const code = raw.artworkNumber ?? raw.id ?? '';
  return {
    id: code,
    artworkNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.artworkReceivedDate ?? getToday()}T08:00:00.000Z`).toISOString(),
    jobId: raw.jobId ?? '',
    jobNumber: raw.jobNumber ?? '',
    clientId: raw.clientId ?? '',
    clientName: raw.clientName ?? '',
    artworkReceivedDate: raw.artworkReceivedDate ?? '',
    proofSentDate: raw.proofSentDate ?? '',
    approvalDate: raw.approvalDate ?? '',
    stage: raw.stage ?? 'Awaiting Artwork',
    changesRequested: raw.changesRequested ?? '',
    notes: raw.notes ?? '',
  };
}

function normalizeCustomerStockRelease(raw: any): CustomerStockRelease {
  const code = raw.releaseNumber ?? raw.id ?? '';
  return {
    id: code,
    releaseNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.releaseDate ?? getToday()}T08:00:00.000Z`).toISOString(),
    releaseDate: raw.releaseDate ?? getToday(),
    clientId: raw.clientId ?? '',
    clientName: raw.clientName ?? '',
    finishedGoodsStockId: raw.finishedGoodsStockId ?? '',
    finishedGoodsStockNumber: raw.finishedGoodsStockNumber ?? '',
    jobId: raw.jobId ?? '',
    jobNumber: raw.jobNumber ?? '',
    quantityReleased: Number(raw.quantityReleased ?? 0),
    quantityUnit: raw.quantityUnit ?? 'units',
    destination: raw.destination ?? '',
    notes: raw.notes ?? '',
  };
}

function normalizeSparePart(raw: any): SparePart {
  const code = raw.partCode ?? raw.id ?? '';
  return {
    id: code,
    partCode: code,
    createdAt: raw.createdAt ?? new Date(`${raw.lastPurchaseDate ?? getToday()}T08:00:00.000Z`).toISOString(),
    partName: raw.partName ?? '',
    category: raw.category ?? '',
    machineId: raw.machineId ?? '',
    machineReference: raw.machineReference ?? '',
    supplierId: raw.supplierId ?? '',
    supplierName: raw.supplierName ?? '',
    quantityOnHand: Number(raw.quantityOnHand ?? 0),
    minimumStockLevel: Number(raw.minimumStockLevel ?? 0),
    reorderLevel: Number(raw.reorderLevel ?? 0),
    unitOfMeasure: raw.unitOfMeasure ?? 'units',
    unitCost: Number(raw.unitCost ?? 0),
    storageLocation: raw.storageLocation ?? '',
    lastPurchaseDate: raw.lastPurchaseDate ?? '',
    notes: raw.notes ?? '',
  };
}

function normalizeMaterialReceipt(raw: any): MaterialReceipt {
  const code = raw.receiptNumber ?? raw.id ?? '';
  return {
    id: code,
    receiptNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.receivedDate ?? getToday()}T08:00:00.000Z`).toISOString(),
    receivedDate: raw.receivedDate ?? getToday(),
    supplierId: raw.supplierId ?? '',
    supplierName: raw.supplierName ?? '',
    supplierBatchNumber: raw.supplierBatchNumber ?? '',
    internalRollCode: raw.internalRollCode ?? raw.paperCode ?? '',
    paperType: raw.paperType ?? '',
    gsm: raw.gsm ?? '',
    width: raw.width ?? '',
    quantityReceived: Number(raw.quantityReceived ?? 0),
    quantityUnit: raw.quantityUnit ?? 'kg',
    fscClaimType: raw.fscClaimType ?? (raw.fscRelated ? 'FSC Mix' : 'None'),
    supplierCertificateCode: raw.supplierCertificateCode ?? '',
    invoiceReference: raw.invoiceReference ?? '',
    storageLocation: raw.storageLocation ?? '',
    inspectionNotes: raw.inspectionNotes ?? '',
    fscRelated: Boolean(raw.fscRelated),
  };
}

function normalizeProductionLog(raw: any): ProductionLogEntry {
  const code = raw.logNumber ?? raw.id ?? '';
  return {
    id: code,
    logNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.logDate ?? getToday()}T08:00:00.000Z`).toISOString(),
    logDate: raw.logDate ?? getToday(),
    logType: raw.logType ?? 'Bag Making',
    jobId: raw.jobId ?? '',
    jobNumber: raw.jobNumber ?? raw.jobId ?? '',
    customerName: raw.customerName ?? '',
    operatorName: raw.operatorName ?? raw.enteredBy ?? '',
    machineId: raw.machineId ?? '',
    machine: raw.machine ?? '',
    sourceMaterialId: raw.sourceMaterialId ?? '',
    sourceMaterialCode: raw.sourceMaterialCode ?? raw.paperCode ?? '',
    setupTimeMinutes: Number(raw.setupTimeMinutes ?? 0),
    notes: raw.notes ?? '',
    operatorSignature: raw.operatorSignature ?? '',
    fscRelated: Boolean(raw.fscRelated),
    rollCode: raw.rollCode ?? '',
    height: raw.height ?? '',
    gusset: raw.gusset ?? '',
    handleType: raw.handleType ?? '',
    goodBags: Number(raw.goodBags ?? 0),
    rejectBags: Number(raw.rejectBags ?? 0),
    heightChange: raw.heightChange ?? '',
    printingMethod: raw.printingMethod ?? '',
    bagSize: raw.bagSize ?? raw.sizeSpec ?? '',
    numberOfColors: Number(raw.numberOfColors ?? 0),
    quantityPrinted: Number(raw.quantityPrinted ?? 0),
    materialSourceCode: raw.materialSourceCode ?? '',
    rollWidth: raw.rollWidth ?? '',
    metersKgPrinted: Number(raw.metersKgPrinted ?? 0),
    rejectMetersKg: Number(raw.rejectMetersKg ?? 0),
    parentRollCode: raw.parentRollCode ?? '',
    parentWidth: raw.parentWidth ?? '',
    targetChildWidth: raw.targetChildWidth ?? '',
    numberOfChildRolls: Number(raw.numberOfChildRolls ?? 0),
    childDiameter: raw.childDiameter ?? '',
    totalWasteKg: Number(raw.totalWasteKg ?? 0),
    bladeChange: raw.bladeChange ?? '',
  };
}

function normalizeWaste(raw: any): WasteEntry {
  const code = raw.wasteNumber ?? raw.id;
  return {
    id: code,
    wasteNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.wasteDate ?? raw.date ?? getToday()}T08:00:00.000Z`).toISOString(),
    wasteDate: raw.wasteDate ?? raw.date ?? getToday(),
    jobId: raw.jobId ?? '',
    jobNumber: raw.jobNumber ?? raw.jobId ?? '',
    customerName: raw.customerName ?? '',
    productName: raw.productName ?? '',
    productionLogId: raw.productionLogId ?? '',
    productionLogNumber: raw.productionLogNumber ?? '',
    wasteQuantity: Number(raw.wasteQuantity ?? raw.wasteQty ?? 0),
    wasteUnit: raw.wasteUnit ?? 'kg',
    wasteReason: raw.wasteReason ?? 'Other',
    notes: raw.notes ?? '',
    enteredBy: raw.enteredBy ?? '',
    fscRelated: Boolean(raw.fscRelated),
  };
}

function normalizePaper(raw: any): PaperLog {
  const code = raw.paperLogNumber ?? raw.id;
  return {
    id: code,
    paperLogNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.logDate ?? raw.date ?? getToday()}T08:00:00.000Z`).toISOString(),
    logDate: raw.logDate ?? raw.date ?? getToday(),
    jobId: raw.jobId ?? '',
    jobNumber: raw.jobNumber ?? raw.jobId ?? '',
    customerName: raw.customerName ?? '',
    materialReceiptId: raw.materialReceiptId ?? '',
    materialReceiptNumber: raw.materialReceiptNumber ?? '',
    paperType: raw.paperType ?? '',
    gsm: raw.gsm ?? '',
    width: raw.width ?? '',
    quantityUsed: Number(raw.quantityUsed ?? raw.qtyUsed ?? 0),
    quantityUnit: raw.quantityUnit ?? 'kg',
    paperCode: raw.paperCode ?? '',
    notes: raw.notes ?? '',
    fscRelated: Boolean(raw.fscRelated),
  };
}

function normalizeDispatch(raw: any): DispatchRecord {
  const code = raw.dispatchNumber ?? raw.id ?? '';
  return {
    id: code,
    dispatchNumber: code,
    createdAt: raw.createdAt ?? new Date(`${raw.dispatchDate ?? getToday()}T08:00:00.000Z`).toISOString(),
    dispatchDate: raw.dispatchDate ?? getToday(),
    jobId: raw.jobId ?? '',
    jobNumber: raw.jobNumber ?? raw.jobId ?? '',
    customerName: raw.customerName ?? '',
    finishedGoodsStockId: raw.finishedGoodsStockId ?? '',
    finishedGoodsStockNumber: raw.finishedGoodsStockNumber ?? '',
    quantityDispatched: Number(raw.quantityDispatched ?? 0),
    quantityUnit: raw.quantityUnit ?? 'units',
    labelReference: raw.labelReference ?? '',
    deliveryReference: raw.deliveryReference ?? '',
    issueNotes: raw.issueNotes ?? '',
    fscRelated: Boolean(raw.fscRelated),
  };
}

function normalizeStockChangeLog(raw: any): StockChangeLog {
  return {
    id: raw.id ?? `stock-log-${Date.now()}`,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    finishedGoodsStockId: raw.finishedGoodsStockId ?? '',
    stockNumber: raw.stockNumber ?? '',
    productName: raw.productName ?? '',
    action: raw.action ?? 'updated',
    changedByUserId: raw.changedByUserId ?? '',
    changedByName: raw.changedByName ?? '',
    previousQuantityOnHand: Number(raw.previousQuantityOnHand ?? 0),
    nextQuantityOnHand: Number(raw.nextQuantityOnHand ?? 0),
    previousQuantityReserved: Number(raw.previousQuantityReserved ?? 0),
    nextQuantityReserved: Number(raw.nextQuantityReserved ?? 0),
    notes: raw.notes ?? '',
  };
}

export function saveData(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getData<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export function updateData<T extends { id: string }>(key: string, id: string, newData: Partial<T>): T[] {
  const current = getData<T[]>(key, []);
  const updated = current.map((item) => (item.id === id ? { ...item, ...newData } : item));
  saveData(key, updated);
  return updated;
}

export function loadAppData(): AppData {
  const saved =
    localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem('jomopak-dashboard-data-v2') ??
    localStorage.getItem('jomopak-dashboard-data-v1');

  if (!saved) {
    return buildSeedData();
  }

  try {
    const parsed = JSON.parse(saved) as Partial<AppData>;
    return {
      suppliers: (parsed.suppliers ?? []).map(normalizeSupplier),
      machines: (parsed.machines ?? []).map(normalizeMachine),
      quoteEstimates: (parsed.quoteEstimates ?? []).map(normalizeQuoteEstimate),
      artworkRecords: (parsed.artworkRecords ?? []).map(normalizeArtwork),
      customerStockReleases: (parsed.customerStockReleases ?? []).map(normalizeCustomerStockRelease),
      paperRates: (parsed.paperRates ?? []).map(normalizePaperRate),
      costProfiles: parsed.costProfiles ?? [],
      pricingTiers: parsed.pricingTiers ?? [],
      clients: parsed.clients ?? [],
      products: (parsed.products ?? []).map((product: any) => ({
        id: product.id ?? `product-${Date.now()}`,
        name: product.name ?? '',
        sku: product.sku ?? '',
        category: product.category ?? 'Other Packaging',
        supplyType: product.supplyType ?? 'Purchased',
        defaultSupplierId: product.defaultSupplierId ?? '',
        defaultSupplierName: product.defaultSupplierName ?? '',
        brandingAllowed: Boolean(product.brandingAllowed),
        defaultUnit: product.defaultUnit ?? 'units',
        defaultPaperType: product.defaultPaperType ?? '',
        defaultGsm: product.defaultGsm ?? '',
        notes: product.notes ?? '',
        active: product.active !== false,
      })),
      jobs: (parsed.jobs ?? []).map(normalizeJob),
      finishedGoodsStock: parsed.finishedGoodsStock ?? [],
      spareParts: (parsed.spareParts ?? []).map(normalizeSparePart),
      materialReceipts: (parsed.materialReceipts ?? []).map(normalizeMaterialReceipt),
      productionLogs: (parsed.productionLogs ?? []).map(normalizeProductionLog),
      wasteEntries: (parsed.wasteEntries ?? []).map(normalizeWaste),
      paperLogs: (parsed.paperLogs ?? []).map(normalizePaper),
      dispatchRecords: (parsed.dispatchRecords ?? []).map(normalizeDispatch),
      stockChangeLogs: (parsed.stockChangeLogs ?? []).map(normalizeStockChangeLog),
    };
  } catch {
    return buildSeedData();
  }
}

export function saveAppData(data: AppData): void {
  saveData(STORAGE_KEY, data);
}
