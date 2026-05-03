import { useEffect, useState } from 'react';
import { FlagBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import { JobCard, ProductionLogEntry, WasteEntry, WasteFilters, WasteFormState } from '../../types';
import { WASTE_REASONS, calculateAverageWastePerJob, formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface WasteLogPageProps {
  jobs: JobCard[];
  productionLogs: ProductionLogEntry[];
  monthOptions: string[];
  wasteForm: WasteFormState;
  setWasteForm: (value: WasteFormState) => void;
  wasteEditingId: string | null;
  wasteMessage: string;
  onSave: () => void;
  onReset: () => void;
  selectedWasteJob?: JobCard;
  wasteFilters: WasteFilters;
  setWasteFilters: (value: WasteFilters) => void;
  filteredWasteEntries: WasteEntry[];
  onEdit: (entry: WasteEntry) => void;
}

export function WasteLogPage(props: WasteLogPageProps) {
  const {
    jobs,
    productionLogs,
    monthOptions,
    wasteForm,
    setWasteForm,
    wasteEditingId,
    wasteMessage,
    onSave,
    onReset,
    selectedWasteJob,
    wasteFilters,
    setWasteFilters,
    filteredWasteEntries,
    onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (wasteEditingId) {
      setMode('form');
    }
  }, [wasteEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(entry: WasteEntry) {
    onEdit(entry);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Waste header',
      subtitle: 'When the waste happened and which job it came from.',
      missingRequired: [
        ...(wasteForm.wasteDate ? [] : ['Waste date']),
        ...(wasteForm.jobId ? [] : ['Linked job']),
      ],
      body: (
        <>
          <div className="form-grid">
            <label><span>Waste date <RequiredMarker /></span><input type="date" value={wasteForm.wasteDate} onChange={(event) => setWasteForm({ ...wasteForm, wasteDate: event.target.value })} /></label>
            <label>
              <span>Linked job <RequiredMarker /></span>
              <select
                value={wasteForm.jobId}
                onChange={(event) => {
                  const nextJob = jobs.find((job) => job.id === event.target.value);
                  setWasteForm({
                    ...wasteForm,
                    jobId: event.target.value,
                    fscRelated: nextJob?.fscRelated ?? wasteForm.fscRelated,
                  });
                }}
              >
                <option value="">Select job card</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber} - {job.customerName}</option>)}
              </select>
            </label>
            <label>
              <span>Production log</span>
              <select value={wasteForm.productionLogId} onChange={(event) => setWasteForm({ ...wasteForm, productionLogId: event.target.value })}>
                <option value="">Optional process log</option>
                {productionLogs
                  .filter((log) => !wasteForm.jobId || log.jobId === wasteForm.jobId)
                  .map((log) => <option key={log.id} value={log.id}>{log.logNumber} - {log.logType}</option>)}
              </select>
            </label>
          </div>
          {selectedWasteJob ? (
            <div className="linked-record">
              <span>Linked job</span>
              <strong>{selectedWasteJob.jobNumber}</strong>
              <p>{selectedWasteJob.customerName} • {selectedWasteJob.productName}</p>
            </div>
          ) : null}
        </>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity & reason',
      subtitle: 'How much was wasted and why.',
      missingRequired: [
        ...(wasteForm.wasteQuantity && Number(wasteForm.wasteQuantity) > 0 ? [] : ['Waste quantity']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Waste quantity <RequiredMarker /></span><input type="number" min="0" value={wasteForm.wasteQuantity} onChange={(event) => setWasteForm({ ...wasteForm, wasteQuantity: event.target.value })} /></label>
          <label>
            <span>Waste unit</span>
            <select value={wasteForm.wasteUnit} onChange={(event) => setWasteForm({ ...wasteForm, wasteUnit: event.target.value as WasteEntry['wasteUnit'] })}>
              <option value="kg">kg</option>
              <option value="sheets">sheets</option>
              <option value="rolls">rolls</option>
              <option value="units">units</option>
            </select>
          </label>
          <label>
            <span>Waste reason</span>
            <select value={wasteForm.wasteReason} onChange={(event) => setWasteForm({ ...wasteForm, wasteReason: event.target.value as WasteEntry['wasteReason'] })}>
              {WASTE_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={wasteForm.fscRelated} onChange={(event) => setWasteForm({ ...wasteForm, fscRelated: event.target.checked })} />
            FSC-related
          </label>
        </div>
      ),
    },
    {
      key: 'attribution',
      title: 'Attribution & notes',
      subtitle: 'Who logged this and any context worth keeping.',
      body: (
        <div className="form-grid">
          <label>
            <span>Entered by</span>
            <input value={wasteForm.enteredBy} onChange={(event) => setWasteForm({ ...wasteForm, enteredBy: event.target.value })} />
          </label>
          <label className="full-span">
            <span>Notes</span>
            <textarea value={wasteForm.notes} onChange={(event) => setWasteForm({ ...wasteForm, notes: event.target.value })} />
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
            <button className="secondary-button" onClick={handleStartCreate}>Add New Waste Log</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Waste Log</button>
          )
        }
      />

      {mode === 'form' ? (
        <FormWizard
          title={wasteEditingId ? 'Edit waste entry' : 'New waste entry'}
          subtitle="Link each waste record to a job for reporting and traceability."
          message={wasteMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!wasteEditingId}
          saveLabel="Save Waste Entry"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Waste history" subtitle={`${filteredWasteEntries.length} record(s) shown`} />

          <div className="filters-grid">
            <label>
              <span>Search</span>
              <input placeholder="Waste, job, customer" value={wasteFilters.search} onChange={(event) => setWasteFilters({ ...wasteFilters, search: event.target.value })} />
            </label>
            <label>
              <span>Month</span>
              <select value={wasteFilters.month} onChange={(event) => setWasteFilters({ ...wasteFilters, month: event.target.value })}>
                <option value="">All months</option>
                {monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}
              </select>
            </label>
            <label>
              <span>Customer</span>
              <input value={wasteFilters.customer} onChange={(event) => setWasteFilters({ ...wasteFilters, customer: event.target.value })} />
            </label>
            <label>
              <span>Waste reason</span>
              <select value={wasteFilters.reason} onChange={(event) => setWasteFilters({ ...wasteFilters, reason: event.target.value })}>
                <option value="">All reasons</option>
                {WASTE_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            </label>
            <label>
              <span>FSC-related</span>
              <select value={wasteFilters.fsc} onChange={(event) => setWasteFilters({ ...wasteFilters, fsc: event.target.value })}>
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          <div className="summary-strip">
            <div className="summary-chip">
              <span>Total waste</span>
              <strong>{formatNumber(filteredWasteEntries.reduce((sum, entry) => sum + entry.wasteQuantity, 0))}</strong>
            </div>
            <div className="summary-chip">
              <span>Average waste per job</span>
              <strong>{formatNumber(calculateAverageWastePerJob(filteredWasteEntries, jobs.filter((job) => filteredWasteEntries.some((entry) => entry.jobId === job.id))), 2)}</strong>
            </div>
          </div>

          {filteredWasteEntries.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Waste</th>
                    <th>Date</th>
                    <th>Job</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>Log</th>
                    <th>FSC</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWasteEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.wasteNumber}</td>
                      <td>{formatDate(entry.wasteDate)}</td>
                      <td>{entry.jobNumber}</td>
                      <td>{entry.customerName}</td>
                      <td>{formatNumber(entry.wasteQuantity)} {entry.wasteUnit}</td>
                      <td>{entry.wasteReason}</td>
                      <td>{entry.productionLogNumber || 'Not linked'}</td>
                      <td><FlagBadge value={entry.fscRelated} /></td>
                      <td><button className="table-button" onClick={() => handleStartEdit(entry)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No waste entries match the filters" body="Clear or adjust the filters to review waste history." />
          )}
        </section>
      )}
    </>
  );
}
