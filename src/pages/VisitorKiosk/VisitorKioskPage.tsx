/**
 * Reception Kiosk (phase 37)
 *
 * Full-screen, touch-friendly self check-in / sign-out for visitors. Designed
 * to run on an Android tablet at reception pinned in single-app mode (Android
 * Settings Security Screen Pinning, or a kiosk launcher like Fully Kiosk
 * / Knox).
 *
 * Two flows:
 *  1) Check in  — visitor fills name, phone, company, host, purpose, vehicle
 *                 reg (optional, mainly delivery drivers), areas they'll visit,
 *                 PPE issued, hygiene tick, then signs on-screen. Saves a new
 *                 visitor-log entry stamped Time in = now.
 *  2) Sign out — picks themselves from the list of visitors still on site,
 *                 signs, and the entry's Time out is stamped.
 *
 * After either action the screen shows a Thank-you for ~5s and auto-resets.
 *
 * Admin can press "Exit kiosk mode" (top-right) to leave the kiosk view. This
 * does NOT bypass the Android device-level pinning — that has to be released
 * on the device.
 */

import { useEffect, useMemo, useState } from 'react';
import { SignaturePad } from '../../components/SignaturePad';
import {
  AppSettingsCompany,
  FACTORY_AREAS,
  FactoryArea,
  VisitorLogEntry,
  VisitorLogFormState,
  VisitorType,
} from '../../types';

const VISITOR_TYPES: VisitorType[] = ['Customer', 'Supplier', 'Contractor', 'Auditor', 'Maintenance', 'Pest Control', 'Other'];

interface VisitorKioskPageProps {
  visitors: VisitorLogEntry[];
  staffOptions: string[];
  company?: AppSettingsCompany;
  /** Capture a new visitor (returns the saved entry's visit number for display). */
  onCheckIn: (entry: Omit<VisitorLogEntry, 'id' | 'createdAt' | 'visitNumber'>) => void;
  /** Stamp time-out + signature on an existing entry. */
  onSignOut: (id: string, signatureDataUrl: string) => void;
  /** Admin exits kiosk mode (returns to dashboard). */
  onExitKiosk: () => void;
}

function nowTime(): string {
  // HH:MM in 24h
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function blankForm(): VisitorLogFormState {
  return {
    visitDate: todayISO(),
    visitorName: '',
    visitorType: 'Customer',
    company: '',
    hostName: '',
    purpose: '',
    areasVisited: [],
    timeIn: nowTime(),
    timeOut: '',
    hygieneAcknowledged: false,
    ppeIssued: '',
    ppeIssuedItems: [],
    enteredFoodContactArea: false,
    notes: '',
    phoneNumber: '',
    vehicleRegistration: '',
    signatureDataUrl: '',
  };
}

export function VisitorKioskPage({
  visitors,
  staffOptions,
  company,
  onCheckIn,
  onSignOut,
  onExitKiosk,
}: VisitorKioskPageProps) {
  const [mode, setMode] = useState<'landing' | 'checkIn' | 'signOut' | 'thanks'>('landing');
  const [form, setForm] = useState<VisitorLogFormState>(blankForm);
  const [signOutSig, setSignOutSig] = useState('');
  const [signOutPick, setSignOutPick] = useState<VisitorLogEntry | null>(null);
  const [error, setError] = useState('');
  const [thanksMessage, setThanksMessage] = useState('');

  // Auto-return to landing after thank-you screen.
  useEffect(() => {
    if (mode !== 'thanks') return;
    const t = setTimeout(() => goLanding(), 5000);
    return () => clearTimeout(t);
  }, [mode]);

  function goLanding() {
    setMode('landing');
    setForm(blankForm());
    setSignOutSig('');
    setSignOutPick(null);
    setError('');
  }

  // Visitors still on site today (no timeOut, visit date = today).
  const onSiteToday = useMemo(() => {
    const today = todayISO();
    return visitors
      .filter((v) => v.visitDate === today && !v.timeOut)
      .sort((a, b) => (b.timeIn || '').localeCompare(a.timeIn || ''));
  }, [visitors]);

  function toggleArea(area: FactoryArea) {
    setForm((f) => ({
      ...f,
      areasVisited: f.areasVisited.includes(area) ? f.areasVisited.filter((a) => a !== area) : [...f.areasVisited, area],
    }));
  }

  function submitCheckIn() {
    if (!form.visitorName.trim()) { setError("We need your name to sign you in."); return; }
    if (!form.hostName.trim() || form.hostName === '__other') { setError('Please choose who you are here to see.'); return; }
    if (!form.purpose.trim()) { setError('A quick word on why you are here, please.'); return; }
    if (!form.hygieneAcknowledged) { setError("Please tick the box to confirm you'll follow our site rules."); return; }
    if (!form.signatureDataUrl) { setError('Please sign in the box so we can complete your check-in.'); return; }
    setError('');
    onCheckIn({
      visitDate: form.visitDate || todayISO(),
      visitorName: form.visitorName.trim(),
      visitorType: form.visitorType,
      company: form.company.trim(),
      hostName: form.hostName.trim(),
      purpose: form.purpose.trim(),
      areasVisited: form.areasVisited,
      timeIn: form.timeIn || nowTime(),
      timeOut: '',
      hygieneAcknowledged: form.hygieneAcknowledged,
      ppeIssued: form.ppeIssued.trim(),
      enteredFoodContactArea: form.enteredFoodContactArea,
      notes: form.notes.trim(),
      phoneNumber: form.phoneNumber.trim() || undefined,
      vehicleRegistration: form.vehicleRegistration.trim() || undefined,
      signatureDataUrl: form.signatureDataUrl || undefined,
      kioskCheckin: true,
      staffVerified: false,
    });
    setThanksMessage(`Welcome, ${form.visitorName.trim().split(' ')[0]} — please take a seat. Reception will confirm your details and let ${form.hostName.trim()} know you're here.`);
    setMode('thanks');
  }

  function submitSignOut() {
    if (!signOutPick) { setError('Please tap your name first.'); return; }
    if (!signOutSig) { setError('Please sign to confirm sign-out.'); return; }
    setError('');
    onSignOut(signOutPick.id, signOutSig);
    setThanksMessage(`Thanks ${signOutPick.visitorName.split(' ')[0]} — drive safe.`);
    setMode('thanks');
  }

  return (
    <div className="kiosk-shell">
      <div className="kiosk-topbar">
        <div className="kiosk-brand">{company?.name || 'JomoPak'}</div>
        <button type="button" className="ghost-button" onClick={onExitKiosk}>Exit kiosk mode</button>
      </div>

      {mode === 'landing' ? (
        <div className="kiosk-landing">
          <h1 className="kiosk-h1">Welcome.</h1>
          <p className="kiosk-sub">Are you arriving or leaving?</p>
          <div className="kiosk-landing-actions">
            <button type="button" className="kiosk-btn kiosk-btn-primary" onClick={() => { setForm(blankForm()); setMode('checkIn'); }}>
              <strong>I'm arriving</strong>
              <span>Check in</span>
            </button>
            <button type="button" className="kiosk-btn kiosk-btn-secondary" onClick={() => { setSignOutPick(null); setSignOutSig(''); setMode('signOut'); }}>
              <strong>I'm leaving</strong>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'checkIn' ? (
        <div className="kiosk-form">
          <h2 className="kiosk-h2">Welcome — let's check you in</h2>
          <p className="kiosk-sub">It only takes a minute. Fields marked <em>(optional)</em> you can skip.</p>

          {/* --- About you --- */}
          <h3 className="kiosk-section-h">About you</h3>
          <div className="kiosk-grid">
            <label className="kiosk-field"><span>What's your name?</span>
              <input autoFocus autoCapitalize="words" autoComplete="name" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} placeholder="First &amp; last name" />
            </label>
            <label className="kiosk-field"><span>Phone number <em>(optional)</em></span>
              <input inputMode="tel" autoComplete="tel" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="+27 82 123 4567" />
            </label>
            <label className="kiosk-field"><span>Company you're from <em>(optional)</em></span>
              <input autoCapitalize="words" autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. ABC Logistics" />
            </label>
            <label className="kiosk-field"><span>I'm here as a…</span>
              <select value={form.visitorType} onChange={(e) => setForm({ ...form, visitorType: e.target.value as VisitorType })}>
                {VISITOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          {/* --- About your visit --- */}
          <h3 className="kiosk-section-h">About your visit</h3>
          <div className="kiosk-grid">
            <label className="kiosk-field"><span>Who are you here to see?</span>
              {staffOptions.length ? (
                <select value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })}>
                  <option value="">Pick a name…</option>
                  {staffOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__other">Not listed — I'll type it</option>
                </select>
              ) : (
                <input autoCapitalize="words" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} placeholder="Staff member's name" />
              )}
            </label>
            {form.hostName === '__other' ? (
              <label className="kiosk-field"><span>Who are you here to see?</span>
                <input autoFocus autoCapitalize="words" value="" onChange={(e) => setForm({ ...form, hostName: e.target.value })} placeholder="Type their name" />
              </label>
            ) : null}
            <label className="kiosk-field kiosk-span-2"><span>What's the visit about?</span>
              <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Meeting, delivery, maintenance, audit…" />
            </label>
            <label className="kiosk-field kiosk-span-2"><span>Vehicle registration <em>(optional — mostly for delivery drivers)</em></span>
              <input value={form.vehicleRegistration} onChange={(e) => setForm({ ...form, vehicleRegistration: e.target.value.toUpperCase() })} placeholder="e.g. CA 123-456" style={{ textTransform: 'uppercase' }} />
            </label>
          </div>

          {/* --- Site rules --- */}
          <h3 className="kiosk-section-h">Our site rules</h3>
          <div className="kiosk-grid">
            <div className="kiosk-field kiosk-span-2">
              <label className="kiosk-check">
                <input type="checkbox" checked={form.hygieneAcknowledged} onChange={(e) => setForm({ ...form, hygieneAcknowledged: e.target.checked })} />
                <span>I understand and will follow the site's hygiene, PPE and food-safety rules while I'm here.</span>
              </label>
              <label className="kiosk-check">
                <input type="checkbox" checked={form.enteredFoodContactArea} onChange={(e) => setForm({ ...form, enteredFoodContactArea: e.target.checked })} />
                <span>I'll be entering an area where food packaging is made (food-contact zone).</span>
              </label>
            </div>
          </div>

          {/* --- Signature --- */}
          <h3 className="kiosk-section-h">Almost done — please sign below</h3>
          <div className="kiosk-grid">
            <div className="kiosk-field kiosk-span-2">
              <SignaturePad onChange={(d) => setForm((f) => ({ ...f, signatureDataUrl: d }))} label="Sign with your finger" height={200} />
            </div>
          </div>

          {error ? <p className="kiosk-error">{error}</p> : null}
          <div className="kiosk-actions">
            <button type="button" className="kiosk-btn kiosk-btn-ghost" onClick={goLanding}>Cancel</button>
            <button type="button" className="kiosk-btn kiosk-btn-primary" onClick={submitCheckIn}>Check me in</button>
          </div>
        </div>
      ) : null}

      {mode === 'signOut' ? (
        <div className="kiosk-form">
          <h2 className="kiosk-h2">See you next time</h2>
          <p className="kiosk-sub">Tap your name below, sign, and you're on your way.</p>
          {onSiteToday.length === 0 ? (
            <p className="kiosk-empty">No-one is currently signed in today.</p>
          ) : (
            <div className="kiosk-pick-list">
              {onSiteToday.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`kiosk-pick ${signOutPick?.id === v.id ? 'is-active' : ''}`}
                  onClick={() => setSignOutPick(v)}
                >
                  <strong>{v.visitorName}</strong>
                  <span>{v.company || v.visitorType} · in {v.timeIn || '—'}</span>
                </button>
              ))}
            </div>
          )}
          {signOutPick ? (
            <div style={{ marginTop: '1rem' }}>
              <SignaturePad onChange={setSignOutSig} label={`Sign to confirm sign-out for ${signOutPick.visitorName}`} height={200} />
            </div>
          ) : null}
          {error ? <p className="kiosk-error">{error}</p> : null}
          <div className="kiosk-actions">
            <button type="button" className="kiosk-btn kiosk-btn-ghost" onClick={goLanding}>Cancel</button>
            <button type="button" className="kiosk-btn kiosk-btn-primary" onClick={submitSignOut} disabled={!signOutPick}>Sign out</button>
          </div>
        </div>
      ) : null}

      {mode === 'thanks' ? (
        <div className="kiosk-thanks">
          <div className="kiosk-thanks-tick" aria-hidden></div>
          <h2 className="kiosk-h1">Thank you</h2>
          <p className="kiosk-sub">{thanksMessage}</p>
          <p className="kiosk-sub" style={{ opacity: 0.6, fontSize: '1rem' }}>Returning to start in a few seconds…</p>
          <button type="button" className="kiosk-btn kiosk-btn-ghost" onClick={goLanding}>Done</button>
        </div>
      ) : null}
    </div>
  );
}
