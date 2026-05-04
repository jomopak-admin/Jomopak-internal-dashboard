import { useEffect, useMemo, useState } from 'react';
import { CommercialFlags, isClientOverCredit } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { QuickAddCard } from '../../components/QuickAddCard';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, ClientFilters, ClientFormState, DeliveryNote, DispatchRecord, Invoice, PricingTier } from '../../types';
import { formatNumber } from '../../utils/calculations';
import { formatDaysFriendly, summariseClientStockHolding } from '../../utils/stockHolding';

interface ClientsPageProps {
  pricingTiers: PricingTier[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  dispatchRecords: DispatchRecord[];
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
}

export function ClientsPage({
  pricingTiers,
  invoices,
  deliveryNotes,
  dispatchRecords,
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

  const trendMax = useMemo(() => {
    let max = 0;
    for (const { overview } of stockHoldingOverviews) {
      for (const point of overview.trend) {
        if (point.totalReleased > max) max = point.totalReleased;
      }
    }
    return max;
  }, [stockHoldingOverviews]);

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
      subtitle: 'Pricing tier, credit, payment terms, and tax. These drive how jobs are quoted and invoiced.',
      body: (
        <div className="form-grid">
          <label><span>Pricing tier</span><select value={clientForm.pricingTierId} onChange={(event) => setClientForm({ ...clientForm, pricingTierId: event.target.value })}><option value="">Select tier</option>{pricingTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></label>
          <label><span>Default margin %</span><input type="number" min="0" value={clientForm.defaultMarginPercent} onChange={(event) => setClientForm({ ...clientForm, defaultMarginPercent: event.target.value })} /></label>
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
        action={
          mode === 'list' ? (
            <div className="add-button-group">
              <button className="secondary-button" onClick={handleStartQuickAdd}>Add New Client</button>
              <button className="ghost-button" onClick={handleStartCreate}>Full Form</button>
            </div>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Clients</button>
          )
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
                        <button className="table-button" type="button" onClick={() => handleStartEdit(client)}>Edit profile</button>
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
                <thead><tr><th>Client</th><th>Pricing tier</th><th>Balance / Limit</th><th>Stock holding</th><th>Portal</th><th>Agreements</th><th>Actions</th></tr></thead>
                <tbody>{filteredClients.map((client) => <tr key={client.id}><td><strong>{client.name}</strong><CommercialFlags client={client} /><div className="table-subtext">{client.companyName || client.code || 'No company set'}</div></td><td>{client.pricingTierName || 'Not set'}</td><td className={isClientOverCredit(client) ? 'cell-alert' : undefined}>{client.currentBalance} / {client.creditLimit}<div className="table-subtext">{client.paymentTerms || 'Not set'}</div></td><td>{client.stockHoldingEnabled ? `Yes · ${client.depositRequiredPercent}% deposit` : 'No'}<div className="table-subtext">{client.minimumMonthlyReleaseQuantity ? `Min monthly ${client.minimumMonthlyReleaseQuantity} ${client.minimumMonthlyReleaseUnit}` : 'No monthly rule'}</div></td><td>{client.portalEnabled ? 'Enabled' : 'Disabled'}<div className="table-subtext">{client.portalViewStock ? 'Stock visible' : 'Stock hidden'}</div></td><td>{client.creditAgreementSigned ? 'Credit signed' : 'Credit pending'}<div className="table-subtext">{client.stockHoldingAgreementSigned ? 'Stock signed' : 'Stock pending'}</div></td><td><button className="table-button" onClick={() => handleStartEdit(client)}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
            ) : <EmptyState title="No clients yet" body="Add clients so pricing and jobs can follow real commercial profiles." />}
          </section>
        </>
      )}
    </>
  );
}
