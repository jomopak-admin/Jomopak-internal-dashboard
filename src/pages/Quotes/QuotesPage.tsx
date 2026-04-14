import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, CostProfile, PaperRate, PricingTier, Product, QuoteEstimate, QuoteEstimateFilters, QuoteEstimateFormState } from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface QuotesPageProps {
  monthOptions: string[];
  clients: Client[];
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
}

export function QuotesPage({
  monthOptions,
  clients,
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
}: QuotesPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

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

  return (
    <>
      <SectionTitle
        title="Quotes & Estimates"
        subtitle="Save quoted prices and estimate assumptions before they become live jobs."
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Quote</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Quotes</button>}
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{quoteEditingId ? 'Edit quote' : 'New quote'}</h3></div>
          {quoteMessage ? <div className="message-strip">{quoteMessage}</div> : null}
          <div className="form-grid">
            <label><span>Quote date</span><input type="date" value={quoteForm.quoteDate} onChange={(event) => setQuoteForm({ ...quoteForm, quoteDate: event.target.value })} /></label>
            <label><span>QuickBooks estimate #</span><input value={quoteForm.quickbooksEstimateNumber} onChange={(event) => setQuoteForm({ ...quoteForm, quickbooksEstimateNumber: event.target.value })} placeholder="Optional reference" /></label>
            <label><span>Client</span><select value={quoteForm.clientId} onChange={(event) => setQuoteForm({ ...quoteForm, clientId: event.target.value })}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label><span>Product</span><select value={quoteForm.productId} onChange={(event) => setQuoteForm({ ...quoteForm, productId: event.target.value })}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label><span>Pricing tier</span><select value={quoteForm.pricingTierId} onChange={(event) => setQuoteForm({ ...quoteForm, pricingTierId: event.target.value })}><option value="">Select pricing tier</option>{pricingTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></label>
            <label><span>Paper rate</span><select value={quoteForm.paperRateId} onChange={(event) => setQuoteForm({ ...quoteForm, paperRateId: event.target.value })}><option value="">Select paper rate</option>{paperRates.filter((rate) => rate.active).map((rate) => <option key={rate.id} value={rate.id}>{rate.name}</option>)}</select></label>
            <label><span>Cost profile</span><select value={quoteForm.costProfileId} onChange={(event) => setQuoteForm({ ...quoteForm, costProfileId: event.target.value })}><option value="">Select cost profile</option>{costProfiles.filter((profile) => profile.active).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
            <label><span>Quantity</span><input type="number" min="0" value={quoteForm.quantity} onChange={(event) => setQuoteForm({ ...quoteForm, quantity: event.target.value })} /></label>
            <label><span>Size spec</span><input value={quoteForm.sizeSpec} onChange={(event) => setQuoteForm({ ...quoteForm, sizeSpec: event.target.value })} /></label>
            <label><span>Handle type</span><select value={quoteForm.handleType} onChange={(event) => setQuoteForm({ ...quoteForm, handleType: event.target.value as QuoteEstimateFormState['handleType'] })}><option value="None">None</option><option value="Flat Handle">Flat Handle</option><option value="Rope Handle">Rope Handle</option><option value="Roll Handle">Roll Handle</option></select></label>
            <label><span>Print method</span><select value={quoteForm.printMethod} onChange={(event) => setQuoteForm({ ...quoteForm, printMethod: event.target.value as QuoteEstimateFormState['printMethod'] })}><option value="Auto">Auto</option><option value="Plain">Plain</option><option value="Screen Print">Screen Print</option><option value="Flexo">Flexo</option></select></label>
            <label><span>Colors</span><input type="number" min="0" value={quoteForm.colors} onChange={(event) => setQuoteForm({ ...quoteForm, colors: event.target.value })} /></label>
            <label><span>Unit cost</span><input type="number" min="0" step="0.0001" value={quoteForm.unitCost} onChange={(event) => setQuoteForm({ ...quoteForm, unitCost: event.target.value })} /></label>
            <label><span>Quoted unit price</span><input type="number" min="0" step="0.0001" value={quoteForm.quotedUnitPrice} onChange={(event) => setQuoteForm({ ...quoteForm, quotedUnitPrice: event.target.value })} /></label>
            <label><span>Total quote</span><input type="number" min="0" step="0.01" value={quoteForm.totalQuote} onChange={(event) => setQuoteForm({ ...quoteForm, totalQuote: event.target.value })} /></label>
            <label><span>Status</span><select value={quoteForm.status} onChange={(event) => setQuoteForm({ ...quoteForm, status: event.target.value as QuoteEstimateFormState['status'] })}><option value="Draft">Draft</option><option value="Quoted">Quoted</option><option value="Approved">Approved</option><option value="Converted to Job">Converted to Job</option><option value="Lost">Lost</option></select></label>
            <label className="full-span"><span>Notes</span><textarea value={quoteForm.notes} onChange={(event) => setQuoteForm({ ...quoteForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{quoteEditingId ? 'Save Changes' : 'Save Quote'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Quote register" subtitle={`${filteredQuotes.length} quote(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={quoteFilters.search} onChange={(event) => setQuoteFilters({ ...quoteFilters, search: event.target.value })} /></label>
            <label><span>Month</span><select value={quoteFilters.month} onChange={(event) => setQuoteFilters({ ...quoteFilters, month: event.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Status</span><select value={quoteFilters.status} onChange={(event) => setQuoteFilters({ ...quoteFilters, status: event.target.value })}><option value="">All statuses</option><option value="Draft">Draft</option><option value="Quoted">Quoted</option><option value="Approved">Approved</option><option value="Converted to Job">Converted to Job</option><option value="Lost">Lost</option></select></label>
            <label><span>Client</span><input value={quoteFilters.client} onChange={(event) => setQuoteFilters({ ...quoteFilters, client: event.target.value })} /></label>
          </div>
          {filteredQuotes.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Quote</th><th>Date</th><th>Client</th><th>Product</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{filteredQuotes.map((quote) => <tr key={quote.id}><td><strong>{quote.quoteNumber}</strong><div className="table-subtext">{quote.quickbooksEstimateNumber ? `QB ${quote.quickbooksEstimateNumber}` : (quote.sizeSpec || 'No size')}</div></td><td>{formatDate(quote.quoteDate)}</td><td>{quote.clientName}</td><td>{quote.productName}</td><td>{formatNumber(quote.totalQuote, 2)}</td><td>{quote.status}</td><td><button className="table-button" onClick={() => { onEdit(quote); setMode('form'); }}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No quotes yet" body="Save estimates here before converting them into jobs." />}
        </section>
      )}
    </>
  );
}
