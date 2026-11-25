export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-loading" role="status">
      <span className="page-loading-spinner" aria-hidden />
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}