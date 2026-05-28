/**
 * Labels page — Phase 65.
 *
 * Two ways to use this module:
 *
 *   1. From a stock-able record's list row, click the small "Label" button
 *      and a single label prints immediately. (Wired separately on each
 *      register page.)
 *
 *   2. Open this page, pick a category (spares, chemicals, materials,
 *      finished goods, tooling), tick the items, choose a label size,
 *      and print a sheet. Useful when new stock comes in and you want a
 *      batch of labels for the rack.
 *
 * The print dialog defaults to the user's preferred label printer — any
 * OS-recognised label printer (Zebra, Brother, Dymo) shows up.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  ChemicalRegisterEntry,
  FinishedGoodsStock,
  MaterialReceipt,
  SparePart,
  Tooling,
} from '../../types';
import {
  buildLabelSheetHtml,
  LabelData,
  LabelSize,
  LABEL_SIZES,
  openPrintWindow,
} from '../../utils/labelTemplates';

type Source = 'all' | 'spares' | 'chemicals' | 'materials' | 'finished' | 'tooling';

interface LabelsPageProps {
  spareParts: SparePart[];
  chemicalRegisterEntries: ChemicalRegisterEntry[];
  materialReceipts: MaterialReceipt[];
  finishedGoodsStock: FinishedGoodsStock[];
  tooling: Tooling[];
  brandName: string;
  defaultLabelSize?: LabelSize;
}

interface Candidate extends LabelData {
  id: string;
  source: Source;
}

export function LabelsPage({
  spareParts,
  chemicalRegisterEntries,
  materialReceipts,
  finishedGoodsStock,
  tooling,
  brandName,
  defaultLabelSize,
}: LabelsPageProps) {
  const [source, setSource] = useState<Source>('all');
  const [size, setSize] = useState<LabelSize>(defaultLabelSize || 'thermal-100x50');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copies, setCopies] = useState<Record<string, number>>({});

  // ---- Build a single combined candidate list per source -----------------
  const allCandidates = useMemo<Candidate[]>(() => {
    const out: Candidate[] = [];
    for (const p of spareParts) {
      out.push({
        id: `spare:${p.id}`,
        source: 'spares',
        code: p.partCode || p.barcode || p.id,
        name: p.partName || 'Unnamed part',
        badge: (p.category || 'STOCK').toUpperCase().slice(0, 16),
        details: [
          p.machineReference || '',
          p.storageLocation ? `📍 ${p.storageLocation}` : '',
        ].filter(Boolean),
      });
    }
    for (const c of chemicalRegisterEntries) {
      if (c.archived) continue;
      out.push({
        id: `chem:${c.id}`,
        source: 'chemicals',
        code: c.registerNumber || c.id,
        name: c.chemicalName || c.tradeName || 'Chemical',
        badge: 'CHEMICAL',
        details: [
          c.tradeName ? `Trade: ${c.tradeName}` : '',
          c.casNumber ? `CAS ${c.casNumber}` : '',
          c.storageLocation ? `📍 ${c.storageLocation}` : '',
          c.ghsPictograms && c.ghsPictograms.length ? `⚠ ${c.ghsPictograms.join(', ')}` : '',
        ].filter(Boolean),
      });
    }
    for (const m of materialReceipts) {
      out.push({
        id: `mat:${m.id}`,
        source: 'materials',
        code: m.internalRollCode || m.receiptNumber,
        name: `${m.paperType || m.itemName || 'Material'} ${m.gsm || ''}`.trim(),
        badge: (m.materialKind || 'PAPER').toUpperCase(),
        details: [
          m.supplierName ? `Supplier: ${m.supplierName}` : '',
          m.supplierBatchNumber ? `Batch ${m.supplierBatchNumber}` : '',
          m.quantityAvailable ? `Qty ${m.quantityAvailable} ${m.quantityUnit || ''}` : '',
          m.storageLocation ? `📍 ${m.storageLocation}` : '',
        ].filter(Boolean),
      });
    }
    for (const f of finishedGoodsStock) {
      out.push({
        id: `fg:${f.id}`,
        source: 'finished',
        code: f.stockNumber || f.id,
        name: f.productName || 'Finished stock',
        badge: 'FINISHED',
        details: [
          f.clientName ? `Client: ${f.clientName}` : '',
          f.jobNumber ? `Job ${f.jobNumber}` : '',
          `Qty ${f.quantityAvailable} ${f.quantityUnit || 'units'}`,
          f.storageLocation ? `📍 ${f.storageLocation}` : '',
        ].filter(Boolean),
      });
    }
    for (const t of tooling) {
      if (!t.active) continue;
      const dimText = t.dimensions
        ? `${t.dimensions.widthMm}×${t.dimensions.heightMm}×${t.dimensions.depthMm}mm`
        : '';
      out.push({
        id: `tool:${t.id}`,
        source: 'tooling',
        code: t.code,
        name: t.name,
        badge: (t.toolType === 'die' ? 'DIE' : 'STEREO'),
        details: [
          t.clientName ? `Client: ${t.clientName}` : '',
          t.toolType === 'die' && dimText ? dimText : '',
          t.toolType === 'stereo' && t.designVersion ? `v${t.designVersion}` : '',
          t.location === 'External' && t.supplierName ? `At: ${t.supplierName}` : '',
          t.location === 'Internal' && t.internalLocation ? `📍 ${t.internalLocation}` : '',
        ].filter(Boolean),
      });
    }
    return out;
  }, [spareParts, chemicalRegisterEntries, materialReceipts, finishedGoodsStock, tooling]);

  // ---- Filter to the selected source + search ----------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCandidates.filter((c) => {
      if (source !== 'all' && c.source !== source) return false;
      if (q) {
        const hay = `${c.code} ${c.name} ${(c.details || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allCandidates, source, search]);

  function toggle(id: string) {
    setSelectedIds((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handlePrint() {
    const candidatesById = new Map(allCandidates.map((c) => [c.id, c]));
    const labels: LabelData[] = [];
    for (const id of selectedIds) {
      const c = candidatesById.get(id);
      if (!c) continue;
      const n = Math.max(1, Math.min(99, Number(copies[id]) || 1));
      for (let i = 0; i < n; i++) labels.push(c);
    }
    if (labels.length === 0) return;
    const html = buildLabelSheetHtml(labels, { size, brandName });
    const opened = openPrintWindow(html);
    if (!opened) {
      window.alert('Your browser blocked the print window. Allow pop-ups for this site and try again.');
    }
  }

  const sourceCounts = useMemo(() => ({
    all: allCandidates.length,
    spares: allCandidates.filter((c) => c.source === 'spares').length,
    chemicals: allCandidates.filter((c) => c.source === 'chemicals').length,
    materials: allCandidates.filter((c) => c.source === 'materials').length,
    finished: allCandidates.filter((c) => c.source === 'finished').length,
    tooling: allCandidates.filter((c) => c.source === 'tooling').length,
  }), [allCandidates]);

  const totalCopies = useMemo(() => {
    let n = 0;
    for (const id of selectedIds) n += Math.max(1, Number(copies[id]) || 1);
    return n;
  }, [selectedIds, copies]);

  return (
    <>
      <SectionTitle title="Labels" subtitle="Print scannable Code128 labels for any stockable item — spares, chemicals, materials, finished goods, dies, stereos. Default output goes through the browser print dialog so any OS-connected label printer (Zebra, Brother, Dymo, plain laser) just works." />

      <section className="card">
        <div className="form-grid">
          <label>
            <span>Label size</span>
            <select value={size} onChange={(e) => setSize(e.target.value as LabelSize)}>
              {LABEL_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <small className="muted">{LABEL_SIZES.find((s) => s.value === size)?.description || ''}</small>
          </label>
          <label>
            <span>Filter by register</span>
            <select value={source} onChange={(e) => { setSource(e.target.value as Source); setSelectedIds(new Set()); }}>
              <option value="all">All ({sourceCounts.all})</option>
              <option value="spares">Spares & consumables ({sourceCounts.spares})</option>
              <option value="chemicals">Chemicals ({sourceCounts.chemicals})</option>
              <option value="materials">Materials ({sourceCounts.materials})</option>
              <option value="finished">Finished goods ({sourceCounts.finished})</option>
              <option value="tooling">Dies & stereos ({sourceCounts.tooling})</option>
            </select>
          </label>
          <label>
            <span>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code, name, supplier, client" />
          </label>
        </div>

        <div className="form-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="ghost-button" onClick={selectAll} disabled={filtered.length === 0}>Select all filtered ({filtered.length})</button>
          <button className="ghost-button" onClick={clearSelection} disabled={selectedIds.size === 0}>Clear ({selectedIds.size})</button>
          <span className="muted" style={{ fontSize: '0.8rem' }}>{selectedIds.size} item(s), {totalCopies} label(s) total</span>
          <span style={{ flex: 1 }} />
          <button className="primary-button" onClick={handlePrint} disabled={selectedIds.size === 0}>Print labels</button>
        </div>
      </section>

      <section className="card">
        {filtered.length === 0 ? (
          <EmptyState title="Nothing to label" body="Pick a different register or clear the search." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Register</th>
                  <th>Details</th>
                  <th style={{ width: 70 }}>Copies</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const checked = selectedIds.has(c.id);
                  return (
                    <tr key={c.id} className={checked ? 'is-selected' : undefined}>
                      <td><input type="checkbox" checked={checked} onChange={() => toggle(c.id)} /></td>
                      <td><strong>{c.code}</strong></td>
                      <td>{c.name}</td>
                      <td>{c.source}</td>
                      <td className="table-subtext">{(c.details || []).join(' · ')}</td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          style={{ width: 56 }}
                          value={copies[c.id] ?? 1}
                          onChange={(e) => setCopies({ ...copies, [c.id]: Number(e.target.value) || 1 })}
                          disabled={!checked}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
