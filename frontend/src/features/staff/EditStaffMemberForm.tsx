import { FormAlert, Input, Label, Select } from '@/components/ui/Field';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { FormEvent, useState } from 'react';

export type StaffEditValues = {
  id: string;
  name: string;
  email?: string;
  role: string;
  color: string;
  shift: string | null;
  attendance: string | null;
  memberRole?: string;
};

type Props = {
  actorRole: string | null;
  staff: StaffEditValues;
  onSaved: () => void;
  onCancel: () => void;
};

function mapDbRole(memberRole?: string) {
  const r = String(memberRole ?? '').toUpperCase();
  if (r === 'MANAGER') return 'manager';
  return 'team';
}

export function EditStaffMemberForm({ actorRole, staff, onSaved, onCancel }: Props) {
  const isOwner = actorRole === 'owner';
  const [fullName, setFullName] = useState(staff.name);
  const [jobTitle, setJobTitle] = useState(staff.role);
  const [displayColor, setDisplayColor] = useState(staff.color);
  const [shift, setShift] = useState(staff.shift ?? '');
  const [attendance, setAttendance] = useState(staff.attendance ?? '');
  const [accessRole, setAccessRole] = useState(mapDbRole(staff.memberRole));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const body: Record<string, string> = {
      fullName: fullName.trim(),
      jobTitle: jobTitle.trim(),
      displayColor: displayColor.trim(),
      shift: shift.trim(),
      attendance: attendance.trim(),
    };
    if (isOwner) {
      body.role = accessRole === 'manager' ? 'manager' : 'team';
    }
    const res = await apiFetch(`/staff/members/${staff.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    invalidateApiCache();
    onSaved();
  }

  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      {error ? <FormAlert>{error}</FormAlert> : null}
      <div>
        <Label htmlFor="edit-staff-name">Full name</Label>
        <Input id="edit-staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      {staff.email ? (
        <div>
          <Label>Email</Label>
          <Input value={staff.email} disabled className="opacity-70" />
        </div>
      ) : null}
      <div>
        <Label htmlFor="edit-staff-job">Job title</Label>
        <Input id="edit-staff-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-2 items-end">
        <div>
          <Label htmlFor="edit-staff-color">Color</Label>
          <Input
            id="edit-staff-color"
            type="color"
            value={displayColor.startsWith('#') ? displayColor : '#3598CB'}
            onChange={(e) => setDisplayColor(e.target.value)}
            className="h-10 w-14 p-1 cursor-pointer"
          />
        </div>
        <div>
          <Label htmlFor="edit-staff-color-hex">Hex</Label>
          <Input
            id="edit-staff-color-hex"
            value={displayColor}
            onChange={(e) => setDisplayColor(e.target.value)}
            placeholder="#3598CB"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="edit-staff-shift">Shift</Label>
        <Input
          id="edit-staff-shift"
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          placeholder="e.g. Morning · Mon–Sat"
        />
      </div>
      <div>
        <Label htmlFor="edit-staff-attendance">Attendance note</Label>
        <Input
          id="edit-staff-attendance"
          value={attendance}
          onChange={(e) => setAttendance(e.target.value)}
          placeholder="e.g. 96% this month"
        />
      </div>
      {isOwner ? (
        <div>
          <Label htmlFor="edit-staff-access">Access role</Label>
          <Select id="edit-staff-access" value={accessRole} onChange={(e) => setAccessRole(e.target.value)}>
            <option value="manager">Manager</option>
            <option value="team">Team / employee</option>
          </Select>
        </div>
      ) : null}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}