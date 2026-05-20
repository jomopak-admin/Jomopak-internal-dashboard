/**
 * Cleaning & Sanitation Logs.
 *
 * The cleaning gate for every food-packaging job. Each entry records what
 * area / machine was cleaned, by whom, with what chemical (link to Chemical
 * Register where possible), the Pass / Fail result, and the supervisor
 * sign-off.
 *
 * The job-card food-safety gate reads from these logs via
 * `getLatestPassingClean(machineId, logs)` — a food-packaging job can't
 * be cleared for production unless the assigned machine has a passing
 * cleaning log within the last 24 hours.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  ChemicalRegisterEntry,
  CleaningLogEntry,
  CleaningLogFilters,
  CleaningLogFormState,
  CleaningResult,
  CleaningType,
  FACTORY_AREAS,
  FactoryArea,
  Machine,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface CleaningLogsPageProps {
  logs: CleaningLogEntry[];
  machines: Machine[];
  chemicals: ChemicalRegisterEntry[];
  filters: CleaningLogFilters;
  setFilters: (v: CleaningLogFilters) => void;
  form: CleaningLogFormState;
  setForm: (v: CleaningLogFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (log: CleaningLogEntry) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function inWindow(performedAt: string, window: CleaningLogFilters['dateWindow']): boolean {
  if (window === 'all') return true;
  const t = new Date(performedAt).getTime();
  if (Number.isNaN(t)) return false;
  const age = Date.now() - t;
  if (window === 'today') return age < DAY_MS && new Date(performedAt).toDateString() === new Date().toDateString();
  if (window === '7d') return age < 7 * DAY_MS;
  if (window === '30d') return age < 30 * DAY_MS;
  return true;
}

export function CleaningLogsPage(props: CleaningLogsPageProps) {
  const { logs, machines, chemicals, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const hay = [log.area, log.areaDetail, log.performedByName, log.chemicalName, log.notes, log.correctiveAction].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.area && log.area !== filters.area) return false;
      if (filters.cleaningType && log.cleaningType !== filters.cleaningType) return false;
      if (filters.result && log.result !== filters.result) return false;
      if (!inWindow(log.performedAt, filters.dateWindow)) return false;
      return true;
    });
  }, [logs, filters]);

  const stats = useMemo(() => {
    const last24h = logs.filter((l) => Date.now() - new Date(l.performedAt).getTime() < DAY_MS);
    const passes = last24h.filter((l) => l.result !== 'Fail').length;
    const fails = logs.filter((l) => l.result === 'Fail').length;
    const machinesCleanedToday = new Set(last24h.filter((l) => l.machineId).map((l) => l.machineId)).size;
    return { total: logs.length, last24h: last24h.length, passes, fails, machinesCleanedToday };
  }, [logs]);

  function handleStartCreate() { onReset(); setMode('form'); }
  function handleStartEdit(log: CleaningLogEntry) { onEdit(log); setMode('form'); }
  function handleBackToList() { onReset(); setMode('list'); }

  const sections: FormWizardSection[] = [
    {
      key: 'where',
      title: 'Where & when',
      missingRequired: [
        ...(form.performedAt ? [] : ['Performed at']),
        ...(form.performedByName.trim() ? [] : ['Performed by']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Area <RequiredMarker /></span>
            <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as FactoryArea })}>
              {FACTORY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label><span>Machine (optional, links the gate)</span>
            <select value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })}>
              <option value="">No machine link</option>
              {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label><span>Area detail</span><input value={form.areaDetail} onChange={(e) => setForm({ ...form, areaDetail: e.target.value })} placeholder="Specific spot if Area is Other" /></label>
          <label><span>Cleaning type</span>
            <select value={form.cleaningType} onChange={(e) => setForm({ ...form, cleaningType: e.target.value as CleaningType })}>
              <option value="Pre-Shift">Pre-shift</option>
              <option value="Between Jobs">Between jobs</option>
              <option value="Deep Clean">Deep clean</option>
              <option value="Sanitation">Sanitation</option>
              <option value="After Spill">After spill</option>
              <option value="Scheduled Audit">Scheduled audit</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label><span>Performed at <RequiredMarker /></span><input type="datetime-local" value={form.performedAt} onChange={(e) => setForm({ ...form, performedAt: e.target.value })} /></label>
          <label><span>Performed by <RequiredMarker /></span><input value={form.performedByName} onChange={(e) => setForm({ ...form, performedByName: e.target.value })} placeholder="Operator name" /></label>
        </div>
      ),
    },
    {
      key: 'chemical',
      title: 'Chemical used',
      subtitle: 'Link to the chemical register so audit trails point at MSDS automatically.',
      body: (
        <div className="form-grid">
          <label><span>Chemical (from register)</span>
            <select
              value={form.chemicalRegisterId}
              onChange={(e) => {
                const id = e.target.value;
                const chem = chemicals.find((c) => c.id === id);
                setForm({ ...form, chemicalRegisterId: id, chemicalName: chem?.chemicalName ?? form.chemicalName });
              }}
            >
              <option value="">Free text (no register link)</option>
              {chemicals.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.chemicalName}</option>)}
            </select>
          </label>
          <label><span>Chemical name (free text)</span><input value={form.chemicalName} onChange={(e) => setForm({ ...form, chemicalName: e.target.value })} placeholder="Used if not in register" /></label>
        </div>
      ),
    },
    {
      key: 'result',
      title: 'Result & supervisor sign-off',
      missingRequired: [
        ...(form.result ? [] : ['Result']),
        ...(form.result !== 'Fail' && !form.supervisorSignOffName.trim() ? ['Supervisor sign-off'] : []),
        ...(form.result === 'Fail' && !form.correctiveAction.trim() ? ['Corrective action'] : []),
      ],
      body: (
        <div className="form-grid">
          <label><span>Result <RequiredMarker /></span>
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value as CleaningResult })}>
              <option value="Pass">Pass</option>
              <option value="Pass with Notes">Pass with notes</option>
              <option value="Fail">Fail</option>
            </select>
          </label>
          <label><span>Supervisor sign-off name</span><input value={form.supervisorSignOffName} onChange={(e) => setForm({ ...form, supervisorSignOffName: e.target.value })} placeholder="Required for Pass" /></label>
          <label><span>Supervisor sign-off at</span><input type="datetime-local" value={form.supervisorSignOffAt} onChange={(e) => setForm({ ...form, supervisorSignOffAt: e.target.value })} /></label>
          {form.result === 'Fail' ? (
            <label className="full-span"><span>Corrective action <RequiredMarker /></span><textarea rows={2} value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} placeholder="What was done to fix the failure" /></label>
          ) : null}
        </div>
      ),
    },
    {
      key: 'evidence',
      title: 'Photos & notes',
      subtitle: 'Photo upload arrives with the persistence session — for now paste hosted URLs.',
      body: (
        <div className="form-grid">
          <label><span>Before photo URL</span><input value={form.beforePhotoUrl} onChange={(e) => setForm({ ...form, beforePhotoUrl: e.target.value })} /></label>
          <label><span>After photo URL</span><input value={form.afterPhotoUrl} onChange={(e) => setForm({ ...form, afterPhotoUrl: e.target.value })} /></label>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={handleStartCreate}>Log cleaning</button>
        : <button className="ghost-button" onClick={handleBackToList}>Back to logs</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit cleaning log' : 'New cleaning log'}
          subtitle="One entry per cleaning event. Required before any food-packaging job can run on the linked machine."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!editingId}
          saveLabel="Save log"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Cleaning & Sanitation Logs" subtitle={`${filtered.length} of ${logs.length} log(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total logs</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Last 24h</span><strong>{stats.last24h}</strong></div>
            <div className="food-safety-stat"><span>Machines cleaned today</span><strong>{stats.machinesCleanedToday}</strong></div>
            <div className={`food-safety-stat${stats.fails > 0 ? ' food-safety-stat-alert' : ''}`}><span>Total fails</span><strong>{stats.fails}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Area, operator, chemical, notes" /></label>
            <label><span>Area</span>
              <select value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
                <option value="">All areas</option>
                {FACTORY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label><span>Type</span>
              <select value={filters.cleaningType} onChange={(e) => setFilters({ ...filters, cleaningType: e.target.value })}>
                <option value="">All types</option>
                <option>Pre-Shift</option>
                <option>Between Jobs</option>
                <option>Deep Clean</option>
                <option>Sanitation</option>
                <option>After Spill</option>
                <option>Scheduled Audit</option>
                <option>Other</option>
              </select>
            </label>
            <label><span>Result</span>
              <select value={filters.result} onChange={(e) => setFilters({ ...filters, result: e.target.value })}>
                <option value="">All</option>
                <option value="Pass">Pass</option>
                <option value="Pass with Notes">Pass w/ notes</option>
                <option value="Fail">Fail</option>
              </select>
            </label>
            <label><span>Window</span>
              <select value={filters.dateWindow} onChange={(e) => setFilters({ ...filters, dateWindow: e.target.value as CleaningLogFilters['dateWindow'] })}>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Log #</th>
                    <th>Area / Machine</th>
                    <th>Type</th>
                    <th>Performed</th>
                    <th>Chemical</th>
                    <th>Result</th>
                    <th>Sign-off</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => {
                    const machine = machines.find((m) => m.id === log.machineId);
                    return (
                      <tr key={log.id}>
                        <td><strong>{log.logNumber}</strong></td>
                        <td>{log.area}{log.areaDetail ? ` · ${log.areaDetail}` : ''}<div className="table-subtext">{machine?.name || (log.machineId ? 'Unknown machine' : 'No machine link')}</div></td>
                        <td>{log.cleaningType}</td>
                        <td>{formatDate(log.performedAt.slice(0, 10))}<div className="table-subtext">{log.performedByName}</div></td>
                        <td>{log.chemicalName || '—'}</td>
                        <td className={log.result === 'Fail' ? 'cell-alert' : undefined}><strong>{log.result}</strong>{log.result === 'Fail' && log.correctiveAction ? <div className="table-subtext">{log.correctiveAction}</div> : null}</td>
                        <td>{log.supervisorSignOffName || <span className="muted">Pending</span>}</td>
                        <td><button className="table-button" onClick={() => handleStartEdit(log)}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No cleaning logs in this window" body="Press 'Log cleaning' to record a new entry. Food-packaging jobs require a passing log on the assigned machine within the last 24 hours." />
          )}
        </section>
      )}
    </>
  );
}
