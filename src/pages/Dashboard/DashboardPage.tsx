import { useMemo, useState } from 'react';
import { FlagBadge, StatusBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { StatCard } from '../../components/StatCard';
import { Client, DispatchRecord, FinishedGoodsStock, JobCard, MaterialReceipt, PaperLog, ProductionLogEntry, SparePart, WasteEntry } from '../../types';
import {
  calculateAverageWastePerCompletedJob,
  calculateAverageWastePerJob,
  formatDate,
  formatNumber,
  getDaysInStorage,
  getMonthLabel,
  getStorageAgeBand,
  getWastePercentForJob,
} from '../../utils/calculations';

interface DashboardPageProps {
  dashboardMonth: string;
  setDashboardMonth: (month: string) => void;
  monthOptions: string[];
  jobs: JobCard[];
  clients: Client[];
  materialReceipts: MaterialReceipt[];
  productionLogs: ProductionLogEntry[];
  wasteEntries: WasteEntry[];
  paperLogs: PaperLog[];
  dispatchRecords: DispatchRecord[];
  finishedGoodsStock: FinishedGoodsStock[];
  spareParts: SparePart[];
  dashboardJobs: JobCard[];
  dashboardMaterials: MaterialReceipt[];
  dashboardProductionLogs: ProductionLogEntry[];
  dashboardWaste: WasteEntry[];
  dashboardPaper: PaperLog[];
  dashboardDispatch: DispatchRecord[];
  dashboardFinishedStock: FinishedGoodsStock[];
  dashboardWasteByReason: Array<{ label: string; value: number }>;
  dashboardTopPaper: Array<{ label: string; value: number }>;
}

export function DashboardPage({
  dashboardMonth,
  setDashboardMonth,
  monthOptions,
  jobs,
  clients,
  materialReceipts,
  productionLogs,
  wasteEntries,
  paperLogs,
  dispatchRecords,
  finishedGoodsStock,
  spareParts,
  dashboardJobs,
  dashboardMaterials,
  dashboardProductionLogs,
  dashboardWaste,
  dashboardPaper,
  dashboardDispatch,
  dashboardFinishedStock,
  dashboardWasteByReason,
  dashboardTopPaper,
}: DashboardPageProps) {
  const [calculator, setCalculator] = useState({
    quantity: '10000',
    materialCost: '0',
    labourCost: '0',
    packagingCost: '0',
    transportCost: '0',
    overheadCost: '0',
    marginPercent: '20',
  });

  const calculatorOutputs = useMemo(() => {
    const quantity = Number(calculator.quantity || 0);
    const materialCost = Number(calculator.materialCost || 0);
    const labourCost = Number(calculator.labourCost || 0);
    const packagingCost = Number(calculator.packagingCost || 0);
    const transportCost = Number(calculator.transportCost || 0);
    const overheadCost = Number(calculator.overheadCost || 0);
    const marginPercent = Number(calculator.marginPercent || 0);
    const totalCost = materialCost + labourCost + packagingCost + transportCost + overheadCost;
    const unitCost = quantity > 0 ? totalCost / quantity : 0;
    const quotedTotal = totalCost * (1 + marginPercent / 100);
    const quotedUnitPrice = quantity > 0 ? quotedTotal / quantity : 0;
    return {
      totalCost,
      unitCost,
      quotedTotal,
      quotedUnitPrice,
    };
  }, [calculator]);

  const totalWasteThisMonth = dashboardWaste.reduce((sum, entry) => sum + entry.wasteQuantity, 0);
  const openJobsThisMonth = dashboardJobs.filter((job) => job.status !== 'Completed').length;
  const completedJobsThisMonth = dashboardJobs.filter((job) => job.status === 'Completed').length;
  const averageWasteThisMonth = calculateAverageWastePerJob(dashboardWaste, dashboardJobs);
  const fscJobsThisMonth = dashboardJobs.filter((job) => job.fscRelated).length;
  const lowStockSpares = spareParts.filter((part) => part.quantityOnHand <= (part.reorderLevel || part.minimumStockLevel)).length;
  const clientHeldStock = finishedGoodsStock.filter((item) => item.clientId).length;
  const awaitingArtwork = dashboardJobs.filter((job) => !job.artworkReceived).length;
  const awaitingApproval = dashboardJobs.filter((job) => job.approvalStatus === 'Awaiting Approval' || job.approvalStatus === 'Changes Requested').length;
  const stockReservedJobs = dashboardJobs.filter((job) => job.stockReservationStatus === 'Reserved').length;
  const productionNeededJobs = dashboardJobs.filter((job) => job.stockReservationStatus === 'Production Needed').length;
  const clientsOnHold = clients.filter((client) => client.accountHold).length;
  const clientsOverLimit = clients.filter((client) => client.creditLimit > 0 && client.currentBalance > client.creditLimit).length;
  const clientsNearLimit = clients.filter((client) => client.creditLimit > 0 && client.currentBalance <= client.creditLimit && client.currentBalance >= client.creditLimit * 0.85).length;
  const stockOverSixtyDays = finishedGoodsStock.filter((item) => getStorageAgeBand(getDaysInStorage(item.storedDate)) === '60+').length;
  const today = new Date().toISOString().slice(0, 10);
  const alerts = [
    ...jobs
      .filter((job) => !job.artworkReceived && job.status !== 'Completed')
      .slice(0, 6)
      .map((job) => ({
        id: `artwork-${job.id}`,
        label: 'Awaiting artwork',
        detail: `${job.jobNumber} · ${job.customerName}`,
      })),
    ...jobs
      .filter((job) => job.dueDate && job.dueDate < today && job.status !== 'Completed')
      .slice(0, 6)
      .map((job) => ({
        id: `overdue-${job.id}`,
        label: 'Job overdue',
        detail: `${job.jobNumber} · due ${formatDate(job.dueDate)}`,
      })),
    ...jobs
      .filter((job) => !productionLogs.some((log) => log.jobId === job.id) && !['Draft', 'Awaiting Artwork', 'Awaiting Proof Approval'].includes(job.status))
      .slice(0, 6)
      .map((job) => ({
        id: `nolog-${job.id}`,
        label: 'No production logs',
        detail: `${job.jobNumber} · ${job.status}`,
      })),
    ...jobs
      .filter((job) => job.status === 'Completed' && !dispatchRecords.some((record) => record.jobId === job.id))
      .slice(0, 6)
      .map((job) => ({
        id: `nodispatch-${job.id}`,
        label: 'Completed not dispatched',
        detail: `${job.jobNumber} · ${job.customerName}`,
      })),
    ...spareParts
      .filter((part) => part.quantityOnHand <= (part.reorderLevel || part.minimumStockLevel))
      .slice(0, 6)
      .map((part) => ({
        id: `spare-${part.id}`,
        label: 'Low spare stock',
        detail: `${part.partName} · ${formatNumber(part.quantityOnHand)} ${part.unitOfMeasure} on hand`,
      })),
    ...finishedGoodsStock
      .filter((item) => Boolean(item.clientId) && getStorageAgeBand(getDaysInStorage(item.storedDate)) === '60+')
      .slice(0, 6)
      .map((item) => ({
        id: `aged-${item.id}`,
        label: 'Aged client stock',
        detail: `${item.stockNumber} · ${item.clientName} · ${getDaysInStorage(item.storedDate)} days`,
      })),
    ...clients
      .filter((client) => client.creditLimit > 0 && client.currentBalance > client.creditLimit)
      .slice(0, 6)
      .map((client) => ({
        id: `credit-${client.id}`,
        label: 'Over credit limit',
        detail: `${client.name} · ${formatNumber(client.currentBalance)} / ${formatNumber(client.creditLimit)}`,
      })),
  ];

  return (
    <>
      <SectionTitle
        title="Dashboard"
        subtitle={`Operational snapshot for ${getMonthLabel(dashboardMonth)}`}
        action={
          <label className="compact-field">
            <span>Dashboard month</span>
            <select value={dashboardMonth} onChange={(event) => setDashboardMonth(event.target.value)}>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {getMonthLabel(option)}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total jobs this month" value={String(dashboardJobs.length)} />
        <StatCard label="Jobs currently open" value={String(openJobsThisMonth)} />
        <StatCard label="Jobs completed this month" value={String(completedJobsThisMonth)} />
        <StatCard label="Material receipts" value={String(dashboardMaterials.length)} />
        <StatCard label="Production log rows" value={String(dashboardProductionLogs.length)} />
        <StatCard label="Total waste this month" value={formatNumber(totalWasteThisMonth)} helper="Based on captured waste logs" />
        <StatCard label="Average waste per job" value={formatNumber(averageWasteThisMonth, 2)} />
        <StatCard label="Paper usage records" value={String(dashboardPaper.length)} />
        <StatCard label="Dispatches" value={String(dashboardDispatch.length)} />
        <StatCard label="Finished stock batches" value={String(dashboardFinishedStock.length)} />
        <StatCard label="Low spares alerts" value={String(lowStockSpares)} />
        <StatCard label="Jobs awaiting artwork" value={String(awaitingArtwork)} />
        <StatCard label="Jobs awaiting proof action" value={String(awaitingApproval)} />
        <StatCard label="Stock-reserved jobs" value={String(stockReservedJobs)} />
        <StatCard label="Production-needed jobs" value={String(productionNeededJobs)} />
        <StatCard label="Clients over credit" value={String(clientsOverLimit)} />
        <StatCard label="Clients on hold" value={String(clientsOnHold)} />
        <StatCard label="Stock over 60 days" value={String(stockOverSixtyDays)} />
      </div>

      <div className="summary-strip">
        <div className="summary-chip">
          <span>FSC-related jobs</span>
          <strong>{fscJobsThisMonth}</strong>
        </div>
        <div className="summary-chip">
          <span>Average waste per completed job</span>
          <strong>{formatNumber(calculateAverageWastePerCompletedJob(dashboardWaste, dashboardJobs), 2)}</strong>
        </div>
        <div className="summary-chip">
          <span>Total paper used</span>
          <strong>{formatNumber(dashboardPaper.reduce((sum, log) => sum + log.quantityUsed, 0))}</strong>
        </div>
        <div className="summary-chip">
          <span>Client stock batches held</span>
          <strong>{clientHeldStock}</strong>
        </div>
        <div className="summary-chip">
          <span>Clients near credit limit</span>
          <strong>{clientsNearLimit}</strong>
        </div>
        <div className="summary-chip">
          <span>Long-held stock alerts</span>
          <strong>{stockOverSixtyDays}</strong>
        </div>
      </div>

      <div className="card">
        <SectionTitle title="Exceptions & Alerts" subtitle="Operational items that need attention before they become bigger problems." />
        {alerts.length ? (
          <div className="ranking-list">
            {alerts.map((alert) => (
              <div key={alert.id} className="ranking-item">
                <span>{alert.label}</span>
                <strong>{alert.detail}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No active exceptions" body="The main operational exceptions list is currently clear." />
        )}
      </div>

      <div className="card">
        <SectionTitle title="Quick Calculator" subtitle="Use this for fast bag/job pricing checks while the full estimating engine is still being built." />
        <div className="calculator-grid">
          <label>
            Quantity
            <input type="number" min="0" value={calculator.quantity} onChange={(event) => setCalculator({ ...calculator, quantity: event.target.value })} />
          </label>
          <label>
            Material cost
            <input type="number" min="0" step="0.01" value={calculator.materialCost} onChange={(event) => setCalculator({ ...calculator, materialCost: event.target.value })} />
          </label>
          <label>
            Labour cost
            <input type="number" min="0" step="0.01" value={calculator.labourCost} onChange={(event) => setCalculator({ ...calculator, labourCost: event.target.value })} />
          </label>
          <label>
            Packaging cost
            <input type="number" min="0" step="0.01" value={calculator.packagingCost} onChange={(event) => setCalculator({ ...calculator, packagingCost: event.target.value })} />
          </label>
          <label>
            Transport cost
            <input type="number" min="0" step="0.01" value={calculator.transportCost} onChange={(event) => setCalculator({ ...calculator, transportCost: event.target.value })} />
          </label>
          <label>
            Overhead cost
            <input type="number" min="0" step="0.01" value={calculator.overheadCost} onChange={(event) => setCalculator({ ...calculator, overheadCost: event.target.value })} />
          </label>
          <label>
            Margin %
            <input type="number" min="0" step="0.1" value={calculator.marginPercent} onChange={(event) => setCalculator({ ...calculator, marginPercent: event.target.value })} />
          </label>
        </div>
        <div className="summary-strip">
          <div className="summary-chip">
            <span>Total cost</span>
            <strong>{formatNumber(calculatorOutputs.totalCost, 2)}</strong>
          </div>
          <div className="summary-chip">
            <span>Unit cost</span>
            <strong>{formatNumber(calculatorOutputs.unitCost, 4)}</strong>
          </div>
          <div className="summary-chip">
            <span>Quoted total</span>
            <strong>{formatNumber(calculatorOutputs.quotedTotal, 2)}</strong>
          </div>
          <div className="summary-chip">
            <span>Quoted unit price</span>
            <strong>{formatNumber(calculatorOutputs.quotedUnitPrice, 4)}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <SectionTitle title="Finished stock on hand" />
          {finishedGoodsStock.length ? (
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Product</th>
                  <th>Client</th>
                  <th>Available</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {finishedGoodsStock.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td>{item.stockNumber}</td>
                    <td>{item.productName}</td>
                    <td>{item.clientName || 'General stock'}</td>
                    <td>{formatNumber(item.quantityAvailable)} {item.quantityUnit}</td>
                    <td>{formatNumber(getDaysInStorage(item.storedDate))} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No finished stock yet" body="Stored finished goods will appear here once stock is recorded." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Parts needing attention" />
          {spareParts.length ? (
            <table>
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Machine</th>
                  <th>On hand</th>
                  <th>Reorder</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.slice(0, 6).map((part) => (
                  <tr key={part.id}>
                    <td>{part.partName}</td>
                    <td>{part.machineReference || 'General'}</td>
                    <td>{formatNumber(part.quantityOnHand)} {part.unitOfMeasure}</td>
                    <td>{formatNumber(part.reorderLevel)} {part.unitOfMeasure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No spare parts yet" body="Critical maintenance stock will appear here once recorded." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Recent jobs" />
          {jobs.length ? (
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Waste %</th>
                  <th>FSC</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 6).map((job) => (
                  <tr key={job.id}>
                    <td>{job.jobNumber}</td>
                    <td>{job.customerName}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td>{formatNumber(getWastePercentForJob(job, wasteEntries), 2)}%</td>
                    <td><FlagBadge value={job.fscRelated} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No jobs yet" body="Create a job card to start building the digital production history." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Recent material receipts" />
          {materialReceipts.length ? (
            <table>
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Supplier</th>
                  <th>Roll code</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {materialReceipts.slice(0, 6).map((receipt) => (
                  <tr key={receipt.id}>
                    <td>{receipt.receiptNumber}</td>
                    <td>{receipt.supplierName}</td>
                    <td>{receipt.internalRollCode}</td>
                    <td>{formatNumber(receipt.quantityReceived)} {receipt.quantityUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No receipts yet" body="Material receiving records will appear here." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Recent waste entries" />
          {wasteEntries.length ? (
            <table>
              <thead>
                <tr>
                  <th>Waste</th>
                  <th>Job</th>
                  <th>Qty</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {wasteEntries.slice(0, 6).map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.wasteNumber}</td>
                    <td>{entry.jobNumber}</td>
                    <td>{formatNumber(entry.wasteQuantity)} {entry.wasteUnit}</td>
                    <td>{entry.wasteReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No waste logged" body="Waste entries will appear here once operators start capturing production waste." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Recent production logs" />
          {productionLogs.length ? (
            <table>
              <thead>
                <tr>
                  <th>Log</th>
                  <th>Type</th>
                  <th>Job</th>
                  <th>Machine</th>
                </tr>
              </thead>
              <tbody>
                {productionLogs.slice(0, 6).map((log) => (
                  <tr key={log.id}>
                    <td>{log.logNumber}</td>
                    <td>{log.logType}</td>
                    <td>{log.jobNumber}</td>
                    <td>{log.machine || 'Not set'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No production logs yet" body="Process records will appear here once operators begin logging work." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Recent paper logs" />
          {paperLogs.length ? (
            <table>
              <thead>
                <tr>
                  <th>Paper log</th>
                  <th>Job</th>
                  <th>Paper type</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {paperLogs.slice(0, 6).map((log) => (
                  <tr key={log.id}>
                    <td>{log.paperLogNumber}</td>
                    <td>{log.jobNumber}</td>
                    <td>{log.paperType}</td>
                    <td>{formatNumber(log.quantityUsed)} {log.quantityUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No paper logs yet" body="Paper usage history will appear here after the stores team starts recording usage." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Recent dispatches" />
          {dispatchRecords.length ? (
            <table>
              <thead>
                <tr>
                  <th>Dispatch</th>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {dispatchRecords.slice(0, 6).map((record) => (
                  <tr key={record.id}>
                    <td>{record.dispatchNumber}</td>
                    <td>{record.jobNumber}</td>
                    <td>{record.customerName}</td>
                    <td>{formatNumber(record.quantityDispatched)} {record.quantityUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No dispatch records" body="Customer dispatch history will appear here." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Waste by reason" subtitle="Top drivers this month" />
          {dashboardWasteByReason.length ? (
            <div className="ranking-list">
              {dashboardWasteByReason.map((item) => (
                <div key={item.label} className="ranking-item">
                  <span>{item.label}</span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No waste data" body="Waste trends will render after entries are logged for the selected month." />
          )}
        </div>

        <div className="card">
          <SectionTitle title="Top paper types used" subtitle="Usage for the selected month" />
          {dashboardTopPaper.length ? (
            <div className="ranking-list">
              {dashboardTopPaper.map((item) => (
                <div key={item.label} className="ranking-item">
                  <span>{item.label}</span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No paper data" body="Paper type usage will appear here once paper logs are captured." />
          )}
        </div>
      </div>
    </>
  );
}
