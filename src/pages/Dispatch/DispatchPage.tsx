import { useEffect, useState } from 'react';
import { FlagBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { DispatchFilters, DispatchFormState, DispatchRecord, FinishedGoodsStock, JobCard } from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface DispatchPageProps {
  jobs: JobCard[];
  finishedGoodsStock: FinishedGoodsStock[];
  monthOptions: string[];
  dispatchForm: DispatchFormState;
  setDispatchForm: (value: DispatchFormState) => void;
  dispatchEditingId: string | null;
  dispatchMessage: string;
  onSave: () => void;
  onReset: () => void;
  dispatchFilters: DispatchFilters;
  setDispatchFilters: (value: DispatchFilters) => void;
  filteredDispatchRecords: DispatchRecord[];
  onEdit: (record: DispatchRecord) => void;
}

export function DispatchPage(props: DispatchPageProps) {
  const {
    jobs,
    finishedGoodsStock,
    monthOptions,
    dispatchForm,
    setDispatchForm,
    dispatchEditingId,
    dispatchMessage,
    onSave,
    onReset,
    dispatchFilters,
    setDispatchFilters,
    filteredDispatchRecords,
    onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (dispatchEditingId) {
      setMode('form');
    }
  }, [dispatchEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(record: DispatchRecord) {
    onEdit(record);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Dispatch"
        subtitle="Link finished goods dispatches back to jobs, labels, and customer delivery references."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Dispatch</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Dispatch</button>
          )
        }
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header">
            <div>
              <h3>{dispatchEditingId ? 'Edit dispatch record' : 'New dispatch record'}</h3>
              <p className="muted">Use dispatch records to show what was delivered, how it was labelled, and any issues.</p>
            </div>
          </div>

          {dispatchMessage ? <div className="message-strip">{dispatchMessage}</div> : null}

          <div className="form-grid">
            <label><span>Dispatch date</span><input type="date" value={dispatchForm.dispatchDate} onChange={(event) => setDispatchForm({ ...dispatchForm, dispatchDate: event.target.value })} /></label>
            <label><span>Job card</span><select value={dispatchForm.jobId} onChange={(event) => setDispatchForm({ ...dispatchForm, jobId: event.target.value })}><option value="">Select job card</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber} - {job.customerName}</option>)}</select></label>
            <label><span>Finished stock batch</span><select value={dispatchForm.finishedGoodsStockId} onChange={(event) => setDispatchForm({ ...dispatchForm, finishedGoodsStockId: event.target.value })}><option value="">No stock deduction</option>{finishedGoodsStock.map((item) => <option key={item.id} value={item.id}>{item.stockNumber} - {item.productName} ({formatNumber(item.quantityAvailable)} {item.quantityUnit} available)</option>)}</select></label>
            <label><span>Quantity dispatched</span><input type="number" min="0" value={dispatchForm.quantityDispatched} onChange={(event) => setDispatchForm({ ...dispatchForm, quantityDispatched: event.target.value })} /></label>
            <label><span>Unit</span><select value={dispatchForm.quantityUnit} onChange={(event) => setDispatchForm({ ...dispatchForm, quantityUnit: event.target.value as DispatchRecord['quantityUnit'] })}><option value="units">units</option><option value="kg">kg</option><option value="rolls">rolls</option><option value="sheets">sheets</option></select></label>
            <label><span>Label reference</span><input value={dispatchForm.labelReference} onChange={(event) => setDispatchForm({ ...dispatchForm, labelReference: event.target.value })} /></label>
            <label><span>Delivery reference</span><input value={dispatchForm.deliveryReference} onChange={(event) => setDispatchForm({ ...dispatchForm, deliveryReference: event.target.value })} /></label>
            <label className="checkbox-row">
              <input type="checkbox" checked={dispatchForm.fscRelated} onChange={(event) => setDispatchForm({ ...dispatchForm, fscRelated: event.target.checked })} />
              FSC-related
            </label>
            <label className="full-span"><span>Issue notes</span><textarea value={dispatchForm.issueNotes} onChange={(event) => setDispatchForm({ ...dispatchForm, issueNotes: event.target.value })} /></label>
          </div>

          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{dispatchEditingId ? 'Save Changes' : 'Save Dispatch Record'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Dispatch register" subtitle={`${filteredDispatchRecords.length} record(s) shown`} />

          <div className="filters-grid">
            <label><span>Search</span><input placeholder="Dispatch, job, label, customer" value={dispatchFilters.search} onChange={(event) => setDispatchFilters({ ...dispatchFilters, search: event.target.value })} /></label>
            <label><span>Month</span><select value={dispatchFilters.month} onChange={(event) => setDispatchFilters({ ...dispatchFilters, month: event.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Customer</span><input value={dispatchFilters.customer} onChange={(event) => setDispatchFilters({ ...dispatchFilters, customer: event.target.value })} /></label>
            <label><span>FSC-related</span><select value={dispatchFilters.fsc} onChange={(event) => setDispatchFilters({ ...dispatchFilters, fsc: event.target.value })}><option value="all">All</option><option value="yes">Yes</option><option value="no">No</option></select></label>
          </div>

          {filteredDispatchRecords.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dispatch</th>
                    <th>Date</th>
                    <th>Job</th>
                    <th>Stock batch</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Label</th>
                    <th>FSC</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispatchRecords.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.dispatchNumber}</strong><div className="table-subtext">{record.deliveryReference || 'No delivery ref'}</div></td>
                      <td>{formatDate(record.dispatchDate)}</td>
                      <td>{record.jobNumber}</td>
                      <td>{record.finishedGoodsStockNumber || 'Manual'}</td>
                      <td>{record.customerName}</td>
                      <td>{formatNumber(record.quantityDispatched)} {record.quantityUnit}</td>
                      <td>{record.labelReference || 'Not set'}</td>
                      <td><FlagBadge value={record.fscRelated} /></td>
                      <td><button className="table-button" onClick={() => handleStartEdit(record)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No dispatch records match the filters" body="Create a dispatch record when finished goods leave for the customer." />
          )}
        </section>
      )}
    </>
  );
}
