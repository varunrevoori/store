import { SearchField } from '@/components/ui/SearchField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { CustomerQuickForm, type CustomerFormValues } from '@/features/customers/CustomerQuickForm';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { Modal } from '@/components/ui/Modal';
import { useTenant } from '@/context/TenantContext';
import { useFetch } from '@/hooks/useFetch';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { inr } from '@/lib/format';
import { Pencil, Trash2, UserRoundPlus } from 'lucide-react';

type Customer = CustomerFormValues & {
  visits: number;
  spend: number;
  lastVisitDays: number | null;
  branch: string;
  tier?: string;
};

export function CustomersPage() {
  const [q, setQ] = useState('');
  const qDebounced = useDebouncedValue(q, 280);
  const [reloadKey, setReloadKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { ready, branchId, role } = useTenant();
  const canManage = role === 'owner' || role === 'manager';

  const path = useMemo(() => `customers?q=${encodeURIComponent(qDebounced)}&tier=all`, [qDebounced]);
  const { data, loading, error } = useFetch<{ customers: Customer[]; total: number }>(
    ready ? path : '',
    [ready, path, reloadKey],
  );

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await apiFetch(`/customers/${deleteTarget.id}`, { method: 'DELETE' });
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

  if (loading && !data) return <PageLoading label="Loading customers…" />;
  if (error) return <PageError>Could not load customers.</PageError>;

  const customers = data?.customers ?? [];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${(data?.total ?? 0).toLocaleString('en-IN')} profiles · showing ${customers.length}`}
        actions={
          canManage ? (
            <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
              <UserRoundPlus size={16} />
              Add customer
            </button>
          ) : null
        }
      />

      <div className="page-search-row">
        <SearchField value={q} onChange={setQ} placeholder="Search name or phone" aria-label="Search customers" />
      </div>

      <Card padding={false} className="tbl-card">
        {customers.length === 0 ? (
          <div className="tbl-empty">
            <p className="font-semibold text-ink">No customers yet</p>
            <p className="text-[13px] text-muted mt-1">Add profiles to track visits and spend.</p>
            {canManage ? (
              <button type="button" className="btn-primary mt-4" onClick={() => setShowAdd(true)}>
                Add customer
              </button>
            ) : null}
          </div>
        ) : (
          <div className="tbl-scroll">
            <table className="tbl tbl-customers">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th className="text-right">Visits</th>
                  <th className="text-right">Spend</th>
                  <th>Last visit</th>
                  <th>Branch</th>
                  {canManage ? <th className="tbl-th-actions">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="font-semibold text-ink">{c.name}</div>
                      {c.email ? <div className="text-[11.5px] text-muted mt-0.5">{c.email}</div> : null}
                    </td>
                    <td>
                      <span className="tbl-mono text-muted">{c.phone}</span>
                    </td>
                    <td className="text-right tabular-nums font-medium">{c.visits}</td>
                    <td className="text-right tabular-nums font-semibold">{inr(c.spend)}</td>
                    <td className="text-secondary">
                      {c.lastVisitDays != null ? `${c.lastVisitDays}d ago` : '—'}
                    </td>
                    <td className="text-secondary truncate max-w-[8rem]" title={c.branch}>
                      {c.branch}
                    </td>
                    {canManage ? (
                      <td className="tbl-td-actions">
                        <div className="tbl-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            title="Edit"
                            aria-label={`Edit ${c.name}`}
                            onClick={() => setEditTarget(c)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn-danger"
                            title="Delete"
                            aria-label={`Delete ${c.name}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(c);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showAdd && canManage} onClose={() => setShowAdd(false)} title="Add customer" size="sm">
        <CustomerQuickForm
          branchId={branchId}
          onCreated={() => {
            refresh();
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal
        open={!!editTarget && canManage}
        onClose={() => setEditTarget(null)}
        title="Edit customer"
        size="sm"
      >
        {editTarget ? (
          <CustomerQuickForm
            branchId={branchId}
            editCustomer={{
              id: editTarget.id,
              name: editTarget.name,
              phone: editTarget.phone,
              email: editTarget.email,
            }}
            onSaved={() => {
              refresh();
              setEditTarget(null);
            }}
            onCancel={() => setEditTarget(null)}
          />
        ) : null}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Delete customer"
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
              Remove <span className="font-semibold text-ink">{deleteTarget.name}</span> ({deleteTarget.phone})? Past
              appointments keep their notes; the profile link is cleared.
            </p>
            {deleteError ? <p className="text-[13px] text-hot mt-3">{deleteError}</p> : null}
          </>
        ) : null}
      </Modal>
    </div>
  );
}