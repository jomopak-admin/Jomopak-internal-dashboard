import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Machine, SparePart, SparePartFilters, SparePartFormState, Supplier } from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface SparePartsPageProps {
  machines: Machine[];
  suppliers: Supplier[];
  spareForm: SparePartFormState;
  setSpareForm: (value: SparePartFormState) => void;
  spareEditingId: string | null;
  spareMessage: string;
  onSave: () => void;
  onReset: () => void;
  spareFilters: SparePartFilters;
  setSpareFilters: (value: SparePartFilters) => void;
  filteredSpares: SparePart[];
  onEdit: (part: SparePart) => void;
}

export function SparePartsPage({
  machines,
  suppliers,
  spareForm,
  setSpareForm,
  spareEditingId,
  spareMessage,
  onSave,
  onReset,
  spareFilters,
  setSpareFilters,
  filteredSpares,
  onEdit,
}: SparePartsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (spareEditingId) {
      setMode('form');
    }
  }, [spareEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(part: SparePart) {
    onEdit(part);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Parts & Spares"
        subtitle="Manage internal maintenance stock so low parts do not stop production."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Part / Spare</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Parts & Spares</button>
          )
        }
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{spareEditingId ? 'Edit spare part' : 'New spare part'}</h3></div>
          {spareMessage ? <div className="message-strip">{spareMessage}</div> : null}
          <div className="form-grid">
            <label><span>Part name</span><input value={spareForm.partName} onChange={(event) => setSpareForm({ ...spareForm, partName: event.target.value })} /></label>
            <label><span>Category</span><input value={spareForm.category} onChange={(event) => setSpareForm({ ...spareForm, category: event.target.value })} placeholder="Blade / Bearing / Roller" /></label>
            <label>
              <span>Machine</span>
              <select
                value={spareForm.machineId}
                onChange={(event) => {
                  const machine = machines.find((item) => item.id === event.target.value);
                  setSpareForm({
                    ...spareForm,
                    machineId: machine?.id ?? '',
                    machineReference: machine?.name ?? spareForm.machineReference,
                  });
                }}
              >
                <option value="">Select machine</option>
                {machines.filter((machine) => machine.active).map((machine) => (
                  <option key={machine.id} value={machine.id}>{machine.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Supplier</span>
              <select
                value={spareForm.supplierId}
                onChange={(event) => {
                  const supplier = suppliers.find((item) => item.id === event.target.value);
                  setSpareForm({
                    ...spareForm,
                    supplierId: supplier?.id ?? '',
                    supplierName: supplier?.name ?? spareForm.supplierName,
                  });
                }}
              >
                <option value="">Select supplier</option>
                {suppliers.filter((supplier) => supplier.active).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>
            <label><span>Quantity on hand</span><input type="number" min="0" value={spareForm.quantityOnHand} onChange={(event) => setSpareForm({ ...spareForm, quantityOnHand: event.target.value })} /></label>
            <label><span>Minimum stock</span><input type="number" min="0" value={spareForm.minimumStockLevel} onChange={(event) => setSpareForm({ ...spareForm, minimumStockLevel: event.target.value })} /></label>
            <label><span>Reorder level</span><input type="number" min="0" value={spareForm.reorderLevel} onChange={(event) => setSpareForm({ ...spareForm, reorderLevel: event.target.value })} /></label>
            <label><span>Unit</span><select value={spareForm.unitOfMeasure} onChange={(event) => setSpareForm({ ...spareForm, unitOfMeasure: event.target.value as SparePartFormState['unitOfMeasure'] })}><option>units</option><option>kg</option><option>rolls</option><option>sheets</option></select></label>
            <label><span>Unit cost</span><input type="number" min="0" step="0.01" value={spareForm.unitCost} onChange={(event) => setSpareForm({ ...spareForm, unitCost: event.target.value })} /></label>
            <label><span>Storage location</span><input value={spareForm.storageLocation} onChange={(event) => setSpareForm({ ...spareForm, storageLocation: event.target.value })} /></label>
            <label><span>Last purchase date</span><input type="date" value={spareForm.lastPurchaseDate} onChange={(event) => setSpareForm({ ...spareForm, lastPurchaseDate: event.target.value })} /></label>
            <label className="full-span"><span>Notes</span><textarea value={spareForm.notes} onChange={(event) => setSpareForm({ ...spareForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{spareEditingId ? 'Save Changes' : 'Save Spare Part'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Spare parts register" subtitle={`${filteredSpares.length} record(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={spareFilters.search} onChange={(event) => setSpareFilters({ ...spareFilters, search: event.target.value })} /></label>
            <label><span>Category</span><input value={spareFilters.category} onChange={(event) => setSpareFilters({ ...spareFilters, category: event.target.value })} /></label>
            <label><span>Low stock</span><select value={spareFilters.lowStock} onChange={(event) => setSpareFilters({ ...spareFilters, lowStock: event.target.value })}><option value="all">All</option><option value="yes">Low stock only</option><option value="no">Healthy stock</option></select></label>
            <label><span>Supplier</span><input value={spareFilters.supplier} onChange={(event) => setSpareFilters({ ...spareFilters, supplier: event.target.value })} /></label>
          </div>
          {filteredSpares.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Machine</th>
                    <th>On hand</th>
                    <th>Reorder</th>
                    <th>Supplier</th>
                    <th>Last purchased</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpares.map((part) => (
                    <tr key={part.id}>
                      <td>
                        <strong>{part.partName}</strong>
                        <div className="table-subtext">{part.partCode} · {part.category || 'No category'}</div>
                      </td>
                      <td>{part.machineReference || 'General'}</td>
                      <td>{formatNumber(part.quantityOnHand)} {part.unitOfMeasure}</td>
                      <td>{formatNumber(part.reorderLevel)} {part.unitOfMeasure}</td>
                      <td>{part.supplierName || 'Not set'}</td>
                      <td>{part.lastPurchaseDate ? formatDate(part.lastPurchaseDate) : 'Not set'}</td>
                      <td><button className="table-button" onClick={() => handleStartEdit(part)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No spares yet" body="Start tracking critical machine spares so reorder planning is visible." />
          )}
        </section>
      )}
    </>
  );
}
