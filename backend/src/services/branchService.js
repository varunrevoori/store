import * as crmModel from '../models/crmModel.js';

export async function listBranches(orgId) {
  return crmModel.listBranches(orgId);
}