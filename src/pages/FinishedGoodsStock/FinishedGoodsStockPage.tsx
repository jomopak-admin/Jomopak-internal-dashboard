import { useEffect, useMemo, useState } from 'react';
import { CommercialFlags } from '../../components/Badge';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, FinishedGoodsStock, FinishedGoodsStockFilters, FinishedGoodsStockFormState, JobCard, Product, StockChangeLog } from '../../types';
import { formatDate, formatNumber, getDaysInStorage, getStorageAgeBand } from '../../utils/calculations';

interface FinishedGoodsStockPageProps {
  products: Product[];
  clients: Client[];
  jobs: JobCard[];
  stockForm: FinishedGoodsStockFormState;
  setStockForm: (value: FinishedGoodsStockFormState) => void;
  stockEditingId: string | null;
  stockMessage: string;
  onSave: () => void;
  onReset: () => void;
  stockFilters: FinishedGoodsStockFilters;
  setStockFilters: (value: FinishedGoodsStockFilters) => void;
  filteredStock: FinishedGoodsStock[];
  stockChangeLogs: StockChangeLog[];
  onEdit: (item: FinishedGoodsStock) => void;
  onDelete: () => void;
}

export function FinishedGoodsStockPage({
  products,
  clients,
  jobs,
  stockForm,
  setStockForm,
  stockEditingId,
  stockMessage,
  onSave,
  onReset,
  stockFilters,
  setStockFilters,
  filteredStock,
  stockChangeLogs,
  onEdit,
  onDelete,
}: FinishedGoodsStockPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (stockEditingId) {
      setMode('form');
    }
  }, [stockEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(item: FinishedGoodsStock) {
    onEdit(item);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const agingSummary = {
    zeroToThirty: filteredStock.filter((item) => getStorageAgeBand(getDaysInStorage(item.storedDate)) === '0-30').length,
    thirtyOneToSixty: filteredStock.filter((item) => getStorageAgeBand(getDaysInStorage(item.storedDate)) === '31-60').length,
    overSixty: filteredStock.filter((item) => getStorageAgeBand(getDaysInStorage(item.storedDate)) === '60+').length,
  };

  const productOptions: ComboboxOption[] = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.name,
        sublabel: product.category,
      })),
    [products],
  );

  const clientOptions: ComboboxOption[] = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: client.name,
        sublabel: client.companyName || client.code,
      })),
    [clients],
  );

  const jobOptions: ComboboxOption[] = useMemo(
    () =>
      jobs.map((job) => ({
        value: job.id,
        label: job.jobNumber || `Job ${job.id.slice(-6)}`,
        sublabel: job.customerName,
      })),
    [jobs],
  );

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Stock identity',
      subtitle: 'What product was stored, when, and which barcode tracks it.',
      missingRequired: [
        ...(stockForm.storedDate ? [] : ['Stored date']),
        ...(stockForm.productId ? [] : ['Product']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Stored date <RequiredMarker /></span><input type="date" value={stockForm.storedDate} onChange={(event) => setStockForm({ ...stockForm, storedDate: event.target.value })} /></label>
          <label>
            <span>Product <RequiredMarker /></span>
            <Combobox
              options={productOptions}
              value={stockForm.productId}
              onChange={(value) => setStockForm({ ...stockForm, productId: value })}
              placeholder="Search products…"
              emptyMessage="No matching products"
            />
          </label>
          <label>
            <span>Barcode</span>
            <input value={stockForm.barcode} onChange={(event) => setStockForm({ ...stockForm, barcode: event.target.value })} placeholder="Scan or enter barcode" />
          </label>
        </div>
      ),
    },
    {
      key: 'links',
      title: 'Client & job link',
      subtitle: 'Optional — leave blank for general stock.',
      body: (
        <div className="form-grid">
          <label>
            <span>Client</span>
            <Combobox
              options={clientOptions}
              value={stockForm.clientId}
              onChange={(value) => setStockForm({ ...stockForm, clientId: value })}
              placeholder="Search clients…"
              emptyMessage="No matching clients"
            />
          </label>
          <label>
            <span>Linked job</span>
            <Combobox
              options={jobOptions}
              value={stockForm.jobId}
              onChange={(value) => setStockForm({ ...stockForm, jobId: value })}
              placeholder="Search job cards…"
              emptyMessage="No matching job cards"
            />
          </label>
        </div>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity & status',
      subtitle: 'How much is on hand, how much is reserved, and where in the workflow it sits.',
      body: (
        <div className="form-grid">
          <label>
            <span>Quantity on hand</span>
            <input type="number" min="0" value={stockForm.quantityOnHand} onChange={(event) => setStockForm({ ...stockForm, quantityOnHand: event.target.value })} />
          </label>
          <label>
            <span>Quantity reserved</span>
            <input type="number" min="0" value={stockForm.quantityReserved} onChange={(event) => setStockForm({ ...stockForm, quantityReserved: event.target.value })} />
          </label>
          <label>
            <span>Unit</span>
            <select value={stockForm.quantityUnit} onChange={(event) => setStockForm({ ...stockForm, quantityUnit: event.target.value as FinishedGoodsStockFormState['quantityUnit'] })}>
              <option>units</option>
              <option>kg</option>
              <option>rolls</option>
              <option>sheets</option>
            </select>
          </label>
          <label>
            <span>Stock status</span>
            <select value={stockForm.stockStatus} onChange={(event) => setStockForm({ ...stockForm, stockStatus: event.target.value as FinishedGoodsStock['stockStatus'] })}>
              <option>In Storage</option>
              <option>Reserved</option>
              <option>Ready to Dispatch</option>
              <option>Dispatched</option>
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'storage',
      title: 'Storage & branding',
      subtitle: 'Where it lives in the warehouse and how it is finished.',
      body: (
        <div className="form-grid">
          <label>
            <span>Storage location</span>
            <input value={stockForm.storageLocation} onChange={(event) => setStockForm({ ...stockForm, storageLocation: event.target.value })} />
          </label>
          <label>
            <span>Branding status</span>
            <input value={stockForm.brandingStatus} onChange={(event) => setStockForm({ ...stockForm, brandingStatus: event.target.value })} placeholder="Branded / Plain / Awaiting artwork" />
          </label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      body: (
        <div className="form-grid">
          <label className="full-span">
            <span>Notes</span>
            <textarea value={stockForm.notes} onChange={(event) => setStockForm({ ...stockForm, notes: event.target.value })} />
          </label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Finished Stock</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Finished Stock</button>
          )
        }
      />

      {mode === 'form' ? (
        <FormWizard
          title={stockEditingId ? 'Edit stock item' : 'New stock item'}
          subtitle="Track stored finished goods so dispatch and stock holding stay clean."
          message={stockMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!stockEditingId}
          saveLabel="Save Stock Item"
          footerExtra={stockEditingId ? <button type="button" className="ghost-button" onClick={onDelete}>Delete Stock Item</button> : null}
        />
      ) : (
        <section className="card">
          <SectionTitle title="Finished stock register" subtitle={`${filteredStock.length} record(s) shown`} />
          <div className="summary-strip">
            <div className="summary-chip"><span>0-30 days</span><strong>{agingSummary.zeroToThirty}</strong></div>
            <div className="summary-chip"><span>31-60 days</span><strong>{agingSummary.thirtyOneToSixty}</strong></div>
            <div className="summary-chip"><span>60+ days</span><strong>{agingSummary.overSixty}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={stockFilters.search} onChange={(event) => setStockFilters({ ...stockFilters, search: event.target.value })} /></label>
            <label><span>Client</span><input value={stockFilters.client} onChange={(event) => setStockFilters({ ...stockFilters, client: event.target.value })} /></label>
            <label><span>Status</span><select value={stockFilters.status} onChange={(event) => setStockFilters({ ...stockFilters, status: event.target.value })}><option value="">All</option><option>In Storage</option><option>Reserved</option><option>Ready to Dispatch</option><option>Dispatched</option></select></label>
            <label><span>Product</span><input value={stockFilters.product} onChange={(event) => setStockFilters({ ...stockFilters, product: event.target.value })} /></label>
          </div>
          {filteredStock.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th>Product</th>
                      <th>Barcode</th>
                      <th>Client</th>
                      <th>Qty On Hand</th>
                      <th>Available</th>
                      <th>Last change</th>
                      <th>Changed by</th>
                      <th>Location</th>
                      <th>Stored</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((item) => {
                      const itemLogs = stockChangeLogs
                        .filter((log) => log.finishedGoodsStockId === item.id)
                        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
                      const latestLog = itemLogs[0];
                      const stockClient = clients.find((client) => client.id === item.clientId);

                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.stockNumber}</strong>
                            <div className="table-subtext">{item.stockStatus}</div>
                          </td>
                          <td>{item.productName}</td>
                          <td>{item.barcode}</td>
                          <td>{item.clientName || 'General stock'}{stockClient ? <CommercialFlags client={stockClient} /> : null}</td>
                          <td>{formatNumber(item.quantityOnHand)} {item.quantityUnit}</td>
                          <td>{formatNumber(item.quantityAvailable)} {item.quantityUnit}</td>
                          <td>{latestLog ? formatDate(latestLog.createdAt) : 'No changes yet'}</td>
                          <td>{latestLog?.changedByName || 'System'}</td>
                          <td>{item.storageLocation || 'Not set'}</td>
                          <td>{formatDate(item.storedDate)}</td>
                          <td>
                            <button className="table-button" aria-label={`Edit ${item.stockNumber}`} onClick={() => handleStartEdit(item)}>✎</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <section className="card">
                <SectionTitle title="Stock change history" subtitle="Audit trail for finished stock quantity changes and deletions." />
                {stockChangeLogs.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Stock</th>
                          <th>Action</th>
                          <th>Changed by</th>
                          <th>Qty on hand</th>
                          <th>Qty reserved</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockChangeLogs
                          .filter((log) => filteredStock.some((item) => item.id === log.finishedGoodsStockId))
                          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                          .slice(0, 20)
                          .map((log) => (
                            <tr key={log.id}>
                              <td>{formatDate(log.createdAt)}</td>
                              <td>
                                <strong>{log.stockNumber}</strong>
                                <div className="table-subtext">{log.productName}</div>
                              </td>
                              <td>{log.action}</td>
                              <td>{log.changedByName || 'System'}</td>
                              <td>{formatNumber(log.previousQuantityOnHand)} → {formatNumber(log.nextQuantityOnHand)}</td>
                              <td>{formatNumber(log.previousQuantityReserved)} → {formatNumber(log.nextQuantityReserved)}</td>
                              <td>{log.notes || '-'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No stock changes logged yet" body="Stock amendments and deletions will appear here with the user name and quantity movement." />}
              </section>
            </>
          ) : (
            <EmptyState title="No finished stock yet" body="Add stored finished goods here so dispatch planning and stock holding are visible." />
          )}
        </section>
      )}
    </>
  );
}
