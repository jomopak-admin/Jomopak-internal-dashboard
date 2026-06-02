/**
 * Phase 82 — First Aid Register.
 *
 * Two stacked sections:
 *   1) Incidents register — every first-aid event logged, with IOD flag
 *      and signature for the receiving employee.
 *   2) Designated First Aiders — who's qualified to administer first aid
 *      on site, with cert level and expiry date.
 *
 * Why this exists: OHS Act §14 requires the register; the Compensation
 * Fund / RMA needs the source incident record when an IOD claim is made;
 * BRC / HACCP auditors check the register because injuries in food-handling
 * areas are a contamination event.
 */
import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import {
  DesignatedFirstAider,
  DesignatedFirstAiderFormState,
  Employee,
  FIRST_AID_CERT_LEVELS,
  FIRST_AID_INJURY_TYPES,
  FirstAidEntry,
  FirstAidEntryFormState,
  FirstAidFilters,
  FirstAidInjuryType,
} from '../../types';
import { formatDate, getMonthLabel } from '../../utils/calculations';

interface FirstAidRegisterPageProps {
  monthOptions: string[];
  employees: Employee[];
  entries: FirstAidEntry[];
  aiders: DesignatedFirstAider[];
  // ---- Entry form ----
  entryForm: FirstAidEntryFormState;
  setEntryForm: (v: FirstAidEntryFormState) => void;
  entryEditingId: string | null;
  entryMessage: string;
  onSaveEntry: () => void;
  onResetEntry: () => void;
  filters: FirstAidFilters;
  setFilters: (v: FirstAidFilters) => void;
  filteredEntries: FirstAidEntry[];
  onEditEntry: (entry: FirstAidEntry) => void;
  // ---- Aider form ----
  aiderForm: DesignatedFirstAiderFormState;
  setAiderForm: (v: DesignatedFirstAiderFormState) => void;
  aiderEditingId: string | null;
  aiderMessage: string;
  onSaveAider: () => void;
  onResetAider: () => void;
  onEditAider: (a: DesignatedFirstAider) => void;
  /** Phase 113 — Admin Hub deep-link. 'new' opens the entry form. */
  pageIntent?: { view: string; intent: string; nonce: number } | null;
  onIntentConsumed?: () => void;
}

export function FirstAidRegisterPage(props: FirstAidRegisterPageProps) {
  const {
    monthOptions,
    employees,
    entries,
    aiders,
    entryForm,
    setEntryForm,
    entryEditingId,
    entryMessage,
    onSaveEntry,
    onResetEntry,
    filters,
    setFilters,
    filteredEntries,
    onEditEntry,
    aiderForm,
    setAiderForm,
    aiderEditingId,
    aiderMessage,
    onSaveAider,
    onResetAider,
    onEditAider,
    pageIntent,
    onIntentConsumed,
  } = props;
  const [mode, setMode] = useState<'list' | 'entryForm' | 'aiderForm'>('list');

  useEffect(() => {
    if (entryEditingId) setMode('entryForm');
  }, [entryEditingId]);

  // Phase 113 — Admin Hub "Log first aid" deep-link: blank the entry form
  // and jump into entryForm mode so the user types straight into a fresh row.
  useEffect(() => {
    if (pageIntent?.intent === 'new') {
      onResetEntry();
      setMode('entryForm');
      onIntentConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIntent?.nonce]);
  useEffect(() => {
    if (aiderEditingId) setMode('aiderForm');
  }, [aiderEditingId]);

  const employeeOptions: ComboboxOption[] = useMemo(
    () => employees.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}`,
      sublabel: e.jobTitle || e.employeeNumber,
    })),
    [employees],
  );

  // ---- Entry form sections ----
  const entrySections: FormWizardSection[] = [
    {
      key: 'incident',
      title: 'Incident',
      subtitle: 'When and where the injury happened.',
      missingRequired: [
        ...(entryForm.incidentDate ? [] : ['Incident date']),
        ...(entryForm.location ? [] : ['Location']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Incident date <RequiredMarker /></span>
            <input type="date" value={entryForm.incidentDate} onChange={(e) => setEntryForm({ ...entryForm, incidentDate: e.target.value })} />
          </label>
          <label><span>Time</span>
            <input type="time" value={entryForm.incidentTime} onChange={(e) => setEntryForm({ ...entryForm, incidentTime: e.target.value })} />
          </label>
          <label><span>Location <RequiredMarker /></span>
            <input value={entryForm.location} onChange={(e) => setEntryForm({ ...entryForm, location: e.target.value })} placeholder="Machine, area, room" />
          </label>
        </div>
      ),
    },
    {
      key: 'person',
      title: 'Person injured',
      subtitle: 'Employee or visitor.',
      missingRequired: [
        ...(entryForm.isVisitor
          ? (entryForm.visitorName ? [] : ['Visitor name'])
          : (entryForm.employeeId ? [] : ['Employee'])),
      ],
      body: (
        <div className="form-grid">
          <label className="checkbox-row">
            <input type="checkbox" checked={entryForm.isVisitor} onChange={(e) => setEntryForm({ ...entryForm, isVisitor: e.target.checked })} />
            Visitor / contractor (not an employee)
          </label>
          {entryForm.isVisitor ? (
            <>
              <label><span>Visitor name <RequiredMarker /></span>
                <input value={entryForm.visitorName} onChange={(e) => setEntryForm({ ...entryForm, visitorName: e.target.value })} />
              </label>
              <label><span>Visitor company</span>
                <input value={entryForm.visitorCompany} onChange={(e) => setEntryForm({ ...entryForm, visitorCompany: e.target.value })} />
              </label>
            </>
          ) : (
            <label className="full-span"><span>Employee <RequiredMarker /></span>
              <Combobox
                options={employeeOptions}
                value={entryForm.employeeId}
                onChange={(value) => {
                  const emp = employees.find((e) => e.id === value);
                  setEntryForm({
                    ...entryForm,
                    employeeId: value,
                    employeeName: emp ? `${emp.firstName} ${emp.lastName}` : entryForm.employeeName,
                  });
                }}
                placeholder="Search employees…"
                emptyMessage="No matching employees"
              />
            </label>
          )}
        </div>
      ),
    },
    {
      key: 'injury',
      title: 'Injury',
      subtitle: 'What happened.',
      body: (
        <div className="form-grid">
          <label><span>Injury type</span>
            <select value={entryForm.injuryType} onChange={(e) => setEntryForm({ ...entryForm, injuryType: e.target.value as FirstAidInjuryType })}>
              {FIRST_AID_INJURY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label><span>Body part</span>
            <input value={entryForm.bodyPart} onChange={(e) => setEntryForm({ ...entryForm, bodyPart: e.target.value })} placeholder="e.g. Left thumb, lower back, right eye" />
          </label>
          <label className="full-span"><span>Description (how it happened)</span>
            <textarea rows={3} value={entryForm.description} onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })} />
          </label>
        </div>
      ),
    },
    {
      key: 'treatment',
      title: 'Treatment',
      subtitle: 'What was done, by whom.',
      missingRequired: [
        ...(entryForm.treatedByName ? [] : ['Treated by']),
      ],
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Treatment given</span>
            <textarea rows={2} value={entryForm.treatmentGiven} onChange={(e) => setEntryForm({ ...entryForm, treatmentGiven: e.target.value })} />
          </label>
          <label><span>Treated by <RequiredMarker /></span>
            <input value={entryForm.treatedByName} onChange={(e) => setEntryForm({ ...entryForm, treatedByName: e.target.value })} placeholder="Qualified first aider's name" />
          </label>
          <label><span>First aider's cert #</span>
            <input value={entryForm.treatedByCertNumber} onChange={(e) => setEntryForm({ ...entryForm, treatedByCertNumber: e.target.value })} placeholder="L1 / L2 / L3 cert number" />
          </label>
          <label><span>Witness</span>
            <input value={entryForm.witnessName} onChange={(e) => setEntryForm({ ...entryForm, witnessName: e.target.value })} />
          </label>
          {/* Phase 98 — Dressings used from the first aid box. Auditors
              and the SHE rep want to see what came out for restocking. */}
          <div className="full-span" style={{ marginTop: 6, padding: 10, background: 'var(--jp-paper-2, #faf8f4)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>Dressings used from first aid box</strong>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setEntryForm({
                  ...entryForm,
                  dressingsUsed: [...entryForm.dressingsUsed, { item: '', quantity: 1, notes: '' }],
                })}
              >+ Add dressing</button>
            </div>
            {entryForm.dressingsUsed.length === 0 ? (
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>None recorded. Add what came out of the box so it gets restocked.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Item</th><th>Qty</th><th>Note</th><th /></tr></thead>
                  <tbody>
                    {entryForm.dressingsUsed.map((d, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            value={d.item}
                            onChange={(e) => setEntryForm({
                              ...entryForm,
                              dressingsUsed: entryForm.dressingsUsed.map((x, i) => i === idx ? { ...x, item: e.target.value } : x),
                            })}
                            placeholder="Plaster / Crepe bandage 75mm / Wound dressing #3"
                          />
                        </td>
                        <td style={{ width: 80 }}>
                          <input
                            type="number"
                            min="0"
                            value={d.quantity}
                            onChange={(e) => setEntryForm({
                              ...entryForm,
                              dressingsUsed: entryForm.dressingsUsed.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) || 0 } : x),
                            })}
                          />
                        </td>
                        <td>
                          <input
                            value={d.notes ?? ''}
                            onChange={(e) => setEntryForm({
                              ...entryForm,
                              dressingsUsed: entryForm.dressingsUsed.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x),
                            })}
                            placeholder="Optional"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setEntryForm({
                              ...entryForm,
                              dressingsUsed: entryForm.dressingsUsed.filter((_, i) => i !== idx),
                            })}
                          >Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'iod',
      title: 'Injury on Duty (IOD)',
      subtitle: 'Compensation Fund / RMA reporting. Tick if this needs a W.As.2 submission.',
      contextActive: entryForm.isIod,
      body: (
        <div className="form-grid">
          <label className="checkbox-row">
            <input type="checkbox" checked={entryForm.isIod} onChange={(e) => setEntryForm({ ...entryForm, isIod: e.target.checked })} />
            Reportable as Injury on Duty
          </label>
          {entryForm.isIod ? (
            <>
              <label><span>W.As.2 / RMA ref</span>
                <input value={entryForm.iodReportNumber} onChange={(e) => setEntryForm({ ...entryForm, iodReportNumber: e.target.value })} />
              </label>
              <label><span>IOD report date</span>
                <input type="date" value={entryForm.iodReportedDate} onChange={(e) => setEntryForm({ ...entryForm, iodReportedDate: e.target.value })} />
              </label>
            </>
          ) : null}
        </div>
      ),
    },
    {
      key: 'followup',
      title: 'Follow-up',
      subtitle: 'Did the injured person need further treatment, time off, or a doctor?',
      body: (
        <div className="form-grid">
          <label className="checkbox-row">
            <input type="checkbox" checked={entryForm.followUpRequired} onChange={(e) => setEntryForm({ ...entryForm, followUpRequired: e.target.checked })} />
            Follow-up required
          </label>
          {entryForm.followUpRequired ? (
            <>
              <label className="full-span"><span>Follow-up notes</span>
                <textarea rows={2} value={entryForm.followUpNotes} onChange={(e) => setEntryForm({ ...entryForm, followUpNotes: e.target.value })} />
              </label>
              <label><span>Resolved on</span>
                <input type="date" value={entryForm.resolvedDate} onChange={(e) => setEntryForm({ ...entryForm, resolvedDate: e.target.value })} />
              </label>
            </>
          ) : null}
        </div>
      ),
    },
    {
      key: 'evidence',
      title: 'Photos & signature',
      subtitle: 'Photo of the injury (for IOD claims) and the receiving employee\'s signature confirming treatment was accepted.',
      body: (
        <div className="form-grid">
          <div className="full-span">
            <PhotoUploader
              urls={entryForm.photoUrls ?? []}
              onChange={(urls) => setEntryForm({ ...entryForm, photoUrls: urls })}
              recordType="firstaid"
              recordId={entryEditingId || `draft-${Date.now()}`}
              label="Photos — wound, location, PPE worn (for IOD claims)"
              max={6}
            />
          </div>
          <div className="full-span">
            <SignaturePad
              onChange={(dataUrl) => setEntryForm({ ...entryForm, signatureDataUrl: dataUrl })}
              label="Patient signature — confirms treatment was administered and accepted"
            />
          </div>
          <label className="full-span"><span>Internal notes</span>
            <textarea rows={2} value={entryForm.notes} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} />
          </label>
        </div>
      ),
    },
  ];

  // ---- Aider form sections ----
  const aiderSections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'First aider',
      missingRequired: [
        ...(aiderForm.fullName ? [] : ['Full name']),
      ],
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Employee (optional)</span>
            <Combobox
              options={employeeOptions}
              value={aiderForm.employeeId}
              onChange={(value) => {
                const emp = employees.find((e) => e.id === value);
                setAiderForm({
                  ...aiderForm,
                  employeeId: value,
                  fullName: emp ? `${emp.firstName} ${emp.lastName}` : aiderForm.fullName,
                  phoneNumber: emp?.phone || aiderForm.phoneNumber,
                });
              }}
              placeholder="Search employees…"
              emptyMessage="No matching employees"
            />
          </label>
          <label><span>Full name <RequiredMarker /></span>
            <input value={aiderForm.fullName} onChange={(e) => setAiderForm({ ...aiderForm, fullName: e.target.value })} />
          </label>
          <label><span>Phone</span>
            <input value={aiderForm.phoneNumber} onChange={(e) => setAiderForm({ ...aiderForm, phoneNumber: e.target.value })} />
          </label>
        </div>
      ),
    },
    {
      key: 'cert',
      title: 'First-aid certification',
      subtitle: 'OHS Act requires at least 1 trained first aider per 50 staff. Expiry triggers a renewal reminder.',
      body: (
        <div className="form-grid">
          <label><span>Cert level</span>
            <select value={aiderForm.certLevel} onChange={(e) => setAiderForm({ ...aiderForm, certLevel: e.target.value as any })}>
              {FIRST_AID_CERT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label><span>Cert number</span>
            <input value={aiderForm.certNumber} onChange={(e) => setAiderForm({ ...aiderForm, certNumber: e.target.value })} />
          </label>
          <label><span>Issued</span>
            <input type="date" value={aiderForm.certIssuedDate} onChange={(e) => setAiderForm({ ...aiderForm, certIssuedDate: e.target.value })} />
          </label>
          <label><span>Expires</span>
            <input type="date" value={aiderForm.certExpiryDate} onChange={(e) => setAiderForm({ ...aiderForm, certExpiryDate: e.target.value })} />
          </label>
          <label className="full-span"><span>Notes</span>
            <textarea rows={2} value={aiderForm.notes} onChange={(e) => setAiderForm({ ...aiderForm, notes: e.target.value })} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={aiderForm.active} onChange={(e) => setAiderForm({ ...aiderForm, active: e.target.checked })} />
            Active on site
          </label>
        </div>
      ),
    },
  ];

  const todayMs = new Date().getTime();
  const expiringSoonMs = todayMs + 30 * 24 * 60 * 60 * 1000;

  function handleStartEntry() { onResetEntry(); setMode('entryForm'); }
  function handleStartAider() { onResetAider(); setMode('aiderForm'); }
  function handleBack() { onResetEntry(); onResetAider(); setMode('list'); }

  if (mode === 'entryForm') {
    return (
      <>
        <SectionTitle
          backAction={<button className="ghost-button" onClick={handleBack}>← Back to register</button>}
        />
        <FormWizard
          title={entryEditingId ? 'Edit first aid entry' : 'Log first aid incident'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={entryMessage || undefined}
          sections={entrySections}
          onSave={onSaveEntry}
          onCancel={handleBack}
          isEditing={!!entryEditingId}
          saveLabel="Save entry"
        />
      </>
    );
  }

  if (mode === 'aiderForm') {
    return (
      <>
        <SectionTitle
          backAction={<button className="ghost-button" onClick={handleBack}>← Back to register</button>}
        />
        <FormWizard
          title={aiderEditingId ? 'Edit first aider' : 'Add designated first aider'}
          subtitle="OHS Act § 14 requires at least one trained first aider per 50 employees."
          message={aiderMessage || undefined}
          sections={aiderSections}
          onSave={onSaveAider}
          onCancel={handleBack}
          isEditing={!!aiderEditingId}
          saveLabel="Save first aider"
        />
      </>
    );
  }

  return (
    <>
      <SectionTitle
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ghost-button" onClick={handleStartAider}>+ First Aider</button>
            <button className="secondary-button" onClick={handleStartEntry}>Log incident</button>
          </div>
        }
      />

      {/* Designated First Aiders panel */}
      <section className="card">
        <SectionTitle title="Designated first aiders" subtitle={`${aiders.filter((a) => a.active).length} active on site`} />
        {aiders.length === 0 ? (
          <EmptyState title="No first aiders on the register yet" body="Add a trained first aider. The OHS Act requires at least one per 50 staff." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Level</th><th>Cert #</th><th>Expires</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{aiders.map((a) => {
                const expiryMs = a.certExpiryDate ? new Date(a.certExpiryDate).getTime() : 0;
                const expired = expiryMs && expiryMs < todayMs;
                const expiringSoon = expiryMs && !expired && expiryMs < expiringSoonMs;
                return (
                  <tr key={a.id}>
                    <td><strong>{a.fullName}</strong></td>
                    <td>{a.certLevel}</td>
                    <td>{a.certNumber || '—'}</td>
                    <td style={{ color: expired ? '#b22b2b' : expiringSoon ? '#b8860b' : undefined }}>
                      {a.certExpiryDate ? formatDate(a.certExpiryDate) : '—'}
                      {expired ? ' (EXPIRED)' : expiringSoon ? ' (renew soon)' : ''}
                    </td>
                    <td>{a.phoneNumber || '—'}</td>
                    <td><span className={`badge ${a.active ? 'badge-success' : ''}`}>{a.active ? 'Active' : 'Inactive'}</span></td>
                    <td><button className="table-button" onClick={() => onEditAider(a)}>Edit</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Incident register */}
      <section className="card">
        <SectionTitle title="Incident register" subtitle={`${filteredEntries.length} entr${filteredEntries.length === 1 ? 'y' : 'ies'} shown`} />
        <div className="filters-grid">
          <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Employee, location, injury…" /></label>
          <label><span>Month</span>
            <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}>
              <option value="">All months</option>
              {monthOptions.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
            </select>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={filters.iodOnly} onChange={(e) => setFilters({ ...filters, iodOnly: e.target.checked })} />
            IOD only
          </label>
        </div>
        {filteredEntries.length === 0 ? (
          <EmptyState title="No first aid entries yet" body="Log every first-aid event — it's required by the OHS Act and underpins any Compensation Fund / RMA claim." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Entry</th><th>Date</th><th>Person</th><th>Location</th><th>Injury</th><th>Treated by</th><th>IOD</th><th>Actions</th></tr></thead>
              <tbody>{filteredEntries.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.entryNumber}</strong></td>
                  <td>{formatDate(e.incidentDate)}{e.incidentTime ? ` ${e.incidentTime}` : ''}</td>
                  <td>{e.isVisitor ? `${e.visitorName || 'Visitor'}${e.visitorCompany ? ` (${e.visitorCompany})` : ''}` : e.employeeName}</td>
                  <td>{e.location}</td>
                  <td>{e.injuryType}{e.bodyPart ? ` — ${e.bodyPart}` : ''}</td>
                  <td>{e.treatedByName}{e.treatedByCertNumber ? ` (${e.treatedByCertNumber})` : ''}</td>
                  <td>{e.isIod ? <span className="badge badge-danger">IOD {e.iodReportNumber}</span> : '—'}</td>
                  <td><button className="table-button" onClick={() => onEditEntry(e)}>Edit</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
