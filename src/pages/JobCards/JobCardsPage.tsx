import { useEffect, useState } from 'react';
import { FlagBadge, StatusBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { JobDetailPanel } from './JobDetailPanel';
import {
  Client,
  DispatchRecord,
  FinishedGoodsStock,
  JobCard,
  JobFilters,
  JobFormState,
  MaterialReceipt,
  PaperLog,
  PricingTier,
  Product,
  ProductionLogEntry,
  WasteEntry,
} from '../../types';
import { JOB_STATUSES, formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface JobCardsPageProps {
  monthOptions: string[];
  clients: Client[];
  products: Product[];
  pricingTiers: PricingTier[];
  finishedGoodsStock: FinishedGoodsStock[];
  jobForm: JobFormState;
  setJobForm: (value: JobFormState) => void;
  jobEditingId: string | null;
  jobMessage: string;
  onSave: () => void;
  onReset: () => void;
  jobFilters: JobFilters;
  setJobFilters: (value: JobFilters) => void;
  filteredJobs: JobCard[];
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
}

export function JobCardsPage(props: JobCardsPageProps) {
  const {
    monthOptions,
    clients,
    products,
    pricingTiers,
    finishedGoodsStock,
    jobForm,
    setJobForm,
    jobEditingId,
    jobMessage,
    onSave,
    onReset,
    jobFilters,
    setJobFilters,
    filteredJobs,
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
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) ?? null;

  useEffect(() => {
    if (jobEditingId) {
      setMode('form');
    }
  }, [jobEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(job: JobCard) {
    onEdit(job);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Job Cards"
        subtitle="Create, update, duplicate, and search production jobs."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Job Card</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Job Cards</button>
          )
        }
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header">
            <div>
              <h3>{jobEditingId ? 'Edit job card' : 'New job card'}</h3>
              <p className="muted">Job numbers are generated automatically when the record is saved.</p>
            </div>
          </div>

          {jobMessage ? <div className="message-strip">{jobMessage}</div> : null}

          <div className="form-grid">
            <label>
              Job date
              <input type="date" value={jobForm.jobDate} onChange={(event) => setJobForm({ ...jobForm, jobDate: event.target.value })} />
            </label>
            <label>
              Due date
              <input type="date" value={jobForm.dueDate} onChange={(event) => setJobForm({ ...jobForm, dueDate: event.target.value })} />
            </label>
            <label>
              Lead number
              <input value={jobForm.leadNumber} onChange={(event) => setJobForm({ ...jobForm, leadNumber: event.target.value })} placeholder="LED-202604-001" />
            </label>
            <label>
              Quote number
              <input value={jobForm.quoteNumber} onChange={(event) => setJobForm({ ...jobForm, quoteNumber: event.target.value })} placeholder="QTE-..." />
            </label>
            <label>
              QuickBooks estimate #
              <input value={jobForm.quickbooksEstimateNumber} onChange={(event) => setJobForm({ ...jobForm, quickbooksEstimateNumber: event.target.value })} />
            </label>
            <label>
              Invoice number
              <input value={jobForm.invoiceNumber} onChange={(event) => setJobForm({ ...jobForm, invoiceNumber: event.target.value })} />
            </label>
            <label>
              Order value
              <input type="number" min="0" value={jobForm.orderValue} onChange={(event) => setJobForm({ ...jobForm, orderValue: event.target.value })} />
            </label>
            <label>
              Payment basis
              <select value={jobForm.paymentRequirement} onChange={(event) => setJobForm({ ...jobForm, paymentRequirement: event.target.value as JobFormState['paymentRequirement'] })}>
                <option>50% Deposit</option>
                <option>Full Payment</option>
                <option>Credit Terms</option>
              </select>
            </label>
            <label>
              Payment / credit status
              <select value={jobForm.paymentStatus} onChange={(event) => setJobForm({ ...jobForm, paymentStatus: event.target.value as JobFormState['paymentStatus'] })}>
                <option>Pending</option>
                <option>50% Paid</option>
                <option>Full Payment Received</option>
                <option>Credit Limit Applied</option>
              </select>
            </label>
            <label>
              Credit check
              <select value={jobForm.creditCheckStatus} onChange={(event) => setJobForm({ ...jobForm, creditCheckStatus: event.target.value as JobFormState['creditCheckStatus'] })}>
                <option>Not Required</option>
                <option>Within Limit</option>
                <option>Blocked</option>
              </select>
            </label>
            <label>
              Available credit at approval
              <input type="number" min="0" value={jobForm.availableCreditAtApproval} onChange={(event) => setJobForm({ ...jobForm, availableCreditAtApproval: event.target.value })} />
            </label>
            <label>
              Commercial release
              <select value={jobForm.commercialReleaseStatus} onChange={(event) => setJobForm({ ...jobForm, commercialReleaseStatus: event.target.value as JobFormState['commercialReleaseStatus'] })}>
                <option>Pending</option>
                <option>Accepted</option>
                <option>Invoiced</option>
                <option>Cleared for Production</option>
              </select>
            </label>
            <label>
              Client
              <select value={jobForm.clientId} onChange={(event) => setJobForm({ ...jobForm, clientId: event.target.value })}>
                <option value="">Select client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label>
              Pricing tier
              <select value={jobForm.pricingTierId} onChange={(event) => setJobForm({ ...jobForm, pricingTierId: event.target.value })}>
                <option value="">Select pricing tier</option>
                {pricingTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
              </select>
            </label>
            <label>
              Customer name
              <input value={jobForm.customerName} onChange={(event) => setJobForm({ ...jobForm, customerName: event.target.value })} />
            </label>
            <label>
              Customer reference
              <input value={jobForm.customerReference} onChange={(event) => setJobForm({ ...jobForm, customerReference: event.target.value })} />
            </label>
            <label>
              Product
              <select value={jobForm.productId} onChange={(event) => setJobForm({ ...jobForm, productId: event.target.value })}>
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
            <label>
              Product / bag type
              <input value={jobForm.productName} onChange={(event) => setJobForm({ ...jobForm, productName: event.target.value })} />
            </label>
            <label>
              Product category
              <select value={jobForm.productCategory} onChange={(event) => setJobForm({ ...jobForm, productCategory: event.target.value as JobFormState['productCategory'] })}>
                <option>Paper Bags</option>
                <option>Paper Cups</option>
                <option>Food Boxes</option>
                <option>Wet Wipes</option>
                <option>Other Packaging</option>
              </select>
            </label>
            <label>
              Size / specification
              <input value={jobForm.sizeSpec} onChange={(event) => setJobForm({ ...jobForm, sizeSpec: event.target.value })} />
            </label>
            <label className="full-span">
              Product description
              <textarea value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} />
            </label>
            <label>
              Paper type
              <input value={jobForm.paperType} onChange={(event) => setJobForm({ ...jobForm, paperType: event.target.value })} />
            </label>
            <label>
              GSM
              <input value={jobForm.gsm} onChange={(event) => setJobForm({ ...jobForm, gsm: event.target.value })} />
            </label>
            <label>
              Paper quantity required
              <input type="number" min="0" value={jobForm.paperQuantityRequired} onChange={(event) => setJobForm({ ...jobForm, paperQuantityRequired: event.target.value })} />
            </label>
            <label>
              Paper quantity unit
              <select value={jobForm.paperQuantityUnit} onChange={(event) => setJobForm({ ...jobForm, paperQuantityUnit: event.target.value as JobFormState['paperQuantityUnit'] })}>
                <option value="kg">kg</option>
                <option value="rolls">rolls</option>
                <option value="sheets">sheets</option>
                <option value="units">units</option>
              </select>
            </label>
            <label>
              Paper allocation
              <select value={jobForm.paperAllocationStatus} onChange={(event) => setJobForm({ ...jobForm, paperAllocationStatus: event.target.value as JobFormState['paperAllocationStatus'] })}>
                <option>Not Checked</option>
                <option>In Stock</option>
                <option>Order Required</option>
                <option>Ordered</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={jobForm.printRequired} onChange={(event) => setJobForm({ ...jobForm, printRequired: event.target.checked })} />
              Print required
            </label>
            <label>
              Print method
              <select value={jobForm.printMethod} onChange={(event) => setJobForm({ ...jobForm, printMethod: event.target.value as JobFormState['printMethod'] })} disabled={!jobForm.printRequired}>
                <option>Plain</option>
                <option>Auto</option>
                <option>Screen Print</option>
                <option>Flexo</option>
                <option>Digital Print</option>
                <option>Litho</option>
              </select>
            </label>
            <label>
              Number of colours
              <input type="number" min="0" value={jobForm.colorCount} onChange={(event) => setJobForm({ ...jobForm, colorCount: event.target.value })} disabled={!jobForm.printRequired} />
            </label>
            <label>
              Supply format
              <select value={jobForm.supplyFormat} onChange={(event) => setJobForm({ ...jobForm, supplyFormat: event.target.value as JobFormState['supplyFormat'] })}>
                <option>Boxes</option>
                <option>Flat Packed</option>
                <option>Bundles</option>
                <option>Palletized</option>
                <option>Loose</option>
              </select>
            </label>
            <label>
              Quantity planned
              <input type="number" min="0" value={jobForm.quantityPlanned} onChange={(event) => setJobForm({ ...jobForm, quantityPlanned: event.target.value })} />
            </label>
            <label>
              Quantity completed
              <input type="number" min="0" value={jobForm.quantityCompleted} onChange={(event) => setJobForm({ ...jobForm, quantityCompleted: event.target.value })} />
            </label>
            <label>
              Status
              <select value={jobForm.status} onChange={(event) => setJobForm({ ...jobForm, status: event.target.value as JobCard['status'] })}>
                {JOB_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={jobForm.reserveFromStock} onChange={(event) => setJobForm({ ...jobForm, reserveFromStock: event.target.checked })} />
              Reserve from finished stock
            </label>
            <label>
              Stock batch
              <select value={jobForm.reservedFinishedGoodsStockId} onChange={(event) => setJobForm({ ...jobForm, reservedFinishedGoodsStockId: event.target.value })} disabled={!jobForm.reserveFromStock}>
                <option value="">Select stock batch</option>
                {finishedGoodsStock.map((item) => <option key={item.id} value={item.id}>{item.stockNumber} · {item.productName} ({formatNumber(item.quantityAvailable)} {item.quantityUnit} available)</option>)}
              </select>
            </label>
            <label>
              Reserved quantity
              <input type="number" min="0" value={jobForm.reservedQuantity} onChange={(event) => setJobForm({ ...jobForm, reservedQuantity: event.target.value })} disabled={!jobForm.reserveFromStock} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={jobForm.artworkReceived} onChange={(event) => setJobForm({ ...jobForm, artworkReceived: event.target.checked })} />
              Artwork received
            </label>
            <label>
              Artwork readiness
              <select value={jobForm.artworkPreparationStatus} onChange={(event) => setJobForm({ ...jobForm, artworkPreparationStatus: event.target.value as JobFormState['artworkPreparationStatus'] })}>
                <option>Print Ready</option>
                <option>Ready but Not Print Ready</option>
                <option>Needs Design</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={jobForm.proofSent} onChange={(event) => setJobForm({ ...jobForm, proofSent: event.target.checked })} />
              Proof sent
            </label>
            <label>
              Approval status
              <select value={jobForm.approvalStatus} onChange={(event) => setJobForm({ ...jobForm, approvalStatus: event.target.value as JobFormState['approvalStatus'] })}>
                <option>Not Sent</option>
                <option>Awaiting Approval</option>
                <option>Approved</option>
                <option>Changes Requested</option>
              </select>
            </label>
            <label>
              Approval date
              <input type="date" value={jobForm.approvalDate} onChange={(event) => setJobForm({ ...jobForm, approvalDate: event.target.value })} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={jobForm.addElementsRequired} onChange={(event) => setJobForm({ ...jobForm, addElementsRequired: event.target.checked })} />
              Add other elements
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={jobForm.colorChangesRequired} onChange={(event) => setJobForm({ ...jobForm, colorChangesRequired: event.target.checked })} />
              Change colours
            </label>
            <label className="full-span">
              Artwork brief / required changes
              <textarea value={jobForm.artworkChangeSummary} onChange={(event) => setJobForm({ ...jobForm, artworkChangeSummary: event.target.value })} />
            </label>
            <label>
              Given to designer / design date
              <input type="date" value={jobForm.artworkAssignedDate} onChange={(event) => setJobForm({ ...jobForm, artworkAssignedDate: event.target.value })} />
            </label>
            <label>
              Artwork assigned to
              <input value={jobForm.artworkAssignedTo} onChange={(event) => setJobForm({ ...jobForm, artworkAssignedTo: event.target.value })} placeholder="Designer / design department" />
            </label>
            <label>
              Proof shared to client date
              <input type="date" value={jobForm.proofSharedDate} onChange={(event) => setJobForm({ ...jobForm, proofSharedDate: event.target.value })} />
            </label>
            <label>
              Proof shared by
              <input value={jobForm.proofSharedBy} onChange={(event) => setJobForm({ ...jobForm, proofSharedBy: event.target.value })} placeholder="Sales / admin / customer care" />
            </label>
            <label>
              Final sign-off date
              <input type="date" value={jobForm.finalApprovalReceivedDate} onChange={(event) => setJobForm({ ...jobForm, finalApprovalReceivedDate: event.target.value })} />
            </label>
            <label>
              Final sign-off cleared by
              <input value={jobForm.finalApprovalClearedBy} onChange={(event) => setJobForm({ ...jobForm, finalApprovalClearedBy: event.target.value })} />
            </label>
            <label className="full-span">
              Changes requested
              <textarea value={jobForm.changesRequested} onChange={(event) => setJobForm({ ...jobForm, changesRequested: event.target.value })} />
            </label>
            <label className="full-span">
              Artwork / proof notes
              <textarea value={jobForm.artworkNotes} onChange={(event) => setJobForm({ ...jobForm, artworkNotes: event.target.value })} />
            </label>
            <label className="full-span">
              Print notes
              <textarea value={jobForm.printNotes} onChange={(event) => setJobForm({ ...jobForm, printNotes: event.target.value })} />
            </label>
            <label className="full-span">
              Packing / supply notes
              <textarea value={jobForm.packingNotes} onChange={(event) => setJobForm({ ...jobForm, packingNotes: event.target.value })} />
            </label>
            <label>
              Dispatch status
              <input value={jobForm.dispatchStatus} onChange={(event) => setJobForm({ ...jobForm, dispatchStatus: event.target.value })} />
            </label>
            <label>
              Given to factory date
              <input type="date" value={jobForm.factoryReleaseDate} onChange={(event) => setJobForm({ ...jobForm, factoryReleaseDate: event.target.value })} />
            </label>
            <label>
              Given to factory by
              <input value={jobForm.factoryReleasedBy} onChange={(event) => setJobForm({ ...jobForm, factoryReleasedBy: event.target.value })} />
            </label>
            <label>
              Production start date
              <input type="date" value={jobForm.productionStartDate} onChange={(event) => setJobForm({ ...jobForm, productionStartDate: event.target.value })} />
            </label>
            <label>
              Production started by
              <input value={jobForm.productionStartedBy} onChange={(event) => setJobForm({ ...jobForm, productionStartedBy: event.target.value })} />
            </label>
            <label>
              Ready for dispatch date
              <input type="date" value={jobForm.readyForDispatchDate} onChange={(event) => setJobForm({ ...jobForm, readyForDispatchDate: event.target.value })} />
            </label>
            <label>
              Ready for dispatch by
              <input value={jobForm.readyForDispatchBy} onChange={(event) => setJobForm({ ...jobForm, readyForDispatchBy: event.target.value })} />
            </label>
            <label>
              Collection / delivery
              <select value={jobForm.collectionOrDeliveryStatus} onChange={(event) => setJobForm({ ...jobForm, collectionOrDeliveryStatus: event.target.value as JobFormState['collectionOrDeliveryStatus'] })}>
                <option>Not Confirmed</option>
                <option>Delivery Required</option>
                <option>Client Collecting</option>
              </select>
            </label>
            <label>
              Captured by
              <input value={jobForm.capturedBy} onChange={(event) => setJobForm({ ...jobForm, capturedBy: event.target.value })} />
            </label>
            <label>
              Released by
              <input value={jobForm.releasedBy} onChange={(event) => setJobForm({ ...jobForm, releasedBy: event.target.value })} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={jobForm.fscRelated} onChange={(event) => setJobForm({ ...jobForm, fscRelated: event.target.checked })} />
              FSC-related
            </label>
            <label className="full-span">
              Quality / issue notes
              <textarea value={jobForm.qualityNotes} onChange={(event) => setJobForm({ ...jobForm, qualityNotes: event.target.value })} />
            </label>
            <label className="full-span">
              Notes
              <textarea value={jobForm.notes} onChange={(event) => setJobForm({ ...jobForm, notes: event.target.value })} />
            </label>
          </div>

          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{jobEditingId ? 'Save Changes' : 'Save Job Card'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <>
        <section className="card">
          <SectionTitle title="Saved jobs" subtitle={`${filteredJobs.length} record(s) shown`} />

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
          />
        ) : null}
        </>
      )}
    </>
  );
}
