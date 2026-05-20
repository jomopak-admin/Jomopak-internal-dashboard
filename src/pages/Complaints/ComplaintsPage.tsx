/**
 * Customer Complaints & Recall.
 *
 * One row per complaint. Tracking captures the complaint itself, the
 * investigation, root-cause, immediate / corrective / preventive action,
 * outcome, and closure approval. Pinning a complaint to a finished-goods
 * batch + job lights up the Traceability search so the recall list of
 * affected customers becomes a single query.
 *
 * The Recall flag at the bottom of the form is the trigger — when set,
 * other modules (Phase 5 Control Centre, future alerts) surface the
 * complaint as an active recall.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  COMPLAINT_TYPES,
  ComplaintOutcome,
  ComplaintSeverity,
  ComplaintStatus,
  ComplaintType,
  CustomerComplaint,
  CustomerComplaintFilters,
  CustomerComplaintFormState,
  DeliveryNote,
  FinishedGoodsStock,
  Invoice,
  JobCard,
  Product,
  QuantityUnit,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface ComplaintsPageProps {
  complaints: CustomerComplaint[];
  clients: Client[];
  products: Product[];
  jobs: JobCard[];
  finishedGoodsStock: FinishedGoodsStock[];
  deliveryNotes: DeliveryNote[];
  invoices: Invoice[];
  filters: CustomerComplaintFilters;
  setFilters: (v: CustomerComplaintFilters) => void;
  form: CustomerComplaintFormState;
  setForm: (v: CustomerComplaintFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (c: CustomerComplaint) => void;
  onOpenTraceability?: (complaint: CustomerComplaint) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function inWindow(date: string, w: CustomerComplaintFilters['dateWindow']) {
  if (w === 'all') return true;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  const age = Date.now() - t;
  if (w === 'today') return age < DAY_MS && new Date(date).toDateString() === new Date().toDateString();
  if (w === '7d') return age < 7 * DAY_MS;
  if (w === '30d') return age < 30 * DAY_MS;
  if (w === '90d') return age < 90 * DAY_MS;
  return true;
}

export function ComplaintsPage(props: ComplaintsPageProps) {
  const {
    complaints, clients, products, jobs, finishedGoodsStock, deliveryNotes, invoices,
    filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onOpenTraceability,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const hay = [c.complaintNumber, c.clientName, c.productName, c.description, c.jobNumber, c.finishedGoodsStockNumber].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.client && c.clientId !== filters.client) return false;
      if (filters.complaintType && c.complaintType !== filters.complaintType) return false;
      if (filters.severity && c.severity !== filters.severity) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.recall === 'recall-only' && !c.recallTriggered) return false;
      if (filters.recall === 'no-recall' && c.recallTriggered) return false;
      if (!inWindow(c.complaintDate, filters.dateWindow)) return false;
      return true;
    });
  }, [complaints, filters]);

  const stats = useMemo(() => {
    const open = complaints.filter((c) => c.status !== 'Closed' && c.status !== 'Resolved').length;
    const recalls = complaints.filter((c) => c.recallTriggered).length;
    const critical = complaints.filter((c) => c.severity === 'Critical').length;
    return { total: complaints.length, open, recalls, critical };
  }, [complaints]);

  // Filter selectable jobs/FG by the selected client to keep the picker manageable.
  const eligibleJobs = useMemo(
    () => form.clientId ? jobs.filter((j) => j.clientId === form.clientId) : jobs,
    [jobs, form.clientId],
  );
  const eligibleFG = useMemo(
    () => form.clientId ? finishedGoodsStock.filter((f) => f.clientId === form.clientId) : finishedGoodsStock,
    [finishedGoodsStock, form.clientId],
  );
  const eligibleDeliveries = useMemo(
    () => form.clientId ? deliveryNotes.filter((d) => d.clientId === form.clientId) : deliveryNotes,
    [deliveryNotes, form.clientId],
  );
  const eligibleInvoices = useMemo(
    () => form.clientId ? invoices.filter((i) => i.clientId === form.clientId) : invoices,
    [invoices, form.clientId],
  );

  function handleStartCreate() { onReset(); setMode('form'); }
  function handleStartEdit(c: CustomerComplaint) { onEdit(c); setMode('form'); }
  function handleBackToList() { onReset(); setMode('list'); }

  const sections: FormWizardSection[] = [
    {
      key: 'who',
      title: 'Who & what',
      missingRequired: [
        ...(form.complaintDate ? [] : ['Complaint date']),
        ...(form.clientId ? [] : ['Client']),
        ...(form.description.trim() ? [] : ['Description']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Complaint date <RequiredMarker /></span><input type="date" value={form.complaintDate} onChange={(e) => setForm({ ...form, complaintDate: e.target.value })} /></label>
          <label><span>Client <RequiredMarker /></span>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label><span>Reported by</span><input value={form.reportedByName} onChange={(e) => setForm({ ...form, reportedByName: e.target.value })} placeholder="Name of person reporting" /></label>
          <label><span>Reporter contact</span><input value={form.reportedByContact} onChange={(e) => setForm({ ...form, reportedByContact: e.target.value })} placeholder="Phone / email" /></label>
          <label><span>Product</span>
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label><span>Complaint type</span>
            <select value={form.complaintType} onChange={(e) => setForm({ ...form, complaintType: e.target.value as ComplaintType })}>
              {COMPLAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label><span>Severity</span>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as ComplaintSeverity })}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
          <label><span>Status</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ComplaintStatus })}>
              <option value="New">New</option>
              <option value="Investigating">Investigating</option>
              <option value="Awaiting Customer">Awaiting customer</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Escalated">Escalated</option>
              <option value="Recall Triggered">Recall triggered</option>
            </select>
          </label>
          <label className="full-span"><span>Description <RequiredMarker /></span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What did the customer report?" /></label>
        </div>
      ),
    },
    {
      key: 'trace-links',
      title: 'Batch / job / dispatch links',
      subtitle: 'Pinning a finished-goods batch + job lights up the full recall trace.',
      contextActive: !!(form.finishedGoodsStockId || form.jobId),
      body: (
        <div className="form-grid">
          <label><span>Finished goods batch</span>
            <select value={form.finishedGoodsStockId} onChange={(e) => setForm({ ...form, finishedGoodsStockId: e.target.value })}>
              <option value="">Select batch…</option>
              {eligibleFG.map((f) => <option key={f.id} value={f.id}>{f.stockNumber} · {f.productName}</option>)}
            </select>
          </label>
          <label><span>Job</span>
            <select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })}>
              <option value="">Select job…</option>
              {eligibleJobs.map((j) => <option key={j.id} value={j.id}>{j.jobNumber} · {j.productName}</option>)}
            </select>
          </label>
          <label><span>Delivery note</span>
            <select value={form.deliveryNoteId} onChange={(e) => setForm({ ...form, deliveryNoteId: e.target.value })}>
              <option value="">Select…</option>
              {eligibleDeliveries.map((d) => <option key={d.id} value={d.id}>{d.deliveryNoteNumber} · {formatDate(d.noteDate)}</option>)}
            </select>
          </label>
          <label><span>Invoice</span>
            <select value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
              <option value="">Select…</option>
              {eligibleInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber} · {formatDate(i.invoiceDate)}</option>)}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'quantities',
      title: 'Quantities affected',
      body: (
        <div className="form-grid">
          <label><span>Qty affected (total)</span><input type="number" min="0" step="0.01" value={form.quantityAffected} onChange={(e) => setForm({ ...form, quantityAffected: e.target.value })} /></label>
          <label><span>Unit</span>
            <select value={form.quantityUnit} onChange={(e) => setForm({ ...form, quantityUnit: e.target.value as QuantityUnit })}>
              <option>units</option><option>kg</option><option>sheets</option><option>rolls</option>
            </select>
          </label>
          <label><span>Qty still with customer</span><input type="number" min="0" step="0.01" value={form.quantityWithCustomer} onChange={(e) => setForm({ ...form, quantityWithCustomer: e.target.value })} /></label>
          <label><span>Qty still in our stock</span><input type="number" min="0" step="0.01" value={form.quantityInternalStock} onChange={(e) => setForm({ ...form, quantityInternalStock: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'investigation',
      title: 'Investigation & root cause',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Investigation notes</span><textarea rows={3} value={form.investigationNotes} onChange={(e) => setForm({ ...form, investigationNotes: e.target.value })} /></label>
          <label className="full-span"><span>Root cause</span><textarea rows={2} value={form.rootCauseAnalysis} onChange={(e) => setForm({ ...form, rootCauseAnalysis: e.target.value })} placeholder="5 whys, fishbone, etc." /></label>
          <label className="full-span"><span>Immediate action taken</span><textarea rows={2} value={form.immediateAction} onChange={(e) => setForm({ ...form, immediateAction: e.target.value })} /></label>
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
        </div>
      ),
    },
    {
      key: 'outcome',
      title: 'Outcome & closure',
      body: (
        <div className="form-grid">
          <label><span>Outcome</span>
            <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value as ComplaintOutcome })}>
              <option value="Pending">Pending</option>
              <option value="Goods Replaced">Goods replaced</option>
              <option value="Credit Issued">Credit issued</option>
              <option value="Refund Issued">Refund issued</option>
              <option value="No Action (Customer Error)">No action (customer error)</option>
              <option value="No Action (Out of Spec but Within Tolerance)">No action (within tolerance)</option>
              <option value="Recall">Recall</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label><span>Closed by</span><input value={form.closedByName} onChange={(e) => setForm({ ...form, closedByName: e.target.value })} placeholder="Name signing off the closure" /></label>
          <label className="full-span"><span>Outcome notes</span><textarea rows={2} value={form.outcomeNotes} onChange={(e) => setForm({ ...form, outcomeNotes: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'recall',
      title: 'Recall escalation',
      subtitle: 'Tick when this complaint triggers a wider recall of the same batch.',
      contextActive: form.recallTriggered,
      body: (
        <div className="form-grid">
          <label className="checkbox-row full-span"><input type="checkbox" checked={form.recallTriggered} onChange={(e) => setForm({ ...form, recallTriggered: e.target.checked })} />Recall triggered for this batch</label>
          {form.recallTriggered ? (
            <label className="full-span"><span>Recall scope</span><textarea rows={2} value={form.recallScope} onChange={(e) => setForm({ ...form, recallScope: e.target.value })} placeholder="e.g. All product from batch FSB-202605-0042 — 8 customers, 23 deliveries" /></label>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={handleStartCreate}>Log complaint</button>
        : <button className="ghost-button" onClick={handleBackToList}>Back to complaints</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit complaint' : 'New complaint'}
          subtitle="Pin batch + job for full traceability. Tick Recall at the bottom to trigger a wider response."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!editingId}
          saveLabel="Save complaint"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Customer Complaints" subtitle={`${filtered.length} of ${complaints.length} shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className={`food-safety-stat${stats.open > 0 ? ' food-safety-stat-alert' : ''}`}><span>Open</span><strong>{stats.open}</strong></div>
            <div className={`food-safety-stat${stats.critical > 0 ? ' food-safety-stat-alert' : ''}`}><span>Critical</span><strong>{stats.critical}</strong></div>
            <div className={`food-safety-stat${stats.recalls > 0 ? ' food-safety-stat-alert' : ''}`}><span>Recalls</span><strong>{stats.recalls}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="#, client, product, batch" /></label>
            <label><span>Client</span>
              <select value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })}>
                <option value="">All</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label><span>Type</span>
              <select value={filters.complaintType} onChange={(e) => setFilters({ ...filters, complaintType: e.target.value })}>
                <option value="">All</option>
                {COMPLAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
                <option>New</option><option>Investigating</option><option>Awaiting Customer</option>
                <option>Resolved</option><option>Closed</option><option>Escalated</option><option>Recall Triggered</option>
              </select>
            </label>
            <label><span>Recall</span>
              <select value={filters.recall} onChange={(e) => setFilters({ ...filters, recall: e.target.value as CustomerComplaintFilters['recall'] })}>
                <option value="all">All</option>
                <option value="recall-only">Recall only</option>
                <option value="no-recall">Non-recall</option>
              </select>
            </label>
            <label><span>Window</span>
              <select value={filters.dateWindow} onChange={(e) => setFilters({ ...filters, dateWindow: e.target.value as CustomerComplaintFilters['dateWindow'] })}>
                <option value="today">Today</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No complaints in this window" body="Press 'Log complaint' to record a new one. Pinning a batch lights up the recall trace." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Product / Batch</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Qty affected</th>
                    <th>Outcome</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.complaintNumber}</strong>{c.recallTriggered ? <div className="table-subtext" style={{ color: '#b22b2b' }}>RECALL</div> : null}</td>
                      <td>{formatDate(c.complaintDate)}</td>
                      <td>{c.clientName}</td>
                      <td>{c.productName || '—'}<div className="table-subtext">{c.finishedGoodsStockNumber || c.internalBatchNumber || c.jobNumber || ''}</div></td>
                      <td>{c.complaintType}</td>
                      <td className={c.severity === 'Critical' || c.severity === 'High' ? 'cell-alert' : undefined}>{c.severity}</td>
                      <td>{c.status}</td>
                      <td>{c.quantityAffected ? `${formatNumber(c.quantityAffected)} ${c.quantityUnit}` : '—'}</td>
                      <td>{c.outcome}</td>
                      <td>
                        <div className="inline-actions">
                          <button className="table-button" onClick={() => handleStartEdit(c)}>Edit</button>
                          {onOpenTraceability && (c.finishedGoodsStockId || c.jobId || c.clientId) ? (
                            <button className="table-button table-button-promote" onClick={() => onOpenTraceability(c)} title="Open this complaint in batch traceability">→ Trace</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
