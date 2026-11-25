import { z } from 'zod';

export const VERTICAL_CODES = [
  'salon',
  'retail_store',
  'dental',
  'travel',
  'spa',
  'fitness',
];

export const VerticalSchema = z.enum(VERTICAL_CODES);

export function parseVertical(input, fallback = 'salon') {
  if (!input) return fallback;
  if (input === 'store') return 'retail_store';
  const parsed = VerticalSchema.safeParse(input);
  return parsed.success ? parsed.data : fallback;
}

export const VERTICAL_TO_PRISMA = {
  salon: 'SALON',
  retail_store: 'RETAIL_STORE',
  dental: 'DENTAL',
  travel: 'TRAVEL',
  spa: 'SPA',
  fitness: 'FITNESS',
};

export const PRISMA_TO_VERTICAL = Object.fromEntries(
  Object.entries(VERTICAL_TO_PRISMA).map(([k, v]) => [v, k]),
);

export const VERTICAL_LABELS = {
  salon: { name: 'Salon', staff: 'Stylist', appointment: 'Chair', catalog: 'Service' },
  retail_store: { name: 'Store', staff: 'Associate', appointment: 'Visit', catalog: 'Product' },
  dental: { name: 'Dental', staff: 'Dentist', appointment: 'Chair', catalog: 'Procedure' },
  travel: { name: 'Travel', staff: 'Agent', appointment: 'Consultation', catalog: 'Package' },
  spa: { name: 'Spa', staff: 'Therapist', appointment: 'Room', catalog: 'Treatment' },
  fitness: { name: 'Fitness', staff: 'Trainer', appointment: 'Session', catalog: 'Plan' },
};