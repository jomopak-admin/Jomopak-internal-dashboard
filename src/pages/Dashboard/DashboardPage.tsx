import { useMemo, useState } from 'react';
import { FlagBadge, StatusBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { StatCard } from '../../components/StatCard';
import { Client, DashboardWidget, DispatchRecord, FinishedGoodsStock, JobCard, Lead, MaterialReceipt, PaperLog, ProductionLogEntry, SparePart, WasteEntry } from '../../types';
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
  visibleWidgets: DashboardWidget[];
  /** All leads — used by the Leads-attention widget. Optional. */
  leads?: Lead[];
  /** Open a lead by id in the Leads page (deep-link). Optional. */
  onOpenLead?: (leadId: string) => void;
  /** Phase 100 — click-through targets for the big Attention strip at the
   *  top of the dashboard. Each handler should switch view + apply the
   *  appropriate filter (status='Awaiting Artwork', etc.). */
  onJumpToOpenJobs?: () => void;
  onJumpToAwaitingArtwork?: () => void;
  onJumpToOverdueJobs?: () => void;
  onJumpToOverCreditClients?: () => void;
  onJumpToOnHoldClients?: () => void;
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
  visibleWidgets,
  leads = [],
  onOpenLead,
  onJumpToOpenJobs,
  onJumpToAwaitingArtwork,
  onJumpToOverdueJobs,
  onJumpToOverCreditClients,
  onJumpToOnHoldClients,
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
  const recentDashboardJobs = useMemo(
    () => [...dashboardJobs].sort((left, right) => right.jobDate.localeCompare(left.jobDate)).slice(0, 6),
    [dashboardJobs],
  );

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
  const widgetSet = useMemo(() => new Set(visibleWidgets), [visibleWidgets]);

  const ALERTS_PRIMARY_LIMIT = 8;
  const visibleAlerts = alerts.slice(0, ALERTS_PRIMARY_LIMIT);
  const overflowAlerts = Math.max(alerts.length - ALERTS_PRIMARY_LIMIT, 0);

  // Anything other than the three primary widgets is now grouped under "More" so the home
  // view stays calm. The user's widget toggles still control what renders inside More.
  const hasMoreContent =
    widgetSet.has('stats')
    || widgetSet.has('monthSummary')
    || widgetSet.has('quickCalculator')
    || widgetSet.has('finishedStock')
    || widgetSet.has('partsAttention')
    || widgetSet.has('recentMaterials')
    || widgetSet.has('recentWaste')
    || widgetSet.has('recentProduction')
    || widgetSet.has('recentPaper')
    || widgetSet.has('recentDispatch')
    || widgetSet.has('wasteByReason')
    || widgetSet.has('topPaper');

  // Phase 100 — Attention strip metrics. Use the full job list (not just
  // this month) for click-through so the user lands on every open item.
  const allOpenJobs = jobs.filter((j) => j.status !== 'Completed').length;
  const allAwaitingArtwork = jobs.filter((j) => !j.artworkReceived && j.status !== 'Completed').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const allOverdueJobs = jobs.filter((j) => j.dueDate && j.dueDate < todayStr && j.status !== 'Completed').length;
  // For "over credit" we need an inline check since DashboardPage doesn't
  // import effectiveClientBalance. Approximate via the client's stored
  // outstandingBalance if present; otherwise fall through to clients on
  // explicit account hold + flagged-by-CEO patterns.
  const allOverCredit = clients.filter((c) => c.creditLimit > 0
    && Number((c as Client & { outstandingBalance?: number }).outstandingBalance ?? 0) > c.creditLimit).length;
  const allOnHold = clients.filter((c) => c.accountHold).length;

  return (
    <>
      <div className="dashboard-controls">
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
        <p className="muted dashboard-controls-caption">Snapshot for {getMonthLabel(dashboardMonth)}</p>
      </div>

      {/* Phase 100 — Big clickable attention strip. Sits above everything
          else so it's the first thing you see. Each tile jumps to the
          relevant page filtered to that bucket. */}
      <div className="attention-strip">
        <AttentionTile
          label="Open jobs"
          value={allOpenJobs}
          tone={allOpenJobs > 0 ? 'neutral' : 'quiet'}
          subtitle={allOpenJobs > 0 ? 'Click to see what\'s in flight' : 'All clear'}
          onClick={onJumpToOpenJobs}
        />
        <AttentionTile
          label="Awaiting artwork"
          value={allAwaitingArtwork}
          tone={allAwaitingArtwork > 0 ? 'warn' : 'quiet'}
          subtitle={allAwaitingArtwork > 0 ? 'Chase the client / artwork team' : 'No artwork bottleneck'}
          onClick={onJumpToAwaitingArtwork}
        />
        <AttentionTile
          label="Overdue jobs"
          value={allOverdueJobs}
          tone={allOverdueJobs > 0 ? 'alert' : 'quiet'}
          subtitle={allOverdueJobs > 0 ? 'Past their due date' : 'Nothing past due'}
          onClick={onJumpToOverdueJobs}
        />
        <AttentionTile
          label="Over credit"
          value={allOverCredit}
          tone={allOverCredit > 0 ? 'alert' : 'quiet'}
          subtitle={allOverCredit > 0 ? 'Clients past their credit limit' : 'Everyone within limit'}
          onClick={onJumpToOverCreditClients}
        />
        <AttentionTile
          label="On hold"
          value={allOnHold}
          tone={allOnHold > 0 ? 'warn' : 'quiet'}
          subtitle={allOnHold > 0 ? 'Accounts blocked from invoicing' : 'No holds in place'}
          onClick={onJumpToOnHoldClients}
        />
      </div>

      {widgetSet.has('stats') ? (
      <div className="stats-grid stats-grid-compact">
        <StatCard label="Open jobs" value={String(openJobsThisMonth)} />
        <StatCard label="Awaiting artwork" value={String(awaitingArtwork)} />
        <StatCard label="Awaiting proof action" value={String(awaitingApproval)} />
        <StatCard label="Total waste" value={formatNumber(totalWasteThisMonth)} helper="This month" />
        <StatCard label="Stock over 60 days" value={String(stockOverSixtyDays)} />
      </div>
      ) : null}

      {widgetSet.has('alerts') ? (
      <div className="card">
        <SectionTitle title="Needs attention" subtitle={alerts.length ? `${alerts.length} item${alerts.length === 1 ? '' : 's'} flagged across operations` : undefined} />
        {alerts.length ? (
          <>
            <div className="ranking-list">
              {visibleAlerts.map((alert) => (
                <div key={alert.id} className="ranking-item">
                  <span>{alert.label}</span>
                  <strong>{alert.detail}</strong>
                </div>
              ))}
            </div>
            {overflowAlerts > 0 ? (
              <p className="muted" style={{ marginTop: 8 }}>+{overflowAlerts} more — open the relevant module to review.</p>
            ) : null}
          </>
        ) : (
          <EmptyState title="No active exceptions" body="The main operational exceptions list is currently clear." />
        )}
      </div>
      ) : null}

      {widgetSet.has('leadsAttention') ? (
        <LeadsAttentionWidget leads={leads} onOpenLead={onOpenLead} />
      ) : null}

      {widgetSet.has('recentJobs') ? (
      <div className="card">
        <SectionTitle title="Recent jobs" subtitle="Latest jobs from the selected month" />
        {recentDashboardJobs.length ? (
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
              {recentDashboardJobs.map((job) => (
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
          <EmptyState title="No jobs in this dashboard month" body="Change the dashboard month if the jobs were created in a different period." />
        )}
      </div>
      ) : null}

      {hasMoreContent ? (
      <details className="dashboard-more">
        <summary>
          <span>More metrics &amp; history</span>
          <span className="dashboard-more-hint muted">Detailed stats, calculator, recent activity</span>
        </summary>
        <div className="dashboard-more-body">

      {widgetSet.has('stats') ? (
      <div className="card">
        <SectionTitle title="Detailed metrics" subtitle="Full stat set for the selected month" />
        <div className="stats-grid">
          <StatCard label="Total jobs this month" value={String(dashboardJobs.length)} />
          <StatCard label="Jobs completed this month" value={String(completedJobsThisMonth)} />
          <StatCard label="Material receipts" value={String(dashboardMaterials.length)} />
          <StatCard label="Production log rows" value={String(dashboardProductionLogs.length)} />
          <StatCard label="Average waste per job" value={formatNumber(averageWasteThisMonth, 2)} />
          <StatCard label="Paper usage records" value={String(dashboardPaper.length)} />
          <StatCard label="Dispatches" value={String(dashboardDispatch.length)} />
          <StatCard label="Finished stock batches" value={String(dashboardFinishedStock.length)} />
          <StatCard label="Low spares alerts" value={String(lowStockSpares)} />
          <StatCard label="Stock-reserved jobs" value={String(stockReservedJobs)} />
          <StatCard label="Production-needed jobs" value={String(productionNeededJobs)} />
          <StatCard label="Clients over credit" value={String(clientsOverLimit)} />
          <StatCard label="Clients on hold" value={String(clientsOnHold)} />
        </div>
      </div>
      ) : null}

      {widgetSet.has('monthSummary') ? (
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
      ) : null}

      {widgetSet.has('quickCalculator') ? (
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
      ) : null}

      <div className="dashboard-grid">
        {widgetSet.has('finishedStock') ? (
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
        ) : null}

        {widgetSet.has('partsAttention') ? (
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
        ) : null}

        {widgetSet.has('recentMaterials') ? (
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
        ) : null}

        {widgetSet.has('recentWaste') ? (
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
        ) : null}

        {widgetSet.has('recentProduction') ? (
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
        ) : null}

        {widgetSet.has('recentPaper') ? (
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
        ) : null}

        {widgetSet.has('recentDispatch') ? (
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
        ) : null}

        {widgetSet.has('wasteByReason') ? (
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
        ) : null}

        {widgetSet.has('topPaper') ? (
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
        ) : null}
      </div>
        </div>
      </details>
      ) : null}
    </>
  );
}

// ---- Leads needing attention widget ----

const DAY_MS = 1000 * 60 * 60 * 24;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function LeadsAttentionWidget({ leads, onOpenLead }: { leads: Lead[]; onOpenLead?: (id: string) => void }) {
  const today = todayISO();

  const overdue = useMemo(() => leads.filter((l) =>
    l.status !== 'Won' && l.status !== 'Lost'
    && !!l.nextFollowUpDate && l.nextFollowUpDate < today,
  ), [leads, today]);

  const dueToday = useMemo(() => leads.filter((l) =>
    l.status !== 'Won' && l.status !== 'Lost'
    && l.nextFollowUpDate === today,
  ), [leads, today]);

  const dueThisWeek = useMemo(() => leads.filter((l) => {
    if (l.status === 'Won' || l.status === 'Lost') return false;
    if (!l.nextFollowUpDate || l.nextFollowUpDate <= today) return false;
    const t = new Date(l.nextFollowUpDate).getTime();
    if (Number.isNaN(t)) return false;
    return t - Date.now() < 7 * DAY_MS;
  }), [leads, today]);

  const unscheduled = useMemo(() => leads.filter((l) =>
    l.status !== 'Won' && l.status !== 'Lost' && !l.nextFollowUpDate,
  ), [leads]);

  const headline = [...overdue, ...dueToday].slice(0, 8);

  return (
    <div className="card">
      <SectionTitle title="Leads needing attention today" subtitle={`${overdue.length} overdue · ${dueToday.length} due today · ${dueThisWeek.length} this week · ${unscheduled.length} unscheduled`} />
      {headline.length === 0 ? (
        <EmptyState title="Nothing on the leads radar today" body="No overdue follow-ups and nothing due today. Either you're caught up, or new leads need a follow-up date set." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {headline.map((l) => {
                const isOverdue = !!l.nextFollowUpDate && l.nextFollowUpDate < today;
                const daysOverdue = isOverdue ? Math.floor((Date.now() - new Date(l.nextFollowUpDate!).getTime()) / DAY_MS) : 0;
                return (
                  <tr key={l.id}>
                    <td><strong>{l.leadNumber}</strong><div className="table-subtext">{l.companyName}</div></td>
                    <td>{l.contactName || '—'}<div className="table-subtext">{l.phone || l.email}</div></td>
                    <td>{l.source}</td>
                    <td>{l.status}</td>
                    <td className={isOverdue ? 'cell-alert' : undefined}>
                      {l.nextFollowUpDate ? formatDate(l.nextFollowUpDate) : '—'}
                      {isOverdue ? <div className="table-subtext" style={{ color: '#b22b2b' }}>{daysOverdue}d overdue</div> : null}
                    </td>
                    <td>{onOpenLead ? <button className="table-button" onClick={() => onOpenLead(l.id)}>Open</button> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Phase 100: AttentionTile ──────────────────────────────────────────
 * Big clickable card that surfaces an important count + a one-line
 * subtitle. Tone drives the border + value colour:
 *   - quiet    = green / faded (everything fine)
 *   - neutral  = plain (some open work, nothing urgent)
 *   - warn     = amber (chase / look at it)
 *   - alert    = red (act now)
 * Clicking calls onClick which the parent wires to a setView + filter
 * change so you land on the relevant page already drilled-in.
 * ──────────────────────────────────────────────────────────────────── */

function AttentionTile(props: {
  label: string;
  value: number;
  tone: 'quiet' | 'neutral' | 'warn' | 'alert';
  subtitle: string;
  onClick?: () => void;
}) {
  const { label, value, tone, subtitle, onClick } = props;
  const palette = {
    quiet:   { border: 'var(--jp-border, #e5e2dc)', bg: 'var(--jp-paper, #fff)',           valueColour: '#2e6f3e' },
    neutral: { border: 'var(--jp-border, #e5e2dc)', bg: 'var(--jp-paper, #fff)',           valueColour: 'var(--jp-ink, #222)' },
    warn:    { border: 'rgba(184,134,11,0.45)',     bg: 'rgba(184,134,11,0.06)',           valueColour: '#8a6510' },
    alert:   { border: 'rgba(178,43,43,0.55)',      bg: 'rgba(178,43,43,0.06)',            valueColour: '#b22b2b' },
  }[tone];

  const Wrap = onClick ? 'button' : 'div';

  return (
    <Wrap
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '16px 18px',
        borderRadius: 12,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        fontFamily: 'inherit',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      } : undefined}
    >
      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>
        {label}
      </span>
      <div style={{ fontSize: 32, fontWeight: 700, color: palette.valueColour, lineHeight: 1.1, fontFeatureSettings: '"tnum"' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>
        {subtitle}{onClick ? ' →' : ''}
      </div>
    </Wrap>
  );
}
