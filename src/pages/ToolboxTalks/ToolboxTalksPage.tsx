/**
 * Phase 95.3 — Toolbox Talks Register.
 *
 * Short safety briefings done before a shift or on a specific topic.
 * SMETA evidence that the team is actively trained on hazards.
 * Each talk: date, topic, facilitator, attendee list with signatures.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import { Employee, ToolboxTalkAttendee, ToolboxTalkEntry, ToolboxTalkFormState } from '../../types';
import { formatDate } from '../../utils/calculations';

interface Props {
  entries: ToolboxTalkEntry[];
  form: ToolboxTalkFormState;
  setForm: (next: ToolboxTalkFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (entry: ToolboxTalkEntry) => void;
  onDelete: () => void;
  employees: Employee[];
}

export function ToolboxTalksPage(props: Props) {
  const { entries, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete, employees } = props;
  const [search, setSearch] = useState('');

  function patch(p: Partial<ToolboxTalkFormState>) { setForm({ ...form, ...p }); }

  function addAttendee() {
    setForm({ ...form, attendees: [...form.attendees, { name: '', signatureUrl: '' }] });
  }
  function updateAttendee(idx: number, p: Partial<ToolboxTalkAttendee>) {
    setForm({ ...form, attendees: form.attendees.map((a, i) => i === idx ? { ...a, ...p } : a) });
  }
  function removeAttendee(idx: number) {
    setForm({ ...form, attendees: form.attendees.filter((_, i) => i !== idx) });
  }

  const filtered = useMemo(() => entries.filter((e) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return `${e.talkNumber} ${e.topic} ${e.facilitatorName}`.toLowerCase().includes(t);
  }), [entries, search]);

  const sections: FormWizardSection[] = [
    {
      key: 'topic',
      title: 'Talk details',
      missingRequired: [...(form.talkDate ? [] : ['Date']), ...(form.topic.trim() ? [] : ['Topic'])],
      body: (
        <div className="form-grid">
          <label><span>Talk # {form.talkNumber ? '' : '(auto)'}</span><input value={form.talkNumber} onChange={(e) => patch({ talkNumber: e.target.value })} placeholder="TBT-202605-001" /></label>
          <label><span>Date *</span><input type="date" value={form.talkDate} onChange={(e) => patch({ talkDate: e.target.value })} /></label>
          <label><span>Topic *</span><input value={form.topic} onChange={(e) => patch({ topic: e.target.value })} placeholder="Safe use of guillotine blades" /></label>
          <label><span>Facilitator</span><input value={form.facilitatorName} onChange={(e) => patch({ facilitatorName: e.target.value })} /></label>
          <label><span>Duration (minutes)</span><input type="number" min="0" value={form.durationMinutes} onChange={(e) => patch({ durationMinutes: e.target.value })} /></label>
          <label className="full-span"><span>Key points covered</span><textarea rows={4} value={form.keyPoints} onChange={(e) => patch({ keyPoints: e.target.value })} placeholder="Bullet points of the safety messages." /></label>
          <label className="full-span"><span>Discussion / Q&amp;A</span><textarea rows={2} value={form.discussion} onChange={(e) => patch({ discussion: e.target.value })} /></label>
          <div className="full-span">
            <span style={{ fontWeight: 500, fontSize: 13 }}>Facilitator signature</span>
            <SignaturePad onChange={(url) => patch({ facilitatorSignatureUrl: url })} />
          </div>
        </div>
      ),
    },
    {
      key: 'attendees',
      title: `Attendees (${form.attendees.length})`,
      body: (
        <div>
          {form.attendees.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No attendees added yet. Click below to start adding signatures.</p>
          ) : (
            <div className="table-wrap" style={{ marginBottom: 12 }}>
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Name</th><th>Signature</th><th /></tr></thead>
                <tbody>
                  {form.attendees.map((a, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={a.employeeId ?? ''} onChange={(e) => {
                          const emp = employees.find((x) => x.id === e.target.value);
                          updateAttendee(idx, { employeeId: e.target.value || undefined, name: emp ? `${emp.firstName} ${emp.lastName}` : a.name });
                        }}>
                          <option value="">— Pick from staff —</option>
                          {employees.filter((e) => e.active !== false).map((e) => (
                            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                          ))}
                        </select>
                      </td>
                      <td><input value={a.name} onChange={(e) => updateAttendee(idx, { name: e.target.value })} /></td>
                      <td style={{ minWidth: 220 }}>
                        {a.signatureUrl ? (
                          <span style={{ color: '#2e6f3e' }}>✓ signed</span>
                        ) : (
                          <SignaturePad onChange={(url) => updateAttendee(idx, { signatureUrl: url })} />
                        )}
                      </td>
                      <td><button type="button" className="ghost-button" onClick={() => removeAttendee(idx)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" className="secondary-button" onClick={addAttendee}>+ Add attendee</button>
        </div>
      ),
    },
    {
      key: 'extras',
      title: 'Photos & notes',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} /></label>
          <div className="full-span">
            <PhotoUploader label="Photos (the group, the demo)" urls={form.photoUrls || []} onChange={(photoUrls) => patch({ photoUrls })} recordType="toolboxTalk" recordId={editingId || 'new'} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        title="Toolbox Talks"
        subtitle="Short pre-shift / topic-specific safety briefings. SMETA looks for monthly cadence + signed attendance."
      />
      <section className="card">
        <FormWizard
          title={editingId ? 'Edit talk' : 'Log a toolbox talk'}
          subtitle="Add the talk first, then sign people in one at a time on the Attendees step."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={onReset}
          saveLabel={editingId ? 'Save changes' : 'Log talk'}
          isEditing={!!editingId}
          footerExtra={editingId ? <button type="button" className="ghost-button" onClick={onDelete}>Delete entry</button> : null}
        />

        <SectionTitle title="Register" subtitle={`${entries.length} talks on file`} />
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Topic, facilitator..." /></label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No toolbox talks logged" body="Log the first talk above." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>#</th><th>Date</th><th>Topic</th><th>Facilitator</th><th>Attendees</th><th>Duration</th><th /></tr></thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.talkNumber}</strong></td>
                    <td>{formatDate(e.talkDate)}</td>
                    <td>{e.topic}</td>
                    <td>{e.facilitatorName}</td>
                    <td>{e.attendees.length}</td>
                    <td>{e.durationMinutes ? `${e.durationMinutes} min` : '—'}</td>
                    <td><button type="button" className="ghost-button" onClick={() => onEdit(e)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
