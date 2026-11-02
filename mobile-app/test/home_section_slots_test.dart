import 'package:alhayaa/data/models/banner.dart';
import 'package:alhayaa/data/models/home_feed.dart';
import 'package:alhayaa/data/models/home_section.dart';
import 'package:alhayaa/features/home/home_section_renderer.dart';
import 'package:flutter_test/flutter_test.dart';

/// واجهة بعدد [count] من أقسام لوحة التحكم الظاهرة (s0, s1, ...).
HomeFeed _feed(int count, {HomeShelvesConfig? shelves}) => HomeFeed(
  sections: [
    for (var i = 0; i < count; i++)
      HomeSection(
        id: 's$i',
        type: 'BANNER_FULL',
        position: i,
        banners: [AppBanner(id: 'b$i')],
      ),
  ],
  homeShelves: shelves,
);

/// ترتيب الفتحات كأسماء مختصرة: hero، معرّف القسم، أو اسم الرفّ.
List<String> _layout(HomeFeed feed, {bool personal = true}) =>
    resolveHomeSectionSlots(feed, personal: personal)
        .map((s) => s.kind == HomeSlotKind.cms ? s.section.id : s.kind.name)
        .toList();

const _tail = ['wishlist', 'brands', 'budget', 'promise', 'gift'];

void main() {
  group('resolveHomeSectionSlots', () {
    test('بلا إعداد: الترتيب الحالي كما هو', () {
      expect(_layout(_feed(3)), [
        'hero',
        'cart',
        'coupons',
        'buyAgain',
        's0',
        'continueShopping',
        's1',
        'needs',
        's2',
        'routine',
        ..._tail,
      ]);
    });

    test('خارج العالم: لا رفوف شخصية حتى مع إعداد', () {
      final feed = _feed(2, shelves: const HomeShelvesConfig(startAfter: 0));
      expect(_layout(feed, personal: false), ['hero', 's0', 's1']);
    });

    test('إعداد فارغ = الافتراضي', () {
      expect(
        _layout(_feed(3, shelves: const HomeShelvesConfig())),
        _layout(_feed(3)),
      );
    });

    test('hide يحذف الرفوف من البداية ومن التخلّل', () {
      final feed = _feed(
        2,
        shelves: const HomeShelvesConfig(hide: {'buyAgain', 'continueShopping', 'gift'}),
      );
      expect(_layout(feed), [
        'hero',
        'cart',
        'coupons',
        's0',
        'needs',
        's1',
        'routine',
        'wishlist',
        'brands',
        'budget',
        'promise',
      ]);
    });

    test('startAfter وevery يؤخّران الرفوف ويباعدان بينها', () {
      final feed = _feed(
        8,
        shelves: const HomeShelvesConfig(hide: {'buyAgain'}, startAfter: 4, every: 2),
      );
      expect(_layout(feed), [
        'hero',
        'cart',
        'coupons',
        's0',
        's1',
        's2',
        's3',
        'continueShopping',
        's4',
        's5',
        'needs',
        's6',
        's7',
        'routine',
        ..._tail,
      ]);
    });

    test('startAfter = 0 يضع أول رفّ قبل أول قسم', () {
      final feed = _feed(2, shelves: const HomeShelvesConfig(startAfter: 0, every: 2));
      expect(_layout(feed), [
        'hero',
        'cart',
        'coupons',
        'buyAgain',
        'continueShopping',
        's0',
        's1',
        'needs',
        'routine',
        ..._tail,
      ]);
    });
  });

  group('HomeShelvesConfig.fromJson', () {
    test('يُقرأ من world.homeShelves ويُقيَّد بالحدود', () {
      final feed = HomeFeed.fromJson({
        'world': {
          'slug': 'scent-story',
          'homeShelves': {
            'hide': ['buyAgain'],
            'startAfter': 99,
            'every': 0,
          },
        },
      });
      expect(feed.homeShelves?.hide, {'buyAgain'});
      expect(feed.homeShelves?.startAfter, 30);
      expect(feed.homeShelves?.every, 1);
    });

    test('بلا عالم أو بلا إعداد = null', () {
      expect(HomeFeed.fromJson(const {}).homeShelves, isNull);
      expect(
        HomeFeed.fromJson({
          'world': {'slug': 'x', 'homeShelves': null},
        }).homeShelves,
        isNull,
      );
    });
  });
}
