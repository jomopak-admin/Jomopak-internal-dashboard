import { useEffect, useState } from 'react';
import { FlagBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { MaterialFilters, MaterialReceipt, MaterialReceiptFormState, Supplier } from '../../types';
import { FSC_CLAIM_TYPES, formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface MaterialsReceivingPageProps {
  suppliers: Supplier[];
  monthOptions: string[];
  materialForm: MaterialReceiptFormState;
  setMaterialForm: (value: MaterialReceiptFormState) => void;
  materialEditingId: string | null;
  materialMessage: string;
  onSave: () => void;
  onReset: () => void;
  materialFilters: MaterialFilters;
  setMaterialFilters: (value: MaterialFilters) => void;
  filteredMaterialReceipts: MaterialReceipt[];
  onEdit: (receipt: MaterialReceipt) => void;
}

export function MaterialsReceivingPage(props: MaterialsReceivingPageProps) {
  const {
    suppliers,
    monthOptions,
    materialForm,
    setMaterialForm,
    materialEditingId,
    materialMessage,
    onSave,
    onReset,
    materialFilters,
    setMaterialFilters,
    filteredMaterialReceipts,
    onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (materialEditingId) {
      setMode('form');
    }
  }, [materialEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(receipt: MaterialReceipt) {
    onEdit(receipt);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Materials Receiving"
        subtitle="Record incoming paper, supplier information, FSC claim, and storage location."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Material Receipt</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Materials Receiving</button>
          )
        }
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header">
            <div>
              <h3>{materialEditingId ? 'Edit material receipt' : 'New material receipt'}</h3>
              <p className="muted">Each receipt becomes a traceable source material for production logs and paper usage.</p>
            </div>
          </div>

          {materialMessage ? <div className="message-strip">{materialMessage}</div> : null}

          <div className="form-grid">
            <label>
              Received date
              <input type="date" value={materialForm.receivedDate} onChange={(event) => setMaterialForm({ ...materialForm, receivedDate: event.target.value })} />
            </label>
            <label>
              Supplier
              <select
                value={materialForm.supplierId}
                onChange={(event) => {
                  const supplier = suppliers.find((item) => item.id === event.target.value);
                  setMaterialForm({
                    ...materialForm,
                    supplierId: supplier?.id ?? '',
                    supplierName: supplier?.name ?? materialForm.supplierName,
                  });
                }}
              >
                <option value="">Select supplier</option>
                {suppliers.filter((supplier) => supplier.active).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>
            <label>
              Supplier batch number
              <input value={materialForm.supplierBatchNumber} onChange={(event) => setMaterialForm({ ...materialForm, supplierBatchNumber: event.target.value })} />
            </label>
            <label>
              Internal roll code
              <input value={materialForm.internalRollCode} onChange={(event) => setMaterialForm({ ...materialForm, internalRollCode: event.target.value })} />
            </label>
            <label>
              Paper type
              <input value={materialForm.paperType} onChange={(event) => setMaterialForm({ ...materialForm, paperType: event.target.value })} />
            </label>
            <label>
              GSM
              <input value={materialForm.gsm} onChange={(event) => setMaterialForm({ ...materialForm, gsm: event.target.value })} />
            </label>
            <label>
              Width
              <input value={materialForm.width} onChange={(event) => setMaterialForm({ ...materialForm, width: event.target.value })} />
            </label>
            <label>
              Quantity received
              <input type="number" min="0" value={materialForm.quantityReceived} onChange={(event) => setMaterialForm({ ...materialForm, quantityReceived: event.target.value })} />
            </label>
            <label>
              Quantity unit
              <select value={materialForm.quantityUnit} onChange={(event) => setMaterialForm({ ...materialForm, quantityUnit: event.target.value as MaterialReceipt['quantityUnit'] })}>
                <option value="kg">kg</option>
                <option value="rolls">rolls</option>
                <option value="sheets">sheets</option>
                <option value="units">units</option>
              </select>
            </label>
            <label>
              FSC claim type
              <select value={materialForm.fscClaimType} onChange={(event) => setMaterialForm({ ...materialForm, fscClaimType: event.target.value as MaterialReceipt['fscClaimType'] })}>
                {FSC_CLAIM_TYPES.map((claim) => <option key={claim} value={claim}>{claim}</option>)}
              </select>
            </label>
            <label>
              Supplier certificate code
              <input value={materialForm.supplierCertificateCode} onChange={(event) => setMaterialForm({ ...materialForm, supplierCertificateCode: event.target.value })} />
            </label>
            <label>
              Invoice / delivery ref
              <input value={materialForm.invoiceReference} onChange={(event) => setMaterialForm({ ...materialForm, invoiceReference: event.target.value })} />
            </label>
            <label>
              Storage location
              <input value={materialForm.storageLocation} onChange={(event) => setMaterialForm({ ...materialForm, storageLocation: event.target.value })} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={materialForm.fscRelated} onChange={(event) => setMaterialForm({ ...materialForm, fscRelated: event.target.checked })} />
              FSC-related
            </label>
            <label className="full-span">
              Inspection notes
              <textarea value={materialForm.inspectionNotes} onChange={(event) => setMaterialForm({ ...materialForm, inspectionNotes: event.target.value })} />
            </label>
          </div>

          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{materialEditingId ? 'Save Changes' : 'Save Receipt'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Receiving register" subtitle={`${filteredMaterialReceipts.length} record(s) shown`} />

          <div className="filters-grid">
            <label>
              Search
              <input placeholder="Receipt, roll code, supplier" value={materialFilters.search} onChange={(event) => setMaterialFilters({ ...materialFilters, search: event.target.value })} />
            </label>
            <label>
              Month
              <select value={materialFilters.month} onChange={(event) => setMaterialFilters({ ...materialFilters, month: event.target.value })}>
                <option value="">All months</option>
                {monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}
              </select>
            </label>
            <label>
              Supplier
              <input value={materialFilters.supplier} onChange={(event) => setMaterialFilters({ ...materialFilters, supplier: event.target.value })} />
            </label>
            <label>
              Paper type
              <input value={materialFilters.paperType} onChange={(event) => setMaterialFilters({ ...materialFilters, paperType: event.target.value })} />
            </label>
            <label>
              FSC-related
              <select value={materialFilters.fsc} onChange={(event) => setMaterialFilters({ ...materialFilters, fsc: event.target.value })}>
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          {filteredMaterialReceipts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Roll code</th>
                    <th>Qty</th>
                    <th>Storage</th>
                    <th>FSC</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterialReceipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td><strong>{receipt.receiptNumber}</strong><div className="table-subtext">{receipt.paperType}</div></td>
                      <td>{formatDate(receipt.receivedDate)}</td>
                      <td>{receipt.supplierName}</td>
                      <td>{receipt.internalRollCode}</td>
                      <td>{formatNumber(receipt.quantityReceived)} {receipt.quantityUnit}</td>
                      <td>{receipt.storageLocation}</td>
                      <td><FlagBadge value={receipt.fscRelated} /></td>
                      <td><button className="table-button" onClick={() => handleStartEdit(receipt)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No receipts match the filters" body="Add a receiving record to start the material traceability chain." />
          )}
        </section>
      )}
    </>
  );
}
