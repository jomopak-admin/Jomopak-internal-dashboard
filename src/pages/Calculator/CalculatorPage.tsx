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
  clients: Client[];
  products: Product[];
  pricingTiers: PricingTier[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  leads?: Lead[];
  state: CalculatorState;
  setState: (next: CalculatorState) => void;
  /** Callback wired in App.tsx — receives the calculator state. The host
   *  is responsible for translating it into one or more QuoteEstimate
   *  records and persisting them. Should return the new quote number(s)
   *  so we can show a confirmation. */
  onSaveAsQuote?: (state: CalculatorState) => Promise<{ quoteNumbers: string[] }> | { quoteNumbers: string[] };
  /** Company + footer for the printable quote. */
  company?: AppSettingsCompany;
  defaultFooterLines?: string[];
  preparedByName?: string;
  today?: string;
}

const HANDLE_OPTIONS: HandleType[] = ['None', 'Flat Handle', 'Rope Handle', 'Roll Handle'];
const PRINT_OPTIONS: PrintMethod[] = ['Auto', 'Plain', 'Screen Print', 'Flexo'];
const COVERAGE_OPTIONS: PrintCoverageBand[] = ['None', 'Light', 'Medium', 'Heavy'];

export function CalculatorPage({
  canViewInternalCosts,
  clients,
  products,
  pricingTiers,
  paperRates,
  costProfiles,
  leads = [],
  state,
  setState,
  onSaveAsQuote,
  company,
  defaultFooterLines,
  preparedByName,
  today,
}: CalculatorPageProps) {
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [printing, setPrinting] = useState(false);

  // Live computation runs on every render. Pure function — no perf cost.
  const computation = useMemo(
    () => computeQuote(state, { clients, pricingTiers, paperRates, costProfiles }),
    [state, clients, pricingTiers, paperRates, costProfiles],
  );

  const selectedClient = clients.find((c) => c.id === state.shared.clientId);
  const clientLeads = leads.filter((l) => !state.shared.clientId || l.clientId === state.shared.clientId);

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

  async function handleSaveAsQuote() {
    if (!onSaveAsQuote) return;
    if (!state.shared.clientId) {
      setSavedMessage('Pick a client before saving.');
      return;
    }
    if (computation.rollup.totalQuantity === 0) {
      setSavedMessage('Add at least one line with a quantity.');
      return;
    }
    setSaving(true);
    setSavedMessage('Saving…');
    try {
      const result = await onSaveAsQuote(state);
      setSavedMessage(`Saved quote${result.quoteNumbers.length > 1 ? 's' : ''}: ${result.quoteNumbers.join(', ')}`);
    } catch (e: any) {
      setSavedMessage(`Save failed: ${e?.message || 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  const blockingIssues: string[] = [];
  if (!state.shared.clientId) blockingIssues.push('Pick a client');
  if (!state.shared.paperRateId) blockingIssues.push('Pick a paper rate');
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
        <div className="calculator2-shared-grid">
          <label>
            <span>Client *</span>
            <select value={state.shared.clientId} onChange={(e) => updateShared('clientId', e.target.value)}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
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
          <label>
            <span>Paper rate *</span>
            <select value={state.shared.paperRateId} onChange={(e) => updateShared('paperRateId', e.target.value)}>
              <option value="">Select paper rate</option>
              {paperRates.filter((r) => r.active).map((r) => (
                <option key={r.id} value={r.id}>{r.name} · {r.gsm}gsm · {r.pricePerTon}/t</option>
              ))}
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
            <span>Quote-level margin %</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={state.shared.customMarginPercent}
              onChange={(e) => updateShared('customMarginPercent', e.target.value)}
              placeholder="Blank = tier/profile default"
            />
          </label>
          <label>
            <span>Quote date</span>
            <input type="date" value={state.shared.quoteDate} onChange={(e) => updateShared('quoteDate', e.target.value)} />
          </label>
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
            onChange={(patch) => updateLine(line.id, patch)}
            onDuplicate={() => duplicateLine(line.id)}
            onRemove={() => removeLine(line.id)}
          />
        ))}
        <button type="button" className="ghost-button calculator2-add-line" onClick={addLine}>
          + Add another SKU
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
            className="primary-button"
            onClick={handleSaveAsQuote}
            disabled={saving || blockingIssues.length > 0 || !onSaveAsQuote}
          >
            {saving ? 'Saving…' : 'Save as Quote'}
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
  onChange,
  onDuplicate,
  onRemove,
}: LineCardProps) {
  const [showOverrides, setShowOverrides] = useState(false);

  return (
    <div className="card calculator2-line-card">
      <header className="calculator2-line-header">
        <h4>SKU {index}{line.productName ? ` — ${line.productName}` : ''}</h4>
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
              onChange({
                productId: e.target.value,
                productName: product?.name || line.productName,
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

        <label>
          <span>Bag width (mm)</span>
          <input type="number" inputMode="decimal" min="0" value={line.bagWidthMm} onChange={(e) => onChange({ bagWidthMm: e.target.value })} />
        </label>
        <label>
          <span>Bag height (mm)</span>
          <input type="number" inputMode="decimal" min="0" value={line.bagHeightMm} onChange={(e) => onChange({ bagHeightMm: e.target.value })} />
        </label>
        <label>
          <span>Gusset (mm)</span>
          <input type="number" inputMode="decimal" min="0" value={line.gussetMm} onChange={(e) => onChange({ gussetMm: e.target.value })} />
        </label>
        <label>
          <span>Quantity</span>
          <input type="number" inputMode="numeric" min="0" value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })} />
        </label>

        <label>
          <span>Handle</span>
          <select value={line.handleType} onChange={(e) => onChange({ handleType: e.target.value as HandleType })}>
            {HANDLE_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
        <label>
          <span>Print method</span>
          <select value={line.printMethod} onChange={(e) => onChange({ printMethod: e.target.value as PrintMethod })}>
            {PRINT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
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
        <label>
          <span>Per-line margin %</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={line.customMarginPercent}
            onChange={(e) => onChange({ customMarginPercent: e.target.value })}
            placeholder="Inherit"
          />
        </label>
      </div>

      <button
        type="button"
        className="link-button calculator2-overrides-toggle"
        onClick={() => setShowOverrides((v) => !v)}
      >
        {showOverrides ? 'Hide' : 'Show'} per-line paper / profile overrides
      </button>
      {showOverrides && (
        <div className="calculator2-line-grid">
          <label>
            <span>Paper rate (override)</span>
            <select value={line.paperRateIdOverride} onChange={(e) => onChange({ paperRateIdOverride: e.target.value })}>
              <option value="">Inherit from header</option>
              {paperRates.filter((r) => r.active).map((r) => (
                <option key={r.id} value={r.id}>{r.name} · {r.gsm}gsm</option>
              ))}
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
        </div>
      )}

      {/* Live per-line numbers ----------------------------------------- */}
      <div className="calculator2-line-result">
        <div><span>Print resolved</span><strong>{result.resolvedPrintMethod}</strong></div>
        <div><span>Paper width</span><strong>{formatNumber(result.recommendedPaperWidthMm, 1)}mm</strong></div>
        <div><span>Sheet height</span><strong>{formatNumber(result.recommendedSheetHeightMm, 1)}mm</strong></div>
        {canViewInternalCosts && (
          <>
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
          </>
        )}
        <div className="calculator2-line-price"><span>Quoted unit price</span><strong>{formatNumber(result.quotedUnitPrice, 4)}</strong></div>
        <div className="calculator2-line-price">
          <span>{result.platesAmortized ? 'Plates (in unit price)' : 'Plates (upfront)'}</span>
          <strong>{result.platesAmortized ? `+${formatNumber(result.platePerBagAmortized, 4)}/bag` : formatNumber(result.plateSetupFee, 2)}</strong>
        </div>
        <div className="calculator2-line-price"><span>Line total</span><strong>{formatNumber(result.lineTotal, 2)}</strong></div>
      </div>
    </div>
  );
}
