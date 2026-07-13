/// أسماء عربية للمتاجر في واجهة الاستيراد.
const Map<String, String> catalogStoreLabels = {
  'miswag': 'مسواگ',
  'najdalatheyah': 'نجد العذية',
  'alkhabeer': 'خبير العطور',
  'elryan': 'الريان',
  'faces': 'وجوه FACES',
  'miraaya': 'مرايا',
  'beautyway': 'بيوتي وي',
  'khaton': 'خاتون بيوتي',
  'orisdi': 'أورزدي',
  'waheteter': 'واحة عطر',
  'niceone': 'نايس ون',
  'amazon': 'أمازون',
};

String catalogStoreLabel(String id) => catalogStoreLabels[id] ?? id;
