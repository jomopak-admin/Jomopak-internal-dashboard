import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  CustomerStockRelease,
  DeliveryNote,
  DeliveryNoteFilters,
  DeliveryNoteFormState,
  DispatchRecord,
  JobCard,
} from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface DeliveryNotesPageProps {
  monthOptions: string[];
  clients: Client[];
  jobs: JobCard[];
  dispatchRecords: DispatchRecord[];
  customerStockReleases: CustomerStockRelease[];
  deliveryNoteForm: DeliveryNoteFormState;
  setDeliveryNoteForm: (value: DeliveryNoteFormState) => void;
  deliveryNoteEditingId: string | null;
  deliveryNoteMessage: string;
  onSave: () => void;
  onReset: () => void;
  onAddDispatchLine: (dispatchRecordId: string) => void;
  onAddReleaseLine: (releaseId: string) => void;
  onRemoveLineItem: (lineItemId: string) => void;
  deliveryNoteFilters: DeliveryNoteFilters;
  setDeliveryNoteFilters: (value: DeliveryNoteFilters) => void;
  filteredDeliveryNotes: DeliveryNote[];
  onEdit: (note: DeliveryNote) => void;
}

export function DeliveryNotesPage(props: DeliveryNotesPageProps) {
  const {
    monthOptions,
    clients,
    jobs,
    dispatchRecords,
    customerStockReleases,
    deliveryNoteForm,
    setDeliveryNoteForm,
    deliveryNoteEditingId,
    deliveryNoteMessage,
    onSave,
    onReset,
    onAddDispatchLine,
    onAddReleaseLine,
    onRemoveLineItem,
    deliveryNoteFilters,
    setDeliveryNoteFilters,
    filteredDeliveryNotes,
    onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (deliveryNoteEditingId) {
      setMode('form');
    }
  }, [deliveryNoteEditingId]);

  const visibleDispatches = useMemo(
    () => dispatchRecords.filter((record) => !deliveryNoteForm.clientId || record.customerName === clients.find((client) => client.id === deliveryNoteForm.clientId)?.name),
    [clients, deliveryNoteForm.clientId, dispatchRecords],
  );
  const visibleReleases = useMemo(
    () => customerStockReleases.filter((release) => !deliveryNoteForm.clientId || release.clientId === deliveryNoteForm.clientId),
    [customerStockReleases, deliveryNoteForm.clientId],
  );

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(note: DeliveryNote) {
    onEdit(note);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((client) => ({
      value: client.id,
      label: client.name,
      sublabel: client.companyName || client.code || undefined,
    })),
    [clients],
  );
  const jobOptions: ComboboxOption[] = useMemo(
    () => jobs.map((job) => ({
      value: job.id,
      label: job.jobNumber || `Job ${job.id.slice(-6)}`,
      sublabel: [job.customerName, job.productName].filter(Boolean).join(' · '),
    })),
    [jobs],
  );
  const dispatchOptions: ComboboxOption[] = useMemo(
    () => visibleDispatches.map((record) => ({
      value: record.id,
      label: record.dispatchNumber || `Dispatch ${record.id.slice(-6)}`,
      sublabel: `${record.customerName} · ${formatNumber(record.quantityDispatched)} ${record.quantityUnit}`,
    })),
    [visibleDispatches],
  );
  const releaseOptions: ComboboxOption[] = useMemo(
    () => visibleReleases.map((release) => ({
      value: release.id,
      label: release.releaseNumber || `Release ${release.id.slice(-6)}`,
      sublabel: `${release.clientName} · ${formatNumber(release.quantityReleased)} ${release.quantityUnit}`,
    })),
    [visibleReleases],
  );

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Delivery header',
      subtitle: 'Date, client, job, and how the goods are moving.',
      missingRequired: [
        ...(deliveryNoteForm.noteDate ? [] : ['Note date']),
        ...(deliveryNoteForm.clientId ? [] : ['Client']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Note date <RequiredMarker /></span><input type="date" value={deliveryNoteForm.noteDate} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, noteDate: event.target.value })} /></label>
          <label><span>Client <RequiredMarker /></span><Combobox options={clientOptions} value={deliveryNoteForm.clientId} onChange={(value) => setDeliveryNoteForm({ ...deliveryNoteForm, clientId: value })} placeholder="Search clients…" emptyMessage="No matching clients" /></label>
          <label><span>Job</span><Combobox options={jobOptions} value={deliveryNoteForm.jobId} onChange={(value) => setDeliveryNoteForm({ ...deliveryNoteForm, jobId: value })} placeholder="Search jobs…" emptyMessage="No matching jobs" /></label>
          <label><span>Delivery method</span><select value={deliveryNoteForm.deliveryMethod} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, deliveryMethod: event.target.value as DeliveryNoteFormState['deliveryMethod'] })}><option value="Delivery">Delivery</option><option value="Collection">Collection</option><option value="Courier">Courier</option></select></label>
          <label><span>Delivery reference</span><input value={deliveryNoteForm.deliveryReference} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, deliveryReference: event.target.value })} /></label>
          <label><span>Status</span><select value={deliveryNoteForm.status} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, status: event.target.value as DeliveryNoteFormState['status'] })}><option value="Draft">Draft</option><option value="Issued">Issued</option><option value="Delivered">Delivered</option><option value="Collected">Collected</option></select></label>
        </div>
      ),
    },
    {
      key: 'transport',
      title: 'Transport & people',
      subtitle: 'Who moved the goods and who signed for them.',
      body: (
        <div className="form-grid">
          <label><span>Vehicle registration</span><input value={deliveryNoteForm.vehicleRegistration} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, vehicleRegistration: event.target.value })} /></label>
          <label><span>Driver / courier</span><input value={deliveryNoteForm.driverName} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, driverName: event.target.value })} /></label>
          <label><span>Dispatched by</span><input value={deliveryNoteForm.dispatchedBy} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, dispatchedBy: event.target.value })} /></label>
          <label><span>Received by</span><input value={deliveryNoteForm.receivedBy} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, receivedBy: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'client-copy',
      title: 'Client details on the note',
      subtitle: 'How the client appears on the printed delivery note.',
      body: (
        <div className="form-grid">
          <label><span>Client contact</span><input value={deliveryNoteForm.clientContactName} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, clientContactName: event.target.value })} /></label>
          <label><span>Client phone</span><input value={deliveryNoteForm.clientContactPhone} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, clientContactPhone: event.target.value })} /></label>
          <label><span>Client email</span><input value={deliveryNoteForm.clientEmail} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, clientEmail: event.target.value })} /></label>
          <label className="full-span"><span>Client address</span><textarea value={deliveryNoteForm.clientAddress} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, clientAddress: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'company-copy',
      title: 'Your company details',
      subtitle: 'How your company appears on the printed delivery note.',
      body: (
        <div className="form-grid">
          <label><span>Your company name</span><input value={deliveryNoteForm.companyName} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, companyName: event.target.value })} /></label>
          <label><span>Your phone</span><input value={deliveryNoteForm.companyPhone} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, companyPhone: event.target.value })} /></label>
          <label><span>Your email</span><input value={deliveryNoteForm.companyEmail} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, companyEmail: event.target.value })} /></label>
          <label className="full-span"><span>Your address</span><textarea value={deliveryNoteForm.companyAddress} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, companyAddress: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'lines',
      title: 'Stock lines',
      subtitle: 'Pull lines in from a dispatch or a customer stock release. At least one line is needed for a usable delivery note.',
      missingRequired: [
        ...(deliveryNoteForm.lineItems.length ? [] : ['At least one stock line']),
      ],
      body: (
        <div className="delivery-line-builder">
          <div className="delivery-line-toolbar">
            <label>
              <span>Add from dispatch</span>
              <Combobox options={dispatchOptions} value={deliveryNoteForm.dispatchRecordId} onChange={(value) => setDeliveryNoteForm({ ...deliveryNoteForm, dispatchRecordId: value })} placeholder="Search dispatches…" emptyMessage="No matching dispatches" />
            </label>
            <button className="secondary-button" type="button" onClick={() => onAddDispatchLine(deliveryNoteForm.dispatchRecordId)}>Add Dispatch Line</button>
            <label>
              <span>Add from stock release</span>
              <Combobox options={releaseOptions} value={deliveryNoteForm.customerStockReleaseId} onChange={(value) => setDeliveryNoteForm({ ...deliveryNoteForm, customerStockReleaseId: value })} placeholder="Search releases…" emptyMessage="No matching releases" />
            </label>
            <button className="secondary-button" type="button" onClick={() => onAddReleaseLine(deliveryNoteForm.customerStockReleaseId)}>Add Release Line</button>
          </div>

          {deliveryNoteForm.lineItems.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Product</th>
                    <th>Stock batch</th>
                    <th>Qty</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryNoteForm.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.productName}</td>
                      <td>{item.stockNumber || 'Manual'}</td>
                      <td>{formatNumber(item.quantity)} {item.quantityUnit}</td>
                      <td>{item.dispatchRecordId ? 'Dispatch' : item.customerStockReleaseId ? 'Customer stock release' : 'Manual'}</td>
                      <td><button className="table-button" type="button" onClick={() => onRemoveLineItem(item.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No stock lines added yet" body="Add at least one dispatch or customer stock release line to create a usable delivery note." />
          )}
        </div>
      ),
    },
    {
      key: 'visibility-notes',
      title: 'Visibility & notes',
      subtitle: 'Whether the client can see this and any extra context.',
      body: (
        <div className="form-grid">
          <label className="checkbox-row full-span">
            <input type="checkbox" checked={deliveryNoteForm.clientVisible} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, clientVisible: event.target.checked })} />
            Client can view this delivery note
          </label>
          <label className="full-span">
            <span>Notes</span>
            <textarea value={deliveryNoteForm.notes} onChange={(event) => setDeliveryNoteForm({ ...deliveryNoteForm, notes: event.target.value })} />
          </label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Delivery Note</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Delivery Notes</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={deliveryNoteEditingId ? 'Edit delivery note' : 'New delivery note'}
          subtitle="Capture the exact document clients should see for stock leaving your warehouse or going out on delivery."
          message={deliveryNoteMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!deliveryNoteEditingId}
          saveLabel="Save Delivery Note"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Delivery note register" subtitle={`${filteredDeliveryNotes.length} note(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={deliveryNoteFilters.search} onChange={(event) => setDeliveryNoteFilters({ ...deliveryNoteFilters, search: event.target.value })} placeholder="Delivery note, client, reference" /></label>
            <label><span>Month</span><select value={deliveryNoteFilters.month} onChange={(event) => setDeliveryNoteFilters({ ...deliveryNoteFilters, month: event.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Client</span><input value={deliveryNoteFilters.client} onChange={(event) => setDeliveryNoteFilters({ ...deliveryNoteFilters, client: event.target.value })} /></label>
            <label><span>Status</span><select value={deliveryNoteFilters.status} onChange={(event) => setDeliveryNoteFilters({ ...deliveryNoteFilters, status: event.target.value })}><option value="">All statuses</option><option value="Draft">Draft</option><option value="Issued">Issued</option><option value="Delivered">Delivered</option><option value="Collected">Collected</option></select></label>
            <label><span>Visibility</span><select value={deliveryNoteFilters.visibility} onChange={(event) => setDeliveryNoteFilters({ ...deliveryNoteFilters, visibility: event.target.value })}><option value="all">All</option><option value="client">Client visible</option><option value="internal">Internal only</option></select></label>
          </div>

          {filteredDeliveryNotes.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Delivery note</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Job</th>
                    <th>Method</th>
                    <th>Lines</th>
                    <th>Status</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveryNotes.map((note) => (
                    <tr key={note.id}>
                      <td><strong>{note.deliveryNoteNumber}</strong><div className="table-subtext">{note.deliveryReference || 'No reference'}</div></td>
                      <td>{formatDate(note.noteDate)}</td>
                      <td>{note.clientName}</td>
                      <td>{note.jobNumber || 'Not linked'}</td>
                      <td>{note.deliveryMethod}</td>
                      <td>{note.lineItems.length}</td>
                      <td>{note.status}</td>
                      <td>{note.clientVisible ? 'Client visible' : 'Internal only'}</td>
                      <td><button className="table-button" onClick={() => handleStartEdit(note)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No delivery notes yet" body="Create delivery notes when you dispatch or release held stock to clients." />
          )}

          {filteredDeliveryNotes.length ? (
            <div className="delivery-note-preview-list">
              {filteredDeliveryNotes.slice(0, 3).map((note) => (
                <article key={`${note.id}-preview`} className="delivery-note-preview">
                  <div className="delivery-note-preview-header">
                    <div>
                      <strong>{note.companyName}</strong>
                      <div className="table-subtext">{note.companyAddress || 'No company address recorded'}</div>
                    </div>
                    <div className="delivery-note-badge">{note.deliveryNoteNumber}</div>
                  </div>
                  <div className="delivery-note-preview-grid">
                    <div><span>Client</span><strong>{note.clientName}</strong></div>
                    <div><span>Date</span><strong>{formatDate(note.noteDate)}</strong></div>
                    <div><span>Method</span><strong>{note.deliveryMethod}</strong></div>
                    <div><span>Status</span><strong>{note.status}</strong></div>
                  </div>
                  <div className="delivery-note-line-summary">
                    {note.lineItems.map((item) => (
                      <div key={item.id} className="delivery-note-line-summary-item">
                        <span>{item.description || item.productName}</span>
                        <strong>{formatNumber(item.quantity)} {item.quantityUnit}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      )}
    </>
  );
}
