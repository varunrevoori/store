import { getBranchPricingFactor } from '../lib/resolveBranch.js';
import * as crmModel from '../models/crmModel.js';

function monthRangeIso() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export async function getStaffPayroll(orgId, branchId) {
  const { factor } = await getBranchPricingFactor(orgId, branchId);
  const { from, to } = monthRangeIso();

  const [staffRows, rollup] = await Promise.all([
    crmModel.listStaffForOrg(orgId),
    crmModel.staffAppointmentRollup(orgId, { from, to, branchId }),
  ]);

  const staff = staffRows.map((s) => {
    const stats = s.stats ?? {};
    const period = rollup.get(s.id) ?? { revenue: 0, services: 0 };
    const revenue = Math.round(period.revenue * factor);
    const base = Number(stats.payroll_base ?? 0);
    const commissionRate = Number(stats.commission_rate ?? 0.12);
    const deduction = Number(stats.payroll_deduction ?? 0);
    const baseAdj = Math.round(base * factor);
    const commission = Math.round(revenue * commissionRate);
    const netPay = baseAdj + commission - deduction;

    return {
      id: s.id,
      name: s.profile?.full_name ?? 'Staff',
      email: s.profile?.email ?? '',
      memberRole: s.role,
      role: s.job_title ?? 'Stylist',
      color: s.display_color ?? '#3598CB',
      rating: stats.rating ?? null,
      revenue,
      services: period.services,
      attendance: stats.attendance ?? null,
      shift: stats.shift ?? null,
      base: baseAdj,
      commission,
      netPay,
    };
  });

  return {
    staff,
    payrollTotal: staff.reduce((sum, s) => sum + s.netPay, 0),
  };
}