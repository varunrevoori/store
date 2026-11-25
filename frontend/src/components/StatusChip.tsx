const STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 'st-confirmed' },
  'in-progress': { label: 'In chair', cls: 'st-progress' },
  completed: { label: 'Completed', cls: 'st-done' },
  pending: { label: 'Pending', cls: 'st-pending' },
  'no-show': { label: 'No-show', cls: 'st-noshow' },
};

export function StatusChip({ status }: { status: string }) {
  const row = STATUS[status] ?? {
    label: status.replace(/-/g, ' '),
    cls: 'st-pending',
  };
  return <span className={`chip ${row.cls}`}>{row.label}</span>;
}