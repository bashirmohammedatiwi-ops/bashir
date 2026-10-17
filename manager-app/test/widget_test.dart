import 'package:flutter_test/flutter_test.dart';
import 'package:manager_app/core/format.dart';
import 'package:manager_app/data/models.dart';

void main() {
  group('normalizeCode', () {
    test('Arabic-Indic digits and stray marks', () {
      expect(normalizeCode('٦٢٨١٠٠٠١٠٠٠٠٥'), '6281000100005');
      expect(normalizeCode(' 6281‏000 '), '6281000');
    });
  });

  group('looksLikeBarcode', () {
    test('EAN and codes', () {
      expect(looksLikeBarcode('6281000100005'), isTrue);
      expect(looksLikeBarcode('AV_018_2025'), isTrue);
    });
    test('names are not barcodes', () {
      expect(looksLikeBarcode('شامبو'), isFalse);
      expect(looksLikeBarcode('rose gold'), isFalse);
      expect(looksLikeBarcode('12'), isFalse);
    });
  });

  test('ProductDetail parses shades and images', () {
    final p = ProductDetail.fromJson({
      'id': 'p1',
      'name': 'روج',
      'isActive': true,
      'price': 12500,
      'images': [
        {'mediaId': 'm1', 'url': 'u', 'thumb': 't', 'width': 800, 'height': 800},
      ],
      'shades': [
        {'id': 's1', 'name': '01 Nude', 'colorHex': '#C98F7D', 'isActive': false, 'stock': 0},
        {'id': 's2', 'name': '02 Rose', 'colorHex': '#A86E58', 'isActive': true, 'stock': 3},
      ],
    });
    expect(p.images.single.sizeLabel, '800×800');
    expect(p.shadesOff, 1);
    expect(hexColor('#C98F7D'), isNotNull);
  });

  test('money format', () => expect(money(12500), '12,500 د.ع'));
}
