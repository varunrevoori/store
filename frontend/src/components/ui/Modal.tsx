import { Card } from '@/components/Card';
import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg';

const maxW: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: Size;
  className?: string;
  showClose?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className = '',
  showClose = true,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal-panel">
        <Card
          className={`p-6 w-full ${maxW[size]} ${className}`}
          padding={false}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
          >
          {showClose ? (
            <button type="button" className="icon-btn float-right -mt-0.5" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          ) : null}
          {title ? (
            <h3 id={titleId} className="font-display text-[20px] font-extrabold text-ink pr-8">
              {title}
            </h3>
          ) : null}
          {subtitle ? <p className="text-[12.5px] text-muted mt-0.5 pr-8">{subtitle}</p> : null}
          <div className={title || subtitle ? 'mt-5' : ''}>{children}</div>
          {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
          </div>
        </Card>
      </div>
    </>
  );
}