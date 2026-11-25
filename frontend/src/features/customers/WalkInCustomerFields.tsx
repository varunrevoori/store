type Props = {
  fullName: string;
  phone: string;
  email: string;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  compact?: boolean;
};

export function WalkInCustomerFields({
  fullName,
  phone,
  email,
  onFullNameChange,
  onPhoneChange,
  onEmailChange,
  compact,
}: Props) {
  return (
    <div
      className={
        compact
          ? 'mt-2 space-y-2 rounded-xl border border-dashed border-[var(--line)] bg-black/[0.02] p-3'
          : 'space-y-3 rounded-xl border border-dashed border-[var(--line)] bg-black/[0.02] p-3'
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">New walk-in profile</p>
      <div>
        <label className="lbl" htmlFor="walk-name">
          Full name
        </label>
        <input
          id="walk-name"
          className="inp !h-9 !text-[12.5px]"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          placeholder="Guest name"
          required
        />
      </div>
      <div>
        <label className="lbl" htmlFor="walk-phone">
          Mobile
        </label>
        <input
          id="walk-phone"
          className="inp !h-9 !text-[12.5px] tbl-mono"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="10-digit mobile"
          inputMode="tel"
          required
        />
      </div>
      <div>
        <label className="lbl" htmlFor="walk-email">
          Email <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          id="walk-email"
          type="email"
          className="inp !h-9 !text-[12.5px]"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <p className="text-[11px] text-muted leading-snug">
        Saved automatically on charge or booking so visits and spend track on Customers.
      </p>
    </div>
  );
}