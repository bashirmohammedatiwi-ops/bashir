import 'package:flutter_test/flutter_test.dart';
import 'package:alhayaa/core/l10n/app_strings.dart';
import 'package:alhayaa/features/products/widgets/listing_filters_section.dart';
import 'package:alhayaa/features/worlds/world_strings.dart';

void main() {
  const ar = AppStrings('ar');
  const en = AppStrings('en');

  test('شرائح ميزانية الهدية بتمييز العدد الصحيح', () {
    expect(ar.worldBudgetChip(null, 10000), 'أقل من 10 آلاف');
    expect(ar.worldBudgetChip(10000, 25000), '10–25 ألف');
    expect(ar.worldBudgetChip(5000, 10000), '5–10 آلاف');
    expect(ar.worldBudgetChip(50000, null), '+50 ألف');
    expect(en.worldBudgetChip(null, 10000), 'Under 10K');
    expect(en.worldBudgetChip(10000, 25000), '10–25K');
  });

  test('عدد منتجات البراند بصيغة الجمع الصحيحة', () {
    expect(ar.lfBrandItems(2), 'منتجان');
    expect(ar.lfBrandItems(3), '3 منتجات');
    expect(en.lfBrandItems(1), '1 item');
    expect(en.lfBrandItems(12), '12 items');
  });
}
