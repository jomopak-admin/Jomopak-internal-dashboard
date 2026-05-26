/**
 * Notice Board (admin).
 *
 * Post notices to the whole team or specific roles. Pinned notices stick to
 * the top of every staff member's My Stuff page. Optional expiry hides the
 * notice automatically. Internal-only — does not go to clients.
 */

import { useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import { Notice, NoticeFormState, UserRole } from '../../types';
import { formatDate } from '../../utils/calculations';

const ROLE_OPTIONS: UserRole[] = ['admin', 'ops', 'production', 'sales', 'artwork', 'accounts'];

interface NoticesPageProps {
  notices: Notice[];
  form: NoticeFormState;
  setForm: (v: NoticeFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (n: Notice) => void;
  onDelete: (id: string) => void;
}

export function NoticesPage({ notices, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete }: NoticesPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  function toggleRole(r: UserRole) {
    const next = form.audienceRoles.includes(r)
      ? form.audienceRoles.filter((x) => x !== r)
      : [...form.audienceRoles, r];
    setForm({ ...form, audienceRoles: next });
  }

  const sections: FormWizardSection[] = [{
    key: 'notice',
    title: 'Notice',
    missingRequired: [
      ...(form.title.trim() ? [] : ['Title']),
      ...(form.body.trim() ? [] : ['Body']),
    ],
    body: (
      <div className="form-grid">
        <label className="full-span">
          <span>Title <RequiredMarker /></span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Factory closed Friday for stocktake" />
        </label>
        <label className="full-span">
          <span>Message <RequiredMarker /></span>
          <textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What do you want everyone to know?" />
        </label>
        <label>
          <span>Hide after (optional)</span>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </label>
        <label>
          <span>Pin to top?</span>
          <select value={form.pinned ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, pinned: e.target.value === 'yes' })}>
            <option value="no">No</option>
            <option value="yes">Yes — pin</option>
          </select>
        </label>
        <div className="full-span">
          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
            Who should see this? <span className="muted" style={{ fontWeight: 400 }}>· leave all empty to send to everyone</span>
          </span>
          <div className="role-toggles">
            {ROLE_OPTIONS.map((r) => (
              <label key={r} className={`role-toggle ${form.audienceRoles.includes(r) ? 'is-active' : ''}`}>
                <input type="checkbox" checked={form.audienceRoles.includes(r)} onChange={() => toggleRole(r)} />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    ),
  }];

  const sorted = [...notices].sort((a, b) => {
    if ((a.pinned ? 1 : 0) !== (b.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    return (b.postedAt || '').localeCompare(a.postedAt || '');
  });

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>New notice</button>
        : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit notice' : 'New notice'}
          subtitle="Share something with the whole team or a specific role."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Post notice"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Notice Board" subtitle={`${notices.length} notice(s)`} />
          {sorted.length === 0 ? (
            <EmptyState title="No notices yet" body="Post a notice and it'll show up on everyone's My Stuff page." />
          ) : (
            <ul className="notice-list">
              {sorted.map((n) => {
                const expired = n.expiresAt && n.expiresAt < new Date().toISOString().slice(0, 10);
                return (
                  <li key={n.id} className={`notice-item ${n.pinned ? 'is-pinned' : ''} ${expired ? 'is-expired' : ''}`}>
                    <div className="notice-head">
                      <strong>{n.pinned ? '📌 ' : ''}{n.title}</strong>
                      <span className="muted">{formatDate(n.postedAt)} · {n.postedByName}{expired ? ' · expired' : ''}</span>
                    </div>
                    <p className="notice-body">{n.body}</p>
                    {n.audienceRoles && n.audienceRoles.length > 0 ? (
                      <div className="notice-audience">For: {n.audienceRoles.join(', ')}</div>
                    ) : (
                      <div className="notice-audience">For: everyone</div>
                    )}
                    <div className="notice-actions">
                      <button className="table-button" onClick={() => { onEdit(n); setMode('form'); }}>Edit</button>
                      <button className="table-button danger" onClick={() => { if (confirm('Delete this notice?')) onDelete(n.id); }}>Delete</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
