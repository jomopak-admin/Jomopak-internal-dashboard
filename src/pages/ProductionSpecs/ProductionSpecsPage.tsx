import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { PrintableDocument } from '../../components/PrintableDocument';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  HandleType,
  JobCard,
  PrintMethod,
  ProductionSpec,
  ProductionSpecFilters,
  ProductionSpecFormState,
  Product,
  QuantityUnit,
  SupplyFormat,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface ProductionSpecsPageProps {
  clients: Client[];
  products: Product[];
  jobs: JobCard[];
  productionSpecForm: ProductionSpecFormState;
  setProductionSpecForm: (value: ProductionSpecFormState) => void;
  productionSpecEditingId: string | null;
  productionSpecMessage: string;
  onSave: () => void;
  onReset: () => void;
  productionSpecFilters: ProductionSpecFilters;
  setProductionSpecFilters: (value: ProductionSpecFilters) => void;
  filteredProductionSpecs: ProductionSpec[];
  onEdit: (spec: ProductionSpec) => void;
}

export function ProductionSpecsPage({
  clients,
  products,
  jobs,
  productionSpecForm,
  setProductionSpecForm,
  productionSpecEditingId,
  productionSpecMessage,
  onSave,
  onReset,
  productionSpecFilters,
  setProductionSpecFilters,
  filteredProductionSpecs,
  onEdit,
}: ProductionSpecsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [previewSpecId, setPreviewSpecId] = useState<string | null>(null);

  useEffect(() => {
    if (productionSpecEditingId) setMode('form');
  }, [productionSpecEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
    setPreviewSpecId(null);
  }
  function handleBackToList() {
    onReset();
    setMode('list');
    setPreviewSpecId(null);
  }

  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((client) => ({ value: client.id, label: client.name, sublabel: client.companyName || undefined })),
    [clients],
  );
  const productOptions: ComboboxOption[] = useMemo(
    () => products.map((product) => ({ value: product.id, label: product.name, sublabel: [product.category, product.sku].filter(Boolean).join(' · ') || undefined })),
    [products],
  );
  const jobOptions: ComboboxOption[] = useMemo(
    () => jobs.map((job) => ({ value: job.id, label: job.jobNumber || `Job ${job.id.slice(-6)}`, sublabel: [job.customerName, job.productName].filter(Boolean).join(' · ') })),
    [jobs],
  );

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Spec header',
      missingRequired: [
        ...(productionSpecForm.clientId ? [] : ['Client']),
        ...(productionSpecForm.productId ? [] : ['Product']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Spec date</span><input type="date" value={productionSpecForm.specDate} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, specDate: e.target.value })} /></label>
          <label><span>Status</span><select value={productionSpecForm.status} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, status: e.target.value as ProductionSpecFormState['status'] })}><option>Draft</option><option>Approved</option><option>In Production</option><option>Completed</option><option>Archived</option></select></label>
          <label><span>Client <RequiredMarker /></span><Combobox options={clientOptions} value={productionSpecForm.clientId} onChange={(v) => setProductionSpecForm({ ...productionSpecForm, clientId: v })} placeholder="Search clients…" emptyMessage="No matching clients" /></label>
          <label><span>Product <RequiredMarker /></span><Combobox options={productOptions} value={productionSpecForm.productId} onChange={(v) => setProductionSpecForm({ ...productionSpecForm, productId: v })} placeholder="Search products…" emptyMessage="No matching products" /></label>
          <label><span>Linked job (optional)</span><Combobox options={jobOptions} value={productionSpecForm.jobId} onChange={(v) => setProductionSpecForm({ ...productionSpecForm, jobId: v })} placeholder="Search jobs…" emptyMessage="No matching jobs" /></label>
          <label className="inline-toggle"><input type="checkbox" checked={productionSpecForm.clientVisible} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, clientVisible: e.target.checked })} /><span>Visible to client portal</span></label>
        </div>
      ),
    },
    {
      key: 'physical',
      title: 'Physical specs',
      subtitle: 'Dimensions, paper, finishing — what makes the bag itself.',
      body: (
        <div className="form-grid">
          <label><span>Width (mm)</span><input type="number" min="0" value={productionSpecForm.sizeWidthMm} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, sizeWidthMm: e.target.value })} /></label>
          <label><span>Height (mm)</span><input type="number" min="0" value={productionSpecForm.sizeHeightMm} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, sizeHeightMm: e.target.value })} /></label>
          <label><span>Gusset (mm)</span><input type="number" min="0" value={productionSpecForm.sizeGussetMm} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, sizeGussetMm: e.target.value })} /></label>
          <label><span>Paper GSM</span><input type="number" min="0" value={productionSpecForm.paperGsm} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, paperGsm: e.target.value })} /></label>
          <label><span>Paper type</span><input value={productionSpecForm.paperType} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, paperType: e.target.value })} placeholder="Eg. Brown Kraft" /></label>
          <label><span>Handle type</span><select value={productionSpecForm.handleType} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, handleType: e.target.value as HandleType })}><option>None</option><option>Flat Handle</option><option>Rope Handle</option><option>Roll Handle</option></select></label>
          <label className="full-span"><span>Finishing notes</span><textarea value={productionSpecForm.finishingNotes} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, finishingNotes: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'print',
      title: 'Print specs',
      subtitle: 'How it gets decorated — print method, colours, artwork ref.',
      body: (
        <div className="form-grid">
          <label><span>Print method</span><select value={productionSpecForm.printMethod} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, printMethod: e.target.value as PrintMethod })}><option>Plain</option><option>Auto</option><option>Screen Print</option><option>Flexo</option><option>Digital Print</option><option>Litho</option></select></label>
          <label><span># Print colours</span><input type="number" min="0" max="8" value={productionSpecForm.printColours} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, printColours: e.target.value })} /></label>
          <label className="full-span"><span>Pantone references</span><input value={productionSpecForm.pantoneReferences} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, pantoneReferences: e.target.value })} placeholder="Eg. PMS 186 C, PMS Cool Grey 11" /></label>
          <label className="full-span"><span>Artwork reference</span><input value={productionSpecForm.artworkReference} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, artworkReference: e.target.value })} placeholder="File or artwork record number" /></label>
          <label className="full-span"><span>Print position notes</span><textarea value={productionSpecForm.printPositionNotes} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, printPositionNotes: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'order',
      title: 'Order specs',
      subtitle: 'Quantity, lead time, packing — what production needs to plan.',
      body: (
        <div className="form-grid">
          <label><span>Quantity ordered</span><input type="number" min="0" value={productionSpecForm.quantityOrdered} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, quantityOrdered: e.target.value })} /></label>
          <label><span>Unit</span><select value={productionSpecForm.quantityUnit} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, quantityUnit: e.target.value as QuantityUnit })}><option>units</option><option>kg</option><option>sheets</option><option>rolls</option></select></label>
          <label><span>Lead time (days)</span><input type="number" min="0" value={productionSpecForm.leadTimeDays} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, leadTimeDays: e.target.value })} /></label>
          <label><span>Packing format</span><select value={productionSpecForm.packingFormat} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, packingFormat: e.target.value as SupplyFormat })}><option>Boxes</option><option>Flat Packed</option><option>Bundles</option><option>Palletized</option><option>Loose</option></select></label>
          <label className="full-span"><span>Packing notes</span><textarea value={productionSpecForm.packingNotes} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, packingNotes: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'approval',
      title: 'Approval & notes',
      body: (
        <div className="form-grid">
          <label><span>Approved by</span><input value={productionSpecForm.approvedBy} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, approvedBy: e.target.value })} /></label>
          <label><span>Approval date</span><input type="date" value={productionSpecForm.approvedDate} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, approvedDate: e.target.value })} /></label>
          <label className="full-span"><span>Notes</span><textarea value={productionSpecForm.notes} onChange={(e) => setProductionSpecForm({ ...productionSpecForm, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  const previewSpec = previewSpecId ? filteredProductionSpecs.find((s) => s.id === previewSpecId) : null;

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>New Production Spec</button> : <button className="ghost-button" onClick={handleBackToList}>Back to specs</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={productionSpecEditingId ? 'Edit production spec' : 'New production spec'}
          subtitle="A single source of truth for size, colour, print, and order quantity that production and the customer can both refer to."
          message={productionSpecMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!productionSpecEditingId}
          saveLabel="Save Spec"
        />
      ) : previewSpec ? (
        <ProductionSpecPreview spec={previewSpec} onClose={() => setPreviewSpecId(null)} onEdit={() => { onEdit(previewSpec); setMode('form'); }} />
      ) : (
        <section className="card">
          <SectionTitle title="Production specs" subtitle={`${filteredProductionSpecs.length} spec(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={productionSpecFilters.search} onChange={(e) => setProductionSpecFilters({ ...productionSpecFilters, search: e.target.value })} /></label>
            <label><span>Client</span><input value={productionSpecFilters.client} onChange={(e) => setProductionSpecFilters({ ...productionSpecFilters, client: e.target.value })} /></label>
            <label><span>Product</span><input value={productionSpecFilters.product} onChange={(e) => setProductionSpecFilters({ ...productionSpecFilters, product: e.target.value })} /></label>
            <label><span>Status</span><select value={productionSpecFilters.status} onChange={(e) => setProductionSpecFilters({ ...productionSpecFilters, status: e.target.value })}><option value="">All statuses</option><option>Draft</option><option>Approved</option><option>In Production</option><option>Completed</option><option>Archived</option></select></label>
          </div>
          {filteredProductionSpecs.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Spec</th><th>Client</th><th>Product</th><th>Size</th><th>Print</th><th>Qty</th><th>Lead</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{filteredProductionSpecs.map((spec) => (
                  <tr key={spec.id}>
                    <td><strong>{spec.specNumber}</strong><div className="table-subtext">{spec.specDate ? formatDate(spec.specDate) : ''}</div></td>
                    <td>{spec.clientName}</td>
                    <td>{spec.productName}</td>
                    <td>{spec.sizeWidthMm ? `${spec.sizeWidthMm}×${spec.sizeHeightMm}${spec.sizeGussetMm ? `×${spec.sizeGussetMm}` : ''}mm` : '—'}</td>
                    <td>{spec.printMethod}{spec.printColours ? ` · ${spec.printColours}c` : ''}</td>
                    <td>{spec.quantityOrdered ? `${formatNumber(spec.quantityOrdered)} ${spec.quantityUnit}` : '—'}</td>
                    <td>{spec.leadTimeDays ? `${spec.leadTimeDays}d` : '—'}</td>
                    <td>{spec.status}</td>
                    <td>
                      <button className="table-button" onClick={() => setPreviewSpecId(spec.id)}>Preview</button>{' '}
                      <button className="table-button" onClick={() => { onEdit(spec); setMode('form'); }}>Edit</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No production specs yet" body="Capture the spec for an order so production and the customer share one source of truth." />}
        </section>
      )}
    </>
  );
}

interface ProductionSpecPreviewProps {
  spec: ProductionSpec;
  onClose: () => void;
  onEdit: () => void;
}

function ProductionSpecPreview({ spec, onClose, onEdit }: ProductionSpecPreviewProps) {
  return (
    <PrintableDocument
      documentTitle="Production Spec"
      meta={[
        { label: 'SPEC NO', value: spec.specNumber },
        { label: 'DATE', value: spec.specDate ? formatDate(spec.specDate) : '—' },
        ...(spec.jobNumber ? [{ label: 'JOB', value: spec.jobNumber }] : []),
        { label: 'STATUS', value: spec.status },
      ]}
      billTo={
        <>
          <div>{spec.clientName}</div>
          {spec.clientCompanyName ? <div>{spec.clientCompanyName}</div> : null}
        </>
      }
      toolbar={
        <>
          <button className="ghost-button" onClick={onClose}>Back to register</button>
          <button className="secondary-button" onClick={onEdit}>Edit</button>
          <button className="primary-button" onClick={() => window.print()}>Print / Save PDF</button>
        </>
      }
      footer={
        <>
          <p>This document supersedes any previous spec for this product. Any change must be re-approved before production.</p>
          {spec.approvedBy ? <p>Approved by {spec.approvedBy}{spec.approvedDate ? ` on ${formatDate(spec.approvedDate)}` : ''}.</p> : null}
        </>
      }
    >
      <h3 style={{ margin: '0 0 4mm' }}>{spec.productName}</h3>
      <dl className="printable-doc-spec-grid">
        <div className="printable-doc-spec-item"><dt>Size</dt><dd>{spec.sizeWidthMm ? `${spec.sizeWidthMm}×${spec.sizeHeightMm}${spec.sizeGussetMm ? `×${spec.sizeGussetMm}` : ''}mm` : '—'}</dd></div>
        <div className="printable-doc-spec-item"><dt>Paper</dt><dd>{spec.paperGsm ? `${spec.paperGsm}gsm ` : ''}{spec.paperType || '—'}</dd></div>
        <div className="printable-doc-spec-item"><dt>Handle</dt><dd>{spec.handleType}</dd></div>
        <div className="printable-doc-spec-item"><dt>Print method</dt><dd>{spec.printMethod}{spec.printColours ? ` · ${spec.printColours} colour${Number(spec.printColours) === 1 ? '' : 's'}` : ''}</dd></div>
        <div className="printable-doc-spec-item"><dt>Pantones</dt><dd>{spec.pantoneReferences || '—'}</dd></div>
        <div className="printable-doc-spec-item"><dt>Artwork ref</dt><dd>{spec.artworkReference || '—'}</dd></div>
        <div className="printable-doc-spec-item"><dt>Quantity</dt><dd>{spec.quantityOrdered ? `${formatNumber(spec.quantityOrdered)} ${spec.quantityUnit}` : '—'}</dd></div>
        <div className="printable-doc-spec-item"><dt>Lead time</dt><dd>{spec.leadTimeDays ? `${spec.leadTimeDays} days` : '—'}</dd></div>
        <div className="printable-doc-spec-item"><dt>Packing format</dt><dd>{spec.packingFormat}</dd></div>
        {spec.finishingNotes ? <div className="printable-doc-spec-item" style={{ gridColumn: '1 / -1' }}><dt>Finishing</dt><dd>{spec.finishingNotes}</dd></div> : null}
        {spec.printPositionNotes ? <div className="printable-doc-spec-item" style={{ gridColumn: '1 / -1' }}><dt>Print position</dt><dd>{spec.printPositionNotes}</dd></div> : null}
        {spec.packingNotes ? <div className="printable-doc-spec-item" style={{ gridColumn: '1 / -1' }}><dt>Packing</dt><dd>{spec.packingNotes}</dd></div> : null}
        {spec.notes ? <div className="printable-doc-spec-item" style={{ gridColumn: '1 / -1' }}><dt>Notes</dt><dd>{spec.notes}</dd></div> : null}
      </dl>
    </PrintableDocument>
  );
}
