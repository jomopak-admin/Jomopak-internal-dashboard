/**
 * Price List — standard-product cost-plus pricing (phase 33).
 *
 * Auto-pulls every pricing-enabled product, recomputes its cost from the live
 * cost masters (same engine as the Calculator), and shows: cost, base price,
 * MOQ break table, a per-pricing-tier matrix (incl. Wholesale), and — when a
 * client is selected — that client's effective price after any override.
 *
 * Prices are versioned and auditable: approving a product snapshots the margin,
 * the cost assumptions in force, and the per-break prices, stamped with who
 * approved it and when. A "needs re-approval" badge appears when the live cost
 * has drifted from the last approved version. Everything here is internal —
 * none of it is published to the Aman OS connector.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  ClientProductPrice,
  ClientProductPriceMode,
  CostProfile,
  PaperRate,
  PricingTier,
  Product,
  ProductPriceVersion,
} from '../../types';
import { formatNumber } from '../../utils/calculations';
import { downloadCsv } from '../../utils/csvExport';
import {
  computeProductPricing,
  isPriceVersionStale,
  resolveClientPrice,
} from '../../utils/productPricing';

export interface ClientPriceDraft {
  clientId: string;
  productId: string;
  mode: ClientProductPriceMode;
  marginPercent: number;
  fixedUnitPrice: number;
  minQuantity: number;
  note: string;
}

interface PriceListPageProps {
  products: Product[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  pricingTiers: PricingTier[];
  clients: Client[];
  productPriceVersions: ProductPriceVersion[];
  clientProductPrices: ClientProductPrice[];
  canApprove: boolean;
  onApproveProduct: (productId: string, note: string) => void;
  onAddClientPrice: (draft: ClientPriceDraft) => void;
  onDeleteClientPrice: (id: string) => void;
}

function money(value: number, dp = 3): string {
  return `R ${formatNumber(value, dp)}`;
}

export function PriceListPage({
  products,
  paperRates,
  costProfiles,
  pricingTiers,
  clients,
  productPriceVersions,
  clientProductPrices,
  canApprove,
  onApproveProduct,
  onAddClientPrice,
  onDeleteClientPrice,
}: PriceListPageProps) {
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<ClientPriceDraft>({
    clientId: '',
    productId: '',
    mode: 'margin',
    marginPercent: 0,
    fixedUnitPrice: 0,
    minQuantity: 0,
    note: '',
  });
  const [dealMessage, setDealMessage] = useState('');

  const refs = useMemo(() => ({ paperRates, costProfiles, pricingTiers }), [paperRates, costProfiles, pricingTiers]);

  const pricedProducts = useMemo(
    () => products.filter((p) => p.pricingEnabled && p.pricingSpec).sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  // Latest APPROVED version per product (highest versionNumber).
  const latestApprovedByProduct = useMemo(() => {
    const map = new Map<string, ProductPriceVersion>();
    productPriceVersions
      .filter((v) => v.status === 'Approved')
      .forEach((v) => {
        const current = map.get(v.productId);
        if (!current || v.versionNumber > current.versionNumber) map.set(v.productId, v);
      });
    return map;
  }, [productPriceVersions]);

  const versionsByProduct = useMemo(() => {
    const map = new Map<string, ProductPriceVersion[]>();
    productPriceVersions.forEach((v) => {
      const arr = map.get(v.productId) || [];
      arr.push(v);
      map.set(v.productId, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => b.versionNumber - a.versionNumber));
    return map;
  }, [productPriceVersions]);

  const selectedClient = clients.find((c) => c.id === clientId);

  function clientOverrideFor(productId: string): ClientProductPrice | undefined {
    if (!clientId) return undefined;
    return clientProductPrices.find((o) => o.active && o.clientId === clientId && o.productId === productId);
  }

  function handleExport() {
    const rows: Record<string, unknown>[] = [];
    pricedProducts.forEach((product) => {
      const result = computeProductPricing(product.pricingSpec!, refs);
      if (!result.ok) return;
      const override = clientOverrideFor(product.id);
      result.breaks.forEach((b) => {
        const row: Record<string, unknown> = {
          Product: product.name,
          SKU: product.sku,
          Quantity: b.quantity,
          'Unit cost (R)': formatNumber(b.unitCost, 4),
          'Base price (R)': formatNumber(b.unitPrice, 4),
          'Base margin %': formatNumber(b.marginPercent, 1),
        };
        pricingTiers.forEach((tier) => {
          row[`${tier.name} (R)`] = formatNumber(b.tierPrices[tier.id] ?? 0, 4);
        });
        row['Plate setup (R)'] = formatNumber(b.plateSetupFee, 2);
        if (selectedClient) {
          const cp = resolveClientPrice(product.pricingSpec!, b.quantity, override, refs);
          row[`${selectedClient.name} price (R)`] = formatNumber(cp.unitPrice, 4);
        }
        rows.push(row);
      });
    });
    if (!rows.length) {
      setDealMessage('Nothing to export yet — add a priced product first.');
      return;
    }
    downloadCsv(`price-list-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function submitDeal() {
    if (!draft.clientId || !draft.productId) {
      setDealMessage('Pick a client and a product for the deal.');
      return;
    }
    onAddClientPrice(draft);
    setDealMessage('Client-specific price saved.');
    setDraft({ clientId: '', productId: '', mode: 'margin', marginPercent: 0, fixedUnitPrice: 0, minQuantity: 0, note: '' });
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Price List"
        subtitle="Standard-product pricing, computed live from your paper + cost inputs. Internal only — never shared externally."
        action={<button className="ghost-button" onClick={handleExport}>Export CSV</button>}
      />

      <section className="card accounting-toolbar">
        <label>
          <span>View client-specific prices</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— Standard / list prices —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <span className="muted" style={{ alignSelf: 'center' }}>
          {pricedProducts.length} priced product(s){selectedClient ? ` · showing prices for ${selectedClient.name}` : ''}
        </span>
      </section>

      {pricedProducts.length === 0 ? (
        <EmptyState title="No priced products yet" body="Open a product, switch on 'Price this product', set its spec, and it appears here." />
      ) : (
        pricedProducts.map((product) => {
          const spec = product.pricingSpec!;
          const result = computeProductPricing(spec, refs);
          const approved = latestApprovedByProduct.get(product.id);
          const stale = isPriceVersionStale(spec, approved, refs);
          const override = clientOverrideFor(product.id);
          const history = versionsByProduct.get(product.id) || [];
          const isOpen = !!expanded[product.id];

          return (
            <section className="card" key={product.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{product.name}</h3>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                    {product.sku || 'No SKU'} · {product.category}
                    {result.ok && result.paperRate && result.costProfile
                      ? ` · ${result.paperRate.name} (${result.paperRate.gsm}gsm @ R${formatNumber(result.paperRate.pricePerTon, 0)}/t) · ${result.costProfile.name}`
                      : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {approved ? (
                    <div className="muted" style={{ fontSize: '0.74rem' }}>
                      v{approved.versionNumber} approved {approved.approvedAt ? new Date(approved.approvedAt).toLocaleDateString('en-ZA') : ''}
                      {approved.approvedByName ? ` by ${approved.approvedByName}` : ''}
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: '0.74rem' }}>No approved version yet</div>
                  )}
                  {stale ? <span className="sars-tag" style={{ background: 'rgba(180,60,40,0.12)', color: '#b43c28' }}>Needs re-approval</span> : null}
                  {approved && !stale ? <span className="sars-tag" style={{ background: 'rgba(40,140,80,0.12)', color: '#1f7a4d' }}>Current</span> : null}
                </div>
              </div>

              {!result.ok ? (
                <p className="muted">{result.reason}</p>
              ) : (
                <>
                  <div className="table-wrap" style={{ marginTop: '0.6rem' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Quantity</th>
                          <th style={{ textAlign: 'right' }}>Unit cost</th>
                          <th style={{ textAlign: 'right' }}>Base price</th>
                          {pricingTiers.map((tier) => (
                            <th key={tier.id} style={{ textAlign: 'right' }}>{tier.name}</th>
                          ))}
                          <th style={{ textAlign: 'right' }}>Plate setup</th>
                          {selectedClient ? <th style={{ textAlign: 'right' }}>{selectedClient.name}</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {result.breaks.map((b) => {
                          const cp = selectedClient ? resolveClientPrice(spec, b.quantity, override, refs) : null;
                          return (
                            <tr key={b.quantity}>
                              <td><strong>{formatNumber(b.quantity, 0)}</strong></td>
                              <td style={{ textAlign: 'right' }}>{money(b.unitCost, 4)}</td>
                              <td style={{ textAlign: 'right' }}><strong>{money(b.unitPrice, 3)}</strong><div className="muted" style={{ fontSize: '0.68rem' }}>{formatNumber(b.marginPercent, 0)}%</div></td>
                              {pricingTiers.map((tier) => (
                                <td key={tier.id} style={{ textAlign: 'right' }}>{money(b.tierPrices[tier.id] ?? 0, 3)}</td>
                              ))}
                              <td style={{ textAlign: 'right' }}>{b.plateSetupFee ? money(b.plateSetupFee, 2) : '—'}</td>
                              {cp ? (
                                <td style={{ textAlign: 'right' }}>
                                  <strong>{money(cp.unitPrice, 3)}</strong>
                                  {cp.source !== 'base' ? <div className="muted" style={{ fontSize: '0.66rem' }}>{cp.source === 'client-fixed' ? 'fixed deal' : 'deal margin'}</div> : null}
                                </td>
                              ) : null}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="accounting-actions" style={{ gap: '0.6rem', marginTop: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {canApprove ? (
                      <>
                        <input
                          style={{ flex: '1 1 220px' }}
                          placeholder="Approval note (optional)"
                          value={notes[product.id] ?? ''}
                          onChange={(e) => setNotes({ ...notes, [product.id]: e.target.value })}
                        />
                        <button className="primary-button" onClick={() => onApproveProduct(product.id, notes[product.id] ?? '')}>
                          {approved ? 'Approve new version' : 'Approve price'}
                        </button>
                      </>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.74rem' }}>You can view prices; approval is restricted.</span>
                    )}
                    {history.length ? (
                      <button className="ghost-button" onClick={() => setExpanded({ ...expanded, [product.id]: !isOpen })}>
                        {isOpen ? 'Hide history' : `History (${history.length})`}
                      </button>
                    ) : null}
                  </div>

                  {isOpen && history.length ? (
                    <div className="table-wrap" style={{ marginTop: '0.5rem' }}>
                      <table className="data-table">
                        <thead><tr><th>Version</th><th>Status</th><th>Margin</th><th>Assumptions</th><th>Approved</th><th>Note</th></tr></thead>
                        <tbody>
                          {history.map((v) => (
                            <tr key={v.id}>
                              <td>v{v.versionNumber}</td>
                              <td>{v.status}</td>
                              <td>{formatNumber(v.baseMarginPercent, 1)}%</td>
                              <td className="muted" style={{ fontSize: '0.72rem' }}>{v.assumptions.paperRateName} @ R{formatNumber(v.assumptions.pricePerTon, 0)}/t · {v.assumptions.wastagePercent}% waste · {v.assumptions.costProfileName}</td>
                              <td className="muted" style={{ fontSize: '0.72rem' }}>{v.approvedByName ? `${v.approvedByName}, ${v.approvedAt ? new Date(v.approvedAt).toLocaleDateString('en-ZA') : ''}` : '—'}</td>
                              <td className="muted" style={{ fontSize: '0.72rem' }}>{v.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          );
        })
      )}

      {/* ── Client-specific deals ─────────────────────────────────────────── */}
      <section className="card">
        <h3>Client-specific prices</h3>
        <p className="muted" style={{ marginTop: 0 }}>Override a standard product's price for one client — either a special margin or a fixed agreed unit price. Optionally scope it to a minimum quantity.</p>
        <div className="form-grid">
          <label><span>Client</span>
            <select value={draft.clientId} onChange={(e) => setDraft({ ...draft, clientId: e.target.value })}>
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label><span>Product</span>
            <select value={draft.productId} onChange={(e) => setDraft({ ...draft, productId: e.target.value })}>
              <option value="">Select product…</option>
              {pricedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label><span>Deal type</span>
            <select value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as ClientProductPriceMode })}>
              <option value="margin">Special margin %</option>
              <option value="fixedPrice">Fixed unit price</option>
            </select>
          </label>
          {draft.mode === 'margin' ? (
            <label><span>Margin %</span><input type="number" value={draft.marginPercent} onChange={(e) => setDraft({ ...draft, marginPercent: Number(e.target.value) })} /></label>
          ) : (
            <label><span>Fixed unit price (R)</span><input type="number" step="0.001" value={draft.fixedUnitPrice} onChange={(e) => setDraft({ ...draft, fixedUnitPrice: Number(e.target.value) })} /></label>
          )}
          <label><span>Applies from qty (0 = all)</span><input type="number" value={draft.minQuantity} onChange={(e) => setDraft({ ...draft, minQuantity: Number(e.target.value) })} /></label>
          <label className="full-span"><span>Note</span><input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
        </div>
        <div className="accounting-actions" style={{ gap: '0.6rem' }}>
          <button className="primary-button" onClick={submitDeal}>Save client price</button>
        </div>
        {dealMessage ? <p className="muted">{dealMessage}</p> : null}

        {clientProductPrices.length ? (
          <div className="table-wrap" style={{ marginTop: '0.6rem' }}>
            <table className="data-table">
              <thead><tr><th>Client</th><th>Product</th><th>Deal</th><th>From qty</th><th>Note</th><th></th></tr></thead>
              <tbody>
                {clientProductPrices.map((o) => (
                  <tr key={o.id} className={o.active ? '' : 'row-muted'}>
                    <td>{o.clientName}</td>
                    <td>{o.productName}</td>
                    <td>{o.mode === 'fixedPrice' ? `Fixed ${money(o.fixedUnitPrice, 3)}` : `${formatNumber(o.marginPercent, 1)}% margin`}</td>
                    <td>{o.minQuantity > 0 ? formatNumber(o.minQuantity, 0) : 'All'}</td>
                    <td className="muted" style={{ fontSize: '0.72rem' }}>{o.note || '—'}</td>
                    <td><button className="table-button" aria-label={`Remove deal for ${o.clientName}`} onClick={() => onDeleteClientPrice(o.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
