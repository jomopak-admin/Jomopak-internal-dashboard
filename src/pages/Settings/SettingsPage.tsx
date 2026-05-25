import { ChangeEvent, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { AppSettings, AppSettingsCompany, AppSettingsFormState } from '../../types';
import { supabase } from '../../utils/supabase';

/**
 * Admin-only Settings page. Tabs:
 *   - Branding: company details, logo upload (Supabase Storage)
 *   - Templates: invoice / delivery note / production spec footer lines, payment terms
 *   - Stock-holding: default storage days, review cadence, agreement terms text
 *   - Permissions: who can see what (folded in from PermissionsPage in stage 3)
 *   - Access: which roles can open Settings at all
 *
 * Stage 2: Branding + Templates tabs are now editable. They write back through
 * `setSettingsForm` -> App.tsx `handleSaveSettings` -> AppData (which fans out to
 * localStorage + Supabase via `syncAppData`). Logo upload goes to the public
 * `branding` Supabase Storage bucket and the resulting public URL is stored on
 * `settings.company.logoUrl`.
 */

/** Turn a stored ISO timestamp into a readable local string, e.g. "25 May 2026, 17:06". */
function formatSavedAt(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type SettingsTab = 'account' | 'branding' | 'templates' | 'stockHolding' | 'permissions' | 'access';

const TABS: Array<{ key: SettingsTab; label: string; subtitle: string }> = [
  { key: 'account', label: 'Account', subtitle: 'Your signed-in account and sign out.' },
  { key: 'branding', label: 'Branding', subtitle: 'Letterhead, logo, address, VAT — applied to every printed doc.' },
  { key: 'templates', label: 'Templates', subtitle: 'Default footer copy and payment terms for invoices, delivery notes, and specs.' },
  { key: 'stockHolding', label: 'Stock-holding', subtitle: 'Default storage days, review cadence, and agreement wording.' },
  { key: 'permissions', label: 'Permissions', subtitle: 'Per-user view-level access. Replaces the old standalone Permissions page.' },
  { key: 'access', label: 'Access', subtitle: 'Which roles can open this Settings page at all.' },
];

interface SettingsPageProps {
  settings: AppSettings;
  settingsForm: AppSettingsFormState;
  setSettingsForm: (value: AppSettingsFormState) => void;
  onSave: () => void;
  onReset: () => void;
  saveMessage: string;
  accountName: string;
  accountEmail: string;
  accountRole: string;
  onSignOut: () => void;
}

export function SettingsPage(props: SettingsPageProps) {
  const { settings, settingsForm, setSettingsForm, onSave, onReset, saveMessage, accountName, accountEmail, accountRole, onSignOut } = props;
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const tab = TABS.find((entry) => entry.key === activeTab) ?? TABS[0];

  // Helpers used by both Branding and Templates tabs ----------------------------------
  function patchCompany(patch: Partial<AppSettingsCompany>) {
    setSettingsForm({ ...settingsForm, company: { ...settingsForm.company, ...patch } });
  }
  function patchTemplates(patch: Partial<AppSettingsFormState['templates']>) {
    setSettingsForm({ ...settingsForm, templates: { ...settingsForm.templates, ...patch } });
  }

  function patchStockHolding(patch: Partial<AppSettingsFormState['stockHolding']>) {
    setSettingsForm({ ...settingsForm, stockHolding: { ...settingsForm.stockHolding, ...patch } });
  }

  const showSaveBar = activeTab === 'branding' || activeTab === 'templates' || activeTab === 'stockHolding';

  return (
    <>
      <SectionTitle
        title="Settings"
        subtitle="Centralised admin controls for branding, document templates, stock-holding defaults, and access."
      />

      <section className="card">
        <div className="settings-tabs" role="tablist" aria-label="Settings sections">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={activeTab === entry.key}
              className={activeTab === entry.key ? 'settings-tab is-active' : 'settings-tab'}
              onClick={() => setActiveTab(entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <SectionTitle title={tab.label} subtitle={tab.subtitle} />

        {activeTab === 'account' ? (
          <AccountTab name={accountName} email={accountEmail} role={accountRole} onSignOut={onSignOut} />
        ) : activeTab === 'branding' ? (
          <BrandingTab
            company={settingsForm.company}
            patchCompany={patchCompany}
            updatedAt={settings.updatedAt}
            updatedBy={settings.updatedBy}
          />
        ) : activeTab === 'templates' ? (
          <TemplatesTab templates={settingsForm.templates} patchTemplates={patchTemplates} />
        ) : activeTab === 'stockHolding' ? (
          <StockHoldingTab stockHolding={settingsForm.stockHolding} patchStockHolding={patchStockHolding} />
        ) : activeTab === 'permissions' ? (
          <PermissionsTab />
        ) : (
          <AccessTab />
        )}

        {showSaveBar ? (
          <div className="settings-save-bar">
            <div className="settings-save-msg">
              {saveMessage ? <span className="success-pill">{saveMessage}</span> : null}
            </div>
            <div className="settings-save-buttons">
              <button type="button" className="ghost-button" onClick={onReset}>Reset changes</button>
              <button type="button" className="primary-button" onClick={onSave}>Save settings</button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

/* --------------------------------- Account tab ---------------------------------- */

interface AccountTabProps {
  name: string;
  email: string;
  role: string;
  onSignOut: () => void;
}

function AccountTab({ name, email, role, onSignOut }: AccountTabProps) {
  return (
    <div className="account-tab">
      <div className="account-block" style={{ marginBottom: '1rem' }}>
        <div className="account-avatar" aria-hidden="true">{(name || '?').charAt(0).toUpperCase()}</div>
        <div className="account-copy">
          <strong>{name}</strong>
          <span>{email}</span>
          <small>{role}</small>
        </div>
      </div>
      <button type="button" className="ghost-button" onClick={onSignOut}>Sign Out</button>
    </div>
  );
}

/* --------------------------------- Branding tab --------------------------------- */

interface BrandingTabProps {
  company: AppSettingsCompany;
  patchCompany: (patch: Partial<AppSettingsCompany>) => void;
  updatedAt: string;
  updatedBy: string;
}

function BrandingTab({ company, patchCompany, updatedAt, updatedBy }: BrandingTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  async function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadMessage('');
    setUploading(true);
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png';
      // Stable path so repeated uploads overwrite the previous logo. We add a
      // cache-busting query string to logoUrl so the browser refetches it.
      const path = `logo-default.${ext || 'png'}`;
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('branding').getPublicUrl(path);
      const cacheBusted = `${data.publicUrl}?v=${Date.now()}`;
      patchCompany({ logoUrl: cacheBusted });
      setUploadMessage('Logo uploaded. Hit Save settings to apply.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setUploadError(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleClearLogo() {
    patchCompany({ logoUrl: '' });
    setUploadMessage('Logo cleared. Hit Save settings to apply.');
  }

  return (
    <>
      <div className="form-grid">
        <label>
          <span>Display name</span>
          <input value={company.name} onChange={(e) => patchCompany({ name: e.target.value })} placeholder="JomoPak" />
        </label>
        <label>
          <span>Legal name</span>
          <input
            value={company.legalName}
            onChange={(e) => patchCompany({ legalName: e.target.value })}
            placeholder="Pty Ltd / T/A name"
          />
        </label>
        <label>
          <span>Address line 1</span>
          <input
            value={company.addressLine1}
            onChange={(e) => patchCompany({ addressLine1: e.target.value })}
            placeholder="52A 4th Street Brentwood Park"
          />
        </label>
        <label>
          <span>Address line 2</span>
          <input
            value={company.addressLine2}
            onChange={(e) => patchCompany({ addressLine2: e.target.value })}
            placeholder="Benoni, Gauteng 1501"
          />
        </label>
        <label>
          <span>Phone</span>
          <input value={company.phone} onChange={(e) => patchCompany({ phone: e.target.value })} placeholder="+27 …" />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={company.email}
            onChange={(e) => patchCompany({ email: e.target.value })}
            placeholder="hello@jomopak.co.za"
          />
        </label>
        <label>
          <span>VAT number</span>
          <input
            value={company.vatNumber}
            onChange={(e) => patchCompany({ vatNumber: e.target.value })}
            placeholder="VAT registration number"
          />
        </label>
      </div>

      <div className="settings-logo-row">
        <div className="settings-logo-preview">
          <p className="eyebrow">Letterhead logo</p>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Company logo preview" className="settings-logo-img" />
          ) : (
            <div className="settings-logo-placeholder">
              <strong>{company.name || 'JomoPak'}</strong>
              <small>PAPER BAGS</small>
              <p className="muted">No logo uploaded — printed docs will use this stylised text mark.</p>
            </div>
          )}
        </div>
        <div className="settings-logo-controls">
          <p className="muted">PNG or SVG with a transparent background looks best. Stored in the Supabase <code>branding</code> bucket.</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoFile} disabled={uploading} />
          <div className="settings-logo-buttons">
            {company.logoUrl ? (
              <button type="button" className="ghost-button" onClick={handleClearLogo}>Remove logo</button>
            ) : null}
          </div>
          {uploading ? <p className="muted">Uploading…</p> : null}
          {uploadMessage ? <p className="success-pill" style={{ marginTop: '4px' }}>{uploadMessage}</p> : null}
          {uploadError ? <p className="error-pill" style={{ marginTop: '4px' }}>{uploadError}</p> : null}
          <label style={{ marginTop: '8px' }}>
            <span>Or paste a logo URL</span>
            <input
              value={company.logoUrl}
              onChange={(e) => patchCompany({ logoUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>
        </div>
      </div>

      {updatedAt ? (
        <p className="muted" style={{ marginTop: '12px' }}>
          Last saved {formatSavedAt(updatedAt)}
          {updatedBy ? ` by ${updatedBy}` : ''}
        </p>
      ) : null}
    </>
  );
}

/* --------------------------------- Templates tab -------------------------------- */

interface TemplatesTabProps {
  templates: AppSettingsFormState['templates'];
  patchTemplates: (patch: Partial<AppSettingsFormState['templates']>) => void;
}

function TemplatesTab({ templates, patchTemplates }: TemplatesTabProps) {
  return (
    <div className="settings-template-groups">
      <section className="settings-template-group">
        <h4 className="accounting-group-head"><span className="sars-tag">Customer note &amp; terms</span></h4>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.78rem' }}>Shared across customer-facing documents — set once.</p>
        <div className="form-grid">
          <label className="full-span">
            <span>Default customer note (prints on quotes, invoices &amp; delivery notes)</span>
            <textarea
              rows={2}
              value={templates.defaultCustomerNote}
              onChange={(e) => patchTemplates({ defaultCustomerNote: e.target.value })}
              placeholder="Thank you for your business…"
            />
            <small className="muted">Pre-fills the customer note on new documents — editable per document.</small>
          </label>
          <label className="full-span">
            <span>Basic terms (prints on quotes &amp; invoices)</span>
            <textarea
              rows={3}
              value={templates.termsAndConditions}
              onChange={(e) => patchTemplates({ termsAndConditions: e.target.value })}
              placeholder="Quotes valid 30 days. 50% deposit to commence production, balance before dispatch. Printed colours may vary slightly from proofs. E&OE."
            />
            <small className="muted">Keep this short — just the essentials. Your full T&Cs live online (see the line below). Delivery notes don't show terms.</small>
          </label>
          <label className="full-span">
            <span>Full T&amp;Cs reference line (prints on quotes &amp; invoices)</span>
            <input
              value={templates.termsReferenceLine}
              onChange={(e) => patchTemplates({ termsReferenceLine: e.target.value })}
              placeholder="Full terms & conditions are available at jomopak.co.za/terms"
            />
            <small className="muted">A one-line pointer to your full terms online.</small>
          </label>
        </div>
      </section>

      <section className="settings-template-group">
        <h4 className="accounting-group-head"><span className="sars-tag">Invoice</span></h4>
        <div className="form-grid">
          <label className="full-span">
            <span>Invoice footer (one line per row)</span>
            <textarea
              rows={4}
              value={templates.invoiceFooterLines}
              onChange={(e) => patchTemplates({ invoiceFooterLines: e.target.value })}
              placeholder={'50% deposit to be made…\nPlease send POP when payment is made.\nLimited Stock available.'}
            />
            <small className="muted">Shown at the bottom of every invoice unless the invoice has its own footer notes.</small>
          </label>
          <label className="full-span">
            <span>Default payment terms</span>
            <input
              value={templates.defaultPaymentTerms}
              onChange={(e) => patchTemplates({ defaultPaymentTerms: e.target.value })}
              placeholder="50% deposit, balance on collection."
            />
          </label>
          <label className="full-span">
            <span>Default invoice notes (internal)</span>
            <textarea
              rows={2}
              value={templates.defaultInvoiceNotes}
              onChange={(e) => patchTemplates({ defaultInvoiceNotes: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="settings-template-group">
        <h4 className="accounting-group-head"><span className="sars-tag">Delivery note</span></h4>
        <div className="form-grid">
          <label className="full-span">
            <span>Delivery note footer (one line per row)</span>
            <textarea
              rows={4}
              value={templates.deliveryNoteFooterLines}
              onChange={(e) => patchTemplates({ deliveryNoteFooterLines: e.target.value })}
              placeholder={'Please inspect goods on receipt…'}
            />
          </label>
          <label className="full-span">
            <span>Default delivery note notes (internal)</span>
            <textarea
              rows={2}
              value={templates.defaultDeliveryNoteNotes}
              onChange={(e) => patchTemplates({ defaultDeliveryNoteNotes: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="settings-template-group">
        <h4 className="accounting-group-head"><span className="sars-tag">Production spec</span></h4>
        <div className="form-grid">
          <label className="full-span">
            <span>Production spec footer (one line per row)</span>
            <textarea
              rows={3}
              value={templates.productionSpecFooterLines}
              onChange={(e) => patchTemplates({ productionSpecFooterLines: e.target.value })}
              placeholder={'Specs are confidential and intended only for internal production handover.'}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

/* ----- Stage 3: editable stock-holding tab. ----- */

function StockHoldingTab({
  stockHolding,
  patchStockHolding,
}: {
  stockHolding: AppSettingsFormState['stockHolding'];
  patchStockHolding: (patch: Partial<AppSettingsFormState['stockHolding']>) => void;
}) {
  return (
    <div className="form-grid">
      <label>
        <span>Default storage window (days)</span>
        <input
          type="number"
          min="0"
          value={stockHolding.defaultMaxDays}
          onChange={(e) => patchStockHolding({ defaultMaxDays: e.target.value })}
        />
      </label>
      <label>
        <span>Review cadence (days)</span>
        <input
          type="number"
          min="0"
          value={stockHolding.defaultReviewCadenceDays}
          onChange={(e) => patchStockHolding({ defaultReviewCadenceDays: e.target.value })}
        />
      </label>
      <label className="full-span">
        <span>Stock-holding agreement wording</span>
        <textarea
          rows={8}
          value={stockHolding.defaultAgreementTermsText}
          onChange={(e) => patchStockHolding({ defaultAgreementTermsText: e.target.value })}
          placeholder="Default contractual wording shown on the stock-holding agreement printable."
        />
      </label>
      <p className="form-hint full-span">
        Saved values become the new default for any new client agreement. Existing agreements aren&apos;t mutated.
      </p>
    </div>
  );
}

/* ----- Stage 3: in-tab Permissions + Access placeholders. ----- */

function PermissionsTab() {
  return (
    <div className="settings-preview-list">
      <div className="settings-preview-block">
        <p className="eyebrow">Per-user view-level access</p>
        <p>
          The full permissions matrix is still managed via the standalone Permissions entry in the
          sidebar. The migration to a tab here is in progress — saving permissions remains live there.
        </p>
      </div>
      <div className="settings-preview-block">
        <p className="eyebrow">Default role visibility</p>
        <p>
          Admins see every view. Ops sees production, stock and dispatch. Sales sees clients,
          quotes, invoices. Floor operators only see job cards and their own check-out / consumable
          history. Roles can be tightened per-user from Permissions.
        </p>
      </div>
    </div>
  );
}

function AccessTab() {
  return (
    <div className="settings-preview-list">
      <div className="settings-preview-block">
        <p className="eyebrow">Settings page access</p>
        <p>
          Admins can always open Settings. Accounts and ops can open the Branding and Templates
          tabs but not Permissions / Access. Floor users do not see the Settings entry in the
          sidebar at all.
        </p>
      </div>
      <div className="settings-preview-block">
        <p className="eyebrow">Audit trail</p>
        <p>Every settings save records the actor and timestamp on the singleton row.</p>
      </div>
    </div>
  );
}
