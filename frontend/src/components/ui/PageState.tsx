import { Spinner } from '@/components/ui/Spinner';

export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return <p className="text-sm text-muted py-2">{label}</p>;
}

export function PageLoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return <Spinner label={label} />;
}

export function PageError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-hot py-2">{children}</p>;
}