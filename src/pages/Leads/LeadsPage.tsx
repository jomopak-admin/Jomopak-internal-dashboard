/**
 * Leads — CRM workspace.
 *
 * Designed to feel like a working sales tool, not a register. Three zones:
 *
 *   1. Quick Add strip at the top — pinned, always visible, 4 inputs
 *      (name, phone/email, source, what they want). Submits instantly.
 *      Use when answering a WhatsApp / phone enquiry — capture in 10s.
 *
 *   2. Stat tiles + filter row — total / due today / overdue / won this
 *      month. Clicking a tile filters the list.
 *
 *   3. List of leads with the next-follow-up date called out, overdue
 *      flagged red. Click a row to open the full editor below (flat
 *      single-card form, not a wizard) which includes the activity
 *      timeline so every touchpoint is logged in one place.
 */

import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  LEAD_ACTIVITY_TYPES,
  LEAD_SOURCES,
  LOST_REASONS,
  Lead,
  LeadActivity,
  LeadActivityType,
  LeadFilters,
  LeadFormState,
  LeadSource,
  LeadStatus,
  LostReason,
  Product,
  QuoteEstimate,
} from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface LeadsPageProps {
  monthOptions: string[];
  clients: Client[];
  products: Product[];
  quotes: QuoteEstimate[];
  leadForm: LeadFormState;
  setLeadForm: (value: LeadFormState) => void;
  leadEditingId: string | null;
  leadMessage: string;
  onSave: () => void;
  onReset: () => void;
  leadFilters: LeadFilters;
  setLeadFilters: (value: LeadFilters) => void;
  filteredLeads: Lead[];
  onEdit: (lead: Lead) => void;
  /** Optional — when provided, the Quick Add strip is shown. */
  onQuickAdd?: (capture: QuickAddCapture) => void;
  /** Optional — when provided, bulk-select + re-assign is available. */
  onBulkReassign?: (leadIds: string[], newOwner: string) => void;
}

export interface QuickAddCapture {
  contactName: string;
  phone: string;
  email: string;
  source: LeadSource;
  productHint: string;
  requestedQuantity: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdueFollowUp(lead: Lead): boolean {
  if (!lead.nextFollowUpDate || lead.status === 'Won' || lead.status === 'Lost') return false;
  return lead.nextFollowUpDate < todayISO();
}

function isDueToday(lead: Lead): boolean {
  if (!lead.nextFollowUpDate || lead.status === 'Won' || lead.status === 'Lost') return false;
  return lead.nextFollowUpDate === todayISO();
}

function inFilter(lead: Lead, follow: NonNullable<LeadFilters['followUp']>): boolean {
  if (follow === 'all') return true;
  if (follow === 'unscheduled') return !lead.nextFollowUpDate;
  if (follow === 'overdue') return isOverdueFollowUp(lead);
  if (follow === 'due-today') return isDueToday(lead);
  if (follow === 'this-week') {
    if (!lead.nextFollowUpDate) return false;
    const t = new Date(lead.nextFollowUpDate).getTime();
    if (Number.isNaN(t)) return false;
    return t - Date.now() < 7 * DAY_MS && t > Date.now() - DAY_MS;
  }
  return true;
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  'New': 'badge',
  'Qualified': 'badge badge-success',
  'Awaiting Info': 'badge badge-warning',
  'Quoted': 'badge badge-warning',
  'Won': 'badge badge-success',
  'Lost': 'badge badge-danger',
};

export function LeadsPage(props: LeadsPageProps) {
  const {
    monthOptions, clients, products, quotes,
    leadForm, setLeadForm, leadEditingId, leadMessage,
    onSave, onReset, leadFilters, setLeadFilters,
    filteredLeads, onEdit, onQuickAdd, onBulkReassign,
  } = props;

  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [quickAdd, setQuickAdd] = useState<QuickAddCapture>({
    contactName: '', phone: '', email: '', source: 'WhatsApp', productHint: '', requestedQuantity: '',
  });
  /** Set of selected lead ids for bulk actions. */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reassignTarget, setReassignTarget] = useState('');

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids));
  }
  function clearSelection() {
    setSelectedIds(new Set());
    setReassignTarget('');
  }
  function performReassign() {
    if (!onBulkReassign || selectedIds.size === 0 || !reassignTarget.trim()) return;
    onBulkReassign(Array.from(selectedIds), reassignTarget.trim());
    clearSelection();
  }

  useEffect(() => {
    if (leadEditingId) setMode('form');
  }, [leadEditingId]);

  const stats = useMemo(() => {
    const today = todayISO();
    const monthStart = today.slice(0, 7);
    const dueToday = filteredLeads.filter(isDueToday).length;
    const overdue = filteredLeads.filter(isOverdueFollowUp).length;
    const newThisWeek = filteredLeads.filter((l) => {
      const t = new Date(l.enquiryDate).getTime();
      return !Number.isNaN(t) && Date.now() - t < 7 * DAY_MS;
    }).length;
    const wonThisMonth = filteredLeads.filter((l) => l.status === 'Won' && (l.enquiryDate || '').slice(0, 7) === monthStart).length;
    const open = filteredLeads.filter((l) => l.status !== 'Won' && l.status !== 'Lost').length;
    return { total: filteredLeads.length, open, newThisWeek, dueToday, overdue, wonThisMonth };
  }, [filteredLeads]);

  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name, sublabel: c.phoneNumber || c.contactEmail || c.contactName })),
    [clients],
  );
  const productOptions: ComboboxOption[] = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name, sublabel: p.category })),
    [products],
  );
  const quoteOptions: ComboboxOption[] = useMemo(
    () => quotes.map((q) => ({ value: q.id, label: q.quoteNumber, sublabel: q.clientName })),
    [quotes],
  );

  function startCreate() { onReset(); setMode('form'); }
  function startEdit(lead: Lead) { onEdit(lead); setMode('form'); }
  function back() { onReset(); setMode('list'); }

  function submitQuickAdd() {
    if (!quickAdd.contactName.trim() && !quickAdd.phone.trim()) return;
    onQuickAdd?.(quickAdd);
    setQuickAdd({ contactName: '', phone: '', email: '', source: quickAdd.source, productHint: '', requestedQuantity: '' });
  }

  // Activity timeline helpers
  function addActivity(type: LeadActivityType, summary: string) {
    const next: LeadActivity = {
      id: `act-${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      type,
      byName: leadForm.assignedTo || '',
      summary,
    };
    setLeadForm({ ...leadForm, activities: [next, ...(leadForm.activities ?? [])] });
  }
  function removeActivity(id: string) {
    setLeadForm({ ...leadForm, activities: (leadForm.activities ?? []).filter((a) => a.id !== id) });
  }

  if (mode === 'form') {
    return (
      <>
        <SectionTitle backAction={<button className="ghost-button" onClick={back}>← Back to leads</button>} />
        <section className="card">
          <SectionTitle
            title={leadEditingId ? `Edit lead` : 'New lead'}
            subtitle={leadEditingId ? 'Update status, log a touchpoint, schedule next follow-up.' : 'Capture the basics, save, log activity as it happens.'}
          />
          {leadMessage ? <div className="message-strip">{leadMessage}</div> : null}

          {/* ===== Identity ===== */}
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '20px 0 8px' }}>Contact</h3>
          <div className="form-grid">
            <label><span>Enquiry date</span><input type="date" value={leadForm.enquiryDate} onChange={(e) => setLeadForm({ ...leadForm, enquiryDate: e.target.value })} /></label>
            <label><span>Source</span>
              <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value as LeadSource })}>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label><span>Linked client (if existing)</span>
              <Combobox options={clientOptions} value={leadForm.clientId} onChange={(v) => setLeadForm({ ...leadForm, clientId: v })} placeholder="Search clients…" emptyMessage="No matching clients" />
            </label>
            <label><span>Company / brand</span><input value={leadForm.companyName} onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })} /></label>
            <label><span>Contact name</span><input value={leadForm.contactName} onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })} placeholder="Who's calling / messaging" /></label>
            <label><span>Phone</span><input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="+27..." /></label>
            <label><span>Email</span><input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} /></label>
            <label><span>Assigned to</span><input value={leadForm.assignedTo} onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })} placeholder="Salesperson on this lead" /></label>
          </div>

          {/* ===== Opportunity ===== */}
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '20px 0 8px' }}>What they want</h3>
          <div className="form-grid">
            <label><span>Product / interest</span>
              <Combobox options={productOptions} value={leadForm.productId} onChange={(v) => setLeadForm({ ...leadForm, productId: v })} placeholder="Search products…" emptyMessage="No matching products" />
            </label>
            <label><span>Requested quantity</span><input type="number" min="0" value={leadForm.requestedQuantity} onChange={(e) => setLeadForm({ ...leadForm, requestedQuantity: e.target.value })} /></label>
            <label><span>Due / target date</span><input type="date" value={leadForm.dueDate} onChange={(e) => setLeadForm({ ...leadForm, dueDate: e.target.value })} /></label>
            <label><span>Estimated value (R)</span><input type="number" min="0" step="0.01" value={leadForm.estimatedValue} onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })} placeholder="Forecast revenue" /></label>
          </div>

          {/* ===== Status + Follow-up ===== */}
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '20px 0 8px' }}>Status & follow-up</h3>
          <div className="form-grid">
            <label><span>Status</span>
              <select value={leadForm.status} onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as LeadStatus })}>
                <option>New</option><option>Qualified</option><option>Awaiting Info</option><option>Quoted</option><option>Won</option><option>Lost</option>
              </select>
            </label>
            <label><span>Next follow-up</span><input type="date" value={leadForm.nextFollowUpDate} onChange={(e) => setLeadForm({ ...leadForm, nextFollowUpDate: e.target.value })} placeholder="When to chase next" /></label>
            <label><span>Linked quote</span>
              <Combobox options={quoteOptions} value={leadForm.linkedQuoteId} onChange={(v) => setLeadForm({ ...leadForm, linkedQuoteId: v })} placeholder="Quote # if sent" emptyMessage="No quotes yet" />
            </label>
            <label><span>QuickBooks Estimate #</span><input value={leadForm.quickbooksEstimateNumber} onChange={(e) => setLeadForm({ ...leadForm, quickbooksEstimateNumber: e.target.value })} /></label>
            {leadForm.status === 'Lost' ? (
              <label className="full-span"><span>Lost reason</span>
                <select value={leadForm.lostReason} onChange={(e) => setLeadForm({ ...leadForm, lostReason: e.target.value as LostReason | '' })}>
                  <option value="">— Pick a reason —</option>
                  {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            ) : null}
            <label className="full-span"><span>Notes / specs</span><textarea rows={3} value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} placeholder="Bag size, GSM, print, special requirements" /></label>
          </div>

          {/* ===== Activity timeline ===== */}
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '20px 0 8px' }}>Activity timeline</h3>
          <LeadActivityComposer onAdd={addActivity} />
          {(leadForm.activities ?? []).length === 0 ? (
            <p className="muted">No activities yet. Add a touchpoint above whenever you contact this lead.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {(leadForm.activities ?? []).map((a) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, alignItems: 'start', padding: '8px 12px', background: 'var(--jp-paper, #fff)', border: '1px solid var(--jp-line)', borderRadius: 8 }}>
                  <div>
                    <strong style={{ fontSize: 12 }}>{a.type}</strong>
                    <div className="table-subtext">{formatDate(a.at.slice(0, 10))}{a.byName ? ` · ${a.byName}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 13 }}>{a.summary}</div>
                  <button className="ghost-button" onClick={() => removeActivity(a.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          <div className="button-row" style={{ marginTop: 20 }}>
            <button className="primary-button" onClick={onSave}>Save lead</button>
            <button className="ghost-button" onClick={back}>Cancel</button>
          </div>
        </section>
      </>
    );
  }

  // ===== List mode =====
  return (
    <>
      <SectionTitle action={<button className="secondary-button" onClick={startCreate}>+ New lead (full form)</button>} />

      {onQuickAdd ? (
        <section className="card" style={{ background: 'rgba(219, 90, 31, 0.04)', borderColor: 'rgba(219, 90, 31, 0.18)' }}>
          <SectionTitle title="Quick capture" subtitle="Answering a call or WhatsApp? Tap name + phone + source and Save. Details can be added later." />
          <div className="form-grid">
            <label><span>Name</span><input value={quickAdd.contactName} onChange={(e) => setQuickAdd({ ...quickAdd, contactName: e.target.value })} placeholder="Who's contacting us" /></label>
            <label><span>Phone</span><input value={quickAdd.phone} onChange={(e) => setQuickAdd({ ...quickAdd, phone: e.target.value })} placeholder="+27..." /></label>
            <label><span>Email</span><input type="email" value={quickAdd.email} onChange={(e) => setQuickAdd({ ...quickAdd, email: e.target.value })} /></label>
            <label><span>Source</span>
              <select value={quickAdd.source} onChange={(e) => setQuickAdd({ ...quickAdd, source: e.target.value as LeadSource })}>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label><span>What they want</span><input value={quickAdd.productHint} onChange={(e) => setQuickAdd({ ...quickAdd, productHint: e.target.value })} placeholder="Brown bag, 5000 units, with logo..." /></label>
            <label><span>Qty</span><input type="number" value={quickAdd.requestedQuantity} onChange={(e) => setQuickAdd({ ...quickAdd, requestedQuantity: e.target.value })} /></label>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="primary-button" onClick={submitQuickAdd} disabled={!quickAdd.contactName.trim() && !quickAdd.phone.trim()}>Save lead</button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="card">
        <SectionTitle title="Lead pipeline" subtitle={`${filteredLeads.length} lead(s) shown`} />
        <div className="food-safety-stats">
          <button type="button" className="food-safety-stat" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => setLeadFilters({ ...leadFilters, status: '', followUp: 'all' })}>
            <span>Open leads</span><strong>{stats.open}</strong>
          </button>
          <button type="button" className={`food-safety-stat${stats.dueToday > 0 ? ' food-safety-stat-alert' : ''}`} style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => setLeadFilters({ ...leadFilters, followUp: 'due-today' })}>
            <span>Due today</span><strong>{stats.dueToday}</strong>
          </button>
          <button type="button" className={`food-safety-stat${stats.overdue > 0 ? ' food-safety-stat-alert' : ''}`} style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => setLeadFilters({ ...leadFilters, followUp: 'overdue' })}>
            <span>Overdue</span><strong>{stats.overdue}</strong>
          </button>
          <button type="button" className="food-safety-stat" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => setLeadFilters({ ...leadFilters, followUp: 'all' })}>
            <span>New (7 days)</span><strong>{stats.newThisWeek}</strong>
          </button>
          <button type="button" className="food-safety-stat" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => setLeadFilters({ ...leadFilters, status: 'Won' })}>
            <span>Won this month</span><strong>{stats.wonThisMonth}</strong>
          </button>
        </div>
        <div className="filters-grid">
          <label><span>Search</span><input value={leadFilters.search} onChange={(e) => setLeadFilters({ ...leadFilters, search: e.target.value })} placeholder="Name, phone, company" /></label>
          <label><span>Status</span>
            <select value={leadFilters.status} onChange={(e) => setLeadFilters({ ...leadFilters, status: e.target.value })}>
              <option value="">All</option>
              <option>New</option><option>Qualified</option><option>Awaiting Info</option><option>Quoted</option><option>Won</option><option>Lost</option>
            </select>
          </label>
          <label><span>Source</span>
            <select value={leadFilters.source} onChange={(e) => setLeadFilters({ ...leadFilters, source: e.target.value })}>
              <option value="">All</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label><span>Follow-up</span>
            <select value={leadFilters.followUp ?? 'all'} onChange={(e) => setLeadFilters({ ...leadFilters, followUp: e.target.value as NonNullable<LeadFilters['followUp']> })}>
              <option value="all">All</option>
              <option value="due-today">Due today</option>
              <option value="overdue">Overdue</option>
              <option value="this-week">This week</option>
              <option value="unscheduled">Unscheduled</option>
            </select>
          </label>
          <label><span>Month</span>
            <select value={leadFilters.month} onChange={(e) => setLeadFilters({ ...leadFilters, month: e.target.value })}>
              <option value="">All months</option>
              {monthOptions.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
            </select>
          </label>
          <label><span>Owner</span><input value={leadFilters.owner} onChange={(e) => setLeadFilters({ ...leadFilters, owner: e.target.value })} placeholder="Salesperson name" /></label>
        </div>

        {filteredLeads.length === 0 ? (
          <EmptyState title="No leads match" body="Use Quick capture above to log an incoming enquiry, or click + New lead to start the full form." />
        ) : (
          <>
            {onBulkReassign && selectedIds.size > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(219, 90, 31, 0.08)', border: '1px solid rgba(219, 90, 31, 0.4)', borderRadius: 8, marginBottom: 12 }}>
                <strong>{selectedIds.size} lead(s) selected</strong>
                <input
                  value={reassignTarget}
                  onChange={(e) => setReassignTarget(e.target.value)}
                  placeholder="Re-assign to (salesperson name / email)"
                  style={{ flex: 1, maxWidth: 320 }}
                />
                <button className="primary-button" onClick={performReassign} disabled={!reassignTarget.trim()}>Re-assign</button>
                <button className="ghost-button" onClick={clearSelection}>Cancel</button>
              </div>
            ) : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {onBulkReassign ? (
                    <th style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredLeads.length}
                        onChange={(e) => e.target.checked ? selectAll(filteredLeads.map((l) => l.id)) : clearSelection()}
                        aria-label="Select all leads"
                      />
                    </th>
                  ) : null}
                  <th>Lead #</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Next follow-up</th>
                  <th>Activities</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads
                  .filter((l) => inFilter(l, leadFilters.followUp ?? 'all'))
                  .map((l) => {
                    const overdue = isOverdueFollowUp(l);
                    const dueToday = isDueToday(l);
                    return (
                      <tr key={l.id}>
                        {onBulkReassign ? (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(l.id)}
                              onChange={() => toggleSelected(l.id)}
                              aria-label={`Select ${l.leadNumber}`}
                            />
                          </td>
                        ) : null}
                        <td><strong>{l.leadNumber}</strong><div className="table-subtext">{formatDate(l.enquiryDate)}</div></td>
                        <td>
                          <strong>{l.contactName || l.companyName || '—'}</strong>
                          {l.phone ? <div className="table-subtext">{l.phone}</div> : null}
                          {l.email ? <div className="table-subtext">{l.email}</div> : null}
                          {l.companyName && l.contactName ? <div className="table-subtext">{l.companyName}</div> : null}
                        </td>
                        <td><span className="badge">{l.source}</span></td>
                        <td>{l.productName || '—'}</td>
                        <td>{l.requestedQuantity ? formatNumber(l.requestedQuantity) : '—'}</td>
                        <td><span className={STATUS_BADGE[l.status]}>{l.status}</span>{l.status === 'Lost' && l.lostReason ? <div className="table-subtext">{l.lostReason}</div> : null}</td>
                        <td className={overdue ? 'cell-alert' : undefined}>
                          {l.nextFollowUpDate ? formatDate(l.nextFollowUpDate) : <span className="muted">Not set</span>}
                          {overdue ? <div className="table-subtext" style={{ color: '#b22b2b' }}>Overdue</div> : dueToday ? <div className="table-subtext">Today</div> : null}
                        </td>
                        <td>{(l.activities ?? []).length}</td>
                        <td>{l.assignedTo || <span className="muted">—</span>}</td>
                        <td><button className="table-button" onClick={() => startEdit(l)}>Open</button></td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </>
  );
}

// ---- Activity composer ----

function LeadActivityComposer({ onAdd }: { onAdd: (type: LeadActivityType, summary: string) => void }) {
  const [type, setType] = useState<LeadActivityType>('Note');
  const [summary, setSummary] = useState('');

  function commit() {
    if (!summary.trim()) return;
    onAdd(type, summary.trim());
    setSummary('');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'var(--jp-paper, #fff)', border: '1px dashed var(--jp-line)', borderRadius: 8 }}>
      <select value={type} onChange={(e) => setType(e.target.value as LeadActivityType)}>
        {LEAD_ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
        placeholder="What happened? (Enter to add)"
      />
      <button type="button" className="secondary-button" onClick={commit} disabled={!summary.trim()}>+ Log</button>
    </div>
  );
}
