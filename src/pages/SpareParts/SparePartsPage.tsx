import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import { JobCard, Machine, SparePart, SparePartFilters, SparePartFormState, STOCK_ITEM_CATEGORIES, StockCount, StockCountFormState, StockIssue, StockIssueFilters, StockIssueFormState, StockItemCategory, Supplier } from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SignaturePad } from '../../components/SignaturePad';

interface SparePartsPageProps {
  machines: Machine[];
  suppliers: Supplier[];
  jobs: JobCard[];
  spareForm: SparePartFormState;
  setSpareForm: (value: SparePartFormState) => void;
  spareEditingId: string | null;
  spareMessage: string;
  onSave: () => void;
  onReset: () => void;
  spareFilters: SparePartFilters;
  setSpareFilters: (value: SparePartFilters) => void;
  filteredSpares: SparePart[];
  onEdit: (part: SparePart) => void;

  stockIssues: StockIssue[];
  filteredStockIssues: StockIssue[];
  stockIssueForm: StockIssueFormState;
  setStockIssueForm: (value: StockIssueFormState) => void;
  stockIssueMessage: string;
  stockIssueFilters: StockIssueFilters;
  setStockIssueFilters: (value: StockIssueFilters) => void;
  onStartIssue: (itemId: string) => void;
  onSaveStockIssue: () => void;
  onCancelStockIssue: () => void;
  onReturnTool: (issueId: string, condition: 'Good' | 'Damaged' | 'Lost') => void;

  stockCounts: StockCount[];
  stockCountForm: StockCountFormState;
  setStockCountForm: (value: StockCountFormState) => void;
  stockCountMessage: string;
  onSaveStockCount: () => void;
  onCancelStockCount: () => void;
  onReconcileStockCount: (countId: string, reconciledByName: string) => void;
  isAdmin: boolean;
  /** Phase 66 — when true, hide qty + cost and show "In stock / Out". */
  restrictedView?: boolean;
}

export function SparePartsPage({
  machines,
  suppliers,
  jobs,
  spareForm,
  setSpareForm,
  spareEditingId,
  spareMessage,
  onSave,
  onReset,
  spareFilters,
  setSpareFilters,
  filteredSpares,
  onEdit,
  stockIssues,
  filteredStockIssues,
  stockIssueForm,
  setStockIssueForm,
  stockIssueMessage,
  stockIssueFilters,
  setStockIssueFilters,
  onStartIssue,
  onSaveStockIssue,
  onCancelStockIssue,
  onReturnTool,
  stockCounts,
  stockCountForm,
  setStockCountForm,
  stockCountMessage,
  onSaveStockCount,
  onCancelStockCount,
  onReconcileStockCount,
  isAdmin,
  restrictedView = false,
}: SparePartsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [showCountForm, setShowCountForm] = useState(false);
  const [tab, setTab] = useState<'inventory' | 'issues'>('inventory');
  const issueTargetItem = useMemo(
    () => filteredSpares.find((part) => part.id === stockIssueForm.itemId)
      ?? null,
    [filteredSpares, stockIssueForm.itemId],
  );
  const lookupItemForIssue = useMemo(
    () => stockIssueForm.itemId
      ? (issueTargetItem ?? filteredSpares.find((part) => part.id === stockIssueForm.itemId) ?? null)
      : null,
    [issueTargetItem, filteredSpares, stockIssueForm.itemId],
  );
  const activeIssueItem = lookupItemForIssue;
  const toolsOut = useMemo(
    () => stockIssues.filter((issue) => issue.itemType === 'Tool' && issue.status === 'Issued'),
    [stockIssues],
  );

  const reports = useMemo(() => {
    const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentIssues = stockIssues.filter((issue) => new Date(issue.issuedAt).getTime() >= cutoffMs);

    const consumeByItem = new Map<string, { itemName: string; totalQty: number; unit: string; count: number }>();
    recentIssues.forEach((issue) => {
      if (issue.itemType !== 'Consumable') return;
      const prev = consumeByItem.get(issue.itemId);
      consumeByItem.set(issue.itemId, {
        itemName: issue.itemName,
        totalQty: (prev?.totalQty ?? 0) + issue.quantity,
        unit: issue.unitOfMeasure,
        count: (prev?.count ?? 0) + 1,
      });
    });
    const topConsumers = Array.from(consumeByItem.entries())
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    const usageByJob = new Map<string, { jobNumber: string; issueCount: number; itemCount: Set<string> }>();
    recentIssues.forEach((issue) => {
      if (!issue.jobId) return;
      const prev = usageByJob.get(issue.jobId);
      const items = prev?.itemCount ?? new Set<string>();
      items.add(issue.itemId);
      usageByJob.set(issue.jobId, {
        jobNumber: issue.jobNumber || issue.jobId,
        issueCount: (prev?.issueCount ?? 0) + 1,
        itemCount: items,
      });
    });
    const topJobs = Array.from(usageByJob.entries())
      .map(([id, value]) => ({ id, jobNumber: value.jobNumber, issueCount: value.issueCount, distinctItems: value.itemCount.size }))
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 5);

    const lowStock = filteredSpares
      .filter((part) => part.itemType === 'Consumable' && part.quantityOnHand <= (part.reorderLevel || part.minimumStockLevel))
      .slice(0, 10);

    const overdueDays = 7;
    const overdueCutoffMs = Date.now() - overdueDays * 24 * 60 * 60 * 1000;
    const toolsOverdue = toolsOut.filter((issue) => new Date(issue.issuedAt).getTime() < overdueCutoffMs);

    return { topConsumers, topJobs, lowStock, toolsOverdue };
  }, [stockIssues, filteredSpares, toolsOut]);

  useEffect(() => {
    if (spareEditingId) {
      setMode('form');
    }
  }, [spareEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(part: SparePart) {
    onEdit(part);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const isMachineSpare = spareForm.category === 'Machine Spare';
  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Item identity',
      subtitle: 'How operators recognise this item on the shop floor.',
      missingRequired: [
        ...(spareForm.partName.trim() ? [] : ['Item name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Item name <RequiredMarker /></span><input value={spareForm.partName} onChange={(event) => setSpareForm({ ...spareForm, partName: event.target.value })} /></label>
          <label>
            <span>Category</span>
            <select value={spareForm.category} onChange={(event) => {
              const next = event.target.value as StockItemCategory;
              setSpareForm({ ...spareForm, category: next });
            }}>
              {STOCK_ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Item type</span>
            <select value={spareForm.itemType} onChange={(event) => setSpareForm({ ...spareForm, itemType: event.target.value as SparePartFormState['itemType'] })}>
              <option value="Consumable">Consumable (gets used up)</option>
              <option value="Tool">Tool (checked out, returned)</option>
            </select>
          </label>
          <label><span>Barcode</span><input value={spareForm.barcode} onChange={(event) => setSpareForm({ ...spareForm, barcode: event.target.value })} placeholder="Scan or enter barcode" /></label>
          <label className="full-span checkbox-label">
            <input type="checkbox" checked={spareForm.productionUse} onChange={(event) => setSpareForm({ ...spareForm, productionUse: event.target.checked })} />
            <span>Used for production jobs (when issued, requires a job number)</span>
          </label>
        </div>
      ),
    },
    {
      key: 'links',
      title: 'Machine & supplier',
      subtitle: isMachineSpare
        ? 'Which machine this fits and where to source replacements.'
        : 'Optional: pin to a machine if relevant. Always set a supplier if you can.',
      body: (
        <div className="form-grid">
          <label>
            <span>Machine{isMachineSpare ? <RequiredMarker /> : null}</span>
            <select
              value={spareForm.machineId}
              onChange={(event) => {
                const machine = machines.find((item) => item.id === event.target.value);
                setSpareForm({
                  ...spareForm,
                  machineId: machine?.id ?? '',
                  machineReference: machine?.name ?? '',
                });
              }}
            >
              <option value="">{isMachineSpare ? 'Select machine' : 'Not machine-specific'}</option>
              {machines.filter((machine) => machine.active).map((machine) => (
                <option key={machine.id} value={machine.id}>{machine.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Supplier</span>
            <select
              value={spareForm.supplierId}
              onChange={(event) => {
                const supplier = suppliers.find((item) => item.id === event.target.value);
                setSpareForm({
                  ...spareForm,
                  supplierId: supplier?.id ?? '',
                  supplierName: supplier?.name ?? spareForm.supplierName,
                });
              }}
            >
              <option value="">Select supplier</option>
              {suppliers.filter((supplier) => supplier.active).map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'stock',
      title: 'Stock levels',
      subtitle: 'On-hand, minimum and reorder points to keep maintenance unblocked.',
      body: (
        <div className="form-grid">
          <label><span>Quantity on hand</span><input type="number" min="0" value={spareForm.quantityOnHand} onChange={(event) => setSpareForm({ ...spareForm, quantityOnHand: event.target.value })} /></label>
          <label><span>Minimum stock</span><input type="number" min="0" value={spareForm.minimumStockLevel} onChange={(event) => setSpareForm({ ...spareForm, minimumStockLevel: event.target.value })} /></label>
          <label><span>Reorder level</span><input type="number" min="0" value={spareForm.reorderLevel} onChange={(event) => setSpareForm({ ...spareForm, reorderLevel: event.target.value })} /></label>
          <label><span>Unit</span><select value={spareForm.unitOfMeasure} onChange={(event) => setSpareForm({ ...spareForm, unitOfMeasure: event.target.value as SparePartFormState['unitOfMeasure'] })}><option>units</option><option>kg</option><option>rolls</option><option>sheets</option></select></label>
        </div>
      ),
    },
    {
      key: 'cost-storage',
      title: 'Cost & storage',
      subtitle: 'Where the part lives and how to value it.',
      body: (
        <div className="form-grid">
          <label><span>Unit cost</span><input type="number" min="0" step="0.01" value={spareForm.unitCost} onChange={(event) => setSpareForm({ ...spareForm, unitCost: event.target.value })} /></label>
          <label><span>Storage location</span><input value={spareForm.storageLocation} onChange={(event) => setSpareForm({ ...spareForm, storageLocation: event.target.value })} /></label>
          <label><span>Last purchase date</span><input type="date" value={spareForm.lastPurchaseDate} onChange={(event) => setSpareForm({ ...spareForm, lastPurchaseDate: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes & security',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={spareForm.notes} onChange={(event) => setSpareForm({ ...spareForm, notes: event.target.value })} /></label>
          <label className="checkbox-row full-span">
            <input
              type="checkbox"
              checked={Boolean(spareForm.isHighValue)}
              onChange={(e) => setSpareForm({ ...spareForm, isHighValue: e.target.checked })}
            />
            <span>
              <strong>High-value item</strong> — requires a foreman/ops PIN to issue.
              Use for theft-prone consumables (premium ink drums, branded uniforms,
              valuable tools).
            </span>
          </label>
          <div className="full-span">
            <PhotoUploader
              urls={spareForm.photoUrls ?? []}
              onChange={(urls) => setSpareForm({ ...spareForm, photoUrls: urls })}
              recordType="spares"
              recordId={spareEditingId || `draft-${Date.now()}`}
              label="Photos (helps techs ID the part)"
              max={6}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        backAction={mode === 'form' ? <button className="ghost-button" onClick={handleBackToList}>Back to Spares & Consumables</button> : null}

        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add new item</button>
          ) : null
}
      />

      {mode === 'form' ? (
        <FormWizard
          title={spareEditingId ? 'Edit item' : 'New item'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={spareMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!spareEditingId}
          saveLabel="Save item"
        />
      ) : (
        <section className="card">
          <SectionTitle
            title="Spares & consumables register"
            subtitle={`${filteredSpares.length} record(s) shown · This is your general factory stock register: spares, consumables, ink, glue, uniform, kitchen, cleaning, office — anything you stock to keep the factory running. Chemicals live in the MSDS register; both are counted together at stock-take.`}
          />
          <div className="filters-grid">
            <label><span>Search</span><input value={spareFilters.search} onChange={(event) => setSpareFilters({ ...spareFilters, search: event.target.value })} /></label>
            <label>
              <span>Category</span>
              <select value={spareFilters.category} onChange={(event) => setSpareFilters({ ...spareFilters, category: event.target.value })}>
                <option value="">All categories</option>
                {STOCK_ITEM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label><span>Low stock</span><select value={spareFilters.lowStock} onChange={(event) => setSpareFilters({ ...spareFilters, lowStock: event.target.value })}><option value="all">All</option><option value="yes">Low stock only</option><option value="no">Healthy stock</option></select></label>
            <label><span>Supplier</span><input value={spareFilters.supplier} onChange={(event) => setSpareFilters({ ...spareFilters, supplier: event.target.value })} /></label>
          </div>
          {filteredSpares.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Machine</th>
                    <th>On hand</th>
                    <th>Status</th>
                    <th>Reorder</th>
                    <th>Supplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpares.map((part) => (
                    <tr key={part.id}>
                      <td>
                        <strong>{part.partName}</strong>
                        {part.isHighValue ? <span style={{ marginLeft: 6, fontSize: '0.65rem', padding: '1px 5px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 999 }}>HIGH VALUE</span> : null}
                        <div className="table-subtext">
                          {part.partCode} · {part.category || 'No category'}
                          {part.productionUse ? '' : ' · Non-production'}
                        </div>
                      </td>
                      <td>{part.itemType}</td>
                      <td>{part.machineReference || (part.itemType === 'Tool' ? 'Tool' : 'General')}</td>
                      <td>
                        {/* Phase 66 — restricted users see "In stock / Out of stock"
                            instead of an exact count + can't compute skim value. */}
                        {restrictedView
                          ? (part.quantityOnHand > 0 ? <span className="ok-pill">In stock</span> : <span className="warn-pill">Out</span>)
                          : `${formatNumber(part.quantityOnHand)} ${part.unitOfMeasure}`}
                      </td>
                      <td>
                        {part.itemType === 'Tool'
                          ? (part.currentStatus === 'Out'
                              ? <span className="warn-pill">Out · {part.currentHolderName || 'Unknown'}</span>
                              : <span className="ok-pill">In stock</span>)
                          : (part.quantityOnHand <= part.reorderLevel
                              ? <span className="warn-pill">Reorder</span>
                              : <span className="ok-pill">Healthy</span>)}
                      </td>
                      <td>{restrictedView ? '—' : `${formatNumber(part.reorderLevel)} ${part.unitOfMeasure}`}</td>
                      <td>{part.supplierName || 'Not set'}</td>
                      <td>
                        <div className="row-actions">
                          {part.itemType === 'Tool' && part.currentStatus === 'Out' ? (
                            <span className="table-meta">Out · awaiting return</span>
                          ) : (
                            <button className="table-button" onClick={() => onStartIssue(part.id)}>
                              {part.itemType === 'Tool' ? 'Check out' : 'Issue'}
                            </button>
                          )}
                          <button className="table-button" onClick={() => handleStartEdit(part)}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No items yet" body="Start tracking spares, consumables, tools or PPE so reorder planning and tool check-out are visible." />
          )}
        </section>
      )}

      {mode === 'list' && activeIssueItem ? (
        <section className="card">
          <SectionTitle
            title={activeIssueItem.itemType === 'Tool' ? `Check out: ${activeIssueItem.partName}` : `Issue stock: ${activeIssueItem.partName}`}
            subtitle={activeIssueItem.itemType === 'Tool'
              ? 'Record who is taking the tool. Mark it returned when it comes back.'
              : `On hand: ${formatNumber(activeIssueItem.quantityOnHand)} ${activeIssueItem.unitOfMeasure}`}
            action={<button className="ghost-button" onClick={onCancelStockIssue}>Cancel</button>}
          />
          {stockIssueMessage && <div className="form-message">{stockIssueMessage}</div>}
          <div className="form-grid">
            {activeIssueItem.itemType === 'Consumable' && (
              <label>
                <span>Quantity to issue <RequiredMarker /></span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stockIssueForm.quantity}
                  onChange={(event) => setStockIssueForm({ ...stockIssueForm, quantity: event.target.value })}
                />
              </label>
            )}
            <label>
              <span>Issued to <RequiredMarker /></span>
              <input
                value={stockIssueForm.issuedToName}
                onChange={(event) => setStockIssueForm({ ...stockIssueForm, issuedToName: event.target.value })}
                placeholder="Operator name"
              />
            </label>
            <label>
              <span>Issued by</span>
              <input
                value={stockIssueForm.issuedByName}
                onChange={(event) => setStockIssueForm({ ...stockIssueForm, issuedByName: event.target.value })}
                placeholder="Storeman / supervisor"
              />
            </label>
            {activeIssueItem.productionUse ? (
              <label>
                <span>Job <RequiredMarker /></span>
                <select
                  value={stockIssueForm.jobId}
                  onChange={(event) => {
                    const job = jobs.find((j) => j.id === event.target.value);
                    setStockIssueForm({
                      ...stockIssueForm,
                      jobId: job?.id ?? '',
                      jobNumber: job?.jobNumber ?? '',
                    });
                  }}
                >
                  <option value="">Select job</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.jobNumber}</option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="form-hint">No job required (item is flagged non-production).</div>
            )}
            <label className="full-span">
              <span>Notes</span>
              <textarea
                value={stockIssueForm.notes}
                onChange={(event) => setStockIssueForm({ ...stockIssueForm, notes: event.target.value })}
              />
            </label>
          </div>

          {/* Phase 66 — high-value approval banner. Visible only when
              the item being issued is flagged high-value. App.tsx
              enforces the PIN check on save; here we just collect it
              and signal the requirement to the operator. */}
          {activeIssueItem.isHighValue && (
            <div className="card subtle-card" style={{ background: '#fef3c7', border: '1px solid #f59e0b', marginTop: 10 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>High-value item — foreman approval required</p>
              <p className="muted" style={{ margin: '4px 0 8px', fontSize: '0.82rem' }}>
                A foreman / ops / admin user must enter their 4-digit approval PIN. The PIN
                is set per profile via Permissions. Both names are stored on the issue.
              </p>
              <div className="form-grid">
                <label>
                  <span>Approver name <RequiredMarker /></span>
                  <input
                    value={stockIssueForm.approverName || ''}
                    onChange={(e) => setStockIssueForm({ ...stockIssueForm, approverName: e.target.value })}
                    placeholder="Foreman / ops user"
                  />
                </label>
                <label>
                  <span>Approval PIN <RequiredMarker /></span>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={stockIssueForm.approverPin || ''}
                    onChange={(e) => setStockIssueForm({ ...stockIssueForm, approverPin: e.target.value })}
                    placeholder="4-digit"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Phase 66 — receiver signature (always required from here on). */}
          <div style={{ marginTop: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Receiver signature <RequiredMarker /></span>
            <SignaturePad
              label="Sign to confirm receipt"
              onChange={(dataUrl) => setStockIssueForm({ ...stockIssueForm, signatureDataUrl: dataUrl })}
            />
            {stockIssueForm.signatureDataUrl && (
              <img src={stockIssueForm.signatureDataUrl} alt="Signature" style={{ maxWidth: 200, marginTop: 6, border: '1px solid #ddd', borderRadius: 4 }} />
            )}
          </div>

          <div className="form-footer">
            <button className="primary-button" onClick={onSaveStockIssue}>
              {activeIssueItem.itemType === 'Tool' ? 'Check out tool' : 'Issue stock'}
            </button>
          </div>
        </section>
      ) : null}

      {mode === 'list' && toolsOut.length > 0 && (
        <section className="card">
          <SectionTitle title="Tools currently out" subtitle={`${toolsOut.length} tool(s) checked out`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Issued to</th>
                  <th>Issued by</th>
                  <th>Issued at</th>
                  <th>Job</th>
                  <th>Return</th>
                </tr>
              </thead>
              <tbody>
                {toolsOut.map((issue) => (
                  <tr key={issue.id}>
                    <td><strong>{issue.itemName}</strong></td>
                    <td>{issue.issuedToName}</td>
                    <td>{issue.issuedByName || '—'}</td>
                    <td>{formatDate(issue.issuedAt)}</td>
                    <td>{issue.jobNumber || (issue.itemType === 'Tool' ? '—' : 'Missing')}</td>
                    <td>
                      <div className="row-actions">
                        <button className="table-button" onClick={() => onReturnTool(issue.id, 'Good')}>Return · Good</button>
                        <button className="table-button" onClick={() => onReturnTool(issue.id, 'Damaged')}>Damaged</button>
                        <button className="table-button" onClick={() => onReturnTool(issue.id, 'Lost')}>Lost</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mode === 'list' && (
        <section className="card">
          <SectionTitle
            title="Stock issues log"
            subtitle={`${filteredStockIssues.length} issue(s) shown`}
            action={
              <div className="tab-toggle">
                <button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}>Recent</button>
                <button className={tab === 'issues' ? 'active' : ''} onClick={() => setTab('issues')}>Filter</button>
              </div>
            }
          />
          {tab === 'issues' && (
            <div className="filters-grid">
              <label><span>Search</span><input value={stockIssueFilters.search} onChange={(event) => setStockIssueFilters({ ...stockIssueFilters, search: event.target.value })} /></label>
              <label>
                <span>Status</span>
                <select value={stockIssueFilters.status} onChange={(event) => setStockIssueFilters({ ...stockIssueFilters, status: event.target.value })}>
                  <option value="all">All</option>
                  <option value="Issued">Issued / Out</option>
                  <option value="Returned">Returned</option>
                </select>
              </label>
              <label>
                <span>Type</span>
                <select value={stockIssueFilters.itemType} onChange={(event) => setStockIssueFilters({ ...stockIssueFilters, itemType: event.target.value })}>
                  <option value="all">All</option>
                  <option value="Consumable">Consumable</option>
                  <option value="Tool">Tool</option>
                </select>
              </label>
            </div>
          )}
          {filteredStockIssues.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Issued to</th>
                    <th>Job</th>
                    <th>When</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockIssues.slice(0, tab === 'inventory' ? 25 : filteredStockIssues.length).map((issue) => (
                    <tr key={issue.id}>
                      <td>
                        <strong>{issue.itemName}</strong>
                        {issue.notes ? <div className="table-subtext">{issue.notes}</div> : null}
                      </td>
                      <td>{issue.itemType}</td>
                      <td>{formatNumber(issue.quantity)} {issue.unitOfMeasure}</td>
                      <td>{issue.issuedToName}</td>
                      <td>{issue.jobNumber || '—'}</td>
                      <td>{formatDate(issue.issuedAt)}</td>
                      <td>
                        {issue.status === 'Returned'
                          ? <span className="ok-pill">Returned · {issue.conditionOnReturn || 'Good'}</span>
                          : (issue.itemType === 'Tool'
                              ? <span className="warn-pill">Out</span>
                              : <span className="ok-pill">Issued</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No issues yet" body="Items checked out or issued to jobs will appear here." />
          )}
        </section>
      )}

      {mode === 'list' && (
        <section className="card">
          <SectionTitle
            title="Physical stock counts"
            subtitle="Compare counted-in-the-room against system stock and reconcile any variance."
            action={
              showCountForm ? (
                <button className="ghost-button" onClick={() => { setShowCountForm(false); onCancelStockCount(); }}>Cancel count</button>
              ) : (
                <button className="secondary-button" onClick={() => setShowCountForm(true)}>Start a count</button>
              )
            }
          />
          {showCountForm && (
            <div>
              {stockCountMessage && <div className="form-message">{stockCountMessage}</div>}
              <div className="form-grid">
                <label>
                  <span>Scope</span>
                  <input
                    placeholder="e.g. Floor consumables, All tools"
                    value={stockCountForm.scope}
                    onChange={(event) => setStockCountForm({ ...stockCountForm, scope: event.target.value })}
                  />
                </label>
                <label>
                  <span>Counted by <RequiredMarker /></span>
                  <input
                    value={stockCountForm.countedByName}
                    onChange={(event) => setStockCountForm({ ...stockCountForm, countedByName: event.target.value })}
                  />
                </label>
                <label className="full-span">
                  <span>Notes</span>
                  <textarea
                    value={stockCountForm.notes}
                    onChange={(event) => setStockCountForm({ ...stockCountForm, notes: event.target.value })}
                  />
                </label>
              </div>
              <div className="table-wrap" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Include</th>
                      <th>Item</th>
                      <th>System qty</th>
                      <th>Counted qty</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpares.map((part) => {
                      const selected = stockCountForm.selectedItemIds.includes(part.id);
                      const counted = Number(stockCountForm.countedQty[part.id] ?? 0);
                      const variance = selected ? counted - part.quantityOnHand : 0;
                      return (
                        <tr key={part.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setStockCountForm({
                                  ...stockCountForm,
                                  selectedItemIds: checked
                                    ? [...stockCountForm.selectedItemIds, part.id]
                                    : stockCountForm.selectedItemIds.filter((id) => id !== part.id),
                                });
                              }}
                            />
                          </td>
                          <td>
                            <strong>{part.partName}</strong>
                            <div className="table-subtext">{part.category} · {part.itemType}</div>
                          </td>
                          <td>{formatNumber(part.quantityOnHand)} {part.unitOfMeasure}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              disabled={!selected}
                              value={stockCountForm.countedQty[part.id] ?? ''}
                              onChange={(event) => setStockCountForm({
                                ...stockCountForm,
                                countedQty: { ...stockCountForm.countedQty, [part.id]: event.target.value },
                              })}
                            />
                          </td>
                          <td>
                            {selected
                              ? (variance === 0
                                  ? <span className="ok-pill">0</span>
                                  : <span className={variance < 0 ? 'warn-pill' : 'ok-pill'}>{variance > 0 ? `+${formatNumber(variance)}` : formatNumber(variance)}</span>)
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="form-footer">
                <button className="primary-button" onClick={() => { onSaveStockCount(); setShowCountForm(false); }}>Save count</button>
              </div>
            </div>
          )}

          {!showCountForm && (
            stockCounts.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Count</th>
                      <th>Scope</th>
                      <th>Counted by</th>
                      <th>When</th>
                      <th>Lines</th>
                      <th>Net variance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockCounts.map((count) => {
                      const netVariance = count.lines.reduce((sum, line) => sum + line.variance, 0);
                      return (
                        <tr key={count.id}>
                          <td><strong>{count.id}</strong></td>
                          <td>{count.scope || '—'}</td>
                          <td>{count.countedByName}</td>
                          <td>{formatDate(count.countedAt)}</td>
                          <td>{count.lines.length}</td>
                          <td>{netVariance === 0 ? '0' : (netVariance > 0 ? `+${formatNumber(netVariance)}` : formatNumber(netVariance))}</td>
                          <td>
                            {count.reconciled
                              ? <span className="ok-pill">Reconciled</span>
                              : <span className="warn-pill">Pending</span>}
                          </td>
                          <td>
                            {!count.reconciled && isAdmin ? (
                              <button className="table-button" onClick={() => onReconcileStockCount(count.id, '')}>Reconcile</button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No counts yet" body="Run a physical count to spot variance against system stock." />
            )
          )}
        </section>
      )}

      {mode === 'list' && (
        <section className="card">
          <SectionTitle title="Reports & alerts" subtitle="Last 30 days of activity, plus current low-stock and overdue tool warnings." />
          <div className="reports-grid">
            <div className="report-block">
              <h4>Top consumed items</h4>
              {reports.topConsumers.length === 0 ? (
                <p className="table-meta">No consumption recorded in the last 30 days.</p>
              ) : (
                <table>
                  <thead>
                    <tr><th>Item</th><th>Total issued</th><th>Issues</th></tr>
                  </thead>
                  <tbody>
                    {reports.topConsumers.map((row) => (
                      <tr key={row.id}>
                        <td>{row.itemName}</td>
                        <td>{formatNumber(row.totalQty)} {row.unit}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="report-block">
              <h4>Top jobs by stock usage</h4>
              {reports.topJobs.length === 0 ? (
                <p className="table-meta">No job-linked issues in the last 30 days.</p>
              ) : (
                <table>
                  <thead>
                    <tr><th>Job</th><th>Issues</th><th>Distinct items</th></tr>
                  </thead>
                  <tbody>
                    {reports.topJobs.map((row) => (
                      <tr key={row.id}>
                        <td>{row.jobNumber}</td>
                        <td>{row.issueCount}</td>
                        <td>{row.distinctItems}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="report-block">
              <h4>Low-stock consumables</h4>
              {reports.lowStock.length === 0 ? (
                <p className="table-meta">All consumables above reorder level.</p>
              ) : (
                <table>
                  <thead>
                    <tr><th>Item</th><th>On hand</th><th>Reorder</th></tr>
                  </thead>
                  <tbody>
                    {reports.lowStock.map((part) => (
                      <tr key={part.id}>
                        <td>{part.partName}</td>
                        <td><span className="warn-pill">{formatNumber(part.quantityOnHand)} {part.unitOfMeasure}</span></td>
                        <td>{formatNumber(part.reorderLevel)} {part.unitOfMeasure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="report-block">
              <h4>Tools out &gt; 7 days</h4>
              {reports.toolsOverdue.length === 0 ? (
                <p className="table-meta">No overdue tools.</p>
              ) : (
                <table>
                  <thead>
                    <tr><th>Tool</th><th>Holder</th><th>Out since</th></tr>
                  </thead>
                  <tbody>
                    {reports.toolsOverdue.map((issue) => (
                      <tr key={issue.id}>
                        <td>{issue.itemName}</td>
                        <td>{issue.issuedToName}</td>
                        <td>{formatDate(issue.issuedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
