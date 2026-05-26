/**
 * Aman OS Connector — Phase 32 (publisher control panel)
 *
 * Admin screen to control what JomoPak exposes to the Aman OS. Master on/off,
 * a per-tile publish toggle (the "turn wastage off" control), the read-only
 * endpoint Aman OS calls, and a manual publish. Only the toggled-on tiles ever
 * leave JomoPak, and only as aggregated metrics — never raw data.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { AppData, AppSettingsConnectorConfig } from '../../types';
import { formatNumber } from '../../utils/calculations';
import { computeConnectorTiles } from '../../utils/connectorTiles';

interface OsConnectorPageProps {
  data: AppData;
  connectorConfig: AppSettingsConnectorConfig;
  today: string;
  onSaveConfig: (config: AppSettingsConnectorConfig) => void;
  onPublishNow: () => Promise<void> | void;
}

export function OsConnectorPage({ data, connectorConfig, today, onSaveConfig, onPublishNow }: OsConnectorPageProps) {
  const [draft, setDraft] = useState<AppSettingsConnectorConfig>({ ...connectorConfig, disabledTileKeys: [...connectorConfig.disabledTileKeys] });
  const [message, setMessage] = useState('');
  const [publishing, setPublishing] = useState(false);

  const tiles = useMemo(() => computeConnectorTiles(data, today), [data, today]);
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL || '<your-supabase-url>'}/functions/v1/connector-feed`;
  const disabled = new Set(draft.disabledTileKeys);
  const publishedCount = tiles.filter((t) => !disabled.has(t.key)).length;

  function toggleTile(key: string) {
    setDraft((d) => {
      const set = new Set(d.disabledTileKeys);
      if (set.has(key)) set.delete(key); else set.add(key);
      return { ...d, disabledTileKeys: Array.from(set) };
    });
  }

  function save() {
    onSaveConfig(draft);
    setMessage('Connector settings saved. They take effect on the next publish.');
  }

  async function publish() {
    setPublishing(true);
    setMessage('Publishing…');
    try {
      onSaveConfig(draft);
      await onPublishNow();
      setMessage('Published. Connected systems will see the latest data on their next read.');
    } catch (e) {
      setMessage(`Publish failed: ${String(e)}`);
    } finally {
      setPublishing(false);
    }
  }

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof tiles>();
    tiles.forEach((t) => { const arr = map.get(t.category) || []; arr.push(t); map.set(t.category, arr); });
    return Array.from(map.entries());
  }, [tiles]);

  return (
    <div className="page-stack">
      <SectionTitle
        title="API Access"
        subtitle="A secure read-only API for connecting this dashboard to other systems — the Aman OS, another dashboard, or your website. You control exactly what's shared; curated metrics only, never raw data."
      />

      <section className="card accounting-toolbar">
        <label className="accounting-check"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><span>API enabled</span></label>
        <span className="muted" style={{ alignSelf: 'center' }}>{publishedCount} of {tiles.length} tiles published · last published {connectorConfig.lastPublishedAt ? new Date(connectorConfig.lastPublishedAt).toLocaleString('en-ZA') : 'never'}</span>
      </section>

      <section className="card">
        <h3>Read-only API endpoint</h3>
        <p className="muted" style={{ marginTop: 0 }}>Any system you authorise reads this with a <code>GET</code> and header <code>x-connector-key: &lt;your key&gt;</code>. The key is the <code>CONNECTOR_API_KEY</code> function secret. It cannot write anything back.</p>
        <code style={{ display: 'block', padding: '0.6rem 0.8rem', background: 'rgba(16,34,26,0.05)', borderRadius: 8, wordBreak: 'break-all', fontSize: '0.82rem' }}>{endpoint}</code>
      </section>

      <section className="card">
        <h3>What gets shared</h3>
        <p className="muted" style={{ marginTop: 0 }}>Untick a tile to stop sharing it (e.g. turn wastage off). Values shown are live previews of what would be sent.</p>
        {byCategory.map(([category, group]) => (
          <div key={category} style={{ marginBottom: '1rem' }}>
            <h4 className="accounting-group-head"><span className="sars-tag">{category}</span></h4>
            <table className="data-table">
              <thead><tr><th>Metric</th><th style={{ textAlign: 'right' }}>Current value</th><th style={{ textAlign: 'center' }}>Shared</th></tr></thead>
              <tbody>
                {group.map((t) => (
                  <tr key={t.key} className={disabled.has(t.key) ? 'row-muted' : ''}>
                    <td><strong>{t.label}</strong><div className="muted" style={{ fontSize: '0.72rem' }}>{t.key}{t.detail ? ` · ${t.detail}` : ''}</div></td>
                    <td style={{ textAlign: 'right' }}>{t.unit === 'ZAR' ? 'R ' : ''}{formatNumber(t.value, t.unit === 'ZAR' ? 2 : 0)}{t.unit === '%' ? '%' : ''}</td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!disabled.has(t.key)} onChange={() => toggleTile(t.key)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {message ? <p className="muted">{message}</p> : null}
        <div className="accounting-actions" style={{ gap: '0.6rem' }}>
          <button className="ghost-button" onClick={save} disabled={publishing}>Save settings</button>
          <button className="primary-button" onClick={publish} disabled={publishing || !draft.enabled}>{publishing ? 'Publishing…' : 'Publish now'}</button>
        </div>
      </section>
    </div>
  );
}
