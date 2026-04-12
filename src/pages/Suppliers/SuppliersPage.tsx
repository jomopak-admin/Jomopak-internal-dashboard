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
            <label><span>Contact person</span><input value={supplierForm.contactPerson} onChange={(event) => setSupplierForm({ ...supplierForm, contactPerson: event.target.value })} /></label>
            <label><span>Phone</span><input value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} /></label>
            <label><span>Email</span><input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} /></label>
            <label><span>Certificate code</span><input value={supplierForm.certificateCode} onChange={(event) => setSupplierForm({ ...supplierForm, certificateCode: event.target.value })} placeholder="FSC or supplier reference" /></label>
            <label className="full-span"><span>Address</span><textarea value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={supplierForm.active} onChange={(event) => setSupplierForm({ ...supplierForm, active: event.target.checked })} />Active supplier</label>
            <label className="full-span"><span>Notes</span><textarea value={supplierForm.notes} onChange={(event) => setSupplierForm({ ...supplierForm, notes: event.target.value })} /></label>
          </div>

          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{supplierEditingId ? 'Save Changes' : 'Save Supplier'}</button>
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
                      <td>{supplier.contactPerson || supplier.phone || 'Not set'}</td>
                      <td>{supplier.email || 'Not set'}</td>
                      <td>{supplier.active ? 'Active' : 'Inactive'}</td>
                      <td><button className="table-button" onClick={() => handleStartEdit(supplier)}>Edit</button></td>
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
