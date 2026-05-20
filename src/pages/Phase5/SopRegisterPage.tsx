/**
 * SOP Document Register.
 *
 * One row per SOP version. The list flags overdue reviews + tracks
 * staff acknowledgements. "Supersede" creates a new version pointing at
 * the previous one; the old version flips to Superseded but stays in
 * the register for audit lookups.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  SOP_CATEGORIES,
  SopAcknowledgement,
  SopCategory,
  SopDocument,
  SopDocumentFilters,
  SopDocumentFormState,
  SopStatus,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface SopRegisterPageProps {
  documents: SopDocument[];
  filters: SopDocumentFilters;
  setFilters: (v: SopDocumentFilters) => void;
  form: SopDocumentFormState;
  setForm: (v: SopDocumentFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (d: SopDocument) => void;
  /** Create a new version of an existing SOP — sets supersedesId + bumps version. */
  onCreateNewVersion: (d: SopDocument) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function getReviewState(d: SopDocument): 'overdue' | 'due-soon' | 'ok' | 'never' {
  if (!d.reviewDate) return 'never';
  const t = new Date(d.reviewDate).getTime();
  if (Number.isNaN(t)) return 'never';
  const now = Date.now();
  if (now > t) return 'overdue';
  if (t - now < 30 * DAY_MS) return 'due-soon';
  return 'ok';
}

export function SopRegisterPage(props: SopRegisterPageProps) {
  const { documents, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onCreateNewVersion } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => documents.filter((d) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [d.title, d.documentNumber, d.ownerName, d.approvedByName, d.summary].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.category && d.category !== filters.category) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (filters.reviewStatus !== 'all') {
      const s = getReviewState(d);
      if (filters.reviewStatus === 'overdue' && s !== 'overdue' && s !== 'never') return false;
      if (filters.reviewStatus === 'due-soon' && s !== 'due-soon') return false;
      if (filters.reviewStatus === 'ok' && s !== 'ok') return false;
    }
    return true;
  }), [documents, filters]);

  const stats = useMemo(() => {
    const active = documents.filter((d) => d.status === 'Active').length;
    const draft = documents.filter((d) => d.status === 'Draft' || d.status === 'Under Review').length;
    const overdue = documents.filter((d) => {
      const s = getReviewState(d);
      return s === 'overdue' || s === 'never';
    }).length;
    const acknowledged = documents.reduce((acc, d) => acc + d.acknowledgements.length, 0);
    return { total: documents.length, active, draft, overdue, acknowledged };
  }, [documents]);

  function startCreate() { onReset(); setMode('form'); }
  function startEdit(d: SopDocument) { onEdit(d); setMode('form'); }
  function back() { onReset(); setMode('list'); }

  function addAck() {
    const next: SopAcknowledgement = { staffName: '', acknowledgedDate: new Date().toISOString().slice(0, 10) };
    setForm({ ...form, acknowledgements: [...form.acknowledgements, next] });
  }
  function updateAck(idx: number, patch: Partial<SopAcknowledgement>) {
    setForm({
      ...form,
      acknowledgements: form.acknowledgements.map((a, i) => i === idx ? { ...a, ...patch } : a),
    });
  }
  function removeAck(idx: number) {
    setForm({ ...form, acknowledgements: form.acknowledgements.filter((_, i) => i !== idx) });
  }

  const sections: FormWizardSection[] = [
    {
      key: 'identity', title: 'SOP identity',
      missingRequired: [
        ...(form.title.trim() ? [] : ['Title']),
        ...(form.version.trim() ? [] : ['Version']),
      ],
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Title <RequiredMarker /></span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Pre-Production Hygiene SOP" /></label>
          <label><span>Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SopCategory })}>
              {SOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label><span>Version <RequiredMarker /></span><input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0" /></label>
          <label><span>Status</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SopStatus })}>
              <option>Draft</option><option>Active</option><option>Under Review</option><option>Archived</option><option>Superseded</option>
            </select>
          </label>
          <label><span>Owner</span><input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'approval', title: 'Approval & review',
      body: (
        <div className="form-grid">
          <label><span>Approved by</span><input value={form.approvedByName} onChange={(e) => setForm({ ...form, approvedByName: e.target.value })} /></label>
          <label><span>Approved date</span><input type="date" value={form.approvedDate} onChange={(e) => setForm({ ...form, approvedDate: e.target.value })} /></label>
          <label><span>Next review date</span><input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'content', title: 'Document & summary',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Document URL</span><input value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} placeholder="Link to PDF / Doc" /></label>
          <label className="full-span"><span>Summary / change notes</span><textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="What this SOP covers + what changed in this version" /></label>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'ack', title: 'Staff acknowledgements',
      subtitle: 'Track who has signed off on this version.',
      contextActive: form.acknowledgements.length > 0,
      body: (
        <div className="form-grid">
          <div className="full-span" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.acknowledgements.length === 0 ? <p className="muted">No acknowledgements yet.</p> : null}
            {form.acknowledgements.map((a, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 8, alignItems: 'center', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--jp-line)' }}>
                <input value={a.staffName} onChange={(e) => updateAck(idx, { staffName: e.target.value })} placeholder="Staff name" />
                <input type="date" value={a.acknowledgedDate} onChange={(e) => updateAck(idx, { acknowledgedDate: e.target.value })} />
                <button type="button" className="ghost-button" onClick={() => removeAck(idx)}>Remove</button>
              </div>
            ))}
            <button type="button" className="secondary-button" onClick={addAck} style={{ alignSelf: 'flex-start' }}>+ Add acknowledgement</button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={startCreate}>Add SOP</button>
        : <button className="ghost-button" onClick={back}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit SOP' : 'New SOP'}
          subtitle="Approve, version, and track acknowledgement of every standard operating procedure."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={back}
          isEditing={!!editingId}
          saveLabel="Save SOP"
        />
      ) : (
        <section className="card">
          <SectionTitle title="SOP Document Register" subtitle={`${filtered.length} of ${documents.length} SOP(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Active</span><strong>{stats.active}</strong></div>
            <div className="food-safety-stat"><span>Draft / Review</span><strong>{stats.draft}</strong></div>
            <div className={`food-safety-stat${stats.overdue > 0 ? ' food-safety-stat-alert' : ''}`}><span>Review overdue</span><strong>{stats.overdue}</strong></div>
            <div className="food-safety-stat"><span>Acknowledgements</span><strong>{stats.acknowledged}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Title, owner, document #" /></label>
            <label><span>Category</span>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All</option>
                {SOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Draft</option><option>Active</option><option>Under Review</option><option>Archived</option><option>Superseded</option>
              </select>
            </label>
            <label><span>Review</span>
              <select value={filters.reviewStatus} onChange={(e) => setFilters({ ...filters, reviewStatus: e.target.value as SopDocumentFilters['reviewStatus'] })}>
                <option value="all">All</option>
                <option value="overdue">Overdue / never</option>
                <option value="due-soon">Due within 30d</option>
                <option value="ok">Up to date</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No SOPs registered" body="Add your food safety policy, hygiene SOP, cleaning SOP, recall procedure, and others. Track approval + acknowledgement per version." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Title</th><th>Category</th><th>Version</th><th>Status</th><th>Owner</th><th>Review</th><th>Acks</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const r = getReviewState(d);
                    return (
                      <tr key={d.id}>
                        <td><strong>{d.documentNumber}</strong></td>
                        <td>{d.title}{d.summary ? <div className="table-subtext" title={d.summary}>{d.summary.length > 60 ? d.summary.slice(0, 60) + '…' : d.summary}</div> : null}</td>
                        <td>{d.category}</td>
                        <td>{d.version}</td>
                        <td><span className={d.status === 'Active' ? 'badge badge-success' : d.status === 'Superseded' || d.status === 'Archived' ? 'badge' : 'badge badge-warning'}>{d.status}</span></td>
                        <td>{d.ownerName || '—'}</td>
                        <td className={r === 'overdue' || r === 'never' ? 'cell-alert' : undefined}>{d.reviewDate ? formatDate(d.reviewDate) : 'Never set'}<div className="table-subtext">{r === 'overdue' ? 'Overdue' : r === 'due-soon' ? 'Due 30d' : r === 'never' ? 'Set date' : 'OK'}</div></td>
                        <td>{d.acknowledgements.length}</td>
                        <td>
                          <div className="inline-actions">
                            <button className="table-button" onClick={() => startEdit(d)}>Edit</button>
                            {d.documentUrl ? <a className="table-button" href={d.documentUrl} target="_blank" rel="noopener noreferrer">Open</a> : null}
                            {d.status === 'Active' ? <button className="table-button table-button-promote" onClick={() => onCreateNewVersion(d)} title="Create new version that supersedes this one">+ New version</button> : null}
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
