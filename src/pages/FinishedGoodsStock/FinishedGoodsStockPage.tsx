import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
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

  return (
    <>
      <SectionTitle
        title="Finished Goods Stock"
        subtitle="Track sellable stock, client-held inventory, and stored finished goods ready for release."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Finished Stock</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Finished Stock</button>
          )
        }
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{stockEditingId ? 'Edit stock item' : 'New stock item'}</h3></div>
          {stockMessage ? <div className="message-strip">{stockMessage}</div> : null}
          <div className="form-grid">
            <label>
              <span>Stored date</span>
              <input type="date" value={stockForm.storedDate} onChange={(event) => setStockForm({ ...stockForm, storedDate: event.target.value })} />
            </label>
            <label>
              <span>Product</span>
              <select value={stockForm.productId} onChange={(event) => setStockForm({ ...stockForm, productId: event.target.value })}>
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
            <label>
              <span>Client</span>
              <select value={stockForm.clientId} onChange={(event) => setStockForm({ ...stockForm, clientId: event.target.value })}>
                <option value="">No linked client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label>
              <span>Linked job</span>
              <select value={stockForm.jobId} onChange={(event) => setStockForm({ ...stockForm, jobId: event.target.value })}>
                <option value="">No linked job</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber} · {job.customerName}</option>)}
              </select>
            </label>
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
              <span>Storage location</span>
              <input value={stockForm.storageLocation} onChange={(event) => setStockForm({ ...stockForm, storageLocation: event.target.value })} />
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
            <label>
              <span>Branding status</span>
              <input value={stockForm.brandingStatus} onChange={(event) => setStockForm({ ...stockForm, brandingStatus: event.target.value })} placeholder="Branded / Plain / Awaiting artwork" />
            </label>
            <label className="full-span">
              <span>Notes</span>
              <textarea value={stockForm.notes} onChange={(event) => setStockForm({ ...stockForm, notes: event.target.value })} />
            </label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{stockEditingId ? 'Save Changes' : 'Save Stock Item'}</button>
            {stockEditingId ? <button className="ghost-button" onClick={onDelete}>Delete Stock Item</button> : null}
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
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

                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.stockNumber}</strong>
                            <div className="table-subtext">{item.stockStatus}</div>
                          </td>
                          <td>{item.productName}</td>
                          <td>{item.clientName || 'General stock'}</td>
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
