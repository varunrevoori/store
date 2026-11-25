import { Modal } from '@/components/ui/Modal';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { FormEvent, useEffect, useState } from 'react';

type Mode = 'service' | 'product';

export type CatalogProductEdit = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  min: number;
  cost: number;
  supplier: string;
  unit: string;
  price: number;
  description?: string;
};

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onCreated: () => void;
  editProduct?: CatalogProductEdit | null;
};

export function AddCatalogItemModal({ open, mode, onClose, onCreated, editProduct }: Props) {
  const isEdit = mode === 'product' && !!editProduct?.id;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(mode === 'product' ? 'Retail' : 'Hair');
  const [durationMin, setDurationMin] = useState('30');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      setName(editProduct.name);
      setPrice(String(editProduct.price ?? ''));
      setCategory(editProduct.category || 'Retail');
      setSku(editProduct.sku ?? '');
      setStock(String(editProduct.stock ?? 0));
      setMinStock(String(editProduct.min ?? 0));
      setCost(String(editProduct.cost ?? ''));
      setSupplier(editProduct.supplier ?? '');
      setUnit(editProduct.unit ?? '');
      setDescription(editProduct.description ?? '');
    } else {
      setName('');
      setPrice('');
      setDescription('');
      setCategory(mode === 'product' ? 'Retail' : 'Hair');
      setSku('');
      setStock('0');
      setMinStock('5');
      setCost('');
      setSupplier('');
      setUnit('');
      setDurationMin('30');
    }
    setError(null);
  }, [open, editProduct, mode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body: Record<string, unknown> = {
      itemType: mode === 'product' ? 'PRODUCT' : 'SERVICE',
      name: name.trim(),
      price: Number(price) || 0,
      category: category.trim(),
      description: description.trim(),
    };
    if (mode === 'service') {
      body.durationHours = (Number(durationMin) || 30) / 60;
    } else {
      body.sku = sku.trim();
      body.stock = Number(stock) || 0;
      body.minStock = Number(minStock) || 0;
      body.cost = Number(cost) || 0;
      body.supplier = supplier.trim();
      body.unit = unit.trim();
    }

    const res = await apiFetch(
      isEdit ? `/catalog/${editProduct!.id}` : '/catalog',
      { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(body) },
    );
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    invalidateApiCache();
    onCreated();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit product' : `Add ${mode === 'product' ? 'product' : 'service'}`}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="catalog-add-form" className="btn-primary" disabled={loading}>
            {isEdit ? 'Update' : 'Save'}
          </button>
        </>
      }
    >
      <form id="catalog-add-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="lbl">Title</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lbl">Price (₹)</label>
            <input
              className="inp"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="lbl">Category</label>
            <input className="inp" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>
        {mode === 'service' ? (
          <div>
            <label className="lbl">Duration (minutes)</label>
            <input
              className="inp"
              type="number"
              min={15}
              step={15}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="lbl">SKU</label>
              <input className="inp" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div>
              <label className="lbl">Stock</label>
              <input className="inp" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <div>
              <label className="lbl">Reorder min</label>
              <input className="inp" type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
            </div>
            <div>
              <label className="lbl">Cost (₹)</label>
              <input className="inp" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="lbl">Supplier</label>
              <input className="inp" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
            <div>
              <label className="lbl">Unit</label>
              <input className="inp" placeholder="250 ml" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
        )}
        <div>
          <label className="lbl">Description</label>
          <textarea className="inp" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error ? <p className="text-[13px] text-hot">{error}</p> : null}
      </form>
    </Modal>
  );
}