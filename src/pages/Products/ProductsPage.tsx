import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import { CostProfile, PaperRate, PricingTier, Product, ProductFilters, ProductFormState, Supplier } from '../../types';
import { formatNumber } from '../../utils/calculations';
import { computeProductPricing, formToPricingSpec } from '../../utils/productPricing';

interface ProductsPageProps {
  suppliers: Supplier[];
  canSeeSupplier: boolean;
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  pricingTiers: PricingTier[];
  productForm: ProductFormState;
  setProductForm: (value: ProductFormState) => void;
  productEditingId: string | null;
  productMessage: string;
  onSave: () => void;
  onReset: () => void;
  productFilters: ProductFilters;
  setProductFilters: (value: ProductFilters) => void;
  filteredProducts: Product[];
  onEdit: (product: Product) => void;
  onDelete: () => void;
  /** Phase 83 — jump to the Cost Inputs page so the user can populate
   *  PaperRate / CostProfile masters when they're empty. */
  onOpenCostInputs?: () => void;
}

export function ProductsPage({
  suppliers,
  canSeeSupplier,
  paperRates,
  costProfiles,
  pricingTiers,
  productForm,
  setProductForm,
  productEditingId,
  productMessage,
  onSave,
  onReset,
  productFilters,
  setProductFilters,
  filteredProducts,
  onEdit,
  onDelete,
  onOpenCostInputs,
}: ProductsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (productEditingId) {
      setMode('form');
    }
  }, [productEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(product: Product) {
    onEdit(product);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const supplierOptions: ComboboxOption[] = useMemo(
    () =>
      suppliers.filter((supplier) => supplier.active).map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
        sublabel: supplier.supplierType,
      })),
    [suppliers],
  );

  // Live cost-plus preview computed from the same engine the Price List uses.
  // Phase 84 — force the print-related inputs to no-print before the engine
  // sees them. Products in our model are always unprinted stock; the
  // Calculator handles branded work per-quote, and we don't want a stale
  // print value left over on an old product to contaminate the preview.
  const pricingPreview = useMemo(() => {
    if (!productForm.pricingEnabled) return null;
    const noPrintForm = {
      ...productForm,
      printMethod: 'Plain' as const,
      colors: '0',
      printAreaCm2: '',
      coverageBand: 'None' as const,
    };
    return computeProductPricing(formToPricingSpec(noPrintForm), { paperRates, costProfiles, pricingTiers });
  }, [productForm, paperRates, costProfiles, pricingTiers]);

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Product identity',
      subtitle: 'Name, SKU and what kind of product this is.',
      missingRequired: [
        ...(productForm.name.trim() ? [] : ['Name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Name <RequiredMarker /></span><input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
          <label><span>SKU</span><input value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} /></label>
          <label><span>Category</span><select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value as Product['category'] })}><option>Paper Bags</option><option>Paper Cups</option><option>Food Boxes</option><option>Wet Wipes</option><option>Other Packaging</option></select></label>
          <label><span>Supply type</span><select value={productForm.supplyType} onChange={(event) => setProductForm({ ...productForm, supplyType: event.target.value as Product['supplyType'] })}><option>Manufactured</option><option>Purchased</option></select></label>
          {canSeeSupplier && <label><span>Preferred supplier</span><Combobox options={supplierOptions} value={productForm.defaultSupplierId} onChange={(value) => setProductForm({ ...productForm, defaultSupplierId: value })} placeholder="Search suppliers…" emptyMessage="No matching suppliers" /></label>}
        </div>
      ),
    },
    {
      key: 'defaults',
      title: 'Specification',
      subtitle: 'Paper + dimensions live here once. Jobs, quotes, finished stock, and the pricing engine all pull from these fields — never re-enter them.',
      body: (
        <div className="form-grid">
          <label><span>Paper type</span><input value={productForm.defaultPaperType} onChange={(event) => setProductForm({ ...productForm, defaultPaperType: event.target.value })} placeholder="e.g. Kraft brown" /></label>
          <label><span>GSM</span><input value={productForm.defaultGsm} onChange={(event) => setProductForm({ ...productForm, defaultGsm: event.target.value })} placeholder="e.g. 80" /></label>
          <label><span>Bag width (mm)</span><input value={productForm.bagWidthMm} onChange={(event) => setProductForm({ ...productForm, bagWidthMm: event.target.value })} /></label>
          <label><span>Bag height (mm)</span><input value={productForm.bagHeightMm} onChange={(event) => setProductForm({ ...productForm, bagHeightMm: event.target.value })} /></label>
          <label><span>Gusset (mm)</span><input value={productForm.gussetMm} onChange={(event) => setProductForm({ ...productForm, gussetMm: event.target.value })} /></label>
          <label><span>Handle</span>
            <select value={productForm.handleType} onChange={(event) => setProductForm({ ...productForm, handleType: event.target.value as ProductFormState['handleType'] })}>
              <option>None</option><option>Flat Handle</option><option>Rope Handle</option><option>Roll Handle</option>
            </select>
          </label>
          <label><span>Base unit</span><select value={productForm.defaultUnit} onChange={(event) => setProductForm({ ...productForm, defaultUnit: event.target.value as Product['defaultUnit'] })}><option>units</option><option>kg</option><option>rolls</option><option>sheets</option><option>pieces</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={productForm.brandingAllowed} onChange={(event) => setProductForm({ ...productForm, brandingAllowed: event.target.checked })} />Can be branded (for custom quotes)</label>
          <label className="checkbox-row"><input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} />Active</label>
        </div>
      ),
    },
    {
      key: 'pricing',
      title: 'Margin & sale units',
      subtitle: 'Just the commercial knobs. Paper, dimensions, and handle come from the Specification section above. Paper cost will pull from Materials Receiving (the actual paid R/ton on your stock). Bag-making cost comes from the cost profile masters. Final unit price = (paper + bag-making) × (1 + margin). Calculations are stubbed for now — the form structure is what matters at this stage.',
      body: (
        <div className="form-grid">
          <label className="checkbox-row full-span">
            <input type="checkbox" checked={productForm.pricingEnabled} onChange={(event) => setProductForm({ ...productForm, pricingEnabled: event.target.checked })} />
            Price this product (show in the Price List)
          </label>
          {productForm.pricingEnabled && (
            <>
              <label><span>Margin %</span>
                <input value={productForm.baseMarginPercent} onChange={(event) => setProductForm({ ...productForm, baseMarginPercent: event.target.value })} placeholder="e.g. 35" />
              </label>

              <div className="full-span">
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #6f6657)', display: 'block', marginBottom: 8 }}>
                  How customers can buy it
                </span>
                {(productForm.salesUnits ?? []).length === 0 ? (
                  <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
                    No sale units yet. Add Pallet / Box / Bale / Case / Single — each with how many bags it contains so the customer can order "1 pallet" and the system knows that's 12,000 bags.
                  </p>
                ) : null}
                <table className="data-table" style={{ fontSize: 13 }}>
                  <thead><tr><th>Pack name</th><th style={{ width: 160 }}>Bags per pack</th><th>Notes</th><th style={{ width: 60 }}></th></tr></thead>
                  <tbody>
                    {(productForm.salesUnits ?? []).map((unit, idx) => (
                      <tr key={unit.id}>
                        <td>
                          <input
                            value={unit.name}
                            placeholder="Pallet / Box / Bale…"
                            onChange={(e) => {
                              const next = [...(productForm.salesUnits ?? [])];
                              next[idx] = { ...unit, name: e.target.value };
                              setProductForm({ ...productForm, salesUnits: next });
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={unit.quantityInBaseUnit || ''}
                            onChange={(e) => {
                              const next = [...(productForm.salesUnits ?? [])];
                              next[idx] = { ...unit, quantityInBaseUnit: Number(e.target.value) || 0 };
                              setProductForm({ ...productForm, salesUnits: next });
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={unit.notes ?? ''}
                            placeholder="e.g. brown shrink wrap"
                            onChange={(e) => {
                              const next = [...(productForm.salesUnits ?? [])];
                              next[idx] = { ...unit, notes: e.target.value };
                              setProductForm({ ...productForm, salesUnits: next });
                            }}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="table-button"
                            onClick={() => {
                              const next = (productForm.salesUnits ?? []).filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, salesUnits: next });
                            }}
                          >Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    const next = [...(productForm.salesUnits ?? []), {
                      id: `su-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
                      name: '',
                      quantityInBaseUnit: 0,
                      notes: '',
                    }];
                    setProductForm({ ...productForm, salesUnits: next });
                  }}
                >+ Add sale unit</button>
              </div>

              <p className="muted full-span" style={{ fontSize: 12 }}>
                Paper cost will pull from <strong>Materials Receiving</strong> (the actual paid R/ton on
                your paper stock) once that's wired in. Bag-making cost comes from a single
                cost-profile master. There's no need to re-enter dimensions or paper here — they're
                in the Specification section above.
              </p>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      subtitle: 'Anything sales or production should know about this product.',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={productForm.notes} onChange={(event) => setProductForm({ ...productForm, notes: event.target.value })} /></label>
          <div className="full-span">
            <PhotoUploader
              urls={productForm.photoUrls ?? []}
              onChange={(urls) => setProductForm({ ...productForm, photoUrls: urls })}
              recordType="products"
              recordId={productEditingId || `draft-${Date.now()}`}
              label="Product photos (artwork, dieline, finished sample)"
              max={6}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        backAction={mode === 'form' ? <button className="ghost-button" onClick={handleBackToList}>Back to Products</button> : null}

        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Product</button>
          ) : null
}
      />
      {mode === 'form' ? (
        <FormWizard
          title={productEditingId ? 'Edit product' : 'New product'}
          subtitle="Required fields are marked. Sections complete as you fill them in."
          message={productMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!productEditingId}
          saveLabel="Save Product"
          footerExtra={productEditingId ? (
            <button className="ghost-button" onClick={onDelete}>Delete Product</button>
          ) : undefined}
        />
      ) : (
        <section className="card">
          <SectionTitle title="Product register" subtitle={`${filteredProducts.length} record(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={productFilters.search} onChange={(event) => setProductFilters({ ...productFilters, search: event.target.value })} /></label>
            <label><span>Category</span><select value={productFilters.category} onChange={(event) => setProductFilters({ ...productFilters, category: event.target.value })}><option value="">All</option><option>Paper Bags</option><option>Paper Cups</option><option>Food Boxes</option><option>Wet Wipes</option><option>Other Packaging</option></select></label>
            <label><span>Supply type</span><select value={productFilters.supplyType} onChange={(event) => setProductFilters({ ...productFilters, supplyType: event.target.value })}><option value="">All</option><option>Manufactured</option><option>Purchased</option></select></label>
            <label><span>Active</span><select value={productFilters.active} onChange={(event) => setProductFilters({ ...productFilters, active: event.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
          </div>
          {filteredProducts.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Category</th><th>Supply</th>{canSeeSupplier && <th>Preferred supplier</th>}<th>Branding</th><th>Unit</th><th>Actions</th></tr></thead>
                <tbody>{filteredProducts.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><div className="table-subtext">{product.sku || 'No SKU'}</div></td><td>{product.category}</td><td>{product.supplyType}</td>{canSeeSupplier && <td>{product.defaultSupplierName || 'Not set'}</td>}<td>{product.brandingAllowed ? 'Yes' : 'No'}</td><td>{product.defaultUnit}</td><td><button className="table-button" aria-label={`Edit ${product.name}`} onClick={() => handleStartEdit(product)}></button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No products yet" body="Add your product catalog so jobs and pricing can reference it." />}
        </section>
      )}
    </>
  );
}
