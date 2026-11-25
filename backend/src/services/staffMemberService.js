import * as staffInviteModel from '../models/staffInviteModel.js';
import { provisionStaffMember } from './staffProvisionService.js';

export async function listStaffMembers(orgId) {
  return staffInviteModel.listByOrg(orgId);
}

export async function addStaffMember(ctx, body) {
  return provisionStaffMember(ctx, body);
}