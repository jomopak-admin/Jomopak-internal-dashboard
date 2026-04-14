import { useState } from 'react';
import { FlagBadge, StatusBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { DispatchRecord, JobCard, MaterialReceipt, PaperLog, ProductionLogEntry, WasteEntry } from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

type JobDetailTab = 'overview' | 'materials' | 'production' | 'waste' | 'paper' | 'dispatch';

interface JobDetailPanelProps {
  job: JobCard;
  materials: MaterialReceipt[];
  productionLogs: ProductionLogEntry[];
  wasteEntries: WasteEntry[];
  paperLogs: PaperLog[];
  dispatchRecords: DispatchRecord[];
  onQuickAddProduction: (job: JobCard) => void;
  onQuickAddWaste: (job: JobCard) => void;
  onQuickAddPaper: (job: JobCard) => void;
  onQuickAddDispatch: (job: JobCard) => void;
}

const TABS: Array<{ key: JobDetailTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'materials', label: 'Materials' },
  { key: 'production', label: 'Production Logs' },
  { key: 'waste', label: 'Waste' },
  { key: 'paper', label: 'Paper Usage' },
  { key: 'dispatch', label: 'Dispatch' },
];

export function JobDetailPanel({
  job,
  materials,
  productionLogs,
  wasteEntries,
  paperLogs,
  dispatchRecords,
  onQuickAddProduction,
  onQuickAddWaste,
  onQuickAddPaper,
  onQuickAddDispatch,
}: JobDetailPanelProps) {
  const [tab, setTab] = useState<JobDetailTab>('overview');

  const totalWaste = wasteEntries.reduce((sum, entry) => sum + entry.wasteQuantity, 0);
  const totalPaper = paperLogs.reduce((sum, log) => sum + log.quantityUsed, 0);
  const totalDispatch = dispatchRecords.reduce((sum, record) => sum + record.quantityDispatched, 0);

  return (
    <section className="card job-detail-card">
      <SectionTitle
        title={`Job Detail: ${job.jobNumber}`}
        subtitle={`${job.customerName} • ${job.productName}`}
        action={
          <div className="inline-actions">
            <button className="secondary-button" onClick={() => onQuickAddProduction(job)}>Add Production Log</button>
            <button className="ghost-button" onClick={() => onQuickAddWaste(job)}>Add Waste</button>
            <button className="ghost-button" onClick={() => onQuickAddPaper(job)}>Add Paper Usage</button>
            <button className="ghost-button" onClick={() => onQuickAddDispatch(job)}>Add Dispatch</button>
          </div>
        }
      />

      <div className="job-detail-header">
        <div className="job-detail-chip"><span>Status</span><strong><StatusBadge status={job.status} /></strong></div>
        <div className="job-detail-chip"><span>Commercial</span><strong>{job.commercialReleaseStatus}</strong></div>
        <div className="job-detail-chip"><span>Proofing</span><strong>{job.approvalStatus}</strong></div>
        <div className="job-detail-chip"><span>Stock</span><strong>{job.stockReservationStatus}</strong></div>
        <div className="job-detail-chip"><span>Paper</span><strong>{job.paperAllocationStatus}</strong></div>
        <div className="job-detail-chip"><span>Dispatch</span><strong>{job.dispatchStatus || 'Not set'}</strong></div>
        <div className="job-detail-chip"><span>Due date</span><strong>{job.dueDate ? formatDate(job.dueDate) : 'Not set'}</strong></div>
        <div className="job-detail-chip"><span>FSC</span><strong><FlagBadge value={job.fscRelated} /></strong></div>
      </div>

      <div className="job-detail-tabs">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? 'tab-button active' : 'tab-button'}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="job-detail-grid">
          <div className="job-detail-section">
            <h3>Job Summary</h3>
            <div className="detail-list">
              <div><span>Lead</span><strong>{job.leadNumber || 'Not linked'}</strong></div>
              <div><span>Quote</span><strong>{job.quoteNumber || job.quickbooksEstimateNumber || 'Not linked'}</strong></div>
              <div><span>Invoice</span><strong>{job.invoiceNumber || 'Not set'}</strong></div>
              <div><span>Order value</span><strong>{formatNumber(job.orderValue)}</strong></div>
              <div><span>Payment basis</span><strong>{job.paymentRequirement}</strong></div>
              <div><span>Payment status</span><strong>{job.paymentStatus}</strong></div>
              <div><span>Credit check</span><strong>{job.creditCheckStatus}</strong></div>
              <div><span>Customer reference</span><strong>{job.customerReference || 'Not set'}</strong></div>
              <div><span>Job date</span><strong>{formatDate(job.jobDate)}</strong></div>
              <div><span>Quantity planned</span><strong>{formatNumber(job.quantityPlanned)}</strong></div>
              <div><span>Quantity completed</span><strong>{formatNumber(job.quantityCompleted)}</strong></div>
              <div><span>Paper type</span><strong>{job.paperType || 'Not set'}</strong></div>
              <div><span>GSM</span><strong>{job.gsm || 'Not set'}</strong></div>
              <div><span>Paper required</span><strong>{formatNumber(job.paperQuantityRequired)} {job.paperQuantityUnit}</strong></div>
              <div><span>Paper order card</span><strong>{job.linkedMaterialOrderId || 'Not linked'}</strong></div>
              <div><span>Size</span><strong>{job.sizeSpec || 'Not set'}</strong></div>
            </div>
          </div>

          <div className="job-detail-section">
            <h3>Artwork & Proofing</h3>
            <div className="detail-list">
              <div><span>Artwork received</span><strong>{job.artworkReceived ? 'Yes' : 'No'}</strong></div>
              <div><span>Artwork readiness</span><strong>{job.artworkPreparationStatus}</strong></div>
              <div><span>Assigned to artwork</span><strong>{job.artworkAssignedTo || 'Not assigned'}</strong></div>
              <div><span>Assigned date</span><strong>{job.artworkAssignedDate ? formatDate(job.artworkAssignedDate) : 'Not set'}</strong></div>
              <div><span>Proof sent</span><strong>{job.proofSent ? 'Yes' : 'No'}</strong></div>
              <div><span>Proof shared to client</span><strong>{job.proofSharedDate ? formatDate(job.proofSharedDate) : 'Not set'}</strong></div>
              <div><span>Proof shared by</span><strong>{job.proofSharedBy || 'Not set'}</strong></div>
              <div><span>Approval status</span><strong>{job.approvalStatus}</strong></div>
              <div><span>Approval date</span><strong>{job.approvalDate ? formatDate(job.approvalDate) : 'Not set'}</strong></div>
              <div><span>Final sign-off</span><strong>{job.finalApprovalReceivedDate ? formatDate(job.finalApprovalReceivedDate) : 'Not set'}</strong></div>
              <div><span>Cleared by</span><strong>{job.finalApprovalClearedBy || 'Not set'}</strong></div>
              <div><span>Add elements</span><strong>{job.addElementsRequired ? 'Yes' : 'No'}</strong></div>
              <div><span>Change colours</span><strong>{job.colorChangesRequired ? 'Yes' : 'No'}</strong></div>
              <div><span>Artwork brief</span><strong>{job.artworkChangeSummary || 'None'}</strong></div>
              <div><span>Changes requested</span><strong>{job.changesRequested || 'None'}</strong></div>
            </div>
          </div>

          <div className="job-detail-section">
            <h3>Stock Reservation</h3>
            <div className="detail-list">
              <div><span>Reservation status</span><strong>{job.stockReservationStatus}</strong></div>
              <div><span>Stock batch</span><strong>{job.reservedFinishedGoodsStockNumber || 'Not linked'}</strong></div>
              <div><span>Reserved quantity</span><strong>{formatNumber(job.reservedQuantity)}</strong></div>
              <div><span>Production needed</span><strong>{job.stockReservationStatus === 'Production Needed' ? 'Yes' : 'No'}</strong></div>
              <div><span>Paper allocation</span><strong>{job.paperAllocationStatus}</strong></div>
            </div>
          </div>

          <div className="job-detail-section">
            <h3>Operational Totals</h3>
            <div className="detail-list">
              <div><span>Given to factory</span><strong>{job.factoryReleaseDate ? formatDate(job.factoryReleaseDate) : 'Not set'}</strong></div>
              <div><span>Factory release by</span><strong>{job.factoryReleasedBy || 'Not set'}</strong></div>
              <div><span>Production started</span><strong>{job.productionStartDate ? formatDate(job.productionStartDate) : 'Not set'}</strong></div>
              <div><span>Production started by</span><strong>{job.productionStartedBy || 'Not set'}</strong></div>
              <div><span>Ready for dispatch</span><strong>{job.readyForDispatchDate ? formatDate(job.readyForDispatchDate) : 'Not set'}</strong></div>
              <div><span>Ready for dispatch by</span><strong>{job.readyForDispatchBy || 'Not set'}</strong></div>
              <div><span>Collection / delivery</span><strong>{job.collectionOrDeliveryStatus}</strong></div>
              <div><span>Material receipts linked</span><strong>{materials.length}</strong></div>
              <div><span>Production logs</span><strong>{productionLogs.length}</strong></div>
              <div><span>Total waste</span><strong>{formatNumber(totalWaste)}</strong></div>
              <div><span>Total paper used</span><strong>{formatNumber(totalPaper)}</strong></div>
              <div><span>Total dispatched</span><strong>{formatNumber(totalDispatch)}</strong></div>
            </div>
          </div>

          <div className="job-detail-section full-span">
            <h3>Notes</h3>
            <p className="muted">{job.notes || 'No general notes recorded.'}</p>
            <h3>Artwork / Proof Notes</h3>
            <p className="muted">{job.artworkNotes || 'No artwork notes recorded.'}</p>
            <h3>Quality / Issues</h3>
            <p className="muted">{job.qualityNotes || 'No quality issues recorded.'}</p>
          </div>
        </div>
      )}

      {tab === 'materials' && (
        materials.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Receipt</th><th>Date</th><th>Supplier</th><th>Roll code</th><th>Qty</th><th>FSC</th></tr></thead>
              <tbody>
                {materials.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>{receipt.receiptNumber}</td>
                    <td>{formatDate(receipt.receivedDate)}</td>
                    <td>{receipt.supplierName}</td>
                    <td>{receipt.internalRollCode}</td>
                    <td>{formatNumber(receipt.quantityReceived)} {receipt.quantityUnit}</td>
                    <td><FlagBadge value={receipt.fscRelated} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No materials linked" body="Link a material receipt through paper usage or production records." />
      )}

      {tab === 'production' && (
        productionLogs.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Log</th><th>Date</th><th>Type</th><th>Machine</th><th>Operator</th><th>Setup</th></tr></thead>
              <tbody>
                {productionLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.logNumber}</td>
                    <td>{formatDate(log.logDate)}</td>
                    <td>{log.logType}</td>
                    <td>{log.machine || 'Not set'}</td>
                    <td>{log.operatorName}</td>
                    <td>{formatNumber(log.setupTimeMinutes)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No production logs" body="Add process records to build the operational history for this job." />
      )}

      {tab === 'waste' && (
        wasteEntries.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Waste</th><th>Date</th><th>Qty</th><th>Reason</th><th>Linked log</th></tr></thead>
              <tbody>
                {wasteEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.wasteNumber}</td>
                    <td>{formatDate(entry.wasteDate)}</td>
                    <td>{formatNumber(entry.wasteQuantity)} {entry.wasteUnit}</td>
                    <td>{entry.wasteReason}</td>
                    <td>{entry.productionLogNumber || 'Not linked'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No waste records" body="Waste entries linked to this job will appear here." />
      )}

      {tab === 'paper' && (
        paperLogs.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Paper log</th><th>Date</th><th>Receipt</th><th>Paper</th><th>Qty</th></tr></thead>
              <tbody>
                {paperLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.paperLogNumber}</td>
                    <td>{formatDate(log.logDate)}</td>
                    <td>{log.materialReceiptNumber || 'Not linked'}</td>
                    <td>{log.paperType}</td>
                    <td>{formatNumber(log.quantityUsed)} {log.quantityUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No paper usage records" body="Paper usage linked to this job will appear here." />
      )}

      {tab === 'dispatch' && (
        dispatchRecords.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Dispatch</th><th>Date</th><th>Qty</th><th>Label</th><th>Delivery ref</th></tr></thead>
              <tbody>
                {dispatchRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.dispatchNumber}</td>
                    <td>{formatDate(record.dispatchDate)}</td>
                    <td>{formatNumber(record.quantityDispatched)} {record.quantityUnit}</td>
                    <td>{record.labelReference || 'Not set'}</td>
                    <td>{record.deliveryReference || 'Not set'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No dispatches" body="Dispatch records for this job will appear here." />
      )}
    </section>
  );
}
