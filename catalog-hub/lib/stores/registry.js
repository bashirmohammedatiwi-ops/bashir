/**
 * سجل المتاجر المدعومة في Catalog Hub (10 متاجر — بدون Vanilla)
 */
export const STORES = [
  { id: 'niceone', label: 'Nice One', domain: 'niceonesa.com', path: '/niceone/', apiPrefix: '/api' },
  { id: 'elryan', label: 'الريان Elryan', domain: 'elryan.com', path: '/elryan/', apiPrefix: '/api/elryan' },
  { id: 'miraaya', label: 'ميرايا Miraaya', domain: 'miraaya.com', path: '/miraaya/', apiPrefix: '/api/miraaya' },
  { id: 'faces', label: 'وجوه FACES', domain: 'faces.ae', path: '/faces/', apiPrefix: '/api/faces' },
  { id: 'amazon', label: 'Amazon Cosmetics', domain: 'amazon.com', path: '/amazon/', apiPrefix: '/api/amazon' },
  { id: 'miswag', label: 'مسواگ Miswag', domain: 'miswag.com', path: '/miswag/', apiPrefix: '/api/miswag' },
  { id: 'orisdi', label: 'أورزدي Orisdi', domain: 'orisdi.com', path: '/orisdi/', apiPrefix: '/api/orisdi' },
  { id: 'beautyway', label: 'بيوتي وي Beauty Way', domain: 'beautyway-iq.com', path: '/beautyway/', apiPrefix: '/api/beautyway' },
  { id: 'vaneersa', label: 'ڤانير Vaneersa', domain: 'vaneersa.com', path: '/vaneersa/', apiPrefix: '/api/vaneersa' },
  { id: 'najd', label: 'نجد العذية Najd', domain: 'najdalatheyah.com', path: '/najd/', apiPrefix: '/api/najd' },
];

export const STORE_IDS = STORES.map((s) => s.id);

export function getStore(id) {
  return STORES.find((s) => s.id === id) || null;
}
