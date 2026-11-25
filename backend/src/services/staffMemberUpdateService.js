import { assertCanAssignStaffRole } from '../lib/staffRolePolicy.js';
import * as crmModel from '../models/crmModel.js';

const PROTECTED = new Set(['OWNER']);

function mapRoleToApi(dbRole) {
  const r = String(dbRole ?? '').toUpperCase();
  if (r === 'MANAGER') return 'manager';
  if (r === 'RECEPTIONIST') return 'receptionist';
  return 'team';
}

export async function updateStaffMember(ctx, memberId, body) {
  const member = await crmModel.getOrgMember(ctx.orgId, memberId);
  if (!member) {
    const err = new Error('Staff member not found');
    err.status = 404;
    throw err;
  }
  if (PROTECTED.has(member.role)) {
    const err = new Error('Cannot edit organization owners from here');
    err.status = 403;
    throw err;
  }

  const row = {};
  if (body.jobTitle != null || body.job_title != null) {
    row.job_title = String(body.jobTitle ?? body.job_title ?? '').trim() || 'Stylist';
  }
  if (body.displayColor != null || body.display_color != null) {
    const c = String(body.displayColor ?? body.display_color ?? '').trim();
    if (c) row.display_color = c;
  }

  const stats = { ...(member.stats ?? {}) };
  let statsChanged = false;
  if (body.shift != null) {
    stats.shift = String(body.shift).trim() || null;
    statsChanged = true;
  }
  if (body.attendance != null) {
    stats.attendance = String(body.attendance).trim() || null;
    statsChanged = true;
  }
  if (statsChanged) row.stats = stats;

  if (body.role != null && ctx.role === 'owner') {
    row.role = assertCanAssignStaffRole(ctx.role, body.role);
  } else if (body.role != null && ctx.role === 'manager') {
    const err = new Error('Managers cannot change member roles');
    err.status = 403;
    throw err;
  }

  const fullName = body.fullName != null ? String(body.fullName).trim() : '';
  if (fullName) {
    await crmModel.updateProfileFields(member.profile_id, { full_name: fullName });
  }

  const updated = Object.keys(row).length ? await crmModel.updateOrgMember(ctx.orgId, memberId, row) : member;

  return {
    id: updated.id,
    fullName: fullName || updated.profile?.full_name,
    email: updated.profile?.email,
    jobTitle: updated.job_title,
    displayColor: updated.display_color,
    role: mapRoleToApi(updated.role),
    shift: updated.stats?.shift ?? null,
    attendance: updated.stats?.attendance ?? null,
  };
}

export async function removeStaffMember(ctx, memberId) {
  const member = await crmModel.getOrgMember(ctx.orgId, memberId);
  if (!member) {
    const err = new Error('Staff member not found');
    err.status = 404;
    throw err;
  }
  if (PROTECTED.has(member.role)) {
    const err = new Error('Cannot remove organization owners');
    err.status = 403;
    throw err;
  }
  if (member.profile_id === ctx.profileId) {
    const err = new Error('You cannot remove your own membership');
    err.status = 400;
    throw err;
  }
  if (ctx.role === 'manager' && member.role === 'MANAGER') {
    const err = new Error('Managers cannot remove other managers');
    err.status = 403;
    throw err;
  }

  await crmModel.deleteOrgMember(ctx.orgId, memberId);
  return { id: memberId, deleted: true };
}