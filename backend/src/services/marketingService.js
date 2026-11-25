import { campaignStatusToApi } from '../lib/formatters.js';
import * as crmModel from '../models/crmModel.js';

export async function getMarketing(orgId) {
  const rows = await crmModel.listCampaigns(orgId);
  return {
    campaigns: rows.map((c) => ({
      id: c.id,
      channel: c.channel,
      audience: c.audience,
      status: campaignStatusToApi(c.status),
      reach: c.reach,
      sentAt: c.sent_label ?? '—',
    })),
    templates: 12,
    reviews: [],
  };
}