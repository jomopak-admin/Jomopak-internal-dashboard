import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  ACCOUNTING_STANDARDS,
  AccountingStandard,
  AppData,
  AppSettings,
  AppSettingsCompany,
  AppSettingsConnectorConfig,
  AppSettingsFormState,
  AreaSafety,
  DEFAULT_AREA_SAFETY,
  DEPRECIATION_METHODS_BY_STANDARD,
  FACTORY_AREAS,
  FactoryArea,
  INVENTORY_METHODS_BY_STANDARD,
  getAreaSafety,
} from '../../types';
import { supabase } from '../../utils/supabase';
import { OsConnectorPage } from '../OsConnector/OsConnectorPage';

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

type SettingsTab = 'account' | 'branding' | 'templates' | 'pricing' | 'stockHolding' | 'permissions' | 'accounting' | 'visitorAccess' | 'apiAccess' | 'access';

const TABS: Array<{ key: SettingsTab; label: string; subtitle: string }> = [
  { key: 'account', label: 'Account', subtitle: 'Your signed-in account and sign out.' },
  { key: 'branding', label: 'Branding', subtitle: 'Letterhead, logo, address, VAT — applied to every printed doc.' },
  { key: 'templates', label: 'Templates', subtitle: 'Default footer copy and payment terms for invoices, delivery notes, and specs.' },
  { key: 'pricing', label: 'Pricing', subtitle: 'Company-wide standard margin used by the calculator when no override is set.' },
  { key: 'stockHolding', label: 'Stock-holding', subtitle: 'Default storage days, review cadence, and agreement wording.' },
  { key: 'permissions', label: 'Permissions', subtitle: 'Per-user view-level access. Replaces the old standalone Permissions page.' },
  { key: 'accounting', label: 'Accounting', subtitle: 'Accounting standard (IFRS / US GAAP). Drives depreciation, inventory valuation, and lease treatment defaults.' },
  { key: 'visitorAccess', label: 'Visitor access', subtitle: 'Which areas reception can grant without host approval, and how long until an unanswered request escalates.' },
  { key: 'apiAccess', label: 'API access', subtitle: 'Secure read-only API for connecting JomoPak to other systems (Aman OS, dashboards, website). You control what’s shared.' },
  { key: 'access', label: 'Page access', subtitle: 'Which roles can open this Settings page at all.' },
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
  /** Phase 103.7 — API Access tab. The full OsConnectorPage is mounted
   *  inside the Settings panel; passing through gives it the same data,
   *  connector config, and publish handlers it has when standalone. */
  apiAccessData: AppData;
  apiAccessConnectorConfig: AppSettingsConnectorConfig;
  apiAccessToday: string;
  onApiAccessSaveConfig: (config: AppSettingsConnectorConfig) => void;
  onApiAccessPublishNow: () => Promise<void> | void;
  /** Phase 107.1 — Visitor Access tab handlers. Flips an area between
   *  safe and restricted in appSettings.visitorAreaPolicy; sets the
   *  auto-escalation timer. Both write straight back to AppSettings. */
  onSetAreaSafety?: (area: FactoryArea, safety: AreaSafety) => void;
  onSetEscalationMinutes?: (minutes: number) => void;
  /** Phase 109.1 — Accounting tab handler. Switches the reporting
   *  standard. Downstream pages (fixed assets, inventory, projections)
   *  read settings.accountingStandard for their default validation. */
  onSetAccountingStandard?: (standard: AccountingStandard) => void;
  /** Phase 103.7.1 — when the page is opened from the account-menu
   *  "API access" entry, this seeds the active tab. Tabs are still
   *  clickable normally; this just changes the initial selection. */
  initialTab?: 'account' | 'branding' | 'templates' | 'pricing' | 'stockHolding' | 'permissions' | 'visitorAccess' | 'apiAccess' | 'access';
  /** Phase 103.7.1 — caller clears the requested initial tab after we
   *  honour it so subsequent navigations to Settings reset to 'account'. */
  onInitialTabHandled?: () => void;
}

export function SettingsPage(props: SettingsPageProps) {
  const {
    settings, settingsForm, setSettingsForm, onSave, onReset, saveMessage,
    accountName, accountEmail, accountRole, onSignOut,
    apiAccessData, apiAccessConnectorConfig, apiAccessToday, onApiAccessSaveConfig, onApiAccessPublishNow,
    onSetAreaSafety, onSetEscalationMinutes,
    onSetAccountingStandard,
    initialTab, onInitialTabHandled,
  } = props;
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? 'account');
  // Phase 103.7.1 — honour a freshly-set initialTab (e.g. user clicked
  // "API access" in the account menu while already on the Settings page).
  // We only react when initialTab changes; the parent clears its
  // "requested tab" state via onInitialTabHandled so the next visit
  // resets cleanly to 'account'.
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      onInitialTabHandled?.();
    }
  }, [initialTab, onInitialTabHandled]);
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

  function patchStandardMargin(value: string) {
    setSettingsForm({ ...settingsForm, standardMarginPercent: value });
  }

  const showSaveBar =
    activeTab === 'branding'
    || activeTab === 'templates'
    || activeTab === 'pricing'
    || activeTab === 'stockHolding';

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
        ) : activeTab === 'pricing' ? (
          <PricingTab
            standardMarginPercent={settingsForm.standardMarginPercent}
            patchStandardMargin={patchStandardMargin}
          />
        ) : activeTab === 'stockHolding' ? (
          <StockHoldingTab stockHolding={settingsForm.stockHolding} patchStockHolding={patchStockHolding} />
        ) : activeTab === 'permissions' ? (
          <PermissionsTab />
        ) : activeTab === 'apiAccess' ? (
          <OsConnectorPage
            data={apiAccessData}
            connectorConfig={apiAccessConnectorConfig}
            today={apiAccessToday}
            onSaveConfig={onApiAccessSaveConfig}
            onPublishNow={onApiAccessPublishNow}
          />
        ) : activeTab === 'visitorAccess' ? (
          <VisitorAccessTab
            policy={settings.visitorAreaPolicy}
            escalationMinutes={settings.visitorApprovalEscalationMinutes ?? 5}
            onSetAreaSafety={onSetAreaSafety}
            onSetEscalationMinutes={onSetEscalationMinutes}
          />
        ) : activeTab === 'accounting' ? (
          <AccountingTab
            current={settings.accountingStandard ?? 'IFRS'}
            onChange={onSetAccountingStandard}
          />
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

type TemplateGroup = 'customer' | 'invoice' | 'delivery' | 'spec';

function TemplatesTab({ templates, patchTemplates }: TemplatesTabProps) {
  const [group, setGroup] = useState<TemplateGroup>('customer');
  return (
    <div className="settings-template-groups">
      <label className="full-span" style={{ maxWidth: 380 }}>
        <span>Edit templates for</span>
        <select value={group} onChange={(e) => setGroup(e.target.value as TemplateGroup)}>
          <option value="customer">Customer note &amp; terms</option>
          <option value="invoice">Invoice</option>
          <option value="delivery">Delivery note</option>
          <option value="spec">Production spec</option>
        </select>
      </label>
      {group === 'customer' ? (
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
      ) : null}
      {group === 'invoice' ? (
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
      ) : null}
      {group === 'delivery' ? (
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
      ) : null}
      {group === 'spec' ? (
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
      ) : null}
    </div>
  );
}

/* ----- Phase 92: Company-wide pricing tab. ----- */

function PricingTab({
  standardMarginPercent,
  patchStandardMargin,
}: {
  standardMarginPercent: string;
  patchStandardMargin: (value: string) => void;
}) {
  const parsed = Number(standardMarginPercent);
  const preview = Number.isFinite(parsed) && parsed > 0
    ? `R 100 cost → R ${(100 * (1 + parsed / 100)).toFixed(2)} sell`
    : 'Set a percentage to see a worked example.';
  return (
    <div className="form-grid">
      <label>
        <span>Standard margin (%)</span>
        <input
          type="number"
          step="0.1"
          min="0"
          max="500"
          value={standardMarginPercent}
          onChange={(e) => patchStandardMargin(e.target.value)}
          placeholder="35"
        />
      </label>
      <div className="full-span">
        <p className="form-hint" style={{ marginBottom: 6 }}>
          The calculator uses this whenever a line doesn&apos;t have its own margin,
          and no per-quote or cost-profile margin is set. It&apos;s the company-wide
          floor — what sales sees by default. Only admins (or users with the
          &quot;Can edit pricing&quot; flag) can override it on a per-line basis from
          the CEO discount mode.
        </p>
        <p className="form-hint" style={{ fontStyle: 'italic' }}>
          Worked example at the current value: <strong>{preview}</strong>
        </p>
      </div>
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

/* --------------------------------- Visitor Access tab ------------------------------ */

/**
 * Phase 107.1 — Admin UI for the Phase 106 visitor approval system.
 *
 * Two controls:
 *   1. Per-area safety override — flip any FactoryArea between 'safe'
 *      (reception can approve solo) and 'restricted' (needs host
 *      approval). The defaults are conservative (front-of-house = safe,
 *      everything else = restricted); admin overrides land on
 *      appSettings.visitorAreaPolicy.
 *   2. Escalation timer — minutes until an unanswered approval auto-
 *      routes to the host's backup. Lives on
 *      appSettings.visitorApprovalEscalationMinutes (default 5).
 */
interface VisitorAccessTabProps {
  policy?: Partial<Record<FactoryArea, AreaSafety>>;
  escalationMinutes: number;
  onSetAreaSafety?: (area: FactoryArea, safety: AreaSafety) => void;
  onSetEscalationMinutes?: (minutes: number) => void;
}

function VisitorAccessTab({ policy, escalationMinutes, onSetAreaSafety, onSetEscalationMinutes }: VisitorAccessTabProps) {
  const grouped = useMemo(() => {
    const safe: FactoryArea[] = [];
    const restricted: FactoryArea[] = [];
    FACTORY_AREAS.forEach((a) => {
      if (getAreaSafety(a, policy) === 'safe') safe.push(a);
      else restricted.push(a);
    });
    return { safe, restricted };
  }, [policy]);

  function rowFor(area: FactoryArea, current: AreaSafety) {
    const defaultSafety = DEFAULT_AREA_SAFETY[area];
    const isOverride = policy && policy[area] !== undefined && policy[area] !== defaultSafety;
    return (
      <div
        key={area}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 6,
          background: current === 'safe' ? 'rgba(46,111,62,0.04)' : 'rgba(178,43,43,0.04)',
          border: '1px solid var(--jp-divider, #cbd5e1)',
          marginBottom: 6,
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <strong>{area}</strong>
          {isOverride ? <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>(override — default: {defaultSafety})</span> : null}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['safe', 'restricted'] as AreaSafety[]).map((s) => {
            const active = current === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSetAreaSafety && onSetAreaSafety(area, s)}
                disabled={!onSetAreaSafety}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  border: `1px solid ${active ? 'var(--jp-ink-2, #475569)' : 'var(--jp-divider, #cbd5e1)'}`,
                  background: active ? (s === 'safe' ? 'var(--jp-success, #2e6f3e)' : '#b22b2b') : 'transparent',
                  color: active ? 'var(--jp-paper, #fff)' : 'var(--jp-ink-2, #475569)',
                  cursor: onSetAreaSafety ? 'pointer' : 'default',
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="settings-preview-block">
        <p className="eyebrow">Auto-escalation timer</p>
        <p style={{ marginBottom: 12 }}>
          When a host doesn't respond to a visitor approval request in this many minutes, the request
          auto-routes to their backup approver. Critical-priority notifications fire at the same moment.
        </p>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input
            type="number"
            min={1}
            max={120}
            value={escalationMinutes}
            onChange={(e) => onSetEscalationMinutes && onSetEscalationMinutes(Math.max(1, Number(e.target.value) || 5))}
            disabled={!onSetEscalationMinutes}
            style={{ width: 80, padding: '6px 8px' }}
          />
          <span className="muted">minutes (default 5)</span>
        </label>
      </div>

      <div className="settings-preview-block">
        <p className="eyebrow">Safe areas — reception can approve on their own</p>
        <p style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)', marginBottom: 8 }}>
          Verified visitors can enter these without phoning a host. Defaults: Reception, Waiting Area,
          Meeting Rooms, Boardroom, Client Meeting Room.
        </p>
        {grouped.safe.map((a) => rowFor(a, 'safe'))}
      </div>

      <div className="settings-preview-block">
        <p className="eyebrow">Restricted areas — host approval required</p>
        <p style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)', marginBottom: 8 }}>
          Reception cannot let a visitor into these on their own — the host (or their backup, on
          escalation) has to approve in their Inbox. Defaults: all production, warehouse, office,
          finance, and admin areas.
        </p>
        {grouped.restricted.map((a) => rowFor(a, 'restricted'))}
      </div>
    </div>
  );
}

/* ------------------------------- Accounting tab -------------------------------- */
/*  Phase 109.1 — Accounting standard switcher.
 *  Lets the finance team flip the reporting standard between IFRS and US GAAP.
 *  Switching does NOT rewrite historical journals — it changes the defaults that
 *  Fixed Assets (depreciation method), Inventory (valuation method),
 *  Financial Statements (presentation), and Financial Projections (assumptions)
 *  read at render time.
 *  Persisted on AppSettings.accountingStandard (jsonb settings row).
 */

interface AccountingTabProps {
  current: AccountingStandard;
  onChange?: (standard: AccountingStandard) => void;
}

function AccountingTab({ current, onChange }: AccountingTabProps) {
  const inventoryAllowed = INVENTORY_METHODS_BY_STANDARD[current];
  const depreciationAllowed = DEPRECIATION_METHODS_BY_STANDARD[current];

  return (
    <div className="settings-accounting-tab">
      <div className="settings-preview-block" style={{ marginBottom: '1rem' }}>
        <p className="eyebrow">Reporting standard</p>
        <p>
          Choose the accounting standard your financial statements and
          projections will follow. This drives default depreciation methods,
          inventory valuation rules, lease treatment, and revenue recognition
          guidance throughout the dashboard.
        </p>
      </div>

      <div
        className="settings-standards-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {ACCOUNTING_STANDARDS.map((entry) => {
          const isActive = entry.key === current;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => {
                if (!isActive) onChange?.(entry.key);
              }}
              className={isActive ? 'standard-card is-active' : 'standard-card'}
              style={{
                textAlign: 'left',
                padding: '1rem',
                border: isActive
                  ? '2px solid var(--accent, #1f7a4d)'
                  : '1px solid var(--border, #d8dde3)',
                borderRadius: '0.5rem',
                background: isActive ? 'var(--accent-bg, #f0f8f3)' : 'var(--card-bg, #fff)',
                cursor: isActive ? 'default' : 'pointer',
                transition: 'all 120ms ease',
              }}
              aria-pressed={isActive}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <strong style={{ fontSize: '1rem' }}>{entry.label}</strong>
                {isActive ? (
                  <span className="success-pill" style={{ fontSize: '0.75rem' }}>
                    Active
                  </span>
                ) : null}
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted, #5b6b7a)' }}>
                {entry.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="settings-preview-list">
        <div className="settings-preview-block">
          <p className="eyebrow">What changes when you switch</p>
          <p>
            Existing journals, invoices, and bills are <strong>not rewritten</strong>. The
            switch only changes the validation defaults shown to new entries and the
            captions on the printable Income Statement, Balance Sheet, and Cash Flow.
          </p>
        </div>

        <div className="settings-preview-block">
          <p className="eyebrow">Inventory valuation methods allowed</p>
          <p>
            {inventoryAllowed.join(', ')}.
            {current === 'IFRS'
              ? ' IFRS (IAS 2) prohibits LIFO.'
              : ' US GAAP permits LIFO; if used, an LIFO reserve is required.'}
          </p>
        </div>

        <div className="settings-preview-block">
          <p className="eyebrow">Depreciation methods available</p>
          <p>
            {depreciationAllowed.join(', ')}.
            {current === 'US_GAAP'
              ? ' MACRS is only used for US tax reporting, not book accounting.'
              : ''}
          </p>
        </div>

        <div className="settings-preview-block">
          <p className="eyebrow">Other defaults driven by this setting</p>
          <p>
            {current === 'IFRS'
              ? 'Development costs may be capitalised when criteria are met (IAS 38). Investment property uses fair value option (IAS 40). Operating leases > 12 months are on-balance-sheet (IFRS 16).'
              : 'Development costs are expensed as incurred (ASC 730). Investment property is recorded at cost less depreciation. Operating leases on-balance-sheet under ASC 842 but with dual lease classification.'}
          </p>
        </div>

        <div className="settings-preview-block">
          <p className="eyebrow">Where this is used</p>
          <p>
            Fixed Assets &gt; new asset form (depreciation method dropdown).
            Finished Stock &gt; valuation method.
            Financial Statements &gt; statement captions and disclosures.
            Financial Projections &gt; assumption defaults.
          </p>
        </div>
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
