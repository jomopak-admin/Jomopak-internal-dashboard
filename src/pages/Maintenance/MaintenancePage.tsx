/**
 * Maintenance — Phase 30
 *
 * Preventive + corrective maintenance work orders against machines. A "Service
 * due" panel reads machines' next-service dates; completing a Preventive work
 * order advances that date by the interval so PM stays on a rolling schedule.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  Machine,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  MaintenanceWorkOrder,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_TYPES,
  MAINTENANCE_WO_STATUSES,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface MaintenancePageProps {
  workOrders: MaintenanceWorkOrder[];
  machines: Machine[];
  today: string;
  onSave: (wo: MaintenanceWorkOrder) => void;
  onDelete: (id: string) => void;
  /** Complete a WO; if Preventive, advances the machine's next-service date. */
  onComplete: (wo: MaintenanceWorkOrder) => void;
}

function emptyWo(today: string, machine?: Machine): MaintenanceWorkOrder {
  return {
    id: '', woNumber: '', machineId: machine?.id || '', machineName: machine?.name || '',
    type: 'Preventive', priority: 'Medium', status: 'Open', scheduledDate: today, completedDate: '',
    assignedTo: '', description: '', partsUsed: '', labourHours: 0, downtimeHours: 0, cost: 0,
    nextServiceIntervalDays: 90, createdAt: '', notes: '',
  };
}

function daysUntil(date: string, today: string): number {
  if (!date) return Infinity;
  return Math.round((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
}

const STATUS_CLASS: Record<MaintenanceStatus, string> = {
  Open: 'status-pending',
  'In Progress': 'status-ocr_running',
  Completed: 'status-reviewed',
  Cancelled: 'status-duplicate',
};
const PRIORITY_CLASS: Record<MaintenancePriority, string> = {
  Low: 'status-reviewed', Medium: 'status-ocr_done', High: 'status-ocr_running', Critical: 'status-duplicate',
};

export function MaintenancePage({ workOrders, machines, today, onSave, onDelete, onComplete }: MaintenancePageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<MaintenanceWorkOrder>(emptyWo(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open' | 'all' | MaintenanceStatus>('open');

  // Machines whose next service is due within 30 days or overdue.
  const serviceDue = useMemo(
    () => machines
      .filter((m) => m.active && m.nextServiceDate)
      .map((m) => ({ machine: m, days: daysUntil(m.nextServiceDate!, today) }))
      .filter((x) => x.days <= 30)
      .sort((a, b) => a.days - b.days),
    [machines, today],
  );

  const sorted = useMemo(
    () => [...workOrders].sort((a, b) => (b.scheduledDate || b.createdAt || '').localeCompare(a.scheduledDate || a.createdAt || '')),
    [workOrders],
  );
  const filtered = useMemo(() => {
    if (statusFilter === 'all') return sorted;
    if (statusFilter === 'open') return sorted.filter((w) => w.status === 'Open' || w.status === 'In Progress');
    return sorted.filter((w) => w.status === statusFilter);
  }, [sorted, statusFilter]);

  const openCount = workOrders.filter((w) => w.status === 'Open' || w.status === 'In Progress').length;

  function startNew(machine?: Machine) { setDraft(emptyWo(today, machine)); setEditingId(null); setMode('form'); }
  function startEdit(w: MaintenanceWorkOrder) { setDraft({ ...w }); setEditingId(w.id); setMode('form'); }
  function update(patch: Partial<MaintenanceWorkOrder>) {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (patch.machineId !== undefined) next.machineName = machines.find((m) => m.id === patch.machineId)?.name || '';
      return next;
    });
  }

  function save() {
    if (!draft.machineId || !draft.description.trim()) return;
    onSave(draft);
    setMode('list');
  }
  function completeFromForm() {
    if (!draft.machineId) return;
    onComplete({ ...draft, status: 'Completed', completedDate: draft.completedDate || today });
    setMode('list');
  }

  if (mode === 'form') {
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title={editingId ? `Edit ${draft.woNumber}` : 'New work order'}
          action={<button className="ghost-button" onClick={() => setMode('list')}>Back</button>}
        />
        <section className="card">
          <div className="accounting-grid">
            <label><span>Machine *</span>
              <select value={draft.machineId} onChange={(e) => update({ machineId: e.target.value })}>
                <option value="">Select machine</option>
                {machines.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label><span>Type</span>
              <select value={draft.type} onChange={(e) => update({ type: e.target.value as MaintenanceType })}>
                {MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Priority</span>
              <select value={draft.priority} onChange={(e) => update({ priority: e.target.value as MaintenancePriority })}>
                {MAINTENANCE_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label><span>Status</span>
              <select value={draft.status} onChange={(e) => update({ status: e.target.value as MaintenanceStatus })}>
                {MAINTENANCE_WO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label><span>Scheduled date</span><input type="date" value={draft.scheduledDate} onChange={(e) => update({ scheduledDate: e.target.value })} /></label>
            <label><span>Assigned to</span><input value={draft.assignedTo} onChange={(e) => update({ assignedTo: e.target.value })} /></label>
          </div>
          <label style={{ display: 'block', marginTop: '0.6rem' }}><span>Description *</span><input value={draft.description} onChange={(e) => update({ description: e.target.value })} placeholder="e.g. Replace bearing on folder unit" /></label>
        </section>

        <section className="card">
          <h3>Completion</h3>
          <div className="accounting-grid">
            <label><span>Completed date</span><input type="date" value={draft.completedDate} onChange={(e) => update({ completedDate: e.target.value })} /></label>
            <label><span>Labour hours</span><input type="number" value={draft.labourHours} onChange={(e) => update({ labourHours: Number(e.target.value) })} /></label>
            <label><span>Downtime hours</span><input type="number" value={draft.downtimeHours} onChange={(e) => update({ downtimeHours: Number(e.target.value) })} /></label>
            <label><span>Cost (parts + labour)</span><input type="number" value={draft.cost} onChange={(e) => update({ cost: Number(e.target.value) })} /></label>
            {draft.type === 'Preventive' && (
              <label><span>Next service in (days)</span><input type="number" value={draft.nextServiceIntervalDays} onChange={(e) => update({ nextServiceIntervalDays: Number(e.target.value) })} /></label>
            )}
          </div>
          <label style={{ display: 'block', marginTop: '0.6rem' }}><span>Parts used</span><input value={draft.partsUsed} onChange={(e) => update({ partsUsed: e.target.value })} /></label>
          <label style={{ display: 'block', marginTop: '0.6rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => update({ notes: e.target.value })} /></label>
          <div className="accounting-actions" style={{ gap: '0.6rem' }}>
            <button className="primary-button" onClick={save} disabled={!draft.machineId || !draft.description.trim()}>Save</button>
            {draft.status !== 'Completed' && (
              <button className="secondary-button" onClick={completeFromForm} disabled={!draft.machineId || !draft.description.trim()}>
                Mark completed{draft.type === 'Preventive' ? ' + reschedule' : ''}
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Maintenance"
        subtitle="Preventive + corrective work orders. Completing a service reschedules the next one."
        action={<button className="secondary-button" onClick={() => startNew()}>New work order</button>}
      />

      <section className="stats-grid">
        <div className="card stat-card"><p className="stat-label">Open work orders</p><h3>{openCount}</h3></div>
        <div className="card stat-card"><p className="stat-label">Services due (30 days)</p><h3 className={serviceDue.some((s) => s.days < 0) ? 'amount-due' : ''}>{serviceDue.length}</h3></div>
      </section>

      {serviceDue.length > 0 && (
        <section className="card">
          <h3 className="sars-section-h">Service due</h3>
          <table className="data-table">
            <thead><tr><th>Machine</th><th>Next service</th><th>Countdown</th><th></th></tr></thead>
            <tbody>
              {serviceDue.map(({ machine, days }) => (
                <tr key={machine.id}>
                  <td><strong>{machine.name}</strong></td>
                  <td>{machine.nextServiceDate}</td>
                  <td className={days < 0 ? 'amount-due' : days <= 7 ? 'sars-soon' : 'muted'}>{days < 0 ? `${-days}d overdue` : days === 0 ? 'Due today' : `${days}d`}</td>
                  <td style={{ textAlign: 'right' }}><button className="link-button" onClick={() => startNew(machine)}>Create work order</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="card accounting-toolbar">
        <label><span>Show</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'open' | 'all' | MaintenanceStatus)}>
            <option value="open">Open + in progress</option>
            <option value="all">All</option>
            {MAINTENANCE_WO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </section>

      {filtered.length === 0 ? (
        <EmptyState title="No work orders" body="Log a maintenance job, or create one from a service that's due." />
      ) : (
        <section className="card">
          <div className="payroll-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>WO</th><th>Machine</th><th>Type</th><th>Priority</th><th>Scheduled</th><th>Status</th><th style={{ textAlign: 'right' }}>Cost</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id}>
                    <td><strong>{w.woNumber || w.id}</strong></td>
                    <td>{w.machineName}<div className="muted" style={{ fontSize: '0.72rem' }}>{w.description}</div></td>
                    <td>{w.type}</td>
                    <td><span className={`status-pill ${PRIORITY_CLASS[w.priority]}`}>{w.priority}</span></td>
                    <td>{w.scheduledDate || '—'}</td>
                    <td><span className={`status-pill ${STATUS_CLASS[w.status]}`}>{w.status}</span></td>
                    <td style={{ textAlign: 'right' }}>{w.cost ? `R ${formatNumber(w.cost, 2)}` : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="link-button" onClick={() => startEdit(w)}>Open</button>
                      {' · '}
                      <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(w.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
