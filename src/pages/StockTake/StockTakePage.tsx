/**
 * Stock Take — periodic physical count vs system, with variance + reconcile.
 *
 * Phase 63 — expanded to cover everything it takes to run a factory:
 *   • All                        → walks the entire register in one go
 *   • General Stock              → spares + consumables + ink + glue +
 *                                   uniform + kitchen + cleaning + office
 *                                   (i.e. anything in the spare_parts
 *                                   register, regardless of category)
 *   • Chemicals                  → counts on-site quantity from MSDS register
 *   • Paper / Raw Materials      → counts material receipt quantityAvailable
 *   • Finished Goods             → counts finished stock quantityAvailable
 *
 * When the scope is General Stock, an optional Category filter lets the
 * stocktaker scope to just one slice (e.g. count just inks today, kitchen
 * tomorrow). The category list mirrors STOCK_ITEM_CATEGORIES.
 *
 * Flow: pick a scope → optional category filter → tick the items you're
 * counting → type the physical count → Save. The saved count shows each
 * line's system vs counted vs variance. "Reconcile" writes the counted
 * figures back to the live stock and locks the count.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  ChemicalRegisterEntry,
  FinishedGoodsStock,
  MaterialReceipt,
  SparePart,
  StockCount,
  StockCountFormState,
  STOCK_ITEM_CATEGORIES,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

type Scope = 'All' | 'General Stock' | 'Chemicals' | 'Paper / Raw Materials' | 'Finished Goods';
const SCOPES: Scope[] = ['All', 'General Stock', 'Chemicals', 'Paper / Raw Materials', 'Finished Goods'];

/** Legacy scope strings saved before Phase 63 are remapped on read so
 *  historical counts still load correctly. */
function normaliseScope(raw: string | undefined): Scope {
  switch (raw) {
    case 'Spare Parts': return 'General Stock';
    case 'Paper / Materials': return 'Paper / Raw Materials';
    case 'All':
    case 'General Stock':
    case 'Chemicals':
    case 'Paper / Raw Materials':
    case 'Finished Goods':
      return raw;
    default: return 'All';
  }
}

interface CountItem {
  id: string;
  label: string;
  detail: string;
  systemQty: number;
  unit: string;
  /** Which register this item lives in — used to badge the All view so
   *  the user knows whether they're counting a forklift battery, a
   *  drum of glue, or a tin of coffee. */
  source: 'General Stock' | 'Chemicals' | 'Materials' | 'Finished Goods';
  /** Category from the source row (only set for General Stock items). */
  category?: string;
}

interface StockTakePageProps {
  spareParts: SparePart[];
  materialReceipts: MaterialReceipt[];
  finishedGoodsStock: FinishedGoodsStock[];
  /** Phase 63 — chemicals now count too. */
  chemicalRegisterEntries?: ChemicalRegisterEntry[];
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
  chemicalRegisterEntries = [],
  stockCounts,
  form,
  setForm,
  message,
  onSave,
  onReconcile,
}: StockTakePageProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const scope = normaliseScope(form.scope);

  // ---- Per-register projections ----------------------------------------
  const generalStockItems = useMemo<CountItem[]>(() => spareParts.map((p) => ({
    id: `spare:${p.id}`,
    label: p.partName,
    detail: `${p.partCode} · ${p.category || 'Uncategorised'}`.trim(),
    systemQty: p.quantityOnHand ?? 0,
    unit: p.unitOfMeasure || 'units',
    source: 'General Stock' as const,
    category: p.category || 'Other',
  })), [spareParts]);

  const chemicalItems = useMemo<CountItem[]>(() => chemicalRegisterEntries
    .filter((c) => !c.archived)
    .map((c) => ({
      id: `chem:${c.id}`,
      label: c.chemicalName || c.tradeName || 'Chemical',
      detail: `${c.registerNumber || ''} · ${c.tradeName || ''}`.trim(),
      systemQty: c.currentOnSiteQuantity ?? 0,
      unit: c.quantityUnit || 'L',
      source: 'Chemicals' as const,
    })),
  [chemicalRegisterEntries]);

  const materialItems = useMemo<CountItem[]>(() => materialReceipts.map((m) => ({
    id: `mat:${m.id}`,
    label: `${m.paperType || m.itemName || 'Material'} ${m.gsm || ''}`.trim(),
    detail: `${m.internalRollCode || m.receiptNumber} · ${m.supplierName || ''}`.trim(),
    systemQty: m.quantityAvailable ?? 0,
    unit: m.quantityUnit || '',
    source: 'Materials' as const,
  })), [materialReceipts]);

  const finishedItems = useMemo<CountItem[]>(() => finishedGoodsStock.map((s) => ({
    id: `fg:${s.id}`,
    label: s.productName || 'Finished stock',
    detail: `${s.stockNumber} · ${s.clientName || ''}`.trim(),
    systemQty: s.quantityAvailable ?? 0,
    unit: s.quantityUnit || 'units',
    source: 'Finished Goods' as const,
  })), [finishedGoodsStock]);

  // Build the candidate item list for the current scope.
  const items = useMemo<CountItem[]>(() => {
    let list: CountItem[];
    switch (scope) {
      case 'Chemicals': list = chemicalItems; break;
      case 'Paper / Raw Materials': list = materialItems; break;
      case 'Finished Goods': list = finishedItems; break;
      case 'General Stock': list = generalStockItems; break;
      case 'All':
      default:
        list = [...generalStockItems, ...chemicalItems, ...materialItems, ...finishedItems];
    }
    // Category sub-filter only applies to General Stock items.
    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.source !== 'General Stock' || i.category === categoryFilter);
    }
    return list;
  }, [scope, generalStockItems, chemicalItems, materialItems, finishedItems, categoryFilter]);

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
        subtitle="Physical count vs system, with variance and one-click reconcile. Covers everything it takes to run the factory — spares, consumables, ink, glue, chemicals, paper, raw materials, uniforms, kitchen, and finished goods."
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
          {(scope === 'General Stock' || scope === 'All') && (
            <label>
              <span>Category filter</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All categories</option>
                {STOCK_ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          )}
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
          <EmptyState title={`Nothing to count in ${scope}`} body={
            scope === 'Chemicals'
              ? 'Add chemicals to the Chemical Register (MSDS) first — once they have an on-site quantity, they show up here.'
              : 'There are no items in this scope yet. Add them via Spares & Consumables, Materials Receiving, or the Chemical Register.'
          } />
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
                        {' '}<span className="muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '1px 6px', border: '1px solid #cbd5e1', borderRadius: 999 }}>{item.source}</span>
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
