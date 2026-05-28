/**
 * Dispatch Runs — Phase 61
 *
 * Dispatch supervisor's planning surface. One run = one driver + one
 * vehicle + one day + an ordered list of delivery notes (stops).
 *
 * Two screens:
 *   1. List — all runs filtered by date + driver + status.
 *   2. Builder — pick a date / driver / vehicle, then move DNs from the
 *      "Ready to ship" queue into the run, drag to reorder, save.
 *
 * The driver's PWA reads from the same data and shows the run they're
 * assigned to. The run's lifecycle (Planned → Loaded → In Progress →
 * Completed) is driven by buttons on this page + automatic transitions
 * (e.g. all stops have a POD → flips to Completed).
 */

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  DeliveryNote,
  DispatchRun,
  DispatchRunFilters,
  DispatchRunFormState,
  DispatchRunStatus,
  UserProfile,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface DispatchRunsPageProps {
  runs: DispatchRun[];
  deliveryNotes: DeliveryNote[];
  clients: Client[];
  driverProfiles: UserProfile[];
  filters: DispatchRunFilters;
  setFilters: (v: DispatchRunFilters) => void;
  form: DispatchRunFormState;
  setForm: (v: DispatchRunFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (run: DispatchRun) => void;
  onDelete: (id: string) => void;
  onStatusChange: (run: DispatchRun, status: DispatchRunStatus, extras?: { loadedByName?: string; odometerStart?: number; odometerEnd?: number }) => void;
  onPrint: (run: DispatchRun) => void;
  /** Phase 61 — current user name, used to attribute the "Loaded by" event. */
  currentUserName: string;
}

const STATUS_ORDER: DispatchRunStatus[] = ['Planned', 'Loaded', 'In Progress', 'Completed', 'Cancelled'];

const STATUS_BADGE_CLASS: Record<DispatchRunStatus, string> = {
  Planned: 'status-info',
  Loaded: 'status-info',
  'In Progress': 'status-warn',
  Completed: 'status-ok',
  Cancelled: 'status-bad',
};

function StatusBadge({ status }: { status: DispatchRunStatus }) {
  return <span className={`status-badge ${STATUS_BADGE_CLASS[status] || ''}`}>{status}</span>;
}

export function DispatchRunsPage({
  runs,
  deliveryNotes,
  clients,
  driverProfiles,
  filters,
  setFilters,
  form,
  setForm,
  editingId,
  message,
  onSave,
  onReset,
  onEdit,
  onDelete,
  onStatusChange,
  onPrint,
  currentUserName,
}: DispatchRunsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (editingId) setMode('form');
  }, [editingId]);

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.driver && !`${r.driverName} ${r.driverUserId}`.toLowerCase().includes(filters.driver.toLowerCase())) return false;
      if (filters.fromDate && r.runDate < filters.fromDate) return false;
      if (filters.toDate && r.runDate > filters.toDate) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${r.runNumber} ${r.driverName} ${r.vehicleRegistration} ${r.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (b.runDate || '').localeCompare(a.runDate || ''));
  }, [runs, filters]);

  // DNs available for the run: status Issued/Delivered and not already on
  // another run (besides this one). Plus the DNs already on this run.
  const readyDns = useMemo(() => {
    const assigned = new Set<string>();
    for (const r of runs) {
      if (r.id === editingId) continue;
      for (const s of r.stops) assigned.add(s.deliveryNoteId);
    }
    return deliveryNotes
      .filter((dn) => !assigned.has(dn.id))
      .filter((dn) => dn.status === 'Draft' || dn.status === 'Issued')
      .sort((a, b) => (b.noteDate || '').localeCompare(a.noteDate || ''));
  }, [deliveryNotes, runs, editingId]);

  const selectedDns = useMemo(() => {
    const byId = new Map(deliveryNotes.map((d) => [d.id, d]));
    return form.deliveryNoteIds.map((id) => byId.get(id)).filter(Boolean) as DeliveryNote[];
  }, [deliveryNotes, form.deliveryNoteIds]);

  function addDnToRun(dnId: string) {
    if (form.deliveryNoteIds.includes(dnId)) return;
    setForm({ ...form, deliveryNoteIds: [...form.deliveryNoteIds, dnId] });
  }

  function removeDnFromRun(dnId: string) {
    setForm({ ...form, deliveryNoteIds: form.deliveryNoteIds.filter((id) => id !== dnId) });
  }

  function moveStop(dnId: string, delta: -1 | 1) {
    const idx = form.deliveryNoteIds.indexOf(dnId);
    if (idx === -1) return;
    const next = [...form.deliveryNoteIds];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setForm({ ...form, deliveryNoteIds: next });
  }

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  function clientAddressFor(dn: DeliveryNote): string {
    const c = clients.find((cl) => cl.id === dn.clientId);
    if (!c) return dn.clientAddress || '';
    return [c.deliveryAddressLine1, c.deliveryAddressLine2, c.deliveryCity, c.deliveryState, c.deliveryPostalCode].filter(Boolean).join(', ');
  }

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Plan New Run</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={handleBackToList}>← Back to runs</button>}
      />

      {mode === 'form' ? (
        <div className="card">
          <SectionTitle
            title={editingId ? `Edit run ${runs.find((r) => r.id === editingId)?.runNumber || ''}` : 'Plan new run'}
            subtitle="Assign a driver, pick a vehicle, then move delivery notes from 'Ready to ship' into stops in the order you want them done."
          />
          {message && <div className="message-bar">{message}</div>}

          <div className="form-grid">
            <label>
              <span>Run date <RequiredMarker /></span>
              <input type="date" value={form.runDate} onChange={(e) => setForm({ ...form, runDate: e.target.value })} />
            </label>
            <label>
              <span>Driver <RequiredMarker /></span>
              <select
                value={form.driverUserId}
                onChange={(e) => {
                  const id = e.target.value;
                  const profile = driverProfiles.find((p) => p.id === id);
                  setForm({
                    ...form,
                    driverUserId: id,
                    driverName: profile?.fullName || profile?.email || form.driverName,
                  });
                }}
              >
                <option value="">— Select driver —</option>
                {driverProfiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName || p.email}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Driver name (override)</span>
              <input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} placeholder="Casual / contractor name" />
            </label>
            <label>
              <span>Vehicle registration</span>
              <input value={form.vehicleRegistration} onChange={(e) => setForm({ ...form, vehicleRegistration: e.target.value })} placeholder="CA 12-345 GP" />
            </label>
            <label>
              <span>Vehicle description</span>
              <input value={form.vehicleDescription} onChange={(e) => setForm({ ...form, vehicleDescription: e.target.value })} placeholder="White Hilux bakkie" />
            </label>
            <label>
              <span>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DispatchRunStatus })}>
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="full-span">
              <span>Notes for the driver</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Leave by 06:30 for Sandton, traffic on William Nicol" />
            </label>
          </div>

          <div className="run-builder-grid">
            <section>
              <h4>Stops in this run ({selectedDns.length})</h4>
              {selectedDns.length === 0 ? (
                <p className="muted" style={{ fontSize: '0.8rem' }}>
                  No stops yet. Tick delivery notes on the right to add them in order.
                </p>
              ) : (
                <ol className="run-stops-list">
                  {selectedDns.map((dn, idx) => (
                    <li key={dn.id} className="run-stop-row">
                      <div className="run-stop-num">{idx + 1}</div>
                      <div className="run-stop-body">
                        <div><strong>{dn.deliveryNoteNumber}</strong> · {dn.clientName}</div>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>{clientAddressFor(dn) || 'No address on file'}</div>
                        <div className="muted" style={{ fontSize: '0.75rem' }}>{dn.lineItems.length} item(s)</div>
                      </div>
                      <div className="run-stop-actions">
                        <button type="button" className="table-button" onClick={() => moveStop(dn.id, -1)} disabled={idx === 0}>▲</button>
                        <button type="button" className="table-button" onClick={() => moveStop(dn.id, 1)} disabled={idx === selectedDns.length - 1}>▼</button>
                        <button type="button" className="table-button" onClick={() => removeDnFromRun(dn.id)}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section>
              <h4>Ready to ship — pick to add ({readyDns.length})</h4>
              {readyDns.length === 0 ? (
                <p className="muted" style={{ fontSize: '0.8rem' }}>No unassigned delivery notes. Create one from a job / invoice / client first.</p>
              ) : (
                <ul className="run-ready-list">
                  {readyDns.map((dn) => (
                    <li key={dn.id} className="run-ready-row">
                      <div>
                        <strong>{dn.deliveryNoteNumber}</strong> · {dn.clientName}
                        <div className="muted" style={{ fontSize: '0.75rem' }}>
                          {formatDate(dn.noteDate)} · {dn.lineItems.length} item(s) · {dn.status}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => addDnToRun(dn.id)}
                        disabled={form.deliveryNoteIds.includes(dn.id)}
                      >
                        {form.deliveryNoteIds.includes(dn.id) ? 'Added' : 'Add to run'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="form-actions">
            <button className="primary-button" onClick={onSave}>Save Run</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
            {editingId && (
              <button className="ghost-button" onClick={() => { if (confirm('Delete this run? Its DNs go back to Ready to ship.')) onDelete(editingId); }}>
                Delete run
              </button>
            )}
          </div>
        </div>
      ) : (
        <section className="card">
          <SectionTitle title="Dispatch runs" subtitle={`${filteredRuns.length} run(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Run number, driver, vehicle" /></label>
            <label><span>Driver</span><input value={filters.driver} onChange={(e) => setFilters({ ...filters, driver: e.target.value })} /></label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as DispatchRunFilters['status'] })}>
                <option value="all">All</option>
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label><span>From</span><input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} /></label>
            <label><span>To</span><input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} /></label>
          </div>

          {filteredRuns.length === 0 ? (
            <EmptyState title="No runs yet" body="Plan a new run to load up a driver's day. Until then, ad-hoc dispatches still happen via the Dispatch tab." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Date</th>
                    <th>Driver / Vehicle</th>
                    <th>Stops</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map((run) => {
                    const completed = run.stops.filter((s) => Boolean(s.outcome)).length;
                    const total = run.stops.length;
                    return (
                      <tr key={run.id}>
                        <td><strong>{run.runNumber}</strong></td>
                        <td>{formatDate(run.runDate)}</td>
                        <td>
                          <div>{run.driverName || '—'}</div>
                          <div className="table-subtext">{run.vehicleRegistration || '—'} {run.vehicleDescription ? `· ${run.vehicleDescription}` : ''}</div>
                        </td>
                        <td>{total}</td>
                        <td><StatusBadge status={run.status} /></td>
                        <td>{total > 0 ? `${completed} / ${total}` : '—'}</td>
                        <td>
                          <div className="inline-actions">
                            <button className="table-button" onClick={() => onEdit(run)}>Edit</button>
                            <button className="table-button" onClick={() => onPrint(run)}>Trip sheet</button>
                            {run.status === 'Planned' && (
                              <button className="table-button" onClick={() => onStatusChange(run, 'Loaded', { loadedByName: currentUserName })}>Mark Loaded</button>
                            )}
                            {run.status === 'Loaded' && (
                              <button className="table-button" onClick={() => {
                                const km = window.prompt('Odometer reading at departure (km):', String(run.odometerStart || ''));
                                if (km === null) return;
                                onStatusChange(run, 'In Progress', { odometerStart: Number(km) || 0 });
                              }}>Start run</button>
                            )}
                            {run.status === 'In Progress' && (
                              <button className="table-button" onClick={() => {
                                const km = window.prompt('Odometer reading at return (km):', String(run.odometerEnd || run.odometerStart || ''));
                                if (km === null) return;
                                onStatusChange(run, 'Completed', { odometerEnd: Number(km) || 0 });
                              }}>Close run</button>
                            )}
                          </div>
                        </td>
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

