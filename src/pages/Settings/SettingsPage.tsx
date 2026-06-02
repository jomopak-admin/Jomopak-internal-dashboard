import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  ACCOUNTING_STANDARDS,
  AccountingStandard,
  AppData,
  AppSettings,
  AppSettingsAccountingConfig,
  AppSettingsBankAccount,
  AppSettingsBeneficiary,
  AppSettingsCompany,
  AppSettingsConnectorConfig,
  AppSettingsEmployerDetails,
  AppSettingsFormState,
  AppSettingsNumberingConfig,
  AppSettingsPayrollConfig,
  BrandLogo,
  DEFAULT_PAYROLL_CALCULATIONS,
  DOCUMENT_KIND_LABELS,
  DocumentKind,
  PayrollCalculationsConfig,
  AreaSafety,
  BANK_ACCOUNT_TYPE_LABELS,
  BENEFICIARY_KIND_LABELS,
  BankAccountType,
  BeneficiaryKind,
  DEFAULT_ACCOUNTING_CONFIG,
  DEFAULT_AREA_SAFETY,
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_BENEFICIARIES,
  DEFAULT_EMPLOYER_DETAILS,
  DEFAULT_NUMBERING_CONFIG,
  DEFAULT_PAYROLL_CONFIG,
  DEPRECIATION_METHODS_BY_STANDARD,
  DOCUMENT_NUMBER_LABELS,
  DocumentNumberKind,
  DocumentNumberRule,
  FACTORY_AREAS,
  FactoryArea,
  INVENTORY_METHODS_BY_STANDARD,
  PayFrequency,
  VatRateConfig,
  getAreaSafety,
  previewDocumentNumber,
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

type SettingsTab =
  | 'account'
  | 'branding'
  | 'templates'
  | 'pricing'
  | 'stockHolding'
  | 'permissions'
  | 'accounting'
  | 'employer'
  | 'beneficiaries'
  | 'payroll'
  | 'accountingDefaults'
  | 'numbering'
  | 'banks'
  | 'visitorAccess'
  | 'apiAccess'
  | 'access';

const TABS: Array<{ key: SettingsTab; label: string; subtitle: string }> = [
  { key: 'account', label: 'Account', subtitle: 'Your signed-in account and sign out.' },
  { key: 'branding', label: 'Branding', subtitle: 'Letterhead, logo, address, VAT — applied to every printed doc.' },
  { key: 'templates', label: 'Templates', subtitle: 'Default footer copy and payment terms for invoices, delivery notes, and specs.' },
  { key: 'pricing', label: 'Pricing', subtitle: 'Company-wide standard margin used by the calculator when no override is set.' },
  { key: 'stockHolding', label: 'Stock-holding', subtitle: 'Default storage days, review cadence, and agreement wording.' },
  { key: 'permissions', label: 'Permissions', subtitle: 'Per-user view-level access. Replaces the old standalone Permissions page.' },
  { key: 'accounting', label: 'Accounting standard', subtitle: 'Accounting standard (IFRS / US GAAP). Drives depreciation, inventory valuation, and lease treatment defaults.' },
  { key: 'accountingDefaults', label: 'Accounting defaults', subtitle: 'VAT rates, default payment terms, default GL accounts, multi-currency toggle. Like QuickBooks Company Settings.' },
  { key: 'employer', label: 'Employer details', subtitle: 'PAYE / UIF / SDL / COIDA / CIPC reference numbers + SARS filing contact. Auto-fills EMP201, EMP501, UI-19, OID returns.' },
  { key: 'beneficiaries', label: 'Beneficiaries', subtitle: 'Pension / provident funds, medical aids, unions, garnishees — payees of payroll deductions.' },
  { key: 'payroll', label: 'Payroll', subtitle: 'UIF / SDL / PAYE rates, leave entitlements, public holidays, EFT batch format, payslip layout. Like SimplePay Settings.' },
  { key: 'numbering', label: 'Document numbering', subtitle: 'Prefix + next number + padding for invoices, quotes, DNs, POs, job cards, bills, payslips.' },
  { key: 'banks', label: 'Bank accounts', subtitle: 'Company bank accounts used for EFT exports and shown on invoice footers.' },
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
  /** Phase 110.1 — Payroll defaults handler. Writes appSettings.payrollConfig. */
  onSetPayrollConfig?: (config: AppSettingsPayrollConfig) => void;
  /** Phase 110.2 — Accounting defaults handler. Writes appSettings.accountingConfig. */
  onSetAccountingConfig?: (config: AppSettingsAccountingConfig) => void;
  /** Phase 110.3 — Document numbering handler. Writes appSettings.numberingConfig. */
  onSetNumberingConfig?: (config: AppSettingsNumberingConfig) => void;
  /** Phase 110.4 — Bank accounts handler. Writes appSettings.bankAccounts. */
  onSetBankAccounts?: (accounts: AppSettingsBankAccount[]) => void;
  /** Phase 110.6 — Employer details handler. Writes appSettings.employerDetails. */
  onSetEmployerDetails?: (details: AppSettingsEmployerDetails) => void;
  /** Phase 110.7 — Beneficiaries handler. Writes appSettings.beneficiaries. */
  onSetBeneficiaries?: (beneficiaries: AppSettingsBeneficiary[]) => void;
  /** Phase 115 — Brand logos library handler. Writes appSettings.brandLogos. */
  onSetBrandLogos?: (logos: BrandLogo[]) => void;
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
    onSetPayrollConfig, onSetAccountingConfig, onSetNumberingConfig, onSetBankAccounts,
    onSetEmployerDetails, onSetBeneficiaries,
    onSetBrandLogos,
    initialTab, onInitialTabHandled,
  } = props;
  // Phase 110.5 — Tab search box. Empty string = no filter, otherwise we
  // narrow the visible tab strip case-insensitively on label + subtitle.
  const [tabSearch, setTabSearch] = useState('');
  const visibleTabs = useMemo(() => {
    const needle = tabSearch.trim().toLowerCase();
    if (!needle) return TABS;
    return TABS.filter(
      (t) => t.label.toLowerCase().includes(needle) || t.subtitle.toLowerCase().includes(needle),
    );
  }, [tabSearch]);
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
        {/* Phase 110.5 — Settings search. Filters the tab strip by label /
            subtitle as you type. Empty input shows every tab. */}
        <div style={{ marginBottom: '0.75rem' }}>
          <input
            type="search"
            value={tabSearch}
            onChange={(e) => setTabSearch(e.target.value)}
            placeholder="Search settings (e.g. VAT, payroll, leave, bank, invoice)..."
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border, #d8dde3)',
              borderRadius: '0.4rem',
              fontSize: '0.875rem',
            }}
            aria-label="Search settings tabs"
          />
        </div>
        <div className="settings-tabs" role="tablist" aria-label="Settings sections">
          {visibleTabs.map((entry) => (
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
          {visibleTabs.length === 0 ? (
            <span style={{ color: 'var(--muted, #5b6b7a)', fontSize: '0.85rem', padding: '0.5rem' }}>
              No tabs match "{tabSearch}". <button type="button" className="ghost-button" onClick={() => setTabSearch('')}>Clear search</button>
            </span>
          ) : null}
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
            brandLogos={settings.brandLogos ?? []}
            onSetBrandLogos={onSetBrandLogos}
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
        ) : activeTab === 'employer' ? (
          <EmployerDetailsTab
            details={settings.employerDetails ?? DEFAULT_EMPLOYER_DETAILS}
            onChange={onSetEmployerDetails}
          />
        ) : activeTab === 'beneficiaries' ? (
          <BeneficiariesTab
            beneficiaries={settings.beneficiaries ?? DEFAULT_BENEFICIARIES}
            onChange={onSetBeneficiaries}
          />
        ) : activeTab === 'payroll' ? (
          <PayrollTab
            config={settings.payrollConfig ?? DEFAULT_PAYROLL_CONFIG}
            onChange={onSetPayrollConfig}
          />
        ) : activeTab === 'accountingDefaults' ? (
          <AccountingDefaultsTab
            config={settings.accountingConfig ?? DEFAULT_ACCOUNTING_CONFIG}
            onChange={onSetAccountingConfig}
          />
        ) : activeTab === 'numbering' ? (
          <NumberingTab
            config={settings.numberingConfig ?? DEFAULT_NUMBERING_CONFIG}
            onChange={onSetNumberingConfig}
          />
        ) : activeTab === 'banks' ? (
          <BankAccountsTab
            accounts={settings.bankAccounts ?? DEFAULT_BANK_ACCOUNTS}
            onChange={onSetBankAccounts}
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
  /** Phase 115 — Brand logos library. */
  brandLogos?: BrandLogo[];
  onSetBrandLogos?: (logos: BrandLogo[]) => void;
}

function BrandingTab({ company, patchCompany, updatedAt, updatedBy, brandLogos = [], onSetBrandLogos }: BrandingTabProps) {
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
      <BrandLogoLibraryPanel
        brandLogos={brandLogos}
        onSetBrandLogos={onSetBrandLogos}
      />
    </>
  );
}

/* ------------------------- Phase 115 — Brand Logo Library ----------------------- */
/*  Multi-logo manager so the admin can upload more than one mark and pin
 *  each to specific document types. One is always default; everything else
 *  inherits unless explicitly pinned.
 *
 *  Files land in the Supabase 'branding' bucket — same place as the legacy
 *  single logo. We store the public URL on the AppSettings.brandLogos
 *  jsonb column so a single settings save persists the whole library.
 */

interface BrandLogoLibraryPanelProps {
  brandLogos: BrandLogo[];
  onSetBrandLogos?: (logos: BrandLogo[]) => void;
}

function BrandLogoLibraryPanel({ brandLogos, onSetBrandLogos }: BrandLogoLibraryPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !onSetBrandLogos) return;
    setError('');
    setUploading(true);
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png';
      const id = `logo-${Date.now()}`;
      // Unique path per upload so multiple logos can co-exist in the
      // bucket. Cache-buster query on the public URL is unnecessary here.
      const path = `library/${id}.${ext || 'png'}`;
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('branding').getPublicUrl(path);
      const isFirst = brandLogos.length === 0;
      const fresh: BrandLogo = {
        id,
        label: file.name.replace(/\.[^.]+$/, ''),
        url: data.publicUrl,
        isDefault: isFirst, // first one auto-becomes default
        appliesToDocumentTypes: [],
        uploadedAt: new Date().toISOString(),
        uploadedBy: '',
      };
      onSetBrandLogos([...brandLogos, fresh]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setError(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function patchLogo(id: string, patch: Partial<BrandLogo>) {
    onSetBrandLogos?.(brandLogos.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function makeDefault(id: string) {
    onSetBrandLogos?.(brandLogos.map((l) => ({ ...l, isDefault: l.id === id })));
  }

  function removeLogo(id: string) {
    if (!window.confirm('Remove this logo from the library? Documents pinned to it will fall back to the default.')) return;
    const next = brandLogos.filter((l) => l.id !== id);
    // If we removed the default, promote the next one so we always have one.
    if (next.length > 0 && !next.some((l) => l.isDefault)) next[0].isDefault = true;
    onSetBrandLogos?.(next);
  }

  function toggleDocAssignment(id: string, kind: DocumentKind) {
    const logo = brandLogos.find((l) => l.id === id);
    if (!logo) return;
    const current = logo.appliesToDocumentTypes ?? [];
    const next = current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind];
    patchLogo(id, { appliesToDocumentTypes: next });
  }

  return (
    <section style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border, #d8dde3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <p className="eyebrow">Brand logo library</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)' }}>
            Upload more than one mark (e.g. main, FSC-certified, co-branded). One is default — used everywhere unless a logo is pinned to specific documents.
          </p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          <button type="button" className="primary-button" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : '+ Add logo'}
          </button>
        </div>
      </div>

      {error ? <div className="error-pill" style={{ marginBottom: '0.5rem' }}>{error}</div> : null}

      {brandLogos.length === 0 ? (
        <div className="settings-preview-block">
          <p>No logos uploaded yet. Add at least one to use across every document on the dashboard.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {brandLogos.map((logo) => (
            <div
              key={logo.id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '1rem',
                alignItems: 'flex-start',
                padding: '0.75rem 1rem',
                border: logo.isDefault ? '2px solid var(--accent, #1f7a4d)' : '1px solid var(--border, #d8dde3)',
              }}
            >
              <div style={{ background: '#faf4e8', borderRadius: '0.4rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90px' }}>
                <img src={logo.url} alt={logo.label} style={{ maxWidth: '100%', maxHeight: '90px', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    value={logo.label}
                    onChange={(e) => patchLogo(logo.id, { label: e.target.value })}
                    style={{ fontWeight: 500, fontSize: '0.95rem', maxWidth: '320px' }}
                  />
                  {logo.isDefault ? <span className="success-pill" style={{ fontSize: '0.7rem' }}>Default</span> : null}
                </div>
                <details style={{ fontSize: '0.85rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--muted, #5b6b7a)' }}>
                    {logo.appliesToDocumentTypes.length === 0
                      ? 'Applies to: all documents (via default)'
                      : `Pinned to: ${logo.appliesToDocumentTypes.map((k) => DOCUMENT_KIND_LABELS[k]).join(', ')}`}
                  </summary>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {(Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[]).map((kind) => (
                      <label key={kind} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input
                          type="checkbox"
                          checked={logo.appliesToDocumentTypes.includes(kind)}
                          onChange={() => toggleDocAssignment(logo.id, kind)}
                        />
                        <span>{DOCUMENT_KIND_LABELS[kind]}</span>
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted, #5b6b7a)', marginTop: '0.5rem' }}>
                    Tick a document type to use THIS logo on it. Leave all unticked to inherit from the default.
                  </p>
                </details>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {!logo.isDefault ? (
                  <button type="button" className="ghost-button" onClick={() => makeDefault(logo.id)}>Set as default</button>
                ) : null}
                <button type="button" className="ghost-button" style={{ color: 'var(--danger, #c0392b)' }} onClick={() => removeLogo(logo.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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

/* ------------------------------- Payroll tab --------------------------------- */
/*  Phase 110.1 — Payroll defaults. Phase 110.8 — Internal sub-nav.
 *
 *  The Payroll tab is now a single Settings tab that contains its OWN
 *  horizontal sub-tab strip at the top, so the sections sit side-by-side
 *  rather than stacking vertically. Sections:
 *
 *    Pay Frequency · Statutory Rates · Leave · Public Holidays ·
 *    Employee Numbers · Payslip · EFT
 *
 *  Each section reuses the same patch helpers, just renders a subset of
 *  fields. The default sub-tab on first load is "Statutory Rates" since
 *  that's the most consequential block.
 */

type PayrollSubTab = 'frequency' | 'rates' | 'calculations' | 'leave' | 'holidays' | 'numbers' | 'payslip' | 'eft';

const PAYROLL_SUB_TABS: Array<{ key: PayrollSubTab; label: string }> = [
  { key: 'frequency', label: 'Pay Frequency' },
  { key: 'rates', label: 'Statutory Rates' },
  { key: 'calculations', label: 'Calculations' },
  { key: 'leave', label: 'Leave' },
  { key: 'holidays', label: 'Public Holidays' },
  { key: 'numbers', label: 'Employee Numbers' },
  { key: 'payslip', label: 'Payslip' },
  { key: 'eft', label: 'EFT' },
];

interface PayrollTabProps {
  config: AppSettingsPayrollConfig;
  onChange?: (next: AppSettingsPayrollConfig) => void;
}

function PayrollTab({ config, onChange }: PayrollTabProps) {
  function patch(p: Partial<AppSettingsPayrollConfig>) {
    onChange?.({ ...config, ...p });
  }
  function patchHolidays(next: string[]) {
    onChange?.({ ...config, publicHolidays: next });
  }
  const [newHoliday, setNewHoliday] = useState('');
  const [subTab, setSubTab] = useState<PayrollSubTab>('rates');

  return (
    <div className="settings-payroll-tab">
      {/* Internal sub-nav — horizontal scroll on narrow screens. */}
      <div
        role="tablist"
        aria-label="Payroll settings sections"
        style={{
          display: 'flex',
          gap: '0.25rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border, #d8dde3)',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        {PAYROLL_SUB_TABS.map((s) => {
          const isActive = s.key === subTab;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSubTab(s.key)}
              style={{
                padding: '0.4rem 0.8rem',
                background: isActive ? 'var(--accent, #1f7a4d)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text, #1a1a1a)',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent, #1f7a4d)' : 'var(--border, #d8dde3)',
                borderRadius: '0.35rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {subTab === 'frequency' ? (
      <div>
        <p className="eyebrow">Pay frequency</p>
        <div className="form-grid">
          <label>
            <span>Frequency</span>
            <select
              value={config.payFrequency}
              onChange={(e) => patch({ payFrequency: e.target.value as PayFrequency })}
            >
              <option value="monthly">Monthly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          {config.payFrequency === 'monthly' ? (
            <label>
              <span>Pay day of month</span>
              <input
                type="number"
                min={1}
                max={31}
                value={config.payDayOfMonth}
                onChange={(e) => patch({ payDayOfMonth: Number(e.target.value) || 25 })}
              />
            </label>
          ) : null}
        </div>
      </div>
      ) : null}

      {subTab === 'rates' ? (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* UIF + SDL */}
      <div>
        <p className="eyebrow">UIF / SDL</p>
        <div className="form-grid">
          <label>
            <span>UIF employee %</span>
            <input type="number" step="0.1" value={config.uifEmployeePercent} onChange={(e) => patch({ uifEmployeePercent: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>UIF employer %</span>
            <input type="number" step="0.1" value={config.uifEmployerPercent} onChange={(e) => patch({ uifEmployerPercent: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>UIF earnings ceiling (R / month)</span>
            <input type="number" value={config.uifEarningsCeilingMonthly} onChange={(e) => patch({ uifEarningsCeilingMonthly: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>SDL %</span>
            <input type="number" step="0.1" value={config.sdlPercent} onChange={(e) => patch({ sdlPercent: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>SDL exemption (annual payroll under R)</span>
            <input type="number" value={config.sdlExemptionAnnualPayrollUnder} onChange={(e) => patch({ sdlExemptionAnnualPayrollUnder: Number(e.target.value) || 0 })} />
          </label>
        </div>
      </div>

      {/* PAYE rebates */}
      <div>
        <p className="eyebrow">PAYE rebates (annual ZAR)</p>
        <div className="form-grid">
          <label>
            <span>Primary rebate</span>
            <input type="number" value={config.payePrimaryRebateAnnual} onChange={(e) => patch({ payePrimaryRebateAnnual: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Secondary rebate (65+)</span>
            <input type="number" value={config.payeSecondaryRebateAnnual} onChange={(e) => patch({ payeSecondaryRebateAnnual: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Tertiary rebate (75+)</span>
            <input type="number" value={config.payeTertiaryRebateAnnual} onChange={(e) => patch({ payeTertiaryRebateAnnual: Number(e.target.value) || 0 })} />
          </label>
        </div>
      </div>
      </div>
      ) : null}

      {subTab === 'calculations' ? (
        <PayrollCalculationsBlock
          calculations={config.calculations ?? DEFAULT_PAYROLL_CALCULATIONS}
          onChange={(next) => patch({ calculations: next })}
        />
      ) : null}

      {subTab === 'leave' ? (
      <div>
        <p className="eyebrow">Leave entitlements (BCEA defaults)</p>
        <div className="form-grid">
          <label>
            <span>Annual leave days / year</span>
            <input type="number" value={config.annualLeaveDaysPerYear} onChange={(e) => patch({ annualLeaveDaysPerYear: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Sick leave days / cycle</span>
            <input type="number" value={config.sickLeaveDaysPerCycle} onChange={(e) => patch({ sickLeaveDaysPerCycle: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Sick leave cycle (months)</span>
            <input type="number" value={config.sickLeaveCycleMonths} onChange={(e) => patch({ sickLeaveCycleMonths: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Family responsibility days / year</span>
            <input type="number" value={config.familyResponsibilityDaysPerYear} onChange={(e) => patch({ familyResponsibilityDaysPerYear: Number(e.target.value) || 0 })} />
          </label>
        </div>
      </div>
      ) : null}

      {subTab === 'holidays' ? (
      <div>
        <p className="eyebrow">Public holidays</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {config.publicHolidays.length === 0 ? (
            <span style={{ color: 'var(--muted, #5b6b7a)', fontSize: '0.85rem' }}>
              No public holidays set.
            </span>
          ) : null}
          {config.publicHolidays.map((iso) => (
            <span
              key={iso}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.6rem',
                background: 'var(--accent-bg, #f0f8f3)',
                border: '1px solid var(--border, #d8dde3)',
                borderRadius: '0.35rem',
                fontSize: '0.85rem',
              }}
            >
              {new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              <button
                type="button"
                onClick={() => patchHolidays(config.publicHolidays.filter((d) => d !== iso))}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger, #c0392b)' }}
                aria-label={`Remove ${iso}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} />
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              if (newHoliday && !config.publicHolidays.includes(newHoliday)) {
                patchHolidays([...config.publicHolidays, newHoliday].sort());
                setNewHoliday('');
              }
            }}
          >
            Add holiday
          </button>
        </div>
      </div>
      ) : null}

      {subTab === 'numbers' ? (
      <div>
        <p className="eyebrow">Employee number format</p>
        <div className="form-grid">
          <label>
            <span>Prefix</span>
            <input value={config.employeeNumberPrefix} onChange={(e) => patch({ employeeNumberPrefix: e.target.value })} />
          </label>
          <label>
            <span>Next sequence</span>
            <input type="number" value={config.employeeNumberNextSeq} onChange={(e) => patch({ employeeNumberNextSeq: Number(e.target.value) || 1 })} />
          </label>
          <label>
            <span>Padding</span>
            <input type="number" value={config.employeeNumberPadding} onChange={(e) => patch({ employeeNumberPadding: Number(e.target.value) || 4 })} />
          </label>
          <label>
            <span>Preview</span>
            <input
              value={`${config.employeeNumberPrefix}${String(config.employeeNumberNextSeq).padStart(config.employeeNumberPadding, '0')}`}
              readOnly
              style={{ background: 'var(--accent-bg, #f0f8f3)' }}
            />
          </label>
        </div>
      </div>
      ) : null}

      {subTab === 'payslip' ? (
      <div>
        <p className="eyebrow">Payslip layout</p>
        <div className="form-grid">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={config.payslipShowYtd} onChange={(e) => patch({ payslipShowYtd: e.target.checked })} />
            <span>Show year-to-date totals</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={config.payslipShowLeaveBalance} onChange={(e) => patch({ payslipShowLeaveBalance: e.target.checked })} />
            <span>Show leave balance</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={config.payslipShowLoanBalance} onChange={(e) => patch({ payslipShowLoanBalance: e.target.checked })} />
            <span>Show loan balance</span>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span>Payslip footer note</span>
            <textarea rows={2} value={config.payslipFooterNote} onChange={(e) => patch({ payslipFooterNote: e.target.value })} />
          </label>
        </div>
      </div>
      ) : null}

      {subTab === 'eft' ? (
      <div>
        <p className="eyebrow">EFT batch</p>
        <div className="form-grid">
          <label>
            <span>Batch format</span>
            <select
              value={config.eftBatchFormat}
              onChange={(e) => patch({ eftBatchFormat: e.target.value as AppSettingsPayrollConfig['eftBatchFormat'] })}
            >
              <option value="Generic CSV">Generic CSV</option>
              <option value="ACB">ACB (.acb)</option>
              <option value="ABSA">ABSA</option>
              <option value="FNB">FNB</option>
              <option value="Standard Bank">Standard Bank</option>
            </select>
          </label>
          <label>
            <span>CC emails on EFT batch (comma-separated)</span>
            <input value={config.eftBatchSendCcEmails} onChange={(e) => patch({ eftBatchSendCcEmails: e.target.value })} />
          </label>
        </div>
      </div>
      ) : null}
    </div>
  );
}

/* ------------------------ Payroll Calculations block ------------------------ */
/*  Phase 110.9 — Payroll Calculations.
 *
 *  Sits inside the Payroll tab as the "Calculations" sub-tab. Mirrors
 *  SimplePay's "Payroll Calculations" dropdown, grouping the computation
 *  rules into one block: how Sundays + public holidays are paid, BCEA
 *  termination notice periods, leave-pay averaging basis, ETI enablement,
 *  garnishee caps, SDL auto-exemption, Cost-to-Company composition, and
 *  the pro-rata method when employees join/leave mid-month.
 */

interface PayrollCalculationsBlockProps {
  calculations: PayrollCalculationsConfig;
  onChange: (next: PayrollCalculationsConfig) => void;
}

function PayrollCalculationsBlock({ calculations, onChange }: PayrollCalculationsBlockProps) {
  function patch(p: Partial<PayrollCalculationsConfig>) {
    onChange({ ...calculations, ...p });
  }
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <p className="eyebrow">Basic Pay (Sundays & Public Holidays)</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          BCEA defaults: Sundays at 1.5×, public holidays at 2× normal rate.
        </p>
        <div className="form-grid">
          <label>
            <span>Sunday rate multiplier</span>
            <input type="number" step="0.1" value={calculations.sundayRateMultiplier} onChange={(e) => patch({ sundayRateMultiplier: Number(e.target.value) || 1 })} />
          </label>
          <label>
            <span>Public holiday rate multiplier</span>
            <input type="number" step="0.1" value={calculations.publicHolidayRateMultiplier} onChange={(e) => patch({ publicHolidayRateMultiplier: Number(e.target.value) || 1 })} />
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">Termination preferences (BCEA notice)</p>
        <div className="form-grid">
          <label>
            <span>Under 6 months: notice days</span>
            <input type="number" value={calculations.terminationNoticeDaysUnder6Months} onChange={(e) => patch({ terminationNoticeDaysUnder6Months: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>6 months – 1 year: notice days</span>
            <input type="number" value={calculations.terminationNoticeDays6MonthsTo1Year} onChange={(e) => patch({ terminationNoticeDays6MonthsTo1Year: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Over 1 year: notice days</span>
            <input type="number" value={calculations.terminationNoticeDaysOver1Year} onChange={(e) => patch({ terminationNoticeDaysOver1Year: Number(e.target.value) || 0 })} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={calculations.payTerminationLeaveInLieu} onChange={(e) => patch({ payTerminationLeaveInLieu: e.target.checked })} />
            <span>Pay accrued leave at termination</span>
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">BCEA leave pay basis</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          Which days does paid leave average over? Section 21 of the BCEA permits last 13 weeks (default), last 4 weeks, or a monthly average.
        </p>
        <div className="form-grid">
          <label>
            <span>Method</span>
            <select value={calculations.leavePayBasis} onChange={(e) => patch({ leavePayBasis: e.target.value as PayrollCalculationsConfig['leavePayBasis'] })}>
              <option value="last13Weeks">Last 13 weeks (BCEA default)</option>
              <option value="last4Weeks">Last 4 weeks</option>
              <option value="monthlyAverage">Monthly average</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">ETI (Employment Tax Incentive)</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          Youth wage subsidy for employees aged 18–29 earning below the threshold. Reduces your monthly PAYE liability.
        </p>
        <div className="form-grid">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={calculations.etiEnabled} onChange={(e) => patch({ etiEnabled: e.target.checked })} />
            <span>Claim ETI on eligible employees</span>
          </label>
          <label>
            <span>Minimum wage threshold (R / month)</span>
            <input type="number" value={calculations.etiMinimumWageMonthly} onChange={(e) => patch({ etiMinimumWageMonthly: Number(e.target.value) || 0 })} />
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">Garnishees (emolument attachment orders)</p>
        <div className="form-grid">
          <label>
            <span>Max % of net salary garnishable</span>
            <input type="number" step="0.5" value={calculations.garnisheeMaxPercentOfNet} onChange={(e) => patch({ garnisheeMaxPercentOfNet: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Admin fee % retained</span>
            <input type="number" step="0.5" value={calculations.garnisheeAdminFeePercent} onChange={(e) => patch({ garnisheeAdminFeePercent: Number(e.target.value) || 0 })} />
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">SDL (Skills Development Levy)</p>
        <div className="form-grid">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={calculations.sdlAutoExemptionCheck} onChange={(e) => patch({ sdlAutoExemptionCheck: e.target.checked })} />
            <span>Auto-detect SDL exemption (annual payroll under threshold)</span>
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">Cost to Company</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          Which employer contributions get bundled into the CTC figure shown on offer letters?
        </p>
        <div className="form-grid">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={calculations.ctcIncludesUif} onChange={(e) => patch({ ctcIncludesUif: e.target.checked })} />
            <span>Include employer UIF</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={calculations.ctcIncludesSdl} onChange={(e) => patch({ ctcIncludesSdl: e.target.checked })} />
            <span>Include SDL</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={calculations.ctcIncludesPension} onChange={(e) => patch({ ctcIncludesPension: e.target.checked })} />
            <span>Include employer pension contribution</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={calculations.ctcIncludesMedicalAid} onChange={(e) => patch({ ctcIncludesMedicalAid: e.target.checked })} />
            <span>Include employer medical aid contribution</span>
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">Pro-rata method</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          How is pay split when an employee joins or leaves mid-month?
        </p>
        <div className="form-grid">
          <label>
            <span>Method</span>
            <select value={calculations.proRataMethod} onChange={(e) => patch({ proRataMethod: e.target.value as PayrollCalculationsConfig['proRataMethod'] })}>
              <option value="calendarDays">Calendar days (recommended)</option>
              <option value="workingDays">Working days (Mon–Fri)</option>
              <option value="fixed22Days">Fixed 22 days / month</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Employer Details tab -------------------------- */
/*  Phase 110.6 — Employer Details + SARS Filing.
 *
 *  Captures every reference number the business holds with SARS / DoL / FSCA.
 *  The numbers feed into auto-fills on EMP201 (monthly PAYE/UIF/SDL),
 *  EMP501 (bi-annual reconciliation), UI-19, and OID return forms.
 *
 *  The filing contact + backup contact are who SARS will phone if a return
 *  goes missing — keeping them current here saves a fire drill later.
 */

interface EmployerDetailsTabProps {
  details: AppSettingsEmployerDetails;
  onChange?: (next: AppSettingsEmployerDetails) => void;
}

function EmployerDetailsTab({ details, onChange }: EmployerDetailsTabProps) {
  function patch(p: Partial<AppSettingsEmployerDetails>) {
    onChange?.({ ...details, ...p });
  }
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <p className="eyebrow">SARS references</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          Reference numbers SARS issues to your business. Each one appears on a specific filing — getting them right here means the dashboard auto-fills every return.
        </p>
        <div className="form-grid">
          <label>
            <span>Income tax reference</span>
            <input value={details.incomeTaxReference} onChange={(e) => patch({ incomeTaxReference: e.target.value })} placeholder="10-digit" />
          </label>
          <label>
            <span>PAYE reference</span>
            <input value={details.payeReference} onChange={(e) => patch({ payeReference: e.target.value })} placeholder="Starts with 7..." />
          </label>
          <label>
            <span>UIF reference (SARS)</span>
            <input value={details.uifReference} onChange={(e) => patch({ uifReference: e.target.value })} placeholder="U..." />
          </label>
          <label>
            <span>SDL reference</span>
            <input value={details.sdlReference} onChange={(e) => patch({ sdlReference: e.target.value })} placeholder="Starts with L..." />
          </label>
          <label>
            <span>EMP201 trading name</span>
            <input value={details.emp201TradingName} onChange={(e) => patch({ emp201TradingName: e.target.value })} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={details.isSmallBusinessCorporation} onChange={(e) => patch({ isSmallBusinessCorporation: e.target.checked })} />
            <span>Small Business Corporation (SBC tax rates)</span>
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">Labour / COIDA / SETA</p>
        <div className="form-grid">
          <label>
            <span>UIF DoL reference (UI-19)</span>
            <input value={details.uifDolReference} onChange={(e) => patch({ uifDolReference: e.target.value })} />
          </label>
          <label>
            <span>COIDA / WCC registration number</span>
            <input value={details.coidaReference} onChange={(e) => patch({ coidaReference: e.target.value })} />
          </label>
          <label>
            <span>WCC industry classification code</span>
            <input value={details.wcCommissionerCode} onChange={(e) => patch({ wcCommissionerCode: e.target.value })} />
          </label>
          <label>
            <span>SETA (WSP/ATR)</span>
            <input value={details.setaCode} onChange={(e) => patch({ setaCode: e.target.value })} placeholder="FP&M SETA" />
          </label>
          <label>
            <span>CIPC registration number</span>
            <input value={details.cipcRegistrationNumber} onChange={(e) => patch({ cipcRegistrationNumber: e.target.value })} placeholder="2023/123456/07" />
          </label>
          <label>
            <span>Employer registration date</span>
            <input type="date" value={details.employerRegistrationDate} onChange={(e) => patch({ employerRegistrationDate: e.target.value })} />
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">Filing contact</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          The person SARS will phone when a return is late or queried.
        </p>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input value={details.filingContactName} onChange={(e) => patch({ filingContactName: e.target.value })} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={details.filingContactEmail} onChange={(e) => patch({ filingContactEmail: e.target.value })} />
          </label>
          <label>
            <span>Phone</span>
            <input type="tel" value={details.filingContactPhone} onChange={(e) => patch({ filingContactPhone: e.target.value })} />
          </label>
          <label>
            <span>Backup contact name</span>
            <input value={details.backupContactName} onChange={(e) => patch({ backupContactName: e.target.value })} />
          </label>
          <label>
            <span>Backup contact email</span>
            <input type="email" value={details.backupContactEmail} onChange={(e) => patch({ backupContactEmail: e.target.value })} />
          </label>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Beneficiaries tab ---------------------------- */
/*  Phase 110.7 — Beneficiaries.
 *
 *  Pension / provident funds, medical aids, unions, garnishees. Each holds
 *  the registration number + bank details so the payroll EFT batch can pay
 *  the deduction straight through to the right payee.
 *
 *  IRP5 code defaults to the SARS-issued tax certificate code for that
 *  contribution type (e.g. 4001 for pension, 4474 for medical aid employer
 *  contribution). Editing the code reflects on the employee's IRP5.
 */

interface BeneficiariesTabProps {
  beneficiaries: AppSettingsBeneficiary[];
  onChange?: (next: AppSettingsBeneficiary[]) => void;
}

function BeneficiariesTab({ beneficiaries, onChange }: BeneficiariesTabProps) {
  function patch(id: string, p: Partial<AppSettingsBeneficiary>) {
    onChange?.(beneficiaries.map((b) => (b.id === id ? { ...b, ...p } : b)));
  }
  function add() {
    const fresh: AppSettingsBeneficiary = {
      id: `ben-${Date.now()}`,
      kind: 'pension',
      name: 'New beneficiary',
      registrationNumber: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      bankName: '',
      branchCode: '',
      accountNumber: '',
      accountType: 'cheque',
      irp5Code: '',
      paymentReferencePrefix: '',
      active: true,
      notes: '',
    };
    onChange?.([...beneficiaries, fresh]);
  }
  function remove(id: string) {
    onChange?.(beneficiaries.filter((b) => b.id !== id));
  }

  return (
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted, #5b6b7a)' }}>
        Third parties who receive money on behalf of employees — pension and
        provident funds, medical aids, unions, garnishees. The payroll EFT
        batch pays the deduction line straight to the beneficiary's bank.
      </p>
      {beneficiaries.length === 0 ? (
        <div className="settings-preview-block" style={{ marginBottom: '1rem' }}>
          <p className="eyebrow">No beneficiaries yet</p>
          <p>Add your pension fund, medical aid, or union so payroll deductions know where to pay.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="card"
              style={{
                padding: '0.75rem 1rem',
                border: b.active ? '1px solid var(--border, #d8dde3)' : '1px solid var(--border, #d8dde3)',
                opacity: b.active ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <strong>{b.name || 'Unnamed'}</strong>{' '}
                  <span style={{ color: 'var(--muted, #5b6b7a)', fontSize: '0.85rem' }}>· {BENEFICIARY_KIND_LABELS[b.kind]}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                    <input type="checkbox" checked={b.active} onChange={(e) => patch(b.id, { active: e.target.checked })} />
                    Active
                  </label>
                  <button type="button" className="ghost-button" onClick={() => remove(b.id)} style={{ color: 'var(--danger, #c0392b)' }}>Remove</button>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  <span>Kind</span>
                  <select value={b.kind} onChange={(e) => patch(b.id, { kind: e.target.value as BeneficiaryKind })}>
                    {(Object.keys(BENEFICIARY_KIND_LABELS) as BeneficiaryKind[]).map((k) => (
                      <option key={k} value={k}>{BENEFICIARY_KIND_LABELS[k]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Name</span>
                  <input value={b.name} onChange={(e) => patch(b.id, { name: e.target.value })} />
                </label>
                <label>
                  <span>Registration number</span>
                  <input value={b.registrationNumber} onChange={(e) => patch(b.id, { registrationNumber: e.target.value })} placeholder="FSCA / CMS / Court ref" />
                </label>
                <label>
                  <span>IRP5 source code</span>
                  <input value={b.irp5Code} onChange={(e) => patch(b.id, { irp5Code: e.target.value })} placeholder="4001 / 4474 / ..." />
                </label>
                <label>
                  <span>Contact name</span>
                  <input value={b.contactName} onChange={(e) => patch(b.id, { contactName: e.target.value })} />
                </label>
                <label>
                  <span>Contact email</span>
                  <input type="email" value={b.contactEmail} onChange={(e) => patch(b.id, { contactEmail: e.target.value })} />
                </label>
                <label>
                  <span>Contact phone</span>
                  <input type="tel" value={b.contactPhone} onChange={(e) => patch(b.id, { contactPhone: e.target.value })} />
                </label>
                <label>
                  <span>Bank</span>
                  <input value={b.bankName} onChange={(e) => patch(b.id, { bankName: e.target.value })} />
                </label>
                <label>
                  <span>Branch code</span>
                  <input value={b.branchCode} onChange={(e) => patch(b.id, { branchCode: e.target.value })} />
                </label>
                <label>
                  <span>Account number</span>
                  <input value={b.accountNumber} onChange={(e) => patch(b.id, { accountNumber: e.target.value })} />
                </label>
                <label>
                  <span>Account type</span>
                  <select value={b.accountType} onChange={(e) => patch(b.id, { accountType: e.target.value as BankAccountType })}>
                    {(Object.keys(BANK_ACCOUNT_TYPE_LABELS) as BankAccountType[]).map((t) => (
                      <option key={t} value={t}>{BANK_ACCOUNT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Payment reference prefix</span>
                  <input value={b.paymentReferencePrefix} onChange={(e) => patch(b.id, { paymentReferencePrefix: e.target.value })} placeholder="e.g. JOMOPAK-" />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Notes</span>
                  <input value={b.notes} onChange={(e) => patch(b.id, { notes: e.target.value })} />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="ghost-button" onClick={add} style={{ marginTop: '0.75rem' }}>
        + Add beneficiary
      </button>
    </div>
  );
}

/* -------------------------- Accounting defaults tab -------------------------- */
/*  Phase 110.2 — Bookkeeping defaults.
 *
 *  VAT rates, default payment terms, default GL accounts for quick capture,
 *  multi-currency toggle, rounding mode. Together these mirror QuickBooks'
 *  Company Settings → Advanced + Sales sections.
 */

interface AccountingDefaultsTabProps {
  config: AppSettingsAccountingConfig;
  onChange?: (next: AppSettingsAccountingConfig) => void;
}

function AccountingDefaultsTab({ config, onChange }: AccountingDefaultsTabProps) {
  function patch(p: Partial<AppSettingsAccountingConfig>) {
    onChange?.({ ...config, ...p });
  }
  function patchVat(id: string, p: Partial<VatRateConfig>) {
    onChange?.({
      ...config,
      vatRates: config.vatRates.map((r) => (r.id === id ? { ...r, ...p } : r)),
    });
  }
  function addVat() {
    const fresh: VatRateConfig = {
      id: `vat-${Date.now()}`,
      code: 'NEW',
      label: 'New VAT rate',
      ratePercent: 0,
      isDefault: false,
      active: true,
    };
    onChange?.({ ...config, vatRates: [...config.vatRates, fresh] });
  }
  function removeVat(id: string) {
    onChange?.({ ...config, vatRates: config.vatRates.filter((r) => r.id !== id) });
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Fiscal year */}
      <div>
        <p className="eyebrow">Fiscal year end</p>
        <div className="form-grid">
          <label>
            <span>Month</span>
            <select value={config.fiscalYearEndMonth} onChange={(e) => patch({ fiscalYearEndMonth: Number(e.target.value) })}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString('en-ZA', { month: 'long' })}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Day</span>
            <input type="number" min={1} max={31} value={config.fiscalYearEndDay} onChange={(e) => patch({ fiscalYearEndDay: Number(e.target.value) || 28 })} />
          </label>
        </div>
      </div>

      {/* VAT rates */}
      <div>
        <p className="eyebrow">VAT rates</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th align="left">Code</th>
              <th align="left">Label</th>
              <th align="right">Rate %</th>
              <th align="center">Default</th>
              <th align="center">Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {config.vatRates.map((r) => (
              <tr key={r.id}>
                <td><input value={r.code} onChange={(e) => patchVat(r.id, { code: e.target.value })} style={{ width: '4rem' }} /></td>
                <td><input value={r.label} onChange={(e) => patchVat(r.id, { label: e.target.value })} /></td>
                <td align="right"><input type="number" step="0.5" style={{ width: '4rem' }} value={r.ratePercent} onChange={(e) => patchVat(r.id, { ratePercent: Number(e.target.value) || 0 })} /></td>
                <td align="center">
                  <input
                    type="radio"
                    name="vat-default"
                    checked={r.isDefault}
                    onChange={() => {
                      onChange?.({
                        ...config,
                        vatRates: config.vatRates.map((v) => ({ ...v, isDefault: v.id === r.id })),
                      });
                    }}
                  />
                </td>
                <td align="center">
                  <input type="checkbox" checked={r.active} onChange={(e) => patchVat(r.id, { active: e.target.checked })} />
                </td>
                <td align="right">
                  <button type="button" className="ghost-button" onClick={() => removeVat(r.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="ghost-button" onClick={addVat} style={{ marginTop: '0.5rem' }}>
          + Add VAT rate
        </button>
      </div>

      {/* Payment terms */}
      <div>
        <p className="eyebrow">Default payment terms</p>
        <div className="form-grid">
          <label>
            <span>Term days (Net)</span>
            <input type="number" value={config.defaultPaymentTermDays} onChange={(e) => patch({ defaultPaymentTermDays: Number(e.target.value) || 0 })} />
          </label>
          <label>
            <span>Display label</span>
            <input value={config.defaultPaymentTermLabel} onChange={(e) => patch({ defaultPaymentTermLabel: e.target.value })} />
          </label>
        </div>
      </div>

      {/* Default GL accounts */}
      <div>
        <p className="eyebrow">Default GL accounts</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)', marginTop: 0 }}>
          Used when quick-capture flows need an account but the user hasn't picked one. Codes refer to the Chart of Accounts.
        </p>
        <div className="form-grid">
          <label>
            <span>Retained earnings account</span>
            <input value={config.retainedEarningsAccountCode} onChange={(e) => patch({ retainedEarningsAccountCode: e.target.value })} />
          </label>
          <label>
            <span>Default sales account</span>
            <input value={config.defaultSalesAccountCode} onChange={(e) => patch({ defaultSalesAccountCode: e.target.value })} />
          </label>
          <label>
            <span>Default purchase account</span>
            <input value={config.defaultPurchaseAccountCode} onChange={(e) => patch({ defaultPurchaseAccountCode: e.target.value })} />
          </label>
          <label>
            <span>Default bank account</span>
            <input value={config.defaultBankAccountCode} onChange={(e) => patch({ defaultBankAccountCode: e.target.value })} />
          </label>
        </div>
      </div>

      {/* Behaviour toggles */}
      <div>
        <p className="eyebrow">Behaviour</p>
        <div className="form-grid">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={config.autoPostInvoicesToGl} onChange={(e) => patch({ autoPostInvoicesToGl: e.target.checked })} />
            <span>Auto-post invoices to GL</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={config.autoPostBillsToGl} onChange={(e) => patch({ autoPostBillsToGl: e.target.checked })} />
            <span>Auto-post supplier bills to GL</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={config.enableMultiCurrency} onChange={(e) => patch({ enableMultiCurrency: e.target.checked })} />
            <span>Enable multi-currency</span>
          </label>
          <label>
            <span>Rounding mode</span>
            <select
              value={config.roundingMode}
              onChange={(e) => patch({ roundingMode: e.target.value as AppSettingsAccountingConfig['roundingMode'] })}
            >
              <option value="nearest">Nearest cent</option>
              <option value="up">Round up</option>
              <option value="down">Round down</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Doc numbering tab ------------------------------ */
/*  Phase 110.3 — Document numbering rules.
 *
 *  Each doc kind gets a prefix, padding, and next sequence number. The
 *  preview shows what the next saved doc would be numbered. Admin can also
 *  bump the next sequence (e.g. "next invoice should be INV-00500" to skip
 *  legacy numbers).
 */

interface NumberingTabProps {
  config: AppSettingsNumberingConfig;
  onChange?: (next: AppSettingsNumberingConfig) => void;
}

function NumberingTab({ config, onChange }: NumberingTabProps) {
  function patchRule(kind: DocumentNumberKind, p: Partial<DocumentNumberRule>) {
    onChange?.({ ...config, [kind]: { ...config[kind], ...p } });
  }
  const kinds: DocumentNumberKind[] = ['invoice', 'quote', 'deliveryNote', 'purchaseOrder', 'jobCard', 'supplierBill', 'creditNote', 'payslip'];
  return (
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted, #5b6b7a)' }}>
        Each document kind has its own numbering rule. Change the prefix or
        bump the sequence to skip past legacy numbers. The preview shows what
        the next saved document will be numbered.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginTop: '0.5rem' }}>
        <thead>
          <tr>
            <th align="left">Document</th>
            <th align="left">Prefix</th>
            <th align="right">Next #</th>
            <th align="right">Pad</th>
            <th align="center">Date prefix</th>
            <th align="center">Reset yearly</th>
            <th align="left">Preview</th>
          </tr>
        </thead>
        <tbody>
          {kinds.map((kind) => {
            const rule = config[kind];
            return (
              <tr key={kind}>
                <td><strong>{DOCUMENT_NUMBER_LABELS[kind]}</strong></td>
                <td><input value={rule.prefix} onChange={(e) => patchRule(kind, { prefix: e.target.value })} style={{ width: '5rem' }} /></td>
                <td align="right"><input type="number" value={rule.nextSeq} onChange={(e) => patchRule(kind, { nextSeq: Number(e.target.value) || 1 })} style={{ width: '6rem' }} /></td>
                <td align="right"><input type="number" value={rule.padding} onChange={(e) => patchRule(kind, { padding: Number(e.target.value) || 4 })} style={{ width: '4rem' }} /></td>
                <td align="center"><input type="checkbox" checked={rule.includeDate} onChange={(e) => patchRule(kind, { includeDate: e.target.checked })} /></td>
                <td align="center"><input type="checkbox" checked={rule.resetAnnually} onChange={(e) => patchRule(kind, { resetAnnually: e.target.checked })} /></td>
                <td>
                  <code style={{ padding: '0.2rem 0.4rem', background: 'var(--accent-bg, #f0f8f3)', borderRadius: '0.3rem', fontSize: '0.8rem' }}>
                    {previewDocumentNumber(rule)}
                  </code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- Bank accounts tab ----------------------------- */
/*  Phase 110.4 — Company bank accounts.
 *
 *  One account is marked primary (shown on invoice footers by default).
 *  Each account knows its GL code so bank reconciliation can route imported
 *  transactions to the right ledger. Card/savings/cheque distinguished for
 *  EFT batch generation.
 */

interface BankAccountsTabProps {
  accounts: AppSettingsBankAccount[];
  onChange?: (next: AppSettingsBankAccount[]) => void;
}

function BankAccountsTab({ accounts, onChange }: BankAccountsTabProps) {
  function patch(id: string, p: Partial<AppSettingsBankAccount>) {
    onChange?.(accounts.map((a) => (a.id === id ? { ...a, ...p } : a)));
  }
  function add() {
    const fresh: AppSettingsBankAccount = {
      id: `bank-${Date.now()}`,
      accountName: 'New account',
      bankName: '',
      branchCode: '',
      accountNumber: '',
      accountType: 'cheque',
      isPrimary: accounts.length === 0,
      showOnInvoice: accounts.length === 0,
    };
    onChange?.([...accounts, fresh]);
  }
  function remove(id: string) {
    onChange?.(accounts.filter((a) => a.id !== id));
  }
  function setPrimary(id: string) {
    onChange?.(accounts.map((a) => ({ ...a, isPrimary: a.id === id })));
  }

  return (
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted, #5b6b7a)' }}>
        Bank accounts used for EFT salary payments and shown on invoice
        footers. The primary account is the default on printed invoices.
      </p>
      {accounts.length === 0 ? (
        <div className="settings-preview-block" style={{ marginBottom: '1rem' }}>
          <p className="eyebrow">No bank accounts yet</p>
          <p>Add your business bank account so it appears on invoice footers and EFT exports.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {accounts.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{
                padding: '0.75rem 1rem',
                border: a.isPrimary ? '2px solid var(--accent, #1f7a4d)' : '1px solid var(--border, #d8dde3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{a.accountName || 'Unnamed account'}</strong>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {a.isPrimary ? <span className="success-pill">Primary</span> : (
                    <button type="button" className="ghost-button" onClick={() => setPrimary(a.id)}>Make primary</button>
                  )}
                  <button type="button" className="ghost-button" onClick={() => remove(a.id)} style={{ color: 'var(--danger, #c0392b)' }}>Remove</button>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  <span>Account name</span>
                  <input value={a.accountName} onChange={(e) => patch(a.id, { accountName: e.target.value })} />
                </label>
                <label>
                  <span>Bank</span>
                  <input value={a.bankName} onChange={(e) => patch(a.id, { bankName: e.target.value })} />
                </label>
                <label>
                  <span>Branch code</span>
                  <input value={a.branchCode} onChange={(e) => patch(a.id, { branchCode: e.target.value })} />
                </label>
                <label>
                  <span>Account number</span>
                  <input value={a.accountNumber} onChange={(e) => patch(a.id, { accountNumber: e.target.value })} />
                </label>
                <label>
                  <span>Account type</span>
                  <select value={a.accountType} onChange={(e) => patch(a.id, { accountType: e.target.value as BankAccountType })}>
                    {(Object.keys(BANK_ACCOUNT_TYPE_LABELS) as BankAccountType[]).map((t) => (
                      <option key={t} value={t}>{BANK_ACCOUNT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>GL account code</span>
                  <input value={a.glAccountCode ?? ''} onChange={(e) => patch(a.id, { glAccountCode: e.target.value })} placeholder="1100" />
                </label>
                <label>
                  <span>SWIFT code (foreign payments)</span>
                  <input value={a.swiftCode ?? ''} onChange={(e) => patch(a.id, { swiftCode: e.target.value })} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={a.showOnInvoice} onChange={(e) => patch(a.id, { showOnInvoice: e.target.checked })} />
                  <span>Show on invoice footers</span>
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Notes</span>
                  <input value={a.notes ?? ''} onChange={(e) => patch(a.id, { notes: e.target.value })} />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="ghost-button" onClick={add} style={{ marginTop: '0.75rem' }}>
        + Add bank account
      </button>
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
