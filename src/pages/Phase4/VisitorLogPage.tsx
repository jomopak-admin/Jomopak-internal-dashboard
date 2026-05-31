/**
 * Visitor & Contractor Hygiene Control log.
 *
 * One row per visit. Captures host, areas visited, PPE issued, hygiene
 * acknowledgement, and a flag for entry into food-contact areas
 * (auditors check this).
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  ALL_VISITOR_PPE_ITEMS,
  AreaSafety,
  FACTORY_AREAS,
  FactoryArea,
  getAreaSafety,
  VisitorLogEntry,
  VisitorLogFilters,
  VisitorLogFormState,
  VisitorPpeItem,
  VisitorType,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface VisitorLogPageProps {
  records: VisitorLogEntry[];
  filters: VisitorLogFilters;
  setFilters: (v: VisitorLogFilters) => void;
  form: VisitorLogFormState;
  setForm: (v: VisitorLogFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: VisitorLogEntry) => void;
  /** Phase 38 — reception confirms a kiosk check-in and assigns PPE + areas. */
  onVerify?: (id: string, payload: { ppeIssued: string; areasVisited: FactoryArea[] }) => void;
  /** Phase 106 — admin's per-area safety override (from appSettings.visitorAreaPolicy).
   *  When undefined the page uses DEFAULT_AREA_SAFETY. */
  areaPolicy?: Partial<Record<FactoryArea, AreaSafety>>;
}

const DAY_MS = 1000 * 60 * 60 * 24;
const VISITOR_TYPES: VisitorType[] = ['Customer', 'Supplier', 'Contractor', 'Auditor', 'Maintenance', 'Pest Control', 'Other'];

export function VisitorLogPage({ records, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onVerify, areaPolicy }: VisitorLogPageProps) {
  // Phase 106.1 — partition the area list into Safe (one-click) vs
  // Restricted (needs host approval). The split is driven by the admin's
  // per-area policy override, falling back to DEFAULT_AREA_SAFETY.
  const safeAreas = FACTORY_AREAS.filter((a) => getAreaSafety(a, areaPolicy) === 'safe');
  const restrictedAreas = FACTORY_AREAS.filter((a) => getAreaSafety(a, areaPolicy) === 'restricted');
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [verifyDrafts, setVerifyDrafts] = useState<Record<string, { ppeIssued: string; areasVisited: FactoryArea[] }>>({});

  const pendingRecords = useMemo(
    () => records.filter((r) => r.kioskCheckin && !r.staffVerified).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [records],
  );
  function draftFor(r: VisitorLogEntry) {
    return verifyDrafts[r.id] ?? { ppeIssued: r.ppeIssued || '', areasVisited: r.areasVisited || [] };
  }
  function setDraft(id: string, patch: Partial<{ ppeIssued: string; areasVisited: FactoryArea[] }>) {
    setVerifyDrafts((s) => ({ ...s, [id]: { ...(s[id] ?? { ppeIssued: '', areasVisited: [] }), ...patch } }));
  }
  function toggleVerifyArea(r: VisitorLogEntry, a: FactoryArea) {
    const cur = draftFor(r).areasVisited;
    setDraft(r.id, { areasVisited: cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a] });
  }
  function confirmVerify(r: VisitorLogEntry) {
    if (!onVerify) return;
    const d = draftFor(r);
    onVerify(r.id, d);
    setVerifyDrafts((s) => { const next = { ...s }; delete next[r.id]; return next; });
  }

  const filtered = useMemo(() => records.filter((r) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [r.visitorName, r.company, r.hostName, r.purpose].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.visitorType && r.visitorType !== filters.visitorType) return false;
    if (filters.dateWindow !== 'all') {
      const t = new Date(r.visitDate).getTime();
      const age = Date.now() - t;
      if (filters.dateWindow === 'today' && new Date(r.visitDate).toDateString() !== new Date().toDateString()) return false;
      if (filters.dateWindow === '7d' && age > 7 * DAY_MS) return false;
      if (filters.dateWindow === '30d' && age > 30 * DAY_MS) return false;
    }
    return true;
  }), [records, filters]);

  const stats = useMemo(() => {
    const today = records.filter((r) => new Date(r.visitDate).toDateString() === new Date().toDateString()).length;
    const food = records.filter((r) => r.enteredFoodContactArea).length;
    const ackMissing = records.filter((r) => !r.hygieneAcknowledged).length;
    return { total: records.length, today, food, ackMissing };
  }, [records]);

  function toggleArea(a: FactoryArea) {
    const next = form.areasVisited.includes(a) ? form.areasVisited.filter((x) => x !== a) : [...form.areasVisited, a];
    setForm({ ...form, areasVisited: next });
  }

  const sections: FormWizardSection[] = [
    {
      key: 'visitor', title: 'Visitor',
      missingRequired: [
        ...(form.visitDate ? [] : ['Visit date']),
        ...(form.visitorName.trim() ? [] : ['Visitor name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Visit date <RequiredMarker /></span><input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} /></label>
          <label><span>Visitor type</span>
            <select value={form.visitorType} onChange={(e) => setForm({ ...form, visitorType: e.target.value as VisitorType })}>
              {VISITOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label><span>Visitor name <RequiredMarker /></span><input value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} /></label>
          <label><span>Company</span><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          <label><span>Host (Jomopak)</span><input value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} /></label>
          <label className="full-span"><span>Purpose</span><input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></label>
          <label><span>Time in</span><input type="time" value={form.timeIn} onChange={(e) => setForm({ ...form, timeIn: e.target.value })} /></label>
          <label><span>Time out</span><input type="time" value={form.timeOut} onChange={(e) => setForm({ ...form, timeOut: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'hygiene', title: 'Hygiene & areas',
      body: (
        <div className="form-grid">
          <label className="checkbox-row full-span"><input type="checkbox" checked={form.hygieneAcknowledged} onChange={(e) => setForm({ ...form, hygieneAcknowledged: e.target.checked })} />Hygiene protocol acknowledged</label>
          <label className="checkbox-row full-span"><input type="checkbox" checked={form.enteredFoodContactArea} onChange={(e) => setForm({ ...form, enteredFoodContactArea: e.target.checked })} />Entered food-contact area</label>
          {/* Phase 105 — PPE multi-select. Tick everything that was handed
              to the visitor at check-in. Keeps audit data clean and lets
              us count PPE consumption per item. The flat ppeIssued string
              is also kept in sync (joined with ", ") for legacy reports. */}
          <div className="full-span">
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', display: 'block', marginBottom: 8 }}>PPE issued</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_VISITOR_PPE_ITEMS.map((item) => {
                const active = (form.ppeIssuedItems ?? []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      const current = form.ppeIssuedItems ?? [];
                      const next: VisitorPpeItem[] = active ? current.filter((p) => p !== item) : [...current, item];
                      setForm({ ...form, ppeIssuedItems: next, ppeIssued: next.join(', ') });
                    }}
                    className={`chem-pictogram-pill${active ? ' chem-pictogram-pill-on' : ''}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="full-span">
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', display: 'block', marginBottom: 8 }}>Areas visited</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FACTORY_AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleArea(a)}
                  className={`chem-pictogram-pill${form.areasVisited.includes(a) ? ' chem-pictogram-pill-on' : ''}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list' ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>Log visitor</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>← Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit visitor entry' : 'New visitor entry'}
          subtitle="Every external visitor signing in. Required for audits."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save entry"
        />
      ) : (
        <>
        {pendingRecords.length > 0 && onVerify ? (
          <section className="card" style={{ borderLeft: '4px solid var(--jp-orange)' }}>
            <SectionTitle
              title={`Visitors waiting to be confirmed (${pendingRecords.length})`}
              subtitle="These visitors signed themselves in at reception. Confirm the details and assign PPE before they head onto the floor."
            />
            <div className="page-stack">
              {pendingRecords.map((r) => {
                const d = draftFor(r);
                return (
                  <div key={r.id} className="card" style={{ background: 'rgba(255,140,60,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '1.05rem' }}>{r.visitorName}</strong>
                        <div className="muted" style={{ fontSize: '0.82rem' }}>
                          {r.company || r.visitorType} · seeing <strong>{r.hostName || '—'}</strong> · {r.purpose || 'No purpose given'}
                        </div>
                        <div className="muted" style={{ fontSize: '0.76rem', marginTop: 2 }}>
                          Signed in {r.timeIn || '—'}
                          {r.phoneNumber ? ` · ☎ ${r.phoneNumber}` : ''}
                          {r.vehicleRegistration ? ` · 🚚 ${r.vehicleRegistration}` : ''}
                          {r.enteredFoodContactArea ? ' · ⚠ Food-contact area' : ''}
                          {!r.hygieneAcknowledged ? ' · ⚠ No hygiene ack' : ''}
                        </div>
                      </div>
                      <span className="badge badge-warning">Pending</span>
                    </div>
                    <div className="form-grid" style={{ marginTop: '0.6rem' }}>
                      {/* Phase 105 — PPE multi-select on the verify panel.
                          Same widget as the main form so reception always
                          ticks from a controlled list, not free-text. */}
                      <div className="full-span">
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>PPE issued</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {ALL_VISITOR_PPE_ITEMS.map((item) => {
                            const picked = (d.ppeIssued || '').split(/\s*,\s*/).filter(Boolean);
                            const on = picked.includes(item);
                            return (
                              <label key={item} className={`kiosk-chip ${on ? 'is-active' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => {
                                    const next = on ? picked.filter((p) => p !== item) : [...picked, item];
                                    setDraft(r.id, { ppeIssued: next.join(', ') });
                                  }}
                                />
                                {item}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      {/* Phase 106.1 — Areas are split into Safe (reception
                          can approve on its own) and Restricted (needs host
                          approval before the visitor leaves reception).
                          Phase 106.2 will fire an approval request when a
                          restricted area is ticked; for now reception can
                          still tick them so the data model + UI ship first. */}
                      <div className="full-span">
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
                          Safe areas <span className="muted" style={{ fontWeight: 400, fontSize: '0.75rem' }}>· reception can approve</span>
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                          {safeAreas.map((a) => (
                            <label key={a} className={`kiosk-chip ${d.areasVisited.includes(a) ? 'is-active' : ''}`}>
                              <input type="checkbox" checked={d.areasVisited.includes(a)} onChange={() => toggleVerifyArea(r, a)} />
                              <span>{a}</span>
                            </label>
                          ))}
                        </div>

                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--alert, #b22b2b)' }}>
                          Restricted areas <span className="muted" style={{ fontWeight: 400, fontSize: '0.75rem' }}>· needs host approval</span>
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {restrictedAreas.map((a) => (
                            <label
                              key={a}
                              className={`kiosk-chip ${d.areasVisited.includes(a) ? 'is-active' : ''}`}
                              style={{
                                borderColor: d.areasVisited.includes(a) ? 'var(--alert, #b22b2b)' : undefined,
                                borderStyle: 'dashed',
                              }}
                              title="Restricted area — host must approve before visitor enters"
                            >
                              <input type="checkbox" checked={d.areasVisited.includes(a)} onChange={() => toggleVerifyArea(r, a)} />
                              <span>{a}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="accounting-actions" style={{ gap: '0.6rem', marginTop: '0.6rem' }}>
                      <button className="ghost-button" type="button" onClick={() => { onEdit(r); setMode('form'); }}>Edit full record</button>
                      <button className="primary-button" type="button" onClick={() => confirmVerify(r)}>Confirm &amp; let host know</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
        <section className="card">
          <SectionTitle title="Visitor & Contractor Log" subtitle={`${filtered.length} of ${records.length} entry(ies) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Today</span><strong>{stats.today}</strong></div>
            <div className="food-safety-stat"><span>Entered food-contact area</span><strong>{stats.food}</strong></div>
            <div className={`food-safety-stat${stats.ackMissing > 0 ? ' food-safety-stat-alert' : ''}`}><span>Missing hygiene ack</span><strong>{stats.ackMissing}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, company, host" /></label>
            <label><span>Type</span>
              <select value={filters.visitorType} onChange={(e) => setFilters({ ...filters, visitorType: e.target.value })}>
                <option value="">All</option>
                {VISITOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Window</span>
              <select value={filters.dateWindow} onChange={(e) => setFilters({ ...filters, dateWindow: e.target.value as VisitorLogFilters['dateWindow'] })}>
                <option value="today">Today</option><option value="7d">7 days</option><option value="30d">30 days</option><option value="all">All</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No visitor entries" body="Log every external visitor entering the factory — auditors, contractors, customers, suppliers." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Date</th><th>Visitor</th><th>Type</th><th>Host</th><th>Time</th><th>Food area</th><th>Ack</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.visitNumber}</strong></td>
                      <td>{formatDate(r.visitDate)}</td>
                      <td>{r.visitorName}<div className="table-subtext">{r.company}</div></td>
                      <td>{r.visitorType}</td>
                      <td>{r.hostName || '—'}</td>
                      <td>{r.timeIn || '—'} – {r.timeOut || '—'}</td>
                      <td>{r.enteredFoodContactArea ? <span className="badge badge-warning">Yes</span> : <span className="muted">No</span>}</td>
                      <td>{r.hygieneAcknowledged ? <span className="badge badge-success">Signed</span> : <span className="badge badge-danger">Missing</span>}</td>
                      <td><button className="table-button" onClick={() => { onEdit(r); setMode('form'); }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
      )}
    </>
  );
}
