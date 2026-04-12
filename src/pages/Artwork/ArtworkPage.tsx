import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
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

  return (
    <>
      <SectionTitle
        title="Artwork"
        subtitle="Track artwork receipt, proofs, approvals, and client change requests."
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Artwork Record</button> : <button className="ghost-button" onClick={handleBackToList}>Back to Artwork</button>}
      />

      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{artworkEditingId ? 'Edit artwork record' : 'New artwork record'}</h3></div>
          {artworkMessage ? <div className="message-strip">{artworkMessage}</div> : null}
          <div className="form-grid">
            <label><span>Job card</span><select value={artworkForm.jobId} onChange={(event) => setArtworkForm({ ...artworkForm, jobId: event.target.value })}><option value="">Select job card</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.jobNumber} - {job.customerName}</option>)}</select></label>
            <label><span>Stage</span><select value={artworkForm.stage} onChange={(event) => setArtworkForm({ ...artworkForm, stage: event.target.value as ArtworkFormState['stage'] })}><option value="Awaiting Artwork">Awaiting Artwork</option><option value="Artwork Received">Artwork Received</option><option value="Proof Sent">Proof Sent</option><option value="Approved">Approved</option><option value="Changes Requested">Changes Requested</option></select></label>
            <label><span>Artwork received date</span><input type="date" value={artworkForm.artworkReceivedDate} onChange={(event) => setArtworkForm({ ...artworkForm, artworkReceivedDate: event.target.value })} /></label>
            <label><span>Proof sent date</span><input type="date" value={artworkForm.proofSentDate} onChange={(event) => setArtworkForm({ ...artworkForm, proofSentDate: event.target.value })} /></label>
            <label><span>Approval date</span><input type="date" value={artworkForm.approvalDate} onChange={(event) => setArtworkForm({ ...artworkForm, approvalDate: event.target.value })} /></label>
            <label className="full-span"><span>Changes requested</span><textarea value={artworkForm.changesRequested} onChange={(event) => setArtworkForm({ ...artworkForm, changesRequested: event.target.value })} /></label>
            <label className="full-span"><span>Notes</span><textarea value={artworkForm.notes} onChange={(event) => setArtworkForm({ ...artworkForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row">
            <button className="primary-button" onClick={onSave}>{artworkEditingId ? 'Save Changes' : 'Save Artwork Record'}</button>
            <button className="ghost-button" onClick={handleBackToList}>Cancel</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Artwork register" subtitle={`${filteredArtworkRecords.length} record(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={artworkFilters.search} onChange={(event) => setArtworkFilters({ ...artworkFilters, search: event.target.value })} /></label>
            <label><span>Stage</span><select value={artworkFilters.stage} onChange={(event) => setArtworkFilters({ ...artworkFilters, stage: event.target.value })}><option value="">All stages</option><option value="Awaiting Artwork">Awaiting Artwork</option><option value="Artwork Received">Artwork Received</option><option value="Proof Sent">Proof Sent</option><option value="Approved">Approved</option><option value="Changes Requested">Changes Requested</option></select></label>
            <label><span>Client</span><input value={artworkFilters.client} onChange={(event) => setArtworkFilters({ ...artworkFilters, client: event.target.value })} /></label>
          </div>
          {filteredArtworkRecords.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Artwork</th><th>Job</th><th>Client</th><th>Stage</th><th>Proof sent</th><th>Approval</th><th>Actions</th></tr></thead>
                <tbody>{filteredArtworkRecords.map((record) => <tr key={record.id}><td><strong>{record.artworkNumber}</strong></td><td>{record.jobNumber}</td><td>{record.clientName}</td><td>{record.stage}</td><td>{record.proofSentDate ? formatDate(record.proofSentDate) : 'Not sent'}</td><td>{record.approvalDate ? formatDate(record.approvalDate) : 'Not approved'}</td><td><button className="table-button" onClick={() => { onEdit(record); setMode('form'); }}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No artwork records yet" body="Add artwork records so pre-production approvals are visible and traceable." />}
        </section>
      )}
    </>
  );
}
