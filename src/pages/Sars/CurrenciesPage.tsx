/**
 * Currencies & FX — Phase 31
 *
 * Maintain the exchange-rate table (manual now; an auto-fetch hook is stubbed in
 * currency.ts for later), and run a period-end unrealised FX revaluation that
 * posts a balanced draft journal to the General Ledger.
 *
 * Base currency is ZAR. Foreign invoices/bills are booked at the rate on their
 * date; revaluation adjusts open foreign balances to the current rate.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AppSettingsCurrencyConfig,
  ExchangeRate,
  Invoice,
  JournalEntry,
  LedgerAccount,
  SupplierBill,
} from '../../types';
import { formatNumber } from '../../utils/calculations';
import { buildRevaluationJournal, buildRealisedFxJournal, RealisedFxResult } from '../../utils/currency';

interface CurrenciesPageProps {
  currencyConfig: AppSettingsCurrencyConfig;
  invoices: Invoice[];
  supplierBills: SupplierBill[];
  ledgerAccounts: LedgerAccount[];
  today: string;
  onSaveConfig: (config: AppSettingsCurrencyConfig) => void;
  onPostRevaluation: (journal: JournalEntry) => void;
  onPostRealisedFx: (result: RealisedFxResult) => void;
}

export function CurrenciesPage({ currencyConfig, invoices, supplierBills, ledgerAccounts, today, onSaveConfig, onPostRevaluation, onPostRealisedFx }: CurrenciesPageProps) {
  const [rates, setRates] = useState<ExchangeRate[]>(currencyConfig.rates.map((r) => ({ ...r })));
  const [asAt, setAsAt] = useState(today);
  const [message, setMessage] = useState('');

  const preview = useMemo(
    () => buildRevaluationJournal(invoices, supplierBills, { ...currencyConfig, rates }, ledgerAccounts, asAt),
    [invoices, supplierBills, currencyConfig, rates, ledgerAccounts, asAt],
  );
  const realisedPreview = useMemo(
    () => buildRealisedFxJournal(invoices, supplierBills, { ...currencyConfig, rates }, ledgerAccounts, asAt),
    [invoices, supplierBills, currencyConfig, rates, ledgerAccounts, asAt],
  );

  function updateRate(idx: number, patch: Partial<ExchangeRate>) {
    setRates((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addRate() { setRates((rs) => [...rs, { code: '', rateToBase: 0, asOf: today }]); }
  function removeRate(idx: number) { setRates((rs) => rs.filter((_, i) => i !== idx)); }

  function saveRates() {
    const clean = rates
      .filter((r) => r.code.trim())
      .map((r) => ({ code: r.code.trim().toUpperCase(), rateToBase: Number(r.rateToBase) || 0, asOf: r.asOf || today }));
    onSaveConfig({ ...currencyConfig, rates: clean });
    setMessage('Exchange rates saved.');
  }

  function postRevaluation() {
    if (!preview.journal) {
      setMessage('Nothing to revalue (no open foreign balances, or the 1100/2000/4920 accounts are missing).');
      return;
    }
    onPostRevaluation(preview.journal);
    setMessage(`Posted a draft FX revaluation journal (net ${preview.netGain >= 0 ? 'gain' : 'loss'} R ${formatNumber(Math.abs(preview.netGain), 2)}). Review + post it in the General Ledger.`);
  }

  function postRealised() {
    if (!realisedPreview.journal) {
      setMessage('No unposted foreign settlements to realise.');
      return;
    }
    onPostRealisedFx(realisedPreview);
    setMessage(`Posted a draft realised-FX journal (net ${realisedPreview.netGain >= 0 ? 'gain' : 'loss'} R ${formatNumber(Math.abs(realisedPreview.netGain), 2)}) across ${realisedPreview.postedPayments.length} settlement(s). Review + post it in the General Ledger.`);
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Currencies & FX"
        subtitle="Base currency ZAR. Maintain rates and revalue open foreign balances at period-end."
      />

      <section className="card">
        <div className="sars-card-head">
          <h3>Exchange rates (1 unit = ? {currencyConfig.baseCurrency})</h3>
          <button className="ghost-button" onClick={addRate} style={{ borderStyle: 'dashed' }}>+ Add currency</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Currency</th><th style={{ textAlign: 'right' }}>Rate {currencyConfig.baseCurrency}</th><th>As of</th><th></th></tr></thead>
          <tbody>
            {rates.length === 0 ? <tr><td colSpan={4} className="muted">No foreign currencies. Add one.</td></tr> :
              rates.map((r, idx) => (
                <tr key={idx}>
                  <td><input style={{ width: 90 }} value={r.code} onChange={(e) => updateRate(idx, { code: e.target.value.toUpperCase() })} placeholder="USD" /></td>
                  <td><input type="number" style={{ width: 120, textAlign: 'right' }} value={r.rateToBase} onChange={(e) => updateRate(idx, { rateToBase: Number(e.target.value) })} /></td>
                  <td><input type="date" value={r.asOf} onChange={(e) => updateRate(idx, { asOf: e.target.value })} /></td>
                  <td><button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => removeRate(idx)}></button></td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="accounting-actions">
          <button className="primary-button" onClick={saveRates}>Save rates</button>
        </div>
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          Rates are entered manually. Auto-fetch from an FX API can be switched on later (the hook is already in place).
        </p>
      </section>

      <section className="card">
        <h3>Period-end revaluation</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Revalues open foreign invoices (AR) and supplier bills (AP) from their booking rate to the current rate, and posts the unrealised gain/loss to the General Ledger.
        </p>
        <div className="accounting-toolbar">
          <label><span>As at</span><input type="date" value={asAt} onChange={(e) => setAsAt(e.target.value)} /></label>
        </div>
        <div className="payroll-summary">
          <div><span className="muted">AR revaluation</span><strong>R {formatNumber(preview.arDelta, 2)}</strong></div>
          <div><span className="muted">AP revaluation</span><strong>R {formatNumber(preview.apDelta, 2)}</strong></div>
          <div><span className="muted">Net FX {preview.netGain >= 0 ? 'gain' : 'loss'}</span><strong className={preview.netGain < 0 ? 'amount-due' : 'gl-balanced'}>R {formatNumber(Math.abs(preview.netGain), 2)}</strong></div>
        </div>
        <div className="accounting-actions">
          <button className="primary-button" onClick={postRevaluation} disabled={!preview.journal}>Post revaluation to GL</button>
        </div>
      </section>

      <section className="card">
        <h3>Realised FX on settlements</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Posts the realised gain/loss on the paid portion of foreign invoices and bills (settlement rate vs booking rate) and marks those payments so they aren't counted again. Complements the revaluation above, which only covers the unpaid balance.
        </p>
        <div className="payroll-summary">
          <div><span className="muted">AR realised</span><strong>R {formatNumber(realisedPreview.arDelta, 2)}</strong></div>
          <div><span className="muted">AP realised</span><strong>R {formatNumber(realisedPreview.apDelta, 2)}</strong></div>
          <div><span className="muted">Net realised {realisedPreview.netGain >= 0 ? 'gain' : 'loss'}</span><strong className={realisedPreview.netGain < 0 ? 'amount-due' : 'gl-balanced'}>R {formatNumber(Math.abs(realisedPreview.netGain), 2)}</strong></div>
          <div><span className="muted">Settlements</span><strong>{realisedPreview.postedPayments.length}</strong></div>
        </div>
        <div className="accounting-actions">
          <button className="primary-button" onClick={postRealised} disabled={!realisedPreview.journal}>Post realised FX to GL</button>
        </div>
      </section>

      {message ? <section className="card"><p className="muted">{message}</p></section> : null}
    </div>
  );
}
