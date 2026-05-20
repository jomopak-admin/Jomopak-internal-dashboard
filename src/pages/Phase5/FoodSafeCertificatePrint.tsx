/**
 * Food-Safe Packaging Declaration / Certificate.
 *
 * Printable per-batch certificate that a customer can present to their
 * food regulator. Pulls the food-contact level, approved materials, QC
 * sign-off, and traceability details directly from a Job / FG batch.
 */

import { AppSettingsCompany, FoodSafeMaterial, FOOD_CONTACT_LEVEL_LABELS, JobCard, isQcStagePassed } from '../../types';
import { PrintableDocument, PrintableDocumentMeta } from '../../components/PrintableDocument';
import { formatDate, formatNumber } from '../../utils/calculations';

interface FoodSafeCertificatePrintProps {
  job: JobCard;
  approvedMaterials: FoodSafeMaterial[];
  company?: AppSettingsCompany;
  defaultFooterLines?: string[];
  onClose: () => void;
}

export function FoodSafeCertificatePrint({
  job,
  approvedMaterials,
  company,
  defaultFooterLines,
  onClose,
}: FoodSafeCertificatePrintProps) {
  const linkedMaterials = approvedMaterials.filter((m) => job.foodSafeMaterialIds.includes(m.id));
  const firstOff = (job.qcPlan ?? []).find((s) => s.stage === 'FirstOff');
  const final = (job.qcPlan ?? []).find((s) => s.stage === 'FinalInspection');
  const firstOffPassed = firstOff ? isQcStagePassed(firstOff) : false;
  const finalPassed = final ? isQcStagePassed(final) : false;

  const meta: PrintableDocumentMeta[] = [
    { label: 'CERTIFICATE #', value: `FSC-${job.jobNumber}` },
    { label: 'JOB #', value: job.jobNumber },
    { label: 'BATCH', value: job.internalBatchNumber || '—' },
    { label: 'DATE', value: formatDate(new Date().toISOString().slice(0, 10)) },
    { label: 'FOOD CONTACT', value: FOOD_CONTACT_LEVEL_LABELS[job.foodContactLevel ?? 'NonFood'] },
  ];

  const billTo = (
    <>
      <strong>{job.customerName || 'Customer'}</strong>
      <div>Customer reference: {job.customerReference || '—'}</div>
      <div>Product: {job.productName}</div>
      <div>Quantity: {formatNumber(job.quantityPlanned)} units</div>
    </>
  );

  return (
    <PrintableDocument
      documentTitle="Food-Safe Packaging Declaration"
      meta={meta}
      billTo={billTo}
      company={company}
      defaultFooterLines={defaultFooterLines}
      toolbar={
        <>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
          <button type="button" className="primary-button" onClick={() => window.print()}>Print</button>
        </>
      }
    >
      <section style={{ margin: '16px 0' }}>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          We hereby declare that the packaging product identified above has been manufactured
          in accordance with our food safety procedures and is fit for its declared food-contact
          purpose ({FOOD_CONTACT_LEVEL_LABELS[job.foodContactLevel ?? 'NonFood']}). All materials
          used are listed below and have been approved against current food-safe documentation.
        </p>
      </section>

      <h3 className="work-ticket-print-section-h">Approved materials used in this batch</h3>
      {linkedMaterials.length === 0 ? (
        <p className="muted">No approved materials recorded on this job.</p>
      ) : (
        <table className="printable-doc-table">
          <thead>
            <tr><th>Material</th><th>Category</th><th>Supplier</th><th>Batch</th><th>Approval</th></tr>
          </thead>
          <tbody>
            {linkedMaterials.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.materialName}</strong></td>
                <td>{m.category}</td>
                <td>{m.supplierName}</td>
                <td>{m.internalBatchNumber || m.supplierBatchNumber || '—'}</td>
                <td>
                  {m.directContactApproved ? 'Direct contact' : ''}
                  {m.directContactApproved && m.indirectContactApproved ? ' · ' : ''}
                  {m.indirectContactApproved && !m.directContactApproved ? 'Indirect contact' : ''}
                  {!m.directContactApproved && !m.indirectContactApproved ? '—' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="work-ticket-print-section-h">Quality control sign-off</h3>
      <table className="printable-doc-table">
        <thead><tr><th>Stage</th><th>Status</th><th>Signed by</th><th>Date</th></tr></thead>
        <tbody>
          <tr>
            <td>First-off approval</td>
            <td>{firstOffPassed ? 'PASSED' : 'PENDING'}</td>
            <td>{firstOff?.signedOffByName || '—'}</td>
            <td>{firstOff?.signedOffAt ? formatDate(firstOff.signedOffAt.slice(0, 10)) : '—'}</td>
          </tr>
          <tr>
            <td>Final inspection</td>
            <td>{finalPassed ? 'PASSED' : 'PENDING'}</td>
            <td>{final?.signedOffByName || '—'}</td>
            <td>{final?.signedOffAt ? formatDate(final.signedOffAt.slice(0, 10)) : '—'}</td>
          </tr>
        </tbody>
      </table>

      {job.foodSafetyNotes ? (
        <section style={{ margin: '16px 0' }}>
          <h3 className="work-ticket-print-section-h">Food safety notes</h3>
          <p>{job.foodSafetyNotes}</p>
        </section>
      ) : null}

      <section className="work-ticket-print-signoff">
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Authorised by (Jomopak)</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Date</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Stamp</span>
        </div>
      </section>
    </PrintableDocument>
  );
}
