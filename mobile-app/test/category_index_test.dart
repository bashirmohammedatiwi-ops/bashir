import 'package:alhayaa/data/models/category.dart';
import 'package:alhayaa/features/categories/category_browse.dart';
import 'package:flutter_test/flutter_test.dart';

Category _c(String id, String ar, String en, {int count = 0, List<Category> children = const []}) =>
    Category(id: id, name: ar, nameAr: ar, nameEn: en, slug: en.toLowerCase(), productCount: count, children: children);

void main() {
  final tree = [
    _c('makeup', 'المكياج', 'Makeup', count: 100, children: [
      _c('eyes', 'العيون', 'Eyes', count: 40, children: [
        _c('mascara', 'ماسكرا', 'Mascara', count: 25),
        _c('kohl', 'كحل', 'Kohl', count: 21),
      ]),
    ]),
    _c('care', 'العناية', 'Care', children: [
      _c('hair', 'العناية بالشعر', 'Hair care', count: 300, children: [
        _c('shampoo', 'الشامبو و البلسم', 'Shampoo', count: 118),
      ]),
    ]),
  ];
  final index = CategoryIndex.build(tree);

  test('indexes all three levels with paths', () {
    expect(index.all.length, 7);
    final mascara = index.byId['mascara']!;
    expect(mascara.level, CategoryLevel.tertiary);
    expect(mascara.path('ar'), 'المكياج › العيون');
  });

  test('matches synonyms across languages and spelling variants', () {
    expect(index.search('mascara').first.category.id, 'mascara');
    expect(index.search('ماسكارا').first.category.id, 'mascara'); // تهجئة مختلفة
    expect(index.search('شامبو').first.category.id, 'shampoo');
    expect(index.search('ك'), isEmpty); // حرف واحد لا يكفي
  });

  test('tertiary target carries its subcategory', () {
    final t = index.byId['kohl']!.target('ar');
    expect(t.location, contains('subcategoryId=eyes'));
    expect(t.location, contains('tertiaryCategoryId=kohl'));
  });

  test('displayCount never shows less than the sum of children', () {
    expect(tree[1].displayCount, 300);
    expect(tree[0].displayCount, 100);
  });
}
