import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { QuickAddCard } from '../../components/QuickAddCard';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, Product, Supplier, SupplierFilters, SupplierFormState } from '../../types';

interface SuppliersPageProps {
  clients: Client[];
  products: Product[];
  supplierForm: SupplierFormState;
  setSupplierForm: (value: SupplierFormState) => void;
  supplierEditingId: string | null;
  supplierMessage: string;
  supplierSaveCount: number;
  onSave: () => void;
  onReset: () => void;
  supplierFilters: SupplierFilters;
  setSupplierFilters: (value: SupplierFilters) => void;
  filteredSuppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: () => void;
}

export function SuppliersPage({
  clients,
  products,
  supplierForm,
  setSupplierForm,
  supplierEditingId,
  supplierMessage,
  supplierSaveCount,
  onSave,
  onReset,
  supplierFilters,
  setSupplierFilters,
  filteredSuppliers,
  onEdit,
  onDelete,
}: SuppliersPageProps) {
  const [mode, setMode] = useState<'list' | 'quick' | 'form'>('list');

  useEffect(() => {
    if (supplierEditingId) {
      setMode('form');
    }
  }, [supplierEditingId]);

  useEffect(() => {
    if (supplierSaveCount > 0) {
      setMode('list');
    }
  }, [supplierSaveCount]);

  function handleStartQuickAdd() {
    onReset();
    setMode('quick');
  }

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(supplier: Supplier) {
    onEdit(supplier);
    setMode('form');
  }

  function handleSwitchToFullForm() {
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  // ---- required-field tracking ----
  const identityMissing: string[] = [];
  if (!supplierForm.name.trim()) identityMissing.push('Supplier name');
  if (!supplierForm.email.trim() && !supplierForm.phone.trim()) {
    identityMissing.push('Email or phone');
  }

  const commercialMissing: string[] = [];
  if (!supplierForm.paymentTerms.trim()) commercialMissing.push('Payment terms');

  // Optional sections — opt-in via "I want to track contacts/certifications/products".
  // The existing data model treats these as arrays so an empty array means "skip".
  // We surface that as a context gate so users explicitly opt in rather than
  // accidentally bypassing a critical compliance section.
  const trackContacts = supplierForm.contacts.length > 0;
  const trackCertifications = supplierForm.certifications.length > 0;
  const trackSuppliedProducts = supplierForm.suppliedProducts.length > 0;

  function addContact() {
    setSupplierForm({
      ...supplierForm,
      contacts: [
        ...supplierForm.contacts,
        { id: `supplier-contact-${Date.now()}`, fullName: '', role: '', phone: '', email: '', isPrimary: false },
      ],
    });
  }

  function addCertification() {
    setSupplierForm({
      ...supplierForm,
      certifications: [
        ...supplierForm.certifications,
        {
          id: `supplier-cert-${Date.now()}`,
          type: 'FSC',
          certificateNumber: '',
          issuedDate: '',
          expiryDate: '',
          reviewFrequencyMonths: 12,
          reminderDays: 30,
          status: 'Active',
          notes: '',
        },
      ],
    });
  }

  function addSuppliedProduct() {
    setSupplierForm({
      ...supplierForm,
      suppliedProducts: [
        ...supplierForm.suppliedProducts,
        {
          id: `supplier-product-${Date.now()}`,
          productId: '',
          productName: '',
          supplierSku: '',
          defaultPrice: 0,
          currency: supplierForm.currency,
          minimumOrderQuantity: 0,
          leadTimeDays: 0,
          lastQuotedDate: '',
          active: true,
        },
      ],
    });
  }

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Identity & contact',
      subtitle: 'Who they are and how to reach them.',
      missingRequired: identityMissing,
      body: (
        <div className="form-grid">
          <label>
            <span>Supplier name<RequiredMarker /></span>
            <input value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} />
          </label>
          <label><span>Supplier type</span><select value={supplierForm.supplierType} onChange={(event) => setSupplierForm({ ...supplierForm, supplierType: event.target.value as SupplierFormState['supplierType'] })}><option value="General">General</option><option value="Paper">Paper</option><option value="Packaging">Packaging</option><option value="Spares">Spares</option></select></label>
          <label><span>Primary contact person</span><input value={supplierForm.contactPerson} onChange={(event) => setSupplierForm({ ...supplierForm, contactPerson: event.target.value })} /></label>
          <label>
            <span>Phone<RequiredMarker /></span>
            <input value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} placeholder="Required if no email" />
          </label>
          <label>
            <span>Email<RequiredMarker /></span>
            <input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} placeholder="Required if no phone" />
          </label>
          <label><span>Website</span><input value={supplierForm.website} onChange={(event) => setSupplierForm({ ...supplierForm, website: event.target.value })} /></label>
          <label><span>City</span><input value={supplierForm.city} onChange={(event) => setSupplierForm({ ...supplierForm, city: event.target.value })} /></label>
          <label><span>Country</span><input value={supplierForm.country} onChange={(event) => setSupplierForm({ ...supplierForm, country: event.target.value })} /></label>
          <label className="full-span"><span>Address</span><textarea value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={supplierForm.active} onChange={(event) => setSupplierForm({ ...supplierForm, active: event.target.checked })} />Active supplier</label>
        </div>
      ),
    },
    {
      key: 'commercial',
      title: 'Commercial terms',
      subtitle: 'How you pay them, how much credit they extend, and tax info.',
      missingRequired: commercialMissing,
      body: (
        <div className="form-grid">
          <label><span>Account number</span><input value={supplierForm.accountNumber} onChange={(event) => setSupplierForm({ ...supplierForm, accountNumber: event.target.value })} /></label>
          <label>
            <span>Payment terms<RequiredMarker /></span>
            <input value={supplierForm.paymentTerms} onChange={(event) => setSupplierForm({ ...supplierForm, paymentTerms: event.target.value })} placeholder="e.g. 30 days, COD, EOM" />
          </label>
          <label><span>Credit limit</span><input type="number" min="0" value={supplierForm.creditLimit} onChange={(event) => setSupplierForm({ ...supplierForm, creditLimit: event.target.value })} /></label>
          <label><span>Current balance</span><input type="number" step="0.01" value={supplierForm.currentBalance} onChange={(event) => setSupplierForm({ ...supplierForm, currentBalance: event.target.value })} /></label>
          <label><span>Currency</span><select value={supplierForm.currency} onChange={(event) => setSupplierForm({ ...supplierForm, currency: event.target.value as SupplierFormState['currency'] })}><option value="ZAR">ZAR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
          <label><span>Certificate code</span><input value={supplierForm.certificateCode} onChange={(event) => setSupplierForm({ ...supplierForm, certificateCode: event.target.value })} placeholder="FSC or supplier reference" /></label>
          <label className="full-span"><span>Billing address</span><textarea value={supplierForm.billingAddress} onChange={(event) => setSupplierForm({ ...supplierForm, billingAddress: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'relationship',
      title: 'Relationship management',
      subtitle: 'Owner, review cadence, dual-role linkage, and notes.',
      body: (
        <div className="form-grid">
          <label><span>Internal owner</span><input value={supplierForm.internalOwner} onChange={(event) => setSupplierForm({ ...supplierForm, internalOwner: event.target.value })} placeholder="Who owns the relationship?" /></label>
          <label><span>Last check-in</span><input type="date" value={supplierForm.lastCheckInDate} onChange={(event) => setSupplierForm({ ...supplierForm, lastCheckInDate: event.target.value })} /></label>
          <label><span>Next review</span><input type="date" value={supplierForm.nextReviewDate} onChange={(event) => setSupplierForm({ ...supplierForm, nextReviewDate: event.target.value })} /></label>
          <label><span>Review frequency (months)</span><input type="number" min="1" value={supplierForm.reviewFrequencyMonths} onChange={(event) => setSupplierForm({ ...supplierForm, reviewFrequencyMonths: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={supplierForm.isAlsoClient} onChange={(event) => setSupplierForm({ ...supplierForm, isAlsoClient: event.target.checked, linkedClientId: event.target.checked ? supplierForm.linkedClientId : '' })} />This supplier is also a client</label>
          {supplierForm.isAlsoClient ? (
            <label><span>Linked client</span><select value={supplierForm.linkedClientId} onChange={(event) => setSupplierForm({ ...supplierForm, linkedClientId: event.target.value })}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          ) : null}
          <label className="full-span"><span>Notes</span><textarea value={supplierForm.notes} onChange={(event) => setSupplierForm({ ...supplierForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'contacts',
      title: 'Additional contacts',
      subtitle: 'Multiple people for sales, logistics, or accounts.',
      contextActive: trackContacts,
      contextPrompt: (
        <>
          <p className="muted">No additional contacts yet. The primary contact above is enough for most suppliers.</p>
          <button type="button" className="secondary-button" onClick={addContact}>Add first contact</button>
        </>
      ),
      body: (
        <div className="stack-list">
          {supplierForm.contacts.map((contact) => (
            <div key={contact.id} className="card">
              <div className="form-grid">
                <label><span>Full name</span><input value={contact.fullName} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  contacts: supplierForm.contacts.map((entry) => entry.id === contact.id ? { ...entry, fullName: event.target.value } : entry),
                })} /></label>
                <label><span>Role / department</span><input value={contact.role} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  contacts: supplierForm.contacts.map((entry) => entry.id === contact.id ? { ...entry, role: event.target.value } : entry),
                })} /></label>
                <label><span>Phone</span><input value={contact.phone} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  contacts: supplierForm.contacts.map((entry) => entry.id === contact.id ? { ...entry, phone: event.target.value } : entry),
                })} /></label>
                <label><span>Email</span><input type="email" value={contact.email} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  contacts: supplierForm.contacts.map((entry) => entry.id === contact.id ? { ...entry, email: event.target.value } : entry),
                })} /></label>
                <label className="checkbox-row"><input type="checkbox" checked={contact.isPrimary} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  contacts: supplierForm.contacts.map((entry) => entry.id === contact.id ? { ...entry, isPrimary: event.target.checked } : entry),
                })} />Primary contact</label>
              </div>
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => setSupplierForm({
                  ...supplierForm,
                  contacts: supplierForm.contacts.filter((entry) => entry.id !== contact.id),
                })}>Remove contact</button>
              </div>
            </div>
          ))}
          <div className="inline-actions">
            <button className="secondary-button" type="button" onClick={addContact}>Add another contact</button>
          </div>
        </div>
      ),
    },
    {
      key: 'certifications',
      title: 'Certifications & compliance',
      subtitle: 'FSC and other certificates, expiry dates, and reminder windows.',
      contextActive: trackCertifications,
      contextPrompt: (
        <>
          <p className="muted">No certifications tracked. Add one when you need to monitor expiry dates or audit windows.</p>
          <button type="button" className="secondary-button" onClick={addCertification}>Add first certification</button>
        </>
      ),
      body: (
        <div className="stack-list">
          {supplierForm.certifications.map((certification) => (
            <div key={certification.id} className="card">
              <div className="form-grid">
                <label><span>Type</span><select value={certification.type} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, type: event.target.value as typeof certification.type } : entry),
                })}><option value="FSC">FSC</option><option value="ISO">ISO</option><option value="Food Safety">Food Safety</option><option value="Other">Other</option></select></label>
                <label><span>Certificate number</span><input value={certification.certificateNumber} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, certificateNumber: event.target.value } : entry),
                })} /></label>
                <label><span>Issued date</span><input type="date" value={certification.issuedDate} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, issuedDate: event.target.value } : entry),
                })} /></label>
                <label><span>Expiry date</span><input type="date" value={certification.expiryDate} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, expiryDate: event.target.value } : entry),
                })} /></label>
                <label><span>Review frequency (months)</span><input type="number" min="1" value={certification.reviewFrequencyMonths} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, reviewFrequencyMonths: Number(event.target.value || 0) } : entry),
                })} /></label>
                <label><span>Reminder days</span><input type="number" min="0" value={certification.reminderDays} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, reminderDays: Number(event.target.value || 0) } : entry),
                })} /></label>
                <label><span>Status</span><select value={certification.status} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, status: event.target.value as typeof certification.status } : entry),
                })}><option value="Active">Active</option><option value="Expiring Soon">Expiring Soon</option><option value="Expired">Expired</option></select></label>
                <label className="full-span"><span>Notes</span><textarea value={certification.notes} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.map((entry) => entry.id === certification.id ? { ...entry, notes: event.target.value } : entry),
                })} /></label>
              </div>
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => setSupplierForm({
                  ...supplierForm,
                  certifications: supplierForm.certifications.filter((entry) => entry.id !== certification.id),
                })}>Remove certification</button>
              </div>
            </div>
          ))}
          <div className="inline-actions">
            <button className="secondary-button" type="button" onClick={addCertification}>Add another certification</button>
          </div>
        </div>
      ),
    },
    {
      key: 'suppliedProducts',
      title: 'Products supplied',
      subtitle: 'What this supplier supplies and your current default pricing assumptions.',
      contextActive: trackSuppliedProducts,
      contextPrompt: (
        <>
          <p className="muted">No supplied products tracked. Add entries when you need to lock in MOQ, lead times, or pricing per SKU.</p>
          <button type="button" className="secondary-button" onClick={addSuppliedProduct}>Add first supplied product</button>
        </>
      ),
      body: (
        <div className="stack-list">
          {supplierForm.suppliedProducts.map((item) => (
            <div key={item.id} className="card">
              <div className="form-grid">
                <label><span>Product</span><select value={item.productId} onChange={(event) => {
                  const linkedProduct = products.find((product) => product.id === event.target.value);
                  setSupplierForm({
                    ...supplierForm,
                    suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, productId: event.target.value, productName: linkedProduct?.name ?? '' } : entry),
                  });
                }}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                <label><span>Supplier SKU</span><input value={item.supplierSku} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, supplierSku: event.target.value } : entry),
                })} /></label>
                <label><span>Default price</span><input type="number" min="0" step="0.01" value={item.defaultPrice} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, defaultPrice: Number(event.target.value || 0) } : entry),
                })} /></label>
                <label><span>Currency</span><select value={item.currency} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, currency: event.target.value as typeof item.currency } : entry),
                })}><option value="ZAR">ZAR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
                <label><span>MOQ</span><input type="number" min="0" value={item.minimumOrderQuantity} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, minimumOrderQuantity: Number(event.target.value || 0) } : entry),
                })} /></label>
                <label><span>Lead time (days)</span><input type="number" min="0" value={item.leadTimeDays} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, leadTimeDays: Number(event.target.value || 0) } : entry),
                })} /></label>
                <label><span>Last quoted date</span><input type="date" value={item.lastQuotedDate} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, lastQuotedDate: event.target.value } : entry),
                })} /></label>
                <label className="checkbox-row"><input type="checkbox" checked={item.active} onChange={(event) => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.map((entry) => entry.id === item.id ? { ...entry, active: event.target.checked } : entry),
                })} />Active supplied product</label>
              </div>
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => setSupplierForm({
                  ...supplierForm,
                  suppliedProducts: supplierForm.suppliedProducts.filter((entry) => entry.id !== item.id),
                })}>Remove supplied product</button>
              </div>
            </div>
          ))}
          <div className="inline-actions">
            <button className="secondary-button" type="button" onClick={addSuppliedProduct}>Add another supplied product</button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={
          mode === 'list' ? (
            <div className="add-button-group">
              <button className="secondary-button" onClick={handleStartQuickAdd}>Add New Supplier</button>
              <button className="ghost-button" onClick={handleStartCreate}>Full Form</button>
            </div>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Suppliers</button>
          )
        }
      />

      {mode === 'quick' ? (
        <QuickAddCard
          title="Quick add supplier"
          subtitle="Just the essentials. You can fill in payment terms, certifications, and supplied products from the supplier's record later."
          message={supplierMessage}
          missingRequired={identityMissing}
          onSave={onSave}
          onCancel={handleBackToList}
          onSwitchToFullForm={handleSwitchToFullForm}
          saveLabel="Save Supplier"
          body={
            <div className="form-grid">
              <label>
                <span>Supplier name<RequiredMarker /></span>
                <input
                  value={supplierForm.name}
                  onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })}
                  placeholder="e.g. Sappi Paper"
                  autoFocus
                />
              </label>
              <label>
                <span>Supplier type</span>
                <select
                  value={supplierForm.supplierType}
                  onChange={(event) => setSupplierForm({ ...supplierForm, supplierType: event.target.value as SupplierFormState['supplierType'] })}
                >
                  <option value="General">General</option>
                  <option value="Paper">Paper</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Spares">Spares</option>
                </select>
              </label>
              <label>
                <span>Phone<RequiredMarker /></span>
                <input
                  value={supplierForm.phone}
                  onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })}
                  placeholder="Required if no email"
                />
              </label>
              <label>
                <span>Email<RequiredMarker /></span>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })}
                  placeholder="Required if no phone"
                />
              </label>
            </div>
          }
        />
      ) : mode === 'form' ? (
        <FormWizard
          title={supplierEditingId ? 'Edit supplier' : 'New supplier'}
          subtitle="Required fields are marked. Optional sections (extra contacts, certifications, supplied products) stay greyed out unless you opt in."
          message={supplierMessage}
          sections={sections}
          isEditing={Boolean(supplierEditingId)}
          saveLabel="Save Supplier"
          onSave={onSave}
          onCancel={handleBackToList}
          footerExtra={supplierEditingId ? (
            <button className="ghost-button" onClick={onDelete}>Delete Supplier</button>
          ) : undefined}
        />
      ) : (
        <section className="card">
          <SectionTitle title="Supplier register" subtitle={`${filteredSuppliers.length} supplier(s) shown`} />

          <div className="filters-grid">
            <label><span>Search</span><input value={supplierFilters.search} onChange={(event) => setSupplierFilters({ ...supplierFilters, search: event.target.value })} placeholder="Supplier, contact, phone" /></label>
            <label><span>Type</span><select value={supplierFilters.supplierType} onChange={(event) => setSupplierFilters({ ...supplierFilters, supplierType: event.target.value })}><option value="">All types</option><option value="General">General</option><option value="Paper">Paper</option><option value="Packaging">Packaging</option><option value="Spares">Spares</option></select></label>
            <label><span>Active</span><select value={supplierFilters.active} onChange={(event) => setSupplierFilters({ ...supplierFilters, active: event.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
          </div>

          {filteredSuppliers.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td><strong>{supplier.name}</strong></td>
                      <td>{supplier.supplierType}</td>
                      <td>{supplier.contacts.length ? `${supplier.contactPerson || supplier.contacts[0]?.fullName || 'Primary not set'} (+${supplier.contacts.length} contacts)` : supplier.contactPerson || supplier.phone || 'Not set'}</td>
                      <td>{supplier.email || 'Not set'}</td>
                      <td>{supplier.active ? 'Active' : 'Inactive'}</td>
                      <td><button className="table-button" aria-label={`Edit ${supplier.name}`} onClick={() => handleStartEdit(supplier)}>✎</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No suppliers yet" body="Add suppliers once and then link them to paper rates, receipts, and spare parts." />
          )}
        </section>
      )}
    </>
  );
}
