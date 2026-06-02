import { useEffect, useMemo, useState } from 'react';
import { CommercialFlags, isClientOverCredit } from '../../components/Badge';
import { EditFormGuard } from '../../components/EditFormGuard';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { QuickAddCard } from '../../components/QuickAddCard';
import { SectionTitle } from '../../components/SectionTitle';
import { BrandLogo, Client, ClientFilters, ClientFormState, CUSTOMER_PAYMENT_MODEL_LABELS, CustomerDeposit, CustomerPaymentModel, DeliveryNote, DispatchRecord, Invoice, PricingTier } from '../../types';
import { formatNumber } from '../../utils/calculations';
import { describePipelinePosition, summarisePipeline } from '../../utils/jobPipeline';
import { formatDaysFriendly, summariseClientStockHolding } from '../../utils/stockHolding';

interface ClientsPageProps {
  staffOptions: string[];
  pricingTiers: PricingTier[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  dispatchRecords: DispatchRecord[];
  onCreateDeliveryNote: (client: Client) => void;
  onViewDeliveryNotes: (client: Client) => void;
  onOpenDeliveryNote?: (note: DeliveryNote) => void;
  /** Phase 67 — customer-stock releases on the client profile. */
  customerStockReleases?: Array<{ id: string; releaseNumber: string; releaseDate: string; clientId: string; clientName: string; quantityReleased?: number; quantityUnit?: string }>;
  onCreateRelease?: (client: Client) => void;
  onViewReleases?: (client: Client) => void;
  /** Phase 62.5 — Tooling (dies + stereos) owned by clients. */
  tooling?: Array<{ id: string; code: string; name: string; toolType: 'die' | 'stereo'; clientId: string; status: string; active: boolean }>;
  onViewToolingForClient?: (client: Client, toolType: 'die' | 'stereo') => void;
  clientForm: ClientFormState;
  setClientForm: (value: ClientFormState) => void;
  clientEditingId: string | null;
  clientMessage: string;
  onSave: () => void;
  onReset: () => void;
  clientFilters: ClientFilters;
  setClientFilters: (value: ClientFilters) => void;
  filteredClients: Client[];
  onEdit: (client: Client) => void;
  /** Current authed user — used for the edit-lock presence banner. */
  currentUser?: { id?: string; name?: string };
  /** Phase 58 — unified Companies for the linker. Pass an empty array if
   *  the parent doesn't track them; the picker just hides itself. */
  companies?: { id: string; name: string; roles?: string[] }[];
  /** Spin up a new Company pre-filled with this client's shared fields. */
  onConvertToCompany?: (clientId: string) => void;
  /** Phase 94 — Live job pipeline widget. Pass the full job list so the
   *  client profile can show every open job for this client with its
   *  current production stage + any blockers. */
  jobs?: Array<{ id: string; jobNumber: string; clientId: string; productName: string; pipelineStages?: import('../../types').PipelineStage[] }>;
  onOpenJob?: (jobId: string) => void;
  /** Phase 116 — Brand logo library for the per-client logo picker. The
   *  Client form lets the admin pin a specific logo to this client; all
   *  customer-facing documents for this client then use it. */
  brandLogos?: BrandLogo[];
  /** Phase 119.7 — Customer deposits, so the client register can show
   *  "they have R X in unallocated deposit balance" inline. */
  customerDeposits?: CustomerDeposit[];
}

export function ClientsPage({
  staffOptions,
  pricingTiers,
  invoices,
  deliveryNotes,
  dispatchRecords,
  onCreateDeliveryNote,
  onViewDeliveryNotes,
  onOpenDeliveryNote,
  customerStockReleases = [],
  onCreateRelease,
  onViewReleases,
  tooling = [],
  onViewToolingForClient,
  clientForm,
  setClientForm,
  clientEditingId,
  clientMessage,
  onSave,
  onReset,
  clientFilters,
  setClientFilters,
  filteredClients,
  onEdit,
  currentUser,
  companies = [],
  onConvertToCompany,
  jobs = [],
  onOpenJob,
  brandLogos = [],
  customerDeposits = [],
}: ClientsPageProps) {
  const [mode, setMode] = useState<'list' | 'quick' | 'form'>('list');

  useEffect(() => {
    if (clientEditingId) {
      setMode('form');
    }
  }, [clientEditingId]);

  function handleStartQuickAdd() {
    onReset();
    setMode('quick');
  }

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(client: Client) {
    onEdit(client);
    setMode('form');
  }

  function handleSwitchToFullForm() {
    // Don't reset — preserve whatever the user already typed in Quick Add.
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  // Convenience for the small set of fields that must be present before saving.
  // We deliberately keep the bar low — name + a way to contact them — so the
  // wizard isn't fighting people who just want to register a client quickly.
  // Roll up stock-holding state for every visible client so the register can
  // show "X clients with stock in our warehouse" and we can render a per-client
  // panel underneath. Cheap enough to recompute since these arrays are bounded
  // to clients/invoices/delivery notes already loaded into memory.
  const stockHoldingOverviews = useMemo(() => {
    return filteredClients
      .map((client) => ({
        client,
        overview: summariseClientStockHolding(client.id, invoices, deliveryNotes, dispatchRecords),
      }))
      .filter(({ overview }) => overview.invoices.length > 0 || overview.totalRemainingQuantity > 0);
  }, [filteredClients, invoices, deliveryNotes, dispatchRecords]);

  // Phase 62.5 — tally tooling per client so the table + cards can
  // show "this client owns X dies, Y stereos".
  const toolingByClient = useMemo(() => {
    const map = new Map<string, { dies: number; stereos: number }>();
    for (const t of tooling) {
      if (!t.active) continue;
      if (!t.clientId) continue;
      const tally = map.get(t.clientId) ?? { dies: 0, stereos: 0 };
      if (t.toolType === 'die') tally.dies += 1;
      if (t.toolType === 'stereo') tally.stereos += 1;
      map.set(t.clientId, tally);
    }
    return map;
  }, [tooling]);

  // Phase 67 — recent customer-stock releases per client, sorted newest
  // first. Used by the stock-holding card to surface the release history
  // without forcing the user into the (now list-only) Customer Stock tab.
  const releasesByClient = useMemo(() => {
    const map = new Map<string, typeof customerStockReleases>();
    for (const r of customerStockReleases) {
      const list = map.get(r.clientId) || [];
      list.push(r);
      map.set(r.clientId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    }
    return map;
  }, [customerStockReleases]);

  // Recent DN lookup per client — used by both the stock-holding cards and
  // the main client register so a user can see / open notes without leaving
  // the page. Sorted newest first.
  const deliveryNotesByClient = useMemo(() => {
    const map = new Map<string, DeliveryNote[]>();
    for (const note of deliveryNotes) {
      const list = map.get(note.clientId) || [];
      list.push(note);
      map.set(note.clientId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (b.noteDate || '').localeCompare(a.noteDate || ''));
    }
    return map;
  }, [deliveryNotes]);

  const trendMax = useMemo(() => {
    let max = 0;
    for (const { overview } of stockHoldingOverviews) {
      for (const point of overview.trend) {
        if (point.totalReleased > max) max = point.totalReleased;
      }
    }
    return max;
  }, [stockHoldingOverviews]);

  /** Phase 119.7 — Deposit rollup per client. Open balance = sum of
   *  remainingAmount across deposits that aren't Cancelled or Refunded.
   *  Used by the Client register to show "they have unallocated deposit
   *  credit sitting on the balance sheet." */
  const depositsByClient = useMemo(() => {
    const map = new Map<string, { open: number; count: number; received: number; allocated: number }>();
    for (const d of customerDeposits) {
      if (!d.clientId) continue;
      if (d.status === 'Cancelled' || d.status === 'Refunded') continue;
      const row = map.get(d.clientId) ?? { open: 0, count: 0, received: 0, allocated: 0 };
      row.open += d.remainingAmount;
      row.received += d.amount;
      row.allocated += d.allocatedAmount;
      row.count += 1;
      map.set(d.clientId, row);
    }
    return map;
  }, [customerDeposits]);

  const profileMissing: string[] = [];
  if (!clientForm.name.trim()) profileMissing.push('Customer display name');
  if (!clientForm.contactEmail.trim() && !clientForm.phoneNumber.trim()) {
    profileMissing.push('Email or phone');
  }

  const addressesMissing: string[] = [];
  if (!clientForm.billingAddressLine1.trim()) addressesMissing.push('Billing address line 1');

  // Stock holding is opt-in. When opted in, we require the deposit and
  // delivery policy so we can compute holding fees / dispatch correctly.
  const stockHoldingMissing: string[] = [];
  if (clientForm.stockHoldingEnabled) {
    if (!String(clientForm.depositRequiredPercent).trim()) {
      stockHoldingMissing.push('Deposit required %');
    }
    if (!clientForm.deliveryChargePolicy) stockHoldingMissing.push('Delivery charge policy');
  }

  const sections: FormWizardSection[] = [
    {
      key: 'profile',
      title: 'Profile',
      subtitle: 'Identity and contact details used on quotes, invoices, and the client portal.',
      missingRequired: profileMissing,
      body: (
        <div className="form-grid">
          <label>
            <span>Customer display name<RequiredMarker /></span>
            <input value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} />
          </label>
          <label><span>Company name</span><input value={clientForm.companyName} onChange={(event) => setClientForm({ ...clientForm, companyName: event.target.value })} /></label>
          {companies.length > 0 ? (
            <label>
              <span>Linked Company <span className="muted" style={{ fontSize: '0.78rem' }}>(unified business partner)</span></span>
              <select value={clientForm.companyId ?? ''} onChange={(event) => setClientForm({ ...clientForm, companyId: event.target.value || undefined })}>
                <option value="">— not linked —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.roles && c.roles.length > 1 ? ` · ${c.roles.join('+')}` : ''}</option>
                ))}
              </select>
            </label>
          ) : null}
          {clientEditingId && !clientForm.companyId && onConvertToCompany ? (
            <div className="full-span" style={{ background: 'var(--jp-orange-soft, #fff3e0)', padding: 10, borderRadius: 8, fontSize: '0.85rem' }}>
              Not linked to a Company yet.{' '}
              <button type="button" className="link-button" onClick={() => onConvertToCompany(clientEditingId)}>Create a Company from this client</button>
              {' '}— useful if this client also supplies you (or vice versa).
            </div>
          ) : null}
          <label><span>Account manager</span>
            <select value={clientForm.accountManagerName} onChange={(event) => setClientForm({ ...clientForm, accountManagerName: event.target.value })}>
              <option value="">— Unassigned —</option>
              {clientForm.accountManagerName && !staffOptions.includes(clientForm.accountManagerName) ? (
                <option value={clientForm.accountManagerName}>{clientForm.accountManagerName}</option>
              ) : null}
              {staffOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          {/* Phase 116 — Per-client preferred logo. Empty value = inherit the
              dashboard default. Only the brand logo library shows here; if no
              logos have been uploaded yet, hide the field. */}
          {brandLogos.length > 0 ? (
            <label><span>Preferred logo for this client&apos;s docs</span>
              <select
                value={clientForm.preferredLogoId ?? ''}
                onChange={(event) => setClientForm({ ...clientForm, preferredLogoId: event.target.value || undefined })}
                title="Used on every customer-facing document for this client (invoices, DNs, stock statements). Leave blank to use the dashboard default."
              >
                <option value="">— Use dashboard default —</option>
                {brandLogos.map((logo) => (
                  <option key={logo.id} value={logo.id}>{logo.label}{logo.isDefault ? ' · default' : ''}</option>
                ))}
              </select>
            </label>
          ) : null}
          {/* Phase 119 — Payment model classification. Tells the system
              which AR flow this customer runs on (50/50, prepay-then-draw,
              etc.) so new pro-formas and the dashboard chase logic
              default to the right behaviour. Sits next to brand pickers
              because it's a billing-side preference, same shape. */}
          <label><span>Payment model</span>
            <select
              value={clientForm.paymentModel}
              onChange={(event) => setClientForm({ ...clientForm, paymentModel: event.target.value as CustomerPaymentModel })}
              title="Drives default pro-forma payment expectation, overdraw gates, and dashboard chase logic for this customer."
            >
              {(Object.keys(CUSTOMER_PAYMENT_MODEL_LABELS) as CustomerPaymentModel[]).map((key) => (
                <option key={key} value={key}>{CUSTOMER_PAYMENT_MODEL_LABELS[key]}</option>
              ))}
            </select>
          </label>
          {/* Only show the deposit-% input for models where it's actually
              meaningful — saves the user a confusing blank field on
              standard / COD customers. */}
          {clientForm.paymentModel === 'fiftyFifty' || clientForm.paymentModel === 'depositThenDraw' || clientForm.paymentModel === 'prepayThenDraw' ? (
            <label><span>Default deposit %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={clientForm.defaultDepositPercent}
                onChange={(event) => setClientForm({ ...clientForm, defaultDepositPercent: event.target.value })}
                placeholder={clientForm.paymentModel === 'fiftyFifty' ? '50' : clientForm.paymentModel === 'prepayThenDraw' ? '100' : '30'}
                title="Used to pre-fill the deposit amount on new pro-formas for this client. Blank means no default."
              />
            </label>
          ) : null}
          <label><span>Code</span><input value={clientForm.code} onChange={(event) => setClientForm({ ...clientForm, code: event.target.value })} /></label>
          <label><span>Website</span><input value={clientForm.website} onChange={(event) => setClientForm({ ...clientForm, website: event.target.value })} /></label>
          <label><span>Title</span><input value={clientForm.title} onChange={(event) => setClientForm({ ...clientForm, title: event.target.value })} /></label>
          <label><span>First name</span><input value={clientForm.firstName} onChange={(event) => setClientForm({ ...clientForm, firstName: event.target.value })} /></label>
          <label><span>Middle name</span><input value={clientForm.middleName} onChange={(event) => setClientForm({ ...clientForm, middleName: event.target.value })} /></label>
          <label><span>Last name</span><input value={clientForm.lastName} onChange={(event) => setClientForm({ ...clientForm, lastName: event.target.value })} /></label>
          <label><span>Suffix</span><input value={clientForm.suffix} onChange={(event) => setClientForm({ ...clientForm, suffix: event.target.value })} /></label>
          <label><span>Primary contact name</span><input value={clientForm.contactName} onChange={(event) => setClientForm({ ...clientForm, contactName: event.target.value })} /></label>
          <label>
            <span>Primary email<RequiredMarker /></span>
            <input value={clientForm.contactEmail} onChange={(event) => setClientForm({ ...clientForm, contactEmail: event.target.value })} placeholder="Required if no phone" />
          </label>
          <label>
            <span>Phone number<RequiredMarker /></span>
            <input value={clientForm.phoneNumber} onChange={(event) => setClientForm({ ...clientForm, phoneNumber: event.target.value })} placeholder="Required if no email" />
          </label>
          <label><span>Mobile number</span><input value={clientForm.mobileNumber} onChange={(event) => setClientForm({ ...clientForm, mobileNumber: event.target.value })} /></label>
          <label><span>Other phone</span><input value={clientForm.otherPhone} onChange={(event) => setClientForm({ ...clientForm, otherPhone: event.target.value })} /></label>
          <label><span>Fax number</span><input value={clientForm.faxNumber} onChange={(event) => setClientForm({ ...clientForm, faxNumber: event.target.value })} /></label>
          <label><span>CC email</span><input value={clientForm.ccEmail} onChange={(event) => setClientForm({ ...clientForm, ccEmail: event.target.value })} /></label>
          <label><span>BCC email</span><input value={clientForm.bccEmail} onChange={(event) => setClientForm({ ...clientForm, bccEmail: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.marketingConsent} onChange={(event) => setClientForm({ ...clientForm, marketingConsent: event.target.checked })} />Email marketing consent</label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.active} onChange={(event) => setClientForm({ ...clientForm, active: event.target.checked })} />Active</label>
        </div>
      ),
    },
    {
      key: 'addresses',
      title: 'Addresses',
      subtitle: 'Billing and default delivery details used on invoices, delivery notes, and portal visibility.',
      missingRequired: addressesMissing,
      body: (
        <div className="form-grid">
          <label>
            <span>Billing address line 1<RequiredMarker /></span>
            <input value={clientForm.billingAddressLine1} onChange={(event) => setClientForm({ ...clientForm, billingAddressLine1: event.target.value })} />
          </label>
          <label><span>Billing address line 2</span><input value={clientForm.billingAddressLine2} onChange={(event) => setClientForm({ ...clientForm, billingAddressLine2: event.target.value })} /></label>
          <label><span>Billing city</span><input value={clientForm.billingCity} onChange={(event) => setClientForm({ ...clientForm, billingCity: event.target.value })} /></label>
          <label><span>Billing state</span><input value={clientForm.billingState} onChange={(event) => setClientForm({ ...clientForm, billingState: event.target.value })} /></label>
          <label><span>Billing postal code</span><input value={clientForm.billingPostalCode} onChange={(event) => setClientForm({ ...clientForm, billingPostalCode: event.target.value })} /></label>
          <label><span>Billing country</span><input value={clientForm.billingCountry} onChange={(event) => setClientForm({ ...clientForm, billingCountry: event.target.value })} /></label>
          <label><span>Delivery address line 1</span><input value={clientForm.deliveryAddressLine1} onChange={(event) => setClientForm({ ...clientForm, deliveryAddressLine1: event.target.value })} /></label>
          <label><span>Delivery address line 2</span><input value={clientForm.deliveryAddressLine2} onChange={(event) => setClientForm({ ...clientForm, deliveryAddressLine2: event.target.value })} /></label>
          <label><span>Delivery city</span><input value={clientForm.deliveryCity} onChange={(event) => setClientForm({ ...clientForm, deliveryCity: event.target.value })} /></label>
          <label><span>Delivery state</span><input value={clientForm.deliveryState} onChange={(event) => setClientForm({ ...clientForm, deliveryState: event.target.value })} /></label>
          <label><span>Delivery postal code</span><input value={clientForm.deliveryPostalCode} onChange={(event) => setClientForm({ ...clientForm, deliveryPostalCode: event.target.value })} /></label>
          <label><span>Delivery country</span><input value={clientForm.deliveryCountry} onChange={(event) => setClientForm({ ...clientForm, deliveryCountry: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'commercial',
      title: 'Commercial',
      subtitle: 'Credit, payment terms, and tax. These drive how jobs are quoted and invoiced.',
      body: (
        <div className="form-grid">
          {/* Phase 89 — margin is set once, company-wide, not per client.
              Every client gets the same standard. If a specific client
              negotiates a discount, sales applies it explicitly per
              quote / per line on the Calculator. That way the audit
              trail shows the discount rather than burying it in a tier
              setting nobody remembers. */}
          <div className="full-span" style={{
            fontSize: 12,
            padding: '8px 12px',
            background: 'var(--jp-paper-2, #faf8f4)',
            border: '1px solid var(--jp-line, #e6e0d3)',
            borderRadius: 8,
            color: 'var(--jp-ink-2, #6f6657)',
          }}>
            <strong>Pricing margin is company-wide</strong> — every client
            gets the same standard margin (set in Settings). Negotiated
            discounts are explicit per-quote overrides on the Calculator,
            not a setting buried on the client record.
          </div>
          <label><span>Credit limit</span><input type="number" min="0" value={clientForm.creditLimit} onChange={(event) => setClientForm({ ...clientForm, creditLimit: event.target.value })} /></label>
          <label><span>Current balance</span><input type="number" value={clientForm.currentBalance} onChange={(event) => setClientForm({ ...clientForm, currentBalance: event.target.value })} /></label>
          <label><span>Payment terms</span><input value={clientForm.paymentTerms} onChange={(event) => setClientForm({ ...clientForm, paymentTerms: event.target.value })} placeholder="e.g. 30 days, COD" /></label>
          <label><span>Primary payment method</span><select value={clientForm.primaryPaymentMethod} onChange={(event) => setClientForm({ ...clientForm, primaryPaymentMethod: event.target.value as ClientFormState['primaryPaymentMethod'] })}><option value="EFT">EFT</option><option value="Cash">Cash</option><option value="Card">Card</option><option value="Credit Terms">Credit Terms</option><option value="Other">Other</option></select></label>
          <label><span>Currency</span><select value={clientForm.currency} onChange={(event) => setClientForm({ ...clientForm, currency: event.target.value as ClientFormState['currency'] })}><option value="ZAR">ZAR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
          <label><span>Invoice language</span><input value={clientForm.invoiceLanguage} onChange={(event) => setClientForm({ ...clientForm, invoiceLanguage: event.target.value })} /></label>
          <label><span>VAT number</span><input value={clientForm.vatNumber} onChange={(event) => setClientForm({ ...clientForm, vatNumber: event.target.value })} /></label>
          <label><span>Opening balance</span><input type="number" value={clientForm.openingBalance} onChange={(event) => setClientForm({ ...clientForm, openingBalance: event.target.value })} /></label>
          <label><span>Opening balance as of</span><input type="date" value={clientForm.openingBalanceAsOf} onChange={(event) => setClientForm({ ...clientForm, openingBalanceAsOf: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.brandingDefault} onChange={(event) => setClientForm({ ...clientForm, brandingDefault: event.target.checked })} />Branding default</label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.accountHold} onChange={(event) => setClientForm({ ...clientForm, accountHold: event.target.checked })} />Account hold</label>
        </div>
      ),
    },
    {
      key: 'stockHolding',
      title: 'Stock holding',
      subtitle: 'Rules that prevent clients from abusing bulk pricing while storing and drawing stock from your warehouse.',
      contextActive: clientForm.stockHoldingEnabled,
      missingRequired: stockHoldingMissing,
      contextPrompt: (
        <>
          <p className="muted">This client doesn't currently store finished stock with you. Enable to set deposit, monthly minimums, storage fees, and delivery policy.</p>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={clientForm.stockHoldingEnabled}
              onChange={(event) => setClientForm({ ...clientForm, stockHoldingEnabled: event.target.checked })}
            />
            Enable stock holding for this client
          </label>
        </>
      ),
      body: (
        <div className="form-grid">
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.stockHoldingEnabled} onChange={(event) => setClientForm({ ...clientForm, stockHoldingEnabled: event.target.checked })} />Stock holding enabled</label>
          <label>
            <span>Deposit required %<RequiredMarker /></span>
            <input type="number" min="0" max="100" value={clientForm.depositRequiredPercent} onChange={(event) => setClientForm({ ...clientForm, depositRequiredPercent: event.target.value })} />
          </label>
          <label><span>Minimum monthly release quantity</span><input type="number" min="0" value={clientForm.minimumMonthlyReleaseQuantity} onChange={(event) => setClientForm({ ...clientForm, minimumMonthlyReleaseQuantity: event.target.value })} /></label>
          <label><span>Monthly release unit</span><select value={clientForm.minimumMonthlyReleaseUnit} onChange={(event) => setClientForm({ ...clientForm, minimumMonthlyReleaseUnit: event.target.value as ClientFormState['minimumMonthlyReleaseUnit'] })}><option value="units">units</option><option value="kg">kg</option><option value="rolls">rolls</option><option value="sheets">sheets</option></select></label>
          <label><span>Minimum release quantity</span><input type="number" min="0" value={clientForm.minimumReleaseQuantity} onChange={(event) => setClientForm({ ...clientForm, minimumReleaseQuantity: event.target.value })} /></label>
          <label>
            <span>Delivery charge policy<RequiredMarker /></span>
            <select value={clientForm.deliveryChargePolicy} onChange={(event) => setClientForm({ ...clientForm, deliveryChargePolicy: event.target.value as ClientFormState['deliveryChargePolicy'] })}>
              <option value="Charge Every Release">Charge every release</option>
              <option value="Client Collection">Client collection</option>
              <option value="Charge By Zone">Charge by zone</option>
              <option value="Included By Agreement">Included by agreement</option>
            </select>
          </label>
          <label><span>Storage grace period days</span><input type="number" min="0" value={clientForm.storageGracePeriodDays} onChange={(event) => setClientForm({ ...clientForm, storageGracePeriodDays: event.target.value })} /></label>
          <label><span>Maximum storage period days</span><input type="number" min="0" value={clientForm.maxStoragePeriodDays} onChange={(event) => setClientForm({ ...clientForm, maxStoragePeriodDays: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.storageFeeApplies} onChange={(event) => setClientForm({ ...clientForm, storageFeeApplies: event.target.checked })} />Storage fee applies</label>
          <label><span>Storage fee type</span><select value={clientForm.storageFeeType} onChange={(event) => setClientForm({ ...clientForm, storageFeeType: event.target.value as ClientFormState['storageFeeType'] })}><option value="None">None</option><option value="Per Month">Per month</option><option value="Per Pallet">Per pallet</option><option value="Per Unit">Per unit</option></select></label>
          <label><span>Storage fee rate</span><input type="number" min="0" value={clientForm.storageFeeRate} onChange={(event) => setClientForm({ ...clientForm, storageFeeRate: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.releaseApprovalRequired} onChange={(event) => setClientForm({ ...clientForm, releaseApprovalRequired: event.target.checked })} />Release approval required</label>
        </div>
      ),
    },
    {
      key: 'agreements',
      title: 'Agreements & portal',
      subtitle: 'Track signed terms and decide what the client can see or request through the portal.',
      body: (
        <div className="form-grid">
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.creditAgreementSigned} onChange={(event) => setClientForm({ ...clientForm, creditAgreementSigned: event.target.checked })} />Credit agreement signed</label>
          <label><span>Credit agreement date</span><input type="date" value={clientForm.creditAgreementSignedDate} onChange={(event) => setClientForm({ ...clientForm, creditAgreementSignedDate: event.target.value })} disabled={!clientForm.creditAgreementSigned} /></label>
          <label><span>Credit agreement reference</span><input value={clientForm.creditAgreementReference} onChange={(event) => setClientForm({ ...clientForm, creditAgreementReference: event.target.value })} disabled={!clientForm.creditAgreementSigned} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.stockHoldingAgreementSigned} onChange={(event) => setClientForm({ ...clientForm, stockHoldingAgreementSigned: event.target.checked })} />Stock holding agreement signed</label>
          <label><span>Stock holding agreement date</span><input type="date" value={clientForm.stockHoldingAgreementSignedDate} onChange={(event) => setClientForm({ ...clientForm, stockHoldingAgreementSignedDate: event.target.value })} disabled={!clientForm.stockHoldingAgreementSigned} /></label>
          <label><span>Stock holding agreement reference</span><input value={clientForm.stockHoldingAgreementReference} onChange={(event) => setClientForm({ ...clientForm, stockHoldingAgreementReference: event.target.value })} disabled={!clientForm.stockHoldingAgreementSigned} /></label>
          <label><span>Stock holding review date</span><input type="date" value={clientForm.stockHoldingReviewDate} onChange={(event) => setClientForm({ ...clientForm, stockHoldingReviewDate: event.target.value })} disabled={!clientForm.stockHoldingAgreementSigned} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.portalEnabled} onChange={(event) => setClientForm({ ...clientForm, portalEnabled: event.target.checked })} />Portal enabled</label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.portalViewQuotes} onChange={(event) => setClientForm({ ...clientForm, portalViewQuotes: event.target.checked })} disabled={!clientForm.portalEnabled} />Portal can view quotes</label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.portalViewInvoices} onChange={(event) => setClientForm({ ...clientForm, portalViewInvoices: event.target.checked })} disabled={!clientForm.portalEnabled} />Portal can view invoices</label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.portalViewStock} onChange={(event) => setClientForm({ ...clientForm, portalViewStock: event.target.checked })} disabled={!clientForm.portalEnabled} />Portal can view stock</label>
          <label className="checkbox-row"><input type="checkbox" checked={clientForm.portalRequestRelease} onChange={(event) => setClientForm({ ...clientForm, portalRequestRelease: event.target.checked })} disabled={!clientForm.portalEnabled} />Portal can request release</label>
          <label className="full-span"><span>Notes</span><textarea value={clientForm.notes} onChange={(event) => setClientForm({ ...clientForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        backAction={mode === 'form' ? <button className="ghost-button" onClick={handleBackToList}>← Back to Clients</button> : null}

        action={
          mode === 'list' ? (
            <div className="add-button-group">
              <button className="secondary-button" onClick={handleStartQuickAdd}>Add New Client</button>
              <button className="ghost-button" onClick={handleStartCreate}>Full Form</button>
            </div>
          ) : null
}
      />
      {mode === 'quick' ? (
        <QuickAddCard
          title="Quick add client"
          subtitle="Just the essentials. You can fill the rest in from the client's record later."
          message={clientMessage}
          missingRequired={profileMissing}
          onSave={onSave}
          onCancel={handleBackToList}
          onSwitchToFullForm={handleSwitchToFullForm}
          saveLabel="Save Client"
          body={
            <div className="form-grid">
              <label>
                <span>Customer display name<RequiredMarker /></span>
                <input
                  value={clientForm.name}
                  onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })}
                  placeholder="e.g. Acme Foods"
                  autoFocus
                />
              </label>
              <label>
                <span>Primary email<RequiredMarker /></span>
                <input
                  value={clientForm.contactEmail}
                  onChange={(event) => setClientForm({ ...clientForm, contactEmail: event.target.value })}
                  placeholder="Required if no phone"
                />
              </label>
              <label>
                <span>Phone number<RequiredMarker /></span>
                <input
                  value={clientForm.phoneNumber}
                  onChange={(event) => setClientForm({ ...clientForm, phoneNumber: event.target.value })}
                  placeholder="Required if no email"
                />
              </label>
              <label>
                <span>Company name</span>
                <input
                  value={clientForm.companyName}
                  onChange={(event) => setClientForm({ ...clientForm, companyName: event.target.value })}
                  placeholder="Optional"
                />
              </label>
            </div>
          }
        />
      ) : mode === 'form' ? (
        <>
          {currentUser && (
            <EditFormGuard
              table="clients"
              recordId={clientEditingId}
              recordLabel={clientEditingId ? (clientForm.companyName || clientForm.name || 'Client') : undefined}
              currentUser={currentUser}
            />
          )}
          {/* Phase 94 — Live production pipeline for this client. Only shows
              when we're editing an existing client (we need the id to filter
              their jobs) and the client has open work in flight. */}
          {clientEditingId ? (
            <ClientLivePipelineStrip
              jobs={jobs.filter((j) => j.clientId === clientEditingId)}
              onOpenJob={onOpenJob}
            />
          ) : null}
          <FormWizard
            title={clientEditingId ? 'Edit client' : 'New client'}
            subtitle="Required fields are marked. Save unlocks once each active section is complete."
            message={clientMessage}
            sections={sections}
            isEditing={Boolean(clientEditingId)}
            saveLabel="Save Client"
            onSave={onSave}
            onCancel={handleBackToList}
          />
        </>
      ) : (
        <>
          {stockHoldingOverviews.length ? (
            <section className="card">
              <SectionTitle
                title="Stock-holding clients"
                subtitle={`${stockHoldingOverviews.length} client${stockHoldingOverviews.length === 1 ? '' : 's'} with paid stock still in your warehouse`}
              />
              <div className="client-stock-grid">
                {stockHoldingOverviews.map(({ client, overview }) => {
                  // Use the soonest expiry across the client's open invoices to
                  // surface the most pressing storage deadline.
                  const earliestExpiringInvoice = overview.invoices
                    .filter((inv) => inv.estimatedDaysOfStockLeft !== null)
                    .reduce<typeof overview.invoices[number] | null>((acc, inv) => {
                      if (!acc) return inv;
                      const a = inv.estimatedDaysOfStockLeft ?? Infinity;
                      const b = acc.estimatedDaysOfStockLeft ?? Infinity;
                      return a < b ? inv : acc;
                    }, null);
                  const anyWillExpire = overview.invoices.some((inv) => inv.willExpireBeforeDrawn);
                  return (
                    <article key={client.id} className="client-stock-card">
                      <header className="client-stock-card-head">
                        <div>
                          <strong>{client.name}</strong>
                          <div className="table-subtext">{client.companyName || client.code || 'No company set'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button className="secondary-button" type="button" onClick={() => onCreateDeliveryNote(client)}>+ Delivery Note</button>
                          {onCreateRelease ? (
                            <button className="secondary-button" type="button" onClick={() => onCreateRelease(client)}>+ Release</button>
                          ) : null}
                          <button className="table-button" type="button" onClick={() => handleStartEdit(client)}>Edit profile</button>
                        </div>
                      </header>
                      <div className="stock-holding-panel">
                        <div className="stock-holding-stat"><span>In warehouse</span><strong>{formatNumber(overview.totalRemainingQuantity)}</strong></div>
                        <div className="stock-holding-stat"><span>Released</span><strong>{formatNumber(overview.totalDeliveredQuantity)}</strong></div>
                        <div className="stock-holding-stat"><span>Weekly avg</span><strong>{formatNumber(Math.round(overview.weeklyAverageReleased))}</strong></div>
                        <div className="stock-holding-stat"><span>Monthly avg</span><strong>{formatNumber(Math.round(overview.monthlyAverageReleased))}</strong></div>
                        <div className="stock-holding-stat"><span>Days of stock left</span><strong>{formatDaysFriendly(earliestExpiringInvoice?.estimatedDaysOfStockLeft ?? null)}</strong></div>
                        <div className="stock-holding-stat"><span>Open invoices</span><strong>{overview.invoices.length}</strong></div>
                      </div>
                      {anyWillExpire ? (
                        <div className="stock-holding-warning">
                          At the current draw rate, at least one storage agreement will expire before the stock is collected.
                        </div>
                      ) : null}
                      <div className="client-stock-trend">
                        <div className="client-stock-trend-label">Last 6 months</div>
                        <div className="client-stock-trend-bars">
                          {overview.trend.map((point) => {
                            const heightPct = trendMax > 0 ? Math.max(4, Math.round((point.totalReleased / trendMax) * 100)) : 4;
                            return (
                              <div key={point.monthKey} className="client-stock-trend-bar" title={`${point.monthKey}: ${formatNumber(point.totalReleased)}`}>
                                <span className="client-stock-trend-bar-fill" style={{ height: `${heightPct}%` }} />
                                <span className="client-stock-trend-bar-label">{point.monthKey.slice(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {(() => {
                        const recent = (deliveryNotesByClient.get(client.id) || []).slice(0, 4);
                        if (recent.length === 0) {
                          return (
                            <div className="client-stock-dn-empty muted" style={{ marginTop: '0.6rem', fontSize: '0.78rem' }}>
                              No delivery notes for this client yet.
                            </div>
                          );
                        }
                        const total = deliveryNotesByClient.get(client.id)?.length ?? 0;
                        return (
                          <div className="client-stock-dn" style={{ marginTop: '0.6rem' }}>
                            <div className="table-subtext" style={{ marginBottom: '0.25rem' }}>
                              Recent delivery notes ({total} total)
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {recent.map((note) => (
                                <li key={note.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                  <button
                                    type="button"
                                    className="ghost-button"
                                    style={{ padding: '0.15rem 0.35rem', fontSize: '0.78rem' }}
                                    onClick={() => onOpenDeliveryNote?.(note)}
                                    disabled={!onOpenDeliveryNote}
                                  >
                                    {note.deliveryNoteNumber}
                                  </button>
                                  <span className="muted">{note.noteDate} · {note.status}</span>
                                </li>
                              ))}
                            </ul>
                            {total > recent.length ? (
                              <button
                                type="button"
                                className="ghost-button"
                                style={{ marginTop: '0.35rem', padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                                onClick={() => onViewDeliveryNotes(client)}
                              >
                                View all in Delivery Notes →
                              </button>
                            ) : null}
                          </div>
                        );
                      })()}
                      {/* Phase 67 — recent customer stock releases (mirrors the DN block above). */}
                      {(() => {
                        const all = releasesByClient.get(client.id) || [];
                        const recent = all.slice(0, 4);
                        if (recent.length === 0) {
                          return (
                            <div className="muted" style={{ marginTop: '0.6rem', fontSize: '0.78rem' }}>
                              No customer-stock releases for this client yet.
                            </div>
                          );
                        }
                        return (
                          <div style={{ marginTop: '0.6rem' }}>
                            <div className="table-subtext" style={{ marginBottom: '0.25rem' }}>
                              Recent stock releases ({all.length} total)
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {recent.map((r) => (
                                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                  <strong>{r.releaseNumber}</strong>
                                  <span className="muted">
                                    {r.releaseDate}
                                    {r.quantityReleased ? ` · ${r.quantityReleased} ${r.quantityUnit || ''}` : ''}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            {all.length > recent.length && onViewReleases ? (
                              <button
                                type="button"
                                className="ghost-button"
                                style={{ marginTop: '0.35rem', padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                                onClick={() => onViewReleases(client)}
                              >
                                View all in Customer Stock →
                              </button>
                            ) : null}
                          </div>
                        );
                      })()}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
          <section className="card">
            <SectionTitle title="Client register" subtitle={`${filteredClients.length} record(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={clientFilters.search} onChange={(event) => setClientFilters({ ...clientFilters, search: event.target.value })} /></label>
            <label><span>Client type</span><select value={clientFilters.clientType} onChange={(event) => setClientFilters({ ...clientFilters, clientType: event.target.value })}><option value="">All</option><option>Wholesale</option><option>Retail</option><option>Ecommerce</option><option>Custom</option></select></label>
            <label><span>Active</span><select value={clientFilters.active} onChange={(event) => setClientFilters({ ...clientFilters, active: event.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
          </div>
          {filteredClients.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>Balance / Limit</th><th>Deposits</th><th>Stock holding</th><th>Delivery notes</th><th>Tooling</th><th>Portal</th><th>Agreements</th><th>Actions</th></tr></thead>
                <tbody>{filteredClients.map((client) => {
                  const clientDns = deliveryNotesByClient.get(client.id) || [];
                  return (
                    <tr key={client.id}>
                      <td><strong>{client.name}</strong><CommercialFlags client={client} /><div className="table-subtext">{client.companyName || client.code || 'No company set'}</div></td>
                      <td className={isClientOverCredit(client) ? 'cell-alert' : undefined}>{client.currentBalance} / {client.creditLimit}<div className="table-subtext">{client.paymentTerms || 'Not set'}</div></td>
                      {/* Phase 119.7 — Deposit balance card. Shows the
                          unallocated balance — what we still owe in
                          goods or refund. Quiet "—" when no deposits. */}
                      <td>
                        {(() => {
                          const dep = depositsByClient.get(client.id);
                          if (!dep || dep.count === 0) return <span className="muted" style={{ fontSize: '0.78rem' }}>—</span>;
                          return (
                            <>
                              <strong style={{ color: dep.open > 0 ? 'var(--jp-orange, #db5a1f)' : undefined }}>R {dep.open.toFixed(2)}</strong>
                              <div className="table-subtext">{dep.count} deposit{dep.count === 1 ? '' : 's'} · R {dep.received.toFixed(2)} received</div>
                            </>
                          );
                        })()}
                      </td>
                      <td>{client.stockHoldingEnabled ? `Yes · ${client.depositRequiredPercent}% deposit` : 'No'}<div className="table-subtext">{client.minimumMonthlyReleaseQuantity ? `Min monthly ${client.minimumMonthlyReleaseQuantity} ${client.minimumMonthlyReleaseUnit}` : 'No monthly rule'}</div></td>
                      <td>
                        <strong>{clientDns.length}</strong>
                        <div className="table-subtext">{clientDns[0] ? `Last ${clientDns[0].noteDate}` : 'None yet'}</div>
                        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          <button className="table-button" type="button" onClick={() => onCreateDeliveryNote(client)}>+ DN</button>
                          {clientDns.length ? (
                            <button className="table-button" type="button" onClick={() => onViewDeliveryNotes(client)}>View</button>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const tally = toolingByClient.get(client.id) ?? { dies: 0, stereos: 0 };
                          if (!tally.dies && !tally.stereos) return <span className="muted" style={{ fontSize: '0.78rem' }}>None</span>;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {tally.dies > 0 && (
                                <button className="table-button" type="button" onClick={() => onViewToolingForClient?.(client, 'die')}>{tally.dies} die{tally.dies === 1 ? '' : 's'}</button>
                              )}
                              {tally.stereos > 0 && (
                                <button className="table-button" type="button" onClick={() => onViewToolingForClient?.(client, 'stereo')}>{tally.stereos} stereo{tally.stereos === 1 ? '' : 's'}</button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td>{client.portalEnabled ? 'Enabled' : 'Disabled'}<div className="table-subtext">{client.portalViewStock ? 'Stock visible' : 'Stock hidden'}</div></td>
                      <td>{client.creditAgreementSigned ? 'Credit signed' : 'Credit pending'}<div className="table-subtext">{client.stockHoldingAgreementSigned ? 'Stock signed' : 'Stock pending'}</div></td>
                      <td><button className="table-button" onClick={() => handleStartEdit(client)}>Edit</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            ) : <EmptyState title="No clients yet" body="Add clients so pricing and jobs can follow real commercial profiles." />}
          </section>
        </>
      )}
    </>
  );
}

/* ─── Phase 94: Live production pipeline strip for the Client profile. ──
 * Shows every open job for this client with its current production stage
 * and any active blocker. This is the "client phones and asks where their
 * order is" view — one glance gives a status across all jobs.
 *
 * Renders nothing when there are no open jobs so the profile stays clean
 * for new clients / fully-shipped accounts. */
function ClientLivePipelineStrip(props: {
  jobs: Array<{ id: string; jobNumber: string; productName: string; pipelineStages?: import('../../types').PipelineStage[] }>;
  onOpenJob?: (jobId: string) => void;
}) {
  const { jobs, onOpenJob } = props;
  const open = jobs
    .map((job) => ({ job, summary: summarisePipeline(job.pipelineStages) }))
    .filter(({ summary }) => summary.currentStage !== null);
  if (open.length === 0) return null;
  return (
    <section className="card" style={{ marginBottom: 12 }}>
      <SectionTitle
        title="Live pipeline"
        subtitle={`${open.length} job${open.length === 1 ? '' : 's'} in flight · click a row to open the job`}
      />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job #</th>
              <th>Product</th>
              <th>Current stage</th>
              <th>Progress</th>
              <th>Blockers</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {open.map(({ job, summary }) => (
              <tr key={job.id}>
                <td><strong>{job.jobNumber}</strong></td>
                <td>{job.productName || '—'}</td>
                <td>{describePipelinePosition(summary)}</td>
                <td>{summary.doneItems}/{summary.totalItems} · {summary.percent}%</td>
                <td style={{ color: summary.blockedItems > 0 ? '#b22b2b' : undefined }}>
                  {summary.blockedItems > 0
                    ? summary.blockers.map((b: { item: { blockerNote?: string; label: string } }) => b.item.blockerNote || b.item.label).join(' · ')
                    : '—'}
                </td>
                <td>
                  {onOpenJob ? (
                    <button type="button" className="ghost-button" onClick={() => onOpenJob(job.id)}>Open</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
