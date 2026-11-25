import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-[26px] leading-tight font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[13px] text-secondary mt-1">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}