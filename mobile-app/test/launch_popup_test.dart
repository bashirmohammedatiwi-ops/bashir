import 'package:alhayaa/features/launch_popup/launch_popup.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, dynamic> _popup({Map<String, dynamic>? image, String frequency = 'daily'}) => {
      'id': 'abc123',
      'title': 'شموع فكتوريا سيكريت',
      'linkType': 'product',
      'linkValue': 'vs-candles',
      'frequency': frequency,
      'image': image ??
          {
            'id': 'm1',
            'width': 1080,
            'height': 1350,
            'publicUrlBase': 'https://deemaalhayat.com/media/banner/2026/11',
            'filename': 'abc',
            'variants': {
              'large': {
                'width': 1600,
                'formats': {'jpg': 'https://deemaalhayat.com/media/banner/2026/11/abc_large.jpg'},
              },
            },
          },
    };

void main() {
  test('null or imageless popup is ignored', () {
    expect(LaunchPopup.fromJson(null), isNull);
    expect(LaunchPopup.fromJson(_popup(image: {})), isNull);
  });

  test('parses link, frequency and portrait aspect', () {
    final p = LaunchPopup.fromJson(_popup(frequency: 'once'))!;
    expect(p.id, 'abc123');
    expect(p.frequency, 'once');
    expect(p.banner.hasLink, isTrue);
    expect(p.banner.imageUrl, isNotEmpty);
    expect(p.aspect, closeTo(0.8, 0.001));
  });

  test('extreme aspect ratios are clamped', () {
    final tall = LaunchPopup.fromJson(_popup(image: {
      ..._popup()['image'] as Map<String, dynamic>,
      'width': 500,
      'height': 3000,
    }))!;
    expect(tall.aspect, 0.5);
  });
}
