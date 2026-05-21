import '../models/category_model.dart';

abstract final class MockCategories {
  static final List<CategoryModel> all = [
    CategoryModel(
      id: 'cat_skincare',
      name: 'العناية بالبشرة',
      icon: '✨',
      subcategories: _subs('cat_skincare', [
        'غسول وجه', 'مرطب', 'سيروم', 'واقي شمس', 'تونر', 'ماسك',
        'قشرة', 'كريم عيون', 'مزيل مكياج', 'مرطب ليلي', 'BB/CC',
        'علاج حب الشباب', 'تفتيح', 'منتجات رجالية للبشرة',
      ]),
    ),
    CategoryModel(
      id: 'cat_makeup',
      name: 'المكياج',
      icon: '💄',
      subcategories: _subs('cat_makeup', [
        'أحمر شفاه', 'أساس', 'كونسيلر', 'ظلال عيون', 'ماسكارا',
        'رموش اصطناعية', 'هايلايتر', 'راج', 'براون حواجب',
        'جل حواجب', 'لاينر', 'برايمر', 'كونتور', 'سيتينق سبراي',
      ]),
    ),
    CategoryModel(
      id: 'cat_perfume',
      name: 'العطور',
      icon: '🌸',
      subcategories: _subs('cat_perfume', [
        'نسائي', 'رجالي', 'يونيسكس', 'عود وبخور', 'بخاخ جسم',
        'كريم عطر', 'مجموعات هدايا', 'مينيات',
      ]),
    ),
    CategoryModel(
      id: 'cat_hair',
      name: 'العناية بالشعر',
      icon: '💇',
      subcategories: _subs('cat_hair', [
        'شامبو', 'بلسم', 'ماسك شعر', 'زيت شعر', 'سيروم شعر',
        'سبراي تصفيف', 'جل وواكس', 'صبغة', 'كيراتين', 'مكمل شعر',
      ]),
    ),
    CategoryModel(
      id: 'cat_body',
      name: 'العناية بالجسم',
      icon: '🧴',
      subcategories: _subs('cat_body', [
        'مرطب جسم', 'سكراب', 'زيت جسم', 'لوشن', 'كريم يدين',
        'كريم قدمين', 'مزيل عرق', 'سيلوليت', 'تشديد جسم',
      ]),
    ),
    CategoryModel(
      id: 'cat_nails',
      name: 'العناية بالأظافر',
      icon: '💅',
      subcategories: _subs('cat_nails', [
        'طلاء أظافر', 'مزيل طلاء', 'أظافر اصطناعية (جيل)',
        'زيت أظافر', 'ملف وأدوات', 'علاج الأظافر',
      ]),
    ),
    CategoryModel(
      id: 'cat_tools',
      name: 'الأدوات والفرش',
      icon: '🖌️',
      subcategories: _subs('cat_tools', [
        'مجموعات فرش', 'إسفنج بيوتي بلندر', 'أدوات عيون',
        'أدوات شعر', 'مرايا', 'حقائب مكياج',
      ]),
    ),
    CategoryModel(
      id: 'cat_men',
      name: 'العناية بالرجال',
      icon: '👔',
      subcategories: _subs('cat_men', [
        'غسول', 'مرطب', 'كريم حلاقة', 'بعد الحلاقة',
        'عناية باللحية', 'غسول جسم', 'مزيل عرق',
      ]),
    ),
    CategoryModel(
      id: 'cat_kids',
      name: 'الأطفال',
      icon: '👶',
      subcategories: _subs('cat_kids', [
        'شامبو', 'لوشن', 'كريم حفاضات', 'غسول',
        'واقي شمس', 'عطر أطفال',
      ]),
    ),
    CategoryModel(
      id: 'cat_supplements',
      name: 'المكملات الغذائية',
      icon: '💊',
      subcategories: _subs('cat_supplements', [
        'كولاجين', 'فيتامين C', 'بيوتين', 'أوميغا 3',
        'مكمل شعر وبشرة', 'مكمل أظافر',
      ]),
    ),
  ];

  static List<SubcategoryModel> _subs(String catId, List<String> names) {
    return List.generate(names.length, (i) {
      return SubcategoryModel(
        id: '${catId}_sub_$i',
        name: names[i],
        productCount: 8 + (i * 3) % 25,
        categoryId: catId,
      );
    });
  }

  static CategoryModel? findById(String id) {
    try {
      return all.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }

  static SubcategoryModel? findSubcategory(String id) {
    for (final cat in all) {
      for (final sub in cat.subcategories) {
        if (sub.id == id) return sub;
      }
    }
    return null;
  }
}
