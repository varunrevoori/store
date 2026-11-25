import { CalendarCheck, ReceiptIndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIPS = [
  {
    icon: CalendarCheck,
    title: 'Calendar',
    text: 'Check in or complete to count revenue.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'POS',
    text: 'Charge records completed visits for today.',
  },
];

export function RevenueTipsCard({ servicesDone }: { servicesDone?: number }) {
  return (
    <div className="card dash-tips p-5 flex flex-col h-full">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Revenue rules</div>
      <p className="text-[13px] text-secondary mt-2 leading-snug">
        In-chair, completed, and POS charges for <span className="text-ink font-medium">today (IST)</span>.
        {servicesDone != null ? (
          <span className="block mt-1 text-muted">{servicesDone} countable visit{servicesDone === 1 ? '' : 's'} here.</span>
        ) : null}
      </p>
      <ul className="mt-4 space-y-2 flex-1">
        {TIPS.map((t) => (
          <li key={t.title} className="dash-tip-row">
            <t.icon size={15} className="text-sky shrink-0" />
            <div>
              <span className="text-[12.5px] font-semibold text-ink">{t.title}</span>
              <span className="text-[12px] text-muted"> — {t.text}</span>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/calendar" className="btn-ghost w-full mt-4 !text-[12px] !h-9 no-underline">
        Open calendar
      </Link>
    </div>
  );
}