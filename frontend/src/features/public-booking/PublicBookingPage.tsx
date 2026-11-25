import { FormEvent, useState } from 'react';
import { Card } from '@/components/Card';
import { useFetch } from '@/hooks/useFetch';
import { apiFetch } from '@/lib/api';
import { inr, fmtTime } from '@/lib/format';

type Options = {
  branches: { id: string; name: string; area: string }[];
  services: { id: string; name: string; price: number }[];
  slots: number[];
};

export function PublicBookingPage() {
  const { data, loading } = useFetch<Options>('public/booking/options?org=lon-demo');
  const [serviceId, setServiceId] = useState('');
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!serviceId || slot == null) return;
    const res = await apiFetch('public/booking', {
      method: 'POST',
      body: JSON.stringify({ name, phone, serviceId, slot }),
    });
    const json = await res.json();
    setDone(true);
    setMessage(json.confirmation?.message ?? 'Booked');
  }

  if (loading || !data) {
    return <p className="text-center text-sm text-muted py-8">Loading booking…</p>;
  }

  const service = data.services.find((s) => s.id === serviceId);

  return (
    <Card className="glass-auth-card !max-w-none">
      <h1 className="font-display text-xl font-extrabold text-ink">Book at LonSa Studio</h1>
      <p className="text-sm text-muted mt-1">{data.branches[0]?.name}</p>
      {done ? (
        <p className="mt-6 text-sm form-alert form-alert-success font-medium">{message}</p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="lbl" htmlFor="pb-service">
              Service
            </label>
            <select
              id="pb-service"
              className="inp"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
            >
              <option value="">Choose…</option>
              {data.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {inr(s.price)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="lbl mb-2">Time</p>
            <div className="flex flex-wrap gap-2">
              {data.slots.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSlot(h)}
                  className={`date-pill !min-w-0 !flex-row !py-2 !px-3 ${slot === h ? 'on' : ''}`}
                >
                  {fmtTime(h)}
                </button>
              ))}
            </div>
          </div>
          <BookingField label="Full name" value={name} onChange={setName} required />
          <BookingField label="WhatsApp mobile" value={phone} onChange={setPhone} required />
          {service ? (
            <p className="text-sm font-bold text-right text-ink">{inr(service.price)} + GST at salon</p>
          ) : null}
          <button type="submit" className="btn-primary btn-full !h-11">
            Confirm booking
          </button>
        </form>
      )}
    </Card>
  );
}

function BookingField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <input className="inp" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}