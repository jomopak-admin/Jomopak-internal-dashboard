/**
 * Phase 103.2 — Audit Programmes register.
 *
 * One row per audit programme JomoPak runs (SMETA, FSC Chain of Custody,
 * FSSC 22000, ISO 9001, etc). Tracks who audits us, when we were last
 * audited, how often it recurs, and when the next one is due. The Activity
 * Inbox producer (produceAuditDeadlines) reads this list and emits
 * "Audit due in 30 days" events as the date approaches.
 *
 * Why a dedicated page (not just rows on the Doc Vault)?
 *   - cadence + auto next-due, which Doc Vault doesn't model
 *   - status (Active / Paused / Lapsed) drives reminder logic
 *   - one place to see every certification we owe
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AuditProgramme,
  AuditProgrammeFormState,
  AuditProgrammeStatus,
  computeAuditNextDue,
} from '../../types';
import { formatDate } from '../../utils/calculations';

const STATUSES: AuditProgrammeStatus[] = ['Active', 'Paused', 'Lapsed'];

interface Props {
  programmes: AuditProgramme[];
  form: AuditProgrammeFormState;
  setForm: (next: AuditProgrammeFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (programme: AuditProgramme) => void;
  onDelete: () => void;
}

/** Days between today and the supplied iso date. Positive = future. */
function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86400000);
}

function dueLabel(iso: string): { text: string; tone: 'ok' | 'soon' | 'overdue' } {
  const d = daysUntil(iso);
  if (d === null) return { text: '—', tone: 'ok' };
  if (d < 0) return { text: `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'}`, tone: 'overdue' };
  if (d <= 30) return { text: `Due in ${d} day${d === 1 ? '' : 's'}`, tone: 'soon' };
  return { text: `Due in ${d} days`, tone: 'ok' };
}

export function AuditProgrammesPage(props: Props) {
  const { programmes, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete } = props;
  const [search, setSearch] = useState('');

  function patch(p: Partial<AuditProgrammeFormState>) { setForm({ ...form, ...p }); }

  const filtered = useMemo(() => programmes.filter((p) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return `${p.code} ${p.name} ${p.auditingBody} ${p.notes}`.toLowerCase().includes(t);
  }), [programmes, search]);

  /** Quick stat: how many programmes are due within 60 days (drives the
   *  inbox + a glanceable headline on the page itself). */
  const dueSoon = useMemo(() => programmes.filter((p) => {
    if (p.status !== 'Active') return false;
    const d = daysUntil(computeAuditNextDue(p));
    return d !== null && d <= 60;
  }).length, [programmes]);

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Programme',
      missingRequired: form.name ? [] : ['Name'],
      body: (
        <div className="form-grid">
          <label><span>Code</span><input value={form.code} onChange={(e) => patch({ code: e.target.value })} placeholder="SMETA / FSC-COC / FSSC / ISO9001" /></label>
          <label><span>Name *</span><input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="SMETA 4-Pillar" /></label>
          <label><span>Auditing body</span><input value={form.auditingBody} onChange={(e) => patch({ auditingBody: e.target.value })} placeholder="Sedex / SGS / BSI / FSC SA" /></label>
          <label><span>Contact email</span><input type="email" value={form.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} /></label>
          <label><span>Status</span>
            <select value={form.status} onChange={(e) => patch({ status: e.target.value as AuditProgrammeStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'cadence',
      title: 'Cadence & dates',
      body: (
        <div className="form-grid">
          <label><span>Last audited</span><input type="date" value={form.lastAuditedDate} onChange={(e) => patch({ lastAuditedDate: e.target.value })} /></label>
          <label><span>Cadence (months)</span><input type="number" min={1} value={form.cadenceMonths} onChange={(e) => patch({ cadenceMonths: e.target.value })} placeholder="12" /></label>
          <label><span>Next due (manual override)</span><input type="date" value={form.nextDueDateOverride} onChange={(e) => patch({ nextDueDateOverride: e.target.value })} /></label>
          <label><span>Certificate expiry</span><input type="date" value={form.certificateExpiryDate} onChange={(e) => patch({ certificateExpiryDate: e.target.value })} /></label>
          <label className="full-width"><span>Certificate URL</span><input value={form.certificateUrl} onChange={(e) => patch({ certificateUrl: e.target.value })} placeholder="https://..." /></label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      body: (
        <div className="form-grid">
          <label className="full-width"><span>Notes</span><textarea rows={4} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Scope, prep checklist, certificate number, last finding…" /></label>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <SectionTitle title="Audit Programmes" subtitle="Every external audit we run against, with cadence and next due date." />

      <div className="card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div><strong style={{ fontSize: 20 }}>{programmes.length}</strong> <span className="muted">programmes</span></div>
          <div><strong style={{ fontSize: 20, color: dueSoon > 0 ? 'var(--warn, #c47b00)' : undefined }}>{dueSoon}</strong> <span className="muted">due within 60 days</span></div>
        </div>
      </div>

      <FormWizard
        title={editingId ? 'Edit audit programme' : 'New audit programme'}
        sections={sections}
        isEditing={!!editingId}
        message={message}
        onSave={onSave}
        onCancel={onReset}
        saveLabel={editingId ? 'Update programme' : 'Add programme'}
        footerExtra={editingId ? <button type="button" className="ghost-button" onClick={onDelete}>Delete</button> : undefined}
      />

      <div className="card">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ flex: 1 }} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No audit programmes yet" body="Add SMETA, FSC, FSSC, ISO or any other audit you run against." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Auditing body</th>
                <th>Last audited</th>
                <th>Next due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const nextDue = computeAuditNextDue(p);
                const label = dueLabel(nextDue);
                return (
                  <tr key={p.id}>
                    <td><code>{p.code || '—'}</code></td>
                    <td>{p.name}</td>
                    <td>{p.auditingBody || '—'}</td>
                    <td>{p.lastAuditedDate ? formatDate(p.lastAuditedDate) : '—'}</td>
                    <td>
                      {nextDue ? formatDate(nextDue) : '—'}
                      <div style={{
                        fontSize: 11,
                        color: label.tone === 'overdue' ? 'var(--alert, #b00020)' : label.tone === 'soon' ? 'var(--warn, #c47b00)' : 'var(--muted)',
                      }}>{label.text}</div>
                    </td>
                    <td>{p.status}</td>
                    <td><button type="button" onClick={() => onEdit(p)}>Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** Initial / empty form state. Default cadence = 12 months (annual). */
export function createInitialAuditProgrammeForm(): AuditProgrammeFormState {
  return {
    code: '',
    name: '',
    auditingBody: '',
    contactEmail: '',
    lastAuditedDate: '',
    cadenceMonths: '12',
    nextDueDateOverride: '',
    notes: '',
    status: 'Active',
    certificateUrl: '',
    certificateExpiryDate: '',
  };
}
