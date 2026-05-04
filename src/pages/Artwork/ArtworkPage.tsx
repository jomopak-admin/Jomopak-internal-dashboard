import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import { ArtworkFilters, ArtworkFormState, ArtworkRecord, JobCard } from '../../types';
import { formatDate } from '../../utils/calculations';

interface ArtworkPageProps {
  jobs: JobCard[];
  artworkForm: ArtworkFormState;
  setArtworkForm: (value: ArtworkFormState) => void;
  artworkEditingId: string | null;
  artworkMessage: string;
  onSave: () => void;
  onReset: () => void;
  artworkFilters: ArtworkFilters;
  setArtworkFilters: (value: ArtworkFilters) => void;
  filteredArtworkRecords: ArtworkRecord[];
  onEdit: (record: ArtworkRecord) => void;
}

export function ArtworkPage({
  jobs,
  artworkForm,
  setArtworkForm,
  artworkEditingId,
  artworkMessage,
  onSave,
  onReset,
  artworkFilters,
  setArtworkFilters,
  filteredArtworkRecords,
  onEdit,
}: ArtworkPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const filteredArtworkJobs = useMemo(() => jobs.filter((job) => {
    if (!job.printRequired || job.status === 'Completed') {
      return false;
    }
    const matchesSearch = !artworkFilters.search || [job.jobNumber, job.customerName, job.productName, job.artworkAssignedTo, job.artworkNotes].some((value) =>
      value?.toLowerCase().includes(artworkFilters.search.toLowerCase()));
    const matchesClient = !artworkFilters.client || job.customerName.toLowerCase().includes(artworkFilters.client.toLowerCase());
    const matchesStage = !artworkFilters.stage
      || (artworkFilters.stage === 'Awaiting Artwork' && !job.artworkReceived)
      || (artworkFilters.stage === 'Artwork Received' && job.artworkReceived)
      || (artworkFilters.stage === 'Proof Sent' && job.proofSent)
      || (artworkFilters.stage === 'Approved' && job.approvalStatus === 'Approved')
      || (artworkFilters.stage === 'Changes Requested' && job.approvalStatus === 'Changes Requested');
    const needsArtworkAttention = !job.artworkReceived
      || job.artworkPreparationStatus !== 'Print Ready'
      || job.approvalStatus !== 'Approved'
      || job.proofSent;
    return needsArtworkAttention && matchesSearch && matchesClient && matchesStage;
  }), [artworkFilters, jobs]);

  useEffect(() => {
    if (artworkEditingId) {
      setMode('form');
    }
  }, [artworkEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  // Searchable list of jobs for the Combobox. Sublabel surfaces the
  // customer + product so users can find a job by client name or product
  // type, not just job number.
  const jobOptions: ComboboxOption[] = useMemo(
    () => jobs.map((job) => ({
      value: job.id,
      label: job.jobNumber || `Job ${job.id.slice(-6)}`,
      sublabel: [job.customerName, job.productName].filter(Boolean).join(' · '),
    })),
    [jobs],
  );

  const sections: FormWizardSection[] = [
    {
      key: 'job',
      title: 'Job link & stage',
      subtitle: 'Which job this artwork record belongs to and where it sits in the flow.',
      missingRequired: [
        ...(artworkForm.jobId ? [] : ['Job card']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Job card <RequiredMarker /></span>
            <Combobox
              options={jobOptions}
              value={artworkForm.jobId}
              onChange={(value) => setArtworkForm({ ...artworkForm, jobId: value })}
              placeholder="Search by job number, customer, or product…"
              emptyMessage="No matching jobs"
            />
          </label>
          <label><span>Stage</span><select value={artworkForm.stage} onChange={(event) => setArtworkForm({ ...artworkForm, stage: event.target.value as ArtworkFormState['stage'] })}><option value="Awaiting Artwork">Awaiting Artwork</option><option value="Artwork Received">Artwork Received</option><option value="Proof Sent">Proof Sent</option><option value="Approved">Approved</option><option value="Changes Requested">Changes Requested</option></select></label>
        </div>
      ),
    },
    {
      key: 'timeline',
      title: 'Timeline',
      subtitle: 'Dates that mark each step of the approval process.',
      body: (
        <div className="form-grid">
          <label><span>Artwork received date</span><input type="date" value={artworkForm.artworkReceivedDate} onChange={(event) => setArtworkForm({ ...artworkForm, artworkReceivedDate: event.target.value })} /></label>
          <label><span>Proof sent date</span><input type="date" value={artworkForm.proofSentDate} onChange={(event) => setArtworkForm({ ...artworkForm, proofSentDate: event.target.value })} /></label>
          <label><span>Approval date</span><input type="date" value={artworkForm.approvalDate} onChange={(event) => setArtworkForm({ ...artworkForm, approvalDate: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'changes',
      title: 'Changes & notes',
      subtitle: 'Anything the studio or operator needs to know before printing.',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Changes requested</span><textarea value={artworkForm.changesRequested} onChange={(event) => setArtworkForm({ ...artworkForm, changesRequested: event.target.value })} /></label>
          <label className="full-span"><span>Notes</span><textarea value={artworkForm.notes} onChange={(event) => setArtworkForm({ ...artworkForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Artwork Record</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Artwork</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={artworkEditingId ? 'Edit artwork record' : 'New artwork record'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={artworkMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!artworkEditingId}
          saveLabel="Save Artwork Record"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Artwork queue" subtitle={`${filteredArtworkJobs.length} live job(s) in artwork flow`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={artworkFilters.search} onChange={(event) => setArtworkFilters({ ...artworkFilters, search: event.target.value })} /></label>
            <label><span>Stage</span><select value={artworkFilters.stage} onChange={(event) => setArtworkFilters({ ...artworkFilters, stage: event.target.value })}><option value="">All stages</option><option value="Awaiting Artwork">Awaiting Artwork</option><option value="Artwork Received">Artwork Received</option><option value="Proof Sent">Proof Sent</option><option value="Approved">Approved</option><option value="Changes Requested">Changes Requested</option></select></label>
            <label><span>Client</span><input value={artworkFilters.client} onChange={(event) => setArtworkFilters({ ...artworkFilters, client: event.target.value })} /></label>
          </div>
          {filteredArtworkJobs.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Job</th><th>Client</th><th>Artwork received</th><th>Artwork readiness</th><th>Proof</th><th>Approval</th><th>Assigned</th></tr></thead>
                <tbody>{filteredArtworkJobs.map((job) => <tr key={job.id}><td><strong>{job.jobNumber}</strong><div className="table-subtext">{job.productName}</div></td><td>{job.customerName}</td><td>{job.artworkReceived ? 'Yes' : 'No'}</td><td>{job.artworkPreparationStatus}</td><td>{job.proofSent ? 'Sent' : 'Not sent'}</td><td>{job.approvalStatus}</td><td>{job.artworkAssignedTo || 'Not assigned'}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No live artwork jobs" body="Jobs that need artwork attention stay on Job Cards and also appear here." />}
        </section>
      )}

      {mode === 'list' ? (
        <section className="card">
          <SectionTitle title="Artwork records" subtitle={`${filteredArtworkRecords.length} record(s) shown`} />
          {filteredArtworkRecords.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Artwork</th><th>Job</th><th>Client</th><th>Stage</th><th>Proof sent</th><th>Approval</th><th>Actions</th></tr></thead>
                <tbody>{filteredArtworkRecords.map((record) => <tr key={record.id}><td><strong>{record.artworkNumber}</strong></td><td>{record.jobNumber}</td><td>{record.clientName}</td><td>{record.stage}</td><td>{record.proofSentDate ? formatDate(record.proofSentDate) : 'Not sent'}</td><td>{record.approvalDate ? formatDate(record.approvalDate) : 'Not approved'}</td><td><button className="table-button" onClick={() => { onEdit(record); setMode('form'); }}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No artwork records yet" body="Add artwork records so pre-production approvals are visible and traceable." />}
        </section>
      ) : null}
    </>
  );
}
