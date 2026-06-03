/**
 * Driver POD page — Phase 17 (Task #81 / #102)
 *
 * Two-screen flow optimised for phones:
 *   1. List screen — driver sees their assigned dispatches (anything
 *      without a synced POD attached). Tap one to start the capture flow.
 *   2. Capture screen — receiver fields, outcome, condition, quantity,
 *      signature pad, optional photo of signed delivery note, optional
 *      goods photos, optional driver notes. GPS captures automatically
 *      when the screen opens. Submit writes locally (IndexedDB), then
 *      attempts to sync.
 *
 * The page itself is signal-agnostic: the actual upload happens in a
 * background flush effect — see `usePodSync`. If we're offline, the POD
 * still goes through the local "Done — pending sync" path and the driver
 * can move on.
 */

import { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import { SignaturePad } from '../../components/SignaturePad';
import { Client, DeliveryNote, DispatchRecord, DispatchRun, ProofOfDelivery, UserProfile } from '../../types';
import { captureGps, savePodLocally } from '../../utils/podQueue';

interface DriverPodPageProps {
  dispatches: DispatchRecord[];
  proofOfDeliveries: ProofOfDelivery[];
  clients: Client[];
  profile: UserProfile | null;
  /** Phase 61 — assigned routes for this driver. The UI prioritises
   *  these over raw dispatch records so the driver sees their day as
   *  a structured run, not a flat list of warehouse exits. */
  runs?: DispatchRun[];
  deliveryNotes?: DeliveryNote[];
  /** Called when a POD is captured (synced or pending). Parent merges
   *  into state + triggers the sync flush. */
  onPodCaptured: (pod: ProofOfDelivery) => void;
}

type OutcomeOption = 'Delivered' | 'Partial' | 'Refused' | 'Failed';
const OUTCOMES: OutcomeOption[] = ['Delivered', 'Partial', 'Refused', 'Failed'];
const CONDITIONS = ['Good', 'Minor damage', 'Major damage', 'Wet', 'Other'] as const;

function generatePodId(existing: ProofOfDelivery[]): { id: string; podNumber: string } {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = String(existing.length + 1).padStart(3, '0');
  const id = `POD-${stamp}-${seq}-${Math.random().toString(36).slice(2, 6)}`;
  const podNumber = `POD-${stamp}-${seq}`;
  return { id, podNumber };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function DriverPodPage({
  dispatches,
  proofOfDeliveries,
  clients,
  profile,
  runs,
  deliveryNotes,
  onPodCaptured,
}: DriverPodPageProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  // Dispatches that don't have a synced POD attached yet.
  const completedDispatchIds = useMemo(
    () => new Set(proofOfDeliveries.filter((p) => p.syncStatus !== 'failed').map((p) => p.dispatchRecordId)),
    [proofOfDeliveries],
  );
  const pendingDispatches = useMemo(
    () => dispatches.filter((d) => !completedDispatchIds.has(d.id)),
    [dispatches, completedDispatchIds],
  );

  const active = useMemo(
    () => (activeId ? dispatches.find((d) => d.id === activeId) || null : null),
    [activeId, dispatches],
  );

  // Phase 61 — find the driver's currently-active run (Loaded / In Progress)
  // assigned to this user. Most days there will be at most one. We bias
  // toward today's date but accept any not-yet-completed run so an early
  // start (set up the day before) still shows up.
  const todayIso = new Date().toISOString().slice(0, 10);
  const myActiveRun = useMemo(() => {
    if (!runs || runs.length === 0 || !profile?.id) return null;
    const mine = runs.filter((r) =>
      (r.driverUserId === profile.id || (profile.fullName && r.driverName === profile.fullName))
      && (r.status === 'Planned' || r.status === 'Loaded' || r.status === 'In Progress')
    );
    if (mine.length === 0) return null;
    // Prefer today's run, then most recent runDate.
    mine.sort((a, b) => {
      const at = a.runDate === todayIso ? 0 : 1;
      const bt = b.runDate === todayIso ? 0 : 1;
      if (at !== bt) return at - bt;
      return (b.runDate || '').localeCompare(a.runDate || '');
    });
    return mine[0];
  }, [runs, profile?.id, profile?.fullName, todayIso]);

  function dispatchForStop(deliveryNoteId: string): DispatchRecord | undefined {
    if (!deliveryNotes) return undefined;
    const dn = deliveryNotes.find((d) => d.id === deliveryNoteId);
    if (!dn) return undefined;
    const firstId = dn.dispatchRecordIds?.[0];
    if (!firstId) return undefined;
    return dispatches.find((d) => d.id === firstId);
  }

  function navigateUrl(address: string): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }

  if (!active) {
    return (
      <div className="driver-pod-shell">
        <SectionTitle
          title="Driver POD"
          subtitle={`Welcome ${profile?.fullName || 'driver'}${myActiveRun ? ` — run ${myActiveRun.runNumber}` : ` — ${pendingDispatches.length} delivery${pendingDispatches.length === 1 ? '' : 's'} to capture.`}`}
        />

        {myActiveRun && (
          <section className="card driver-run-panel">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontSize: '1.05rem' }}>Today's run · {myActiveRun.runNumber}</strong>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {myActiveRun.runDate} · {myActiveRun.stops.length} stop{myActiveRun.stops.length === 1 ? '' : 's'} · {myActiveRun.status}
                </div>
              </div>
              <div className="muted" style={{ fontSize: '0.78rem', textAlign: 'right' }}>
                {myActiveRun.vehicleRegistration || ''}
                {myActiveRun.vehicleDescription ? ` · ${myActiveRun.vehicleDescription}` : ''}
              </div>
            </header>
            {myActiveRun.notes && (
              <p className="muted" style={{ background: '#fef3c7', padding: '6px 10px', borderRadius: 6, fontSize: '0.78rem', margin: '6px 0' }}>
                {myActiveRun.notes}
              </p>
            )}
            <ol className="driver-run-stops">
              {myActiveRun.stops.map((stop, idx) => {
                const completed = Boolean(stop.outcome);
                const linkedDispatch = dispatchForStop(stop.deliveryNoteId);
                return (
                  <li key={stop.deliveryNoteId} className={`driver-run-stop ${completed ? 'is-done' : ''}`}>
                    <div className="driver-run-stop-num">{idx + 1}</div>
                    <div className="driver-run-stop-body">
                      <strong>{stop.clientName}</strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>{stop.deliveryNoteNumber}</div>
                      {stop.clientAddress && <div style={{ fontSize: '0.78rem' }}>{stop.clientAddress}</div>}
                      {completed && <div style={{ fontSize: '0.75rem', color: '#166534' }}>{stop.outcome}</div>}
                    </div>
                    <div className="driver-run-stop-actions">
                      {stop.clientAddress && (
                        <a className="table-button" href={navigateUrl(stop.clientAddress)} target="_blank" rel="noopener noreferrer">
                          Navigate
                        </a>
                      )}
                      {!completed && linkedDispatch && (
                        <button className="secondary-button" onClick={() => setActiveId(linkedDispatch.id)}>
                          Capture POD
                        </button>
                      )}
                      {!completed && !linkedDispatch && (
                        <span className="muted" style={{ fontSize: '0.72rem' }}>No dispatch linked</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {pendingDispatches.length === 0 && !myActiveRun ? (
          <EmptyState title="All deliveries captured" body="Nothing waiting in your run sheet right now." />
        ) : pendingDispatches.length > 0 ? (
          <>
            {myActiveRun && <h4 style={{ marginTop: 16 }}>Other dispatches (ad-hoc / samples)</h4>}
            <ul className="driver-pod-list">
              {pendingDispatches.map((d) => (
                <li key={d.id}>
                  <button className="driver-pod-card" onClick={() => setActiveId(d.id)}>
                    <strong>{d.customerName || 'Unknown customer'}</strong>
                    <span>Dispatch {d.dispatchNumber} • Job {d.jobNumber}</span>
                    <small>Qty {d.quantityDispatched} {d.quantityUnit}</small>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <CaptureFlow
      dispatch={active}
      client={clientById.get(active.jobId) || null}
      profile={profile}
      existingCount={proofOfDeliveries.length}
      onCancel={() => setActiveId(null)}
      onSubmitted={(pod) => {
        onPodCaptured(pod);
        setActiveId(null);
      }}
    />
  );
}

interface CaptureFlowProps {
  dispatch: DispatchRecord;
  client: Client | null;
  profile: UserProfile | null;
  existingCount: number;
  onCancel: () => void;
  onSubmitted: (pod: ProofOfDelivery) => void;
}

function CaptureFlow({ dispatch, client, profile, existingCount, onCancel, onSubmitted }: CaptureFlowProps) {
  const [receiverName, setReceiverName] = useState('');
  const [receiverRole, setReceiverRole] = useState('');
  const [receiverCompany, setReceiverCompany] = useState(dispatch.customerName || '');
  const [receiverIdNumber, setReceiverIdNumber] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [outcome, setOutcome] = useState<OutcomeOption>('Delivered');
  const [failureReason, setFailureReason] = useState('');
  const [quantityDelivered, setQuantityDelivered] = useState(String(dispatch.quantityDispatched ?? 0));
  const [condition, setCondition] = useState<typeof CONDITIONS[number]>('Good');
  const [conditionNotes, setConditionNotes] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [signedDocPhotoDataUrl, setSignedDocPhotoDataUrl] = useState('');
  const [goodsPhotos, setGoodsPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number }>({ lat: 0, lng: 0, accuracy: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Capture GPS once on mount; user can still submit without it.
  useEffect(() => {
    captureGps().then((g) => setGps(g));
  }, []);

  const canSubmit =
    receiverName.trim().length > 0 &&
    outcome !== undefined &&
    (outcome === 'Delivered' || outcome === 'Partial'
      ? signatureDataUrl.length > 0 || signedDocPhotoDataUrl.length > 0
      : true) &&
    !submitting;

  async function handlePhoto(setter: (s: string) => void, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setter(await fileToDataUrl(f));
    e.target.value = '';
  }

  async function handleAddGoodsPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await fileToDataUrl(f);
    setGoodsPhotos((prev) => [...prev, url]);
    e.target.value = '';
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage('Saving locally…');
    const { id, podNumber } = generatePodId(Array.from({ length: existingCount } as any) as any);
    const pod: ProofOfDelivery = {
      id,
      podNumber,
      createdAt: new Date().toISOString(),
      dispatchRecordId: dispatch.id,
      dispatchNumber: dispatch.dispatchNumber,
      jobId: dispatch.jobId,
      jobNumber: dispatch.jobNumber,
      clientId: client?.id || '',
      clientName: client?.companyName || dispatch.customerName || '',
      driverName: profile?.fullName || '',
      driverUserId: profile?.id || '',
      receiverName: receiverName.trim(),
      receiverRole: receiverRole.trim(),
      receiverCompany: receiverCompany.trim(),
      receiverIdNumber: receiverIdNumber.trim(),
      receiverPhone: receiverPhone.trim(),
      outcome,
      failureReason: outcome === 'Failed' || outcome === 'Refused' ? failureReason.trim() : '',
      quantityDelivered: Number(quantityDelivered || 0),
      quantityUnit: dispatch.quantityUnit,
      goodsCondition: condition,
      conditionNotes: conditionNotes.trim(),
      capturedAt: new Date().toISOString(),
      gpsLatitude: gps.lat,
      gpsLongitude: gps.lng,
      gpsAccuracyMeters: gps.accuracy,
      signatureUrl: '',
      signatureDataUrl,
      signedDocumentPhotoUrl: signedDocPhotoDataUrl,
      goodsPhotoUrls: goodsPhotos,
      notes: notes.trim(),
      syncStatus: 'pending',
      syncError: '',
    };
    try {
      await savePodLocally(pod);
    } catch (e: any) {
      setMessage(`Local save failed: ${e?.message || 'unknown'}. POD will not survive a reload.`);
    }
    setMessage('Saved — syncing when online.');
    onSubmitted(pod);
  }

  return (
    <div className="driver-pod-shell">
      <header className="driver-pod-header">
        <button className="link-button" onClick={onCancel}>Back</button>
        <strong>Dispatch {dispatch.dispatchNumber}</strong>
        <span>{dispatch.customerName}</span>
      </header>

      <section className="driver-pod-section">
        <h3>Receiver</h3>
        <label><span>Name *</span><input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} autoComplete="off" /></label>
        <label><span>Role</span><input value={receiverRole} onChange={(e) => setReceiverRole(e.target.value)} placeholder="e.g. Storeman" /></label>
        <label><span>Company</span><input value={receiverCompany} onChange={(e) => setReceiverCompany(e.target.value)} /></label>
        <label><span>ID number</span><input value={receiverIdNumber} onChange={(e) => setReceiverIdNumber(e.target.value)} inputMode="numeric" /></label>
        <label><span>Phone</span><input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} inputMode="tel" /></label>
      </section>

      <section className="driver-pod-section">
        <h3>Outcome</h3>
        <div className="driver-pod-segment">
          {OUTCOMES.map((opt) => (
            <button
              key={opt}
              type="button"
              className={outcome === opt ? 'active' : ''}
              onClick={() => setOutcome(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        {(outcome === 'Failed' || outcome === 'Refused') && (
          <label><span>Reason</span><textarea value={failureReason} onChange={(e) => setFailureReason(e.target.value)} rows={2} /></label>
        )}
      </section>

      <section className="driver-pod-section">
        <h3>Goods</h3>
        <label><span>Quantity delivered ({dispatch.quantityUnit})</span><input inputMode="decimal" value={quantityDelivered} onChange={(e) => setQuantityDelivered(e.target.value)} /></label>
        <label>
          <span>Condition</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value as any)}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        {condition !== 'Good' && (
          <label><span>Condition notes</span><textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} rows={2} /></label>
        )}
      </section>

      {(outcome === 'Delivered' || outcome === 'Partial') && (
        <section className="driver-pod-section">
          <h3>Signature</h3>
          <SignaturePad onChange={setSignatureDataUrl} label="Receiver signs below" />
          <label className="driver-pod-photo-input">
            <span>Or upload a photo of the signed delivery note</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(setSignedDocPhotoDataUrl, e)} />
            {signedDocPhotoDataUrl ? <img alt="" src={signedDocPhotoDataUrl} className="driver-pod-thumb" /> : null}
          </label>
        </section>
      )}

      <section className="driver-pod-section">
        <h3>Photos of goods (optional)</h3>
        <label className="driver-pod-photo-input">
          <span>Add photo</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleAddGoodsPhoto} />
        </label>
        {goodsPhotos.length > 0 && (
          <div className="driver-pod-thumbs">
            {goodsPhotos.map((src, i) => (
              <img key={i} alt="" src={src} className="driver-pod-thumb" />
            ))}
          </div>
        )}
      </section>

      <section className="driver-pod-section">
        <h3>Driver notes</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything the office should know" />
      </section>

      <section className="driver-pod-section">
        <small>GPS: {gps.lat ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (±${Math.round(gps.accuracy)}m)` : 'capturing…'}</small>
      </section>

      <div className="driver-pod-actions">
        {message ? <p className="muted">{message}</p> : null}
        <button className="primary-button" disabled={!canSubmit} onClick={submit}>
          {submitting ? 'Saving…' : 'Confirm delivery'}
        </button>
      </div>
    </div>
  );
}
