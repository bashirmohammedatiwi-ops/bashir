import { createSallaAdapter } from '../salla/adapter.js';

export const NAJD_META = {
  id: 'najdalatheyah',
  label: 'نجد العذية Najd Alatheyah',
  domain: 'najdalatheyah.com',
  siteUrl: 'https://najdalatheyah.com',
  storeIdentifier: 'najdalatheyah.com',
};

export const najdalatheyahAdapter = createSallaAdapter(NAJD_META);
