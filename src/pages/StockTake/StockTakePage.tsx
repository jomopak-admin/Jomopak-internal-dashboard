/**
 * Stock Take — periodic physical count vs system, with variance + reconcile.
 *
 * Works across three scopes using the shared StockCount model:
 *   • Spare Parts / Consumables  → counts quantityOnHand
 *   • Paper / Materials          → counts material receipt quantityAvailable
 *   • Finished Goods             → counts finished stock quantityAvailable
 *
 * Flow: pick a scope → tick the items you're counting → type the physical
 * count → Save. The saved count shows each line's system vs counted vs
 * variance. "Reconcile" writes the counted figures back to the live stock
 * (so the system matches reality) and locks the count.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  FinishedGoodsStock,
  MaterialReceipt,
  SparePart,
  StockCount,
  StockCountFormState,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

type Scope = 'Spare Parts' | 'Paper / Materials' | 'Finished Goods';
const SCOPES: Scope[] = ['Spare Parts', 'Paper / Materials', 'Finished Goods'];

interface CountItem {
  id: string;
  label: string;
  detail: string;
  systemQty: number;
  unit: string;
}

interface StockTakePageProps {
  spareParts: SparePart[];
  materialReceipts: MaterialReceipt[];
  finishedGoodsStock: FinishedGoodsStock[];
  stockCounts: StockCount[];
  form: StockCountFormState;
  setForm: (value: StockCountFormState) => void;
  message: string;
  onSave: () => void;
  onReconcile: (countId: string, reconciledByName: string) => void;
}

export function StockTakePage({
  spareParts,
  materialReceipts,
  finishedGoodsStock,
  stockCounts,
  form,
  setForm,
  message,
  onSave,
  onReconcile,
}: StockTakePageProps) {
  const [search, setSearch] = useState('');
  const scope = (form.scope || 'Spare Parts') as Scope;

  // Build the candidate item list for the current scope.
  const items = useMemo<CountItem[]>(() => {
    if (scope === 'Paper / Materials') {
      return materialReceipts.map((m) => ({
        id: m.id,
        label: `${m.paperType || m.itemName || 'Material'} ${m.gsm || ''}`.trim(),
        detail: `${m.internalRollCode || m.receiptNumber} · ${m.supplierName || ''}`.trim(),
        systemQty: m.quantityAvailable ?? 0,
        unit: m.quantityUnit || '',
      }));
    }
    if (scope === 'Finished Goods') {
      return finishedGoodsStock.map((s) => ({
        id: s.id,
        label: s.productName || 'Finished stock',
        detail: `${s.stockNumber} · ${s.clientName || ''}`.trim(),
        systemQty: s.quantityAvailable ?? 0,
        unit: s.quantityUnit || 'units',
      }));
    }
    return spareParts.map((p) => ({
      id: p.id,
      label: p.partName,
      detail: `${p.partCode} · ${p.category || ''}`.trim(),
      systemQty: p.quantityOnHand ?? 0,
      unit: 'units',
    }));
  }, [scope, spareParts, materialReceipts, finishedGoodsStock]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.detail}`.toLowerCase().includes(q));
  }, [items, search]);

  function setScope(next: Scope) {
    // Switching scope clears the in-progress selection (different item set).
    setForm({ ...form, scope: next, selectedItemIds: [], countedQty: {} });
  }

  function toggleItem(id: string) {
    const selected = new Set(form.selectedItemIds);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    setForm({ ...form, selectedItemIds: Array.from(selected) });
  }

  function setCounted(id: string, value: string) {
    setForm({ ...form, countedQty: { ...form.countedQty, [id]: value } });
  }

  // Past counts, newest first.
  const pastCounts = useMemo(
    () => [...stockCounts].sort((a, b) => (b.countedAt || '').localeCompare(a.countedAt || '')),
    [stockCounts],
  );

  return (
    <div className="page-stack stocktake-shell">
      <SectionTitle
        title="Stock Take"
        subtitle="Physical count vs system, with variance and one-click reconcile. Covers spares, paper, and finished goods."
      />

      {/* New count -------------------------------------------------------- */}
      <section className="card">
        <h3>New count</h3>
        <div className="stocktake-controls">
          <label>
            <span>What are you counting?</span>
            <select value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
              {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            <span>Counted by</span>
            <input value={form.countedByName} onChange={(e) => setForm({ ...form, countedByName: e.target.value })} placeholder="Your name" />
          </label>
          <label>
            <span>Search items</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter the list" />
          </label>
        </div>

        {items.length === 0 ? (
          <EmptyState title={`No ${scope.toLowerCase()} to count`} body="There are no items in this scope yet." />
        ) : (
          <div className="stocktake-table-wrap">
            <table className="data-table stocktake-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>Item</th>
                  <th style={{ textAlign: 'right' }}>System</th>
                  <th style={{ textAlign: 'right' }}>Counted</th>
                  <th style={{ textAlign: 'right' }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const selected = form.selectedItemIds.includes(item.id);
                  const countedRaw = form.countedQty[item.id];
                  const counted = Number(countedRaw ?? 0);
                  const variance = selected && countedRaw !== undefined && countedRaw !== ''
                    ? counted - item.systemQty
                    : null;
                  return (
                    <tr key={item.id} className={selected ? 'is-selected' : ''}>
                      <td>
                        <input type="checkbox" checked={selected} onChange={() => toggleItem(item.id)} />
                      </td>
                      <td>
                        <strong>{item.label}</strong>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>{item.detail}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(item.systemQty)} {item.unit}</td>
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          inputMode="decimal"
                          style={{ width: 90, textAlign: 'right' }}
                          disabled={!selected}
                          value={countedRaw ?? ''}
                          onChange={(e) => setCounted(item.id, e.target.value)}
                          placeholder="—"
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {variance === null ? '—' : (
                          <span className={variance === 0 ? '' : variance > 0 ? 'variance-pos' : 'variance-neg'}>
                            {variance > 0 ? '+' : ''}{formatNumber(variance)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <label style={{ display: 'block', marginTop: '0.75rem' }}>
          <span>Notes</span>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. monthly count, warehouse A" />
        </label>

        {message ? <p className="muted" style={{ marginTop: '0.5rem' }}>{message}</p> : null}

        <div className="stocktake-actions">
          <button className="primary-button" onClick={onSave} disabled={form.selectedItemIds.length === 0}>
            Save count ({form.selectedItemIds.length} item{form.selectedItemIds.length === 1 ? '' : 's'})
          </button>
        </div>
      </section>

      {/* Past counts + variance reports ---------------------------------- */}
      <section className="card">
        <h3>Count history & variance</h3>
        {pastCounts.length === 0 ? (
          <p className="muted">No counts recorded yet.</p>
        ) : (
          <div className="stocktake-history">
            {pastCounts.map((count) => {
              const totalVariance = count.lines.reduce((sum, l) => sum + l.variance, 0);
              const discrepancies = count.lines.filter((l) => l.variance !== 0).length;
              return (
                <div key={count.id} className="stocktake-history-card">
                  <header>
                    <div>
                      <strong>{count.id}</strong>
                      <span className="muted"> · {count.scope || 'Spares'} · {new Date(count.countedAt).toLocaleDateString()} · {count.countedByName}</span>
                    </div>
                    {count.reconciled ? (
                      <span className="status-pill status-reviewed">Reconciled</span>
                    ) : (
                      <button
                        className="ghost-button"
                        onClick={() => onReconcile(count.id, count.countedByName || 'Admin')}
                      >
                        Reconcile (apply counts)
                      </button>
                    )}
                  </header>
                  <p className="muted" style={{ margin: '0.25rem 0 0.5rem' }}>
                    {count.lines.length} item{count.lines.length === 1 ? '' : 's'} · {discrepancies} with variance · net {totalVariance > 0 ? '+' : ''}{formatNumber(totalVariance)}
                  </p>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th style={{ textAlign: 'right' }}>System</th>
                        <th style={{ textAlign: 'right' }}>Counted</th>
                        <th style={{ textAlign: 'right' }}>Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {count.lines.map((l) => (
                        <tr key={l.id}>
                          <td>{l.itemName}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(l.systemQty)}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(l.countedQty)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={l.variance === 0 ? '' : l.variance > 0 ? 'variance-pos' : 'variance-neg'}>
                              {l.variance > 0 ? '+' : ''}{formatNumber(l.variance)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
