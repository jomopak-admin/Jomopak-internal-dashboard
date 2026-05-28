/**
 * Staff Training & Hygiene Records.
 *
 * One row per training event. Each record carries a refresher interval
 * (default 12 months); the list flags overdue refreshers in red so the
 * training matrix is always current.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  StaffTrainingFilters,
  StaffTrainingFormState,
  StaffTrainingRecord,
  TRAINING_TOPICS,
  TrainingTopic,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface StaffTrainingPageProps {
  records: StaffTrainingRecord[];
  filters: StaffTrainingFilters;
  setFilters: (v: StaffTrainingFilters) => void;
  form: StaffTrainingFormState;
  setForm: (v: StaffTrainingFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: StaffTrainingRecord) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function getRefresherState(r: StaffTrainingRecord): 'overdue' | 'due-soon' | 'ok' | 'never' {
  if (!r.nextRefresherDate) return 'never';
  const t = new Date(r.nextRefresherDate).getTime();
  if (Number.isNaN(t)) return 'never';
  const now = Date.now();
  if (now > t) return 'overdue';
  if (t - now < 30 * DAY_MS) return 'due-soon';
  return 'ok';
}

export function StaffTrainingPage(props: StaffTrainingPageProps) {
  const { records, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => records.filter((r) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [r.staffName, r.staffRole, r.trainerName, r.topic, r.notes].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.topic && r.topic !== filters.topic) return false;
    if (filters.refresherStatus !== 'all') {
      const s = getRefresherState(r);
      if (filters.refresherStatus === 'overdue' && s !== 'overdue' && s !== 'never') return false;
      if (filters.refresherStatus === 'due-soon' && s !== 'due-soon') return false;
      if (filters.refresherStatus === 'ok' && s !== 'ok') return false;
    }
    return true;
  }), [records, filters]);

  const stats = useMemo(() => {
    const total = records.length;
    const overdue = records.filter((r) => {
      const s = getRefresherState(r);
      return s === 'overdue' || s === 'never';
    }).length;
    const dueSoon = records.filter((r) => getRefresherState(r) === 'due-soon').length;
    const acknowledged = records.filter((r) => r.acknowledged).length;
    return { total, overdue, dueSoon, acknowledged };
  }, [records]);

  function startCreate() { onReset(); setMode('form'); }
  function startEdit(r: StaffTrainingRecord) { onEdit(r); setMode('form'); }
  function back() { onReset(); setMode('list'); }

  const sections: FormWizardSection[] = [
    {
      key: 'who',
      title: 'Staff member',
      missingRequired: [
        ...(form.staffName.trim() ? [] : ['Staff name']),
        ...(form.trainingDate ? [] : ['Training date']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Staff name <RequiredMarker /></span><input value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} /></label>
          <label><span>Role</span><input value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })} placeholder="Operator / Supervisor / Driver" /></label>
        </div>
      ),
    },
    {
      key: 'training',
      title: 'Training event',
      body: (
        <div className="form-grid">
          <label><span>Topic <RequiredMarker /></span>
            <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value as TrainingTopic })}>
              {TRAINING_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label><span>Date</span><input type="date" value={form.trainingDate} onChange={(e) => setForm({ ...form, trainingDate: e.target.value })} /></label>
          <label><span>Trainer</span><input value={form.trainerName} onChange={(e) => setForm({ ...form, trainerName: e.target.value })} /></label>
          <label><span>Method</span><input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="In-person / Video / E-learning" /></label>
          <label><span>Refresher interval (months)</span><input type="number" min="1" max="60" value={form.refresherIntervalMonths} onChange={(e) => setForm({ ...form, refresherIntervalMonths: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'ack',
      title: 'Acknowledgement & certificate',
      contextActive: form.acknowledged,
      body: (
        <div className="form-grid">
          <label className="checkbox-row full-span"><input type="checkbox" checked={form.acknowledged} onChange={(e) => setForm({ ...form, acknowledged: e.target.checked })} />Staff signed acknowledgement</label>
          <label><span>Acknowledged date</span><input type="date" value={form.acknowledgedDate} onChange={(e) => setForm({ ...form, acknowledgedDate: e.target.value })} /></label>
          <label className="full-span"><span>Certificate URL</span><input value={form.certificateUrl} onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })} placeholder="Link to certificate / sign-off sheet" /></label>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list' ? <button className="secondary-button" onClick={startCreate}>Log training</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={back}>← Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit training record' : 'New training record'}
          subtitle="Build the training matrix auditors look for."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={back}
          isEditing={!!editingId}
          saveLabel="Save training"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Staff Training & Hygiene" subtitle={`${filtered.length} of ${records.length} record(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className={`food-safety-stat${stats.overdue > 0 ? ' food-safety-stat-alert' : ''}`}><span>Refresher overdue</span><strong>{stats.overdue}</strong></div>
            <div className="food-safety-stat"><span>Due within 30d</span><strong>{stats.dueSoon}</strong></div>
            <div className="food-safety-stat"><span>Acknowledged</span><strong>{stats.acknowledged}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, role, trainer" /></label>
            <label><span>Topic</span>
              <select value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })}>
                <option value="">All</option>
                {TRAINING_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Refresher</span>
              <select value={filters.refresherStatus} onChange={(e) => setFilters({ ...filters, refresherStatus: e.target.value as StaffTrainingFilters['refresherStatus'] })}>
                <option value="all">All</option>
                <option value="overdue">Overdue / never</option>
                <option value="due-soon">Due within 30d</option>
                <option value="ok">Up to date</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No training records" body="Log every food safety / hygiene / chemical / PPE training session and the staff who attended." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Staff</th><th>Topic</th><th>Date</th><th>Trainer</th><th>Acknowledged</th><th>Next refresher</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const s = getRefresherState(r);
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.staffName}</strong><div className="table-subtext">{r.staffRole}</div></td>
                        <td>{r.topic}</td>
                        <td>{formatDate(r.trainingDate)}</td>
                        <td>{r.trainerName || '—'}</td>
                        <td>{r.acknowledged ? <span className="badge badge-success">Signed</span> : <span className="badge badge-warning">Pending</span>}</td>
                        <td className={s === 'overdue' || s === 'never' ? 'cell-alert' : undefined}>{r.nextRefresherDate ? formatDate(r.nextRefresherDate) : 'Never set'}<div className="table-subtext">{s === 'overdue' ? 'Overdue' : s === 'due-soon' ? 'Due 30d' : s === 'never' ? 'Set date' : `${r.refresherIntervalMonths}m cycle`}</div></td>
                        <td><button className="table-button" onClick={() => startEdit(r)}>Edit</button></td>
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
