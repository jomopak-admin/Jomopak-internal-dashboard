import { useEffect, useMemo, useState } from 'react';
import { CommercialFlags, isClientAtRisk, isClientOverCredit } from '../../components/Badge';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
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

  const selectedClient = clients.find((client) => client.id === releaseForm.clientId) || null;
  const releaseBlocked = !!selectedClient && isClientAtRisk(selectedClient);
  const blockingReason = !selectedClient
    ? null
    : selectedClient.accountHold
      ? `${selectedClient.name} is on account hold. Clear the hold before releasing stock.`
      : isClientOverCredit(selectedClient)
        ? `${selectedClient.name} is over credit (balance ${selectedClient.currentBalance} / limit ${selectedClient.creditLimit}). Settle the account before releasing stock.`
        : null;

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

  const finishedGoodsOptions: ComboboxOption[] = useMemo(
    () =>
      finishedGoodsStock.map((item) => ({
        value: item.id,
        label: `${item.stockNumber} · ${item.productName}`,
        sublabel: `${item.quantityAvailable} ${item.quantityUnit} available`,
      })),
    [finishedGoodsStock],
  );

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Release header',
      subtitle: 'When and to whom this stock release belongs.',
      missingRequired: [
        ...(releaseForm.releaseDate ? [] : ['Release date']),
        ...(releaseForm.clientId ? [] : ['Client']),
      ],
      body: (
        <>
          <div className="form-grid">
            <label><span>Release date <RequiredMarker /></span><input type="date" value={releaseForm.releaseDate} onChange={(event) => setReleaseForm({ ...releaseForm, releaseDate: event.target.value })} /></label>
            <label><span>Client <RequiredMarker /></span><Combobox options={clientOptions} value={releaseForm.clientId} onChange={(value) => setReleaseForm({ ...releaseForm, clientId: value })} placeholder="Search clients…" emptyMessage="No matching clients" /></label>
            <label><span>Job</span><Combobox options={jobOptions} value={releaseForm.jobId} onChange={(value) => setReleaseForm({ ...releaseForm, jobId: value })} placeholder="Search jobs…" emptyMessage="No matching jobs" /></label>
          </div>
          {releaseBlocked && blockingReason ? (
            <div className="commercial-warning">
              <strong>Release blocked</strong>
              <span>{blockingReason}</span>
            </div>
          ) : null}
        </>
      ),
    },
    {
      key: 'stock',
      title: 'Stock & quantity',
      subtitle: 'Which finished stock batch is being released and how much.',
      missingRequired: [
        ...(releaseForm.finishedGoodsStockId ? [] : ['Finished stock batch']),
        ...(releaseForm.quantityReleased && Number(releaseForm.quantityReleased) > 0 ? [] : ['Quantity released']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Finished stock batch <RequiredMarker /></span><Combobox options={finishedGoodsOptions} value={releaseForm.finishedGoodsStockId} onChange={(value) => setReleaseForm({ ...releaseForm, finishedGoodsStockId: value })} placeholder="Search stock batches…" emptyMessage="No matching batches" /></label>
          <label><span>Quantity released <RequiredMarker /></span><input type="number" min="0" value={releaseForm.quantityReleased} onChange={(event) => setReleaseForm({ ...releaseForm, quantityReleased: event.target.value })} /></label>
          <label><span>Unit</span><select value={releaseForm.quantityUnit} onChange={(event) => setReleaseForm({ ...releaseForm, quantityUnit: event.target.value as CustomerStockReleaseFormState['quantityUnit'] })}><option value="units">units</option><option value="kg">kg</option><option value="rolls">rolls</option><option value="sheets">sheets</option></select></label>
        </div>
      ),
    },
    {
      key: 'destination',
      title: 'Destination & notes',
      subtitle: 'Where the stock is going and anything dispatch should know.',
      body: (
        <div className="form-grid">
          <label><span>Destination</span><input value={releaseForm.destination} onChange={(event) => setReleaseForm({ ...releaseForm, destination: event.target.value })} placeholder="Dispatch / Client collection / Transfer" /></label>
          <label className="full-span"><span>Notes</span><textarea value={releaseForm.notes} onChange={(event) => setReleaseForm({ ...releaseForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Release</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Customer Stock</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={releaseEditingId ? 'Edit stock release' : 'New stock release'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={releaseMessage || undefined}
          sections={sections}
          onSave={releaseBlocked ? () => undefined : onSave}
          onCancel={handleBackToList}
          isEditing={!!releaseEditingId}
          saveLabel="Save Release"
          allowIncompleteSave={releaseBlocked}
        />
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
                <tbody>{filteredReleases.map((release) => {
                  const releaseClient = clients.find((client) => client.id === release.clientId);
                  return (
                    <tr key={release.id}>
                      <td><strong>{release.releaseNumber}</strong><div className="table-subtext">{release.jobNumber || 'No job linked'}</div></td>
                      <td>{formatDate(release.releaseDate)}</td>
                      <td>{release.clientName}{releaseClient ? <CommercialFlags client={releaseClient} /> : null}</td>
                      <td>{release.finishedGoodsStockNumber}</td>
                      <td>{formatNumber(release.quantityReleased)} {release.quantityUnit}</td>
                      <td>{release.destination || 'Not set'}</td>
                      <td><button className="table-button" onClick={() => { onEdit(release); setMode('form'); }}>Edit</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No customer stock releases yet" body="Track customer-held stock as it leaves storage or gets released for dispatch." />}
        </section>
      )}
    </>
  );
}
