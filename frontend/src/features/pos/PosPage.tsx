import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { AddCatalogItemModal } from '@/features/catalog/AddCatalogItemModal';
import { CustomerPicker, type PickedCustomer } from '@/features/customers/CustomerPicker';
import { WalkInCustomerFields } from '@/features/customers/WalkInCustomerFields';
import { useTenant } from '@/context/TenantContext';
import { useFetch } from '@/hooks/useFetch';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { inr } from '@/lib/format';
import { SearchField } from '@/components/ui/SearchField';
import { Package, Plus, Scissors, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const CAT_COLORS: Record<string, string> = {
  Hair: '#3598CB',
  Skin: '#12A594',
  Makeup: '#7B5CFF',
  Nails: '#D13095',
  Grooming: '#F07B3F',
  Retail: '#D99A00',
  General: '#3598CB',
};

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  meta?: string;
  description?: string;
  kind: 'service' | 'product';
};

type CartLine = CatalogItem & { qty: number };

type PosShelf = 'services' | 'store';

type PosData = {
  services: CatalogItem[];
  retail: CatalogItem[];
  invoiceNo: number;
  gstin: string;
};

type StaffData = { staff: { id: string; name: string }[] };

const SERVICE_CATS = ['All', 'Hair', 'Skin', 'Makeup', 'Nails', 'Grooming'] as const;

export function PosPage() {
  const { ready, branchId, branches, orgName, role } = useTenant();
  const branchName = branches.find((b) => b.id === branchId)?.name ?? 'Branch';
  const canManage = role === 'owner' || role === 'manager';

  const path = branchId ? `pos/catalog?branchId=${encodeURIComponent(branchId)}` : '';
  const [reloadKey, setReloadKey] = useState(0);
  const { data, loading, error } = useFetch<PosData>(path, [ready, branchId, reloadKey]);
  const { data: staffData } = useFetch<StaffData>(
    branchId ? `staff?branchId=${encodeURIComponent(branchId)}` : '',
    [ready, branchId],
  );

  const [shelf, setShelf] = useState<PosShelf>('services');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickedCustomer, setPickedCustomer] = useState<PickedCustomer | null>(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [stylistId, setStylistId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [pay, setPay] = useState<'upi' | 'card' | 'cash'>('upi');
  const [addSvc, setAddSvc] = useState(false);
  const [addProduct, setAddProduct] = useState(false);
  const [charged, setCharged] = useState(false);
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);

  const services = useMemo(
    () => (data?.services ?? []).map((s) => ({ ...s, kind: 'service' as const })),
    [data],
  );
  const products = useMemo(
    () => (data?.retail ?? []).map((p) => ({ ...p, kind: 'product' as const })),
    [data],
  );

  const categoryTabs = useMemo(() => {
    if (shelf === 'store') {
      const cats = new Set(products.map((p) => p.category || 'Retail'));
      return ['All', ...Array.from(cats).sort()];
    }
    return [...SERVICE_CATS];
  }, [shelf, products]);

  useEffect(() => {
    if (!categoryTabs.includes(cat)) setCat('All');
  }, [categoryTabs, cat]);

  const items = useMemo(() => {
    const source = shelf === 'services' ? services : products;
    return source.filter((i) => {
      const matchCat = cat === 'All' || i.category === cat;
      const matchQ = !q.trim() || i.name.toLowerCase().includes(q.toLowerCase());
      return matchCat && matchQ;
    });
  }, [shelf, services, products, cat, q]);

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const discAmt = Math.round(subtotal * (discount / 100));
  const taxable = subtotal - discAmt;
  const cgst = Math.round(taxable * 0.09);
  const total = taxable + cgst * 2;

  const retailIdSet = useMemo(() => new Set(data?.retail.map((r) => r.id) ?? []), [data]);

  function addItem(item: CatalogItem) {
    setCart((c) => {
      const hit = c.find((x) => x.id === item.id);
      if (hit) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...item, qty: 1 }];
    });
  }

  async function recordCharge() {
    if (!branchId || !cart.length) return;
    if (!pickedCustomer) {
      const name = walkInName.trim();
      const phone = walkInPhone.trim();
      if (!name || !phone) {
        setChargeError('Select an existing customer or enter new walk-in name and mobile.');
        return;
      }
    }
    setCharging(true);
    setChargeError(null);
    const res = await apiFetch('/pos/charge', {
      method: 'POST',
      body: JSON.stringify({
        branchId,
        customerId: pickedCustomer?.id,
        customerPhone: pickedCustomer?.phone ?? (walkInPhone.trim() || undefined),
        customerName: pickedCustomer?.name || walkInName.trim() || 'Walk-in',
        newCustomer: pickedCustomer
          ? undefined
          : {
              fullName: walkInName.trim(),
              phone: walkInPhone.trim(),
              email: walkInEmail.trim() || undefined,
              branchId,
            },
        stylistId: stylistId || undefined,
        discountPercent: discount,
        paymentMethod: pay,
        lines: cart.map((l) => ({
          catalogItemId: l.id,
          name: l.name,
          price: l.price,
          qty: l.qty,
          itemType: retailIdSet.has(l.id) ? 'PRODUCT' : 'SERVICE',
        })),
      }),
    });
    setCharging(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setChargeError(j?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    invalidateApiCache();
    setCharged(true);
  }

  function qty(id: string, delta: number) {
    setCart((c) =>
      c
        .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0),
    );
  }

  if (loading) return <p className="text-[13px] text-muted">Loading POS…</p>;
  if (error || !data) return <p className="text-[13px] text-hot">Could not load POS.</p>;

  return (
    <div>
      <PageHeader
        title="POS & Billing"
        subtitle={
          <>
            Invoice <strong className="text-ink">INV-{data.invoiceNo}</strong> · {branchName}
            {data.gstin ? ` · GSTIN ${data.gstin}` : ''}
          </>
        }
        actions={
          <>
            {canManage ? (
              shelf === 'services' ? (
                <button type="button" className="btn-ghost" onClick={() => setAddSvc(true)}>
                  <Plus size={16} />
                  Add service
                </button>
              ) : (
                <button type="button" className="btn-ghost" onClick={() => setAddProduct(true)}>
                  <Package size={16} />
                  Add store item
                </button>
              )
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_410px] gap-5" style={{ minHeight: 'calc(100vh - 190px)' }}>
        <Card className="p-5 flex flex-col min-h-0">
          <div className="tabs pos-shelf-tabs mb-3">
            <button
              type="button"
              className={shelf === 'services' ? 'on' : ''}
              onClick={() => {
                setShelf('services');
                setCat('All');
              }}
            >
              <Scissors size={14} className="inline mr-1.5 -mt-0.5" />
              Services
            </button>
            <button
              type="button"
              className={shelf === 'store' ? 'on' : ''}
              onClick={() => {
                setShelf('store');
                setCat('All');
              }}
            >
              <Package size={14} className="inline mr-1.5 -mt-0.5" />
              Store / materials
            </button>
          </div>
          <p className="text-[12px] text-muted mb-3 leading-snug">
            {shelf === 'services'
              ? 'Chair services only — hair, skin, nails, etc.'
              : 'Retail & back-bar stock from Inventory. Add items under Inventory → Add product, not Add service.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="page-search-row page-search-row-wide">
              <SearchField
                value={q}
                onChange={setQ}
                placeholder={shelf === 'services' ? 'Search services…' : 'Search store items…'}
                aria-label={shelf === 'services' ? 'Search services' : 'Search store items'}
              />
            </div>
            <div className="tabs flex-wrap">
              {categoryTabs.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cat === c ? 'on' : ''}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 mt-4 flex-1 content-start">
            {items.length === 0 ? (
              <p className="text-[13px] text-muted col-span-full py-8 text-center">
                {shelf === 'store'
                  ? 'No store items yet. Add products from Inventory or “Add store item”.'
                  : 'No services in this category.'}
              </p>
            ) : null}
            {items.map((item) => {
              const color =
                item.kind === 'product'
                  ? (CAT_COLORS.Retail ?? '#D99A00')
                  : (CAT_COLORS[item.category] ?? '#3598CB');
              const inCart = cart.find((l) => l.id === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`pos-item ${item.kind === 'product' ? 'pos-item-retail' : ''}`}
                  style={{ '--c': color } as React.CSSProperties}
                  onClick={() => addItem(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="pos-ic">
                      {item.kind === 'product' ? <Package size={18} /> : <Plus size={18} />}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`chip text-[10px] !py-0.5 ${item.kind === 'product' ? 'st-confirmed' : ''}`}
                        style={
                          item.kind === 'service'
                            ? { background: 'rgba(53,152,203,.12)', color: '#2a7ba8' }
                            : undefined
                        }
                      >
                        {item.kind === 'product' ? 'Store' : 'Service'}
                      </span>
                      {inCart ? <span className="chip st-confirmed">×{inCart.qty}</span> : null}
                    </div>
                  </div>
                  <div className="mt-3 text-[13px] font-semibold text-ink leading-snug line-clamp-2 min-h-[36px]">
                    {item.name}
                  </div>
                  {item.description ? (
                    <div className="text-[11px] text-secondary mt-1 line-clamp-2">{item.description}</div>
                  ) : null}
                  <div className="flex items-end justify-between mt-1.5">
                    <span className="text-[11.5px] text-muted">{item.meta ?? '—'}</span>
                    <span className="font-display font-bold text-[15px] text-ink">{inr(item.price)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-2">
            <div className="card-t">Current bill</div>
            <div className="flex items-center gap-2">
              <span className="chip st-confirmed">{cart.reduce((s, l) => s + l.qty, 0)} items</span>
              {cart.length > 0 ? (
                <button
                  type="button"
                  className="text-[12px] text-muted hover:text-ink font-medium"
                  onClick={() => {
                    setCart([]);
                    setDiscount(0);
                    setPickedCustomer(null);
                    setWalkInName('');
                    setWalkInPhone('');
                    setWalkInEmail('');
                    setStylistId('');
                  }}
                >
                  Clear cart
                </button>
              ) : null}
            </div>
          </div>
          <CustomerPicker value={pickedCustomer} onChange={setPickedCustomer} />
          {!pickedCustomer ? (
            <WalkInCustomerFields
              compact
              fullName={walkInName}
              phone={walkInPhone}
              email={walkInEmail}
              onFullNameChange={setWalkInName}
              onPhoneChange={setWalkInPhone}
              onEmailChange={setWalkInEmail}
            />
          ) : null}
          <select
            className="inp !h-9 !text-[12.5px] mt-2"
            value={stylistId}
            onChange={(e) => setStylistId(e.target.value)}
          >
            <option value="">Stylist (optional)</option>
            {(staffData?.staff ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex-1 overflow-y-auto mt-3 space-y-2 min-h-[80px]">
            {cart.length ? (
              cart.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/[0.03]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-ink truncate">{l.name}</div>
                    <div className="text-[11px] text-muted">
                      {inr(l.price)} × {l.qty}
                    </div>
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => qty(l.id, -1)}>
                      −
                    </button>
                    <span className="w-6 text-center text-[12.5px] font-semibold">{l.qty}</span>
                    <button type="button" onClick={() => qty(l.id, 1)}>
                      +
                    </button>
                  </div>
                  <div className="w-16 text-right text-[13px] font-bold tabular-nums">{inr(l.price * l.qty)}</div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="kpi-ic" style={{ '--c': '#3598CB' } as React.CSSProperties}>
                  <ShoppingCart size={20} />
                </div>
                <div className="text-[13px] font-semibold text-ink mt-3">Cart is empty</div>
                <div className="text-[12px] text-muted">Tap a service or product to add it</div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[12px] text-secondary mr-1">Discount</span>
            {[0, 5, 10, 15, 20].map((d) => (
              <button
                key={d}
                type="button"
                className={`disc ${discount === d ? 'on' : ''}`}
                onClick={() => setDiscount(d)}
              >
                {d ? `${d}%` : 'None'}
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-dashed space-y-1.5 text-[12.5px]" style={{ borderColor: 'rgba(18,21,34,.15)' }}>
            <MotionRow label="Subtotal" value={inr(subtotal)} />
            <MotionRow label="Discount" value={discAmt ? `−${inr(discAmt)}` : inr(0)} hot={discAmt > 0} />
            <MotionRow label="Taxable value" value={inr(taxable)} />
            <MotionRow label="CGST @ 9%" value={inr(cgst)} />
            <MotionRow label="SGST @ 9%" value={inr(cgst)} />
            <div className="flex justify-between items-end pt-2">
              <span className="font-semibold text-ink">Total payable</span>
              <span className="font-display text-[26px] font-extrabold text-ink tabular-nums leading-none">
                {inr(total)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {(
              [
                ['upi', 'UPI'],
                ['card', 'Card'],
                ['cash', 'Cash'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`pay-opt ${pay === k ? 'on' : ''}`}
                onClick={() => setPay(k)}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-[11.5px] text-muted mt-3 leading-snug">
            Charge saves completed visits for today — dashboard revenue updates after refresh.
          </p>
          {chargeError ? <p className="text-[12px] text-hot mt-2">{chargeError}</p> : null}
          <button
            type="button"
            className="btn-primary w-full !h-12 mt-3 !text-[14px]"
            disabled={!cart.length || charging}
            onClick={recordCharge}
          >
            {charging ? 'Saving…' : `Charge ${inr(total)}`}
          </button>
        </Card>
      </div>

      <Modal
        open={charged}
        onClose={() => {
          setCharged(false);
          setCart([]);
          setPickedCustomer(null);
          setWalkInName('');
          setWalkInPhone('');
          setWalkInEmail('');
          setChargeError(null);
        }}
        title="Payment received"
        size="sm"
        showClose={false}
      >
        <div className="text-center">
          <p className="text-[13px] text-muted">
            {inr(total)} via {pay.toUpperCase()} · {orgName ?? 'LonSa'}
          </p>
          <p className="text-[12px] text-secondary mt-2">Recorded on today&apos;s floor · counts toward revenue.</p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() => {
              setCharged(false);
              setCart([]);
            }}
          >
            Done
          </button>
        </div>
      </Modal>

      <AddCatalogItemModal
        open={addSvc}
        mode="service"
        onClose={() => setAddSvc(false)}
        onCreated={() => setReloadKey((k) => k + 1)}
      />
      <AddCatalogItemModal
        open={addProduct}
        mode="product"
        onClose={() => setAddProduct(false)}
        onCreated={() => {
          setReloadKey((k) => k + 1);
          setShelf('store');
        }}
      />
    </div>
  );
}

function MotionRow({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className={`tabular-nums ${hot ? 'text-hot font-semibold' : ''}`}>{value}</span>
    </div>
  );
}