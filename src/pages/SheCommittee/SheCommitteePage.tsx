/**
 * Phase 95.4 — SHE Committee Meeting Register.
 *
 * Minutes of the SHE (Safety / Health / Environment) Committee, with
 * agenda, attendees + signatures, and action items that track to closure.
 * SMETA expects monthly cadence and demonstrated follow-through.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import { Employee, SheActionItem, SheActionStatus, SheMeetingAttendee, SheMeetingEntry, SheMeetingFormState } from '../../types';
import { formatDate } from '../../utils/calculations';

const ACTION_STATUSES: SheActionStatus[] = ['Open', 'In progress', 'Done', 'Cancelled'];

interface Props {
  entries: SheMeetingEntry[];
  form: SheMeetingFormState;
  setForm: (next: SheMeetingFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (entry: SheMeetingEntry) => void;
  onDelete: () => void;
  employees: Employee[];
}

export function SheCommitteePage(props: Props) {
  const { entries, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete, employees } = props;
  const [search, setSearch] = useState('');

  function patch(p: Partial<SheMeetingFormState>) { setForm({ ...form, ...p }); }

  function addAttendee() { setForm({ ...form, attendees: [...form.attendees, { name: '', role: '', signatureUrl: '' }] }); }
  function updateAttendee(idx: number, p: Partial<SheMeetingAttendee>) {
    setForm({ ...form, attendees: form.attendees.map((a, i) => i === idx ? { ...a, ...p } : a) });
  }
  function removeAttendee(idx: number) { setForm({ ...form, attendees: form.attendees.filter((_, i) => i !== idx) }); }

  function addAction() {
    const id = `ACT-${Date.now()}-${form.actionItems.length + 1}`;
    setForm({ ...form, actionItems: [...form.actionItems, { id, description: '', ownerName: '', dueDate: '', status: 'Open', closedDate: '', closeoutNote: '' }] });
  }
  function updateAction(idx: number, p: Partial<SheActionItem>) {
    setForm({ ...form, actionItems: form.actionItems.map((a, i) => i === idx ? { ...a, ...p } : a) });
  }
  function removeAction(idx: number) { setForm({ ...form, actionItems: form.actionItems.filter((_, i) => i !== idx) }); }

  const filtered = useMemo(() => entries.filter((e) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return `${e.meetingNumber} ${e.chairpersonName} ${e.agenda} ${e.minutes}`.toLowerCase().includes(t);
  }), [entries, search]);

  // Rollup of open actions across all meetings, since auditors care about closure rate.
  const openActions = useMemo(() => {
    let open = 0; let total = 0;
    entries.forEach((m) => m.actionItems.forEach((a) => {
      total++;
      if (a.status === 'Open' || a.status === 'In progress') open++;
    }));
    return { open, total };
  }, [entries]);

  const sections: FormWizardSection[] = [
    {
      key: 'meeting',
      title: 'Meeting',
      missingRequired: form.meetingDate ? [] : ['Meeting date'],
      body: (
        <div className="form-grid">
          <label><span>Meeting # {form.meetingNumber ? '' : '(auto)'}</span><input value={form.meetingNumber} onChange={(e) => patch({ meetingNumber: e.target.value })} placeholder="SHE-202605-001" /></label>
          <label><span>Date *</span><input type="date" value={form.meetingDate} onChange={(e) => patch({ meetingDate: e.target.value })} /></label>
          <label><span>Time</span><input type="time" value={form.meetingTime} onChange={(e) => patch({ meetingTime: e.target.value })} /></label>
          <label><span>Next meeting</span><input type="date" value={form.nextMeetingDate} onChange={(e) => patch({ nextMeetingDate: e.target.value })} /></label>
          <label><span>Chairperson</span><input value={form.chairpersonName} onChange={(e) => patch({ chairpersonName: e.target.value })} /></label>
          <label><span>Scribe</span><input value={form.scribeName} onChange={(e) => patch({ scribeName: e.target.value })} /></label>
          <label className="full-span"><span>Agenda</span><textarea rows={3} value={form.agenda} onChange={(e) => patch({ agenda: e.target.value })} /></label>
          <label className="full-span"><span>Minutes</span><textarea rows={6} value={form.minutes} onChange={(e) => patch({ minutes: e.target.value })} placeholder="Summary of discussion + decisions. Action items go in the next step." /></label>
        </div>
      ),
    },
    {
      key: 'attendees',
      title: `Attendees (${form.attendees.length})`,
      body: (
        <div>
          {form.attendees.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>No attendees added yet.</p> : (
            <div className="table-wrap" style={{ marginBottom: 12 }}>
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Name</th><th>Role</th><th>Signature</th><th /></tr></thead>
                <tbody>
                  {form.attendees.map((a, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={a.employeeId ?? ''} onChange={(e) => {
                          const emp = employees.find((x) => x.id === e.target.value);
                          updateAttendee(idx, { employeeId: e.target.value || undefined, name: emp ? `${emp.firstName} ${emp.lastName}` : a.name, role: emp?.jobTitle ?? a.role });
                        }}>
                          <option value="">— Pick from staff —</option>
                          {employees.filter((e) => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                        </select>
                      </td>
                      <td><input value={a.name} onChange={(e) => updateAttendee(idx, { name: e.target.value })} /></td>
                      <td><input value={a.role} onChange={(e) => updateAttendee(idx, { role: e.target.value })} placeholder="Worker rep / Mgmt / Safety officer" /></td>
                      <td style={{ minWidth: 220 }}>
                        {a.signatureUrl ? <span style={{ color: '#2e6f3e' }}>✓ signed</span> : <SignaturePad onChange={(url) => updateAttendee(idx, { signatureUrl: url })} />}
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
      key: 'actions',
      title: `Action items (${form.actionItems.length})`,
      subtitle: 'Each action gets an owner + due date. The next meeting reviews status.',
      body: (
        <div>
          {form.actionItems.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>No action items yet.</p> : (
            <div className="table-wrap" style={{ marginBottom: 12 }}>
              <table className="data-table">
                <thead><tr><th>Description</th><th>Owner</th><th>Due</th><th>Status</th><th>Closeout note</th><th /></tr></thead>
                <tbody>
                  {form.actionItems.map((a, idx) => (
                    <tr key={a.id}>
                      <td><textarea rows={2} value={a.description} onChange={(e) => updateAction(idx, { description: e.target.value })} /></td>
                      <td><input value={a.ownerName} onChange={(e) => updateAction(idx, { ownerName: e.target.value })} /></td>
                      <td><input type="date" value={a.dueDate} onChange={(e) => updateAction(idx, { dueDate: e.target.value })} /></td>
                      <td>
                        <select value={a.status} onChange={(e) => {
                          const nextStatus = e.target.value as SheActionStatus;
                          updateAction(idx, { status: nextStatus, closedDate: nextStatus === 'Done' && !a.closedDate ? new Date().toISOString().slice(0, 10) : a.closedDate });
                        }}>
                          {ACTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><input value={a.closeoutNote} onChange={(e) => updateAction(idx, { closeoutNote: e.target.value })} /></td>
                      <td><button type="button" className="ghost-button" onClick={() => removeAction(idx)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" className="secondary-button" onClick={addAction}>+ Add action item</button>
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
            <PhotoUploader label="Photos (whiteboard, sign-in sheet)" urls={form.photoUrls || []} onChange={(photoUrls) => patch({ photoUrls })} recordType="sheMeeting" recordId={editingId || 'new'} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        title="SHE Committee Meetings"
        subtitle="Safety / Health / Environment committee minutes + action tracker. SMETA expects monthly cadence with > 50% management + worker reps."
      />
      <section className="card">
        <div className="summary-strip" style={{ marginBottom: 12 }}>
          <div className="summary-chip"><span>Meetings logged</span><strong>{entries.length}</strong></div>
          <div className="summary-chip"><span>Action items</span><strong>{openActions.total}</strong></div>
          <div className="summary-chip"><span>Open</span><strong style={{ color: openActions.open > 0 ? '#b8860b' : undefined }}>{openActions.open}</strong></div>
        </div>

        <FormWizard
          title={editingId ? 'Edit meeting' : 'Log meeting'}
          subtitle="Capture minutes + attendees + actions. Close out action items here as they get done."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={onReset}
          saveLabel={editingId ? 'Save changes' : 'Log meeting'}
          isEditing={!!editingId}
          footerExtra={editingId ? <button type="button" className="ghost-button" onClick={onDelete}>Delete entry</button> : null}
        />

        <SectionTitle title="Register" subtitle={`${entries.length} meetings on file`} />
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No meetings logged" body="Log your first SHE committee meeting above." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>#</th><th>Date</th><th>Chair</th><th>Attendees</th><th>Actions</th><th>Open</th><th>Next</th><th /></tr></thead>
              <tbody>
                {filtered.map((e) => {
                  const openAct = e.actionItems.filter((a) => a.status === 'Open' || a.status === 'In progress').length;
                  return (
                    <tr key={e.id}>
                      <td><strong>{e.meetingNumber}</strong></td>
                      <td>{formatDate(e.meetingDate)}</td>
                      <td>{e.chairpersonName}</td>
                      <td>{e.attendees.length}</td>
                      <td>{e.actionItems.length}</td>
                      <td style={{ color: openAct > 0 ? '#b8860b' : undefined }}>{openAct}</td>
                      <td>{e.nextMeetingDate ? formatDate(e.nextMeetingDate) : '—'}</td>
                      <td><button type="button" className="ghost-button" onClick={() => onEdit(e)}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
