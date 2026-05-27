/**
 * Companies (Phase 57).
 *
 * Master register of every business entity Jomopak deals with. One
 * Company can hold multiple roles (Client + Supplier + Manufacturer
 * etc.) so its details are stored ONCE. Per-role specifics (credit
 * limit, lead times, MSDS, certifications) live on the linked Client
 * / Supplier records.
 *
 * Lifecycle:
 *   1. Create a Company with name + VAT + roles
 *   2. Optionally link to an existing Client and/or Supplier record
 *      (via the "Linked Client / Linked Supplier" fields), OR create
 *      role profiles in the Clients / Suppliers pages and link them
 *      back here
 *   3. Edit shared details — flow automatically to invoices, bills,
 *      POs, MSDS attachments, etc.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  COMPANY_ROLES,
  Company,
  CompanyFilters,
  CompanyFormState,
  CompanyRole,
  Supplier,
} from '../../types';

interface CompaniesPageProps {
  companies: Company[];
  clients: Client[];
  suppliers: Supplier[];
  filters: CompanyFilters;
  setFilters: (v: CompanyFilters) => void;
  form: CompanyFormState;
  setForm: (v: CompanyFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (c: Company) => void;
  onDelete: (id: string) => void;
  /** Attach an existing Client / Supplier to this Company. */
  onLinkClient: (companyId: string, clientId: string) => void;
  onLinkSupplier: (companyId: string, supplierId: string) => void;
}

function roleBadge(r: CompanyRole): string {
  // Subtle colour coding so the list scans fast.
  if (r === 'Client') return 'badge badge-success';
  if (r === 'Supplier') return 'badge';
  if (r === 'Manufacturer') return 'badge';
  if (r === 'Logistics') return 'badge';
  return 'badge';
}

export function CompaniesPage({ companies, clients, suppliers, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onDelete, onLinkClient, onLinkSupplier }: CompaniesPageProps) {
  const [mode, setMode] = useState<'list' | 'form' | 'detail'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = companies;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((c) => [c.name, c.legalName, c.vatNumber, c.code, c.industry, c.city].join(' ').toLowerCase().includes(q));
    }
    if (filters.role) list = list.filter((c) => (c.roles ?? []).includes(filters.role as CompanyRole));
    if (filters.active === 'yes') list = list.filter((c) => c.active);
    if (filters.active === 'no') list = list.filter((c) => !c.active);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, filters]);

  const stats = useMemo(() => ({
    total: companies.length,
    active: companies.filter((c) => c.active).length,
    multiRole: companies.filter((c) => (c.roles ?? []).length > 1).length,
    clients: companies.filter((c) => (c.roles ?? []).includes('Client')).length,
    suppliers: companies.filter((c) => (c.roles ?? []).includes('Supplier')).length,
  }), [companies]);

  function toggleRole(r: CompanyRole) {
    const next = form.roles.includes(r) ? form.roles.filter((x) => x !== r) : [...form.roles, r];
    setForm({ ...form, roles: next });
  }

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Identity',
      missingRequired: [
        ...(form.name.trim() ? [] : ['Trading name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Trading name <RequiredMarker /></span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sappi Paper" autoFocus /></label>
          <label><span>Legal name</span><input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} placeholder="e.g. Sappi Southern Africa (Pty) Ltd" /></label>
          <label><span>Registration number</span><input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="2001/123456/07" /></label>
          <label><span>VAT number</span><input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} placeholder="4012345678" /></label>
          <label><span>Industry</span><input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Paper manufacturing" /></label>
          <label><span>Website</span><input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://sappi.com" /></label>
          <label className="accounting-check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><span>Active</span></label>
        </div>
      ),
    },
    {
      key: 'roles',
      title: 'Roles',
      subtitle: 'Tick every role this company plays for us. One Company can be a Client AND a Supplier AND a Manufacturer at the same time.',
      contextActive: form.roles.length > 0,
      missingRequired: form.roles.length === 0 ? ['At least one role'] : [],
      body: (
        <div className="form-grid">
          <div className="full-span">
            <div className="role-toggles">
              {COMPANY_ROLES.map((r) => (
                <label key={r} className={`role-toggle ${form.roles.includes(r) ? 'is-active' : ''}`}>
                  <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <p className="muted" style={{ fontSize: '0.78rem', marginTop: 8 }}>
              For role-specific details (credit limit, payment terms, lead times, certifications, MSDS), create the matching Client / Supplier profile in the Clients / Suppliers pages and link it from this company's detail view.
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'primary',
      title: 'Primary contact',
      subtitle: 'The main person you deal with. More contacts can be added once the company is saved.',
      contextActive: !!(form.primaryContactName || form.primaryContactEmail || form.primaryContactPhone),
      body: (
        <div className="form-grid">
          <label><span>Contact name</span><input value={form.primaryContactName} onChange={(e) => setForm({ ...form, primaryContactName: e.target.value })} /></label>
          <label><span>Their role</span><input value={form.primaryContactRole} onChange={(e) => setForm({ ...form, primaryContactRole: e.target.value })} placeholder="e.g. Sales Manager, Accounts Clerk" /></label>
          <label><span>Email</span><input type="email" value={form.primaryContactEmail} onChange={(e) => setForm({ ...form, primaryContactEmail: e.target.value })} /></label>
          <label><span>Phone</span><input value={form.primaryContactPhone} onChange={(e) => setForm({ ...form, primaryContactPhone: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'address',
      title: 'Address',
      contextActive: !!(form.addressLine1 || form.city),
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Street address (line 1)</span><input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} /></label>
          <label className="full-span"><span>Address line 2 (optional)</span><input value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} /></label>
          <label><span>City / Town</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label><span>Province / State</span><input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></label>
          <label><span>Postal code</span><input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></label>
          <label><span>Country</span><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="South Africa" /></label>
        </div>
      ),
    },
    {
      key: 'banking',
      title: 'Banking & terms',
      subtitle: 'Used for paying (if supplier) and confirming inbound (if client). Per-role overrides allowed on Client / Supplier.',
      contextActive: !!(form.bankName || form.bankAccountNumber || form.defaultCurrency),
      body: (
        <div className="form-grid">
          <label><span>Bank</span><input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></label>
          <label><span>Account number</span><input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} /></label>
          <label><span>Branch code</span><input value={form.bankBranchCode} onChange={(e) => setForm({ ...form, bankBranchCode: e.target.value })} /></label>
          <label><span>Account type</span><input value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} placeholder="Cheque / Savings" /></label>
          <label><span>Default currency</span><input value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} placeholder="ZAR" /></label>
          <label><span>Default payment terms</span><input value={form.defaultPaymentTerms} onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })} placeholder="30 days, On receipt, COD..." /></label>
          <label className="full-span"><span>Internal notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  const selectedDetail = useMemo(() => detailId ? companies.find((c) => c.id === detailId) : null, [companies, detailId]);
  const linkedClient = useMemo(() => selectedDetail?.linkedClientId ? clients.find((c) => c.id === selectedDetail.linkedClientId) : undefined, [selectedDetail, clients]);
  const linkedSupplier = useMemo(() => selectedDetail?.linkedSupplierId ? suppliers.find((s) => s.id === selectedDetail.linkedSupplierId) : undefined, [selectedDetail, suppliers]);
  // Suggest matching unlinked records by name when admin is on the detail view.
  const unlinkedClientMatches = useMemo(() => {
    if (!selectedDetail) return [];
    const me = selectedDetail.name.trim().toLowerCase();
    return clients.filter((c) => !c.companyId && c.name.trim().toLowerCase().includes(me) || me.includes(c.name.trim().toLowerCase()));
  }, [selectedDetail, clients]);
  const unlinkedSupplierMatches = useMemo(() => {
    if (!selectedDetail) return [];
    const me = selectedDetail.name.trim().toLowerCase();
    return suppliers.filter((s) => !s.companyId && s.name.trim().toLowerCase().includes(me) || me.includes(s.name.trim().toLowerCase()));
  }, [selectedDetail, suppliers]);

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>New company</button>
        : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); setDetailId(null); }}>Back</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit company' : 'New company'}
          subtitle="Shared details — used by every Client / Supplier profile linked to this company."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save company"
        />
      ) : mode === 'detail' && selectedDetail ? (
        <section className="card">
          <SectionTitle
            title={selectedDetail.name}
            subtitle={`${selectedDetail.legalName ? selectedDetail.legalName + ' · ' : ''}${(selectedDetail.roles ?? []).join(' + ') || 'No roles set'}`}
            action={<button className="secondary-button" onClick={() => { onEdit(selectedDetail); setMode('form'); }}>Edit</button>}
          />
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div><strong>VAT:</strong> {selectedDetail.vatNumber || '—'}</div>
            <div><strong>Registration:</strong> {selectedDetail.registrationNumber || '—'}</div>
            <div><strong>Industry:</strong> {selectedDetail.industry || '—'}</div>
            <div><strong>Currency:</strong> {selectedDetail.defaultCurrency || 'ZAR'}</div>
            <div className="full-span"><strong>Address:</strong> {[selectedDetail.addressLine1, selectedDetail.addressLine2, selectedDetail.city, selectedDetail.province, selectedDetail.postalCode, selectedDetail.country].filter(Boolean).join(', ') || '—'}</div>
            <div><strong>Primary contact:</strong> {selectedDetail.primaryContact?.name || '—'} {selectedDetail.primaryContact?.role ? `(${selectedDetail.primaryContact.role})` : ''}</div>
            <div><strong>Email:</strong> {selectedDetail.primaryContact?.email || '—'}</div>
            <div><strong>Phone:</strong> {selectedDetail.primaryContact?.phone || '—'}</div>
            <div><strong>Payment terms:</strong> {selectedDetail.defaultPaymentTerms || '—'}</div>
          </div>

          <SectionTitle title="Role profiles" subtitle="Per-role data lives in the linked Client / Supplier records." />
          <div className="form-grid">
            <div className="card" style={{ padding: 12 }}>
              <strong>Client profile</strong>
              {linkedClient ? (
                <p className="muted" style={{ fontSize: '0.85rem' }}>Linked: <strong>{linkedClient.name}</strong> ({linkedClient.code || 'no code'}) — edit credit limit, pricing tier, stock-holding settings in the Clients page.</p>
              ) : unlinkedClientMatches.length > 0 ? (
                <>
                  <p className="muted" style={{ fontSize: '0.85rem' }}>Matching un-linked clients found:</p>
                  {unlinkedClientMatches.slice(0, 5).map((c) => (
                    <button key={c.id} className="table-button" style={{ marginRight: 4, marginBottom: 4 }} onClick={() => onLinkClient(selectedDetail.id, c.id)}>Link "{c.name}"</button>
                  ))}
                </>
              ) : (
                <p className="muted" style={{ fontSize: '0.85rem' }}>No Client profile linked. Create one in the Clients page (you can paste this company's name to start), then come back and link it.</p>
              )}
            </div>
            <div className="card" style={{ padding: 12 }}>
              <strong>Supplier profile</strong>
              {linkedSupplier ? (
                <p className="muted" style={{ fontSize: '0.85rem' }}>Linked: <strong>{linkedSupplier.name}</strong> — edit lead times, MSDS, payment terms in the Suppliers page.</p>
              ) : unlinkedSupplierMatches.length > 0 ? (
                <>
                  <p className="muted" style={{ fontSize: '0.85rem' }}>Matching un-linked suppliers found:</p>
                  {unlinkedSupplierMatches.slice(0, 5).map((s) => (
                    <button key={s.id} className="table-button" style={{ marginRight: 4, marginBottom: 4 }} onClick={() => onLinkSupplier(selectedDetail.id, s.id)}>Link "{s.name}"</button>
                  ))}
                </>
              ) : (
                <p className="muted" style={{ fontSize: '0.85rem' }}>No Supplier profile linked. Create one in the Suppliers page, then come back and link it.</p>
              )}
            </div>
          </div>

          {selectedDetail.notes ? (
            <>
              <SectionTitle title="Notes" />
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedDetail.notes}</p>
            </>
          ) : null}
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Companies" subtitle={`${filtered.length} of ${companies.length} business partner(s) shown · ${stats.multiRole} hold multiple roles`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Clients</span><strong>{stats.clients}</strong></div>
            <div className="food-safety-stat"><span>Suppliers</span><strong>{stats.suppliers}</strong></div>
            <div className="food-safety-stat"><span>Multi-role</span><strong>{stats.multiRole}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, VAT, city" /></label>
            <label><span>Role</span>
              <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                <option value="">All</option>
                {COMPANY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label><span>Active</span>
              <select value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value as CompanyFilters['active'] })}>
                <option value="all">All</option>
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No companies yet" body="Click 'New company' to register your first business partner. Each company can hold multiple roles — Client, Supplier, Manufacturer, etc." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Roles</th><th>VAT</th><th>City</th><th>Currency</th><th>Linked profiles</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className={c.active ? '' : 'row-muted'}>
                      <td><strong>{c.name}</strong>{c.legalName ? <div className="table-subtext">{c.legalName}</div> : null}</td>
                      <td>{(c.roles ?? []).map((r) => <span key={r} className={roleBadge(r)} style={{ marginRight: 4 }}>{r}</span>)}</td>
                      <td>{c.vatNumber || '—'}</td>
                      <td>{c.city || '—'}</td>
                      <td>{c.defaultCurrency || 'ZAR'}</td>
                      <td>{[c.linkedClientId ? 'C' : null, c.linkedSupplierId ? 'S' : null].filter(Boolean).join('+') || '—'}</td>
                      <td>
                        <button className="table-button" onClick={() => { setDetailId(c.id); setMode('detail'); }}>Open</button>
                        <button className="table-button" onClick={() => { onEdit(c); setMode('form'); }}>Edit</button>
                        <button className="table-button danger" onClick={() => { if (confirm(`Delete company "${c.name}"? Linked Client/Supplier records are NOT deleted.`)) onDelete(c.id); }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
