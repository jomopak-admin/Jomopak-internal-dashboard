/**
 * Imports & Shipments — Phase 23
 *
 * Track inbound shipments from overseas (and local) suppliers: what's on
 * order, in transit, clearing, and landed. Capture landed cost (goods +
 * freight + duty + clearing + other) so you know the true cost of stock,
 * and a "Receive into stock" action turns shipment lines into material
 * receipts.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  MaterialKind,
  MATERIAL_KINDS,
  Shipment,
  ShipmentLineItem,
  ShipmentStatus,
  SHIPMENT_STATUSES,
  Supplier,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface ShipmentsPageProps {
  shipments: Shipment[];
  suppliers: Supplier[];
  onSave: (shipment: Shipment) => void;
  onReceiveIntoStock: (shipment: Shipment) => void;
}

function blankLine(): ShipmentLineItem {
  return { id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, description: '', materialKind: 'Paper', quantity: 0, unit: 'rolls', unitCost: 0 };
}

function emptyShipment(): Shipment {
  return {
    id: '', shipmentNumber: '', createdAt: '',
    supplierId: '', supplierName: '', reference: '', status: 'Ordered',
    incoterm: 'FOB', currency: 'USD', orderDate: new Date().toISOString().slice(0, 10),
    expectedArrivalDate: '', actualArrivalDate: '', containerNumber: '',
    billOfLadingNumber: '', vessel: '', lineItems: [blankLine()],
    goodsValue: 0, freightCost: 0, dutyCost: 0, clearingCost: 0, otherCost: 0,
    landedCostTotal: 0, notes: '', receivedIntoStock: false,
  };
}

function recompute(s: Shipment): Shipment {
  const goodsValue = s.lineItems.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);
  const landedCostTotal = goodsValue + (Number(s.freightCost) || 0) + (Number(s.dutyCost) || 0) + (Number(s.clearingCost) || 0) + (Number(s.otherCost) || 0);
  return { ...s, goodsValue, landedCostTotal };
}

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  'Ordered': 'status-pending',
  'In Production': 'status-ocr_running',
  'In Transit': 'status-ocr_running',
  'Arrived at Port': 'status-ocr_done',
  'Customs Clearance': 'status-ocr_done',
  'Received': 'status-reviewed',
  'Cancelled': 'status-duplicate',
};

export function ShipmentsPage({ shipments, suppliers, onSave, onReceiveIntoStock }: ShipmentsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<Shipment>(emptyShipment());
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...shipments].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [shipments],
  );

  function startNew() { setDraft(emptyShipment()); setEditingId(null); setMode('form'); }
  function startEdit(s: Shipment) { setDraft(recompute(s)); setEditingId(s.id); setMode('form'); }

  function update(patch: Partial<Shipment>) { setDraft((d) => recompute({ ...d, ...patch })); }
  function updateLine(id: string, patch: Partial<ShipmentLineItem>) {
    setDraft((d) => recompute({ ...d, lineItems: d.lineItems.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }
  function addLine() { setDraft((d) => recompute({ ...d, lineItems: [...d.lineItems, blankLine()] })); }
  function removeLine(id: string) { setDraft((d) => recompute({ ...d, lineItems: d.lineItems.filter((l) => l.id !== id) })); }

  function save() {
    if (!draft.supplierId) return;
    const supplier = suppliers.find((s) => s.id === draft.supplierId);
    const computed = recompute({ ...draft, supplierName: supplier?.name || draft.supplierName });
    onSave(computed);
    setMode('list');
  }

  if (mode === 'form') {
    const totalsKnown = draft.lineItems.length > 0;
    return (
      <div className="page-stack shipments-shell">
        <SectionTitle
          title={editingId ? `Edit shipment ${draft.shipmentNumber}` : 'New shipment'}
          backAction={<button className="ghost-button" onClick={() => setMode('list')}>← Back</button>}
        />
        <section className="card">
          <h3>Shipment details</h3>
          <div className="shipments-grid">
            <label><span>Supplier *</span>
              <select value={draft.supplierId} onChange={(e) => update({ supplierId: e.target.value })}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label><span>Status</span>
              <select value={draft.status} onChange={(e) => update({ status: e.target.value as ShipmentStatus })}>
                {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label><span>Supplier ref / PO</span><input value={draft.reference} onChange={(e) => update({ reference: e.target.value })} /></label>
            <label><span>Incoterm</span>
              <select value={draft.incoterm} onChange={(e) => update({ incoterm: e.target.value })}>
                {['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'].map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            <label><span>Currency</span><input value={draft.currency} onChange={(e) => update({ currency: e.target.value })} /></label>
            <label><span>Order date</span><input type="date" value={draft.orderDate} onChange={(e) => update({ orderDate: e.target.value })} /></label>
            <label><span>Expected arrival (ETA)</span><input type="date" value={draft.expectedArrivalDate} onChange={(e) => update({ expectedArrivalDate: e.target.value })} /></label>
            <label><span>Actual arrival</span><input type="date" value={draft.actualArrivalDate} onChange={(e) => update({ actualArrivalDate: e.target.value })} /></label>
            <label><span>Container no.</span><input value={draft.containerNumber} onChange={(e) => update({ containerNumber: e.target.value })} /></label>
            <label><span>Bill of lading</span><input value={draft.billOfLadingNumber} onChange={(e) => update({ billOfLadingNumber: e.target.value })} /></label>
            <label><span>Vessel</span><input value={draft.vessel} onChange={(e) => update({ vessel: e.target.value })} /></label>
          </div>
        </section>

        <section className="card">
          <h3>Goods</h3>
          <table className="data-table">
            <thead>
              <tr><th>Description</th><th>Kind</th><th style={{ textAlign: 'right' }}>Qty</th><th>Unit</th><th style={{ textAlign: 'right' }}>Unit cost</th><th style={{ textAlign: 'right' }}>Line</th><th></th></tr>
            </thead>
            <tbody>
              {draft.lineItems.map((l) => (
                <tr key={l.id}>
                  <td><input value={l.description} onChange={(e) => updateLine(l.id, { description: e.target.value })} placeholder="e.g. 70gsm brown kraft" /></td>
                  <td>
                    <select value={l.materialKind} onChange={(e) => updateLine(l.id, { materialKind: e.target.value as MaterialKind })}>
                      {MATERIAL_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </td>
                  <td><input type="number" style={{ width: 80, textAlign: 'right' }} value={l.quantity} onChange={(e) => updateLine(l.id, { quantity: Number(e.target.value) })} /></td>
                  <td><input style={{ width: 70 }} value={l.unit} onChange={(e) => updateLine(l.id, { unit: e.target.value })} /></td>
                  <td><input type="number" style={{ width: 90, textAlign: 'right' }} value={l.unitCost} onChange={(e) => updateLine(l.id, { unitCost: Number(e.target.value) })} /></td>
                  <td style={{ textAlign: 'right' }}>{formatNumber((Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 2)}</td>
                  <td><button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => removeLine(l.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="ghost-button" style={{ borderStyle: 'dashed', marginTop: '0.5rem' }} onClick={addLine}>+ Add goods line</button>
        </section>

        <section className="card">
          <h3>Landed cost ({draft.currency})</h3>
          <div className="shipments-grid">
            <label><span>Goods value</span><input type="number" value={draft.goodsValue} disabled /></label>
            <label><span>Freight</span><input type="number" value={draft.freightCost} onChange={(e) => update({ freightCost: Number(e.target.value) })} /></label>
            <label><span>Duty</span><input type="number" value={draft.dutyCost} onChange={(e) => update({ dutyCost: Number(e.target.value) })} /></label>
            <label><span>Clearing</span><input type="number" value={draft.clearingCost} onChange={(e) => update({ clearingCost: Number(e.target.value) })} /></label>
            <label><span>Other</span><input type="number" value={draft.otherCost} onChange={(e) => update({ otherCost: Number(e.target.value) })} /></label>
            <label><span>Landed total</span><input type="number" value={draft.landedCostTotal} disabled /></label>
          </div>
          <label style={{ display: 'block', marginTop: '0.75rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => update({ notes: e.target.value })} /></label>
          <div className="shipments-actions">
            <button className="primary-button" onClick={save} disabled={!draft.supplierId || !totalsKnown}>Save shipment</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Imports & Shipments"
        subtitle="Track inbound stock from overseas + local suppliers, with landed cost and receive-into-stock."
        action={<button className="secondary-button" onClick={startNew}>New shipment</button>}
      />
      {sorted.length === 0 ? (
        <EmptyState title="No shipments yet" body="Log a shipment to track what's on order and on the water." />
      ) : (
        <section className="card">
          <table className="data-table">
            <thead>
              <tr><th>Shipment</th><th>Supplier</th><th>Status</th><th>ETA</th><th style={{ textAlign: 'right' }}>Landed cost</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.shipmentNumber || s.id}</strong><div className="muted" style={{ fontSize: '0.75rem' }}>{s.reference} {s.containerNumber ? `· ${s.containerNumber}` : ''}</div></td>
                  <td>{s.supplierName}</td>
                  <td><span className={`status-pill ${STATUS_CLASS[s.status]}`}>{s.status}</span></td>
                  <td>{s.expectedArrivalDate || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{s.currency} {formatNumber(s.landedCostTotal, 2)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="link-button" onClick={() => startEdit(s)}>Edit</button>
                    {!s.receivedIntoStock && s.status !== 'Cancelled' ? (
                      <>{' · '}<button className="link-button" onClick={() => onReceiveIntoStock(s)}>Receive into stock</button></>
                    ) : s.receivedIntoStock ? <span className="muted"> · received</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
