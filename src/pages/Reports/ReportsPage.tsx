import { StatusBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { JobCard, ReportFilters } from '../../types';
import {
  JOB_STATUSES,
  WASTE_REASONS,
  formatDate,
  formatNumber,
  getMonthLabel,
} from '../../utils/calculations';

interface ProductionReportRow {
  jobNumber: string;
  jobDate: string;
  customerName: string;
  productName: string;
  status: string;
  quantityPlanned: number;
  quantityCompleted: number;
  paperUsed: number;
  totalWaste: number;
  wastePercent: number;
  fscRelated: string;
}

interface TimelineRow {
  id: string;
  eventDate: string;
  jobNumber: string;
  customerName: string;
  event: string;
  owner: string;
  source: string;
}

interface StaffWorkloadRow {
  name: string;
  role: string;
  activeJobs: number;
  overdueJobs: number;
  dueSoonJobs: number;
  completedJobs: number;
}

interface BottleneckRow {
  title: string;
  count: number;
  detail: string;
}

interface ClientTrackingRow {
  clientName: string;
  activeJobs: number;
  completedJobs: number;
  overdueJobs: number;
  dispatches: number;
  totalOrderValue: number;
  lastActivityDate: string;
  lastActivityLabel: string;
}

interface AuditRow {
  id: string;
  eventDate: string;
  source: string;
  action: string;
  reference: string;
  actor: string;
}

interface ReportsPageProps {
  monthOptions: string[];
  reportFilters: ReportFilters;
  setReportFilters: (value: ReportFilters) => void;
  reportJobsCount: number;
  reportWasteTotal: number;
  reportPaperLogsCount: number;
  reportFscTaggedCount: number;
  averageWastePerJob: number;
  averageWastePerCompletedJob: number;
  productionRows: ProductionReportRow[];
  wasteByReason: Array<{ label: string; value: number }>;
  wasteByJob: Array<{ label: string; value: number }>;
  paperByJob: Array<{ label: string; value: number }>;
  paperByType: Array<{ label: string; value: number }>;
  timelineRows: TimelineRow[];
  staffWorkloadRows: StaffWorkloadRow[];
  bottleneckRows: BottleneckRow[];
  clientTrackingRows: ClientTrackingRow[];
  auditRows: AuditRow[];
  onExport: () => void;
  onPrint: () => void;
}

export function ReportsPage(props: ReportsPageProps) {
  const {
    monthOptions,
    reportFilters,
    setReportFilters,
    reportJobsCount,
    reportWasteTotal,
    reportPaperLogsCount,
    reportFscTaggedCount,
    averageWastePerJob,
    averageWastePerCompletedJob,
    productionRows,
    wasteByReason,
    wasteByJob,
    paperByJob,
    paperByType,
    timelineRows,
    staffWorkloadRows,
    bottleneckRows,
    clientTrackingRows,
    auditRows,
    onExport,
    onPrint,
  } = props;

  return (
    <>
      <SectionTitle
        title="Reports"
        subtitle="Management summaries for production, waste, paper usage, and FSC-tagged records."
        action={
          <div className="inline-actions">
            <button className="secondary-button" onClick={onExport}>Export CSV</button>
            <button className="ghost-button" onClick={onPrint}>Print</button>
          </div>
        }
      />

      <div className="card filter-card">
        <div className="filters-grid filters-grid-wide">
          <label>
            Month
            <select value={reportFilters.month} onChange={(event) => setReportFilters({ ...reportFilters, month: event.target.value })}>
              <option value="">All months</option>
              {monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}
            </select>
          </label>
          <label>
            Date from
            <input type="date" value={reportFilters.dateFrom} onChange={(event) => setReportFilters({ ...reportFilters, dateFrom: event.target.value })} />
          </label>
          <label>
            Date to
            <input type="date" value={reportFilters.dateTo} onChange={(event) => setReportFilters({ ...reportFilters, dateTo: event.target.value })} />
          </label>
          <label>
            Job number
            <input value={reportFilters.jobNumber} onChange={(event) => setReportFilters({ ...reportFilters, jobNumber: event.target.value })} />
          </label>
          <label>
            Customer
            <input value={reportFilters.customer} onChange={(event) => setReportFilters({ ...reportFilters, customer: event.target.value })} />
          </label>
          <label>
            Status
            <select value={reportFilters.status} onChange={(event) => setReportFilters({ ...reportFilters, status: event.target.value })}>
              <option value="">All statuses</option>
              {JOB_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>
            FSC-related
            <select value={reportFilters.fsc} onChange={(event) => setReportFilters({ ...reportFilters, fsc: event.target.value })}>
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Waste reason
            <select value={reportFilters.wasteReason} onChange={(event) => setReportFilters({ ...reportFilters, wasteReason: event.target.value })}>
              <option value="">All reasons</option>
              {WASTE_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </label>
          <label>
            Paper type
            <input value={reportFilters.paperType} onChange={(event) => setReportFilters({ ...reportFilters, paperType: event.target.value })} />
          </label>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card"><p className="stat-label">Production jobs</p><h3>{reportJobsCount}</h3></div>
        <div className="card stat-card"><p className="stat-label">Monthly waste summary</p><h3>{formatNumber(reportWasteTotal)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Average waste per job</p><h3>{formatNumber(averageWastePerJob, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Waste per completed job</p><h3>{formatNumber(averageWastePerCompletedJob, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Paper usage logs</p><h3>{reportPaperLogsCount}</h3></div>
        <div className="card stat-card"><p className="stat-label">FSC-tagged records</p><h3>{reportFscTaggedCount}</h3></div>
      </div>

      <div className="reports-grid">
        <section className="card">
          <SectionTitle title="Job event timeline" subtitle="Shared operational milestones across jobs, artwork, production, and dispatch" />
          {timelineRows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Job</th>
                    <th>Client</th>
                    <th>Event</th>
                    <th>Owner</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineRows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.eventDate)}</td>
                      <td>{row.jobNumber}</td>
                      <td>{row.customerName}</td>
                      <td>{row.event}</td>
                      <td>{row.owner}</td>
                      <td>{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No timeline events yet" body="As jobs move across artwork, production, and dispatch, the shared event timeline will populate here." />
          )}
        </section>

        <section className="card">
          <SectionTitle title="Staff workload visibility" subtitle="Active workload and overdue pressure by owner" />
          {staffWorkloadRows.length ? (
            <div className="ranking-list">
              {staffWorkloadRows.map((row) => (
                <div key={`${row.role}-${row.name}`} className="bi-workload-item">
                  <div>
                    <strong>{row.name}</strong>
                    <div className="table-subtext">{row.role}</div>
                  </div>
                  <div className="bi-workload-metrics">
                    <span>Active: {formatNumber(row.activeJobs)}</span>
                    <span>Overdue: {formatNumber(row.overdueJobs)}</span>
                    <span>Due soon: {formatNumber(row.dueSoonJobs)}</span>
                    <span>Completed: {formatNumber(row.completedJobs)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No workload data" body="Assign jobs to sales, design, production, and dispatch owners to make workload reporting meaningful." />
          )}
        </section>
      </div>

      <div className="reports-grid">
        <section className="card">
          <SectionTitle title="Monthly production summary" subtitle="Per job output, waste, and paper usage" />
          {productionRows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Planned</th>
                    <th>Completed</th>
                    <th>Paper used</th>
                    <th>Total waste</th>
                    <th>Waste %</th>
                    <th>FSC</th>
                  </tr>
                </thead>
                <tbody>
                  {productionRows.map((row) => (
                    <tr key={row.jobNumber}>
                      <td><strong>{row.jobNumber}</strong><div className="table-subtext">{formatDate(row.jobDate)}</div></td>
                      <td>{row.customerName}</td>
                      <td><StatusBadge status={row.status as JobCard['status']} /></td>
                      <td>{formatNumber(row.quantityPlanned)}</td>
                      <td>{formatNumber(row.quantityCompleted)}</td>
                      <td>{formatNumber(row.paperUsed)}</td>
                      <td>{formatNumber(row.totalWaste)}</td>
                      <td>{formatNumber(row.wastePercent, 2)}%</td>
                      <td>{row.fscRelated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No production data for the current filters" body="Update the report filters to include matching jobs." />
          )}
        </section>

        <section className="card">
          <SectionTitle title="Bottleneck and exception reporting" subtitle="Operational pressure points that need intervention" />
          {bottleneckRows.length ? (
            <div className="ranking-list">
              {bottleneckRows.map((row) => (
                <div key={row.title} className="ranking-item">
                  <div>
                    <span>{row.title}</span>
                    <div className="table-subtext">{row.detail}</div>
                  </div>
                  <strong>{formatNumber(row.count)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No bottlenecks found" body="No active exceptions match the current report filters." />
          )}
        </section>

        {[
          ['Waste by reason', 'Required monthly waste summary', wasteByReason, 'No waste rows', 'Waste by reason will appear when the selected filters include waste entries.'],
          ['Waste by job', 'Use this for high-waste investigations', wasteByJob, 'No job-linked waste', 'No waste totals are available for the current filters.'],
          ['Paper usage by job', 'Structured usage history per production order', paperByJob, 'No paper-by-job data', 'No paper logs match the current report filters.'],
          ['Paper usage by paper type', 'Top paper categories used', paperByType, 'No paper type totals', 'Paper type totals will render once the report includes paper logs.'],
        ].map(([title, subtitle, rows, emptyTitle, emptyBody], index) => (
          <section key={`${String(title)}-${index}`} className="card">
            <SectionTitle title={String(title)} subtitle={String(subtitle)} />
            {(rows as Array<{ label: string; value: number }>).length ? (
              <div className="ranking-list">
                {(rows as Array<{ label: string; value: number }>).map((item) => (
                  <div key={item.label} className="ranking-item">
                    <span>{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={String(emptyTitle)} body={String(emptyBody)} />
            )}
          </section>
        ))}
      </div>

      <div className="reports-grid">
        <section className="card">
          <SectionTitle title="Client tracking views" subtitle="Commercial and operational visibility by client" />
          {clientTrackingRows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Active jobs</th>
                    <th>Completed</th>
                    <th>Overdue</th>
                    <th>Dispatches</th>
                    <th>Order value</th>
                    <th>Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {clientTrackingRows.map((row) => (
                    <tr key={row.clientName}>
                      <td><strong>{row.clientName}</strong></td>
                      <td>{formatNumber(row.activeJobs)}</td>
                      <td>{formatNumber(row.completedJobs)}</td>
                      <td>{formatNumber(row.overdueJobs)}</td>
                      <td>{formatNumber(row.dispatches)}</td>
                      <td>{formatNumber(row.totalOrderValue, 2)}</td>
                      <td>
                        {row.lastActivityDate ? formatDate(row.lastActivityDate) : 'Not set'}
                        <div className="table-subtext">{row.lastActivityLabel}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No client tracking rows" body="Once jobs, approvals, and dispatches are recorded, client-level tracking will appear here." />
          )}
        </section>

        <section className="card">
          <SectionTitle title="Operational audit history" subtitle="Cross-functional history across jobs, artwork, inventory, production, waste, paper, and dispatch" />
          {auditRows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Action</th>
                    <th>Reference</th>
                    <th>Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.eventDate)}</td>
                      <td>{row.source}</td>
                      <td>{row.action}</td>
                      <td>{row.reference}</td>
                      <td>{row.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No audit events found" body="Operational history will fill in as the selected date range includes more activity." />
          )}
        </section>
      </div>
    </>
  );
}
