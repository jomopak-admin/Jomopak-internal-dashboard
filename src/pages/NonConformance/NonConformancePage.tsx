/**
 * Non-Conformance Register (NCR + CAPA).
 *
 * Floor-side food safety issues that aren't customer complaints. Each
 * NCR captures the issue, optional links to job / batch / FG / cleaning
 * log, severity, the immediate action taken, root-cause analysis, and
 * the corrective + preventive actions through to closure.
 *
 * The list view flags overdue items (due date passed but status not
 * Closed) in red. Filters cover date window, area, type, severity,
 * status, and an overdue-only toggle.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  CleaningLogEntry,
  FACTORY_AREAS,
  FactoryArea,
  FinishedGoodsStock,
  JobCard,
  NCR_ISSUE_TYPES,
  NcrIssueType,
  NcrSeverity,
  NcrStatus,
  NonConformance,
  NonConformanceFilters,
  NonConformanceFormState,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface NonConformancePageProps {
  ncrs: NonConformance[];
  jobs: JobCard[];
  finishedGoodsStock: FinishedGoodsStock[];
  cleaningLogs: CleaningLogEntry[];
  filters: NonConformanceFilters;
  setFilters: (v: NonConformanceFilters) => void;
  form: NonConformanceFormState;
  setForm: (v: NonConformanceFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (n: NonConformance) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function isOverdue(n: NonConformance): boolean {
  if (n.status === 'Closed') return false;
  if (!n.dueDate) return false;
  return Date.now() > new Date(n.dueDate).getTime();
}

function inWindow(date: string, w: NonConformanceFilters['dateWindow']) {
  if (w === 'all') return true;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  const age = Date.now() - t;
  if (w === 'today') return new Date(date).toDateString() === new Date().toDateString();
  if (w === '7d') return age < 7 * DAY_MS;
  if (w === '30d') return age < 30 * DAY_MS;
  if (w === '90d') return age < 90 * DAY_MS;
  return true;
}

export function NonConformancePage(props: NonConformancePageProps) {
  const {
    ncrs, jobs, finishedGoodsStock, cleaningLogs,
    filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => {
    return ncrs.filter((n) => {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const hay = [n.ncrNumber, n.description, n.area, n.areaDetail, n.jobNumber, n.finishedGoodsStockNumber, n.reportedByName, n.responsiblePersonName].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.area && n.area !== filters.area) return false;
      if (filters.issueType && n.issueType !== filters.issueType) return false;
      if (filters.severity && n.severity !== filters.severity) return false;
      if (filters.status && n.status !== filters.status) return false;
      if (filters.overdue === 'overdue-only' && !isOverdue(n)) return false;
      if (filters.overdue === 'on-track' && isOverdue(n)) return false;
      if (!inWindow(n.issueDate, filters.dateWindow)) return false;
      return true;
    });
  }, [ncrs, filters]);

  const stats = useMemo(() => {
    const open = ncrs.filter((n) => n.status !== 'Closed').length;
    const overdue = ncrs.filter((n) => isOverdue(n)).length;
    const critical = ncrs.filter((n) => n.severity === 'Critical').length;
    return { total: ncrs.length, open, overdue, critical };
  }, [ncrs]);

  function handleStartCreate() { onReset(); setMode('form'); }
  function handleStartEdit(n: NonConformance) { onEdit(n); setMode('form'); }
  function handleBackToList() { onReset(); setMode('list'); }

  const sections: FormWizardSection[] = [
    {
      key: 'what',
      title: 'What & where',
      missingRequired: [
        ...(form.issueDate ? [] : ['Issue date']),
        ...(form.description.trim() ? [] : ['Description']),
        ...(form.reportedByName.trim() ? [] : ['Reported by']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Issue date <RequiredMarker /></span><input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></label>
          <label><span>Area</span>
            <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as FactoryArea })}>
              {FACTORY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label><span>Area detail</span><input value={form.areaDetail} onChange={(e) => setForm({ ...form, areaDetail: e.target.value })} placeholder="Specific spot / machine if needed" /></label>
          <label><span>Issue type</span>
            <select value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value as NcrIssueType })}>
              {NCR_ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label><span>Severity</span>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as NcrSeverity })}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
          <label><span>Reported by <RequiredMarker /></span><input value={form.reportedByName} onChange={(e) => setForm({ ...form, reportedByName: e.target.value })} placeholder="Operator / supervisor name" /></label>
          <label className="full-span"><span>Description <RequiredMarker /></span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was the issue? Be specific." /></label>
        </div>
      ),
    },
    {
      key: 'links',
      title: 'Traceability links',
      subtitle: 'Pin to the job / batch / FG / cleaning log this NCR affects. Lights up the Traceability search.',
      contextActive: !!(form.jobId || form.finishedGoodsStockId || form.cleaningLogId),
      body: (
        <div className="form-grid">
          <label><span>Job</span>
            <select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })}>
              <option value="">No job link</option>
              {jobs.slice(0, 200).map((j) => <option key={j.id} value={j.id}>{j.jobNumber} · {j.productName}</option>)}
            </select>
          </label>
          <label><span>Finished goods batch</span>
            <select value={form.finishedGoodsStockId} onChange={(e) => setForm({ ...form, finishedGoodsStockId: e.target.value })}>
              <option value="">No FG link</option>
              {finishedGoodsStock.slice(0, 200).map((f) => <option key={f.id} value={f.id}>{f.stockNumber} · {f.productName}</option>)}
            </select>
          </label>
          <label className="full-span"><span>Cleaning log</span>
            <select value={form.cleaningLogId} onChange={(e) => setForm({ ...form, cleaningLogId: e.target.value })}>
              <option value="">No cleaning-log link</option>
              {cleaningLogs.slice(0, 100).map((l) => <option key={l.id} value={l.id}>{l.logNumber} · {l.area} · {l.result}</option>)}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'action',
      title: 'Immediate action & root cause',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Immediate action (what was done to contain)</span><textarea rows={2} value={form.immediateAction} onChange={(e) => setForm({ ...form, immediateAction: e.target.value })} /></label>
          <label className="full-span"><span>Root cause analysis</span><textarea rows={2} value={form.rootCauseAnalysis} onChange={(e) => setForm({ ...form, rootCauseAnalysis: e.target.value })} placeholder="5 whys / fishbone / equipment failure / process gap" /></label>
        </div>
      ),
    },
    {
      key: 'capa',
      title: 'Corrective + preventive action',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Corrective action (fix this instance)</span><textarea rows={2} value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} /></label>
          <label className="full-span"><span>Preventive action (stop recurrence)</span><textarea rows={2} value={form.preventiveAction} onChange={(e) => setForm({ ...form, preventiveAction: e.target.value })} /></label>
          <label><span>Responsible person</span><input value={form.responsiblePersonName} onChange={(e) => setForm({ ...form, responsiblePersonName: e.target.value })} placeholder="Owner of the CAPA" /></label>
          <label><span>Due date</span><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'closure',
      title: 'Verification & closure',
      body: (
        <div className="form-grid">
          <label><span>Status</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as NcrStatus })}>
              <option value="Open">Open</option>
              <option value="In Progress">In progress</option>
              <option value="Awaiting Verification">Awaiting verification</option>
              <option value="Closed">Closed</option>
              <option value="Escalated">Escalated</option>
            </select>
          </label>
          <label><span>Verified by</span><input value={form.verifiedByName} onChange={(e) => setForm({ ...form, verifiedByName: e.target.value })} placeholder="Person confirming corrective action worked" /></label>
          <label><span>Closed by</span><input value={form.closedByName} onChange={(e) => setForm({ ...form, closedByName: e.target.value })} placeholder="Final closure approver" /></label>
          <label className="full-span"><span>Closure notes</span><textarea rows={2} value={form.closureNotes} onChange={(e) => setForm({ ...form, closureNotes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={handleStartCreate}>Log NCR</button>
        : <button className="ghost-button" onClick={handleBackToList}>Back to NCRs</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit NCR' : 'New non-conformance'}
          subtitle="Floor-side food safety issue. Pin to job / batch / cleaning log for full traceability."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!editingId}
          saveLabel="Save NCR"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Non-Conformance Register" subtitle={`${filtered.length} of ${ncrs.length} shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className={`food-safety-stat${stats.open > 0 ? ' food-safety-stat-alert' : ''}`}><span>Open</span><strong>{stats.open}</strong></div>
            <div className={`food-safety-stat${stats.overdue > 0 ? ' food-safety-stat-alert' : ''}`}><span>Overdue CAPA</span><strong>{stats.overdue}</strong></div>
            <div className={`food-safety-stat${stats.critical > 0 ? ' food-safety-stat-alert' : ''}`}><span>Critical</span><strong>{stats.critical}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="#, area, job, batch, person" /></label>
            <label><span>Area</span>
              <select value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
                <option value="">All</option>
                {FACTORY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label><span>Issue type</span>
              <select value={filters.issueType} onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}>
                <option value="">All</option>
                {NCR_ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Severity</span>
              <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
                <option value="">All</option>
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Open</option><option>In Progress</option><option>Awaiting Verification</option><option>Closed</option><option>Escalated</option>
              </select>
            </label>
            <label><span>CAPA</span>
              <select value={filters.overdue} onChange={(e) => setFilters({ ...filters, overdue: e.target.value as NonConformanceFilters['overdue'] })}>
                <option value="all">All</option>
                <option value="overdue-only">Overdue only</option>
                <option value="on-track">On-track only</option>
              </select>
            </label>
            <label><span>Window</span>
              <select value={filters.dateWindow} onChange={(e) => setFilters({ ...filters, dateWindow: e.target.value as NonConformanceFilters['dateWindow'] })}>
                <option value="today">Today</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No NCRs in this window" body="Log a non-conformance whenever something goes wrong on the floor — failed cleaning, foreign object, pest sighting, wrong material. The register is what an auditor reads first." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Area</th>
                    <th>Issue</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => {
                    const overdue = isOverdue(n);
                    return (
                      <tr key={n.id}>
                        <td><strong>{n.ncrNumber}</strong></td>
                        <td>{formatDate(n.issueDate)}</td>
                        <td>{n.area}{n.areaDetail ? <div className="table-subtext">{n.areaDetail}</div> : null}</td>
                        <td>{n.issueType}<div className="table-subtext" title={n.description}>{n.description.length > 60 ? n.description.slice(0, 60) + '…' : n.description}</div></td>
                        <td className={n.severity === 'Critical' || n.severity === 'High' ? 'cell-alert' : undefined}>{n.severity}</td>
                        <td>{n.status}</td>
                        <td>{n.responsiblePersonName || <span className="muted">Unassigned</span>}</td>
                        <td className={overdue ? 'cell-alert' : undefined}>{n.dueDate ? formatDate(n.dueDate) : '—'}{overdue ? <div className="table-subtext">Overdue</div> : null}</td>
                        <td><button className="table-button" onClick={() => handleStartEdit(n)}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
