import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, CustomerStockRelease, CustomerStockReleaseFilters, CustomerStockReleaseFormState, FinishedGoodsStock, JobCard } from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface CustomerStockPageProps {
  monthOptions: string[];
  clients: Client[];
  finishedGoodsStock: FinishedGoodsStock[];
  jobs: JobCard[];
  releaseForm: CustomerStockReleaseFormState;
  setReleaseForm: (value: CustomerStockReleaseFormState) => void;
  releaseEditingId: string | null;
  releaseMessage: string;
  onSave: () => void;
  onReset: () => void;
  releaseFilters: CustomerStockReleaseFilters;
  setReleaseFilters: (value: CustomerStockReleaseFilters) => void;
  filteredReleases: CustomerStockRelease[];
  onEdit: (release: CustomerStockRelease) => void;
}

export function CustomerStockPage({
  monthOptions,
  clients,
  finishedGoodsStock,
  jobs,
  releaseForm,
  setReleaseForm,
  releaseEditingId,
  releaseMessage,
  onSave,
  onReset,
  releaseFilters,
  setReleaseFilters,
  filteredReleases,
  onEdit,
}: CustomerStockPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (releaseEditingId) {
      setMode('form');
    }
  }, [releaseEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Customer Stock Releases"
        subtitle="Track stock held on behalf of customers and each release from storage."
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Release</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Customer Stock</button>}
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{releaseEditingId ? 'Edit stock release' : 'New stock release'}</h3></div>
          {releaseMessage ? <div className="message-strip">{releaseMessage}</div> : null}
          <div className="form-grid">
            <label><span>Release date</span><input type="date" value={releaseForm.releaseDate} onChange={(event) => setReleaseForm({ ...releaseForm, releaseDate: event.target.value })} /></label>
            <label><span>Client</span><select value={releaseForm.clientId} onChange={(event) => setReleaseForm({ ...releaseForm, clientId: event.target.value })}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label><span>Finished stock batch</span><select value={releaseForm.finishedGoodsStockId} onChange={(event) => setReleaseForm({ ...releaseForm, finishedGoodsStockId: event.target.value })}><option value="">Select stock batch</option>{finishedGoodsStock.map((item) => <option key={item.id} value={item.id}>{item.stockNumber} - {item.productName}</option>)}</select></label>
            <label><span>Job</span><select value={releaseForm.jobId} onChange={(event) => setReleaseForm({ ...releaseForm, jobId: event.target.value })}><option value="">Select job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber}</option>)}</select></label>
            <label><span>Quantity released</span><input type="number" min="0" value={releaseForm.quantityReleased} onChange={(event) => setReleaseForm({ ...releaseForm, quantityReleased: event.target.value })} /></label>
            <label><span>Unit</span><select value={releaseForm.quantityUnit} onChange={(event) => setReleaseForm({ ...releaseForm, quantityUnit: event.target.value as CustomerStockReleaseFormState['quantityUnit'] })}><option value="units">units</option><option value="kg">kg</option><option value="rolls">rolls</option><option value="sheets">sheets</option></select></label>
            <label><span>Destination</span><input value={releaseForm.destination} onChange={(event) => setReleaseForm({ ...releaseForm, destination: event.target.value })} placeholder="Dispatch / Client collection / Transfer" /></label>
            <label className="full-span"><span>Notes</span><textarea value={releaseForm.notes} onChange={(event) => setReleaseForm({ ...releaseForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{releaseEditingId ? 'Save Changes' : 'Save Release'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Release register" subtitle={`${filteredReleases.length} release(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={releaseFilters.search} onChange={(event) => setReleaseFilters({ ...releaseFilters, search: event.target.value })} /></label>
            <label><span>Month</span><select value={releaseFilters.month} onChange={(event) => setReleaseFilters({ ...releaseFilters, month: event.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Client</span><input value={releaseFilters.client} onChange={(event) => setReleaseFilters({ ...releaseFilters, client: event.target.value })} /></label>
          </div>
          {filteredReleases.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Release</th><th>Date</th><th>Client</th><th>Stock Batch</th><th>Qty</th><th>Destination</th><th>Actions</th></tr></thead>
                <tbody>{filteredReleases.map((release) => <tr key={release.id}><td><strong>{release.releaseNumber}</strong><div className="table-subtext">{release.jobNumber || 'No job linked'}</div></td><td>{formatDate(release.releaseDate)}</td><td>{release.clientName}</td><td>{release.finishedGoodsStockNumber}</td><td>{formatNumber(release.quantityReleased)} {release.quantityUnit}</td><td>{release.destination || 'Not set'}</td><td><button className="table-button" onClick={() => { onEdit(release); setMode('form'); }}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No customer stock releases yet" body="Track customer-held stock as it leaves storage or gets released for dispatch." />}
        </section>
      )}
    </>
  );
}
