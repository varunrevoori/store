import { SearchField } from '@/components/ui/SearchField';
import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { AddCatalogItemModal, type CatalogProductEdit } from '@/features/catalog/AddCatalogItemModal';
import { Modal } from '@/components/ui/Modal';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { useTenant } from '@/context/TenantContext';
import { useFetch } from '@/hooks/useFetch';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { inr } from '@/lib/format';
import { PackagePlus, Pencil, Trash2 } from 'lucide-react';

type Product = CatalogProductEdit;

function stockStatus(p: Product): 'out' | 'low' | 'ok' {
  if (p.stock <= 0) return 'out';
  if (p.stock < p.min) return 'low';
  return 'ok';
}

function stockLabel(status: ReturnType<typeof stockStatus>) {
  if (status === 'out') return 'Out of stock';
  if (status === 'low') return 'Low';
  return 'In stock';
}

export function InventoryPage() {
  const { ready, role } = useTenant();
  const canManage = role === 'owner' || role === 'manager';
  const [reloadKey, setReloadKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const { data, loading, error } = useFetch<{
    products: Product[];
    lowStock: Product[];
    stockValue: number;
  }>(ready ? 'inventory' : '', [ready, reloadKey]);

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  function openAdd() {
    setEditProduct(null);
    setAddOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setAddOpen(true);
  }

  function closeModal() {
    setAddOpen(false);
    setEditProduct(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await apiFetch(`/catalog/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setDeleteError(j?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    invalidateApiCache();
    setDeleteTarget(null);
    refresh();
  }

  const products = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.products;
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        (p.supplier ?? '').toLowerCase().includes(needle),
    );
  }, [data, q]);

  if (loading) return <PageLoading label="Loading inventory…" />;
  if (error || !data) return <PageError>Could not load inventory.</PageError>;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${data.products.length} products · stock value ${inr(data.stockValue)}`}
        actions={
          canManage ? (
            <button type="button" className="btn-primary" onClick={openAdd}>
              <PackagePlus size={16} />
              Add product
            </button>
          ) : null
        }
      />

      <div className="page-search-row">
        <SearchField
          value={q}
          onChange={setQ}
          placeholder="Search product, SKU, supplier…"
          aria-label="Search inventory"
        />
      </div>

      {data.lowStock.length ? (
        <Card className="mb-4 border-hot/30 form-alert-error">
          <p className="text-[13px] font-semibold text-hot">Reorder needed</p>
          <p className="text-[12px] text-secondary mt-1">
            {data.lowStock.length} below minimum — {data.lowStock.map((p) => p.name).join(', ')}
          </p>
        </Card>
      ) : null}

      <Card padding={false} className="tbl-card">
        {products.length === 0 ? (
          <div className="tbl-empty">
            <p className="font-semibold text-ink">{q.trim() ? 'No matches' : 'No products yet'}</p>
            <p className="text-[13px] text-muted mt-1">
              {q.trim() ? 'Try another name or SKU.' : 'Add retail items to track stock and cost.'}
            </p>
            {canManage ? (
              <button type="button" className="btn-primary mt-4" onClick={openAdd}>
                Add product
              </button>
            ) : null}
          </div>
        ) : (
          <div className="tbl-scroll">
            <table className="tbl tbl-inventory">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Min</th>
                  <th>Status</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Sell</th>
                  <th>Supplier</th>
                  {canManage ? <th className="tbl-th-actions">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const status = stockStatus(p);
                  const fill =
                    p.min > 0 ? Math.min(100, Math.round((p.stock / Math.max(p.min, 1)) * 50)) : 100;
                  return (
                    <tr key={p.id} className={status !== 'ok' ? 'tbl-row-alert' : undefined}>
                      <td>
                        <div className="font-semibold text-ink">{p.name}</div>
                        {p.unit ? <div className="text-[11.5px] text-muted mt-0.5">{p.unit}</div> : null}
                      </td>
                      <td>
                        <span className="tbl-mono text-muted">{p.sku || '—'}</span>
                      </td>
                      <td className="text-secondary">{p.category || '—'}</td>
                      <td className="text-right tabular-nums font-semibold">{p.stock}</td>
                      <td className="text-right tabular-nums text-muted">{p.min}</td>
                      <td>
                        <div className="flex flex-col gap-1.5 min-w-[7.5rem]">
                          <span className={`stock-chip stock-${status}`}>{stockLabel(status)}</span>
                          <div className="tbl-stock-bar" title={`${p.stock} / min ${p.min}`}>
                            <span className={`tbl-stock-fill stock-${status}`} style={{ width: `${fill}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="text-right tabular-nums text-secondary">{inr(p.cost)}</td>
                      <td className="text-right tabular-nums font-medium">{inr(p.price)}</td>
                      <td className="text-secondary max-w-[10rem] truncate" title={p.supplier}>
                        {p.supplier || '—'}
                      </td>
                      {canManage ? (
                        <td className="tbl-td-actions">
                          <div className="tbl-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit"
                              aria-label={`Edit ${p.name}`}
                              onClick={() => openEdit(p)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn-danger"
                              title="Delete"
                              aria-label={`Delete ${p.name}`}
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(p);
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddCatalogItemModal
        open={addOpen}
        mode="product"
        editProduct={editProduct}
        onClose={closeModal}
        onCreated={refresh}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete product"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-ghost" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary !bg-hot" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        {deleteTarget ? (
          <>
            <p className="text-[13px] text-secondary">
              Remove <span className="font-semibold text-ink">{deleteTarget.name}</span> from inventory? This cannot be
              undone. Past appointments keep their history; the catalog link is cleared.
            </p>
            {deleteError ? <p className="text-[13px] text-hot mt-3">{deleteError}</p> : null}
          </>
        ) : null}
      </Modal>
    </div>
  );
}