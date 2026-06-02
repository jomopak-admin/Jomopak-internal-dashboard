import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import { WaitingOnPanel, countActiveBlockers, hasOverdueBlocker } from '../../components/WaitingOnPanel';
import { Client, CostProfile, Lead, PaperRate, PricingTier, Product, QuoteEstimate, QuoteEstimateFilters, QuoteEstimateFormState } from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface QuotesPageProps {
  monthOptions: string[];
  clients: Client[];
  leads: Lead[];
  products: Product[];
  pricingTiers: PricingTier[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  quoteForm: QuoteEstimateFormState;
  setQuoteForm: (value: QuoteEstimateFormState) => void;
  quoteEditingId: string | null;
  quoteMessage: string;
  onSave: () => void;
  onReset: () => void;
  quoteFilters: QuoteEstimateFilters;
  setQuoteFilters: (value: QuoteEstimateFilters) => void;
  filteredQuotes: QuoteEstimate[];
  onEdit: (quote: QuoteEstimate) => void;
  /**
   * Promote this quote to a Job. Caller pre-fills jobForm from the quote and
   * switches the view to 'jobs' so the user just confirms + saves. The quote
   * is auto-marked "Converted to Job" on the resulting Job save.
   */
  onConvertToJob?: (quote: QuoteEstimate) => void;
  /** Open the printable quote overlay. */
  onPrint?: (quote: QuoteEstimate) => void;
}

export function QuotesPage({
  monthOptions,
  clients,
  leads,
  products,
  pricingTiers,
  paperRates,
  costProfiles,
  quoteForm,
  setQuoteForm,
  quoteEditingId,
  quoteMessage,
  onSave,
  onReset,
  quoteFilters,
  setQuoteFilters,
  filteredQuotes,
  onEdit,
  onConvertToJob,
  onPrint,
}: QuotesPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  // Phase 117 — Toggle to filter the list to only quotes with active
  // blockers. Lives locally because it's a UI-only filter and doesn't
  // need to round-trip through QuoteEstimateFilters.
  const [waitingOnlyFilter, setWaitingOnlyFilter] = useState(false);
  const todayYMD = new Date().toISOString().slice(0, 10);
  const paperTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    return paperRates
      .filter((rate) => rate.active && rate.paperType)
      .filter((rate) => {
        const key = `${rate.paperType}::${rate.gsm}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }, [paperRates]);

  useEffect(() => {
    if (quoteEditingId) {
      setMode('form');
    }
  }, [quoteEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  // ---- searchable option lists for the Combobox ----
  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((client) => ({
      value: client.id,
      label: client.name,
      sublabel: client.companyName || client.code || undefined,
    })),
    [clients],
  );
  const leadOptions: ComboboxOption[] = useMemo(
    () => leads.map((lead) => ({
      value: lead.id,
      label: lead.leadNumber || `Lead ${lead.id.slice(-6)}`,
      sublabel: lead.companyName || lead.clientName || lead.contactName || undefined,
    })),
    [leads],
  );
  const productOptions: ComboboxOption[] = useMemo(
    () => products.map((product) => ({
      value: product.id,
      label: product.name,
      sublabel: [product.category, product.sku].filter(Boolean).join(' · ') || undefined,
    })),
    [products],
  );
  const paperRateOptions: ComboboxOption[] = useMemo(
    () => paperTypeOptions.map((rate) => ({
      value: rate.id,
      label: rate.gsm ? `${rate.paperType} (${rate.gsm})` : rate.paperType,
    })),
    [paperTypeOptions],
  );
  const costProfileOptions: ComboboxOption[] = useMemo(
    () => costProfiles.filter((profile) => profile.active).map((profile) => ({
      value: profile.id,
      label: profile.name,
    })),
    [costProfiles],
  );

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Quote header',
      subtitle: 'When this quote was prepared and how it ties back to other systems.',
      missingRequired: [
        ...(quoteForm.quoteDate ? [] : ['Quote date']),
        ...(quoteForm.clientId ? [] : ['Client']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Quote date <RequiredMarker /></span><input type="date" value={quoteForm.quoteDate} onChange={(event) => setQuoteForm({ ...quoteForm, quoteDate: event.target.value })} /></label>
          <label><span>Client <RequiredMarker /></span><Combobox options={clientOptions} value={quoteForm.clientId} onChange={(value) => setQuoteForm({ ...quoteForm, clientId: value })} placeholder="Search clients…" emptyMessage="No matching clients" /></label>
          <label><span>Linked lead</span><Combobox options={leadOptions} value={quoteForm.linkedLeadId} onChange={(value) => setQuoteForm({ ...quoteForm, linkedLeadId: value })} placeholder="Search leads…" emptyMessage="No matching leads" /></label>
          <label><span>QuickBooks estimate #</span><input value={quoteForm.quickbooksEstimateNumber} onChange={(event) => setQuoteForm({ ...quoteForm, quickbooksEstimateNumber: event.target.value })} placeholder="Optional reference" /></label>
        </div>
      ),
    },
    {
      key: 'product',
      title: 'Product & specification',
      subtitle: 'What is being quoted and the specification it should meet.',
      missingRequired: [
        ...(quoteForm.productId ? [] : ['Product']),
        ...(quoteForm.quantity && Number(quoteForm.quantity) > 0 ? [] : ['Quantity']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Product <RequiredMarker /></span><Combobox options={productOptions} value={quoteForm.productId} onChange={(value) => setQuoteForm({ ...quoteForm, productId: value })} placeholder="Search products…" emptyMessage="No matching products" /></label>
          <label><span>Quantity <RequiredMarker /></span><input type="number" min="0" value={quoteForm.quantity} onChange={(event) => setQuoteForm({ ...quoteForm, quantity: event.target.value })} /></label>
          <label><span>Size spec</span><input value={quoteForm.sizeSpec} onChange={(event) => setQuoteForm({ ...quoteForm, sizeSpec: event.target.value })} /></label>
          <label><span>Handle type</span><select value={quoteForm.handleType} onChange={(event) => setQuoteForm({ ...quoteForm, handleType: event.target.value as QuoteEstimateFormState['handleType'] })}><option value="None">None</option><option value="Flat Handle">Flat Handle</option><option value="Rope Handle">Rope Handle</option><option value="Roll Handle">Roll Handle</option></select></label>
          <label><span>Print method</span><select value={quoteForm.printMethod} onChange={(event) => setQuoteForm({ ...quoteForm, printMethod: event.target.value as QuoteEstimateFormState['printMethod'] })}><option value="Auto">Auto</option><option value="Plain">Plain</option><option value="Screen Print">Screen Print</option><option value="Flexo">Flexo</option></select></label>
          <label><span>Colors</span><input type="number" min="0" value={quoteForm.colors} onChange={(event) => setQuoteForm({ ...quoteForm, colors: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'pricing-inputs',
      title: 'Pricing inputs',
      subtitle: 'Pull a pricing tier, paper rate and cost profile so the calculator stays consistent.',
      body: (
        <div className="form-grid">
          <label><span>Pricing tier</span><select value={quoteForm.pricingTierId} onChange={(event) => setQuoteForm({ ...quoteForm, pricingTierId: event.target.value })}><option value="">Select pricing tier</option>{pricingTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></label>
          <label><span>Paper type</span><Combobox options={paperRateOptions} value={quoteForm.paperRateId} onChange={(value) => setQuoteForm({ ...quoteForm, paperRateId: value })} placeholder="Search paper types…" emptyMessage="No matching paper rates" /></label>
          <label><span>Cost profile</span><Combobox options={costProfileOptions} value={quoteForm.costProfileId} onChange={(value) => setQuoteForm({ ...quoteForm, costProfileId: value })} placeholder="Search cost profiles…" emptyMessage="No matching profiles" /></label>
        </div>
      ),
    },
    {
      key: 'pricing-outputs',
      title: 'Pricing outputs',
      subtitle: 'The numbers you commit to in the quote document.',
      body: (
        <div className="form-grid">
          <label><span>Unit cost</span><input type="number" min="0" step="0.0001" value={quoteForm.unitCost} onChange={(event) => setQuoteForm({ ...quoteForm, unitCost: event.target.value })} /></label>
          <label><span>Quoted unit price</span><input type="number" min="0" step="0.0001" value={quoteForm.quotedUnitPrice} onChange={(event) => setQuoteForm({ ...quoteForm, quotedUnitPrice: event.target.value })} /></label>
          <label><span>Total quote</span><input type="number" min="0" step="0.01" value={quoteForm.totalQuote} onChange={(event) => setQuoteForm({ ...quoteForm, totalQuote: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status & notes',
      subtitle: 'Where this quote is in the funnel and anything sales should remember.',
      body: (
        <div className="form-grid">
          <label><span>Status</span><select value={quoteForm.status} onChange={(event) => setQuoteForm({ ...quoteForm, status: event.target.value as QuoteEstimateFormState['status'] })}><option value="Draft">Draft</option><option value="Quoted">Quoted</option><option value="Approved">Approved</option><option value="Converted to Job">Converted to Job</option><option value="Lost">Lost</option></select></label>
          <label className="full-span"><span>Notes (internal)</span><textarea value={quoteForm.notes} onChange={(event) => setQuoteForm({ ...quoteForm, notes: event.target.value })} /></label>
          <label className="full-span"><span>Customer note (prints on quote)</span><textarea value={quoteForm.customerNote} onChange={(event) => setQuoteForm({ ...quoteForm, customerNote: event.target.value })} placeholder="Defaults from Settings → Templates; edit for this quote." /></label>
        </div>
      ),
    },
    // Phase 117 — Blockers parking this quote. Drops into its own section so
    // sales can find it instantly when they remember they're waiting on a
    // cost they haven't chased yet.
    {
      key: 'waitingOn',
      title: 'Waiting on',
      subtitle: 'Park anything blocking this quote — die cost, board cost, artwork approval. Overdue blockers light up on the dashboard.',
      body: (
        <WaitingOnPanel
          value={quoteForm.waitingOn}
          onChange={(next) => setQuoteForm({ ...quoteForm, waitingOn: next })}
        />
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Quote</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={handleBackToList}>← Back to Quotes</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={quoteEditingId ? 'Edit quote' : 'New quote'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={quoteMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!quoteEditingId}
          saveLabel="Save Quote"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Quote register" subtitle={`${filteredQuotes.length} quote(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={quoteFilters.search} onChange={(event) => setQuoteFilters({ ...quoteFilters, search: event.target.value })} /></label>
            <label><span>Month</span><select value={quoteFilters.month} onChange={(event) => setQuoteFilters({ ...quoteFilters, month: event.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Status</span><select value={quoteFilters.status} onChange={(event) => setQuoteFilters({ ...quoteFilters, status: event.target.value })}><option value="">All statuses</option><option value="Draft">Draft</option><option value="Quoted">Quoted</option><option value="Approved">Approved</option><option value="Converted to Job">Converted to Job</option><option value="Lost">Lost</option></select></label>
            <label><span>Client</span><input value={quoteFilters.client} onChange={(event) => setQuoteFilters({ ...quoteFilters, client: event.target.value })} /></label>
            {/* Phase 117 — Quick toggle: only show quotes with active blockers. */}
            <label className="checkbox-row" style={{ alignSelf: 'end' }}>
              <input type="checkbox" checked={waitingOnlyFilter} onChange={(event) => setWaitingOnlyFilter(event.target.checked)} />
              Only quotes waiting on something
            </label>
          </div>
          {(() => {
            const visible = waitingOnlyFilter
              ? filteredQuotes.filter((q) => countActiveBlockers(q.waitingOn) > 0)
              : filteredQuotes;
            return visible.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Quote</th><th>Date</th><th>Client</th><th>Product</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{visible.map((quote) => {
                  // Phase 117 — Compute blocker chip state per row.
                  const blockerCount = countActiveBlockers(quote.waitingOn);
                  const overdue = hasOverdueBlocker(quote.waitingOn, todayYMD);
                  return (
                    <tr key={quote.id}>
                      <td>
                        <strong>{quote.quoteNumber}</strong>
                        <div className="table-subtext">{quote.quickbooksEstimateNumber ? `QB ${quote.quickbooksEstimateNumber}` : (quote.sizeSpec || 'No size')}</div>
                        {blockerCount > 0 ? (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: 4,
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 999,
                              background: overdue ? 'rgba(219, 90, 31, 0.14)' : 'rgba(100, 116, 139, 0.14)',
                              color: overdue ? 'var(--jp-orange, #db5a1f)' : 'var(--jp-ink-3, #475569)',
                            }}
                            title={overdue ? 'Some blockers are past their expected-by date' : 'Has unresolved blockers'}
                          >
                            Waiting on {blockerCount}{overdue ? ' · overdue' : ''}
                          </span>
                        ) : null}
                      </td>
                      <td>{formatDate(quote.quoteDate)}</td>
                      <td>{quote.clientName}</td>
                      <td>{quote.productName}</td>
                      <td>{formatNumber(quote.totalQuote, 2)}</td>
                      <td>{quote.status}</td>
                      <td>
                        <button className="table-button" onClick={() => { onEdit(quote); setMode('form'); }}>Edit</button>
                        {onPrint ? <button className="table-button" onClick={() => onPrint(quote)} title="Print quote PDF">Print</button> : null}
                        {onConvertToJob && quote.status !== 'Converted to Job' && quote.status !== 'Lost' ? <button className="table-button table-button-promote" onClick={() => onConvertToJob(quote)} title="Create a job from this quote">→ Job</button> : null}
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          ) : <EmptyState title={waitingOnlyFilter ? 'No quotes are waiting on anything' : 'No quotes yet'} body={waitingOnlyFilter ? 'All your quotes have their blockers cleared — nice.' : 'Save estimates here before converting them into jobs.'} />;
          })()}
        </section>
      )}
    </>
  );
}
