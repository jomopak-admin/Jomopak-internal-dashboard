/**
 * Staff Warnings, Commendations & Notes register (Phase 41).
 *
 * One unified register for everything a manager writes about a staff
 * member's conduct, performance or recognition:
 *   • Verbal / Written 1 / Written 2 / Final warnings (progressive discipline)
 *   • Commendations (good work recognition)
 *   • Free-form notes (e.g. "asked for leave Friday", "late again")
 *
 * Warnings require an on-screen signature acknowledgement from the staff
 * member — captured on their My Stuff page. Commendations and notes just
 * appear there for visibility.
 *
 * Access is gated by the 'staffWarnings' permission (admin grants per user
 * — typically given to factory managers like Mornay).
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Employee,
  STAFF_WARNING_CATEGORIES,
  STAFF_WARNING_TYPES,
  StaffWarning,
  StaffWarningCategory,
  StaffWarningFilters,
  StaffWarningFormState,
  StaffWarningType,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface StaffWarningsPageProps {
  warnings: StaffWarning[];
  employees: Employee[];
  filters: StaffWarningFilters;
  setFilters: (v: StaffWarningFilters) => void;
  form: StaffWarningFormState;
  setForm: (v: StaffWarningFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (w: StaffWarning) => void;
  onDelete: (id: string) => void;
}

// Friendly badge classes for the entry type. Warnings get danger-tinted
// (escalating), commendations get success, notes stay neutral.
function typeBadgeClass(t: StaffWarningType): string {
  switch (t) {
    case 'Verbal Warning': return 'badge';
    case 'Written Warning 1': return 'badge badge-danger';
    case 'Written Warning 2': return 'badge badge-danger';
    case 'Final Written Warning': return 'badge badge-danger';
    case 'Commendation': return 'badge badge-success';
    case 'Note': return 'badge';
    default: return 'badge';
  }
}

function isWarningType(t: StaffWarningType): boolean {
  return t === 'Verbal Warning' || t === 'Written Warning 1' || t === 'Written Warning 2' || t === 'Final Written Warning';
}

export function StaffWarningsPage({ warnings, employees, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete }: StaffWarningsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => warnings.filter((w) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [w.employeeName, w.description, w.correctiveAction, w.notes, w.recordNumber].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.type && w.type !== filters.type) return false;
    if (filters.category && w.category !== filters.category) return false;
    if (filters.employeeId && w.employeeId !== filters.employeeId) return false;
    if (filters.acknowledged === 'yes' && !w.acknowledged) return false;
    if (filters.acknowledged === 'no' && w.acknowledged) return false;
    return true;
  }), [warnings, filters]);

  const stats = useMemo(() => {
    const total = warnings.length;
    const open = warnings.filter((w) => isWarningType(w.type) && !w.acknowledged).length;
    const commendations = warnings.filter((w) => w.type === 'Commendation').length;
    const warningsCount = warnings.filter((w) => isWarningType(w.type)).length;
    return { total, open, commendations, warningsCount };
  }, [warnings]);

  // When admin picks an employee in the form, snap the employeeName so the
  // warning record is portable even if the employee row later changes.
  function pickEmployee(id: string) {
    const e = employees.find((x) => x.id === id);
    setForm({
      ...form,
      employeeId: id,
      employeeName: e ? `${e.firstName} ${e.lastName}`.trim() : form.employeeName,
    });
  }

  const sections: FormWizardSection[] = [{
    key: 'warning',
    title: 'New entry',
    missingRequired: [
      ...(form.employeeId || form.employeeName.trim() ? [] : ['Staff member']),
      ...(form.issuedDate ? [] : ['Issued date']),
      ...(form.description.trim() ? [] : ['Description']),
    ],
    body: (
      <div className="form-grid">
        <label>
          <span>Staff member <RequiredMarker /></span>
          <select value={form.employeeId} onChange={(e) => pickEmployee(e.target.value)}>
            <option value="">— pick employee —</option>
            {employees.filter((e) => e.active !== false).map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Or staff name (if not on employee list)</span>
          <input value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value, employeeId: '' })} placeholder="Type a name" />
        </label>

        <label>
          <span>Type <RequiredMarker /></span>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as StaffWarningType })}>
            {STAFF_WARNING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as StaffWarningCategory })}>
            {STAFF_WARNING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          <span>Incident date</span>
          <input type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} />
        </label>
        <label>
          <span>Issued date <RequiredMarker /></span>
          <input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} />
        </label>

        <label>
          <span>Issued by</span>
          <input value={form.issuedByName} onChange={(e) => setForm({ ...form, issuedByName: e.target.value })} placeholder="Manager name" />
        </label>
        <label>
          <span>Falls off / expires</span>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </label>

        <label className="full-span">
          <span>Description <RequiredMarker /></span>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened? Be specific — dates, witnesses, facts." />
        </label>

        {isWarningType(form.type) ? (
          <label className="full-span">
            <span>Corrective action / agreed next steps</span>
            <textarea rows={3} value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} placeholder="What does the staff member need to do to improve?" />
          </label>
        ) : null}

        <label className="full-span">
          <span>Attachment URL (signed letter, photo, etc.)</span>
          <input type="url" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://..." />
        </label>

        <label className="full-span">
          <span>Internal notes (admin only — not shown to staff)</span>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={mode === 'list' ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>New entry</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>← Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit entry' : 'New warning, commendation or note'}
          subtitle="Records get linked to the staff member and appear on their My Stuff page. Warnings require their signature acknowledgement."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save entry"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Staff Warnings, Commendations & Notes" subtitle={`${filtered.length} of ${warnings.length} entry(ies) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className={`food-safety-stat${stats.open > 0 ? ' food-safety-stat-alert' : ''}`}><span>Pending sign-off</span><strong>{stats.open}</strong></div>
            <div className="food-safety-stat"><span>Warnings</span><strong>{stats.warningsCount}</strong></div>
            <div className="food-safety-stat"><span>Commendations</span><strong>{stats.commendations}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Staff name, text" /></label>
            <label><span>Type</span>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">All</option>
                {STAFF_WARNING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Category</span>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All</option>
                {STAFF_WARNING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Employee</span>
              <select value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}>
                <option value="">All</option>
                {employees.filter((e) => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </label>
            <label><span>Acknowledged?</span>
              <select value={filters.acknowledged} onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value as StaffWarningFilters['acknowledged'] })}>
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No entries" body="Log warnings, commendations and notes so HR has a defensible record for every staff member." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Staff</th><th>Type</th><th>Category</th><th>Issued</th><th>Issued by</th><th>Description</th><th>Sign-off</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id}>
                      <td><strong>{w.recordNumber}</strong></td>
                      <td>{w.employeeName}</td>
                      <td><span className={typeBadgeClass(w.type)}>{w.type}</span></td>
                      <td>{w.category}</td>
                      <td>{formatDate(w.issuedDate)}</td>
                      <td>{w.issuedByName || '—'}</td>
                      <td style={{ maxWidth: 320 }}><div className="table-subtext" style={{ whiteSpace: 'pre-wrap' }}>{w.description}</div></td>
                      <td>
                        {isWarningType(w.type) ? (
                          w.acknowledged
                            ? <span className="badge badge-success">✓ {formatDate(w.acknowledgedDate)}</span>
                            : <span className="badge badge-danger">Pending</span>
                        ) : <span className="muted">—</span>}
                      </td>
                      <td>
                        <button className="table-button" onClick={() => { onEdit(w); setMode('form'); }}>Edit</button>
                        <button className="table-button danger" onClick={() => { if (confirm('Delete this entry?')) onDelete(w.id); }}>Delete</button>
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
