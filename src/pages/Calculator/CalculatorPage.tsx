/**
 * Calculator v2 — multi-line quote builder.
 *
 * Two-zone layout:
 *
 *   ┌─ Shared header ──────────────────────────────────────────────┐
 *   │ Client · Lead · Pricing tier · Paper rate · Cost profile     │
 *   │ Margin override · Quote date · Sales owner · Notes           │
 *   └──────────────────────────────────────────────────────────────┘
 *
 *   ┌─ Line items (one card each) ─────────────────────────────────┐
 *   │ Product · Description                                        │
 *   │ Bag W / H / Gusset · Quantity                                │
 *   │ Handle · Print method · Colors · Margin override             │
 *   │ Per-line breakdown (paper / handle / print / etc.)           │
 *   │ [Duplicate] [Remove]                                         │
 *   └──────────────────────────────────────────────────────────────┘
 *
 *   ┌─ Totals + Actions ───────────────────────────────────────────┐
 *   │ Total qty · Total cost · Total quoted · Blended margin       │
 *   │ [+ Add line]  [Reset]  [Save as Quote]                       │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Live computation: every keystroke re-runs computeQuote() and the
 * per-line + rollup figures update instantly.
 *
 * "Save as Quote" calls back into App.tsx which writes one QuoteEstimate
 * per line (the existing data model is single-SKU-per-quote; we honour
 * that by emitting N quotes that share a common quoteNumber prefix).
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  CalculatorState,
  CalculatorLineItem,
  Client,
  CostProfile,
  HandleType,
  Lead,
  PaperRate,
  PricingTier,
  PrintMethod,
  PrintCoverageBand,
  Product,
} from '../../types';
import { AppSettingsCompany } from '../../types';
import { formatNumber } from '../../utils/calculations';
import {
  computeQuote,
  emptyCalculatorLine,
  emptyCalculatorState,
  LineResult,
} from '../../utils/calculatorEngine';
import { CalculatorQuotePrint } from './CalculatorQuotePrint';

interface CalculatorPageProps {
  canViewInternalCosts: boolean;
  /** Phase 90 — admin-only. Hides margin %, per-line margin override,
   *  paper / profile override block, and the cost-master inputs from
   *  non-admin users. Sales sees the price; only the CEO can move it. */
  canEditPricing?: boolean;
  clients: Client[];
  products: Product[];
  pricingTiers: PricingTier[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  /** Phase 92 — company-wide standard margin %. Falls back below any
   *  per-line / shared / tier / profile margin already set on the state. */
  standardMarginPercent?: number;
  /** Phase 131.3 — Default paper region for this branch (e.g. 'JHB').
   *  Drives the picker dedupe so multi-region rows collapse to the row
   *  matching the configured branch. Unset = pick most expensive. */
  defaultPaperRegion?: import('../../types').PaperRegion;
  leads?: Lead[];
  state: CalculatorState;
  setState: (next: CalculatorState) => void;
  /** Callback wired in App.tsx — receives the calculator state. The host
   *  is responsible for translating it into one or more QuoteEstimate
   *  records and persisting them. Should return the new quote number(s)
   *  so we can show a confirmation. */
  onSaveAsQuote?: (state: CalculatorState) => Promise<{ quoteNumbers: string[] }> | { quoteNumbers: string[] };
  /** Phase 118.2 — append the current calculator lines to an existing
   *  calculator-sourced quote batch. */
  onAppendToQuote?: (state: CalculatorState, targetBatchId: string) => Promise<{ quoteNumbers: string[] }> | { quoteNumbers: string[] };
  /** Phase 118.2 — calculator batches the user can append to, filtered
   *  to the picker scope (typically same-client + recent + not invoiced). */
  existingQuoteBatches?: Array<{
    batchId: string;
    baseNumber: string;
    clientId: string;
    clientName: string;
    createdAt: string;
    lineCount: number;
  }>;
  /** Phase 86 — translate the current calculator state into a pre-filled
   *  Invoice form and navigate the user to the Invoice page so accounts
   *  can confirm + post. Skipped quote step entirely for direct-bill
   *  clients. App.tsx does the prefill + view switch. */
  onSaveAsInvoice?: (state: CalculatorState) => void;
  /** Company + footer for the printable quote. */
  company?: AppSettingsCompany;
  defaultFooterLines?: string[];
  preparedByName?: string;
  today?: string;
}

// Phase 132.4 — Just two handle types in the dropdown. Cheap-vs-premium
// distinction is per-Cost-Profile (one profile for cheap bags with low
// handle rates, one for premium with higher rates). Roll Handle stays in
// the HandleType enum for legacy data compatibility but hidden here.
const HANDLE_OPTIONS: HandleType[] = ['None', 'Flat Handle', 'Rope Handle'];
const HANDLE_LABELS: Record<string, string> = {
  'None': 'None',
  'Flat Handle': 'Paper Flat Handle',
  'Rope Handle': 'Paper Rope Handle',
  'Roll Handle': 'Paper Roll Handle (legacy)',
};
const PRINT_OPTIONS: PrintMethod[] = ['Auto', 'Plain', 'Screen Print', 'Flexo'];
const COVERAGE_OPTIONS: PrintCoverageBand[] = ['None', 'Light', 'Medium', 'Heavy'];

export function CalculatorPage({
  canViewInternalCosts,
  canEditPricing = false,
  clients,
  products,
  pricingTiers,
  paperRates,
  costProfiles,
  standardMarginPercent,
  defaultPaperRegion,
  leads = [],
  state,
  setState,
  onSaveAsQuote,
  onAppendToQuote,
  existingQuoteBatches,
  onSaveAsInvoice,
  company,
  defaultFooterLines,
  preparedByName,
  today,
}: CalculatorPageProps) {
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [printing, setPrinting] = useState(false);
  // Phase 131.1 — Header advanced section is collapsed by default to cut
  // visual noise. Lead, Pricing tier, Sales owner, Plate billing, Margin
  // override are advanced settings most quotes don't need.
  const [showHeaderAdvanced, setShowHeaderAdvanced] = useState(false);

  // Live computation runs on every render. Pure function — no perf cost.
  const computation = useMemo(
    () => computeQuote(state, { clients, pricingTiers, paperRates, costProfiles, standardMarginPercent }),
    [state, clients, pricingTiers, paperRates, costProfiles, standardMarginPercent],
  );

  const selectedClient = clients.find((c) => c.id === state.shared.clientId);
  const clientLeads = leads.filter((l) => !state.shared.clientId || l.clientId === state.shared.clientId);

  // Phase 131.3 — Dedupe paper picker by public label, preferring the
  // configured branch region; otherwise pick the MOST EXPENSIVE row per
  // label (safer cost basis when buying in small quantities — if it
  // comes in cheaper, that's bonus margin).
  //
  // White-label foundation:
  //   defaultPaperRegion = 'JHB'  → prefer JHB rows for each publicLabel
  //   defaultPaperRegion = unset  → just pick the most expensive
  //
  // When more branches go live, each deploy sets its own region.
  const dedupedPaperRates = useMemo(() => {
    const preferredRegion = defaultPaperRegion;
    const groups = new Map<string, PaperRate>();
    paperRates.filter((r) => r.active).forEach((r) => {
      const key = r.publicLabel || `${r.gsm}gsm ${r.paperType}`.trim() || r.name;
      const existing = groups.get(key);
      const rCharge = r.chargePerTon ?? r.pricePerTon;
      const existingCharge = existing ? (existing.chargePerTon ?? existing.pricePerTon) : -1;
      const rMatchesRegion = preferredRegion && r.region === preferredRegion;
      const existingMatchesRegion = preferredRegion && existing?.region === preferredRegion;

      // Decision matrix:
      //   - if NEW row matches region and existing does not → take NEW
      //   - if EXISTING matches region and new does not → keep EXISTING
      //   - otherwise pick the MORE EXPENSIVE row
      let take = false;
      if (!existing) {
        take = true;
      } else if (rMatchesRegion && !existingMatchesRegion) {
        take = true;
      } else if (!rMatchesRegion && existingMatchesRegion) {
        take = false;
      } else {
        take = rCharge > existingCharge;
      }
      if (take) groups.set(key, r);
    });
    const out = Array.from(groups.values());
    // Keep the currently-selected row visible on edit even if it's not
    // the deduped winner for its group.
    if (state.shared.paperRateId) {
      const sel = paperRates.find((r) => r.id === state.shared.paperRateId);
      if (sel && !out.some((r) => r.id === sel.id)) out.push(sel);
    }
    return out.sort((a, b) => {
      const al = a.publicLabel || a.name;
      const bl = b.publicLabel || b.name;
      return al.localeCompare(bl);
    });
  }, [paperRates, state.shared.paperRateId, defaultPaperRegion]);

  function updateShared<K extends keyof CalculatorState['shared']>(key: K, value: CalculatorState['shared'][K]) {
    setState({ ...state, shared: { ...state.shared, [key]: value } });
  }

  function updateLine(id: string, patch: Partial<CalculatorLineItem>) {
    setState({
      ...state,
      lines: state.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  }

  function addLine() {
    const newId = `line-${Date.now()}-${state.lines.length + 1}`;
    setState({ ...state, lines: [...state.lines, emptyCalculatorLine(newId)] });
  }

  function duplicateLine(id: string) {
    const src = state.lines.find((l) => l.id === id);
    if (!src) return;
    const newId = `line-${Date.now()}-${state.lines.length + 1}`;
    setState({ ...state, lines: [...state.lines, { ...src, id: newId }] });
  }

  function removeLine(id: string) {
    if (state.lines.length === 1) {
      // Don't allow removing the last line — reset it instead.
      setState({ ...state, lines: [emptyCalculatorLine(`line-${Date.now()}-1`)] });
      return;
    }
    setState({ ...state, lines: state.lines.filter((l) => l.id !== id) });
  }

  function reset() {
    setState(emptyCalculatorState(new Date().toISOString().slice(0, 10)));
    setSavedMessage('');
  }

  /* Phase 118.2 — append picker state. The dropdown surfaces existing
   * batches for the currently-selected client so the salesperson can
   * route the new lines into an open quote instead of creating a new
   * QTE-####. Empty string = "Save as new quote" (default). */
  const [appendTargetBatch, setAppendTargetBatch] = useState('');
  const batchesForClient = (existingQuoteBatches ?? []).filter(
    (b) => b.clientId === state.shared.clientId,
  );

  async function handleSaveAsQuote() {
    if (!onSaveAsQuote) return;
    // Phase 131.1 — Client is now optional. Empty or 'cash-sale' both
    // route through the save handler which decides whether to attach a
    // CASH SALE marker on the resulting quote/invoice.
    if (computation.rollup.totalQuantity === 0) {
      setSavedMessage('Add at least one line with a quantity.');
      return;
    }
    setSaving(true);
    setSavedMessage('Saving…');
    try {
      // Phase 118.2 — route to the append handler when the user picked
      // an existing batch from the dropdown. Otherwise default to the
      // standard new-quote save.
      const result = (appendTargetBatch && onAppendToQuote)
        ? await onAppendToQuote(state, appendTargetBatch)
        : await onSaveAsQuote(state);
      const verb = appendTargetBatch ? 'Added to quote' : 'Saved quote';
      setSavedMessage(`${verb}${result.quoteNumbers.length > 1 ? 's' : ''}: ${result.quoteNumbers.join(', ')}`);
      // Reset the picker so the next save defaults to "new quote".
      setAppendTargetBatch('');
    } catch (e: any) {
      setSavedMessage(`Save failed: ${e?.message || 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  const blockingIssues: string[] = [];
  // Phase 131.1 — Client is no longer strictly required. Empty or
  // 'cash-sale' both mean "no specific account" and the save flow
  // treats them as a Cash Sale walk-in.
  if (!state.shared.paperRateId) blockingIssues.push('Pick a paper');
  if (!state.shared.costProfileId) blockingIssues.push('Pick a cost profile');
  if (computation.rollup.totalQuantity === 0) blockingIssues.push('Add at least one line quantity');

  if (printing) {
    return (
      <CalculatorQuotePrint
        lines={state.lines}
        results={computation.lines}
        rollup={computation.rollup}
        client={selectedClient}
        company={company}
        preparedBy={preparedByName}
        today={today || new Date().toISOString().slice(0, 10)}
        defaultFooterLines={defaultFooterLines}
        onClose={() => setPrinting(false)}
      />
    );
  }

  return (
    <div className="calculator2-shell">
      <SectionTitle
        title="Quote Calculator"
        subtitle="Build a multi-line quote. Pick the shared header once, then add a card per SKU. Live costing updates as you type."
      />

      {/* Shared header --------------------------------------------------- */}
      <section className="card calculator2-shared">
        <h3>Quote header</h3>

        {/* Phase 131.1 — Cash Sale banner. Big and obvious so the user
            knows this isn't going against a client account. */}
        {state.shared.clientId === 'cash-sale' ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', marginBottom: 12,
            borderRadius: 8,
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid #dc2626',
          }}>
            <span style={{
              padding: '4px 10px', borderRadius: 6,
              background: '#dc2626', color: '#fff',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            }}>CASH SALE</span>
            <div style={{ flex: 1, fontSize: 13, color: '#7f1d1d' }}>
              <strong>Walk-in / no client account.</strong>
              {' '}Standard pricing — no credit terms, no client-specific defaults applied.
            </div>
          </div>
        ) : null}

        {/* Phase 86 — client privileges panel. Once a client is picked,
            surface their pricing tier + credit + standing flags so the
            sales person knows what to honour on this quote. */}
        {selectedClient ? (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            padding: '8px 12px', marginBottom: 12,
            background: 'var(--jp-paper-2, #faf8f4)',
            border: '1px solid var(--jp-line, #e6e0d3)',
            borderRadius: 8, fontSize: 12,
          }}>
            <strong style={{ fontSize: 13 }}>{selectedClient.name}</strong>
            {selectedClient.companyName ? <span className="muted">· {selectedClient.companyName}</span> : null}
            {/* Phase 89 — pricing-tier badge removed. Margin is company-wide;
                negotiated discounts apply per-quote, not per client tier. */}
            {selectedClient.creditLimit > 0 ? (
              <span className="muted">
                Credit: R{Math.round(selectedClient.currentBalance ?? 0)} / R{Math.round(selectedClient.creditLimit)}
                {(selectedClient.currentBalance ?? 0) >= selectedClient.creditLimit
                  ? <span className="badge badge-danger" style={{ marginLeft: 4 }}>Over limit</span>
                  : null}
              </span>
            ) : null}
            {selectedClient.accountHold ? <span className="badge badge-danger">On account hold</span> : null}
            {selectedClient.defaultFscClaim ? <span className="badge badge-success">FSC claim by default</span> : null}
            {selectedClient.foodSafeDeclarationRequired ? <span className="badge">Food-safe declaration required</span> : null}
            {selectedClient.batchNumberRequiredOnDeliveryNote ? <span className="badge">Batch # on DN</span> : null}
            {selectedClient.coaRequired ? <span className="badge">CoA required</span> : null}
          </div>
        ) : null}

        {/* Phase 131.1 — Essentials first. Client / Paper / Cost profile /
            Quote date / Notes. Everything else is hidden under "More options"
            below to cut visual clutter. */}
        <div className="calculator2-shared-grid">
          <label>
            <span>Client</span>
            <select value={state.shared.clientId} onChange={(e) => updateShared('clientId', e.target.value)}>
              <option value="">Select client</option>
              {/* Phase 131.1 — Cash Sale built-in. Lets you quote without
                  picking a real client. The save handler treats this as
                  a walk-in / no-account quote. */}
              <option value="cash-sale">CASH SALE — quick quote / walk-in</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <span>Paper *</span>
            <select value={state.shared.paperRateId} onChange={(e) => updateShared('paperRateId', e.target.value)}>
              <option value="">Select paper</option>
              {dedupedPaperRates.map((r) => {
                // Phase 131.2 — Public label only. Per-ton cost removed.
                // Dropdown is deduped by publicLabel; cheapest row chosen.
                const label = r.publicLabel || `${r.gsm}gsm ${r.paperType}`.trim() || r.name;
                return <option key={r.id} value={r.id}>{label}</option>;
              })}
            </select>
          </label>
          <label>
            <span>Cost profile *</span>
            <select value={state.shared.costProfileId} onChange={(e) => updateShared('costProfileId', e.target.value)}>
              <option value="">Select profile</option>
              {costProfiles.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Quote date</span>
            <input type="date" value={state.shared.quoteDate} onChange={(e) => updateShared('quoteDate', e.target.value)} />
          </label>
          <label className="calculator2-shared-notes">
            <span>Quote notes (printed)</span>
            <textarea
              rows={2}
              value={state.shared.notes}
              onChange={(e) => updateShared('notes', e.target.value)}
              placeholder="e.g. Lead time 14 days · prices valid 30 days · ex-works"
            />
          </label>
        </div>

        {/* Phase 131.1 — Advanced settings toggle. Most quotes don't
            need Lead / Pricing tier / Sales owner / Plate billing /
            Margin override. Hidden behind a one-tap toggle. */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--jp-divider, #e5e7eb)' }}>
          <button
            type="button"
            onClick={() => setShowHeaderAdvanced((v) => !v)}
            style={{
              background: 'transparent', border: 'none', padding: 0,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
              color: 'var(--jp-ink-3, #64748b)', cursor: 'pointer',
            }}
          >
            {showHeaderAdvanced ? '−' : '+'} MORE OPTIONS
            <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--jp-ink-3, #94a3b8)' }}>
              (lead · pricing tier · sales owner · plate billing)
            </span>
          </button>
          {showHeaderAdvanced && (
            <div className="calculator2-shared-grid" style={{ marginTop: 12 }}>
              <label>
                <span>Lead (optional)</span>
                <select value={state.shared.leadId} onChange={(e) => updateShared('leadId', e.target.value)}>
                  <option value="">No lead linked</option>
                  {clientLeads.map((l) => <option key={l.id} value={l.id}>{l.leadNumber} · {l.companyName || l.contactName}</option>)}
                </select>
              </label>
              <label>
                <span>Pricing tier</span>
                <select value={state.shared.pricingTierId} onChange={(e) => updateShared('pricingTierId', e.target.value)}>
                  <option value="">{selectedClient ? `Client default (${pricingTiers.find((t) => t.id === selectedClient.pricingTierId)?.name || 'none'})` : 'Use client default'}</option>
                  {pricingTiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              {/* Phase 132.2 — Quote-level margin override removed. Margin
                  is driven by the client's pricing tier, never by who's
                  building the quote. Tiers:
                    Wholesale (Yucca etc.) → 23%
                    Retail (small/walk-in) → 85%
                    Special (Daniel)       → 40%
                    Volume (large qty)     → 35–65% (qty-tiered, future)
                  Per-line override stays as an admin-only escape hatch
                  inside the line card's "per-line overrides" panel. */}
              <label>
                <span>Sales owner</span>
                <input value={state.shared.salesOwnerName} onChange={(e) => updateShared('salesOwnerName', e.target.value)} placeholder="Your name" />
              </label>
              <label>
                <span>Plate billing</span>
                <select
                  value={state.shared.plateBilling}
                  onChange={(e) => updateShared('plateBilling', e.target.value as CalculatorState['shared']['plateBilling'])}
                >
                  <option value="upfront">Upfront one-off (separate line)</option>
                  <option value="amortized">Spread into bag price (no upfront)</option>
                </select>
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Line items ------------------------------------------------------ */}
      <section className="calculator2-lines">
        {state.lines.map((line, idx) => (
          <LineCard
            key={line.id}
            line={line}
            index={idx + 1}
            result={computation.lines[idx]}
            products={products}
            paperRates={paperRates}
            costProfiles={costProfiles}
            canViewInternalCosts={canViewInternalCosts}
            canEditPricing={canEditPricing}
            defaultPaperRegion={defaultPaperRegion}
            onChange={(patch) => updateLine(line.id, patch)}
            onDuplicate={() => duplicateLine(line.id)}
            onRemove={() => removeLine(line.id)}
          />
        ))}
        <button type="button" className="ghost-button calculator2-add-line" onClick={addLine}>
          + Add another line
        </button>
      </section>

      {/* Totals + actions ------------------------------------------------ */}
      <section className="card calculator2-totals">
        <h3>Totals</h3>
        <div className="calculator2-totals-grid">
          <div><span>Lines</span><strong>{computation.rollup.lineCount}</strong></div>
          <div><span>Total bags</span><strong>{formatNumber(computation.rollup.totalQuantity)}</strong></div>
          {canViewInternalCosts && (
            <div><span>Total cost</span><strong>{formatNumber(computation.rollup.totalCost, 2)}</strong></div>
          )}
          <div><span>Plates (setup)</span><strong>{formatNumber(computation.rollup.totalPlateFees, 2)}</strong></div>
          <div><span>Total quoted</span><strong>{formatNumber(computation.rollup.totalQuoted, 2)}</strong></div>
          {canViewInternalCosts && (
            <div><span>Blended margin</span><strong>{formatNumber(computation.rollup.blendedMarginPercent, 2)}%</strong></div>
          )}
          {canViewInternalCosts && (
            <div><span>Total paper kg</span><strong>{formatNumber(computation.rollup.totalPaperKg, 2)}</strong></div>
          )}
        </div>

        {blockingIssues.length > 0 && (
          <p className="muted calculator2-block-list">
            Before saving: {blockingIssues.join(' · ')}
          </p>
        )}
        {savedMessage && (
          <p className={savedMessage.startsWith('Save failed') ? 'callout error' : 'muted'}>{savedMessage}</p>
        )}

        {/* Phase 118.2 — "Add to existing quote" picker. Only renders when
            the calculator's selected client has at least one calculator-
            sourced quote batch open. Picking a target changes the Save
            button below from "Save as new quote" → "Add to QTE-#####".
            This avoids creating noisy new QTE numbers when the customer
            just asked for "one more thing" on an existing quote. */}
        {batchesForClient.length > 0 && onAppendToQuote ? (
          <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, color: 'var(--jp-ink-2, #475569)' }}>
              Save target:
            </label>
            <select
              value={appendTargetBatch}
              onChange={(e) => setAppendTargetBatch(e.target.value)}
              style={{ padding: '6px 8px', fontSize: 13 }}
            >
              <option value="">— New quote —</option>
              {batchesForClient.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  Add to {b.baseNumber} ({b.lineCount} line{b.lineCount === 1 ? '' : 's'})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="calculator2-actions">
          <button type="button" className="ghost-button" onClick={reset} disabled={saving}>Reset</button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setPrinting(true)}
            disabled={computation.rollup.totalQuantity === 0}
          >
            Print Quote
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleSaveAsQuote}
            disabled={saving || blockingIssues.length > 0 || !onSaveAsQuote || (!!appendTargetBatch && !onAppendToQuote)}
          >
            {saving ? 'Saving…' : (appendTargetBatch
              ? `Add to ${batchesForClient.find((b) => b.batchId === appendTargetBatch)?.baseNumber ?? 'quote'}`
              : 'Save as Quote')}
          </button>
          {/* Phase 86 — direct-to-invoice for clients who skip the quote step
              (already approved, accounts can post straight away). */}
          <button
            type="button"
            className="primary-button"
            onClick={() => onSaveAsInvoice && onSaveAsInvoice(state)}
            disabled={blockingIssues.length > 0 || !onSaveAsInvoice}
            title="Pre-fill an Invoice from this calculation. Sales / accounts confirm + post on the Invoice page."
          >
            Save as Invoice →
          </button>
        </div>
      </section>

      {/* If the form is empty / no products, give the user a nudge. */}
      {clients.length === 0 || paperRates.length === 0 || costProfiles.length === 0 ? (
        <EmptyState
          title="Set up your masters first"
          body="The calculator needs at least one client, one active paper rate, and one active cost profile to produce a number."
        />
      ) : null}
    </div>
  );
}

/* ─── Line card ───────────────────────────────────────────────────────── */

interface LineCardProps {
  line: CalculatorLineItem;
  index: number;
  result: LineResult;
  products: Product[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  canViewInternalCosts: boolean;
  /** Phase 90 — admin-only. Gates the per-line overrides block. */
  canEditPricing?: boolean;
  /** Phase 131.3 — Branch region preference for the paper picker. */
  defaultPaperRegion?: import('../../types').PaperRegion;
  onChange: (patch: Partial<CalculatorLineItem>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function LineCard({
  line,
  index,
  result,
  products,
  paperRates,
  costProfiles,
  canViewInternalCosts,
  canEditPricing = false,
  defaultPaperRegion,
  onChange,
  onDuplicate,
  onRemove,
}: LineCardProps) {
  const [showOverrides, setShowOverrides] = useState(false);
  // Phase 87 — unlocks bag dimensions + handle when a product is picked
  // (the rare "I want a custom variant" case). Hidden by default so the
  // line just shows 'From product: 210×120×280' as a summary.
  const [showSpecOverride, setShowSpecOverride] = useState(false);
  // Phase 91 — admin's discount what-if input. Pure UI state, never
  // persisted. Shows the resulting margin if the line were quoted at
  // this price, so the CEO can sanity-check a discount before applying
  // it via the margin override above.
  const [whatIfPrice, setWhatIfPrice] = useState('');

  return (
    <div className="card calculator2-line-card">
      <header className="calculator2-line-header">
        {/* Phase 132.5 — Renamed SKU → Line. The line is just one
            calculation in the quote, not a stock-keeping unit. */}
        <h4>Line {index}{line.productName ? ` — ${line.productName}` : ''}</h4>
        <div className="calculator2-line-actions">
          <button type="button" className="link-button" onClick={onDuplicate}>Duplicate</button>
          <button type="button" className="link-button calculator2-remove" onClick={onRemove}>Remove</button>
        </div>
      </header>

      <div className="calculator2-line-grid">
        <label>
          <span>Product</span>
          <select
            value={line.productId}
            onChange={(e) => {
              const product = products.find((p) => p.id === e.target.value);
              // Phase 87 + 88 — auto-fill bag spec + handle, AND inherit the
              // product's base margin %. When a stock Product is picked the
              // line is conceptually "branded version of stock product X" —
              // base price + product margin come from the catalogue; the
              // calculator only adds print cost on top. customMarginPercent
              // gets the product margin so the engine has something to use
              // until cost masters are wired in for real.
              const inheritedMargin = product?.pricingSpec?.baseMarginPercent
                ? String(product.pricingSpec.baseMarginPercent)
                : line.customMarginPercent;
              onChange({
                productId: e.target.value,
                productName: product?.name || line.productName,
                bagWidthMm: product?.bagWidthMm ?? line.bagWidthMm,
                bagHeightMm: product?.bagHeightMm ?? line.bagHeightMm,
                gussetMm: product?.gussetMm ?? line.gussetMm,
                handleType: (product?.handleType ?? line.handleType) as HandleType,
                customMarginPercent: inheritedMargin,
              });
            }}
          >
            <option value="">— pick or type below —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>
          <span>SKU name / description</span>
          <input
            value={line.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="e.g. SOS Brown 70gsm 12x7x22"
          />
        </label>
        <label className="calculator2-grid-span-2">
          <span>Description (printed on quote)</span>
          <input
            value={line.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Free-text line shown to the customer"
          />
        </label>

        {/* Phase 87 + 88 — when a stock Product is picked, the line is
            'branded version of stock product X'. Base unit cost (paper +
            bag-making + handle) and the product margin come from the
            catalogue automatically. The calculator only computes what the
            BRANDING adds on top — print method, colours, coverage, plates,
            ink. The summary chip below makes that model explicit. */}
        {line.productId ? (
          <div className="calculator2-grid-span-2" style={{
            fontSize: 12,
            padding: '8px 12px',
            background: 'var(--jp-paper-2, #faf8f4)',
            border: '1px solid var(--jp-line, #e6e0d3)',
            borderRadius: 8,
            color: 'var(--jp-ink-2, #6f6657)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
          }}>
            <span className="badge badge-success" style={{ fontSize: 10 }}>Stock product</span>
            <span>
              <strong>{[line.bagWidthMm, line.bagHeightMm, line.gussetMm].filter(Boolean).join(' × ') || '— dimensions not on product yet —'}</strong>
              {line.handleType && line.handleType !== 'None' ? ` · ${line.handleType}` : ''}
            </span>
            {(() => {
              const product = products.find((p) => p.id === line.productId);
              const margin = product?.pricingSpec?.baseMarginPercent;
              return margin ? <span className="muted">· margin {margin}% (inherited)</span> : null;
            })()}
            <span className="muted" style={{ flexBasis: '100%', fontSize: 11 }}>
              Spec + margin pull from the product. The calculator only adds the cost of branding (plates / ink / coverage / colours) on top. For an unprinted-only quote, just save without filling the print fields.
            </span>
            <button
              type="button"
              className="link-button"
              style={{ fontSize: 11 }}
              onClick={() => setShowSpecOverride((v) => !v)}
            >{showSpecOverride ? 'Hide spec override' : 'Override spec'}</button>
          </div>
        ) : null}

        {(!line.productId || showSpecOverride) ? (
          <>
            {/* Phase 132.1 — Aman's bag dimensions: Face / Gusset / Height.
                Engine derives the cut sheet via:
                  width  = (face + gusset) × 2 + glue allowance
                  length = (gusset / 2) + 20 + height */}
            <label>
              <span>Face (mm)</span>
              <input type="number" inputMode="decimal" min="0" placeholder="e.g. 300" value={line.bagWidthMm} onChange={(e) => onChange({ bagWidthMm: e.target.value })} />
            </label>
            <label>
              <span>Gusset (mm)</span>
              <input type="number" inputMode="decimal" min="0" placeholder="e.g. 150" value={line.gussetMm} onChange={(e) => onChange({ gussetMm: e.target.value })} />
            </label>
            <label>
              <span>Height (mm)</span>
              <input type="number" inputMode="decimal" min="0" placeholder="e.g. 350" value={line.bagHeightMm} onChange={(e) => onChange({ bagHeightMm: e.target.value })} />
            </label>
            {/* Phase 132.5 — Glue allowance is a production detail, not a
                sales decision. Admin-only. Default 30mm applies for sales. */}
            {canEditPricing ? (
              <label>
                <span>Glue allowance (mm)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="30"
                  value={line.glueAllowanceMm}
                  onChange={(e) => onChange({ glueAllowanceMm: e.target.value })}
                />
              </label>
            ) : null}
            <label>
              <span>Handle</span>
              <select value={line.handleType} onChange={(e) => onChange({ handleType: e.target.value as HandleType })}>
                {HANDLE_OPTIONS.map((h) => <option key={h} value={h}>{HANDLE_LABELS[h] || h}</option>)}
                {/* Surface legacy handle types when a saved quote uses them
                    so editing doesn't silently downgrade the selection. */}
                {line.handleType && !HANDLE_OPTIONS.includes(line.handleType) ? (
                  <option value={line.handleType}>{HANDLE_LABELS[line.handleType] || line.handleType}</option>
                ) : null}
              </select>
            </label>
          </>
        ) : null}

        <label>
          <span>Quantity</span>
          <input type="number" inputMode="numeric" min="0" value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })} />
        </label>

        {/* Phase 132.1 — Print method is auto-resolved from quantity by
            default (small qty → Screen Print, large qty → Flexo, threshold
            in Cost Profile). Salespeople don't see the picker. Admins
            can force a method via the per-line overrides toggle below. */}
        {canEditPricing ? (
          <label>
            <span>Print method</span>
            <select value={line.printMethod} onChange={(e) => onChange({ printMethod: e.target.value as PrintMethod })}>
              {PRINT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        ) : null}
        <label>
          <span>Colours</span>
          <input type="number" inputMode="numeric" min="0" value={line.colors} onChange={(e) => onChange({ colors: e.target.value })} />
        </label>
        <label>
          <span>Coverage</span>
          <select value={line.coverageBand} onChange={(e) => onChange({ coverageBand: e.target.value as PrintCoverageBand })}>
            {COVERAGE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span>Print area (cm²)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={line.printAreaCm2}
            onChange={(e) => onChange({ printAreaCm2: e.target.value })}
            placeholder="W × H of artwork"
          />
        </label>
        {/* Phase 132.3/132.5 — Per-line plate charge override. Admin-only
            (sales shouldn't decide pricing). Only renders when colours > 0. */}
        {canEditPricing && Number(line.colors) > 0 ? (
          <label>
            <span>Plate charge / cm² (R)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={line.platePerSqCmChargeOverride}
              onChange={(e) => onChange({ platePerSqCmChargeOverride: e.target.value })}
              placeholder="2.65 (default)"
            />
          </label>
        ) : null}
      </div>

      {/* Phase 90 — admin-only. Sales doesn't see paper / profile / margin
          overrides; they take the company-standard price as-is. */}
      {canEditPricing ? (
        <button
          type="button"
          className="link-button calculator2-overrides-toggle"
          onClick={() => setShowOverrides((v) => !v)}
        >
          {showOverrides ? 'Hide' : 'Show'} per-line paper / profile / margin overrides
        </button>
      ) : null}
      {showOverrides && (
        <div className="calculator2-line-grid">
          <label>
            <span>Paper (override)</span>
            <select value={line.paperRateIdOverride} onChange={(e) => onChange({ paperRateIdOverride: e.target.value })}>
              <option value="">Inherit from header</option>
              {/* Phase 131.3 — Same dedupe pattern as the header picker:
                  prefer rows matching defaultPaperRegion; otherwise pick
                  the MOST EXPENSIVE row per publicLabel. */}
              {(() => {
                const preferredRegion = defaultPaperRegion;
                const groups = new Map<string, PaperRate>();
                paperRates.filter((r) => r.active).forEach((r) => {
                  const key = r.publicLabel || `${r.gsm}gsm ${r.paperType}`.trim() || r.name;
                  const existing = groups.get(key);
                  const rCharge = r.chargePerTon ?? r.pricePerTon;
                  const existingCharge = existing ? (existing.chargePerTon ?? existing.pricePerTon) : -1;
                  const rMatchesRegion = preferredRegion && r.region === preferredRegion;
                  const existingMatchesRegion = preferredRegion && existing?.region === preferredRegion;
                  let take = false;
                  if (!existing) take = true;
                  else if (rMatchesRegion && !existingMatchesRegion) take = true;
                  else if (!rMatchesRegion && existingMatchesRegion) take = false;
                  else take = rCharge > existingCharge;
                  if (take) groups.set(key, r);
                });
                const out = Array.from(groups.values());
                if (line.paperRateIdOverride) {
                  const sel = paperRates.find((r) => r.id === line.paperRateIdOverride);
                  if (sel && !out.some((r) => r.id === sel.id)) out.push(sel);
                }
                return out
                  .sort((a, b) => (a.publicLabel || a.name).localeCompare(b.publicLabel || b.name))
                  .map((r) => {
                    const label = r.publicLabel || `${r.gsm}gsm ${r.paperType}`.trim() || r.name;
                    return <option key={r.id} value={r.id}>{label}</option>;
                  });
              })()}
            </select>
          </label>
          <label>
            <span>Cost profile (override)</span>
            <select value={line.costProfileIdOverride} onChange={(e) => onChange({ costProfileIdOverride: e.target.value })}>
              <option value="">Inherit from header</option>
              {costProfiles.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          {/* Phase 87 — per-line margin lives in the overrides block now.
              By default the line uses the header margin (or client tier);
              this is the escape hatch for unusual lines. */}
          <label>
            <span>Margin % (override)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={line.customMarginPercent}
              onChange={(e) => onChange({ customMarginPercent: e.target.value })}
              placeholder="Inherit from header / client tier"
            />
          </label>
          {/* Phase 91 — discount reason captured next to the margin override
              so the audit trail says why this client got a special price. */}
          <label className="calculator2-grid-span-2">
            <span>Discount reason (saved on the quote)</span>
            <input
              value={line.discountReason ?? ''}
              onChange={(e) => onChange({ discountReason: e.target.value })}
              placeholder="e.g. Repeat customer — match competitor R0.52 / Bulk order — 50k unit commitment"
            />
          </label>
        </div>
      )}

      {/* Phase 132.5 — RESULT panel. Salespeople ONLY see:
            Per-bag price · Plates · Line total
          Admin can expand the cost breakdown via the toggle below.
          Sheet dimensions + cost components are noise for sales — they
          belong on the production work-ticket, not the quote. */}
      <div className="calculator2-line-result" style={{
        background: 'var(--jp-paper-2, #faf8f4)',
        border: '1px solid var(--jp-line, #e6e0d3)',
        borderRadius: 10,
        padding: '12px 14px',
        marginTop: 12,
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>PER-BAG PRICE</span>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
            R {formatNumber(result.quotedUnitPrice, 4)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>
            {result.platesAmortized ? 'PLATES (in unit price)' : 'PLATES (upfront)'}
          </span>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
            {result.platesAmortized
              ? `+R ${formatNumber(result.platePerBagAmortized, 4)} / bag`
              : `R ${formatNumber(result.plateSetupFee, 2)}`}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>LINE TOTAL</span>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: '#065f46' }}>
            R {formatNumber(result.lineTotal, 2)}
          </div>
        </div>
      </div>

      {/* Phase 132.5 — Admin-only cost breakdown, collapsed by default.
          For production / costing analysis — not part of the sales view. */}
      {canViewInternalCosts ? (
        <details style={{ marginTop: 10 }}>
          <summary style={{
            cursor: 'pointer', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)',
            padding: '6px 0',
          }}>SHOW COST BREAKDOWN (admin only)</summary>
          <div className="calculator2-line-result" style={{ marginTop: 8 }}>
            <div><span>Print resolved</span><strong>{result.resolvedPrintMethod}</strong></div>
            <div><span>Sheet size</span><strong>{formatNumber(result.recommendedPaperWidthMm, 1)} × {formatNumber(result.recommendedSheetHeightMm, 1)}mm</strong></div>
            <div><span>Paper / bag</span><strong>{formatNumber(result.paperPerBag, 4)}</strong></div>
            <div><span>Handle / bag</span><strong>{formatNumber(result.handlePerBag, 4)}</strong></div>
            <div><span>Print / bag</span><strong>{formatNumber(result.printBandChargePerBag, 4)}</strong></div>
            <div><span>Glue / bag</span><strong>{formatNumber(result.glueOnlyPerBag, 4)}</strong></div>
            <div><span>Labour / bag</span><strong>{formatNumber(result.labourPerBag, 4)}</strong></div>
            <div><span>Pack / bag</span><strong>{formatNumber(result.packagingPerBag, 4)}</strong></div>
            <div><span>Transport / bag</span><strong>{formatNumber(result.transportPerBag, 4)}</strong></div>
            <div><span>Unit cost</span><strong>{formatNumber(result.unitCost, 4)}</strong></div>
            <div><span>Margin %</span><strong>{formatNumber(result.marginPercent, 2)}%</strong></div>
            <div><span>Plate cost</span><strong>{formatNumber(result.plateCost, 2)}</strong></div>
          </div>
        </details>
      ) : null}

      {/* Phase 91 — CEO discount mode. Admin-only widget for sanity-
          checking a discount before applying it. Shows cost, current
          margin, and a what-if calculator: 'if I quote at R0.42, my
          margin drops to 12.5%'. Nothing here is persisted — once the
          CEO is happy with a number they apply it via the margin
          override above. */}
      {canEditPricing && result.unitCost > 0 ? (
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'var(--jp-paper-2, #faf8f4)',
          border: '1px dashed var(--jp-accent, #2563eb)',
          borderRadius: 8,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 14,
          fontSize: 12,
        }}>
          <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            CEO discount mode
          </strong>
          <span className="muted">
            Cost <strong>R {formatNumber(result.unitCost, 4)}</strong>
          </span>
          <span className="muted">
            Standard <strong>R {formatNumber(result.quotedUnitPrice, 4)}</strong>
            {' '}@ <strong>{formatNumber(result.marginPercent, 1)}%</strong>
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--jp-ink-3, #6f6657)' }}>
              What if quoted at R
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.0001"
              value={whatIfPrice}
              onChange={(e) => setWhatIfPrice(e.target.value)}
              placeholder={result.quotedUnitPrice.toFixed(4)}
              style={{ width: 80, padding: '2px 6px', fontSize: 12 }}
            />
            <span>/ bag</span>
          </label>
          {(() => {
            const target = Number(whatIfPrice);
            if (!whatIfPrice || !Number.isFinite(target) || target <= 0) return null;
            const margin = ((target - result.unitCost) / result.unitCost) * 100;
            const lineRevenue = target * (Number(line.quantity) || 0);
            const isLoss = margin < 0;
            const isThin = margin >= 0 && margin < 10;
            const colour = isLoss ? '#b22b2b' : isThin ? '#b8860b' : '#2e6f3e';
            return (
              <span style={{ color: colour }}>
                → margin <strong>{formatNumber(margin, 1)}%</strong>
                {' '}· line total <strong>R {formatNumber(lineRevenue, 2)}</strong>
                {isLoss ? ' (below cost!)' : isThin ? ' (thin)' : ''}
              </span>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}
