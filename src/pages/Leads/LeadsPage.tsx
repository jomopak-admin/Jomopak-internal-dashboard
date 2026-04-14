import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, Lead, LeadFilters, LeadFormState, Product, QuoteEstimate } from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface LeadsPageProps {
  monthOptions: string[];
  clients: Client[];
  products: Product[];
  quotes: QuoteEstimate[];
  leadForm: LeadFormState;
  setLeadForm: (value: LeadFormState) => void;
  leadEditingId: string | null;
  leadMessage: string;
  onSave: () => void;
  onReset: () => void;
  leadFilters: LeadFilters;
  setLeadFilters: (value: LeadFilters) => void;
  filteredLeads: Lead[];
  onEdit: (lead: Lead) => void;
}

export function LeadsPage({
  monthOptions,
  clients,
  products,
  quotes,
  leadForm,
  setLeadForm,
  leadEditingId,
  leadMessage,
  onSave,
  onReset,
  leadFilters,
  setLeadFilters,
  filteredLeads,
  onEdit,
}: LeadsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (leadEditingId) {
      setMode('form');
    }
  }, [leadEditingId]);

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
        title="Leads"
        subtitle="Capture commercial opportunities before they become quotes, then track what converts."
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Lead</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Leads</button>}
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{leadEditingId ? 'Edit lead' : 'New lead'}</h3></div>
          {leadMessage ? <div className="message-strip">{leadMessage}</div> : null}
          <div className="form-grid">
            <label><span>Enquiry date</span><input type="date" value={leadForm.enquiryDate} onChange={(event) => setLeadForm({ ...leadForm, enquiryDate: event.target.value })} /></label>
            <label><span>Existing client</span><select value={leadForm.clientId} onChange={(event) => setLeadForm({ ...leadForm, clientId: event.target.value })}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label><span>Company name</span><input value={leadForm.companyName} onChange={(event) => setLeadForm({ ...leadForm, companyName: event.target.value })} /></label>
            <label><span>Contact name</span><input value={leadForm.contactName} onChange={(event) => setLeadForm({ ...leadForm, contactName: event.target.value })} /></label>
            <label><span>Phone / WhatsApp</span><input value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} /></label>
            <label><span>Email</span><input type="email" value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} /></label>
            <label><span>Source</span><select value={leadForm.source} onChange={(event) => setLeadForm({ ...leadForm, source: event.target.value as LeadFormState['source'] })}><option>WhatsApp</option><option>Phone</option><option>Email</option><option>Referral</option><option>Walk-in</option><option>Existing Customer</option><option>Website</option><option>Other</option></select></label>
            <label><span>Assigned to</span><input value={leadForm.assignedTo} onChange={(event) => setLeadForm({ ...leadForm, assignedTo: event.target.value })} /></label>
            <label><span>Requested product</span><select value={leadForm.productId} onChange={(event) => setLeadForm({ ...leadForm, productId: event.target.value })}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label><span>Requested quantity</span><input type="number" min="0" value={leadForm.requestedQuantity} onChange={(event) => setLeadForm({ ...leadForm, requestedQuantity: event.target.value })} /></label>
            <label><span>Due date</span><input type="date" value={leadForm.dueDate} onChange={(event) => setLeadForm({ ...leadForm, dueDate: event.target.value })} /></label>
            <label><span>Status</span><select value={leadForm.status} onChange={(event) => setLeadForm({ ...leadForm, status: event.target.value as LeadFormState['status'] })}><option value="New">New</option><option value="Qualified">Qualified</option><option value="Awaiting Info">Awaiting Info</option><option value="Quoted">Quoted</option><option value="Won">Won</option><option value="Lost">Lost</option></select></label>
            <label><span>QuickBooks estimate #</span><input value={leadForm.quickbooksEstimateNumber} onChange={(event) => setLeadForm({ ...leadForm, quickbooksEstimateNumber: event.target.value })} placeholder="Required once quoted" /></label>
            <label><span>Linked quote</span><select value={leadForm.linkedQuoteId} onChange={(event) => setLeadForm({ ...leadForm, linkedQuoteId: event.target.value })}><option value="">Select quote</option>{quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.quoteNumber} · {quote.clientName || quote.productName}</option>)}</select></label>
            <label className="full-span"><span>Notes</span><textarea value={leadForm.notes} onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{leadEditingId ? 'Save Changes' : 'Save Lead'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Lead register" subtitle={`${filteredLeads.length} lead(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={leadFilters.search} onChange={(event) => setLeadFilters({ ...leadFilters, search: event.target.value })} /></label>
            <label><span>Month</span><select value={leadFilters.month} onChange={(event) => setLeadFilters({ ...leadFilters, month: event.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Status</span><select value={leadFilters.status} onChange={(event) => setLeadFilters({ ...leadFilters, status: event.target.value })}><option value="">All statuses</option><option value="New">New</option><option value="Qualified">Qualified</option><option value="Awaiting Info">Awaiting Info</option><option value="Quoted">Quoted</option><option value="Won">Won</option><option value="Lost">Lost</option></select></label>
            <label><span>Source</span><select value={leadFilters.source} onChange={(event) => setLeadFilters({ ...leadFilters, source: event.target.value })}><option value="">All sources</option><option>WhatsApp</option><option>Phone</option><option>Email</option><option>Referral</option><option>Walk-in</option><option>Existing Customer</option><option>Website</option><option>Other</option></select></label>
            <label><span>Owner</span><input value={leadFilters.owner} onChange={(event) => setLeadFilters({ ...leadFilters, owner: event.target.value })} /></label>
          </div>
          {filteredLeads.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Lead</th><th>Date</th><th>Company</th><th>Owner</th><th>Qty</th><th>Status</th><th>Quote</th><th>Actions</th></tr></thead>
                <tbody>{filteredLeads.map((lead) => <tr key={lead.id}><td><strong>{lead.leadNumber}</strong><div className="table-subtext">{lead.contactName || 'No contact'}</div></td><td>{formatDate(lead.enquiryDate)}</td><td>{lead.companyName || lead.clientName || 'No company'}</td><td>{lead.assignedTo || 'Unassigned'}</td><td>{formatNumber(lead.requestedQuantity)}</td><td>{lead.status}</td><td>{lead.quickbooksEstimateNumber ? `QB ${lead.quickbooksEstimateNumber}` : (lead.linkedQuoteNumber || 'Not quoted')}</td><td><button className="table-button" onClick={() => { onEdit(lead); setMode('form'); }}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No leads yet" body="Capture enquiries here before they move into the quote pipeline." />}
        </section>
      )}
    </>
  );
}
