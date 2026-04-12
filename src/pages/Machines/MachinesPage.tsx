import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Machine, MachineFilters, MachineFormState } from '../../types';

interface MachinesPageProps {
  machineForm: MachineFormState;
  setMachineForm: (value: MachineFormState) => void;
  machineEditingId: string | null;
  machineMessage: string;
  onSave: () => void;
  onReset: () => void;
  machineFilters: MachineFilters;
  setMachineFilters: (value: MachineFilters) => void;
  filteredMachines: Machine[];
  onEdit: (machine: Machine) => void;
}

export function MachinesPage({
  machineForm,
  setMachineForm,
  machineEditingId,
  machineMessage,
  onSave,
  onReset,
  machineFilters,
  setMachineFilters,
  filteredMachines,
  onEdit,
}: MachinesPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (machineEditingId) {
      setMode('form');
    }
  }, [machineEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  return (
    <>
      <SectionTitle
        title="Machines"
        subtitle="Register the machines used in production and maintenance tracking."
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Machine</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Machines</button>}
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{machineEditingId ? 'Edit machine' : 'New machine'}</h3></div>
          {machineMessage ? <div className="message-strip">{machineMessage}</div> : null}
          <div className="form-grid">
            <label><span>Machine name</span><input value={machineForm.name} onChange={(event) => setMachineForm({ ...machineForm, name: event.target.value })} /></label>
            <label><span>Code</span><input value={machineForm.code} onChange={(event) => setMachineForm({ ...machineForm, code: event.target.value })} /></label>
            <label><span>Department</span><input value={machineForm.department} onChange={(event) => setMachineForm({ ...machineForm, department: event.target.value })} /></label>
            <label><span>Process type</span><input value={machineForm.processType} onChange={(event) => setMachineForm({ ...machineForm, processType: event.target.value })} placeholder="Flexo / Slitting / Bag Making" /></label>
            <label><span>Status</span><select value={machineForm.status} onChange={(event) => setMachineForm({ ...machineForm, status: event.target.value as MachineFormState['status'] })}><option value="Active">Active</option><option value="Maintenance">Maintenance</option><option value="Offline">Offline</option></select></label>
            <label className="checkbox-row"><input type="checkbox" checked={machineForm.active} onChange={(event) => setMachineForm({ ...machineForm, active: event.target.checked })} />Active</label>
            <label className="full-span"><span>Notes</span><textarea value={machineForm.notes} onChange={(event) => setMachineForm({ ...machineForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{machineEditingId ? 'Save Changes' : 'Save Machine'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Machine register" subtitle={`${filteredMachines.length} machine(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={machineFilters.search} onChange={(event) => setMachineFilters({ ...machineFilters, search: event.target.value })} /></label>
            <label><span>Status</span><select value={machineFilters.status} onChange={(event) => setMachineFilters({ ...machineFilters, status: event.target.value })}><option value="">All statuses</option><option value="Active">Active</option><option value="Maintenance">Maintenance</option><option value="Offline">Offline</option></select></label>
            <label><span>Process type</span><input value={machineFilters.processType} onChange={(event) => setMachineFilters({ ...machineFilters, processType: event.target.value })} /></label>
            <label><span>Active</span><select value={machineFilters.active} onChange={(event) => setMachineFilters({ ...machineFilters, active: event.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
          </div>
          {filteredMachines.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Machine</th><th>Code</th><th>Department</th><th>Process</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{filteredMachines.map((machine) => <tr key={machine.id}><td><strong>{machine.name}</strong></td><td>{machine.code || 'Not set'}</td><td>{machine.department || 'Not set'}</td><td>{machine.processType || 'Not set'}</td><td>{machine.status}</td><td><button className="table-button" onClick={() => { onEdit(machine); setMode('form'); }}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No machines yet" body="Add machines so production logs and parts can link to the correct equipment." />}
        </section>
      )}
    </>
  );
}
