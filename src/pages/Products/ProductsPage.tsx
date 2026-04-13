import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Product, ProductFilters, ProductFormState, Supplier } from '../../types';

interface ProductsPageProps {
  suppliers: Supplier[];
  canSeeSupplier: boolean;
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

  return (
    <>
      <SectionTitle
        title="Products"
        subtitle="Define what you make, what you buy in, and how each product behaves in the system."
        action={
          mode === 'list' ? (
            <button className="secondary-button" onClick={handleStartCreate}>Add New Product</button>
          ) : (
            <button className="ghost-button" onClick={handleBackToList}>Back to Products</button>
          )
        }
      />
      {mode === 'form' ? (
        <section className="card form-card">
          <div className="card-header"><h3>{productEditingId ? 'Edit product' : 'New product'}</h3></div>
          {productMessage ? <div className="message-strip">{productMessage}</div> : null}
          <div className="form-grid">
            <label><span>Name</span><input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
            <label><span>SKU</span><input value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} /></label>
            <label><span>Category</span><select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value as Product['category'] })}><option>Paper Bags</option><option>Paper Cups</option><option>Food Boxes</option><option>Wet Wipes</option><option>Other Packaging</option></select></label>
            <label><span>Supply type</span><select value={productForm.supplyType} onChange={(event) => setProductForm({ ...productForm, supplyType: event.target.value as Product['supplyType'] })}><option>Manufactured</option><option>Purchased</option></select></label>
            {canSeeSupplier && <label><span>Preferred supplier</span><select value={productForm.defaultSupplierId} onChange={(event) => setProductForm({ ...productForm, defaultSupplierId: event.target.value })}><option value="">No preferred supplier</option>{suppliers.filter((supplier) => supplier.active).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>}
            <label><span>Default unit</span><select value={productForm.defaultUnit} onChange={(event) => setProductForm({ ...productForm, defaultUnit: event.target.value as Product['defaultUnit'] })}><option>units</option><option>kg</option><option>rolls</option><option>sheets</option></select></label>
            <label><span>Default paper type</span><input value={productForm.defaultPaperType} onChange={(event) => setProductForm({ ...productForm, defaultPaperType: event.target.value })} /></label>
            <label><span>Default GSM</span><input value={productForm.defaultGsm} onChange={(event) => setProductForm({ ...productForm, defaultGsm: event.target.value })} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={productForm.brandingAllowed} onChange={(event) => setProductForm({ ...productForm, brandingAllowed: event.target.checked })} />Branding allowed</label>
            <label className="checkbox-row"><input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} />Active</label>
            <label className="full-span"><span>Notes</span><textarea value={productForm.notes} onChange={(event) => setProductForm({ ...productForm, notes: event.target.value })} /></label>
          </div>
          <div className="button-row"><button className="primary-button" onClick={onSave}>{productEditingId ? 'Save Changes' : 'Save Product'}</button>{productEditingId ? <button className="ghost-button" onClick={onDelete}>Delete Product</button> : null}<button className="ghost-button" onClick={handleBackToList}>Cancel</button></div>
        </section>
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
