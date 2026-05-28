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
  const pricingPreview = useMemo(
    () =>
      productForm.pricingEnabled
        ? computeProductPricing(formToPricingSpec(productForm), { paperRates, costProfiles, pricingTiers })
        : null,
    [productForm, paperRates, costProfiles, pricingTiers],
  );

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
      title: 'Defaults & specification',
      subtitle: 'Sensible defaults so jobs and quotes pre-fill correctly.',
      body: (
        <div className="form-grid">
          <label><span>Default unit</span><select value={productForm.defaultUnit} onChange={(event) => setProductForm({ ...productForm, defaultUnit: event.target.value as Product['defaultUnit'] })}><option>units</option><option>kg</option><option>rolls</option><option>sheets</option></select></label>
          <label><span>Default paper type</span><input value={productForm.defaultPaperType} onChange={(event) => setProductForm({ ...productForm, defaultPaperType: event.target.value })} /></label>
          <label><span>Default GSM</span><input value={productForm.defaultGsm} onChange={(event) => setProductForm({ ...productForm, defaultGsm: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={productForm.brandingAllowed} onChange={(event) => setProductForm({ ...productForm, brandingAllowed: event.target.checked })} />Branding allowed</label>
          <label className="checkbox-row"><input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} />Active</label>
        </div>
      ),
    },
    {
      key: 'pricing',
      title: 'Standard pricing',
      subtitle: 'Save a spec here and the Price List computes a cost-plus price from your live paper + cost inputs — adjust the margin and it recalculates.',
      missingRequired: productForm.pricingEnabled
        ? [
            ...(productForm.paperRateId ? [] : ['Paper rate']),
            ...(productForm.costProfileId ? [] : ['Cost profile']),
          ]
        : [],
      body: (
        <div className="form-grid">
          <label className="checkbox-row full-span">
            <input type="checkbox" checked={productForm.pricingEnabled} onChange={(event) => setProductForm({ ...productForm, pricingEnabled: event.target.checked })} />
            Price this product (show in the Price List)
          </label>
          {productForm.pricingEnabled && (
            <>
              <label><span>Paper rate <RequiredMarker /></span>
                <select value={productForm.paperRateId} onChange={(event) => setProductForm({ ...productForm, paperRateId: event.target.value })}>
                  <option value="">Select paper…</option>
                  {paperRates.filter((rate) => rate.active).map((rate) => (
                    <option key={rate.id} value={rate.id}>{rate.name} · {rate.paperType} {rate.gsm}gsm · R{formatNumber(rate.pricePerTon, 0)}/t</option>
                  ))}
                </select>
              </label>
              <label><span>Cost profile <RequiredMarker /></span>
                <select value={productForm.costProfileId} onChange={(event) => setProductForm({ ...productForm, costProfileId: event.target.value })}>
                  <option value="">Select profile…</option>
                  {costProfiles.filter((profile) => profile.active).map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select>
              </label>
              <label><span>Bag width (mm)</span><input value={productForm.bagWidthMm} onChange={(event) => setProductForm({ ...productForm, bagWidthMm: event.target.value })} /></label>
              <label><span>Bag height (mm)</span><input value={productForm.bagHeightMm} onChange={(event) => setProductForm({ ...productForm, bagHeightMm: event.target.value })} /></label>
              <label><span>Gusset (mm)</span><input value={productForm.gussetMm} onChange={(event) => setProductForm({ ...productForm, gussetMm: event.target.value })} /></label>
              <label><span>Handle</span>
                <select value={productForm.handleType} onChange={(event) => setProductForm({ ...productForm, handleType: event.target.value as ProductFormState['handleType'] })}>
                  <option>None</option><option>Flat Handle</option><option>Rope Handle</option><option>Roll Handle</option>
                </select>
              </label>
              <label><span>Print method</span>
                <select value={productForm.printMethod} onChange={(event) => setProductForm({ ...productForm, printMethod: event.target.value as ProductFormState['printMethod'] })}>
                  <option>Plain</option><option>Auto</option><option>Screen Print</option><option>Flexo</option><option>Digital Print</option><option>Litho</option>
                </select>
              </label>
              <label><span>Colours</span><input value={productForm.colors} onChange={(event) => setProductForm({ ...productForm, colors: event.target.value })} /></label>
              <label><span>Print area (cm²)</span><input value={productForm.printAreaCm2} onChange={(event) => setProductForm({ ...productForm, printAreaCm2: event.target.value })} /></label>
              <label><span>Coverage</span>
                <select value={productForm.coverageBand} onChange={(event) => setProductForm({ ...productForm, coverageBand: event.target.value as ProductFormState['coverageBand'] })}>
                  <option>None</option><option>Light</option><option>Medium</option><option>Heavy</option>
                </select>
              </label>
              <label><span>Plate billing</span>
                <select value={productForm.plateBilling} onChange={(event) => setProductForm({ ...productForm, plateBilling: event.target.value as ProductFormState['plateBilling'] })}>
                  <option value="amortized">Amortised into unit price</option>
                  <option value="upfront">Billed upfront</option>
                </select>
              </label>
              <label><span>Base margin (%)</span><input value={productForm.baseMarginPercent} onChange={(event) => setProductForm({ ...productForm, baseMarginPercent: event.target.value })} placeholder="e.g. 35" /></label>
              <label><span>Base quantity</span><input value={productForm.baseQuantity} onChange={(event) => setProductForm({ ...productForm, baseQuantity: event.target.value })} /></label>
              <label className="full-span"><span>MOQ break quantities (comma-separated)</span><input value={productForm.breakQuantities} onChange={(event) => setProductForm({ ...productForm, breakQuantities: event.target.value })} placeholder="5000, 10000, 25000" /></label>
              {pricingPreview ? (
                pricingPreview.ok ? (
                  <div className="full-span">
                    <h4 className="accounting-group-head"><span className="sars-tag">Live price preview</span></h4>
                    <table className="data-table">
                      <thead><tr><th>Quantity</th><th style={{ textAlign: 'right' }}>Unit cost</th><th style={{ textAlign: 'right' }}>Unit price</th><th style={{ textAlign: 'right' }}>Margin</th><th style={{ textAlign: 'right' }}>Plate setup</th></tr></thead>
                      <tbody>
                        {pricingPreview.breaks.map((row) => (
                          <tr key={row.quantity}>
                            <td>{formatNumber(row.quantity, 0)}</td>
                            <td style={{ textAlign: 'right' }}>R {formatNumber(row.unitCost, 4)}</td>
                            <td style={{ textAlign: 'right' }}><strong>R {formatNumber(row.unitPrice, 4)}</strong></td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(row.marginPercent, 1)}%</td>
                            <td style={{ textAlign: 'right' }}>{row.plateSetupFee ? `R ${formatNumber(row.plateSetupFee, 2)}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="muted" style={{ fontSize: '0.72rem' }}>Preview uses live cost inputs. Approve a version on the Price List to lock the price + assumptions.</p>
                  </div>
                ) : (
                  <p className="muted full-span">{pricingPreview.reason}</p>
                )
              ) : null}
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
        backAction={mode === 'form' ? <button className="ghost-button" onClick={handleBackToList}>← Back to Products</button> : null}

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
                <tbody>{filteredProducts.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><div className="table-subtext">{product.sku || 'No SKU'}</div></td><td>{product.category}</td><td>{product.supplyType}</td>{canSeeSupplier && <td>{product.defaultSupplierName || 'Not set'}</td>}<td>{product.brandingAllowed ? 'Yes' : 'No'}</td><td>{product.defaultUnit}</td><td><button className="table-button" aria-label={`Edit ${product.name}`} onClick={() => handleStartEdit(product)}>✎</button></td></tr>)}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No products yet" body="Add your product catalog so jobs and pricing can reference it." />}
        </section>
      )}
    </>
  );
}
