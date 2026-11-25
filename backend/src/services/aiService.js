import * as crmModel from '../models/crmModel.js';

export async function getAiStudio(orgId) {
  const lapsed = await crmModel.countLapsedCustomers(orgId, 60);

  const insights = [
    {
      id: 'i1',
      title: `Win back ${lapsed} lapsed regulars`,
      text: 'Regulars with 3+ visits have not returned in 60 days. A targeted WhatsApp offer can re-activate them.',
      impact: lapsed > 0 ? `~${lapsed * 1200} INR` : '—',
    },
    {
      id: 'i2',
      title: 'Fill mid-week idle slots',
      text: 'Promote off-peak pricing Tuesday–Wednesday afternoon from live calendar data.',
      impact: '+bookings',
    },
    {
      id: 'i3',
      title: 'Deposit for first-time colour',
      text: 'UPI deposit on first colour bookings reduces no-shows.',
      impact: 'lower no-shows',
    },
  ];

  return {
    insights,
    voiceLive: true,
    automations: {
      voice: true,
      autobook: true,
      noshow: true,
      reactivate: true,
      reviews: false,
      upsell: true,
    },
    transcript: [
      { who: 'ai', text: 'Namaskara! How may I help you today?', lang: 'Kannada' },
      { who: 'caller', text: 'Haircut tomorrow evening?' },
    ],
  };
}