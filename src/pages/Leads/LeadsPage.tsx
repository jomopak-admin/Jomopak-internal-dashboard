import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
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

  const hasContact = !!(leadForm.contactName.trim() || leadForm.companyName.trim() || leadForm.clientId);
  const hasReachable = !!(leadForm.phone.trim() || leadForm.email.trim());
  const isQuoted = leadForm.status === 'Quoted' || leadForm.status === 'Won' || leadForm.status === 'Lost';

  const sections: FormWizardSection[] = [
    {
      key: 'enquiry',
      title: 'Enquiry',
      subtitle: 'When the lead came in and where it came from.',
      missingRequired: [
        ...(leadForm.enquiryDate ? [] : ['Enquiry date']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Enquiry date <RequiredMarker /></span><input type="date" value={leadForm.enquiryDate} onChange={(event) => setLeadForm({ ...leadForm, enquiryDate: event.target.value })} /></label>
          <label><span>Source</span><select value={leadForm.source} onChange={(event) => setLeadForm({ ...leadForm, source: event.target.value as LeadFormState['source'] })}><option>WhatsApp</option><option>Phone</option><option>Email</option><option>Referral</option><option>Walk-in</option><option>Existing Customer</option><option>Website</option><option>Other</option></select></label>
          <label><span>Assigned to</span><input value={leadForm.assignedTo} onChange={(event) => setLeadForm({ ...leadForm, assignedTo: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'contact',
      title: 'Contact',
      subtitle: 'Who to call back. Pick an existing client or capture a new prospect.',
      missingRequired: [
        ...(hasContact ? [] : ['Contact name or company']),
        ...(hasReachable ? [] : ['Phone or email']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Existing client</span><select value={leadForm.clientId} onChange={(event) => setLeadForm({ ...leadForm, clientId: event.target.value })}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label><span>Company name <RequiredMarker /></span><input value={leadForm.companyName} onChange={(event) => setLeadForm({ ...leadForm, companyName: event.target.value })} placeholder="Or pick existing client above" /></label>
          <label><span>Contact name</span><input value={leadForm.contactName} onChange={(event) => setLeadForm({ ...leadForm, contactName: event.target.value })} /></label>
          <label><span>Phone / WhatsApp <RequiredMarker /></span><input value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} placeholder="Phone or email is required" /></label>
          <label><span>Email <RequiredMarker /></span><input type="email" value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} placeholder="Phone or email is required" /></label>
        </div>
      ),
    },
    {
      key: 'request',
      title: 'What they want',
      subtitle: 'Product, quantity and when they need it.',
      body: (
        <div className="form-grid">
          <label><span>Requested product</span><select value={leadForm.productId} onChange={(event) => setLeadForm({ ...leadForm, productId: event.target.value })}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label><span>Requested quantity</span><input type="number" min="0" value={leadForm.requestedQuantity} onChange={(event) => setLeadForm({ ...leadForm, requestedQuantity: event.target.value })} /></label>
          <label><span>Due date</span><input type="date" value={leadForm.dueDate} onChange={(event) => setLeadForm({ ...leadForm, dueDate: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status & quote linkage',
      subtitle: isQuoted ? 'A QuickBooks reference makes the trail to billing complete.' : 'Promote to "Quoted" once you send pricing.',
      missingRequired: [
        ...(isQuoted && !leadForm.quickbooksEstimateNumber.trim() ? ['QuickBooks estimate #'] : []),
      ],
      body: (
        <div className="form-grid">
          <label><span>Status</span><select value={leadForm.status} onChange={(event) => setLeadForm({ ...leadForm, status: event.target.value as LeadFormState['status'] })}><option value="New">New</option><option value="Qualified">Qualified</option><option value="Awaiting Info">Awaiting Info</option><option value="Quoted">Quoted</option><option value="Won">Won</option><option value="Lost">Lost</option></select></label>
          <label><span>QuickBooks estimate # {isQuoted ? <RequiredMarker /> : null}</span><input value={leadForm.quickbooksEstimateNumber} onChange={(event) => setLeadForm({ ...leadForm, quickbooksEstimateNumber: event.target.value })} placeholder="Required once quoted" /></label>
          <label><span>Linked quote</span><select value={leadForm.linkedQuoteId} onChange={(event) => setLeadForm({ ...leadForm, linkedQuoteId: event.target.value })}><option value="">Select quote</option>{quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.quoteNumber} · {quote.clientName || quote.productName}</option>)}</select></label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={leadForm.notes} onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Lead</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Leads</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={leadEditingId ? 'Edit lead' : 'New lead'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={leadMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!leadEditingId}
          saveLabel="Save Lead"
        />
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
