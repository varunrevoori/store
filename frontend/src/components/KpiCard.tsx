import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color: string;
  delta?: string;
  good?: boolean;
};

export function KpiCard({ label, value, sub, icon: Icon, color, delta, good }: Props) {
  return (
    <div className="card kpi p-5 relative overflow-hidden" style={{ '--c': color } as React.CSSProperties}>
      <div className="kpi-glow" />
      <div className="relative flex items-center justify-between">
        <div className="kpi-ic">
          <Icon size={18} strokeWidth={1.9} />
        </div>
        {delta ? (
          <span className={`delta ${good !== false ? 'good' : 'bad'}`}>{delta}</span>
        ) : null}
      </div>
      <div className="relative mt-4 text-[12.5px] font-medium kpi-label">{label}</div>
      <div className="relative kpi-value text-[29px] leading-none font-extrabold tracking-tight tabular-nums mt-1">
        {value}
      </div>
      {sub ? <div className="relative text-[11.5px] kpi-sub mt-2">{sub}</div> : null}
    </div>
  );
}