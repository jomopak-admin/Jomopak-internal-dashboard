import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
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

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Machine identity',
      subtitle: 'How operators will recognise and reference this machine.',
      missingRequired: [
        ...(machineForm.name.trim() ? [] : ['Machine name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Machine name <RequiredMarker /></span><input value={machineForm.name} onChange={(event) => setMachineForm({ ...machineForm, name: event.target.value })} /></label>
          <label><span>Code</span><input value={machineForm.code} onChange={(event) => setMachineForm({ ...machineForm, code: event.target.value })} /></label>
          <label><span>Department</span><input value={machineForm.department} onChange={(event) => setMachineForm({ ...machineForm, department: event.target.value })} /></label>
          <label><span>Process type</span><input value={machineForm.processType} onChange={(event) => setMachineForm({ ...machineForm, processType: event.target.value })} placeholder="Flexo / Slitting / Bag Making" /></label>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Operational status',
      subtitle: 'Whether this machine should appear on shop-floor pickers.',
      body: (
        <div className="form-grid">
          <label><span>Status</span><select value={machineForm.status} onChange={(event) => setMachineForm({ ...machineForm, status: event.target.value as MachineFormState['status'] })}><option value="Active">Active</option><option value="Maintenance">Maintenance</option><option value="Offline">Offline</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={machineForm.active} onChange={(event) => setMachineForm({ ...machineForm, active: event.target.checked })} />Active</label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      subtitle: 'Setup quirks, maintenance flags, anything operators should know.',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={machineForm.notes} onChange={(event) => setMachineForm({ ...machineForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Machine</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Machines</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={machineEditingId ? 'Edit machine' : 'New machine'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={machineMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!machineEditingId}
          saveLabel="Save Machine"
        />
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
