import { useEffect, useMemo, useState } from 'react';
import { FlagBadge, StatusBadge } from '../../components/Badge';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { QuickAddCard } from '../../components/QuickAddCard';
import { SectionTitle } from '../../components/SectionTitle';
import { BulkActionsBar } from '../../components/BulkActionsBar';
import { HistoryDrawerTarget } from '../../components/HistoryDrawer';
import { EditFormGuard } from '../../components/EditFormGuard';
import { SavedViewsBar } from '../../components/SavedViewsBar';
import { SavedView, useSavedViews } from '../../hooks/useSavedViews';
import { downloadCsv } from '../../utils/csvExport';
import { JobDetailPanel } from './JobDetailPanel';
import {
  buildBlankChangeoverChecklist,
  buildBlankQcPlan,
  CHANGEOVER_CHECKLIST_KEYS,
  CHANGEOVER_CHECKLIST_LABELS,
  ChangeoverChecklistItem,
  Client,
  CleaningLogEntry,
  DispatchRecord,
  FinishedGoodsStock,
  FoodContactLevel,
  FoodSafeMaterial,
  FOOD_CONTACT_LEVEL_LABELS,
  getLatestPassingClean,
  isChangeoverComplete,
  isFoodPackagingLevel,
  isQcStagePassed,
  JobCard,
  JobFilters,
  JobFormState,
  Machine,
  MaterialReceipt,
  PaperLog,
  PricingTier,
  Product,
  ProductionLogEntry,
  QC_CHECK_KEYS,
  QC_CHECK_LABELS,
  QC_STAGES,
  QC_STAGE_LABELS,
  QcCheckKey,
  QcCheckResult,
  QcStage,
  QcStageRecord,
  requiresDirectContactApproval,
  validateJobFoodSafety,
  WasteEntry,
} from '../../types';
import { JOB_STATUSES, formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface JobCardsPageProps {
  monthOptions: string[];
  clients: Client[];
  products: Product[];
  pricingTiers: PricingTier[];
  finishedGoodsStock: FinishedGoodsStock[];
  /** Phase 62 — pickable tooling so sales/production can record which
   *  die + stereo are used on this job (and inherit "client already
   *  owns one" suggestions). */
  tooling?: Array<{ id: string; code: string; name: string; clientId: string; toolType: 'die' | 'stereo'; active: boolean }>;
  jobForm: JobFormState;
  setJobForm: (value: JobFormState) => void;
  jobEditingId: string | null;
  jobMessage: string;
  jobSaveCount: number;
  onSave: () => void;
  onReset: () => void;
  jobFilters: JobFilters;
  setJobFilters: (value: JobFilters) => void;
  filteredJobs: JobCard[];
  /**
   * The full job list (unfiltered). Quick Add uses this to look up the most
   * recent job for the selected client so it can pre-fill paper / spec / pricing
   * defaults — the client's "last job" almost always lives outside the current
   * filter window, so we can't rely on `filteredJobs`.
   */
  allJobs: JobCard[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  selectedJobMaterials: MaterialReceipt[];
  selectedJobProductionLogs: ProductionLogEntry[];
  selectedJobWasteEntries: WasteEntry[];
  selectedJobPaperLogs: PaperLog[];
  selectedJobDispatchRecords: DispatchRecord[];
  onEdit: (job: JobCard) => void;
  onDuplicate: (job: JobCard) => void;
  onQuickAddProduction: (job: JobCard) => void;
  onQuickAddWaste: (job: JobCard) => void;
  onQuickAddPaper: (job: JobCard) => void;
  onQuickAddDispatch: (job: JobCard) => void;
  /**
   * Optional. When provided, the detail panel renders a "History" pill that
   * opens the global HistoryDrawer for this record.
   */
  onOpenHistory?: (target: HistoryDrawerTarget) => void;
  /** Used to namespace saved views per user in localStorage. Optional. */
  userId?: string;
  /** Current authed user — used for the edit-lock presence banner. */
  currentUser?: { id?: string; name?: string };
  /**
   * Promote this job to a Delivery Note. Caller pre-fills the delivery note
   * form with client + product + quantity from the job and switches view.
   */
  onCreateDelivery?: (job: JobCard) => void;
  /**
   * Promote this job directly to an Invoice (skip delivery note). Used for
   * direct-billed clients where dispatch happens after invoicing.
   */
  onCreateInvoice?: (job: JobCard) => void;
  /**
   * Approved food-safe materials available to select on the job. Optional so
   * the page renders correctly during the food-safety rollout.
   */
  foodSafeMaterials?: FoodSafeMaterial[];
  /** Machines available for assignment. Optional. */
  machines?: Machine[];
  /** Recent cleaning logs — used by the food-safety section to display the gate state. */
  cleaningLogs?: CleaningLogEntry[];
  /** Open the printable Food-Safe Certificate overlay for a job. Optional. */
  onPrintFoodSafeCertificate?: (job: JobCard) => void;
  /** Open the printable Job Card overlay for the foreman. Optional. */
  onPrintJobCard?: (job: JobCard) => void;
  /** Mark the job as Completed in one click (close it out). */
  onMarkComplete?: (job: JobCard) => void;
}

export function JobCardsPage(props: JobCardsPageProps) {
  const {
    monthOptions,
    clients,
    products,
    pricingTiers,
    finishedGoodsStock,
    tooling = [],
    jobForm,
    setJobForm,
    jobEditingId,
    jobMessage,
    jobSaveCount,
    onSave,
    onReset,
    jobFilters,
    setJobFilters,
    filteredJobs,
    allJobs,
    selectedJobId,
    onSelectJob,
    selectedJobMaterials,
    selectedJobProductionLogs,
    selectedJobWasteEntries,
    selectedJobPaperLogs,
    selectedJobDispatchRecords,
    onEdit,
    onDuplicate,
    onQuickAddProduction,
    onQuickAddWaste,
    onQuickAddPaper,
    onQuickAddDispatch,
    onOpenHistory,
    userId,
    onCreateDelivery,
    onCreateInvoice,
    foodSafeMaterials = [],
    machines = [],
    cleaningLogs = [],
    onPrintFoodSafeCertificate,
    onPrintJobCard,
    onMarkComplete,
    currentUser,
  } = props;
  const [mode, setMode] = useState<'list' | 'quick' | 'form'>('list');
  // Tracks which client we last auto-filled defaults from in Quick Add, so we
  // only stomp on the form once per client selection (not on every keystroke).
  const [lastPrefilledClientId, setLastPrefilledClientId] = useState<string>('');

  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) ?? null;

  // Saved views — built-ins ship with sensible presets. Users can add their own
  // via the "+ Save current" button. See useSavedViews / SavedViewsBar.
  const builtInJobViews: SavedView<JobFilters>[] = useMemo(
    () => [
      { id: 'jobs:builtin:all', name: 'All', filters: { search: '', month: '', status: '', customer: '', fsc: 'all' }, createdAt: '1970-01-01', builtIn: true },
      { id: 'jobs:builtin:in-production', name: 'In production', filters: { search: '', month: '', status: 'In Production', customer: '', fsc: 'all' }, createdAt: '1970-01-01', builtIn: true },
      { id: 'jobs:builtin:awaiting-approval', name: 'Awaiting approval', filters: { search: '', month: '', status: 'Awaiting Approval', customer: '', fsc: 'all' }, createdAt: '1970-01-01', builtIn: true },
      { id: 'jobs:builtin:fsc', name: 'FSC only', filters: { search: '', month: '', status: '', customer: '', fsc: 'yes' }, createdAt: '1970-01-01', builtIn: true },
    ],
    [],
  );
  const { views: jobViews, saveView: saveJobView, deleteView: deleteJobView } = useSavedViews<JobFilters>(
    'jobs',
    userId || 'default',
    builtInJobViews,
  );
  const isViewActive = (view: SavedView<JobFilters>) =>
    JSON.stringify(view.filters) === JSON.stringify(jobFilters);

  // Bulk-select state — kept local to the page so the surrounding App tree
  // doesn't have to know about it. We store as a Set for O(1) toggle, and
  // convert to a plain array when surfacing actions.
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const allFilteredSelected = filteredJobs.length > 0 && filteredJobs.every((job) => selectedRowIds.has(job.id));
  function toggleRow(id: string) {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAllFiltered() {
    setSelectedRowIds((prev) => {
      if (allFilteredSelected) {
        // Deselect anything currently in the filtered view, leaving any
        // selections from previous filter states alone.
        const next = new Set(prev);
        for (const job of filteredJobs) next.delete(job.id);
        return next;
      }
      const next = new Set(prev);
      for (const job of filteredJobs) next.add(job.id);
      return next;
    });
  }
  function clearSelection() { setSelectedRowIds(new Set()); }
  function exportSelectedCsv() {
    const rows = filteredJobs
      .filter((job) => selectedRowIds.has(job.id))
      .map((job) => ({
        Job: job.jobNumber,
        Customer: job.customerName,
        Product: job.productName,
        Status: job.status,
        Stock: job.stockReservationStatus,
        Proofing: job.approvalStatus,
        Dispatch: job.dispatchStatus,
        Planned: job.quantityPlanned,
        Completed: job.quantityCompleted,
        FSC: job.fscRelated ? 'Yes' : 'No',
        DueDate: job.dueDate || '',
      }));
    if (rows.length === 0) return;
    downloadCsv(`jobs-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  useEffect(() => {
    if (jobEditingId) {
      setMode('form');
    }
  }, [jobEditingId]);

  useEffect(() => {
    if (jobSaveCount > 0) {
      setMode('list');
    }
  }, [jobSaveCount]);

  function handleStartQuickAdd() {
    onReset();
    setLastPrefilledClientId('');
    setMode('quick');
  }

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(job: JobCard) {
    onEdit(job);
    setMode('form');
  }

  function handleSwitchToFullForm() {
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setLastPrefilledClientId('');
    setMode('list');
  }

  // ---- smart defaults for returning customers ----
  // When the user picks a client in Quick Add, look up their most recent job
  // and pre-fill paper / spec / pricing fields. Most repeat orders are the
  // exact same product, so this saves a lot of typing — but the user can
  // still override any field afterwards. We track lastPrefilledClientId so we
  // only auto-fill once per client change, not on every render.
  function handleQuickAddClientChange(nextClientId: string) {
    const client = clients.find((entry) => entry.id === nextClientId) ?? null;
    const previousJobs = allJobs
      .filter((job) => job.clientId === nextClientId)
      .sort((a, b) => (b.jobDate || '').localeCompare(a.jobDate || ''));
    const lastJob = previousJobs[0];

    setJobForm({
      ...jobForm,
      clientId: nextClientId,
      customerName: client?.name ?? jobForm.customerName,
      pricingTierId: lastJob?.pricingTierId || client?.pricingTierId || jobForm.pricingTierId,
      // Spec defaults from the last job — only fill if we actually have one.
      productId: lastJob?.productId || jobForm.productId,
      productName: lastJob?.productName || jobForm.productName,
      productCategory: (lastJob?.productCategory as JobFormState['productCategory']) || jobForm.productCategory,
      sizeSpec: lastJob?.sizeSpec || jobForm.sizeSpec,
      paperType: lastJob?.paperType || jobForm.paperType,
      gsm: lastJob?.gsm ? String(lastJob.gsm) : jobForm.gsm,
      fscRelated: lastJob ? lastJob.fscRelated : jobForm.fscRelated,
      foodContactLevel: lastJob ? lastJob.foodContactLevel ?? 'NonFood' : jobForm.foodContactLevel,
      foodSafeMaterialIds: lastJob ? lastJob.foodSafeMaterialIds ?? [] : jobForm.foodSafeMaterialIds,
      printRequired: lastJob ? lastJob.printRequired : jobForm.printRequired,
      printMethod: (lastJob?.printMethod as JobFormState['printMethod']) || jobForm.printMethod,
      colorCount: lastJob?.colorCount != null ? String(lastJob.colorCount) : jobForm.colorCount,
    });
    setLastPrefilledClientId(nextClientId);
  }

  // What we pre-filled from, surfaced as a hint under the Quick Add body.
  const prefillSourceJob = lastPrefilledClientId
    ? allJobs
        .filter((job) => job.clientId === lastPrefilledClientId)
        .sort((a, b) => (b.jobDate || '').localeCompare(a.jobDate || ''))[0]
    : null;

  // Searchable option lists for the comboboxes.
  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((client) => ({
      value: client.id,
      label: client.name,
      sublabel: client.companyName || client.code || undefined,
    })),
    [clients],
  );
  const productOptions: ComboboxOption[] = useMemo(
    () => products.map((product) => ({
      value: product.id,
      label: product.name,
      sublabel: [product.category, product.sku].filter(Boolean).join(' · ') || undefined,
    })),
    [products],
  );
  const stockOptions: ComboboxOption[] = useMemo(
    () => finishedGoodsStock.map((item) => ({
      value: item.id,
      label: `${item.stockNumber} · ${item.productName}`,
      sublabel: `${formatNumber(item.quantityAvailable)} ${item.quantityUnit} available`,
    })),
    [finishedGoodsStock],
  );

  // ---- required-field gating ----
  // Keep the bar low so capture isn't slowed down. The job number is generated
  // on save, so the truly indispensable fields are: when, who for, what, how
  // many. Everything else can be filled in as the job moves through production.
  const basicsMissing: string[] = [];
  if (!jobForm.jobDate) basicsMissing.push('Job date');
  if (!jobForm.dueDate) basicsMissing.push('Due date');

  const customerMissing: string[] = [];
  if (!jobForm.clientId && !jobForm.customerName.trim()) customerMissing.push('Client or customer name');

  const productMissing: string[] = [];
  if (!jobForm.productId && !jobForm.productName.trim()) productMissing.push('Product');
  if (!String(jobForm.quantityPlanned).trim() || Number(jobForm.quantityPlanned) <= 0) {
    productMissing.push('Quantity planned');
  }

  const printMissing: string[] = [];
  if (jobForm.printRequired) {
    if (!jobForm.printMethod || jobForm.printMethod === 'Plain') printMissing.push('Print method');
  }

  const stockMissing: string[] = [];
  if (jobForm.reserveFromStock) {
    if (!jobForm.reservedFinishedGoodsStockId) stockMissing.push('Stock batch');
    if (!String(jobForm.reservedQuantity).trim() || Number(jobForm.reservedQuantity) <= 0) {
      stockMissing.push('Reserved quantity');
    }
  }

  const sections: FormWizardSection[] = [
    {
      key: 'basics',
      title: 'Job basics',
      subtitle: 'When the job was booked, when it\'s due, and the references that tie it back to lead, quote, and invoice.',
      missingRequired: basicsMissing,
      body: (
        <div className="form-grid">
          <label>
            <span>Job date<RequiredMarker /></span>
            <input type="date" value={jobForm.jobDate} onChange={(event) => setJobForm({ ...jobForm, jobDate: event.target.value })} />
          </label>
          <label>
            <span>Due date<RequiredMarker /></span>
            <input type="date" value={jobForm.dueDate} onChange={(event) => setJobForm({ ...jobForm, dueDate: event.target.value })} />
          </label>
          <label><span>Lead number</span><input value={jobForm.leadNumber} onChange={(event) => setJobForm({ ...jobForm, leadNumber: event.target.value })} placeholder="LED-202604-001" /></label>
          <label><span>Quote number</span><input value={jobForm.quoteNumber} onChange={(event) => setJobForm({ ...jobForm, quoteNumber: event.target.value })} placeholder="QTE-..." /></label>
          <label><span>QuickBooks estimate #</span><input value={jobForm.quickbooksEstimateNumber} onChange={(event) => setJobForm({ ...jobForm, quickbooksEstimateNumber: event.target.value })} /></label>
          <label><span>Invoice number</span><input value={jobForm.invoiceNumber} onChange={(event) => setJobForm({ ...jobForm, invoiceNumber: event.target.value })} /></label>
          <label><span>Captured by</span><input value={jobForm.capturedBy} onChange={(event) => setJobForm({ ...jobForm, capturedBy: event.target.value })} /></label>
          <label><span>Released by</span><input value={jobForm.releasedBy} onChange={(event) => setJobForm({ ...jobForm, releasedBy: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'customer',
      title: 'Customer & commercial',
      subtitle: 'Who the job is for, the pricing tier, the order value, and where it sits commercially before production starts.',
      missingRequired: customerMissing,
      body: (
        <div className="form-grid">
          <label>
            <span>Client<RequiredMarker /></span>
            <Combobox
              options={clientOptions}
              value={jobForm.clientId}
              onChange={(value) => setJobForm({ ...jobForm, clientId: value })}
              placeholder="Search clients…"
              emptyMessage="No matching clients"
            />
          </label>
          <label><span>Pricing tier</span><select value={jobForm.pricingTierId} onChange={(event) => setJobForm({ ...jobForm, pricingTierId: event.target.value })}><option value="">Select pricing tier</option>{pricingTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></label>
          <label>
            <span>Customer name<RequiredMarker /></span>
            <input value={jobForm.customerName} onChange={(event) => setJobForm({ ...jobForm, customerName: event.target.value })} placeholder="Auto-fills from client" />
          </label>
          <label><span>Customer reference</span><input value={jobForm.customerReference} onChange={(event) => setJobForm({ ...jobForm, customerReference: event.target.value })} /></label>
          <label><span>Order value</span><input type="number" min="0" value={jobForm.orderValue} onChange={(event) => setJobForm({ ...jobForm, orderValue: event.target.value })} /></label>
          <label><span>Payment basis</span><select value={jobForm.paymentRequirement} onChange={(event) => setJobForm({ ...jobForm, paymentRequirement: event.target.value as JobFormState['paymentRequirement'] })}><option>50% Deposit</option><option>Full Payment</option><option>Credit Terms</option></select></label>
          <label><span>Payment / credit status</span><select value={jobForm.paymentStatus} onChange={(event) => setJobForm({ ...jobForm, paymentStatus: event.target.value as JobFormState['paymentStatus'] })}><option>Pending</option><option>50% Paid</option><option>Full Payment Received</option><option>Credit Limit Applied</option></select></label>
          <label><span>Credit check</span><select value={jobForm.creditCheckStatus} onChange={(event) => setJobForm({ ...jobForm, creditCheckStatus: event.target.value as JobFormState['creditCheckStatus'] })}><option>Not Required</option><option>Within Limit</option><option>Blocked</option></select></label>
          <label><span>Available credit at approval</span><input type="number" min="0" value={jobForm.availableCreditAtApproval} onChange={(event) => setJobForm({ ...jobForm, availableCreditAtApproval: event.target.value })} /></label>
          <label><span>Commercial release</span><select value={jobForm.commercialReleaseStatus} onChange={(event) => setJobForm({ ...jobForm, commercialReleaseStatus: event.target.value as JobFormState['commercialReleaseStatus'] })}><option>Pending</option><option>Accepted</option><option>Invoiced</option><option>Cleared for Production</option></select></label>
        </div>
      ),
    },
    {
      key: 'product',
      title: 'Product specification',
      subtitle: 'What you\'re making and how many.',
      missingRequired: productMissing,
      body: (
        <div className="form-grid">
          <label>
            <span>Product<RequiredMarker /></span>
            <Combobox
              options={productOptions}
              value={jobForm.productId}
              onChange={(value) => setJobForm({ ...jobForm, productId: value })}
              placeholder="Search products…"
              emptyMessage="No matching products"
            />
          </label>
          <label><span>Product / bag type</span><input value={jobForm.productName} onChange={(event) => setJobForm({ ...jobForm, productName: event.target.value })} placeholder="Auto-fills from product" /></label>
          <label><span>Product category</span><select value={jobForm.productCategory} onChange={(event) => setJobForm({ ...jobForm, productCategory: event.target.value as JobFormState['productCategory'] })}><option>Paper Bags</option><option>Paper Cups</option><option>Food Boxes</option><option>Wet Wipes</option><option>Other Packaging</option></select></label>
          <label><span>Size / specification</span><input value={jobForm.sizeSpec} onChange={(event) => setJobForm({ ...jobForm, sizeSpec: event.target.value })} /></label>
          <label className="full-span"><span>Product description</span><textarea value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} /></label>
          <label><span>Supply format</span><select value={jobForm.supplyFormat} onChange={(event) => setJobForm({ ...jobForm, supplyFormat: event.target.value as JobFormState['supplyFormat'] })}><option>Boxes</option><option>Flat Packed</option><option>Bundles</option><option>Palletized</option><option>Loose</option></select></label>
          <label>
            <span>Quantity planned<RequiredMarker /></span>
            <input type="number" min="0" value={jobForm.quantityPlanned} onChange={(event) => setJobForm({ ...jobForm, quantityPlanned: event.target.value })} />
          </label>
          <label><span>Quantity completed</span><input type="number" min="0" value={jobForm.quantityCompleted} onChange={(event) => setJobForm({ ...jobForm, quantityCompleted: event.target.value })} /></label>
          <label><span>Status</span><select value={jobForm.status} onChange={(event) => setJobForm({ ...jobForm, status: event.target.value as JobCard['status'] })}>{JOB_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        </div>
      ),
    },
    {
      key: 'materials',
      title: 'Paper & materials',
      subtitle: 'Paper type, weight, quantity, and whether stock is allocated.',
      body: (
        <div className="form-grid">
          <label><span>Paper type</span><input value={jobForm.paperType} onChange={(event) => setJobForm({ ...jobForm, paperType: event.target.value })} /></label>
          <label><span>GSM</span><input value={jobForm.gsm} onChange={(event) => setJobForm({ ...jobForm, gsm: event.target.value })} /></label>
          <label><span>Paper quantity required</span><input type="number" min="0" value={jobForm.paperQuantityRequired} onChange={(event) => setJobForm({ ...jobForm, paperQuantityRequired: event.target.value })} /></label>
          <label><span>Paper quantity unit</span><select value={jobForm.paperQuantityUnit} onChange={(event) => setJobForm({ ...jobForm, paperQuantityUnit: event.target.value as JobFormState['paperQuantityUnit'] })}><option value="kg">kg</option><option value="rolls">rolls</option><option value="sheets">sheets</option><option value="units">units</option></select></label>
          <label><span>Paper allocation</span><select value={jobForm.paperAllocationStatus} onChange={(event) => setJobForm({ ...jobForm, paperAllocationStatus: event.target.value as JobFormState['paperAllocationStatus'] })}><option>Not Checked</option><option>In Stock</option><option>Order Required</option><option>Ordered</option></select></label>
        </div>
      ),
    },
    {
      key: 'print',
      title: 'Print',
      subtitle: 'Print method and colour count. Skipped for plain / no-print jobs.',
      contextActive: jobForm.printRequired,
      missingRequired: printMissing,
      contextPrompt: (
        <>
          <p className="muted">This job is marked as plain / no-print. Enable to specify print method and colours.</p>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={jobForm.printRequired}
              onChange={(event) => setJobForm({
                ...jobForm,
                printRequired: event.target.checked,
                printMethod: event.target.checked ? jobForm.printMethod : 'Plain',
                colorCount: event.target.checked ? jobForm.colorCount : '0',
              })}
            />
            Print required
          </label>
        </>
      ),
      body: (
        <div className="form-grid">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={jobForm.printRequired}
              onChange={(event) => setJobForm({
                ...jobForm,
                printRequired: event.target.checked,
                printMethod: event.target.checked ? jobForm.printMethod : 'Plain',
                colorCount: event.target.checked ? jobForm.colorCount : '0',
              })}
            />
            Print required
          </label>
          <label>
            <span>Print method<RequiredMarker /></span>
            <select value={jobForm.printMethod} onChange={(event) => setJobForm({ ...jobForm, printMethod: event.target.value as JobFormState['printMethod'] })}>
              <option>Plain / No Print</option>
              <option>Auto</option>
              <option>Screen Print</option>
              <option>Flexo</option>
              <option>Digital Print</option>
              <option>Litho</option>
            </select>
          </label>
          <label><span>Number of colours</span><input type="number" min="0" value={jobForm.colorCount} onChange={(event) => setJobForm({ ...jobForm, colorCount: event.target.value })} /></label>
          <label className="full-span"><span>Print notes</span><textarea value={jobForm.printNotes} onChange={(event) => setJobForm({ ...jobForm, printNotes: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'artwork',
      title: 'Artwork & proofing',
      subtitle: 'Artwork status, proofs, sign-offs, and the back-and-forth with the designer / customer.',
      contextActive: jobForm.printRequired,
      contextPrompt: (
        <p className="muted">Plain jobs don't need artwork. Enable "Print required" in the Print section above to fill this in.</p>
      ),
      body: (
        <div className="form-grid">
          <label className="checkbox-row"><input type="checkbox" checked={jobForm.artworkReceived} onChange={(event) => setJobForm({ ...jobForm, artworkReceived: event.target.checked })} />Artwork received</label>
          <label><span>Artwork readiness</span><select value={jobForm.artworkPreparationStatus} onChange={(event) => setJobForm({ ...jobForm, artworkPreparationStatus: event.target.value as JobFormState['artworkPreparationStatus'] })}><option>Print Ready</option><option>Ready but Not Print Ready</option><option>Needs Design</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={jobForm.proofSent} onChange={(event) => setJobForm({ ...jobForm, proofSent: event.target.checked })} />Proof sent</label>
          <label><span>Approval status</span><select value={jobForm.approvalStatus} onChange={(event) => setJobForm({ ...jobForm, approvalStatus: event.target.value as JobFormState['approvalStatus'] })}><option>Not Sent</option><option>Awaiting Approval</option><option>Approved</option><option>Changes Requested</option></select></label>
          <label><span>Approval date</span><input type="date" value={jobForm.approvalDate} onChange={(event) => setJobForm({ ...jobForm, approvalDate: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={jobForm.addElementsRequired} onChange={(event) => setJobForm({ ...jobForm, addElementsRequired: event.target.checked })} />Add other elements</label>
          <label className="checkbox-row"><input type="checkbox" checked={jobForm.colorChangesRequired} onChange={(event) => setJobForm({ ...jobForm, colorChangesRequired: event.target.checked })} />Change colours</label>
          <label className="full-span"><span>Artwork brief / required changes</span><textarea value={jobForm.artworkChangeSummary} onChange={(event) => setJobForm({ ...jobForm, artworkChangeSummary: event.target.value })} /></label>
          <label><span>Given to designer / design date</span><input type="date" value={jobForm.artworkAssignedDate} onChange={(event) => setJobForm({ ...jobForm, artworkAssignedDate: event.target.value })} /></label>
          <label><span>Artwork assigned to</span><input value={jobForm.artworkAssignedTo} onChange={(event) => setJobForm({ ...jobForm, artworkAssignedTo: event.target.value })} placeholder="Designer / design department" /></label>
          <label><span>Proof shared to client date</span><input type="date" value={jobForm.proofSharedDate} onChange={(event) => setJobForm({ ...jobForm, proofSharedDate: event.target.value })} /></label>
          <label><span>Proof shared by</span><input value={jobForm.proofSharedBy} onChange={(event) => setJobForm({ ...jobForm, proofSharedBy: event.target.value })} placeholder="Sales / admin / customer care" /></label>
          <label><span>Final sign-off date</span><input type="date" value={jobForm.finalApprovalReceivedDate} onChange={(event) => setJobForm({ ...jobForm, finalApprovalReceivedDate: event.target.value })} /></label>
          <label><span>Final sign-off cleared by</span><input value={jobForm.finalApprovalClearedBy} onChange={(event) => setJobForm({ ...jobForm, finalApprovalClearedBy: event.target.value })} /></label>
          <label className="full-span"><span>Changes requested</span><textarea value={jobForm.changesRequested} onChange={(event) => setJobForm({ ...jobForm, changesRequested: event.target.value })} /></label>
          <label className="full-span"><span>Artwork / proof notes</span><textarea value={jobForm.artworkNotes} onChange={(event) => setJobForm({ ...jobForm, artworkNotes: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'stockReservation',
      title: 'Stock reservation',
      subtitle: 'Pull stock from finished goods instead of producing fresh. Skipped for new production.',
      contextActive: jobForm.reserveFromStock,
      missingRequired: stockMissing,
      contextPrompt: (
        <>
          <p className="muted">Default is to produce fresh for this job. Enable to reserve from existing finished stock instead.</p>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={jobForm.reserveFromStock}
              onChange={(event) => setJobForm({ ...jobForm, reserveFromStock: event.target.checked })}
            />
            Reserve from finished stock
          </label>
        </>
      ),
      body: (
        <div className="form-grid">
          <label className="checkbox-row"><input type="checkbox" checked={jobForm.reserveFromStock} onChange={(event) => setJobForm({ ...jobForm, reserveFromStock: event.target.checked })} />Reserve from finished stock</label>
          <label>
            <span>Stock batch<RequiredMarker /></span>
            <Combobox
              options={stockOptions}
              value={jobForm.reservedFinishedGoodsStockId}
              onChange={(value) => setJobForm({ ...jobForm, reservedFinishedGoodsStockId: value })}
              placeholder="Search stock batches…"
              emptyMessage="No matching stock"
            />
          </label>
          <label>
            <span>Reserved quantity<RequiredMarker /></span>
            <input type="number" min="0" value={jobForm.reservedQuantity} onChange={(event) => setJobForm({ ...jobForm, reservedQuantity: event.target.value })} />
          </label>
        </div>
      ),
    },
    {
      key: 'production',
      title: 'Production & dispatch',
      subtitle: 'Factory hand-off, production timeline, dispatch handling, and final notes.',
      body: (
        <div className="form-grid">
          <label><span>Given to factory date</span><input type="date" value={jobForm.factoryReleaseDate} onChange={(event) => setJobForm({ ...jobForm, factoryReleaseDate: event.target.value })} /></label>
          <label><span>Given to factory by</span><input value={jobForm.factoryReleasedBy} onChange={(event) => setJobForm({ ...jobForm, factoryReleasedBy: event.target.value })} /></label>
          <label><span>Production start date</span><input type="date" value={jobForm.productionStartDate} onChange={(event) => setJobForm({ ...jobForm, productionStartDate: event.target.value })} /></label>
          <label><span>Production started by</span><input value={jobForm.productionStartedBy} onChange={(event) => setJobForm({ ...jobForm, productionStartedBy: event.target.value })} /></label>
          <label><span>Ready for dispatch date</span><input type="date" value={jobForm.readyForDispatchDate} onChange={(event) => setJobForm({ ...jobForm, readyForDispatchDate: event.target.value })} /></label>
          <label><span>Ready for dispatch by</span><input value={jobForm.readyForDispatchBy} onChange={(event) => setJobForm({ ...jobForm, readyForDispatchBy: event.target.value })} /></label>
          <label><span>Collection / delivery</span><select value={jobForm.collectionOrDeliveryStatus} onChange={(event) => setJobForm({ ...jobForm, collectionOrDeliveryStatus: event.target.value as JobFormState['collectionOrDeliveryStatus'] })}><option>Not Confirmed</option><option>Delivery Required</option><option>Client Collecting</option></select></label>
          <label><span>Dispatch status</span><input value={jobForm.dispatchStatus} onChange={(event) => setJobForm({ ...jobForm, dispatchStatus: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={jobForm.fscRelated} onChange={(event) => setJobForm({ ...jobForm, fscRelated: event.target.checked })} />FSC-related</label>
          <label className="full-span"><span>Packing / supply notes</span><textarea value={jobForm.packingNotes} onChange={(event) => setJobForm({ ...jobForm, packingNotes: event.target.value })} /></label>
          <label className="full-span"><span>Quality / issue notes</span><textarea value={jobForm.qualityNotes} onChange={(event) => setJobForm({ ...jobForm, qualityNotes: event.target.value })} /></label>
          <label className="full-span"><span>Notes</span><textarea value={jobForm.notes} onChange={(event) => setJobForm({ ...jobForm, notes: event.target.value })} /></label>
          {/* Phase 62 — Tooling pickers. Sales filters by the job's client
              first ('this client already owns these'), then falls back to
              generic dies if none match. */}
          {(() => {
            const candidateDies = tooling.filter((t) => t.toolType === 'die' && t.active && (!t.clientId || t.clientId === jobForm.clientId));
            const candidateStereos = tooling.filter((t) => t.toolType === 'stereo' && t.active && t.clientId === jobForm.clientId);
            return (
              <>
                <label>
                  <span>Die used (tooling)</span>
                  <select value={jobForm.dieToolId || ''} onChange={(event) => setJobForm({ ...jobForm, dieToolId: event.target.value })}>
                    <option value="">— No die / new die required —</option>
                    {candidateDies.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
                  </select>
                  {candidateDies.length > 0 && <small className="muted">{candidateDies.length} matching die(s) — sales avoids quoting a new die cost when one exists.</small>}
                </label>
                <label>
                  <span>Stereo used (tooling)</span>
                  <select value={jobForm.stereoToolId || ''} onChange={(event) => setJobForm({ ...jobForm, stereoToolId: event.target.value })}>
                    <option value="">— No stereo / new artwork —</option>
                    {candidateStereos.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.name} v{(t as any).designVersion || 1}</option>)}
                  </select>
                </label>
              </>
            );
          })()}
          <div className="full-span">
            <PhotoUploader
              urls={jobForm.photoUrls ?? []}
              onChange={(urls) => setJobForm({ ...jobForm, photoUrls: urls })}
              recordType="jobs"
              recordId={jobEditingId || `draft-${Date.now()}`}
              label="Proof / sample photos (artwork sign-off, finished bag, defect evidence)"
              max={10}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'food-safety',
      title: 'Food safety',
      subtitle: 'Classify this job. Food-packaging jobs lock to the Approved Food-Safe Material Register and cannot start with missing approvals.',
      contextActive: isFoodPackagingLevel(jobForm.foodContactLevel),
      body: (() => {
        const isFood = isFoodPackagingLevel(jobForm.foodContactLevel);
        const needsDirect = requiresDirectContactApproval(jobForm.foodContactLevel);
        const eligibleMaterials = foodSafeMaterials.filter((m) =>
          needsDirect ? m.directContactApproved : (m.directContactApproved || m.indirectContactApproved),
        );
        const blocks = isFood
          ? validateJobFoodSafety(jobForm.foodContactLevel, jobForm.foodSafeMaterialIds, foodSafeMaterials)
          : [];
        function toggleMaterial(id: string) {
          const next = jobForm.foodSafeMaterialIds.includes(id)
            ? jobForm.foodSafeMaterialIds.filter((existing) => existing !== id)
            : [...jobForm.foodSafeMaterialIds, id];
          setJobForm({ ...jobForm, foodSafeMaterialIds: next });
        }
        return (
          <div className="form-grid">
            <label className="full-span"><span>Food-contact classification</span>
              <select
                value={jobForm.foodContactLevel}
                onChange={(e) => setJobForm({ ...jobForm, foodContactLevel: e.target.value as FoodContactLevel })}
              >
                {(Object.keys(FOOD_CONTACT_LEVEL_LABELS) as FoodContactLevel[]).map((lvl) => (
                  <option key={lvl} value={lvl}>{FOOD_CONTACT_LEVEL_LABELS[lvl]}</option>
                ))}
              </select>
            </label>
            {isFood ? (
              <>
                <label><span>Internal batch number (auto if blank)</span><input value={jobForm.internalBatchNumber} onChange={(e) => setJobForm({ ...jobForm, internalBatchNumber: e.target.value })} placeholder="Generated on save" /></label>
                <label className="full-span"><span>Food safety notes (intended food use, customer rules)</span><textarea rows={2} value={jobForm.foodSafetyNotes} onChange={(e) => setJobForm({ ...jobForm, foodSafetyNotes: e.target.value })} /></label>
                <div className="full-span">
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', display: 'block', marginBottom: 8 }}>
                    Approved materials for this job ({eligibleMaterials.length} eligible at this level)
                  </span>
                  {eligibleMaterials.length === 0 ? (
                    <div className="food-safety-block-panel">
                      <strong>No materials approved for this food-contact level.</strong>
                      Add and approve at least one material on the Approved Food-Safe Material Register before this job can be released.
                    </div>
                  ) : (
                    <div className="chem-pictogram-grid">
                      {eligibleMaterials.map((m) => {
                        const on = jobForm.foodSafeMaterialIds.includes(m.id);
                        const approvedNow = m.status === 'Approved';
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMaterial(m.id)}
                            disabled={!approvedNow}
                            className={`chem-pictogram-pill${on ? ' chem-pictogram-pill-on' : ''}`}
                            title={approvedNow ? '' : `Status: ${m.status}`}
                          >
                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <strong>{m.materialName}</strong>
                              <span style={{ fontSize: 10, opacity: 0.8 }}>
                                {m.supplierName} · {m.status}
                                {m.directContactApproved ? ' · Direct OK' : m.indirectContactApproved ? ' · Indirect OK' : ''}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {blocks.length > 0 ? (
                  <div className="full-span food-safety-block-panel">
                    <strong>Food safety blocks (must clear before release):</strong>
                    <ul>
                      {blocks.map((b, idx) => <li key={idx}>{b.reason}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="full-span food-safety-pass-panel">All food safety checks passing for this job.</div>
                )}
              </>
            ) : (
              <p className="muted full-span">Non-food packaging job — food-safety gate disabled.</p>
            )}
          </div>
        );
      })(),
    },
    {
      key: 'machine-cleaning',
      title: 'Machine & cleaning gate',
      subtitle: 'A food-packaging job needs an assigned machine with a passing cleaning log in the last 24 hours.',
      contextActive: !!jobForm.assignedMachineId,
      body: (() => {
        const isFood = isFoodPackagingLevel(jobForm.foodContactLevel);
        const clean = jobForm.assignedMachineId
          ? getLatestPassingClean(jobForm.assignedMachineId, cleaningLogs)
          : null;
        return (
          <div className="form-grid">
            <label className="full-span"><span>Assigned machine</span>
              <select value={jobForm.assignedMachineId} onChange={(e) => setJobForm({ ...jobForm, assignedMachineId: e.target.value })}>
                <option value="">No machine assigned</option>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            {!isFood ? (
              <p className="muted full-span">Non-food packaging job — cleaning gate disabled.</p>
            ) : !jobForm.assignedMachineId ? (
              <div className="full-span food-safety-block-panel">
                <strong>Pick a machine.</strong>
                Without an assigned machine the cleaning gate can't be evaluated and the job can't be cleared.
              </div>
            ) : clean ? (
              <div className="full-span food-safety-pass-panel">
                Last passing cleaning log: <strong>{clean.logNumber}</strong> · {clean.cleaningType} · by {clean.performedByName} ({new Date(clean.performedAt).toLocaleString()})
              </div>
            ) : (
              <div className="full-span food-safety-block-panel">
                <strong>No passing cleaning log within the last 24 hours.</strong>
                Open Cleaning Logs and record a Pass for this machine before the job can be cleared.
              </div>
            )}
          </div>
        );
      })(),
    },
    {
      key: 'changeover',
      title: 'Product changeover checklist',
      subtitle: 'Required when moving from one job to another, especially non-food → food.',
      contextActive: isChangeoverComplete(jobForm.changeoverChecklist),
      body: (() => {
        const isFood = isFoodPackagingLevel(jobForm.foodContactLevel);
        const items = jobForm.changeoverChecklist.length === 9
          ? jobForm.changeoverChecklist
          : buildBlankChangeoverChecklist();
        function toggleItem(key: ChangeoverChecklistItem['key']) {
          const next = items.map((it) => it.key === key
            ? { ...it, completed: !it.completed, completedAt: !it.completed ? new Date().toISOString() : '', completedByName: !it.completed ? (it.completedByName || '') : '' }
            : it);
          setJobForm({ ...jobForm, changeoverChecklist: next });
        }
        function setItemBy(key: ChangeoverChecklistItem['key'], name: string) {
          const next = items.map((it) => it.key === key ? { ...it, completedByName: name } : it);
          setJobForm({ ...jobForm, changeoverChecklist: next });
        }
        const completedCount = items.filter((it) => it.completed).length;
        return (
          <div className="form-grid">
            {!isFood ? (
              <p className="muted full-span">Non-food packaging job — changeover checklist optional.</p>
            ) : null}
            <div className="full-span">
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', display: 'block', marginBottom: 8 }}>
                {completedCount} of {CHANGEOVER_CHECKLIST_KEYS.length} complete
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CHANGEOVER_CHECKLIST_KEYS.map((key) => {
                  const item = items.find((it) => it.key === key) ?? { key, completed: false, completedAt: '', completedByName: '' };
                  return (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--jp-line)' }}>
                      <input type="checkbox" checked={item.completed} onChange={() => toggleItem(key)} />
                      <span style={{ textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.7 : 1 }}>{CHANGEOVER_CHECKLIST_LABELS[key]}</span>
                      <input
                        type="text"
                        placeholder="By name"
                        value={item.completedByName}
                        onChange={(e) => setItemBy(key, e.target.value)}
                        disabled={!item.completed}
                        style={{ maxWidth: 140 }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {isFood && !isChangeoverComplete(items) ? (
              <div className="full-span food-safety-block-panel">
                <strong>Changeover not complete.</strong>
                All 9 items must be ticked before the job can be cleared for production.
              </div>
            ) : isFood ? (
              <div className="full-span food-safety-pass-panel">Changeover complete.</div>
            ) : null}
          </div>
        );
      })(),
    },
    {
      key: 'qc-plan',
      title: 'Food-safety QC plan',
      subtitle: 'Sign off each QC stage. First-off + Final are required before release.',
      contextActive: jobForm.qcPlan.some(isQcStagePassed),
      body: (() => {
        const isFood = isFoodPackagingLevel(jobForm.foodContactLevel);
        const stages: QcStageRecord[] = jobForm.qcPlan.length === 4 ? jobForm.qcPlan : buildBlankQcPlan();
        function setStageCheck(stage: QcStage, key: QcCheckKey, result: QcCheckResult) {
          const next = stages.map((s) => s.stage === stage
            ? { ...s, checks: s.checks.map((c) => c.key === key ? { ...c, result } : c) }
            : s);
          setJobForm({ ...jobForm, qcPlan: next });
        }
        function setStageSignoff(stage: QcStage, name: string) {
          const next = stages.map((s) => s.stage === stage
            ? { ...s, signedOffByName: name, signedOffAt: name ? new Date().toISOString() : '' }
            : s);
          setJobForm({ ...jobForm, qcPlan: next });
        }
        function setStageNotes(stage: QcStage, notes: string) {
          const next = stages.map((s) => s.stage === stage ? { ...s, notes } : s);
          setJobForm({ ...jobForm, qcPlan: next });
        }
        return (
          <div className="form-grid">
            {!isFood ? <p className="muted full-span">Non-food packaging job — QC plan optional.</p> : null}
            {QC_STAGES.map((stage) => {
              const record = stages.find((s) => s.stage === stage) ?? stages[0];
              const passed = isQcStagePassed(record);
              const hasFail = record.checks.some((c) => c.result === 'Fail');
              return (
                <div key={stage} className="full-span" style={{
                  border: '1px solid var(--jp-line)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  background: hasFail ? 'rgba(231,89,89,0.04)' : passed ? 'rgba(34,132,70,0.04)' : 'transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <strong>{QC_STAGE_LABELS[stage]}</strong>
                    <span style={{ fontSize: 11, color: hasFail ? '#b22b2b' : passed ? '#1d5c34' : '#64748b' }}>
                      {hasFail ? 'Has FAIL items' : passed ? 'Signed off' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 4 }}>
                    {QC_CHECK_KEYS.map((key) => {
                      const check = record.checks.find((c) => c.key === key) ?? { key, result: 'Not Checked' as QcCheckResult };
                      return (
                        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11 }}>
                          <span style={{ color: 'var(--jp-ink-3)' }}>{QC_CHECK_LABELS[key]}</span>
                          <select value={check.result} onChange={(e) => setStageCheck(stage, key, e.target.value as QcCheckResult)}>
                            <option value="Not Checked">— Not checked</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11 }}>
                      <span style={{ color: 'var(--jp-ink-3)' }}>Signed off by</span>
                      <input value={record.signedOffByName} onChange={(e) => setStageSignoff(stage, e.target.value)} placeholder="QC sign-off name" />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11 }}>
                      <span style={{ color: 'var(--jp-ink-3)' }}>Notes</span>
                      <input value={record.notes} onChange={(e) => setStageNotes(stage, e.target.value)} placeholder="Findings / corrective action" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })(),
    },
  ];

  return (
    <>
      <SectionTitle
        action={
          mode === 'list' ? (
            <div className="add-button-group">
              <button className="secondary-button" onClick={handleStartQuickAdd}>Add New Job Card</button>
              <button className="ghost-button" onClick={handleStartCreate}>Full Form</button>
            </div>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Job Cards</button>
          )
        }
      />

      {mode === 'quick' ? (
        <QuickAddCard
          title="Quick add job card"
          subtitle="Pick a client and we'll pre-fill paper, spec, and pricing from their last job. You can fine-tune anything in the full form."
          message={jobMessage}
          missingRequired={[...basicsMissing, ...customerMissing, ...productMissing]}
          onSave={onSave}
          onCancel={handleBackToList}
          onSwitchToFullForm={handleSwitchToFullForm}
          saveLabel="Save Job Card"
          hint={
            prefillSourceJob ? (
              <>
                <strong>Auto-filled from last job:</strong> {prefillSourceJob.jobNumber} ·{' '}
                {prefillSourceJob.productName || 'Unnamed product'}
                {prefillSourceJob.paperType ? ` · ${prefillSourceJob.paperType}` : ''}
                {prefillSourceJob.gsm ? ` ${prefillSourceJob.gsm}gsm` : ''}.
                You can edit these in the full form before saving.
              </>
            ) : null
          }
          body={
            <div className="form-grid">
              <label>
                <span>Client<RequiredMarker /></span>
                <Combobox
                  options={clientOptions}
                  value={jobForm.clientId}
                  onChange={(value) => handleQuickAddClientChange(value)}
                  placeholder="Search clients…"
                  emptyMessage="No matching clients"
                  autoFocus
                />
              </label>
              <label>
                <span>Product<RequiredMarker /></span>
                <Combobox
                  options={productOptions}
                  value={jobForm.productId}
                  onChange={(value) => {
                    const product = products.find((entry) => entry.id === value);
                    setJobForm({
                      ...jobForm,
                      productId: value,
                      productName: product?.name ?? jobForm.productName,
                      productCategory: product?.category ?? jobForm.productCategory,
                      paperType: product?.defaultPaperType || jobForm.paperType,
                      gsm: product?.defaultGsm || jobForm.gsm,
                    });
                  }}
                  placeholder="Search products…"
                  emptyMessage="No matching products"
                />
              </label>
              <label>
                <span>Quantity planned<RequiredMarker /></span>
                <input
                  type="number"
                  min="0"
                  value={jobForm.quantityPlanned}
                  onChange={(event) => setJobForm({ ...jobForm, quantityPlanned: event.target.value })}
                />
              </label>
              <label>
                <span>Job date<RequiredMarker /></span>
                <input
                  type="date"
                  value={jobForm.jobDate}
                  onChange={(event) => setJobForm({ ...jobForm, jobDate: event.target.value })}
                />
              </label>
              <label>
                <span>Due date<RequiredMarker /></span>
                <input
                  type="date"
                  value={jobForm.dueDate}
                  onChange={(event) => setJobForm({ ...jobForm, dueDate: event.target.value })}
                />
              </label>
            </div>
          }
        />
      ) : mode === 'form' ? (
        <>
          {currentUser && (
            <EditFormGuard
              table="jobs"
              recordId={jobEditingId}
              recordLabel={`Job ${jobEditingId}`}
              currentUser={currentUser}
            />
          )}
          <FormWizard
            title={jobEditingId ? 'Edit job card' : 'New job card'}
            subtitle="Job numbers are generated when you save. Required fields are marked. Print, artwork, and stock-reservation sections only activate when relevant."
            message={jobMessage}
            sections={sections}
            isEditing={Boolean(jobEditingId)}
            saveLabel="Save Job Card"
            onSave={onSave}
            onCancel={handleBackToList}
          />
        </>
      ) : (
        <>
        <section className="card">
          <SectionTitle title="Saved jobs" subtitle={`${filteredJobs.length} record(s) shown`} />

          <SavedViewsBar<JobFilters>
            views={jobViews}
            isActive={isViewActive}
            onApply={(view) => setJobFilters(view.filters)}
            onSaveCurrent={(name) => saveJobView(name, jobFilters)}
            onDelete={deleteJobView}
          />

          <div className="filters-grid">
            <label>
              Search
              <input placeholder="Job, customer, product" value={jobFilters.search} onChange={(event) => setJobFilters({ ...jobFilters, search: event.target.value })} />
            </label>
            <label>
              Month
              <select value={jobFilters.month} onChange={(event) => setJobFilters({ ...jobFilters, month: event.target.value })}>
                <option value="">All months</option>
                {monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={jobFilters.status} onChange={(event) => setJobFilters({ ...jobFilters, status: event.target.value })}>
                <option value="">All statuses</option>
                {JOB_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label>
              Customer
              <input value={jobFilters.customer} onChange={(event) => setJobFilters({ ...jobFilters, customer: event.target.value })} />
            </label>
            <label>
              FSC-related
              <select value={jobFilters.fsc} onChange={(event) => setJobFilters({ ...jobFilters, fsc: event.target.value })}>
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          {filteredJobs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="bulk-select-cell">
                      <input
                        type="checkbox"
                        aria-label="Select all visible jobs"
                        checked={allFilteredSelected}
                        onChange={toggleAllFiltered}
                      />
                    </th>
                    <th>Job</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Stock</th>
                    <th>Proofing</th>
                    <th>Dispatch</th>
                    <th>Planned</th>
                    <th>Completed</th>
                    <th>FSC</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="bulk-select-cell">
                        <input
                          type="checkbox"
                          aria-label={`Select job ${job.jobNumber}`}
                          checked={selectedRowIds.has(job.id)}
                          onChange={() => toggleRow(job.id)}
                        />
                      </td>
                      <td>
                        <strong>{job.jobNumber}</strong>
                        <div className="table-subtext">{job.productName}</div>
                      </td>
                      <td>{formatDate(job.jobDate)}</td>
                      <td>{job.customerName}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td>{job.stockReservationStatus}</td>
                      <td>{job.approvalStatus}</td>
                      <td>{job.dispatchStatus || 'Not set'}</td>
                      <td>{formatNumber(job.quantityPlanned)}</td>
                      <td>{formatNumber(job.quantityCompleted)}</td>
                      <td><FlagBadge value={job.fscRelated} /></td>
                      <td>
                        <div className="inline-actions">
                          <button className="table-button" onClick={() => onSelectJob(job.id)}>Open</button>
                          <button className="table-button" onClick={() => handleStartEdit(job)}>Edit</button>
                          <button className="table-button" onClick={() => onDuplicate(job)}>Duplicate</button>
                          <button className="table-button" onClick={() => onQuickAddWaste(job)}>Log waste</button>
                          {onCreateDelivery ? (
                            <button
                              className="table-button table-button-promote"
                              onClick={() => onCreateDelivery(job)}
                              title="Create a delivery note from this job"
                            >
                              → Delivery
                            </button>
                          ) : null}
                          {onCreateInvoice ? (
                            <button
                              className="table-button table-button-promote"
                              onClick={() => onCreateInvoice(job)}
                              title="Create an invoice from this job"
                            >
                              → Invoice
                            </button>
                          ) : null}
                          {onPrintJobCard ? (
                            <button
                              className="table-button"
                              onClick={() => onPrintJobCard(job)}
                              title="Print job card for the floor"
                            >
                              Print
                            </button>
                          ) : null}
                          {onPrintFoodSafeCertificate && isFoodPackagingLevel(job.foodContactLevel ?? 'NonFood') ? (
                            <button
                              className="table-button"
                              onClick={() => onPrintFoodSafeCertificate(job)}
                              title="Print food-safe declaration / certificate for this batch"
                            >
                              FS Cert
                            </button>
                          ) : null}
                          {onMarkComplete && job.status !== 'Completed' ? (
                            <button
                              className="table-button table-button-promote"
                              onClick={() => { if (confirm(`Mark job ${job.jobNumber} as Completed?`)) onMarkComplete(job); }}
                              title="Mark this job as Completed — closes it out and moves it off the open list"
                            >
                              ✓ Done
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No jobs match the filters" body="Adjust the search or create a new job card." />
          )}
        </section>
        {selectedJob ? (
          <JobDetailPanel
            job={selectedJob}
            materials={selectedJobMaterials}
            productionLogs={selectedJobProductionLogs}
            wasteEntries={selectedJobWasteEntries}
            paperLogs={selectedJobPaperLogs}
            dispatchRecords={selectedJobDispatchRecords}
            onQuickAddProduction={onQuickAddProduction}
            onQuickAddWaste={onQuickAddWaste}
            onQuickAddPaper={onQuickAddPaper}
            onQuickAddDispatch={onQuickAddDispatch}
            onOpenHistory={onOpenHistory}
            onMarkComplete={onMarkComplete}
          />
        ) : null}
        <BulkActionsBar
          selectedCount={selectedRowIds.size}
          onClear={clearSelection}
          label={selectedRowIds.size === 1 ? 'job selected' : 'jobs selected'}
        >
          <button type="button" className="secondary-button" onClick={exportSelectedCsv}>
            Export CSV
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => window.print()}
            title="Print the current view (browser print dialog)"
          >
            Print
          </button>
        </BulkActionsBar>
        </>
      )}
    </>
  );
}
