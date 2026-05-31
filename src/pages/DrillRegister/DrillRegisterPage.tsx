/**
 * Phase 95.2 — Fire / Evacuation Drill Register.
 *
 * SMETA-mandatory log of every emergency drill — fire, evacuation, bomb
 * threat, chemical spill, etc. Captures who facilitated, time to evacuate,
 * headcount at the muster point, lessons learned. The signed-off record
 * is what an auditor reviews.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import { DrillEntry, DrillFormState, DrillOutcome, DrillType } from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

const DRILL_TYPES: DrillType[] = ['Fire', 'Evacuation', 'Bomb threat', 'Chemical spill', 'Other'];
const OUTCOMES: DrillOutcome[] = ['Successful', 'Concerns', 'Failed'];

interface Props {
  entries: DrillEntry[];
  form: DrillFormState;
  setForm: (next: DrillFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (entry: DrillEntry) => void;
  onDelete: () => void;
}

export function DrillRegisterPage(props: Props) {
  const { entries, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete } = props;
  const [search, setSearch] = useState('');

  function patch(p: Partial<DrillFormState>) { setForm({ ...form, ...p }); }

  const filtered = useMemo(() => entries.filter((e) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return `${e.drillNumber} ${e.scenario} ${e.fireMarshalName} ${e.drillType}`.toLowerCase().includes(t);
  }), [entries, search]);

  // Last-drill recency — auditors care about cadence (one drill per 6 months minimum in SA).
  const lastDrillDate = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.drillDate.localeCompare(a.drillDate));
    return sorted[0]?.drillDate ?? '';
  }, [entries]);
  const daysSinceLast = lastDrillDate
    ? Math.floor((Date.now() - new Date(lastDrillDate).getTime()) / 86400000)
    : null;

  const sections: FormWizardSection[] = [
    {
      key: 'when',
      title: 'Drill details',
      missingRequired: [...(form.drillDate ? [] : ['Date']), ...(form.scenario.trim() ? [] : ['Scenario'])],
      body: (
        <div className="form-grid">
          <label><span>Drill # {form.drillNumber ? '' : '(auto)'}</span><input value={form.drillNumber} onChange={(e) => patch({ drillNumber: e.target.value })} placeholder="DRL-202605-001" /></label>
          <label><span>Date *</span><input type="date" value={form.drillDate} onChange={(e) => patch({ drillDate: e.target.value })} /></label>
          <label><span>Type</span><select value={form.drillType} onChange={(e) => patch({ drillType: e.target.value as DrillType })}>{DRILL_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="full-span"><span>Scenario *</span><textarea rows={2} value={form.scenario} onChange={(e) => patch({ scenario: e.target.value })} placeholder='"Fire in flexo press — workers evacuate via south exit to car park muster."' /></label>
        </div>
      ),
    },
    {
      key: 'times',
      title: 'Times & headcount',
      body: (
        <div className="form-grid">
          <label><span>Alarm raised at</span><input type="time" value={form.alarmRaisedTime} onChange={(e) => patch({ alarmRaisedTime: e.target.value })} /></label>
          <label><span>Evacuation complete at</span><input type="time" value={form.evacuationCompleteTime} onChange={(e) => patch({ evacuationCompleteTime: e.target.value })} /></label>
          <label><span>Headcount expected</span><input type="number" min="0" value={form.headcountExpected} onChange={(e) => patch({ headcountExpected: e.target.value })} /></label>
          <label><span>Headcount at muster</span><input type="number" min="0" value={form.headcountAtMuster} onChange={(e) => patch({ headcountAtMuster: e.target.value })} /></label>
          <label className="full-span"><span>Missing persons (and reason)</span><input value={form.missingPersons} onChange={(e) => patch({ missingPersons: e.target.value })} placeholder="Sipho M. — booked off sick today" /></label>
        </div>
      ),
    },
    {
      key: 'outcome',
      title: 'Outcome & lessons',
      body: (
        <div className="form-grid">
          <label><span>Outcome</span><select value={form.outcome} onChange={(e) => patch({ outcome: e.target.value as DrillOutcome })}>{OUTCOMES.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label><span>Fire Marshal</span><input value={form.fireMarshalName} onChange={(e) => patch({ fireMarshalName: e.target.value })} /></label>
          <label className="full-span"><span>Observations</span><textarea rows={2} value={form.observations} onChange={(e) => patch({ observations: e.target.value })} /></label>
          <label className="full-span"><span>Lessons learned</span><textarea rows={3} value={form.lessonsLearned} onChange={(e) => patch({ lessonsLearned: e.target.value })} placeholder="What we'll fix before the next drill." /></label>
          <div className="full-span">
            <span style={{ fontWeight: 500, fontSize: 13 }}>Fire Marshal signature</span>
            <SignaturePad onChange={(url) => patch({ fireMarshalSignatureUrl: url })} />
          </div>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} /></label>
          <div className="full-span">
            <PhotoUploader label="Photos (muster point, assembly)" urls={form.photoUrls || []} onChange={(photoUrls) => patch({ photoUrls })} recordType="drill" recordId={editingId || 'new'} />
          </div>
        </div>
      ),
    },
  ];

  const sixMonths = daysSinceLast !== null && daysSinceLast > 180;

  return (
    <>
      <SectionTitle
        title="Fire / Evacuation Drill Register"
        subtitle="Log every emergency drill. SA OHS Act requires at least one fire drill per 6 months."
      />
      <section className="card">
        <div className="summary-strip" style={{ marginBottom: 12 }}>
          <div className="summary-chip"><span>Drills logged</span><strong>{entries.length}</strong></div>
          <div className="summary-chip"><span>Last drill</span><strong>{lastDrillDate ? formatDate(lastDrillDate) : '—'}</strong></div>
          <div className="summary-chip"><span>Days since</span><strong style={{ color: sixMonths ? '#b22b2b' : undefined }}>{daysSinceLast ?? '—'}</strong></div>
        </div>
        {sixMonths ? (
          <div className="message-strip" style={{ background: '#fbe9e9', color: '#7a1a1a' }}>
            Over 6 months since last drill. OHS Act requires at least one per 6 months — schedule one now.
          </div>
        ) : null}

        <FormWizard
          title={editingId ? 'Edit drill' : 'Log drill'}
          subtitle="Time-to-evacuate and muster headcount are the key auditable numbers."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={onReset}
          saveLabel={editingId ? 'Save changes' : 'Log drill'}
          isEditing={!!editingId}
          footerExtra={editingId ? <button type="button" className="ghost-button" onClick={onDelete}>Delete entry</button> : null}
        />

        <SectionTitle title="Register" subtitle={`${entries.length} drills on file`} />
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No drills logged" body="Log your first drill above." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>#</th><th>Date</th><th>Type</th><th>Time to evacuate</th><th>Muster</th><th>Outcome</th><th>Fire Marshal</th><th /></tr></thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.drillNumber}</strong></td>
                    <td>{formatDate(e.drillDate)}</td>
                    <td>{e.drillType}</td>
                    <td>{e.totalMinutes ? `${formatNumber(e.totalMinutes, 1)} min` : '—'}</td>
                    <td>{e.headcountAtMuster}/{e.headcountExpected}</td>
                    <td style={{ color: e.outcome === 'Failed' ? '#b22b2b' : e.outcome === 'Concerns' ? '#b8860b' : '#2e6f3e' }}>{e.outcome}</td>
                    <td>{e.fireMarshalName}</td>
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
