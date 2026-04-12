import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, ClientFilters, ClientFormState, PricingTier } from '../../types';

interface ClientsPageProps {
  pricingTiers: PricingTier[];
  clientForm: ClientFormState;
  setClientForm: (value: ClientFormState) => void;
  clientEditingId: string | null;
  clientMessage: string;
  onSave: () => void;
  onReset: () => void;
  clientFilters: ClientFilters;
  setClientFilters: (value: ClientFilters) => void;
  filteredClients: Client[];
  onEdit: (client: Client) => void;
}

export function ClientsPage({
  pricingTiers,
  clientForm,
  setClientForm,
  clientEditingId,
  clientMessage,
  onSave,
  onReset,
  clientFilters,
  setClientFilters,
  filteredClients,
  onEdit,
}: ClientsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (clientEditingId) {
      setMode('form');
    }
  }, [clientEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(client: Client) {
    onEdit(client);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Clients"
        subtitle="Store customers and attach pricing behavior so quotes and jobs start with the right commercial profile."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Client</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Clients</button>
          )
        }
      />
      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{clientEditingId ? 'Edit client' : 'New client'}</h3></div>
          {clientMessage ? <div className="message-strip">{clientMessage}</div> : null}
          <div className="form-grid">
            <label><span>Name</span><input value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} /></label>
            <label><span>Code</span><input value={clientForm.code} onChange={(event) => setClientForm({ ...clientForm, code: event.target.value })} /></label>
            <label><span>Pricing tier</span><select value={clientForm.pricingTierId} onChange={(event) => setClientForm({ ...clientForm, pricingTierId: event.target.value })}><option value="">Select tier</option>{pricingTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></label>
            <label><span>Default margin %</span><input type="number" min="0" value={clientForm.defaultMarginPercent} onChange={(event) => setClientForm({ ...clientForm, defaultMarginPercent: event.target.value })} /></label>
            <label><span>Credit limit</span><input type="number" min="0" value={clientForm.creditLimit} onChange={(event) => setClientForm({ ...clientForm, creditLimit: event.target.value })} /></label>
            <label><span>Current balance</span><input type="number" min="0" value={clientForm.currentBalance} onChange={(event) => setClientForm({ ...clientForm, currentBalance: event.target.value })} /></label>
            <label><span>Payment terms</span><input value={clientForm.paymentTerms} onChange={(event) => setClientForm({ ...clientForm, paymentTerms: event.target.value })} /></label>
            <label><span>Contact name</span><input value={clientForm.contactName} onChange={(event) => setClientForm({ ...clientForm, contactName: event.target.value })} /></label>
            <label><span>Contact email</span><input value={clientForm.contactEmail} onChange={(event) => setClientForm({ ...clientForm, contactEmail: event.target.value })} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={clientForm.brandingDefault} onChange={(event) => setClientForm({ ...clientForm, brandingDefault: event.target.checked })} />Branding default</label>
            <label className="checkbox-row"><input type="checkbox" checked={clientForm.accountHold} onChange={(event) => setClientForm({ ...clientForm, accountHold: event.target.checked })} />Account hold</label>
            <label className="checkbox-row"><input type="checkbox" checked={clientForm.active} onChange={(event) => setClientForm({ ...clientForm, active: event.target.checked })} />Active</label>
            <label className="full-span"><span>Notes</span><textarea value={clientForm.notes} onChange={(event) => setClientForm({ ...clientForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row"><button className="primary-button" onClick={onSave}>{clientEditingId ? 'Save Changes' : 'Save Client'}</button><button className="ghost-button" onClick={handleBackToList}>Cancel</button></div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Client register" subtitle={`${filteredClients.length} record(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={clientFilters.search} onChange={(event) => setClientFilters({ ...clientFilters, search: event.target.value })} /></label>
            <label><span>Client type</span><select value={clientFilters.clientType} onChange={(event) => setClientFilters({ ...clientFilters, clientType: event.target.value })}><option value="">All</option><option>Wholesale</option><option>Retail</option><option>Ecommerce</option><option>Custom</option></select></label>
            <label><span>Active</span><select value={clientFilters.active} onChange={(event) => setClientFilters({ ...clientFilters, active: event.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
          </div>
          {filteredClients.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>Type</th><th>Pricing tier</th><th>Balance / Limit</th><th>Terms</th><th>Hold</th><th>Actions</th></tr></thead>
                <tbody>{filteredClients.map((client) => <tr key={client.id}><td><strong>{client.name}</strong><div className="table-subtext">{client.code || 'No code'}</div></td><td>{client.clientType}</td><td>{client.pricingTierName || 'Not set'}</td><td>{client.currentBalance} / {client.creditLimit}</td><td>{client.paymentTerms || 'Not set'}</td><td>{client.accountHold ? 'Yes' : 'No'}</td><td><button className="table-button" onClick={() => handleStartEdit(client)}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No clients yet" body="Add clients so pricing and jobs can follow real commercial profiles." />}
        </section>
      )}
    </>
  );
}
