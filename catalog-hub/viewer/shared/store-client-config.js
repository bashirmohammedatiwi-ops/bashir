/** إعدادات واجهة كل متجر — مصدر واحد للعميل */
export const STORE_CLIENT_CONFIG = {
  niceone: {
    apiPrefix: '/api',
    autoLoad: true,
    defaultCategory: 'foundation',
    bilingual: true,
    shades: true,
    brands: true,
    custom: true,
  },
  elryan: { apiPrefix: '/api/elryan', autoLoad: true, defaultCategory: null, bilingual: true, shades: true, brands: false, custom: true },
  miraaya: { apiPrefix: '/api/miraaya', autoLoad: true, bilingual: true, shades: true, custom: true },
  faces: { apiPrefix: '/api/faces', autoLoad: true, bilingual: true, shades: true, custom: true },
  amazon: {
    apiPrefix: '/api/amazon',
    autoLoad: true,
    defaultCategory: '3777761',
    bilingual: true,
    shades: true,
    imgFix: true,
  },
  miswag: { apiPrefix: '/api/miswag', autoLoad: true, bilingual: false, shades: true },
  orisdi: { apiPrefix: '/api/orisdi', autoLoad: true, bilingual: true, shades: true },
  beautyway: { apiPrefix: '/api/beautyway', autoLoad: true, bilingual: true, shades: true },
  vaneersa: { apiPrefix: '/api/vaneersa', autoLoad: true, bilingual: true, shades: true },
  najd: { apiPrefix: '/api/najd', autoLoad: true, bilingual: true, shades: true },
};

export function getStoreClientConfig(storeId) {
  return STORE_CLIENT_CONFIG[storeId] || { apiPrefix: `/api/${storeId}`, autoLoad: true, shades: true };
}
