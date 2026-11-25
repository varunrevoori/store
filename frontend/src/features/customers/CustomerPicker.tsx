import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFetch } from '@/hooks/useFetch';
import { useTenant } from '@/context/TenantContext';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export type PickedCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
};

type Row = {
  id: string;
  name: string;
  phone: string;
  email?: string;
};

type Props = {
  value: PickedCustomer | null;
  onChange: (customer: PickedCustomer | null) => void;
  placeholder?: string;
  hint?: string;
};

export function CustomerPicker({
  value,
  onChange,
  placeholder = 'Search name or phone…',
  hint = 'Search an existing guest, or enter new walk-in details below.',
}: Props) {
  const { ready } = useTenant();
  const inputId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const qDebounced = useDebouncedValue(query, 250);

  const path =
    ready && open && qDebounced.trim().length >= 2
      ? `customers?q=${encodeURIComponent(qDebounced.trim())}&tier=all`
      : '';

  const { data } = useFetch<{ customers: Row[] }>(path, [path]);
  const results = data?.customers ?? [];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(c: Row) {
    onChange({ id: c.id, name: c.name, phone: c.phone, email: c.email });
    setQuery('');
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery('');
  }

  if (value) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-black/[0.02] px-3 py-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ink truncate">{value.name}</div>
          <div className="text-[11px] text-muted tbl-mono">{value.phone}</div>
        </div>
        <button type="button" className="icon-btn shrink-0" aria-label="Clear customer" onClick={clear}>
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <label className="lbl" htmlFor={inputId}>
        Customer
      </label>
      <input
        id={inputId}
        className="inp !h-9 !text-[12.5px]"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {hint ? <p className="text-[11px] text-muted mt-1.5 leading-snug">{hint}</p> : null}
      {open && query.trim().length >= 2 ? (
        <ul className="dropdown left-0 right-0 max-h-52 overflow-y-auto !min-w-0 w-full">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-[12px] text-muted">No match — use new walk-in details below.</li>
          ) : (
            results.map((c) => (
              <li key={c.id}>
                <button type="button" className="dd-item w-full" onClick={() => pick(c)}>
                  <div className="text-left min-w-0">
                    <div className="font-semibold text-ink truncate">{c.name}</div>
                    <div className="text-[11px] text-muted tbl-mono">{c.phone}</div>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}