import { Modal } from '@/components/ui/Modal';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { fmtTime } from '@/lib/format';
import { CustomerPicker, type PickedCustomer } from '@/features/customers/CustomerPicker';
import { WalkInCustomerFields } from '@/features/customers/WalkInCustomerFields';
import { FormEvent, useEffect, useState } from 'react';

type Stylist = { id: string; name: string };
type Service = { id: string; name: string; price: number; durationHours?: number };

type Props = {
  open: boolean;
  onClose: () => void;
  branchId: string | null;
  dayOffset: number;
  stylists: Stylist[];
  onBooked: () => void;
};

const H0 = 9;
const H1 = 21;

function timeOptions() {
  const opts: number[] = [];
  for (let h = H0; h < H1; h += 0.5) opts.push(h);
  return opts;
}

export function AppointmentBookModal({ open, onClose, branchId, dayOffset, stylists, onBooked }: Props) {
  const [pickedCustomer, setPickedCustomer] = useState<PickedCustomer | null>(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [stylistId, setStylistId] = useState('');
  const [catalogId, setCatalogId] = useState('');
  const [start, setStart] = useState(10);
  const [services, setServices] = useState<Service[]>([]);
  const [checkInNow, setCheckInNow] = useState(dayOffset === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setCheckInNow(dayOffset === 0);
  }, [open, dayOffset]);

  useEffect(() => {
    if (!open || !branchId) return;
    setStylistId((prev) => prev || stylists[0]?.id || '');
    apiFetch(`pos/catalog?branchId=${encodeURIComponent(branchId)}`)
      .then((r) => r.json())
      .then((data: { services: Service[] }) => {
        setServices(data.services ?? []);
        setCatalogId((prev) => prev || data.services?.[0]?.id || '');
      })
      .catch(() => setServices([]));
  }, [open, branchId, stylists]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!branchId) {
      setError('Pick a branch from the top bar first');
      return;
    }
    if (!stylistId) {
      setError('Choose a stylist.');
      return;
    }
    if (!pickedCustomer) {
      const name = walkInName.trim();
      const phone = walkInPhone.trim();
      if (!name || !phone) {
        setError('Search for a guest or fill new walk-in name and mobile.');
        return;
      }
    }
    const name = pickedCustomer?.name || walkInName.trim();
    setLoading(true);
    setError(null);
    const svc = services.find((s) => s.id === catalogId);
    const res = await apiFetch('/calendar/appointments', {
      method: 'POST',
      body: JSON.stringify({
        branchId,
        dayOffset,
        customerId: pickedCustomer?.id,
        customerPhone: pickedCustomer?.phone ?? (walkInPhone.trim() || undefined),
        customerName: name,
        newCustomer: pickedCustomer
          ? undefined
          : {
              fullName: walkInName.trim(),
              phone: walkInPhone.trim(),
              email: walkInEmail.trim() || undefined,
              branchId,
            },
        stylistId,
        catalogItemId: catalogId || undefined,
        start: start,
        durationHours: svc?.durationHours ?? 0.5,
        price: svc?.price ?? 0,
        serviceName: svc?.name ?? 'Service',
        checkInNow: dayOffset === 0 && checkInNow,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    invalidateApiCache();
    setPickedCustomer(null);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInEmail('');
    onBooked();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New appointment"
      subtitle="Confirmation can be sent manually · WhatsApp later"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="book-appt-form"
            className="btn-primary"
            disabled={loading || !stylistId || !branchId}
          >
            Book appointment
          </button>
        </>
      }
    >
      <form id="book-appt-form" onSubmit={submit} className="space-y-4">
        <CustomerPicker value={pickedCustomer} onChange={setPickedCustomer} />
        {!pickedCustomer ? (
          <WalkInCustomerFields
            fullName={walkInName}
            phone={walkInPhone}
            email={walkInEmail}
            onFullNameChange={setWalkInName}
            onPhoneChange={setWalkInPhone}
            onEmailChange={setWalkInEmail}
          />
        ) : null}
        {dayOffset === 0 ? (
            <label className="flex items-center gap-2 mt-2 text-[12.5px] text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-[#3598CB]"
                checked={checkInNow}
                onChange={(e) => setCheckInNow(e.target.checked)}
              />
              Same-day walk-in — check in now (counts in today&apos;s revenue)
            </label>
          ) : (
            <p className="text-[12px] text-muted mt-2">Future dates start as confirmed until check-in on that day.</p>
          )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lbl" htmlFor="sty">
              Stylist
            </label>
            <select id="sty" className="inp" value={stylistId} onChange={(e) => setStylistId(e.target.value)} required>
              {stylists.length === 0 ? <option value="">No stylists — add staff first</option> : null}
              {stylists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl" htmlFor="time">
              Time
            </label>
            <select id="time" className="inp" value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {timeOptions().map((t) => (
                <option key={t} value={t}>
                  {fmtTime(t)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor="svc">
            Service
          </label>
          <select id="svc" className="inp" value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
            {services.length === 0 ? (
              <option value="">General service (add services in POS)</option>
            ) : null}
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="text-[13px] text-hot">{error}</p> : null}
      </form>
    </Modal>
  );
}