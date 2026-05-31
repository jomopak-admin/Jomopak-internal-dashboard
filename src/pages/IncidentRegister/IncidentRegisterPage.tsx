/**
 * Phase 95.1 — Incident & Accident Register.
 *
 * SMETA-mandatory module. One row per incident: injury / near-miss /
 * property damage / IOD / environmental. Captures the full chain — what
 * happened → immediate action → root cause → corrective action → IOD
 * submission → return-to-work — plus signed-off photo evidence.
 *
 * Doesn't replace the existing First Aid Register (Phase 82). First Aid
 * stays the lightweight "treatment given" log; Incident Register is the
 * heavier "we need to investigate this and submit WCl.2" log.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import {
  DesignatedFirstAider,
  Employee,
  IncidentEntry,
  IncidentFormState,
  IncidentSeverity,
  IncidentType,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

const INCIDENT_TYPES: IncidentType[] = ['Near miss', 'First aid case', 'Medical treatment', 'Lost time injury', 'Property damage', 'IOD', 'Environmental'];
const SEVERITIES: IncidentSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

interface Props {
  entries: IncidentEntry[];
  form: IncidentFormState;
  setForm: (next: IncidentFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (entry: IncidentEntry) => void;
  onDelete: () => void;
  employees: Employee[];
  firstAiders?: DesignatedFirstAider[];
}

export function IncidentRegisterPage(props: Props) {
  const { entries, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete, employees, firstAiders = [] } = props;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<IncidentType | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | ''>('');

  function patch(p: Partial<IncidentFormState>) {
    setForm({ ...form, ...p });
  }

  const filtered = useMemo(() => entries.filter((e) => {
    if (typeFilter && e.incidentType !== typeFilter) return false;
    if (severityFilter && e.severity !== severityFilter) return false;
    if (search) {
      const t = search.toLowerCase();
      const hay = `${e.incidentNumber} ${e.personName} ${e.description} ${e.location} ${e.bodyPartAffected}`.toLowerCase();
      if (!hay.includes(t)) return false;
    }
    return true;
  }), [entries, typeFilter, severityFilter, search]);

  const summary = useMemo(() => {
    const open = entries.filter((e) => !e.closedAt).length;
    const ltDays = entries.reduce((s, e) => s + (Number(e.daysLost) || 0), 0);
    const iodOpen = entries.filter((e) => e.incidentType === 'IOD' && !e.iodSubmitted).length;
    return { open, ltDays, iodOpen, total: entries.length };
  }, [entries]);

  const sections: FormWizardSection[] = [
    {
      key: 'who',
      title: 'Who & when',
      missingRequired: [
        ...(form.incidentDate ? [] : ['Incident date']),
        ...(form.personName.trim() ? [] : ['Person name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Incident # {form.incidentNumber ? '' : '(auto)'}</span><input value={form.incidentNumber} onChange={(e) => patch({ incidentNumber: e.target.value })} placeholder="Leave blank for INC-202605-001" /></label>
          <label><span>Date *</span><input type="date" value={form.incidentDate} onChange={(e) => patch({ incidentDate: e.target.value })} /></label>
          <label><span>Time</span><input type="time" value={form.incidentTime} onChange={(e) => patch({ incidentTime: e.target.value })} /></label>
          <label><span>Location</span><input value={form.location} onChange={(e) => patch({ location: e.target.value })} placeholder="Bag making line / Warehouse / Office" /></label>
          <label>
            <span>Person (employee)</span>
            <select value={form.personEmployeeId} onChange={(e) => {
              const emp = employees.find((x) => x.id === e.target.value);
              patch({
                personEmployeeId: e.target.value,
                personName: emp ? `${emp.firstName} ${emp.lastName}` : form.personName,
                personRole: emp?.jobTitle ?? form.personRole,
              });
            }}>
              <option value="">— Not an employee / contractor / visitor —</option>
              {employees.filter((e) => e.active !== false).map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}{emp.jobTitle ? ` · ${emp.jobTitle}` : ''}</option>
              ))}
            </select>
          </label>
          <label><span>Person name *</span><input value={form.personName} onChange={(e) => patch({ personName: e.target.value })} /></label>
          <label><span>Role</span><input value={form.personRole} onChange={(e) => patch({ personRole: e.target.value })} placeholder="Operator / Visitor / Contractor" /></label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.isContractor} onChange={(e) => patch({ isContractor: e.target.checked })} />
            <span>Contractor / non-employee</span>
          </label>
        </div>
      ),
    },
    {
      key: 'what',
      title: 'What happened',
      missingRequired: form.description.trim() ? [] : ['Description'],
      body: (
        <div className="form-grid">
          <label>
            <span>Type *</span>
            <select value={form.incidentType} onChange={(e) => patch({ incidentType: e.target.value as IncidentType })}>
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span>Severity</span>
            <select value={form.severity} onChange={(e) => patch({ severity: e.target.value as IncidentSeverity })}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label><span>Body part affected</span><input value={form.bodyPartAffected} onChange={(e) => patch({ bodyPartAffected: e.target.value })} placeholder="Left hand / Right eye / Back" /></label>
          <label><span>Witness</span><input value={form.witnessName} onChange={(e) => patch({ witnessName: e.target.value })} /></label>
          <label className="full-span"><span>Description *</span><textarea rows={3} value={form.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Detailed factual account — what happened, in what order." /></label>
          <label className="full-span"><span>Immediate action taken</span><textarea rows={2} value={form.immediateAction} onChange={(e) => patch({ immediateAction: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'treatment',
      title: 'Treatment & first aid',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Treatment given</span><textarea rows={2} value={form.treatmentGiven} onChange={(e) => patch({ treatmentGiven: e.target.value })} placeholder="Plaster, ice, sutures, ambulance to hospital..." /></label>
          <label><span>Treated by</span><input value={form.treatedByName} onChange={(e) => patch({ treatedByName: e.target.value })} /></label>
          <label>
            <span>On-duty first-aider</span>
            <select value={form.firstAiderEmployeeId} onChange={(e) => patch({ firstAiderEmployeeId: e.target.value })}>
              <option value="">— Select first-aider —</option>
              {firstAiders.filter((a) => a.active).map((a) => (
                <option key={a.employeeId} value={a.employeeId}>{a.fullName} · {a.certLevel}</option>
              ))}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'rca',
      title: 'Root cause & corrective action',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Root cause</span><textarea rows={3} value={form.rootCause} onChange={(e) => patch({ rootCause: e.target.value })} placeholder="5-why or fishbone summary." /></label>
          <label className="full-span"><span>Corrective action</span><textarea rows={3} value={form.correctiveAction} onChange={(e) => patch({ correctiveAction: e.target.value })} placeholder="What we'll do to prevent recurrence." /></label>
          <label><span>Linked NCR (optional)</span><input value={form.linkedNcrId} onChange={(e) => patch({ linkedNcrId: e.target.value })} placeholder="NCR-202605-014" /></label>
        </div>
      ),
    },
    {
      key: 'iod',
      title: 'IOD / COIDA (Injury on Duty)',
      contextActive: form.incidentType === 'IOD' || form.incidentType === 'Lost time injury',
      contextPrompt: <p className="muted" style={{ fontSize: 13 }}>Only required for IOD / Lost time injury entries. Change incident type to enable.</p>,
      body: (
        <div className="form-grid">
          <label className="checkbox-row"><input type="checkbox" checked={form.iodSubmitted} onChange={(e) => patch({ iodSubmitted: e.target.checked })} /><span>WCl.2 submitted to Compensation Commissioner</span></label>
          <label><span>IOD reference #</span><input value={form.iodReference} onChange={(e) => patch({ iodReference: e.target.value })} /></label>
          <label><span>Days lost</span><input type="number" min="0" value={form.daysLost} onChange={(e) => patch({ daysLost: e.target.value })} /></label>
          <label><span>Return-to-work date</span><input type="date" value={form.returnToWorkDate} onChange={(e) => patch({ returnToWorkDate: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'close',
      title: 'Closure & sign-off',
      body: (
        <div className="form-grid">
          <label><span>Closed at</span><input type="date" value={form.closedAt} onChange={(e) => patch({ closedAt: e.target.value })} /></label>
          <label><span>Closed by</span><input value={form.closedByName} onChange={(e) => patch({ closedByName: e.target.value })} /></label>
          <label><span>Reporter</span><input value={form.reporterName} onChange={(e) => patch({ reporterName: e.target.value })} /></label>
          <div className="full-span">
            <span style={{ fontWeight: 500, fontSize: 13 }}>Reporter signature</span>
            <SignaturePad onChange={(url) => patch({ reporterSignatureUrl: url })} />
          </div>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} /></label>
          <div className="full-span">
            <PhotoUploader
              label="Photos (scene, injury, equipment)"
              urls={form.photoUrls || []}
              onChange={(photoUrls) => patch({ photoUrls })}
              recordType="incident"
              recordId={editingId || 'new'}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        title="Incident & Accident Register"
        subtitle="SMETA-mandatory log. Captures near-misses, injuries, property damage, IOD, and environmental incidents — with root cause + corrective action."
      />

      <section className="card">
        <div className="summary-strip" style={{ marginBottom: 12 }}>
          <div className="summary-chip"><span>Total</span><strong>{summary.total}</strong></div>
          <div className="summary-chip"><span>Open</span><strong style={{ color: summary.open > 0 ? '#b8860b' : undefined }}>{summary.open}</strong></div>
          <div className="summary-chip"><span>Lost-time days</span><strong>{formatNumber(summary.ltDays, 0)}</strong></div>
          <div className="summary-chip"><span>IOD unsubmitted</span><strong style={{ color: summary.iodOpen > 0 ? '#b22b2b' : undefined }}>{summary.iodOpen}</strong></div>
        </div>

        <FormWizard
          title={editingId ? 'Edit incident' : 'Log incident'}
          subtitle="Required fields are marked *. WCl.2 fields only show for IOD / lost-time entries."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={onReset}
          saveLabel={editingId ? 'Save changes' : 'Log incident'}
          isEditing={!!editingId}
          footerExtra={editingId ? <button type="button" className="ghost-button" onClick={onDelete}>Delete entry</button> : null}
        />

        <SectionTitle title="Register" subtitle={`${entries.length} entries on file`} />
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Person, location, description..." /></label>
          <label><span>Type</span><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as IncidentType | '')}><option value="">All</option>{INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label><span>Severity</span><select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | '')}><option value="">All</option>{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No incidents logged" body="Log the first incident above. Aim for zero — but every near-miss recorded prevents the next injury." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Type</th><th>Severity</th><th>Person</th><th>Body part</th><th>Days lost</th><th>IOD?</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.incidentNumber}</strong></td>
                    <td>{formatDate(e.incidentDate)}{e.incidentTime ? ` ${e.incidentTime}` : ''}</td>
                    <td>{e.incidentType}</td>
                    <td style={{ color: e.severity === 'High' || e.severity === 'Critical' ? '#b22b2b' : undefined }}>{e.severity}</td>
                    <td><div>{e.personName}</div>{e.personRole ? <div className="table-subtext">{e.personRole}</div> : null}</td>
                    <td>{e.bodyPartAffected || '—'}</td>
                    <td>{formatNumber(e.daysLost, 0)}</td>
                    <td>{e.incidentType === 'IOD' || e.incidentType === 'Lost time injury' ? (e.iodSubmitted ? '✓' : '✗') : '—'}</td>
                    <td>{e.closedAt ? `Closed ${formatDate(e.closedAt)}` : <span style={{ color: '#b8860b' }}>Open</span>}</td>
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
