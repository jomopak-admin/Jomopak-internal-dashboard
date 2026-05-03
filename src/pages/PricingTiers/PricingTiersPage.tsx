import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
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

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Tier identity',
      subtitle: 'How sales picks this tier when quoting.',
      missingRequired: [
        ...(tierForm.name.trim() ? [] : ['Name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Name <RequiredMarker /></span><input value={tierForm.name} onChange={(event) => setTierForm({ ...tierForm, name: event.target.value })} /></label>
          <label><span>Type</span><select value={tierForm.type} onChange={(event) => setTierForm({ ...tierForm, type: event.target.value as PricingTier['type'] })}><option>Wholesale</option><option>Retail</option><option>Ecommerce</option><option>Custom</option></select></label>
        </div>
      ),
    },
    {
      key: 'margins',
      title: 'Margins',
      subtitle: 'Default markup applied to costs from the calculator.',
      body: (
        <div className="form-grid">
          <label><span>Default margin %</span><input type="number" min="0" value={tierForm.defaultMarginPercent} onChange={(event) => setTierForm({ ...tierForm, defaultMarginPercent: event.target.value })} /></label>
          <label><span>Branding margin %</span><input type="number" min="0" value={tierForm.brandingMarginPercent} onChange={(event) => setTierForm({ ...tierForm, brandingMarginPercent: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      subtitle: 'When to use this tier vs other tiers.',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={tierForm.notes} onChange={(event) => setTierForm({ ...tierForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Pricing Tier</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Pricing Tiers</button>
          )
        }
      />
      {mode === 'form' ? (
        <FormWizard
          title={tierEditingId ? 'Edit pricing tier' : 'New pricing tier'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={tierMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!tierEditingId}
          saveLabel="Save Pricing Tier"
        />
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
