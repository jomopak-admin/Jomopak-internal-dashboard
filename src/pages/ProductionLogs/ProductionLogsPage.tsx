import { useEffect, useState } from 'react';
import { FlagBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  JobCard,
  MaterialReceipt,
  Machine,
  ProductionFilters,
  ProductionLogEntry,
  ProductionLogFormState,
} from '../../types';
import { PRODUCTION_LOG_TYPES, formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface ProductionLogsPageProps {
  jobs: JobCard[];
  machines: Machine[];
  materialReceipts: MaterialReceipt[];
  monthOptions: string[];
  productionForm: ProductionLogFormState;
  setProductionForm: (value: ProductionLogFormState) => void;
  productionEditingId: string | null;
  productionMessage: string;
  onSave: () => void;
  onReset: () => void;
  productionFilters: ProductionFilters;
  setProductionFilters: (value: ProductionFilters) => void;
  filteredProductionLogs: ProductionLogEntry[];
  onEdit: (log: ProductionLogEntry) => void;
}

export function ProductionLogsPage(props: ProductionLogsPageProps) {
  const {
    jobs,
    machines,
    materialReceipts,
    monthOptions,
    productionForm,
    setProductionForm,
    productionEditingId,
    productionMessage,
    onSave,
    onReset,
    productionFilters,
    setProductionFilters,
    filteredProductionLogs,
    onEdit,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const selectedType = productionForm.logType;

  useEffect(() => {
    if (productionEditingId) {
      setMode('form');
    }
  }, [productionEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(log: ProductionLogEntry) {
    onEdit(log);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Log header',
      subtitle: 'When the run happened, what process, and which job.',
      missingRequired: [
        ...(productionForm.logDate ? [] : ['Log date']),
        ...(productionForm.jobId ? [] : ['Job card']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Log date <RequiredMarker /></span>
            <input type="date" value={productionForm.logDate} onChange={(event) => setProductionForm({ ...productionForm, logDate: event.target.value })} />
          </label>
          <label>
            <span>Log type</span>
            <select value={productionForm.logType} onChange={(event) => setProductionForm({ ...productionForm, logType: event.target.value as ProductionLogEntry['logType'] })}>
              {PRODUCTION_LOG_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <span>Job card <RequiredMarker /></span>
            <select value={productionForm.jobId} onChange={(event) => setProductionForm({ ...productionForm, jobId: event.target.value })}>
              <option value="">Select job card</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber} - {job.customerName}</option>)}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'crew',
      title: 'Machine, operator & material',
      subtitle: 'Who ran what, on which machine, from which roll.',
      body: (
        <div className="form-grid">
          <label>
            <span>Machine</span>
            <select
              value={productionForm.machineId}
              onChange={(event) => {
                const machine = machines.find((item) => item.id === event.target.value);
                setProductionForm({
                  ...productionForm,
                  machineId: machine?.id ?? '',
                  machine: machine?.name ?? productionForm.machine,
                });
              }}
            >
              <option value="">Select machine</option>
              {machines.filter((machine) => machine.active).map((machine) => (
                <option key={machine.id} value={machine.id}>{machine.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Operator</span>
            <input value={productionForm.operatorName} onChange={(event) => setProductionForm({ ...productionForm, operatorName: event.target.value })} />
          </label>
          <label>
            <span>Source material</span>
            <select value={productionForm.sourceMaterialId} onChange={(event) => setProductionForm({ ...productionForm, sourceMaterialId: event.target.value })}>
              <option value="">Select material receipt</option>
              {materialReceipts.map((receipt) => <option key={receipt.id} value={receipt.id}>{receipt.internalRollCode} - {receipt.supplierName}</option>)}
            </select>
          </label>
          <label>
            <span>Setup time (min)</span>
            <input type="number" min="0" value={productionForm.setupTimeMinutes} onChange={(event) => setProductionForm({ ...productionForm, setupTimeMinutes: event.target.value })} />
          </label>
          <label>
            <span>Operator signature</span>
            <input value={productionForm.operatorSignature} onChange={(event) => setProductionForm({ ...productionForm, operatorSignature: event.target.value })} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={productionForm.fscRelated} onChange={(event) => setProductionForm({ ...productionForm, fscRelated: event.target.checked })} />
            FSC-related
          </label>
        </div>
      ),
    },
    {
      key: 'bag-printing',
      title: 'Bag Printing details',
      subtitle: 'Roll, dimensions, and bag counts for the bag printing run.',
      contextActive: selectedType === 'Bag Printing',
      contextPrompt: (
        <p>
          These fields apply only when the log type is set to <strong>Bag Printing</strong>. Change the log type in the
          header section to enable them.
        </p>
      ),
      body: (
        <div className="form-grid">
          <label><span>Roll code</span><input value={productionForm.rollCode} onChange={(event) => setProductionForm({ ...productionForm, rollCode: event.target.value })} /></label>
          <label><span>Height</span><input value={productionForm.height} onChange={(event) => setProductionForm({ ...productionForm, height: event.target.value })} /></label>
          <label><span>Gusset</span><input value={productionForm.gusset} onChange={(event) => setProductionForm({ ...productionForm, gusset: event.target.value })} /></label>
          <label><span>Handle type</span><input value={productionForm.handleType} onChange={(event) => setProductionForm({ ...productionForm, handleType: event.target.value })} /></label>
          <label><span>Good bags</span><input type="number" min="0" value={productionForm.goodBags} onChange={(event) => setProductionForm({ ...productionForm, goodBags: event.target.value })} /></label>
          <label><span>Reject bags</span><input type="number" min="0" value={productionForm.rejectBags} onChange={(event) => setProductionForm({ ...productionForm, rejectBags: event.target.value })} /></label>
          <label><span>Height change</span><input value={productionForm.heightChange} onChange={(event) => setProductionForm({ ...productionForm, heightChange: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'flexo-printing',
      title: 'Flexo Printing details',
      subtitle: 'Web width, colors, meters/kg printed for the flexo run.',
      contextActive: selectedType === 'Flexo Printing',
      contextPrompt: (
        <p>
          These fields apply only when the log type is set to <strong>Flexo Printing</strong>. Change the log type in
          the header section to enable them.
        </p>
      ),
      body: (
        <div className="form-grid">
          <label><span>Material source code</span><input value={productionForm.materialSourceCode} onChange={(event) => setProductionForm({ ...productionForm, materialSourceCode: event.target.value })} /></label>
          <label><span>Roll width</span><input value={productionForm.rollWidth} onChange={(event) => setProductionForm({ ...productionForm, rollWidth: event.target.value })} /></label>
          <label><span>No. of colors</span><input type="number" min="0" value={productionForm.numberOfColors} onChange={(event) => setProductionForm({ ...productionForm, numberOfColors: event.target.value })} /></label>
          <label><span>Meters / kg printed</span><input type="number" min="0" value={productionForm.metersKgPrinted} onChange={(event) => setProductionForm({ ...productionForm, metersKgPrinted: event.target.value })} /></label>
          <label><span>Reject meters / kg</span><input type="number" min="0" value={productionForm.rejectMetersKg} onChange={(event) => setProductionForm({ ...productionForm, rejectMetersKg: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'bag-making',
      title: 'Bag Making details',
      subtitle: 'Print method, bag size and quantities for the bag making run.',
      contextActive: selectedType === 'Bag Making',
      contextPrompt: (
        <p>
          These fields apply only when the log type is set to <strong>Bag Making</strong>. Change the log type in the
          header section to enable them.
        </p>
      ),
      body: (
        <div className="form-grid">
          <label><span>Printing method</span><input value={productionForm.printingMethod} onChange={(event) => setProductionForm({ ...productionForm, printingMethod: event.target.value })} /></label>
          <label><span>Bag size</span><input value={productionForm.bagSize} onChange={(event) => setProductionForm({ ...productionForm, bagSize: event.target.value })} /></label>
          <label><span>No. of colors</span><input type="number" min="0" value={productionForm.numberOfColors} onChange={(event) => setProductionForm({ ...productionForm, numberOfColors: event.target.value })} /></label>
          <label><span>Quantity printed</span><input type="number" min="0" value={productionForm.quantityPrinted} onChange={(event) => setProductionForm({ ...productionForm, quantityPrinted: event.target.value })} /></label>
          <label><span>Reject bags</span><input type="number" min="0" value={productionForm.rejectBags} onChange={(event) => setProductionForm({ ...productionForm, rejectBags: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'slitting',
      title: 'Slitting details',
      subtitle: 'Parent / child roll dimensions, child counts and waste for the slitting run.',
      contextActive: selectedType === 'Slitting',
      contextPrompt: (
        <p>
          These fields apply only when the log type is set to <strong>Slitting</strong>. Change the log type in the
          header section to enable them.
        </p>
      ),
      body: (
        <div className="form-grid">
          <label><span>Parent roll code</span><input value={productionForm.parentRollCode} onChange={(event) => setProductionForm({ ...productionForm, parentRollCode: event.target.value })} /></label>
          <label><span>Parent width</span><input value={productionForm.parentWidth} onChange={(event) => setProductionForm({ ...productionForm, parentWidth: event.target.value })} /></label>
          <label><span>Target child width</span><input value={productionForm.targetChildWidth} onChange={(event) => setProductionForm({ ...productionForm, targetChildWidth: event.target.value })} /></label>
          <label><span>Number of child rolls</span><input type="number" min="0" value={productionForm.numberOfChildRolls} onChange={(event) => setProductionForm({ ...productionForm, numberOfChildRolls: event.target.value })} /></label>
          <label><span>Child diameter</span><input value={productionForm.childDiameter} onChange={(event) => setProductionForm({ ...productionForm, childDiameter: event.target.value })} /></label>
          <label><span>Total waste (kg)</span><input type="number" min="0" value={productionForm.totalWasteKg} onChange={(event) => setProductionForm({ ...productionForm, totalWasteKg: event.target.value })} /></label>
          <label><span>Blade change</span><input value={productionForm.bladeChange} onChange={(event) => setProductionForm({ ...productionForm, bladeChange: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      body: (
        <div className="form-grid">
          <label className="full-span">
            <span>Notes</span>
            <textarea value={productionForm.notes} onChange={(event) => setProductionForm({ ...productionForm, notes: event.target.value })} />
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
            <button className="secondary-button" onClick={handleStartCreate}>Add New Production Log</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Production Logs</button>
          )
        }
      />

      {mode === 'form' ? (
        <FormWizard
          title={productionEditingId ? 'Edit production log' : 'New production log'}
          subtitle="Choose the process type in the header — only the matching detail section becomes editable."
          message={productionMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!productionEditingId}
          saveLabel="Save Production Log"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Production history" subtitle={`${filteredProductionLogs.length} record(s) shown`} />

          <div className="filters-grid">
            <label><span>Search</span><input placeholder="Log, job, operator, material" value={productionFilters.search} onChange={(event) => setProductionFilters({ ...productionFilters, search: event.target.value })} /></label>
            <label><span>Month</span><select value={productionFilters.month} onChange={(event) => setProductionFilters({ ...productionFilters, month: event.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Log type</span><select value={productionFilters.logType} onChange={(event) => setProductionFilters({ ...productionFilters, logType: event.target.value })}><option value="">All types</option>{PRODUCTION_LOG_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label><span>Machine</span><input value={productionFilters.machine} onChange={(event) => setProductionFilters({ ...productionFilters, machine: event.target.value })} /></label>
            <label><span>FSC-related</span><select value={productionFilters.fsc} onChange={(event) => setProductionFilters({ ...productionFilters, fsc: event.target.value })}><option value="all">All</option><option value="yes">Yes</option><option value="no">No</option></select></label>
          </div>

          {filteredProductionLogs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Log</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Job</th>
                    <th>Machine</th>
                    <th>Operator</th>
                    <th>Setup</th>
                    <th>FSC</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductionLogs.map((log) => (
                    <tr key={log.id}>
                      <td><strong>{log.logNumber}</strong><div className="table-subtext">{log.sourceMaterialCode || log.sourceMaterialId}</div></td>
                      <td>{formatDate(log.logDate)}</td>
                      <td>{log.logType}</td>
                      <td>{log.jobNumber}</td>
                      <td>{log.machine || 'Not set'}</td>
                      <td>{log.operatorName}</td>
                      <td>{formatNumber(log.setupTimeMinutes)} min</td>
                      <td><FlagBadge value={log.fscRelated} /></td>
                      <td><button className="table-button" onClick={() => handleStartEdit(log)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No production logs match the filters" body="Create process records for slitting, flexo, bag printing, or bag making." />
          )}
        </section>
      )}
    </>
  );
}
