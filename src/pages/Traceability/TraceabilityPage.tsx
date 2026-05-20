/**
 * Batch Traceability search.
 *
 * Pick a search type (internal batch / raw material / FG batch / job /
 * delivery note / invoice / customer / machine), enter a value, hit
 * Search. The page calls `traceBatch()` and displays every record
 * connected to the starting point grouped by type, plus a headline
 * recall summary: "X batches touched, Y customers affected".
 *
 * The recall query — "which customers received product from raw paper
 * batch RCV-2026-0188?" — is just `traceBatch({ searchType:
 * 'rawMaterialReceipt', query: 'RCV-2026-0188', data })` and reading
 * the `customers` array off the result.
 */

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AppData,
  TraceabilitySearchType,
  TRACEABILITY_SEARCH_LABELS,
  traceBatch,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface TraceabilityPageProps {
  data: AppData;
  /** Optional seed — used when navigating in from a Complaint's "Trace" button. */
  seed?: { type: TraceabilitySearchType; query: string } | null;
  onSeedConsumed?: () => void;
}

export function TraceabilityPage({ data, seed, onSeedConsumed }: TraceabilityPageProps) {
  const [searchType, setSearchType] = useState<TraceabilitySearchType>(seed?.type ?? 'internalBatch');
  const [query, setQuery] = useState(seed?.query ?? '');
  const [submitted, setSubmitted] = useState<{ type: TraceabilitySearchType; q: string } | null>(
    seed ? { type: seed.type, q: seed.query } : null,
  );

  // When a seed comes in mid-render (deep link from a Complaint), apply it once.
  useEffect(() => {
    if (seed) {
      setSearchType(seed.type);
      setQuery(seed.query);
      setSubmitted({ type: seed.type, q: seed.query });
      onSeedConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.type, seed?.query]);

  const result = useMemo(() => {
    if (!submitted || !submitted.q.trim()) return null;
    return traceBatch({ searchType: submitted.type, query: submitted.q, data });
  }, [submitted, data]);

  function handleSearch() {
    setSubmitted({ type: searchType, q: query });
  }

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle
          title="Batch Traceability"
          subtitle="Trace every record connected to a batch / job / invoice / customer / machine. Use this during a recall or investigation."
        />
        <div className="filters-grid">
          <label><span>Search by</span>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value as TraceabilitySearchType)}>
              {(Object.keys(TRACEABILITY_SEARCH_LABELS) as TraceabilitySearchType[]).map((t) => (
                <option key={t} value={t}>{TRACEABILITY_SEARCH_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: 'span 2' }}><span>{TRACEABILITY_SEARCH_LABELS[searchType]}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Enter value and press Enter or Search"
              autoFocus
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="secondary-button" onClick={handleSearch} disabled={!query.trim()}>Search</button>
          </div>
        </div>

        {!submitted ? (
          <EmptyState title="Pick a starting point" body="Enter a batch number, job, invoice, customer name or machine and the dashboard will surface every connected record." />
        ) : !result || (result.jobs.length === 0 && result.rawMaterialReceipts.length === 0 && result.finishedGoodsStock.length === 0 && result.customers.length === 0) ? (
          <EmptyState title="No records matched" body="The search returned no matches. Double-check spelling, try a different search type, or widen the date window on your records." />
        ) : (
          <>
            <div className="food-safety-stats">
              <div className="food-safety-stat"><span>Batches touched</span><strong>{result.batchCount}</strong></div>
              <div className={`food-safety-stat${result.affectedCustomerCount > 0 ? ' food-safety-stat-alert' : ''}`}><span>Customers affected</span><strong>{result.affectedCustomerCount}</strong></div>
              <div className="food-safety-stat"><span>Jobs in trace</span><strong>{result.jobs.length}</strong></div>
              <div className="food-safety-stat"><span>Raw receipts</span><strong>{result.rawMaterialReceipts.length}</strong></div>
              <div className="food-safety-stat"><span>FG batches</span><strong>{result.finishedGoodsStock.length}</strong></div>
              <div className="food-safety-stat"><span>Deliveries</span><strong>{result.deliveryNotes.length}</strong></div>
              <div className="food-safety-stat"><span>Invoices</span><strong>{result.invoices.length}</strong></div>
              <div className={`food-safety-stat${result.complaints.length > 0 ? ' food-safety-stat-alert' : ''}`}><span>Complaints linked</span><strong>{result.complaints.length}</strong></div>
            </div>

            {result.customers.length > 0 && (
              <>
                <SectionTitle title="Recall list — customers affected" subtitle="Every client linked to a batch in this trace. Contact these customers if a recall is triggered." />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Client</th><th>Contact</th><th>Phone</th><th>Email</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {result.customers.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.name}</strong>{c.companyName && c.companyName !== c.name ? <div className="table-subtext">{c.companyName}</div> : null}</td>
                          <td>{c.contactName || '—'}</td>
                          <td>{c.phoneNumber || c.mobileNumber || '—'}</td>
                          <td>{c.contactEmail || '—'}</td>
                          <td>{c.notes || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result.jobs.length > 0 && (
              <>
                <SectionTitle title="Jobs in the trace" />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Job #</th><th>Client</th><th>Product</th><th>Date</th><th>Qty planned</th><th>Internal batch</th><th>Food contact</th></tr>
                    </thead>
                    <tbody>
                      {result.jobs.map((j) => (
                        <tr key={j.id}>
                          <td><strong>{j.jobNumber}</strong></td>
                          <td>{j.customerName}</td>
                          <td>{j.productName}</td>
                          <td>{formatDate(j.jobDate)}</td>
                          <td>{formatNumber(j.quantityPlanned)}</td>
                          <td>{j.internalBatchNumber || '—'}</td>
                          <td>{j.foodContactLevel || 'NonFood'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result.rawMaterialReceipts.length > 0 && (
              <>
                <SectionTitle title="Raw material receipts" />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Receipt #</th><th>Supplier</th><th>Material</th><th>Batch (supplier)</th><th>Roll code</th><th>Received</th><th>Qty</th></tr>
                    </thead>
                    <tbody>
                      {result.rawMaterialReceipts.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.receiptNumber}</strong></td>
                          <td>{r.supplierName}</td>
                          <td>{r.paperType} {r.gsm ? `· ${r.gsm}gsm` : ''}</td>
                          <td>{r.supplierBatchNumber || '—'}</td>
                          <td>{r.internalRollCode || '—'}</td>
                          <td>{formatDate(r.receivedDate)}</td>
                          <td>{formatNumber(r.quantityReceived)} {r.quantityUnit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result.foodSafeMaterials.length > 0 && (
              <>
                <SectionTitle title="Approved food-safe materials used" />
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Material</th><th>Category</th><th>Supplier</th><th>Status</th><th>Batch</th></tr></thead>
                    <tbody>
                      {result.foodSafeMaterials.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.materialName}</strong></td>
                          <td>{m.category}</td>
                          <td>{m.supplierName}</td>
                          <td>{m.status}</td>
                          <td>{m.internalBatchNumber || m.supplierBatchNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result.finishedGoodsStock.length > 0 && (
              <>
                <SectionTitle title="Finished goods batches" />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Stock #</th><th>Product</th><th>Client</th><th>Qty on hand</th><th>Storage</th><th>Hold status</th></tr>
                    </thead>
                    <tbody>
                      {result.finishedGoodsStock.map((fg) => (
                        <tr key={fg.id}>
                          <td><strong>{fg.stockNumber}</strong></td>
                          <td>{fg.productName}</td>
                          <td>{fg.clientName || 'General stock'}</td>
                          <td>{formatNumber(fg.quantityOnHand)} {fg.quantityUnit}</td>
                          <td>{fg.storageLocation || '—'}</td>
                          <td>{fg.foodSafetyHoldStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result.deliveryNotes.length > 0 && (
              <>
                <SectionTitle title="Delivery notes" />
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Note #</th><th>Date</th><th>Client</th><th>Job</th><th>Method</th><th>Status</th></tr></thead>
                    <tbody>
                      {result.deliveryNotes.map((dn) => (
                        <tr key={dn.id}>
                          <td><strong>{dn.deliveryNoteNumber}</strong></td>
                          <td>{formatDate(dn.noteDate)}</td>
                          <td>{dn.clientName}</td>
                          <td>{dn.jobNumber || '—'}</td>
                          <td>{dn.deliveryMethod}</td>
                          <td>{dn.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result.invoices.length > 0 && (
              <>
                <SectionTitle title="Invoices" />
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Total</th><th>Outstanding</th><th>Status</th></tr></thead>
                    <tbody>
                      {result.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><strong>{inv.invoiceNumber}</strong></td>
                          <td>{inv.clientName}</td>
                          <td>{formatDate(inv.invoiceDate)}</td>
                          <td>R {formatNumber(inv.totalInclVat, 2)}</td>
                          <td>R {formatNumber(inv.amountOutstanding, 2)}</td>
                          <td>{inv.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result.productionLogs.length > 0 && (
              <>
                <SectionTitle title="Production logs" />
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Log #</th><th>Date</th><th>Job</th><th>Machine</th><th>Operator</th><th>Good / Reject</th></tr></thead>
                    <tbody>
                      {result.productionLogs.slice(0, 30).map((log) => (
                        <tr key={log.id}>
                          <td><strong>{log.logNumber}</strong></td>
                          <td>{formatDate(log.logDate)}</td>
                          <td>{log.jobNumber}</td>
                          <td>{log.machine}</td>
                          <td>{log.operatorName}</td>
                          <td>{formatNumber(log.goodBags)} / {formatNumber(log.rejectBags)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.productionLogs.length > 30 && (
                  <p className="muted" style={{ marginTop: 8 }}>Showing first 30 of {result.productionLogs.length} production logs.</p>
                )}
              </>
            )}

            {result.complaints.length > 0 && (
              <>
                <SectionTitle title="Linked complaints" subtitle="Existing complaints that touch any record in this trace." />
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Date</th><th>Client</th><th>Type</th><th>Severity</th><th>Status</th><th>Qty affected</th></tr></thead>
                    <tbody>
                      {result.complaints.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.complaintNumber}</strong></td>
                          <td>{formatDate(c.complaintDate)}</td>
                          <td>{c.clientName}</td>
                          <td>{c.complaintType}</td>
                          <td>{c.severity}</td>
                          <td>{c.status}</td>
                          <td>{formatNumber(c.quantityAffected)} {c.quantityUnit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
