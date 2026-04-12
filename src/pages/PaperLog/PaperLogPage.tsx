import { useEffect, useState } from 'react';
import { FlagBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { JobCard, MaterialReceipt, PaperFilters, PaperFormState, PaperLog } from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface PaperLogPageProps {
  jobs: JobCard[];
  materialReceipts: MaterialReceipt[];
  monthOptions: string[];
  paperForm: PaperFormState;
  setPaperForm: (value: PaperFormState) => void;
  paperEditingId: string | null;
  paperMessage: string;
  onSave: () => void;
  onReset: () => void;
  selectedPaperJob?: JobCard;
  paperFilters: PaperFilters;
  setPaperFilters: (value: PaperFilters) => void;
  filteredPaperLogs: PaperLog[];
  onEdit: (log: PaperLog) => void;
}

export function PaperLogPage(props: PaperLogPageProps) {
  const {
    jobs,
    materialReceipts,
    monthOptions,
    paperForm,
    setPaperForm,
    paperEditingId,
    paperMessage,
    onSave,
    onReset,
    selectedPaperJob,
    paperFilters,
    setPaperFilters,
    filteredPaperLogs,
    onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (paperEditingId) {
      setMode('form');
    }
  }, [paperEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(log: PaperLog) {
    onEdit(log);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Paper Log"
        subtitle="Track paper usage by job and prepare the base for future stock and FSC traceability."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Paper Log</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Paper Log</button>
          )
        }
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header">
            <div>
              <h3>{paperEditingId ? 'Edit paper log' : 'New paper log'}</h3>
              <p className="muted">Paper log numbers are generated automatically when records are saved.</p>
            </div>
          </div>

          {paperMessage ? <div className="message-strip">{paperMessage}</div> : null}

          <div className="form-grid">
            <label>
              Log date
              <input type="date" value={paperForm.logDate} onChange={(event) => setPaperForm({ ...paperForm, logDate: event.target.value })} />
            </label>
            <label>
              Linked job
              <select
                value={paperForm.jobId}
                onChange={(event) => {
                  const nextJob = jobs.find((job) => job.id === event.target.value);
                  setPaperForm({
                    ...paperForm,
                    jobId: event.target.value,
                    paperType: paperForm.paperType || nextJob?.paperType || '',
                    gsm: paperForm.gsm || nextJob?.gsm || '',
                    fscRelated: nextJob?.fscRelated ?? paperForm.fscRelated,
                  });
                }}
              >
                <option value="">Select job card</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber} - {job.customerName}</option>)}
              </select>
            </label>
            <label>
              Source receipt
              <select value={paperForm.materialReceiptId} onChange={(event) => setPaperForm({ ...paperForm, materialReceiptId: event.target.value })}>
                <option value="">Select receipt</option>
                {materialReceipts.map((receipt) => <option key={receipt.id} value={receipt.id}>{receipt.internalRollCode} - {receipt.receiptNumber}</option>)}
              </select>
            </label>
            <label>
              Paper description / type
              <input value={paperForm.paperType} onChange={(event) => setPaperForm({ ...paperForm, paperType: event.target.value })} />
            </label>
            <label>
              GSM
              <input value={paperForm.gsm} onChange={(event) => setPaperForm({ ...paperForm, gsm: event.target.value })} />
            </label>
            <label>
              Width
              <input value={paperForm.width} onChange={(event) => setPaperForm({ ...paperForm, width: event.target.value })} />
            </label>
            <label>
              Quantity used
              <input type="number" min="0" value={paperForm.quantityUsed} onChange={(event) => setPaperForm({ ...paperForm, quantityUsed: event.target.value })} />
            </label>
            <label>
              Quantity unit
              <select value={paperForm.quantityUnit} onChange={(event) => setPaperForm({ ...paperForm, quantityUnit: event.target.value as PaperLog['quantityUnit'] })}>
                <option value="kg">kg</option>
                <option value="sheets">sheets</option>
                <option value="rolls">rolls</option>
                <option value="units">units</option>
              </select>
            </label>
            <label>
              Paper code / batch code
              <input value={paperForm.paperCode} onChange={(event) => setPaperForm({ ...paperForm, paperCode: event.target.value })} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={paperForm.fscRelated} onChange={(event) => setPaperForm({ ...paperForm, fscRelated: event.target.checked })} />
              FSC-related
            </label>
            <label className="full-span">
              Notes
              <textarea value={paperForm.notes} onChange={(event) => setPaperForm({ ...paperForm, notes: event.target.value })} />
            </label>
          </div>

          {selectedPaperJob ? (
            <div className="linked-record">
              <span>Linked job</span>
              <strong>{selectedPaperJob.jobNumber}</strong>
              <p>{selectedPaperJob.customerName} • {selectedPaperJob.productName}</p>
            </div>
          ) : null}

          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{paperEditingId ? 'Save Changes' : 'Save Paper Log'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Paper usage history" subtitle={`${filteredPaperLogs.length} record(s) shown`} />

          <div className="filters-grid">
            <label>
              Search
              <input placeholder="Log, job, paper, code" value={paperFilters.search} onChange={(event) => setPaperFilters({ ...paperFilters, search: event.target.value })} />
            </label>
            <label>
              Month
              <select value={paperFilters.month} onChange={(event) => setPaperFilters({ ...paperFilters, month: event.target.value })}>
                <option value="">All months</option>
                {monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}
              </select>
            </label>
            <label>
              Paper type
              <input value={paperFilters.paperType} onChange={(event) => setPaperFilters({ ...paperFilters, paperType: event.target.value })} />
            </label>
            <label>
              GSM
              <input value={paperFilters.gsm} onChange={(event) => setPaperFilters({ ...paperFilters, gsm: event.target.value })} />
            </label>
            <label>
              FSC-related
              <select value={paperFilters.fsc} onChange={(event) => setPaperFilters({ ...paperFilters, fsc: event.target.value })}>
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          {filteredPaperLogs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Paper log</th>
                    <th>Date</th>
                    <th>Job</th>
                    <th>Paper type</th>
                    <th>Qty</th>
                    <th>Receipt</th>
                    <th>Code</th>
                    <th>FSC</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaperLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.paperLogNumber}</td>
                      <td>{formatDate(log.logDate)}</td>
                      <td>{log.jobNumber}</td>
                      <td>{log.paperType}</td>
                      <td>{formatNumber(log.quantityUsed)} {log.quantityUnit}</td>
                      <td>{log.materialReceiptNumber || 'Not linked'}</td>
                      <td>{log.paperCode || 'Not set'}</td>
                      <td><FlagBadge value={log.fscRelated} /></td>
                      <td><button className="table-button" onClick={() => handleStartEdit(log)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No paper logs match the filters" body="Adjust the filters or create a paper usage entry." />
          )}
        </section>
      )}
    </>
  );
}
