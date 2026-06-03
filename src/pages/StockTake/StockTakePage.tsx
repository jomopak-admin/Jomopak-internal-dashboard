/**
 * Stock Take — periodic physical count vs system, with variance + reconcile.
 *
 * Phase 63 — expanded to cover everything it takes to run a factory:
 *   • All                        walks the entire register in one go
 *   • General Stock              spares + consumables + ink + glue +
 *                                   uniform + kitchen + cleaning + office
 *                                   (i.e. anything in the spare_parts
 *                                   register, regardless of category)
 *   • Chemicals                  counts on-site quantity from MSDS register
 *   • Paper / Raw Materials      counts material receipt quantityAvailable
 *   • Finished Goods             counts finished stock quantityAvailable
 *
 * When the scope is General Stock, an optional Category filter lets the
 * stocktaker scope to just one slice (e.g. count just inks today, kitchen
 * tomorrow). The category list mirrors STOCK_ITEM_CATEGORIES.
 *
 * Flow: pick a scope optional category filter tick the items you're
 * counting type the physical count Save. The saved count shows each
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
  /** Phase 64 — first photo URL for inline thumb + printable sheet. */
  photoUrl?: string;
  /** Phase 64 — internal storage location, printed on the count sheet so
   *  the counter knows where to look. */
  location?: string;
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
    photoUrl: p.photoUrls?.[0],
    location: p.storageLocation,
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
      photoUrl: c.photoUrls?.[0],
      location: c.storageLocation,
    })),
  [chemicalRegisterEntries]);

  const materialItems = useMemo<CountItem[]>(() => materialReceipts.map((m) => ({
    id: `mat:${m.id}`,
    label: `${m.paperType || m.itemName || 'Material'} ${m.gsm || ''}`.trim(),
    detail: `${m.internalRollCode || m.receiptNumber} · ${m.supplierName || ''}`.trim(),
    systemQty: m.quantityAvailable ?? 0,
    unit: m.quantityUnit || '',
    source: 'Materials' as const,
    photoUrl: m.photoUrls?.[0],
    location: m.storageLocation,
  })), [materialReceipts]);

  const finishedItems = useMemo<CountItem[]>(() => finishedGoodsStock.map((s) => ({
    id: `fg:${s.id}`,
    label: s.productName || 'Finished stock',
    detail: `${s.stockNumber} · ${s.clientName || ''}`.trim(),
    systemQty: s.quantityAvailable ?? 0,
    unit: s.quantityUnit || 'units',
    source: 'Finished Goods' as const,
    photoUrl: s.photoUrls?.[0],
    location: s.storageLocation,
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb', flex: '0 0 36px' }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 4, border: '1px dashed #cbd5e1', flex: '0 0 36px' }} aria-hidden="true" />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <strong>{item.label}</strong>
                            {' '}<span className="muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '1px 6px', border: '1px solid #cbd5e1', borderRadius: 999 }}>{item.source}</span>
                            <div className="muted" style={{ fontSize: '0.78rem' }}>{item.detail}</div>
                            {item.location ? <div className="muted" style={{ fontSize: '0.72rem' }}>{item.location}</div> : null}
                          </div>
                        </div>
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

        <div className="stocktake-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="primary-button" onClick={onSave} disabled={form.selectedItemIds.length === 0}>
            Save count ({form.selectedItemIds.length} item{form.selectedItemIds.length === 1 ? '' : 's'})
          </button>
          {/* Phase 64 — printable count sheet. If items are ticked, prints
              just those; otherwise prints the filtered list. */}
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              const targets = form.selectedItemIds.length > 0
                ? filteredItems.filter((i) => form.selectedItemIds.includes(i.id))
                : filteredItems;
              printCountSheet(targets, scope, categoryFilter, form.countedByName, form.notes, { showSystemQty: false });
            }}
            disabled={filteredItems.length === 0}
          >
            Print blank count sheet
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              const targets = form.selectedItemIds.length > 0
                ? filteredItems.filter((i) => form.selectedItemIds.includes(i.id))
                : filteredItems;
              printCountSheet(targets, scope, categoryFilter, form.countedByName, form.notes, { showSystemQty: true });
            }}
            disabled={filteredItems.length === 0}
          >
            Print with system qty (reconcile aid)
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

/**
 * Phase 64 — open a printable count sheet sized for an A4 clipboard.
 * Default mode hides system qty so the counter is honest about what they
 * actually see; toggle showSystemQty=true to print a reconcile aid for
 * pre-prepared counts. Photos render as small inline thumbs so the
 * counter can tell two similar-looking parts apart on the rack.
 */
function printCountSheet(
  rows: CountItem[],
  scope: Scope,
  categoryFilter: string,
  countedByName: string,
  notes: string,
  options: { showSystemQty: boolean },
) {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) return;
  const showSys = options.showSystemQty;
  const rowsHtml = rows.map((item) => `
    <tr>
      <td style="text-align:center;font-size:14px;width:28px"></td>
      <td style="width:48px">
        ${item.photoUrl
          ? `<img src="${item.photoUrl}" alt="" style="width:40px;height:40px;object-fit:cover;border:1px solid #ddd;border-radius:4px" />`
          : '<div style="width:40px;height:40px;border:1px dashed #cbd5e1;border-radius:4px"></div>'}
      </td>
      <td>
        <strong>${escapeHtml(item.label)}</strong>
        <div style="font-size:11px;color:#555">${escapeHtml(item.detail)} · ${escapeHtml(item.source)}</div>
        ${item.location ? `<div style="font-size:11px;color:#555">${escapeHtml(item.location)}</div>` : ''}
      </td>
      ${showSys ? `<td style="text-align:right">${formatNumber(item.systemQty)} ${escapeHtml(item.unit)}</td>` : ''}
      <td style="text-align:right;min-width:90px;border-bottom:1px solid #333">&nbsp;</td>
      <td style="min-width:140px;border-bottom:1px dashed #aaa">&nbsp;</td>
    </tr>`).join('');
  const today = new Date().toLocaleDateString();
  w.document.write(`<!DOCTYPE html><html><head><title>Stock count sheet — ${scope}</title>
    <style>
      body { font-family: -apple-system, sans-serif; padding: 20px; color: #111; }
      h1 { margin: 0 0 4px; font-size: 22px; }
      .meta { font-size: 12px; color: #555; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { padding: 8px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 12px; vertical-align: middle; }
      th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
      .footer { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 12px; }
      .sig-line { margin-top: 30px; border-top: 1px solid #111; padding-top: 4px; }
      @page { margin: 12mm; }
    </style></head><body>
    <h1>Stock count sheet — ${scope}</h1>
    <div class="meta">
      Date: ${today} · Counted by: ${escapeHtml(countedByName || '___________________')} ·
      ${categoryFilter !== 'all' ? `Category: ${escapeHtml(categoryFilter)} · ` : ''}
      ${rows.length} item(s) ${showSys ? '· (system qty shown — reconcile aid)' : '· (blank — count honestly)'}
    </div>
    ${notes ? `<p style="margin:0 0 8px;padding:6px 10px;background:#fef3c7;border-radius:6px;font-size:12px"><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ''}
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Photo</th>
          <th>Item</th>
          ${showSys ? '<th style="text-align:right">System</th>' : ''}
          <th style="text-align:right">Counted</th>
          <th>Notes / variance reason</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="footer">
      <div>
        <div class="sig-line">Counter — name + signature</div>
        <div class="sig-line">Date / time finished</div>
      </div>
      <div>
        <div class="sig-line">Reviewed by — name + signature</div>
        <div class="sig-line">Reconciled into system on</div>
      </div>
    </div>
    <script>window.print();</script>
    </body></html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
