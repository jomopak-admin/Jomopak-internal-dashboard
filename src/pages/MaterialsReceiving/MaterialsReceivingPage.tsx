import { useEffect, useMemo, useRef, useState } from 'react';
import { FlagBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { InventoryMovement, InventoryScanFormState, JobCard, MaterialFilters, MaterialOrderRequest, MaterialReceipt, MaterialReceiptFormState, Supplier } from '../../types';
import { FSC_CLAIM_TYPES, formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface MaterialsReceivingPageProps {
  jobs: JobCard[];
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
  materialOrderRequests: MaterialOrderRequest[];
  inventoryScanForm: InventoryScanFormState;
  setInventoryScanForm: (value: InventoryScanFormState) => void;
  inventoryScanMessage: string;
  inventoryScannedItem: { itemType: 'Finished Goods' | 'Spare Part' | 'Material Lot'; item: any } | null;
  inventoryMovements: InventoryMovement[];
  onInventoryScanAction: () => void;
  onEdit: (receipt: MaterialReceipt) => void;
}

export function MaterialsReceivingPage(props: MaterialsReceivingPageProps) {
  const {
    jobs,
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
    materialOrderRequests,
    inventoryScanForm,
    setInventoryScanForm,
    inventoryScanMessage,
    inventoryScannedItem,
    inventoryMovements,
    onInventoryScanAction,
    onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (materialEditingId) {
      setMode('form');
    }
  }, [materialEditingId]);

  useEffect(() => {
    if (mode === 'list') {
      barcodeInputRef.current?.focus();
    }
  }, [mode]);

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

  const scannedItemMovements = useMemo(() => {
    if (!inventoryScannedItem?.item?.barcode) {
      return [];
    }
    return inventoryMovements
      .filter((movement) => movement.barcode === inventoryScannedItem.item.barcode)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 8);
  }, [inventoryMovements, inventoryScannedItem]);

  const scannedQuantitySummary = useMemo(() => {
    if (!inventoryScannedItem) {
      return null;
    }
    const { itemType, item } = inventoryScannedItem;
    if (itemType === 'Material Lot') {
      return {
        primaryLabel: 'Available',
        primaryValue: `${formatNumber(item.quantityAvailable)} ${item.quantityUnit}`,
        secondaryLabel: 'Received',
        secondaryValue: `${formatNumber(item.quantityReceived)} ${item.quantityUnit}`,
      };
    }
    if (itemType === 'Finished Goods') {
      return {
        primaryLabel: 'Available',
        primaryValue: `${formatNumber(item.quantityAvailable)} ${item.quantityUnit}`,
        secondaryLabel: 'On hand',
        secondaryValue: `${formatNumber(item.quantityOnHand)} ${item.quantityUnit}`,
      };
    }
    return {
      primaryLabel: 'On hand',
      primaryValue: `${formatNumber(item.quantityOnHand)} ${item.unitOfMeasure}`,
      secondaryLabel: 'Reorder level',
      secondaryValue: `${formatNumber(item.reorderLevel)} ${item.unitOfMeasure}`,
    };
  }, [inventoryScannedItem]);

  return (
    <>
      <SectionTitle
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
              Barcode
              <input value={materialForm.barcode} onChange={(event) => setMaterialForm({ ...materialForm, barcode: event.target.value })} placeholder="Scan or enter barcode" />
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
        <>
        <section className="card">
          <SectionTitle title="Scan & lookup" subtitle="Scan a barcode to see stock instantly. Movement actions are optional after lookup." />
          {inventoryScanMessage ? <div className="message-strip">{inventoryScanMessage}</div> : null}
          <div className="form-grid">
            <label>
              Barcode
              <input ref={barcodeInputRef} value={inventoryScanForm.barcode} onChange={(event) => setInventoryScanForm({ ...inventoryScanForm, barcode: event.target.value })} placeholder="Scan barcode" />
            </label>
          </div>
          {inventoryScannedItem ? (
            <>
              <div className="summary-strip">
                <div className="summary-chip"><span>Type</span><strong>{inventoryScannedItem.itemType}</strong></div>
                <div className="summary-chip"><span>Item</span><strong>{inventoryScannedItem.item.itemName ?? inventoryScannedItem.item.productName ?? inventoryScannedItem.item.partName ?? inventoryScannedItem.item.paperType ?? inventoryScannedItem.item.internalRollCode}</strong></div>
                <div className="summary-chip"><span>Barcode</span><strong>{inventoryScannedItem.item.barcode}</strong></div>
                <div className="summary-chip"><span>{scannedQuantitySummary?.primaryLabel}</span><strong>{scannedQuantitySummary?.primaryValue}</strong></div>
                <div className="summary-chip"><span>{scannedQuantitySummary?.secondaryLabel}</span><strong>{scannedQuantitySummary?.secondaryValue}</strong></div>
                <div className="summary-chip"><span>Location</span><strong>{inventoryScannedItem.item.storageLocation || 'Not set'}</strong></div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Action</th>
                      <th>Qty</th>
                      <th>To</th>
                      <th>Job</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedItemMovements.length ? scannedItemMovements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{formatDate(movement.movementDate)}</td>
                        <td>{movement.movementType}</td>
                        <td>{formatNumber(movement.quantityMoved)} {movement.quantityUnit}</td>
                        <td>{movement.toLocation || '-'}</td>
                        <td>{movement.jobNumber || '-'}</td>
                        <td>{movement.movedByName || 'System'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="muted">No movement history found for this barcode yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState title="No barcode scanned yet" body="Scan a barcode here to pull up the live stock record and its movement history." />
          )}

          <SectionTitle title="Movement action" subtitle="Optional: issue, transfer, adjust, or return stock after lookup." />
          <div className="form-grid">
            <label>
              Movement date
              <input type="date" value={inventoryScanForm.movementDate} onChange={(event) => setInventoryScanForm({ ...inventoryScanForm, movementDate: event.target.value })} />
            </label>
            <label>
              Action
              <select value={inventoryScanForm.movementType} onChange={(event) => setInventoryScanForm({ ...inventoryScanForm, movementType: event.target.value as InventoryScanFormState['movementType'] })}>
                <option value="Issued to Job">Issue to job</option>
                <option value="Transferred">Transfer location</option>
                <option value="Adjusted">Adjustment</option>
                <option value="Returned">Return stock</option>
              </select>
            </label>
            <label>
              Quantity
              <input type="number" min="0" value={inventoryScanForm.quantityMoved} onChange={(event) => setInventoryScanForm({ ...inventoryScanForm, quantityMoved: event.target.value })} />
            </label>
            <label>
              Destination
              <input value={inventoryScanForm.toLocation} onChange={(event) => setInventoryScanForm({ ...inventoryScanForm, toLocation: event.target.value })} placeholder="Production / Stores / Dispatch" />
            </label>
            <label>
              Job
              <select value={inventoryScanForm.jobId} onChange={(event) => setInventoryScanForm({ ...inventoryScanForm, jobId: event.target.value })}>
                <option value="">No linked job</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber} · {job.customerName}</option>)}
              </select>
            </label>
            <label className="full-span">
              Notes
              <textarea value={inventoryScanForm.notes} onChange={(event) => setInventoryScanForm({ ...inventoryScanForm, notes: event.target.value })} />
            </label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onInventoryScanAction}>Record Barcode Movement</button>
          </div>
          {inventoryMovements.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Barcode</th>
                    <th>Item</th>
                    <th>Action</th>
                    <th>Qty</th>
                    <th>To</th>
                    <th>Job</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryMovements.slice(0, 12).map((movement) => (
                    <tr key={movement.id}>
                      <td>{formatDate(movement.movementDate)}</td>
                      <td>{movement.barcode}</td>
                      <td><strong>{movement.itemCode}</strong><div className="table-subtext">{movement.itemName}</div></td>
                      <td>{movement.movementType}</td>
                      <td>{formatNumber(movement.quantityMoved)} {movement.quantityUnit}</td>
                      <td>{movement.toLocation || '-'}</td>
                      <td>{movement.jobNumber || '-'}</td>
                      <td>{movement.movedByName || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No barcode movements yet" body="Scanned receipts, issues, transfers, and adjustments will appear here." />
          )}
        </section>

        <section className="card">
          <SectionTitle title="Paper order cards" subtitle={`${materialOrderRequests.length} order request(s)`} />

          {materialOrderRequests.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Job</th>
                    <th>Client</th>
                    <th>Paper</th>
                    <th>Required</th>
                    <th>Shortage</th>
                    <th>Supplier</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {materialOrderRequests.map((request) => (
                    <tr key={request.id}>
                      <td><strong>{request.orderNumber}</strong><div className="table-subtext">{formatDate(request.requestedDate)}</div></td>
                      <td>{request.jobNumber}</td>
                      <td>{request.clientName}</td>
                      <td>{request.paperType} {request.gsm ? `· ${request.gsm}` : ''}</td>
                      <td>{formatNumber(request.quantityRequired)} {request.quantityUnit}</td>
                      <td>{formatNumber(request.shortageQuantity)} {request.quantityUnit}</td>
                      <td>{request.supplierName || 'Assign supplier'}</td>
                      <td>{request.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No paper order cards" body="Jobs with paper shortages will generate buyer-facing paper order cards here." />
          )}
        </section>

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
                    <th>Barcode</th>
                    <th>Qty</th>
                    <th>Available</th>
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
                      <td>{receipt.barcode}</td>
                      <td>{formatNumber(receipt.quantityReceived)} {receipt.quantityUnit}</td>
                      <td>{formatNumber(receipt.quantityAvailable)} {receipt.quantityUnit}</td>
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
        </>
      )}
    </>
  );
}
