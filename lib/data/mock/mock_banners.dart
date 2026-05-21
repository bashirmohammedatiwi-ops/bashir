import '../models/banner_model.dart';

abstract final class MockBanners {
  static final List<BannerModel> all = List.generate(5, (i) {
    return BannerModel(
      id: 'banner_$i',
      title: switch (i) {
        0 => 'عروض الربيع 💜',
        1 => 'خصم حتى ٥٠٪',
        2 => 'براندات عالمية',
        3 => 'وصل حديثاً',
        _ => 'هدايا فاخرة',
      },
      subtitle: switch (i) {
        0 => 'اكتشفي أحدث المنتجات',
        1 => 'لفترة محدودة فقط',
        2 => 'أصلية ١٠٠٪',
        3 => 'تشكيلة جديدة كل أسبوع',
        _ => 'لأحبائكِ',
      },
      imageUrl: 'https://picsum.photos/seed/banner$i/800/400',
    );
  });
}
