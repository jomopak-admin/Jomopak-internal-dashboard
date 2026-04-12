import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { PricingTier, PricingTierFilters, PricingTierFormState } from '../../types';

interface PricingTiersPageProps {
  tierForm: PricingTierFormState;
  setTierForm: (value: PricingTierFormState) => void;
  tierEditingId: string | null;
  tierMessage: string;
  onSave: () => void;
  onReset: () => void;
  tierFilters: PricingTierFilters;
  setTierFilters: (value: PricingTierFilters) => void;
  filteredPricingTiers: PricingTier[];
  onEdit: (tier: PricingTier) => void;
}

export function PricingTiersPage({
  tierForm,
  setTierForm,
  tierEditingId,
  tierMessage,
  onSave,
  onReset,
  tierFilters,
  setTierFilters,
  filteredPricingTiers,
  onEdit,
}: PricingTiersPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (tierEditingId) {
      setMode('form');
    }
  }, [tierEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(tier: PricingTier) {
    onEdit(tier);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Pricing Tiers"
        subtitle="Set default commercial rules such as wholesale, retail, and ecommerce before building the estimator."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Pricing Tier</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Pricing Tiers</button>
          )
        }
      />
      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{tierEditingId ? 'Edit pricing tier' : 'New pricing tier'}</h3></div>
          {tierMessage ? <div className="message-strip">{tierMessage}</div> : null}
          <div className="form-grid">
            <label><span>Name</span><input value={tierForm.name} onChange={(event) => setTierForm({ ...tierForm, name: event.target.value })} /></label>
            <label><span>Type</span><select value={tierForm.type} onChange={(event) => setTierForm({ ...tierForm, type: event.target.value as PricingTier['type'] })}><option>Wholesale</option><option>Retail</option><option>Ecommerce</option><option>Custom</option></select></label>
            <label><span>Default margin %</span><input type="number" min="0" value={tierForm.defaultMarginPercent} onChange={(event) => setTierForm({ ...tierForm, defaultMarginPercent: event.target.value })} /></label>
            <label><span>Branding margin %</span><input type="number" min="0" value={tierForm.brandingMarginPercent} onChange={(event) => setTierForm({ ...tierForm, brandingMarginPercent: event.target.value })} /></label>
            <label className="full-span"><span>Notes</span><textarea value={tierForm.notes} onChange={(event) => setTierForm({ ...tierForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row"><button className="primary-button" onClick={onSave}>{tierEditingId ? 'Save Changes' : 'Save Pricing Tier'}</button><button className="ghost-button" onClick={handleBackToList}>Cancel</button></div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Pricing tiers" subtitle={`${filteredPricingTiers.length} record(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={tierFilters.search} onChange={(event) => setTierFilters({ ...tierFilters, search: event.target.value })} /></label>
            <label><span>Type</span><select value={tierFilters.type} onChange={(event) => setTierFilters({ ...tierFilters, type: event.target.value })}><option value="">All</option><option>Wholesale</option><option>Retail</option><option>Ecommerce</option><option>Custom</option></select></label>
          </div>
          {filteredPricingTiers.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Type</th><th>Default margin</th><th>Branding margin</th><th>Actions</th></tr></thead>
                <tbody>{filteredPricingTiers.map((tier) => <tr key={tier.id}><td>{tier.name}</td><td>{tier.type}</td><td>{tier.defaultMarginPercent}%</td><td>{tier.brandingMarginPercent}%</td><td><button className="table-button" onClick={() => handleStartEdit(tier)}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No pricing tiers yet" body="Create pricing rules before building client-specific estimating." />}
        </section>
      )}
    </>
  );
}
