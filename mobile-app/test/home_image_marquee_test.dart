import 'package:alhayaa/core/bootstrap/app_storage.dart';
import 'package:alhayaa/features/home/widgets/home_image_marquee.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// موضع أول بلاطة على الشاشة — يتغيّر مع حركة الشريط.
double _stripX(WidgetTester t) {
  final tr = t.widget<Transform>(
    find.descendant(of: find.byType(ValueListenableBuilder<double>), matching: find.byType(Transform)).first,
  );
  return tr.transform.getTranslation().x;
}

Widget _app() {
  final images = [
    for (var i = 0; i < 5; i++)
      HomeMarqueeImage(url: '', width: 120, height: 160, item: {'title': 'b$i'}),
  ];
  return ProviderScope(
    child: MaterialApp(
      home: Scaffold(
        body: ListView(
          children: [
            const SizedBox(height: 100),
            HomeImageMarquee(images: images, height: 160),
            const SizedBox(height: 2000),
          ],
        ),
      ),
    ),
  );
}

/// إطارات حقيقية بـ 60fps بدل قفزة زمنية واحدة.
Future<void> _frames(WidgetTester t, Duration d) async {
  final n = d.inMilliseconds ~/ 16;
  for (var i = 0; i < n; i++) {
    await t.pump(const Duration(milliseconds: 16));
  }
}

void main() {
  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    appSharedPreferences = await SharedPreferences.getInstance();
  });

  testWidgets('keeps moving while the page scrolls, stops only under a finger', (t) async {
    await t.pumpWidget(_app());
    await _frames(t, const Duration(milliseconds: 100));
    await _frames(t, const Duration(seconds: 2));
    final x0 = _stripX(t);
    await _frames(t, const Duration(milliseconds: 500));
    expect(_stripX(t), isNot(x0), reason: 'cruises on its own');

    // تمرير الصفحة من خارج الشريط: يبقى يتحرك.
    final g = await t.startGesture(const Offset(200, 600));
    await g.moveBy(const Offset(0, -40));
    await _frames(t, const Duration(milliseconds: 50));
    final x1 = _stripX(t);
    await _frames(t, const Duration(milliseconds: 400));
    expect(_stripX(t), isNot(x1), reason: 'page scroll must not pause the strip');
    await g.up();
    await _frames(t, const Duration(milliseconds: 300));

    // إصبع على الشريط نفسه: يقف.
    final strip = t.getCenter(find.byType(HomeImageMarquee));
    final h = await t.startGesture(strip);
    await _frames(t, const Duration(milliseconds: 50));
    final x2 = _stripX(t);
    await _frames(t, const Duration(milliseconds: 500));
    expect(_stripX(t), x2, reason: 'holds still under the finger');
    await h.up();
    await _frames(t, const Duration(seconds: 2));
    await _frames(t, const Duration(milliseconds: 500));
    expect(_stripX(t), isNot(x2), reason: 'resumes after release');
    await t.pumpWidget(const SizedBox());
  });
}
