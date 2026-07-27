const MAKEUP = /mascara|lipstick|lip gloss|gloss bomb|lip luminizer|lipliner|lip liner|eyeliner|eye liner|eyeshadow|eye shadow|foundation|concealer|loose powder|pressed powder|blush|bronzer|highlighter|contour|primer|palette|makeup brush|makeup sponge|brow pencil|brow powder|brow gel|setting spray|makeup fixer|makeup remover|micellar|lip tint|lip plumper|nail colour|nail color|gel nail|makeup tool|powder puff|complexion sponge|face brush|eye brush|lip brush|مكياج|ماسكر|أحمر شفاه|ملمع شفاه|قلم شفاه|آيلاينر|كحل|ظلال|بودرة|هايلايتر|كونتور|برايمر|باليت|فرشاة|اسفنجة|حواجب|أحمر خدود|بلاشر|مثبت مكياج|مزيل مكياج|ميسيلار|طلاء أظافر/i;

const NOT_MAKEUP = /body wash|shampoo|conditioner|hair mask|hair dye|hair color|hair serum|toothpaste|deodorant|antiperspirant|roll[- ]on|night cream|face wash|cleanser(?!.*micellar)|foaming cleanser|serum(?!.*makeup)|moisturiz|sunscreen|spf|mouthwash|vitamin|supplement|غسول جسم|شامبو|بلسم|صبغة شعر|معجون اسنان|مزيل عرق|رول اون|كريم ليلي|غسول وجه|منظف رغوي|سيروم|مرطب|واقي شمس|فيتامين|مكمل/i;

export function isMakeupText(text = '') {
  const t = String(text);
  if (NOT_MAKEUP.test(t)) return false;
  return MAKEUP.test(t);
}

export function isMakeupLeaf(leaf = '') {
  return String(leaf).startsWith('makeup/');
}

export function isMakeupCandidate({ leaf = '', nameAr = '', nameEn = '', category = '', posName = '' } = {}) {
  if (isMakeupLeaf(leaf)) return true;
  const text = `${nameAr} ${nameEn} ${category} ${posName}`;
  return isMakeupText(text);
}

export function isMakeupDetail(detail = {}, leaf = '') {
  if (isMakeupLeaf(leaf)) return true;
  const text = `${detail.nameAr || ''} ${detail.nameEn || ''} ${detail.category || ''}`;
  return isMakeupText(text);
}
