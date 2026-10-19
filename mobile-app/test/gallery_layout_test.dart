import 'package:alhayaa/core/l10n/app_strings.dart';
import 'package:alhayaa/core/l10n/locale_provider.dart';
import 'package:alhayaa/data/models/home_section.dart';
import 'package:alhayaa/features/home/widgets/gallery_photo_card.dart';
import 'package:alhayaa/features/home/widgets/gallery_tile_sizer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// معارض الصور: لا استثناء في البناء مع البلاطات القصيرة (< 120) وصف أخير ببلاطة واحدة،
/// والصورة الرئيسية للفسيفساء بعرض الشاشة كاملاً.
void main() {
  // روابط وهمية — الاختبار يتحقق من التخطيط لا من تحميل الصور.
  List<Map<String, dynamic>> items(int n) => [
    for (var i = 0; i < n; i++)
      {'imageUrl': 'https://img.test/x$i.webp', 'title': 'صورة $i', 'titleEn': 'Photo $i'},
  ];

  HomeSection section({required String display, required String aspect, String? layout}) =>
      HomeSection(
        id: 's-$display-$aspect',
        type: 'PHOTO_WALL',
        display: display,
        sectionLayout: layout,
        aspectRatio: aspect,
      );

  Future<void> pump(WidgetTester tester, Widget child) async {
    tester.view.physicalSize = const Size(375 * 3, 812 * 3);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        // اللغة ثابتة في الاختبار — بلا تخزين محلي.
        overrides: [
          languageCodeProvider.overrideWithValue('ar'),
          stringsProvider.overrideWithValue(const AppStrings('ar')),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: child),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
  }

  testWidgets('grid2 بنسبة 16:9 وثلاث صور — بلا استثناء', (tester) async {
    final s = section(display: 'grid', aspect: '16:9', layout: 'grid2');
    await pump(
      tester,
      GalleryGridLayout(
        section: s,
        items: items(3),
        gap: 10,
        columns: 2,
        style: GalleryRenderStyle.fromSection(s),
        onTap: (_) {},
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.byType(GalleryPhotoCard), findsNWidgets(3));
  });

  testWidgets('grid3 بنسبة 1:1 وأربع صور — بلا استثناء', (tester) async {
    final s = section(display: 'grid', aspect: '1:1', layout: 'grid3');
    await pump(
      tester,
      GalleryGridLayout(
        section: s,
        items: items(4),
        gap: 10,
        columns: 3,
        style: GalleryRenderStyle.fromSection(s),
        onTap: (_) {},
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.byType(GalleryPhotoCard), findsNWidgets(4));
  });

  testWidgets('mosaic بنسبة 16:9 وأربع صور — بلا استثناء والرئيسية بعرض كامل', (tester) async {
    final s = section(display: 'mosaic', aspect: '16:9');
    final style = GalleryRenderStyle.fromSection(s);
    final all = items(4);
    await pump(
      tester,
      Column(
        children: [
          GalleryStackLayout(section: s, items: [all.first], gap: 10, style: style, onTap: (_) {}),
          const SizedBox(height: 10),
          GalleryGridLayout(
            section: s,
            items: all.skip(1).toList(),
            gap: 10,
            columns: 2,
            style: style,
            onTap: (_) {},
          ),
        ],
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.byType(GalleryPhotoCard), findsNWidgets(4));

    final hero = tester.widget<GalleryPhotoCard>(find.byType(GalleryPhotoCard).first);
    expect(hero.width, closeTo(343, 0.5));
    // 343 / (16/9) ≈ 193 — لا شريط بارتفاع 73.
    expect(hero.height, closeTo(343 / (16 / 9), 0.5));
  });

  test('tilesPerView للمكدّس والفسيفساء = 1', () {
    expect(GalleryTileSizer.resolveTilesPerView(section(display: 'mosaic', aspect: '16:9')), 1);
    expect(GalleryTileSizer.resolveTilesPerView(section(display: 'stack', aspect: '16:9')), 1);
  });

  test('tileHeight لا يرمي حين يكون الاحتياطي أقل من 96', () {
    const style = GalleryRenderStyle(defaultSize: 'lg');
    expect(style.tileHeight(80), 80);
    expect(style.tileHeight(300), 160);
  });

  test('زاوية القسم لا تطغى على الحبة والقوس والدائرة', () {
    const style = GalleryRenderStyle(tileCornerRadius: 4);
    expect(style.cornerRadiusFor('pill'), isNull);
    expect(style.cornerRadiusFor('arch'), isNull);
    expect(style.cornerRadiusFor('circle'), isNull);
    expect(style.cornerRadiusFor('rounded'), 4);
    expect(const GalleryRenderStyle().cornerRadiusFor('rounded'), 16);
  });
}
