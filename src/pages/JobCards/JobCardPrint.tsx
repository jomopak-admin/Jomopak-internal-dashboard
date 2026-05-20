/**
 * Printable Job Card.
 *
 * Internal document — gets printed for the foreman / floor. Pulls
 * everything an operator needs to run the job: customer + product spec,
 * paper + print + handle + finishing, due date, machine, batch number,
 * food-safety context, signature lines.
 *
 * Different from the Work Ticket: this is the floor instruction sheet
 * (what to make + how + when), not the cost breakdown.
 */

import { AppSettingsCompany, JobCard, FOOD_CONTACT_LEVEL_LABELS } from '../../types';
import { PrintableDocument, PrintableDocumentMeta } from '../../components/PrintableDocument';
import { formatDate, formatNumber } from '../../utils/calculations';

interface JobCardPrintProps {
  job: JobCard;
  company?: AppSettingsCompany;
  defaultFooterLines?: string[];
  machineName?: string;
  onClose: () => void;
}

export function JobCardPrint({ job, company, defaultFooterLines, machineName, onClose }: JobCardPrintProps) {
  const meta: PrintableDocumentMeta[] = [
    { label: 'JOB #', value: job.jobNumber },
    { label: 'JOB DATE', value: job.jobDate ? formatDate(job.jobDate) : '—' },
    { label: 'DUE', value: job.dueDate ? formatDate(job.dueDate) : '—' },
    { label: 'STATUS', value: job.status },
    ...(job.quoteNumber ? [{ label: 'QUOTE', value: job.quoteNumber }] : []),
    ...(job.internalBatchNumber ? [{ label: 'BATCH', value: job.internalBatchNumber }] : []),
  ];

  const billTo = (
    <>
      <strong>{job.customerName || 'Customer'}</strong>
      {job.customerReference ? <div>Customer ref: {job.customerReference}</div> : null}
      {job.salesOwnerName ? <div>Sales: {job.salesOwnerName}</div> : null}
    </>
  );

  return (
    <PrintableDocument
      documentTitle="Job Card"
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
      {/* ----- Product + qty ----- */}
      <h3 className="work-ticket-print-section-h">Product</h3>
      <table className="printable-doc-table">
        <tbody>
          <tr><td><strong>Product</strong></td><td>{job.productName || '—'}</td></tr>
          <tr><td><strong>Description</strong></td><td>{job.description || '—'}</td></tr>
          <tr><td><strong>Size</strong></td><td>{job.sizeSpec || '—'}</td></tr>
          <tr><td><strong>Quantity planned</strong></td><td>{formatNumber(job.quantityPlanned)} units</td></tr>
          <tr><td><strong>Quantity completed</strong></td><td>{formatNumber(job.quantityCompleted)} units</td></tr>
          <tr><td><strong>Supply format</strong></td><td>{job.supplyFormat}</td></tr>
        </tbody>
      </table>

      {/* ----- Paper + print ----- */}
      <h3 className="work-ticket-print-section-h">Paper & print</h3>
      <table className="printable-doc-table">
        <tbody>
          <tr><td><strong>Paper type</strong></td><td>{job.paperType || '—'}</td></tr>
          <tr><td><strong>GSM</strong></td><td>{job.gsm || '—'}</td></tr>
          <tr><td><strong>Paper qty required</strong></td><td>{formatNumber(job.paperQuantityRequired)} {job.paperQuantityUnit}</td></tr>
          <tr><td><strong>Print method</strong></td><td>{job.printMethod}{job.printRequired ? '' : ' · No print'}</td></tr>
          <tr><td><strong>Colour count</strong></td><td>{job.colorCount}</td></tr>
          <tr><td><strong>Print notes</strong></td><td>{job.printNotes || '—'}</td></tr>
        </tbody>
      </table>

      {/* ----- Production assignment ----- */}
      <h3 className="work-ticket-print-section-h">Production</h3>
      <table className="printable-doc-table">
        <tbody>
          <tr><td><strong>Assigned machine</strong></td><td>{machineName || (job.assignedMachineId ? job.assignedMachineId : 'Not yet assigned')}</td></tr>
          <tr><td><strong>Factory release date</strong></td><td>{job.factoryReleaseDate ? formatDate(job.factoryReleaseDate) : '—'}</td></tr>
          <tr><td><strong>Released by</strong></td><td>{job.factoryReleasedBy || '—'}</td></tr>
          <tr><td><strong>Production start</strong></td><td>{job.productionStartDate ? formatDate(job.productionStartDate) : '—'}</td></tr>
          <tr><td><strong>Started by</strong></td><td>{job.productionStartedBy || '—'}</td></tr>
          <tr><td><strong>Ready for dispatch</strong></td><td>{job.readyForDispatchDate ? formatDate(job.readyForDispatchDate) : '—'}</td></tr>
        </tbody>
      </table>

      {/* ----- Food safety (only if applicable) ----- */}
      {job.foodContactLevel && job.foodContactLevel !== 'NonFood' ? (
        <>
          <h3 className="work-ticket-print-section-h">Food safety</h3>
          <table className="printable-doc-table">
            <tbody>
              <tr><td><strong>Food-contact level</strong></td><td>{FOOD_CONTACT_LEVEL_LABELS[job.foodContactLevel]}</td></tr>
              <tr><td><strong>Internal batch number</strong></td><td>{job.internalBatchNumber || '—'}</td></tr>
              <tr><td><strong>Approved materials count</strong></td><td>{(job.foodSafeMaterialIds ?? []).length}</td></tr>
              {job.foodSafetyNotes ? <tr><td><strong>Notes</strong></td><td>{job.foodSafetyNotes}</td></tr> : null}
            </tbody>
          </table>
        </>
      ) : null}

      {/* ----- Packing + Notes ----- */}
      {(job.packingNotes || job.notes || job.qualityNotes) ? (
        <>
          <h3 className="work-ticket-print-section-h">Packing & notes</h3>
          {job.packingNotes ? <p style={{ fontSize: 13 }}><strong>Packing:</strong> {job.packingNotes}</p> : null}
          {job.qualityNotes ? <p style={{ fontSize: 13 }}><strong>Quality:</strong> {job.qualityNotes}</p> : null}
          {job.notes ? <p style={{ fontSize: 13 }}><strong>Notes:</strong> {job.notes}</p> : null}
        </>
      ) : null}

      {/* ----- Signature ----- */}
      <section className="work-ticket-print-signoff">
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Operator (start)</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Foreman</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">QC sign-off</span>
        </div>
      </section>
    </PrintableDocument>
  );
}
