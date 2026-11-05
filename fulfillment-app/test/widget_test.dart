import 'package:flutter_test/flutter_test.dart';
import 'package:fulfillment_app/core/format.dart';
import 'package:fulfillment_app/data/models.dart';

void main() {
  group('normalizeCode', () {
    test('Arabic-Indic digits and stray marks', () {
      expect(normalizeCode('٦٢٨١٠٠٠١٠٠٠٠٥'), '6281000100005');
      expect(normalizeCode(' 6281‏000 '), '6281000');
    });
  });

  group('order status labels', () {
    test('known statuses are localized', () {
      expect(orderStatusLabels['PENDING'], 'جديد');
      expect(orderStatusLabels['SHIPPED'], 'جاهز للتوصيل');
    });
    test('flow order', () {
      expect(orderStatusFlow.first, 'PENDING');
      expect(orderStatusFlow.last, 'DELIVERED');
    });
  });
}
