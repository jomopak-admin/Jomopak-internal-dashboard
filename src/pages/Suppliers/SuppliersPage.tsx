import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Supplier, SupplierFilters, SupplierFormState } from '../../types';

interface SuppliersPageProps {
  supplierForm: SupplierFormState;
  setSupplierForm: (value: SupplierFormState) => void;
  supplierEditingId: string | null;
  supplierMessage: string;
  onSave: () => void;
  onReset: () => void;
  supplierFilters: SupplierFilters;
  setSupplierFilters: (value: SupplierFilters) => void;
  filteredSuppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: () => void;
}

export function SuppliersPage({
  supplierForm,
  setSupplierForm,
  supplierEditingId,
  supplierMessage,
  onSave,
  onReset,
  supplierFilters,
  setSupplierFilters,
  filteredSuppliers,
  onEdit,
  onDelete,
}: SuppliersPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (supplierEditingId) {
      setMode('form');
    }
  }, [supplierEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(supplier: Supplier) {
    onEdit(supplier);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Suppliers"
        subtitle="Keep supplier contacts in one place and reuse them across paper rates, receipts, and spare parts."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Supplier</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Suppliers</button>
          )
        }
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header">
            <div>
              <h3>{supplierEditingId ? 'Edit supplier' : 'New supplier'}</h3>
              <p className="muted">Link supplier records to pricing, receipts, and stock purchases.</p>
            </div>
          </div>

          {supplierMessage ? <div className="message-strip">{supplierMessage}</div> : null}

          <div className="form-grid">
            <label><span>Supplier name</span><input value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} /></label>
            <label><span>Supplier type</span><select value={supplierForm.supplierType} onChange={(event) => setSupplierForm({ ...supplierForm, supplierType: event.target.value as SupplierFormState['supplierType'] })}><option value="General">General</option><option value="Paper">Paper</option><option value="Packaging">Packaging</option><option value="Spares">Spares</option></select></label>
            <label><span>Primary contact person</span><input value={supplierForm.contactPerson} onChange={(event) => setSupplierForm({ ...supplierForm, contactPerson: event.target.value })} /></label>
            <label><span>Phone</span><input value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} /></label>
            <label><span>Email</span><input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} /></label>
            <label><span>Certificate code</span><input value={supplierForm.certificateCode} onChange={(event) => setSupplierForm({ ...supplierForm, certificateCode: event.target.value })} placeholder="FSC or supplier reference" /></label>
            <label className="full-span"><span>Address</span><textarea value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={supplierForm.active} onChange={(event) => setSupplierForm({ ...supplierForm, active: event.target.checked })} />Active supplier</label>
            <label className="full-span"><span>Notes</span><textarea value={supplierForm.notes} onChange={(event) => setSupplierForm({ ...supplierForm, notes: event.target.value })} /></label>
          </div>

          <section className="card">
            <SectionTitle
              title="Supplier contacts"
              subtitle="Add multiple contact people for one supplier."
              action={<button className="secondary-button" type="button" onClick={() => setSupplierForm({
                ...supplierForm,
                contacts: [...supplierForm.contacts, { id: `supplier-contact-${Date.now()}`, fullName: '', role: '', phone: '', email: '' }],
              })}>Add contact</button>}
            />
            {supplierForm.contacts.length ? (
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
                    </div>
                    <div className="inline-actions">
                      <button className="ghost-button" type="button" onClick={() => setSupplierForm({
                        ...supplierForm,
                        contacts: supplierForm.contacts.filter((entry) => entry.id !== contact.id),
                      })}>Remove contact</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No extra contacts yet" body="Use this section when a supplier has more than one person for sales, logistics, or accounts." />}
          </section>

          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{supplierEditingId ? 'Save Changes' : 'Save Supplier'}</button>
            {supplierEditingId ? <button className="ghost-button" onClick={onDelete}>Delete Supplier</button> : null}
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
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
