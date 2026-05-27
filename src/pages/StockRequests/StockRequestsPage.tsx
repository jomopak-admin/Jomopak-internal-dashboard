/**
 * Stock Requests (Phase 42).
 *
 * Three-stage purchase-request workflow:
 *   1. Floor staff submits a request ("I need 2 rolls of packing tape")
 *   2. Manager approves or declines
 *   3. Buyer either issues from spares stock (auto-deduct) or raises a PO
 *
 * One page with tabs: My Requests / Awaiting Approval / Buying Queue / All.
 * Tabs are gated by capability permissions (stockRequestsApprove /
 * stockRequestsBuy) which admins grant per user in the Permissions page.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  SparePart,
  STOCK_REQUEST_URGENCIES,
  StockRequest,
  StockRequestFilters,
  StockRequestFormState,
  StockRequestStatus,
  StockRequestUrgency,
  Supplier,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface StockRequestsPageProps {
  requests: StockRequest[];
  spareParts: SparePart[];
  suppliers: Supplier[];
  /** Display name of the currently signed-in staff member. */
  currentUserName: string;
  /** Capability gates — controls which tabs are visible. */
  canApprove: boolean;
  canBuy: boolean;
  filters: StockRequestFilters;
  setFilters: (v: StockRequestFilters) => void;
  form: StockRequestFormState;
  setForm: (v: StockRequestFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: StockRequest) => void;
  onCancel: (id: string) => void;
  onApprove: (id: string, notes: string) => void;
  onDecline: (id: string, notes: string) => void;
  onIssueFromStock: (id: string, notes: string) => void;
  onRaisePurchaseOrder: (id: string, supplierId: string, supplierName: string, estimatedUnitCost: number, notes: string) => void;
  onMarkReceived: (id: string) => void;
}

function statusBadgeClass(status: StockRequestStatus): string {
  switch (status) {
    case 'Pending Manager': return 'badge';
    case 'Approved': return 'badge badge-success';
    case 'Issued from Stock': return 'badge badge-success';
    case 'PO Created': return 'badge';
    case 'Received': return 'badge badge-success';
    case 'Declined': return 'badge badge-danger';
    case 'Cancelled': return 'badge badge-danger';
    default: return 'badge';
  }
}

function urgencyBadgeClass(u: StockRequestUrgency): string {
  if (u === 'Urgent') return 'badge badge-danger';
  if (u === 'Low') return 'badge';
  return 'badge';
}

export function StockRequestsPage({ requests, spareParts, suppliers, currentUserName, canApprove, canBuy, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onCancel, onApprove, onDecline, onIssueFromStock, onRaisePurchaseOrder, onMarkReceived }: StockRequestsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  // Per-row in-progress action state (notes + supplier picker for "raise PO").
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionSupplierId, setActionSupplierId] = useState('');
  const [actionCost, setActionCost] = useState('');

  // Tab filter — narrows the visible list based on workflow stage.
  const visibleRequests = useMemo(() => {
    let list = requests;
    if (filters.tab === 'mine') {
      const me = currentUserName.trim().toLowerCase();
      list = list.filter((r) => r.requestedByName.trim().toLowerCase() === me);
    } else if (filters.tab === 'approval') {
      list = list.filter((r) => r.status === 'Pending Manager');
    } else if (filters.tab === 'buying') {
      list = list.filter((r) => r.status === 'Approved' || r.status === 'PO Created');
    }
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hits = (r: StockRequest) => [r.itemName, r.requestedByName, r.requestedFor, r.reason, r.requestNumber, r.sparePartName].join(' ').toLowerCase().includes(q);
      list = list.filter(hits);
    }
    if (filters.status) list = list.filter((r) => r.status === filters.status);
    if (filters.urgency) list = list.filter((r) => r.urgency === filters.urgency);
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [requests, filters, currentUserName]);

  const stats = useMemo(() => ({
    mine: requests.filter((r) => r.requestedByName.trim().toLowerCase() === currentUserName.trim().toLowerCase()).length,
    pendingApproval: requests.filter((r) => r.status === 'Pending Manager').length,
    buyingQueue: requests.filter((r) => r.status === 'Approved').length,
    openPOs: requests.filter((r) => r.status === 'PO Created').length,
  }), [requests, currentUserName]);

  // When the requester picks a known spare part, snap the name + unit too.
  function pickSpare(id: string) {
    const sp = spareParts.find((s) => s.id === id);
    setForm({
      ...form,
      sparePartId: id,
      sparePartName: sp ? sp.partName : '',
      itemName: sp ? sp.partName : form.itemName,
      unit: sp && sp.unitOfMeasure ? sp.unitOfMeasure : form.unit,
    });
  }

  function resetAction() {
    setActionFor(null);
    setActionNotes('');
    setActionSupplierId('');
    setActionCost('');
  }

  const sections: FormWizardSection[] = [{
    key: 'request',
    title: 'Stock request',
    missingRequired: [
      ...(form.itemName.trim() ? [] : ['What you need']),
      ...(Number(form.quantity) > 0 ? [] : ['Quantity']),
    ],
    body: (
      <div className="form-grid">
        <label>
          <span>Your name <RequiredMarker /></span>
          <input value={form.requestedByName} onChange={(e) => setForm({ ...form, requestedByName: e.target.value })} placeholder="Auto-filled from your login" />
        </label>
        <label>
          <span>For (machine / area / job)</span>
          <input value={form.requestedFor} onChange={(e) => setForm({ ...form, requestedFor: e.target.value })} placeholder="e.g. Press 2, packing line, Job JC-1234" />
        </label>

        <label className="full-span">
          <span>Pick a known item (optional, helps the buyer)</span>
          <select value={form.sparePartId} onChange={(e) => pickSpare(e.target.value)}>
            <option value="">— or just describe it below —</option>
            {spareParts.map((s) => (
              <option key={s.id} value={s.id}>{s.partName}{s.partCode ? ` (${s.partCode})` : ''}{typeof s.quantityOnHand === 'number' ? ` · ${s.quantityOnHand} ${s.unitOfMeasure || ''} on hand` : ''}</option>
            ))}
          </select>
        </label>

        <label className="full-span">
          <span>What do you need? <RequiredMarker /></span>
          <input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Packing tape 48mm clear" />
        </label>

        <label>
          <span>Quantity <RequiredMarker /></span>
          <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </label>
        <label>
          <span>Unit</span>
          <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="rolls, pieces, kg" />
        </label>

        <label>
          <span>Needed by</span>
          <input type="date" value={form.neededByDate} onChange={(e) => setForm({ ...form, neededByDate: e.target.value })} />
        </label>
        <label>
          <span>Urgency</span>
          <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as StockRequestUrgency })}>
            {STOCK_REQUEST_URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>

        <label className="full-span">
          <span>Why do you need it?</span>
          <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Helps your manager approve faster" />
        </label>
      </div>
    ),
  }];

  // ----- Tabs row -----
  const tabs: Array<{ key: StockRequestFilters['tab']; label: string; count?: number; show: boolean }> = [
    { key: 'mine', label: 'My requests', count: stats.mine, show: true },
    { key: 'approval', label: 'Awaiting approval', count: stats.pendingApproval, show: canApprove },
    { key: 'buying', label: 'Buying queue', count: stats.buyingQueue + stats.openPOs, show: canBuy },
    { key: 'all', label: 'All', show: true },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>New request</button>
        : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit stock request' : 'New stock request'}
          subtitle="Tell us what you need. Your manager will approve, then the buyer will issue from stock or order it in."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Submit request"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Stock Requests" subtitle={`${visibleRequests.length} of ${requests.length} request(s) shown`} />

          {/* Tabs */}
          <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 12 }}>
            {tabs.filter((t) => t.show).map((t) => (
              <button
                key={t.key}
                type="button"
                className={filters.tab === t.key ? 'secondary-button' : 'ghost-button'}
                onClick={() => setFilters({ ...filters, tab: t.key })}
              >
                {t.label}{typeof t.count === 'number' && t.count > 0 ? ` (${t.count})` : ''}
              </button>
            ))}
          </div>

          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Item, person, area" /></label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Pending Manager</option><option>Approved</option><option>Issued from Stock</option>
                <option>PO Created</option><option>Received</option><option>Declined</option><option>Cancelled</option>
              </select>
            </label>
            <label><span>Urgency</span>
              <select value={filters.urgency} onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}>
                <option value="">All</option>
                {STOCK_REQUEST_URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>

          {visibleRequests.length === 0 ? (
            <EmptyState title="No requests here" body={filters.tab === 'mine' ? "You haven't submitted any stock requests." : 'Nothing matching the filters.'} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Requested</th><th>By / for</th><th>Item</th><th>Qty</th><th>Needed by</th><th>Urgency</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((r) => {
                    const linked = r.sparePartId ? spareParts.find((s) => s.id === r.sparePartId) : undefined;
                    const onHand = linked && typeof linked.quantityOnHand === 'number' ? linked.quantityOnHand : null;
                    const canFulfilFromStock = canBuy && r.status === 'Approved' && linked && onHand !== null && onHand >= r.quantity;
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.requestNumber}</strong></td>
                        <td>{formatDate(r.createdAt.slice(0, 10))}</td>
                        <td>{r.requestedByName}<div className="table-subtext">{r.requestedFor}</div></td>
                        <td>{r.itemName}
                          {linked ? <div className="table-subtext">Linked: {linked.partName}{onHand !== null ? ` · ${onHand} ${linked.unitOfMeasure || ''} on hand` : ''}</div> : null}
                          {r.supplierName ? <div className="table-subtext">Supplier: {r.supplierName}</div> : null}
                          {r.reason ? <div className="table-subtext" style={{ fontStyle: 'italic' }}>"{r.reason}"</div> : null}
                        </td>
                        <td>{r.quantity} {r.unit}</td>
                        <td>{r.neededByDate ? formatDate(r.neededByDate) : '—'}</td>
                        <td><span className={urgencyBadgeClass(r.urgency)}>{r.urgency}</span></td>
                        <td>
                          <span className={statusBadgeClass(r.status)}>{r.status}</span>
                          {r.approvedByName ? <div className="table-subtext">Approved: {r.approvedByName} {r.approvedAt ? formatDate(r.approvedAt) : ''}</div> : null}
                          {r.fulfilledByName ? <div className="table-subtext">Fulfilled: {r.fulfilledByName} {r.fulfilledAt ? formatDate(r.fulfilledAt) : ''}</div> : null}
                        </td>
                        <td>
                          {/* Requester can cancel their own pending request */}
                          {r.status === 'Pending Manager' && r.requestedByName.trim().toLowerCase() === currentUserName.trim().toLowerCase() ? (
                            <button className="table-button" onClick={() => { if (confirm('Cancel this request?')) onCancel(r.id); }}>Cancel</button>
                          ) : null}

                          {/* Manager actions */}
                          {canApprove && r.status === 'Pending Manager' ? (
                            actionFor === r.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <textarea rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Notes (optional)" />
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button className="table-button" onClick={() => { onApprove(r.id, actionNotes); resetAction(); }}>✓ Approve</button>
                                  <button className="table-button danger" onClick={() => { onDecline(r.id, actionNotes); resetAction(); }}>✗ Decline</button>
                                  <button className="table-button" onClick={resetAction}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button className="table-button" onClick={() => { setActionFor(r.id); setActionNotes(''); }}>Review</button>
                            )
                          ) : null}

                          {/* Buyer actions */}
                          {canBuy && r.status === 'Approved' ? (
                            actionFor === r.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {canFulfilFromStock ? (
                                  <button className="table-button" onClick={() => { onIssueFromStock(r.id, actionNotes); resetAction(); }}>✓ Issue {r.quantity} from stock</button>
                                ) : linked ? (
                                  <div className="table-subtext" style={{ color: 'var(--jp-orange)' }}>
                                    Not enough on hand to fulfill from stock ({onHand} available, {r.quantity} needed) — raise a PO instead.
                                  </div>
                                ) : null}
                                <select value={actionSupplierId} onChange={(e) => setActionSupplierId(e.target.value)}>
                                  <option value="">— pick supplier for PO —</option>
                                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <input type="number" min="0" step="0.01" value={actionCost} onChange={(e) => setActionCost(e.target.value)} placeholder="Est. unit cost" />
                                <textarea rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Notes (optional)" />
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  <button className="table-button" disabled={!actionSupplierId} onClick={() => {
                                    const sup = suppliers.find((s) => s.id === actionSupplierId);
                                    onRaisePurchaseOrder(r.id, actionSupplierId, sup?.name || '', Number(actionCost) || 0, actionNotes);
                                    resetAction();
                                  }}>📋 Raise PO</button>
                                  <button className="table-button danger" onClick={() => { onDecline(r.id, actionNotes); resetAction(); }}>✗ Decline</button>
                                  <button className="table-button" onClick={resetAction}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button className="table-button" onClick={() => { setActionFor(r.id); setActionNotes(''); setActionSupplierId(''); setActionCost(''); }}>Fulfill</button>
                            )
                          ) : null}

                          {/* Mark received once PO arrives */}
                          {canBuy && r.status === 'PO Created' ? (
                            <button className="table-button" onClick={() => { if (confirm('Mark PO as received?')) onMarkReceived(r.id); }}>📥 Received</button>
                          ) : null}

                          {/* Edit available for the requester while pending */}
                          {r.status === 'Pending Manager' && r.requestedByName.trim().toLowerCase() === currentUserName.trim().toLowerCase() ? (
                            <button className="table-button" onClick={() => { onEdit(r); setMode('form'); }}>Edit</button>
                          ) : null}
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
