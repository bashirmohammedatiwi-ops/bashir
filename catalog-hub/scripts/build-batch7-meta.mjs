#!/usr/bin/env node
/** Build batch7 meta with brand-in-Arabic-name format. */
import { readFileSync, writeFileSync } from 'fs';

const ORDER = [
  '737052352060', '8011530810023', '7640163970029', '3614274143751', '737052041353',
  '8690604111053', '3348901786393', '3348901786331', '3614221031735', '3274872456341',
  '3386460088190', '3614273673846', '3423222012700', '3581000018679', '3386460066075',
  '8005610328799', '3423478812154', '724120095653', '3614274350753', '3574661177137',
  '3606000537460', '8051277318536', '8051277318642', '8056669925897', '3616303445584',
  '3614272898301', '5057566220828', '3614271717092', '7640111494027', '3600524070113',
  '3605521651587', '30144224', '3614272544444', '3614225358463', '3700134410542',
  '3770010614616', '3348901426961', '769915194951', '8809634610027', '783320403897',
  '3423222092245', '3423222092252', '8005610298894', '3386460057059', '3614273604833',
  '764302316091', '8033488153281', '8681008055227', '3614222793458', '3614272865235',
];

const AR = {
  '737052352060': { brandAr: 'هugo boss', nameAr: 'هugo boss - bottled night أو دو توalet 100 مل' },
  '8011530810023': { brandAr: 'تروساردي', nameAr: 'تروساردي - uomo أو دو توalet 100 مل' },
  '7640163970029': { brandAr: 'بentley', nameAr: 'بentley - infinite intense أو دو parfum 100 مل' },
  '3614274143751': { brandAr: 'جiorgio armani', nameAr: 'جiorgio armani - أكوا دي جio elixir أو دو parfum 50 مل' },
  '737052041353': { brandAr: 'هugo boss', nameAr: 'هugo boss - femme أو duo parfum 75 مل' },
  '8690604111053': { brandAr: 'فlormar', nameAr: 'فlormar - محدد شفاه رقم 205' },
  '3348901786393': { brandAr: 'ديor', nameAr: 'ديor - addict purple glow أو duo parfum 50 مل' },
  '3348901786331': { brandAr: 'ديor', nameAr: 'ديor - addict rosy glow أو duo parfum 50 مل' },
  '3614221031735': { brandAr: 'روberto cavalli', nameAr: 'روberto cavalli - splendid vanilla أو duo parfum 100 مل' },
  '3274872456341': { brandAr: 'جivenchy', nameAr: 'جivenchy - l interdit rouge ultime أو duo parfum 80 مل' },
  '3386460088190': { brandAr: 'van cleef', nameAr: 'van cleef - bois doré أو duo parfum 75 مل' },
  '3614273673846': { brandAr: 'جiorgio armani', nameAr: 'جiorgio armani - my way floral أو duo parfum 90 مل' },
  '3423222012700': { brandAr: 'narciso rodiguez', nameAr: 'narciso rodiguez - musc noir أو duo parfum 100 مل' },
  '3581000018679': { brandAr: 'nicolai', nameAr: 'nicolai - patchouli intense أو duo parfum 100 مل' },
  '3386460066075': { brandAr: 'boucheron', nameAr: 'boucheron - quatre pour femme أو duo parfum 100 مل' },
  '8005610328799': { brandAr: 'gucci', nameAr: 'gucci - rush أو duo toilette 75 مل' },
  '3423478812154': { brandAr: 'narciso rodiguez', nameAr: 'narciso rodiguez - rose musc intense أو duo parfum 100 مل' },
  '724120095653': { brandAr: 'thameen', nameAr: 'thameen - amber room أو duo parfum 50 مل' },
  '3614274350753': { brandAr: 'valentino', nameAr: 'valentino - donna born in roma extradose parfum 100 مل' },
  '3574661177137': { brandAr: 'listerine', nameAr: 'listerine - غسول فم بالنعناع 500 مل' },
  '3606000537460': { brandAr: 'cerave', nameAr: 'cerave - لوشن مرطب SPF 30' },
  '8051277318536': { brandAr: 'the house of oud', nameAr: 'the house of oud - grape pearls أو duo parfum 75 مل' },
  '8051277318642': { brandAr: 'the house of oud', nameAr: 'the house of oud - just before أو duo parfum 75 مل' },
  '8056669925897': { brandAr: 'dolce gabbana', nameAr: 'dolce gabbana - the one for men parfum 100 مل' },
  '3616303445584': { brandAr: 'chloe', nameAr: 'chloe - eau de parfum intense 100 مل' },
  '3614272898301': { brandAr: 'lancome', nameAr: 'lancome - rose peonia أو duo parfum 100 مل' },
  '5057566220828': { brandAr: 'makeup revolution', nameAr: 'makeup revolution - باليت ظلال reloaded' },
  '3614271717092': { brandAr: 'ysl', nameAr: 'ysl - مzيل عرق y stick 75 جم' },
  '7640111494027': { brandAr: 'gres', nameAr: 'gres - cabotine أو duo toilette 100 مل' },
  '3600524070113': { brandAr: 'loreal', nameAr: 'loreal - primer lab لتقليل المسام 30 مل' },
  '3605521651587': { brandAr: 'maison margiela', nameAr: 'maison margiela - replica beach walk أو duo toilette 100 مل' },
  '30144224': { brandAr: 'maybelline', nameAr: 'maybelline - lash sensational firework mascara' },
  '3614272544444': { brandAr: 'جiorgio armani', nameAr: 'جiorgio armani - code absolu pour femme أو duo parfum 75 مل' },
  '3614225358463': { brandAr: 'calvin klein', nameAr: 'calvin klein - women أو duo parfum 100 مل' },
  '3700134410542': { brandAr: 'gabriela', nameAr: 'gabriela - yes i am the king أو duo parfum 100 مل' },
  '3770010614616': { brandAr: 'essential parfums', nameAr: 'essential parfums - the musc أو duo parfum 100 مل' },
  '3348901426961': { brandAr: 'ديor', nameAr: 'ديor - j adore roller pearl أو duo parfum 20 مل' },
  '769915194951': { brandAr: 'the ordinary', nameAr: 'the ordinary - niacinamide 10% + zinc 1% 60 مل' },
  '8809634610027': { brandAr: 'axis-y', nameAr: 'axis-y - gel cleanser بالكinoa 180 مل' },
  '783320403897': { brandAr: 'bvlgari', nameAr: 'bvlgari - man wood neroli أو duo parfum 100 مل' },
  '3423222092245': { brandAr: 'narciso rodiguez', nameAr: 'narciso rodiguez - for her forever أو duo parfum 50 مل' },
  '3423222092252': { brandAr: 'narciso rodiguez', nameAr: 'narciso rodiguez - for her forever أو duo parfum 100 مل' },
  '8005610298894': { brandAr: 'هugo boss', nameAr: 'هugo boss - the scent for her أو duo parfum 50 مل' },
  '3386460057059': { brandAr: 'boucheron', nameAr: 'boucheron - place vendome أو duo parfum 100 مل' },
  '3614273604833': { brandAr: 'جiorgio armani', nameAr: 'جiorgio armani - code parfum pour homme أو duo parfum 75 مل' },
  '764302316091': { brandAr: 'shea moisture', nameAr: 'shea moisture - كريم شعر power greens 237 مل' },
  '8033488153281': { brandAr: 'xerjoff', nameAr: 'xerjoff - casamorati gran ballo أو duo parfum 100 مل' },
  '8681008055227': { brandAr: 'nishane', nameAr: 'nishane - wulong cha أو duo parfum 100 مل' },
  '3614222793458': { brandAr: 'روberto cavalli', nameAr: 'روberto cavalli - paradiso assoluto أو duo parfum 50 مل' },
  '3614272865235': { brandAr: 'جiorgio armani', nameAr: 'جiorgio armani - acqua di gio profondo أو duo parfum 125 مل' },
};

// Fix Arabic - use proper Arabic script only
const FIX_AR = JSON.parse(String.raw`{
  "737052352060":{"brandAr":"\u0647\u0648\u063a\u0648 \u0628\u0648\u0633","nameAr":"\u0647\u0648\u063a\u0648 \u0628\u0648\u0633 - \u0628\u0648\u062a\u0644\u062f \u0646\u0627\u064a\u062a \u0623\u0648 \u062f\u0648 \u062a\u0648\u0627\u0644\u064a\u062a 100 \u0645\u0644"},
  "8011530810023":{"brandAr":"\u062a\u0631\u0648\u0633\u0627\u0631\u062f\u064a","nameAr":"\u062a\u0631\u0648\u0633\u0627\u0631\u062f\u064a - \u0623\u0648\u0645\u0648 \u0623\u0648 \u062f\u0648 \u062a\u0648\u0627\u0644\u064a\u062a 100 \u0645\u0644"},
  "7640163970029":{"brandAr":"\u0628\u0646\u062a\u0644\u064a","nameAr":"\u0628\u0646\u062a\u0644\u064a - \u0625\u0646\u0641\u064a\u0646\u0627\u064a\u062a \u0625\u0646\u062a\u0646\u0633 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3614274143751":{"brandAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a","nameAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a - \u0623\u0643\u0648\u0627 \u062f\u064a \u062c\u064a\u0648 \u0625\u0644\u064a\u0643\u0633\u064a\u0631 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 50 \u0645\u0644"},
  "737052041353":{"brandAr":"\u0647\u0648\u063a\u0648 \u0628\u0648\u0633","nameAr":"\u0647\u0648\u063a\u0648 \u0628\u0648\u0633 - \u0641\u064a\u0645 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 75 \u0645\u0644"},
  "8690604111053":{"brandAr":"\u0641\u0644\u0648\u0631\u0645\u0627\u0631","nameAr":"\u0641\u0644\u0648\u0631\u0645\u0627\u0631 - \u0645\u062d\u062f\u062f \u0634\u0641\u0627\u0647 \u0631\u0642\u0645 205"},
  "3348901786393":{"brandAr":"\u062f\u064a\u0648\u0631","nameAr":"\u062f\u064a\u0648\u0631 - \u0623\u062f\u064a\u0643\u062a \u0628\u064a\u0631\u0628\u0644 \u062c\u0644\u0648 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 50 \u0645\u0644"},
  "3348901786331":{"brandAr":"\u062f\u064a\u0648\u0631","nameAr":"\u062f\u064a\u0648\u0631 - \u0623\u062f\u064a\u0643\u062a \u0631\u0648\u0632\u064a \u062c\u0644\u0648 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 50 \u0645\u0644"},
  "3614221031735":{"brandAr":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a","nameAr":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a - \u0633\u0628\u0644\u0646\u062f\u064a\u062f \u0641\u0627\u0646\u064a\u0644\u0627 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3274872456341":{"brandAr":"\u062c\u064a\u0641\u0646\u0634\u064a","nameAr":"\u062c\u064a\u0641\u0646\u0634\u064a - \u0644\u0627\u0646\u062a\u0631\u062f\u064a \u0631\u0648\u062c \u0623\u0644\u062a\u064a\u0645 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 80 \u0645\u0644"},
  "3386460088190":{"brandAr":"\u0641\u0627\u0646 \u0643\u0644\u064a\u0641","nameAr":"\u0641\u0627\u0646 \u0643\u0644\u064a\u0641 - \u0628\u0648\u0627 \u062f\u0648\u0631\u064a \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 75 \u0645\u0644"},
  "3614273673846":{"brandAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a","nameAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a - \u0645\u0627\u064a \u0648\u0627\u064a \u0641\u0644\u0648\u0631\u0627\u0644 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 90 \u0645\u0644"},
  "3423222012700":{"brandAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632","nameAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632 - \u0645\u0633\u0643 \u0646\u0648\u0627\u0631 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3581000018679":{"brandAr":"\u0646\u064a\u0643\u0648\u0644\u0627\u064a","nameAr":"\u0646\u064a\u0643\u0648\u0644\u0627\u064a - \u0628\u0627\u062a\u0634\u0648\u0644\u064a \u0625\u0646\u062a\u0646\u0633 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3386460066075":{"brandAr":"\u0628\u0648\u0634\u0631\u0648\u0646","nameAr":"\u0628\u0648\u0634\u0631\u0648\u0646 - \u0643\u0648\u0627\u062a\u0631 \u0628\u0648\u0631 \u0641\u064a\u0645 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "8005610328799":{"brandAr":"\u0642\u0648\u062a\u0634\u064a","nameAr":"\u0642\u0648\u062a\u0634\u064a - \u0631\u0627\u0634 \u0623\u0648 \u062f\u0648 \u062a\u0648\u0627\u0644\u064a\u062a 75 \u0645\u0644"},
  "3423478812154":{"brandAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632","nameAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632 - \u0631\u0648\u0632 \u0645\u0633\u0643 \u0625\u0646\u062a\u0646\u0633 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "724120095653":{"brandAr":"\u062b\u0645\u064a\u0646","nameAr":"\u062b\u0645\u064a\u0646 - \u0639\u0646\u0628\u0631 \u0631\u0648\u0645 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 50 \u0645\u0644"},
  "3614274350753":{"brandAr":"\u0641\u0627\u0644\u0646\u062a\u064a\u0646\u0648","nameAr":"\u0641\u0627\u0644\u0646\u062a\u064a\u0646\u0648 - \u062f\u0648\u0646\u0627 \u0628\u0648\u0631\u0646 \u0625\u0646 \u0631\u0648\u0645\u0627 \u0625\u0643\u0633\u062a\u0631\u0627 \u062f\u0648\u0632 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3574661177137":{"brandAr":"\u0644\u064a\u0633\u062a\u0631\u064a\u0646","nameAr":"\u0644\u064a\u0633\u062a\u0631\u064a\u0646 - \u063a\u0633\u0648\u0644 \u0641\u0645 \u0628\u0627\u0644\u0646\u0639\u0646\u0627\u0639 \u0627\u0644\u0645\u0646\u0639\u0634 500 \u0645\u0644"},
  "3606000537460":{"brandAr":"\u0633\u064a\u0631\u0627\u0641\u064a","nameAr":"\u0633\u064a\u0631\u0627\u0641\u064a - \u0644\u0648\u0634\u0646 \u0645\u0631\u0637\u0628 \u0628\u0639\u0627\u0645\u0644 \u062d\u0645\u0627\u064a\u0629 30 \u0645\u0646 \u0627\u0644\u0634\u0645\u0633"},
  "8051277318536":{"brandAr":"\u0630\u0627 \u0647\u0627\u0648\u0633 \u0623\u0648\u0641 \u0639\u0648\u062f","nameAr":"\u0630\u0627 \u0647\u0627\u0648\u0633 \u0623\u0648\u0641 \u0639\u0648\u062f - \u062c\u0631\u064a\u0628 \u0628\u064a\u0631\u0644 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 75 \u0645\u0644"},
  "8051277318642":{"brandAr":"\u0630\u0627 \u0647\u0627\u0648\u0633 \u0623\u0648\u0641 \u0639\u0648\u062f","nameAr":"\u0630\u0627 \u0647\u0627\u0648\u0633 \u0623\u0648\u0641 \u0639\u0648\u062f - \u062c\u0633\u062a \u0628\u064a\u0641\u0648\u0631 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 75 \u0645\u0644"},
  "8056669925897":{"brandAr":"\u062f\u0648\u0644\u062a\u0634\u064a \u063a\u0627\u0628\u0627\u0646\u0627","nameAr":"\u062f\u0648\u0644\u062a\u0634\u064a \u063a\u0627\u0628\u0627\u0646\u0627 - \u0630\u0627 \u0648\u0646 \u0641\u0648\u0631 \u0645\u0646 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3616303445584":{"brandAr":"\u0643\u0644\u0648\u064a","nameAr":"\u0643\u0644\u0648\u064a - \u0623\u0648 \u062f\u064a \u0628\u0627\u0631\u0641\u064a\u0648\u0645 \u0625\u0646\u062a\u0646\u0633 100 \u0645\u0644"},
  "3614272898301":{"brandAr":"\u0644\u0627\u0646\u0643\u0648\u0645","nameAr":"\u0644\u0627\u0646\u0643\u0648\u0645 - \u0631\u0648\u0632 \u0628\u064a\u0648\u0646\u064a\u0627 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "5057566220828":{"brandAr":"\u0631\u064a\u0641\u0648\u0644\u0648\u0634\u0646","nameAr":"\u0631\u064a\u0641\u0648\u0644\u0648\u0634\u0646 - \u0628\u0627\u0644\u064a\u062a \u0638\u0644\u0627\u0644 \u0639\u064a\u0648\u0646 \u0631\u064a\u0644\u0648\u062f\u062f"},
  "3614271717092":{"brandAr":"\u0625\u064a\u0641 \u0633\u0627\u0646 \u0644\u0648\u0631\u0627\u0646","nameAr":"\u0625\u064a\u0641 \u0633\u0627\u0646 \u0644\u0648\u0631\u0627\u0646 - \u0645\u0632\u064a\u0644 \u0639\u0631\u0642 \u0648\u0627\u064a \u0633\u062a\u064a\u0643 75 \u062c\u0645"},
  "7640111494027":{"brandAr":"\u062c\u0631\u064a\u0633","nameAr":"\u062c\u0631\u064a\u0633 - \u0643\u0627\u0628\u0648\u062a\u064a\u0646 \u0623\u0648 \u062f\u0648 \u062a\u0648\u0627\u0644\u064a\u062a 100 \u0645\u0644"},
  "3600524070113":{"brandAr":"\u0644\u0648\u0631\u064a\u0627\u0644","nameAr":"\u0644\u0648\u0631\u064a\u0627\u0644 - \u0628\u0631\u0627\u064a\u0645\u0631 \u0644\u0627\u0628 \u0644\u062a\u0642\u0644\u064a\u0644 \u0627\u0644\u0645\u0633\u0627\u0645 30 \u0645\u0644"},
  "3605521651587":{"brandAr":"\u0645\u064a\u0632\u0648\u0646 \u0645\u0627\u0631\u062c\u064a\u064a\u0644\u0627","nameAr":"\u0645\u064a\u0632\u0648\u0646 \u0645\u0627\u0631\u062c\u064a\u064a\u0644\u0627 - \u0631\u064a\u0628\u0644\u064a\u0643\u0627 \u0628\u064a\u062a\u0634 \u0648\u0648\u0643 \u0623\u0648 \u062f\u0648 \u062a\u0648\u0627\u0644\u064a\u062a 100 \u0645\u0644"},
  "30144224":{"brandAr":"\u0645\u0627\u064a\u0628\u064a\u0644\u064a\u0646","nameAr":"\u0645\u0627\u064a\u0628\u064a\u0644\u064a\u0646 - \u0645\u0627\u0633\u0643\u0627\u0631\u0627 \u0644\u0627\u0634 \u0633\u064a\u0646\u0634\u0646\u0627\u0644 \u0641\u0627\u064a\u0631\u0648\u0648\u0631\u0643"},
  "3614272544444":{"brandAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a","nameAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a - \u0643\u0648\u062f \u0623\u0628\u0633\u0648\u0644\u0648 \u0628\u0648\u0631 \u0641\u064a\u0645 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 75 \u0645\u0644"},
  "3614225358463":{"brandAr":"\u0643\u0627\u0644\u0641\u0646 \u0643\u0644\u0627\u064a\u0646","nameAr":"\u0643\u0627\u0644\u0641\u0646 \u0643\u0644\u0627\u064a\u0646 - \u0648\u064a\u0645\u0646 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3700134410542":{"brandAr":"\u063a\u0627\u0628\u0631\u0644\u064a\u0633","nameAr":"\u063a\u0627\u0628\u0631\u0644\u064a\u0633 - \u064a\u0633 \u0622\u0645 \u0630\u0627 \u0643\u064a\u0646\u062c \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3770010614616":{"brandAr":"\u0625\u0633\u064a\u0646\u0634\u064a\u0627\u0644 \u0628\u0627\u0631\u0641\u064a\u0648\u0645\u0632","nameAr":"\u0625\u0633\u064a\u0646\u0634\u064a\u0627\u0644 \u0628\u0627\u0631\u0641\u064a\u0648\u0645\u0632 - \u0630\u0627 \u0645\u0633\u0643 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3348901426961":{"brandAr":"\u062f\u064a\u0648\u0631","nameAr":"\u062f\u064a\u0648\u0631 - \u062c\u0627\u062f\u0648\u0631 \u0631\u0648\u0644\u0631 \u0628\u064a\u0631\u0644 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 20 \u0645\u0644"},
  "769915194951":{"brandAr":"\u0630\u0627 \u0623\u0648\u0631\u062f\u064a\u0646\u0631\u064a","nameAr":"\u0630\u0627 \u0623\u0648\u0631\u062f\u064a\u0646\u0631\u064a - \u0633\u064a\u0631\u0648\u0645 \u0646\u064a\u0627\u0633\u064a\u0646\u0627\u0645\u064a\u062f 10% + \u0632\u0646\u0643 1% 60 \u0645\u0644"},
  "8809634610027":{"brandAr":"\u0623\u0643\u0633\u064a\u0633 \u0648\u0627\u064a","nameAr":"\u0623\u0643\u0633\u064a\u0633 \u0648\u0627\u064a - \u062c\u0644 \u0645\u0646\u0638\u0641 \u0628\u0627\u0644\u0643\u064a\u0646\u0648\u0627 180 \u0645\u0644"},
  "783320403897":{"brandAr":"\u0628\u0648\u0644\u063a\u0627\u0631\u064a","nameAr":"\u0628\u0648\u0644\u063a\u0627\u0631\u064a - \u0645\u0646 \u0648\u0648\u062f \u0646\u064a\u0631\u0648\u0644\u064a \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3423222092245":{"brandAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632","nameAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632 - \u0641\u0648\u0631 \u0647\u064a\u0631 \u0641\u0648\u0631 \u0625\u0641\u0631 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 50 \u0645\u0644"},
  "3423222092252":{"brandAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632","nameAr":"\u0646\u0627\u0631\u0633\u064a\u0633\u0648 \u0631\u0648\u062f\u0631\u064a\u063a\u0632 - \u0641\u0648\u0631 \u0647\u064a\u0631 \u0641\u0648\u0631 \u0625\u0641\u0631 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "8005610298894":{"brandAr":"\u0647\u0648\u063a\u0648 \u0628\u0648\u0633","nameAr":"\u0647\u0648\u063a\u0648 \u0628\u0648\u0633 - \u0630\u0627 \u0633\u064a\u0646\u062a \u0641\u0648\u0631 \u0647\u064a\u0631 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 50 \u0645\u0644"},
  "3386460057059":{"brandAr":"\u0628\u0648\u0634\u0631\u0648\u0646","nameAr":"\u0628\u0648\u0634\u0631\u0648\u0646 - \u0628\u0644\u0627\u0633 \u0641\u0627\u0646\u062f\u0648\u0645 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3614273604833":{"brandAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a","nameAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a - \u0643\u0648\u062f \u0628\u0627\u0631\u0641\u064a\u0648\u0645 \u0628\u0648\u0631 \u0647\u0648\u0645 75 \u0645\u0644"},
  "764302316091":{"brandAr":"\u0634\u064a\u0627 \u0645\u0648\u0634\u0631","nameAr":"\u0634\u064a\u0627 \u0645\u0648\u0634\u0631 - \u0643\u0631\u064a\u0645 \u0634\u0639\u0631 \u0628\u0627\u0648\u0631 \u062c\u0631\u064a\u0646\u0632 237 \u0645\u0644"},
  "8033488153281":{"brandAr":"\u0632\u064a\u0631\u062c\u0648\u0641","nameAr":"\u0632\u064a\u0631\u062c\u0648\u0641 - \u0643\u0627\u0633\u0627\u0645\u0648\u0631\u0627\u062a\u064a \u062c\u0631\u0627\u0646 \u0628\u0627\u0644\u0648 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "8681008055227":{"brandAr":"\u0646\u064a\u0634\u0627\u0646","nameAr":"\u0646\u064a\u0634\u0627\u0646 - \u0648\u0648\u0644\u0648\u0646\u062c \u062a\u0634\u0627 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 100 \u0645\u0644"},
  "3614222793458":{"brandAr":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a","nameAr":"\u0631\u0648\u0628\u0631\u062a\u0648 \u0643\u0641\u0627\u0644\u064a - \u0628\u0627\u0631\u0627\u062f\u064a\u0633\u0648 \u0623\u0633\u0648\u0644\u0648\u062a\u0648 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 50 \u0645\u0644"},
  "3614272865235":{"brandAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a","nameAr":"\u062c\u064a\u0648\u0631\u062c\u064a\u0648 \u0623\u0631\u0645\u0627\u0646\u064a - \u0623\u0643\u0648\u0627 \u062f\u064a \u062c\u064a\u0648 \u0628\u0631\u0648\u0641\u0648\u0646\u062f\u0648 \u0623\u0648 \u062f\u0648 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 125 \u0645\u0644"}
}`);

Object.assign(AR, FIX_AR);

const SPECS = {
  '737052352060': { brandEn: 'Hugo Boss', nameEn: 'Hugo Boss Bottled Night Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '8011530810023': { brandEn: 'Trussardi', nameEn: 'Trussardi Uomo Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '7640163970029': { brandEn: 'Bentley', nameEn: 'Bentley Infinite Intense Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3614274143751': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Acqua di Gio Elixir Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'men', isNew: true } },
  '737052041353': { brandEn: 'Hugo Boss', nameEn: 'Hugo Boss Femme Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' } },
  '8690604111053': { brandEn: 'Flormar', nameEn: 'Flormar Lip Liner 205', kind: 'makeup', makeupSub: 'lips' },
  '3348901786393': { brandEn: 'Dior', nameEn: 'Dior Addict Purple Glow Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '3348901786331': { brandEn: 'Dior', nameEn: 'Dior Addict Rosy Glow Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '3614221031735': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Splendid Vanilla Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3274872456341': { brandEn: 'Givenchy', nameEn: "Givenchy L'Interdit Rouge Ultime Eau de Parfum 80ml", kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '3386460088190': { brandEn: 'Van Cleef & Arpels', nameEn: 'Van Cleef & Arpels Bois Doré Eau de Parfum 75ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3614273673846': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani My Way Floral Eau de Parfum 90ml', kind: 'perfume', subs: { gender: 'women' } },
  '3423222012700': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez Musc Noir Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '3581000018679': { brandEn: 'Nicolai', nameEn: 'Nicolai Patchouli Intense Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3386460066075': { brandEn: 'Boucheron', nameEn: 'Boucheron Quatre Pour Femme Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '8005610328799': { brandEn: 'Gucci', nameEn: 'Gucci Rush Eau de Toilette 75ml', kind: 'perfume', subs: { gender: 'women' } },
  '3423478812154': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez Rose Musc Eau de Parfum Intense 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '724120095653': { brandEn: 'Thameen', nameEn: 'Thameen Amber Room Eau de Parfum 50ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3614274350753': { brandEn: 'Valentino', nameEn: 'Valentino Donna Born In Roma Extradose Parfum 100ml', kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '3574661177137': { brandEn: 'Listerine', nameEn: 'Listerine Cool Mint Mouthwash 500ml', kind: 'care', careLeaf: 'care/mouth--teeth-care/mouthwash', typeKey: 'mouthwash' },
  '3606000537460': { brandEn: 'CeraVe', nameEn: 'CeraVe Moisturising Lotion SPF 30', kind: 'care', careLeaf: 'care/sun-care/sunscreen', typeKey: 'sunscreen' },
  '8051277318536': { brandEn: 'The House of Oud', nameEn: 'The House of Oud Grape Pearls Eau de Parfum 75ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '8051277318642': { brandEn: 'The House of Oud', nameEn: 'The House of Oud Just Before Eau de Parfum 75ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '8056669925897': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana The One For Men Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3616303445584': { brandEn: 'Chloé', nameEn: 'Chloé Eau de Parfum Intense 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3614272898301': { brandEn: 'Lancôme', nameEn: 'Lancôme Rose Peonia Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '5057566220828': { brandEn: 'Makeup Revolution', nameEn: 'Makeup Revolution Reloaded Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes' },
  '3614271717092': { brandEn: 'YSL', nameEn: 'YSL Y Deodorant Stick 75g', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant' },
  '7640111494027': { brandEn: 'Grès', nameEn: 'Grès Cabotine Eau de Toilette 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3600524070113': { brandEn: "L'Oreal", nameEn: "L'Oreal Prime Lab Pore Minimizer 30ml", kind: 'makeup', makeupSub: 'face' },
  '3605521651587': { brandEn: 'Maison Margiela', nameEn: 'Maison Margiela Replica Beach Walk Eau de Toilette 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '30144224': { brandEn: 'Maybelline', nameEn: 'Maybelline Lash Sensational Firework Mascara', kind: 'makeup', makeupSub: 'eyes' },
  '3614272544444': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Code Absolu Pour Femme Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'women' } },
  '3614225358463': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Women Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3700134410542': { brandEn: 'Geparlys', nameEn: 'Geparlys Yes I Am The King Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3770010614616': { brandEn: 'Essential Parfums', nameEn: 'Essential Parfums The Musc Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3348901426961': { brandEn: 'Dior', nameEn: "Dior J'adore Roller Pearl Eau de Parfum 20ml", kind: 'perfume', subs: { gender: 'women' } },
  '769915194951': { brandEn: 'The Ordinary', nameEn: 'The Ordinary Niacinamide 10% + Zinc 1% 60ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'serum' },
  '8809634610027': { brandEn: 'Axis-Y', nameEn: 'Axis-Y Quinoa One Step Gel Cleanser 180ml', kind: 'care', careLeaf: 'care/korean-skincare/skin-care', typeKey: 'cleanser' },
  '783320403897': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Man Wood Neroli Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '3423222092245': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez For Her Forever Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '3423222092252': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez For Her Forever Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '8005610298894': { brandEn: 'Hugo Boss', nameEn: 'Hugo Boss The Scent For Her Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '3386460057059': { brandEn: 'Boucheron', nameEn: 'Boucheron Place Vendôme Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women' } },
  '3614273604833': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Code Parfum Pour Homme Eau de Parfum 75ml', kind: 'perfume', subs: { gender: 'men', isNew: true } },
  '764302316091': { brandEn: 'Shea Moisture', nameEn: 'Shea Moisture Power Greens Hair Cream 237ml', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment' },
  '8033488153281': { brandEn: 'Xerjoff', nameEn: 'Xerjoff Casamorati Gran Ballo Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women', isNiche: true } },
  '8681008055227': { brandEn: 'Nishane', nameEn: 'Nishane Wulong Cha Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3614222793458': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Paradiso Assoluto Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '3614272865235': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Acqua di Gio Profondo Eau de Parfum 125ml', kind: 'perfume', subs: { gender: 'men' } },
};

function pDesc(nameEn, nameAr) {
  return {
    descriptionEn: `${nameEn} is a refined fragrance with elegant character and lasting presence.\n\n◆ Scent family: Eau de parfum\n◆ Key notes: Bergamot, florals, amber, woods, musk\n◆ Character: Elegant and long-lasting\n◆ Best for: Daily to evening wear\n◆ Longevity: 6–10 hours with good projection`,
    descriptionAr: `${nameAr} — عطر راقٍ يتميز بطابع أنيق وثبات جيد.\n\n◆ عائلة العطر: عطر فاخر\n◆ النوتات الرئيسية: نوتات زهرية وخشبية وعنبرية\n◆ الطابع: أنيق وثابت\n◆ الأنسب لـ: الاستخدام اليومي والمناسبات\n◆ الثبات: 6–10 ساعات`,
  };
}

function cDesc(nameEn, nameAr, typeAr, size) {
  return {
    descriptionEn: `${nameEn} supports daily care with a trusted formula for regular use.\n\n◆ Category: Skincare\n◆ Product type: ${typeAr}\n◆ Key benefits: Daily care · Trusted formula · Regular use\n◆ Suitable for: Daily care routines\n◆ Size: ${size}`,
    descriptionAr: `${nameAr} — منتج عناية يومي بتركيبة موثوقة.\n\n◆ التصنيف: العناية\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: عناية يومية · تركيبة موثوقة · للاستخدام المنتظم\n◆ الأنسب لـ: الروتين اليومي\n◆ الحجم: ${size}`,
  };
}

function mDesc(nameEn, nameAr, typeAr) {
  return {
    descriptionEn: `${nameEn} delivers reliable makeup performance for everyday looks.\n\n◆ Category: Makeup\n◆ Product type: ${typeAr}\n◆ Key benefits: Easy application · Buildable result · Everyday wear\n◆ Suitable for: Daily makeup`,
    descriptionAr: `${nameAr} — منتج مكياج عملي لإطلالات يومية.\n\n◆ التصنيف: مكياج\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: سهل التطبيق · تغطية قابلة للبناء · للاستخدام اليومي\n◆ الأنسب لـ: إطلالات يومية`,
  };
}

const CARE_TYPE_AR = {
  mouthwash: 'غسول فم', sunscreen: 'واقي شمس', deodorant: 'مزيل عرق', serum: 'سيروم', cleanser: 'منظف', 'hair-treatment': 'علاج شعر',
};
const CARE_SIZE = {
  '3574661177137': '500 ml', '3606000537460': '—', '3614271717092': '75 g', '769915194951': '60 ml', '8809634610027': '180 ml', '764302316091': '237 ml',
};
const MAKEUP_TYPE_AR = { lips: 'مكياج الشفاه', eyes: 'مكياج العيون', face: 'مكياج الوجه' };

const out = {};
for (const bc of ORDER) {
  const spec = SPECS[bc];
  const ar = AR[bc];
  if (!spec || !ar) throw new Error(`Missing ${bc}`);
  if (/[A-Za-z]/.test(ar.brandAr) || /[A-Za-z]/.test(ar.nameAr)) throw new Error(`Latin in AR ${bc}`);
  const base = { brandEn: spec.brandEn, nameEn: spec.nameEn, brandAr: ar.brandAr, nameAr: ar.nameAr, kind: spec.kind };
  if (spec.kind === 'perfume') {
    Object.assign(base, { subs: spec.subs, ...pDesc(spec.nameEn, ar.nameAr) });
  } else if (spec.kind === 'care') {
    Object.assign(base, { careLeaf: spec.careLeaf, typeKey: spec.typeKey, ...cDesc(spec.nameEn, ar.nameAr, CARE_TYPE_AR[spec.typeKey] || 'عناية', CARE_SIZE[bc] || '—') });
  } else {
    Object.assign(base, { makeupSub: spec.makeupSub, ...mDesc(spec.nameEn, ar.nameAr, MAKEUP_TYPE_AR[spec.makeupSub]) });
  }
  out[bc] = base;
}

writeFileSync(new URL('../data/sarah-pos-batch7-meta.json', import.meta.url).pathname, `${JSON.stringify(out, null, 2)}\n`);
console.log('Wrote', Object.keys(out).length, 'meta entries');
