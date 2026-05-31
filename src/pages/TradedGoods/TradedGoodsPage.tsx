/**
 * Phase 93 — Traded Goods.
 *
 * Items JomoPak buys finished from a third-party supplier (Shereno, China,
 * India contract printers, etc.) and resells. Distinct from manufactured
 * FG stock — no production cost, just landed cost + markup.
 *
 * Three tabs:
 *  - Receipts   = purchase batches with live cost / sell / markup / profit.
 *                 This is where the day-to-day work happens.
 *  - Catalogue  = master list of resellable items + default cost/sell.
 *  - By supplier= roll-up of what's on hand per supplier (the "what I have
 *                 and don't have from China / India" view Aman asked for).
 *
 * Margin column + cost basis are gated by `canEditPricing` so sales staff
 * who shouldn't see costs only see the sell side.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  JobCard,
  Supplier,
  TradedGoodsItem,
  TradedGoodsItemFormState,
  TradedGoodsReceipt,
  TradedGoodsReceiptFormState,
  TradedGoodsStatus,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

type Tab = 'receipts' | 'catalogue' | 'bySupplier';

const STATUS_OPTIONS: TradedGoodsStatus[] = [
  'On order',
  'In stock',
  'Partial',
  'Sold out',
  'Pinned to job',
];

interface TradedGoodsPageProps {
  // Catalogue
  tradedGoodsItems: TradedGoodsItem[];
  itemForm: TradedGoodsItemFormState;
  setItemForm: (next: TradedGoodsItemFormState) => void;
  itemEditingId: string | null;
  itemMessage: string;
  onSaveItem: () => void;
  onResetItem: () => void;
  onEditItem: (item: TradedGoodsItem) => void;
  onDeleteItem: () => void;

  // Receipts
  tradedGoodsReceipts: TradedGoodsReceipt[];
  receiptForm: TradedGoodsReceiptFormState;
  setReceiptForm: (next: TradedGoodsReceiptFormState) => void;
  receiptEditingId: string | null;
  receiptMessage: string;
  onSaveReceipt: () => void;
  onResetReceipt: () => void;
  onEditReceipt: (item: TradedGoodsReceipt) => void;
  onDeleteReceipt: () => void;

  // Refs
  suppliers: Supplier[];
  clients: Client[];
  jobs: JobCard[];

  // Promote-out (mirrors FinishedGoodsStockPage Phase 73 pattern)
  onCreateInvoice?: (item: TradedGoodsReceipt) => void;
  onCreateDelivery?: (item: TradedGoodsReceipt) => void;

  // Permissions
  canEditPricing?: boolean;
}

export function TradedGoodsPage(props: TradedGoodsPageProps) {
  const {
    tradedGoodsItems,
    itemForm,
    setItemForm,
    itemEditingId,
    itemMessage,
    onSaveItem,
    onResetItem,
    onEditItem,
    onDeleteItem,
    tradedGoodsReceipts,
    receiptForm,
    setReceiptForm,
    receiptEditingId,
    receiptMessage,
    onSaveReceipt,
    onResetReceipt,
    onEditReceipt,
    onDeleteReceipt,
    suppliers,
    clients,
    jobs,
    onCreateInvoice,
    onCreateDelivery,
    canEditPricing = false,
  } = props;

  const [tab, setTab] = useState<Tab>('receipts');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TradedGoodsStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReceipts = useMemo(() => {
    return tradedGoodsReceipts.filter((receipt) => {
      if (supplierFilter && receipt.supplierId !== supplierFilter) return false;
      if (statusFilter && receipt.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const haystack = `${receipt.itemName} ${receipt.itemCode} ${receipt.supplierName} ${receipt.receiptNumber} ${receipt.supplierInvoiceReference} ${receipt.countryOfOrigin ?? ''}`;
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [tradedGoodsReceipts, supplierFilter, statusFilter, searchTerm]);

  const summary = useMemo(() => {
    let totalCost = 0;
    let totalSell = 0;
    let qtyOnHand = 0;
    let qtySold = 0;
    filteredReceipts.forEach((r) => {
      totalCost += r.unitCost * r.quantityAvailable;
      totalSell += r.sellPrice * r.quantityAvailable;
      qtyOnHand += r.quantityAvailable;
      qtySold += (r.quantityReceived - r.quantityAvailable);
    });
    return { totalCost, totalSell, qtyOnHand, qtySold };
  }, [filteredReceipts]);

  const supplierRollup = useMemo(() => {
    const map = new Map<string, {
      supplierId: string;
      supplierName: string;
      lines: TradedGoodsReceipt[];
      totalQtyOnHand: number;
      totalCostOnHand: number;
      totalSellOnHand: number;
    }>();
    tradedGoodsReceipts.forEach((receipt) => {
      const key = receipt.supplierId || '__unknown__';
      const existing = map.get(key) ?? {
        supplierId: receipt.supplierId,
        supplierName: receipt.supplierName || 'Unknown supplier',
        lines: [],
        totalQtyOnHand: 0,
        totalCostOnHand: 0,
        totalSellOnHand: 0,
      };
      existing.lines.push(receipt);
      existing.totalQtyOnHand += receipt.quantityAvailable;
      existing.totalCostOnHand += receipt.unitCost * receipt.quantityAvailable;
      existing.totalSellOnHand += receipt.sellPrice * receipt.quantityAvailable;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.supplierName.localeCompare(b.supplierName));
  }, [tradedGoodsReceipts]);

  return (
    <>
      <SectionTitle
        title="Traded Goods"
        subtitle="Bought-in finished goods you resell — track landed cost, sell price, and margin per batch. Separate from your manufactured FG stock."
      />

      <section className="card">
        <div className="settings-tabs" role="tablist" aria-label="Traded goods tabs">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'receipts'}
            className={tab === 'receipts' ? 'settings-tab is-active' : 'settings-tab'}
            onClick={() => setTab('receipts')}
          >
            Receipts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'catalogue'}
            className={tab === 'catalogue' ? 'settings-tab is-active' : 'settings-tab'}
            onClick={() => setTab('catalogue')}
          >
            Catalogue
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'bySupplier'}
            className={tab === 'bySupplier' ? 'settings-tab is-active' : 'settings-tab'}
            onClick={() => setTab('bySupplier')}
          >
            By supplier
          </button>
        </div>

        {tab === 'receipts' ? (
          <ReceiptsTab
            tradedGoodsItems={tradedGoodsItems}
            tradedGoodsReceipts={tradedGoodsReceipts}
            filteredReceipts={filteredReceipts}
            supplierFilter={supplierFilter}
            setSupplierFilter={setSupplierFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            summary={summary}
            receiptForm={receiptForm}
            setReceiptForm={setReceiptForm}
            receiptEditingId={receiptEditingId}
            receiptMessage={receiptMessage}
            onSaveReceipt={onSaveReceipt}
            onResetReceipt={onResetReceipt}
            onEditReceipt={onEditReceipt}
            onDeleteReceipt={onDeleteReceipt}
            suppliers={suppliers}
            clients={clients}
            jobs={jobs}
            onCreateInvoice={onCreateInvoice}
            onCreateDelivery={onCreateDelivery}
            canEditPricing={canEditPricing}
          />
        ) : tab === 'catalogue' ? (
          <CatalogueTab
            tradedGoodsItems={tradedGoodsItems}
            itemForm={itemForm}
            setItemForm={setItemForm}
            itemEditingId={itemEditingId}
            itemMessage={itemMessage}
            onSaveItem={onSaveItem}
            onResetItem={onResetItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            suppliers={suppliers}
            canEditPricing={canEditPricing}
          />
        ) : (
          <BySupplierTab
            supplierRollup={supplierRollup}
            canEditPricing={canEditPricing}
          />
        )}
      </section>
    </>
  );
}

/* -------------------------------- Receipts tab ----------------------------- */

function ReceiptsTab(props: {
  tradedGoodsItems: TradedGoodsItem[];
  tradedGoodsReceipts: TradedGoodsReceipt[];
  filteredReceipts: TradedGoodsReceipt[];
  supplierFilter: string;
  setSupplierFilter: (value: string) => void;
  statusFilter: TradedGoodsStatus | '';
  setStatusFilter: (value: TradedGoodsStatus | '') => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  summary: { totalCost: number; totalSell: number; qtyOnHand: number; qtySold: number };
  receiptForm: TradedGoodsReceiptFormState;
  setReceiptForm: (next: TradedGoodsReceiptFormState) => void;
  receiptEditingId: string | null;
  receiptMessage: string;
  onSaveReceipt: () => void;
  onResetReceipt: () => void;
  onEditReceipt: (item: TradedGoodsReceipt) => void;
  onDeleteReceipt: () => void;
  suppliers: Supplier[];
  clients: Client[];
  jobs: JobCard[];
  onCreateInvoice?: (item: TradedGoodsReceipt) => void;
  onCreateDelivery?: (item: TradedGoodsReceipt) => void;
  canEditPricing: boolean;
}) {
  const {
    tradedGoodsItems,
    tradedGoodsReceipts,
    filteredReceipts,
    supplierFilter,
    setSupplierFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    summary,
    receiptForm,
    setReceiptForm,
    receiptEditingId,
    receiptMessage,
    onSaveReceipt,
    onResetReceipt,
    onEditReceipt,
    onDeleteReceipt,
    suppliers,
    clients,
    jobs,
    onCreateInvoice,
    onCreateDelivery,
    canEditPricing,
  } = props;

  const profitOnHand = summary.totalSell - summary.totalCost;

  function patch(p: Partial<TradedGoodsReceiptFormState>) {
    setReceiptForm({ ...receiptForm, ...p });
  }

  function onItemPicked(itemId: string) {
    const item = tradedGoodsItems.find((i) => i.id === itemId);
    if (!item) {
      patch({ itemId });
      return;
    }
    const sellPrice = item.defaultSellPrice && item.defaultSellPrice > 0
      ? item.defaultSellPrice
      : item.defaultUnitCost * (1 + (item.defaultMarkupPercent || 0) / 100);
    patch({
      itemId,
      supplierId: receiptForm.supplierId || item.defaultSupplierId,
      unitLabel: receiptForm.unitLabel || item.unitLabel || 'unit',
      unitCost: String(item.defaultUnitCost || ''),
      markupPercent: String(item.defaultMarkupPercent || ''),
      sellPrice: String(sellPrice || ''),
    });
  }

  const previewCost = Number(receiptForm.unitCost) || 0;
  const previewMarkup = Number(receiptForm.markupPercent) || 0;
  const previewSellExplicit = Number(receiptForm.sellPrice) || 0;
  const previewSellComputed = previewCost * (1 + previewMarkup / 100);
  const previewSell = previewSellExplicit > 0 ? previewSellExplicit : previewSellComputed;
  const previewMarginPct = previewCost > 0 ? ((previewSell - previewCost) / previewCost) * 100 : 0;
  const previewQty = Number(receiptForm.quantityReceived) || 0;
  const previewProfit = (previewSell - previewCost) * previewQty;

  const sections: FormWizardSection[] = [
    {
      key: 'purchase',
      title: 'Purchase',
      missingRequired: [
        ...(receiptForm.receivedDate ? [] : ['Received date']),
        ...(receiptForm.itemId ? [] : ['Item']),
        ...(receiptForm.supplierId ? [] : ['Supplier']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Receipt # {receiptForm.receiptNumber ? '' : '(auto)'}</span>
            <input
              value={receiptForm.receiptNumber}
              onChange={(e) => patch({ receiptNumber: e.target.value })}
              placeholder="Leave blank for TRG-202605-001"
            />
          </label>
          <label>
            <span>Received date *</span>
            <input
              type="date"
              value={receiptForm.receivedDate}
              onChange={(e) => patch({ receivedDate: e.target.value })}
            />
          </label>
          <label>
            <span>Supplier invoice / PO ref</span>
            <input
              value={receiptForm.supplierInvoiceReference}
              onChange={(e) => patch({ supplierInvoiceReference: e.target.value })}
              placeholder="Shereno INV-4421"
            />
          </label>
          <label>
            <span>Item *</span>
            <select
              value={receiptForm.itemId}
              onChange={(e) => onItemPicked(e.target.value)}
            >
              <option value="">— pick a catalogue item —</option>
              {tradedGoodsItems.filter((i) => i.active !== false).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}{i.defaultSupplierName ? ` · ${i.defaultSupplierName}` : ''}
                </option>
              ))}
            </select>
            <small className="muted">Don&apos;t see it? Add it on the Catalogue tab first.</small>
          </label>
          <label>
            <span>Supplier on this batch *</span>
            <select
              value={receiptForm.supplierId}
              onChange={(e) => patch({ supplierId: e.target.value })}
            >
              <option value="">— pick supplier —</option>
              {suppliers.filter((s) => s.active !== false).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Country of origin</span>
            <input
              value={receiptForm.countryOfOrigin}
              onChange={(e) => patch({ countryOfOrigin: e.target.value })}
              placeholder="South Africa / China / India"
            />
          </label>
        </div>
      ),
    },
    {
      key: 'qty',
      title: 'Quantity & status',
      missingRequired: receiptForm.quantityReceived ? [] : ['Quantity received'],
      body: (
        <div className="form-grid">
          <label>
            <span>Quantity received *</span>
            <input
              type="number"
              min="0"
              step="any"
              value={receiptForm.quantityReceived}
              onChange={(e) => patch({ quantityReceived: e.target.value })}
            />
          </label>
          <label>
            <span>Unit</span>
            <input
              value={receiptForm.unitLabel}
              onChange={(e) => patch({ unitLabel: e.target.value })}
              placeholder="box / unit / piece / pack"
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={receiptForm.status}
              onChange={(e) => patch({ status: e.target.value as TradedGoodsStatus })}
            >
              {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </label>
          <label>
            <span>Storage location</span>
            <input
              value={receiptForm.storageLocation}
              onChange={(e) => patch({ storageLocation: e.target.value })}
              placeholder="Shelf C-12"
            />
          </label>
        </div>
      ),
    },
    ...(canEditPricing ? [{
      key: 'price',
      title: 'Cost & sell',
      subtitle: 'Either set a markup % and we\'ll compute the sell, or override sell directly. Margin previews live.',
      missingRequired: [
        ...(receiptForm.unitCost ? [] : ['Unit cost']),
        ...(receiptForm.sellPrice ? [] : ['Sell price']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Unit cost (ZAR) *</span>
            <input
              type="number"
              min="0"
              step="any"
              value={receiptForm.unitCost}
              onChange={(e) => patch({ unitCost: e.target.value })}
            />
          </label>
          <label>
            <span>Markup %</span>
            <input
              type="number"
              min="0"
              step="any"
              value={receiptForm.markupPercent}
              onChange={(e) => {
                const next = e.target.value;
                const cost = Number(receiptForm.unitCost) || 0;
                const m = Number(next) || 0;
                patch({
                  markupPercent: next,
                  sellPrice: cost > 0 && m > 0 ? String((cost * (1 + m / 100)).toFixed(2)) : receiptForm.sellPrice,
                });
              }}
              placeholder="10"
            />
          </label>
          <label>
            <span>Sell price (ZAR) *</span>
            <input
              type="number"
              min="0"
              step="any"
              value={receiptForm.sellPrice}
              onChange={(e) => patch({ sellPrice: e.target.value })}
            />
          </label>
          <div className="full-span" style={{
            background: 'var(--jp-paper-2, #faf8f4)',
            border: '1px dashed var(--jp-accent, #2563eb)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 13,
          }}>
            <strong>Live margin preview</strong>
            <div style={{ marginTop: 4, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <span>Cost <strong>R {formatNumber(previewCost, 2)}</strong></span>
              <span>→ Sell <strong>R {formatNumber(previewSell, 2)}</strong></span>
              <span>= margin <strong>{formatNumber(previewMarginPct, 1)}%</strong></span>
              <span>× qty {formatNumber(previewQty, 0)} = profit{' '}
                <strong style={{ color: previewProfit >= 0 ? '#2e6f3e' : '#b22b2b' }}>
                  R {formatNumber(previewProfit, 2)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      ),
    } as FormWizardSection] : []),
    {
      key: 'pin',
      title: 'Pin to job (optional)',
      subtitle: 'When this batch was bought against a specific client/job. Leave blank for general resale stock.',
      body: (
        <div className="form-grid">
          <label>
            <span>Client</span>
            <select
              value={receiptForm.clientId}
              onChange={(e) => patch({ clientId: e.target.value, jobId: '' })}
            >
              <option value="">— none / general stock —</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </label>
          <label>
            <span>Job</span>
            <select
              value={receiptForm.jobId}
              onChange={(e) => patch({ jobId: e.target.value })}
              disabled={!receiptForm.clientId}
            >
              <option value="">— none —</option>
              {jobs
                .filter((j) => !receiptForm.clientId || j.clientId === receiptForm.clientId)
                .map((j) => (
                  <option key={j.id} value={j.id}>{j.jobNumber} · {j.productName || j.notes?.slice(0, 30) || 'job'}</option>
                ))}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes & photo',
      body: (
        <div className="form-grid">
          <label className="full-span">
            <span>Notes</span>
            <textarea
              rows={3}
              value={receiptForm.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Anything about damage, lead time, swap conditions…"
            />
          </label>
          <div className="full-span">
            <PhotoUploader
              label="Photos (delivery condition, label, etc.)"
              urls={receiptForm.photoUrls || []}
              onChange={(photoUrls) => patch({ photoUrls })}
              recordType="tradedGoodsReceipt"
              recordId={receiptEditingId || 'new'}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      {canEditPricing ? (
        <div className="summary-strip" style={{ marginTop: 12, marginBottom: 12 }}>
          <div className="summary-chip"><span>On-hand qty</span><strong>{formatNumber(summary.qtyOnHand, 0)}</strong></div>
          <div className="summary-chip"><span>Cost on hand</span><strong>R {formatNumber(summary.totalCost, 2)}</strong></div>
          <div className="summary-chip"><span>Sell @ list</span><strong>R {formatNumber(summary.totalSell, 2)}</strong></div>
          <div className="summary-chip"><span>Profit if sold</span><strong style={{ color: profitOnHand >= 0 ? '#2e6f3e' : '#b22b2b' }}>R {formatNumber(profitOnHand, 2)}</strong></div>
          <div className="summary-chip"><span>Already sold</span><strong>{formatNumber(summary.qtySold, 0)}</strong></div>
        </div>
      ) : null}

      <FormWizard
        title={receiptEditingId ? 'Edit receipt' : 'Log a purchase / receipt'}
        subtitle="Capture what you bought, the landed cost, and the sell price. Margin previews live."
        message={receiptMessage || undefined}
        sections={sections}
        onSave={onSaveReceipt}
        onCancel={onResetReceipt}
        saveLabel={receiptEditingId ? 'Save changes' : 'Add receipt'}
        isEditing={!!receiptEditingId}
        footerExtra={receiptEditingId ? (
          <button type="button" className="ghost-button" onClick={onDeleteReceipt}>Delete receipt</button>
        ) : null}
      />

      <SectionTitle title="Receipts register" subtitle={`${tradedGoodsReceipts.length} batches on file`} />
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <label>
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Item, supplier, receipt #"
          />
        </label>
        <label>
          <span>Supplier</span>
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
            <option value="">All suppliers</option>
            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TradedGoodsStatus | '')}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
      </div>

      {filteredReceipts.length === 0 ? (
        <EmptyState
          title="No receipts yet"
          body="Log your first purchase from the form above to start tracking traded stock."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Item</th>
                <th>Supplier</th>
                <th>Country</th>
                <th>Received</th>
                <th>On hand</th>
                {canEditPricing ? <th>Cost</th> : null}
                <th>Sell</th>
                {canEditPricing ? <th>Markup</th> : null}
                {canEditPricing ? <th>Profit on hand</th> : null}
                <th>Status</th>
                <th>Pinned</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((r) => {
                const onHandProfit = (r.sellPrice - r.unitCost) * r.quantityAvailable;
                const margin = r.unitCost > 0 ? ((r.sellPrice - r.unitCost) / r.unitCost) * 100 : 0;
                return (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.receiptNumber}</strong>
                      {r.supplierInvoiceReference ? (
                        <div className="table-subtext">{r.supplierInvoiceReference}</div>
                      ) : null}
                    </td>
                    <td>
                      <div>{r.itemName}</div>
                      <div className="table-subtext">{r.itemCode}</div>
                    </td>
                    <td>{r.supplierName}</td>
                    <td>{r.countryOfOrigin || '—'}</td>
                    <td>{formatDate(r.receivedDate)}</td>
                    <td>
                      {formatNumber(r.quantityAvailable, 0)} / {formatNumber(r.quantityReceived, 0)} {r.unitLabel}
                    </td>
                    {canEditPricing ? <td>R {formatNumber(r.unitCost, 2)}</td> : null}
                    <td>R {formatNumber(r.sellPrice, 2)}</td>
                    {canEditPricing ? <td>{formatNumber(margin, 1)}%</td> : null}
                    {canEditPricing ? (
                      <td style={{ color: onHandProfit >= 0 ? '#2e6f3e' : '#b22b2b' }}>
                        R {formatNumber(onHandProfit, 2)}
                      </td>
                    ) : null}
                    <td>{r.status}</td>
                    <td>
                      {r.clientName ? (
                        <>
                          <div>{r.clientName}</div>
                          {r.jobNumber ? <div className="table-subtext">{r.jobNumber}</div> : null}
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="ghost-button" onClick={() => onEditReceipt(r)}>Edit</button>
                        {onCreateDelivery && r.quantityAvailable > 0 ? (
                          <button type="button" className="ghost-button" onClick={() => onCreateDelivery(r)}>+ DN</button>
                        ) : null}
                        {onCreateInvoice && r.quantityAvailable > 0 ? (
                          <button type="button" className="ghost-button" onClick={() => onCreateInvoice(r)}>+ Invoice</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* -------------------------------- Catalogue tab ---------------------------- */

function CatalogueTab(props: {
  tradedGoodsItems: TradedGoodsItem[];
  itemForm: TradedGoodsItemFormState;
  setItemForm: (next: TradedGoodsItemFormState) => void;
  itemEditingId: string | null;
  itemMessage: string;
  onSaveItem: () => void;
  onResetItem: () => void;
  onEditItem: (item: TradedGoodsItem) => void;
  onDeleteItem: () => void;
  suppliers: Supplier[];
  canEditPricing: boolean;
}) {
  const {
    tradedGoodsItems, itemForm, setItemForm, itemEditingId, itemMessage,
    onSaveItem, onResetItem, onEditItem, onDeleteItem, suppliers, canEditPricing,
  } = props;

  function patch(p: Partial<TradedGoodsItemFormState>) {
    setItemForm({ ...itemForm, ...p });
  }

  const sections: FormWizardSection[] = [
    {
      key: 'item',
      title: 'Item',
      missingRequired: itemForm.name ? [] : ['Name'],
      body: (
        <div className="form-grid">
          <label>
            <span>Item code</span>
            <input
              value={itemForm.itemCode}
              onChange={(e) => patch({ itemCode: e.target.value })}
              placeholder="TRG-SHERENO-A4-WHT (auto if blank)"
            />
          </label>
          <label>
            <span>Name *</span>
            <input
              value={itemForm.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Shereno 250gsm A4 box — white"
            />
          </label>
          <label className="full-span">
            <span>Description</span>
            <textarea
              rows={2}
              value={itemForm.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>
          <label>
            <span>Default supplier</span>
            <select
              value={itemForm.defaultSupplierId}
              onChange={(e) => patch({ defaultSupplierId: e.target.value })}
            >
              <option value="">— pick supplier —</option>
              {suppliers.filter((s) => s.active !== false).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Size / spec</span>
            <input
              value={itemForm.sizeSpec}
              onChange={(e) => patch({ sizeSpec: e.target.value })}
              placeholder="A4 / 300×210×80mm"
            />
          </label>
          <label>
            <span>Unit label</span>
            <input
              value={itemForm.unitLabel}
              onChange={(e) => patch({ unitLabel: e.target.value })}
              placeholder="box / unit / piece / pack"
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={itemForm.active}
              onChange={(e) => patch({ active: e.target.checked })}
            />
            <span>Active (visible in receipt dropdown)</span>
          </label>
        </div>
      ),
    },
    ...(canEditPricing ? [{
      key: 'price',
      title: 'Default pricing',
      subtitle: 'Used to prefill new receipts. Receipts can override per batch.',
      body: (
        <div className="form-grid">
          <label>
            <span>Default unit cost (ZAR)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={itemForm.defaultUnitCost}
              onChange={(e) => patch({ defaultUnitCost: e.target.value })}
            />
          </label>
          <label>
            <span>Default markup %</span>
            <input
              type="number"
              min="0"
              step="any"
              value={itemForm.defaultMarkupPercent}
              onChange={(e) => patch({ defaultMarkupPercent: e.target.value })}
              placeholder="10"
            />
          </label>
          <label>
            <span>Default sell price (overrides markup)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={itemForm.defaultSellPrice}
              onChange={(e) => patch({ defaultSellPrice: e.target.value })}
            />
          </label>
        </div>
      ),
    } as FormWizardSection] : []),
    {
      key: 'notes',
      title: 'Notes & photo',
      body: (
        <div className="form-grid">
          <label className="full-span">
            <span>Notes</span>
            <textarea
              rows={2}
              value={itemForm.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>
          <div className="full-span">
            <PhotoUploader
              label="Catalogue photo"
              urls={itemForm.photoUrls || []}
              onChange={(photoUrls) => patch({ photoUrls })}
              recordType="tradedGoodsItem"
              recordId={itemEditingId || 'new'}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <FormWizard
        title={itemEditingId ? 'Edit catalogue item' : 'Add a catalogue item'}
        subtitle="Master record for a resellable item. Defaults are copied to new receipts so you don't retype prices each time."
        message={itemMessage || undefined}
        sections={sections}
        onSave={onSaveItem}
        onCancel={onResetItem}
        saveLabel={itemEditingId ? 'Save changes' : 'Add item'}
        isEditing={!!itemEditingId}
        footerExtra={itemEditingId ? (
          <button type="button" className="ghost-button" onClick={onDeleteItem}>Delete item</button>
        ) : null}
      />

      <SectionTitle title="Catalogue" subtitle={`${tradedGoodsItems.length} items on file`} />
      {tradedGoodsItems.length === 0 ? (
        <EmptyState
          title="No catalogue items yet"
          body="Add the first item above. Once it's on file, you can log receipts against it."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Default supplier</th>
                <th>Unit</th>
                {canEditPricing ? <th>Default cost</th> : null}
                {canEditPricing ? <th>Default sell</th> : null}
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tradedGoodsItems.map((i) => (
                <tr key={i.id}>
                  <td>{i.itemCode}</td>
                  <td>
                    <div>{i.name}</div>
                    {i.sizeSpec ? <div className="table-subtext">{i.sizeSpec}</div> : null}
                  </td>
                  <td>{i.defaultSupplierName || '—'}</td>
                  <td>{i.unitLabel}</td>
                  {canEditPricing ? <td>R {formatNumber(i.defaultUnitCost, 2)}</td> : null}
                  {canEditPricing ? (
                    <td>
                      R {formatNumber(
                        i.defaultSellPrice && i.defaultSellPrice > 0
                          ? i.defaultSellPrice
                          : i.defaultUnitCost * (1 + (i.defaultMarkupPercent || 0) / 100),
                        2,
                      )}
                    </td>
                  ) : null}
                  <td>{i.active === false ? 'No' : 'Yes'}</td>
                  <td>
                    <button type="button" className="ghost-button" onClick={() => onEditItem(i)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ------------------------------- By-supplier tab --------------------------- */

function BySupplierTab(props: {
  supplierRollup: Array<{
    supplierId: string;
    supplierName: string;
    lines: TradedGoodsReceipt[];
    totalQtyOnHand: number;
    totalCostOnHand: number;
    totalSellOnHand: number;
  }>;
  canEditPricing: boolean;
}) {
  const { supplierRollup, canEditPricing } = props;

  if (supplierRollup.length === 0) {
    return (
      <EmptyState
        title="Nothing on hand from any supplier"
        body="Once you log a receipt, you'll see a roll-up here grouping what's available per supplier."
      />
    );
  }

  return (
    <>
      <SectionTitle
        title="What I have per supplier"
        subtitle="Roll-up of on-hand traded stock grouped by who you bought it from. Empty groups = nothing left of theirs."
      />
      {supplierRollup.map((group) => {
        const profit = group.totalSellOnHand - group.totalCostOnHand;
        return (
          <div key={group.supplierId || group.supplierName} className="card" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <strong style={{ fontSize: 16 }}>{group.supplierName}</strong>
              <span className="table-subtext">
                {formatNumber(group.totalQtyOnHand, 0)} units on hand
                {canEditPricing
                  ? <> · cost R {formatNumber(group.totalCostOnHand, 2)} · sell R {formatNumber(group.totalSellOnHand, 2)} · profit if sold <strong style={{ color: profit >= 0 ? '#2e6f3e' : '#b22b2b' }}>R {formatNumber(profit, 2)}</strong></>
                  : null}
              </span>
            </div>
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Receipt #</th>
                    <th>On hand</th>
                    {canEditPricing ? <th>Cost</th> : null}
                    <th>Sell</th>
                    <th>Status</th>
                    <th>Pinned</th>
                  </tr>
                </thead>
                <tbody>
                  {group.lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <div>{line.itemName}</div>
                        <div className="table-subtext">{line.itemCode}</div>
                      </td>
                      <td>{line.receiptNumber}</td>
                      <td>{formatNumber(line.quantityAvailable, 0)} / {formatNumber(line.quantityReceived, 0)} {line.unitLabel}</td>
                      {canEditPricing ? <td>R {formatNumber(line.unitCost, 2)}</td> : null}
                      <td>R {formatNumber(line.sellPrice, 2)}</td>
                      <td>{line.status}</td>
                      <td>{line.clientName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
