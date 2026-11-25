import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function CardHeader({ title, subtitle, action }: Props) {
  return (
    <div className="card-h">
      <div>
        <div className="card-t">{title}</div>
        {subtitle ? <div className="card-s">{subtitle}</div> : null}
      </div>
      {action}
    </div>
  );
}