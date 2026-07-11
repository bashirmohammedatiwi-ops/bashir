import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:admin_mobile/main.dart';

void main() {
  testWidgets('app boots', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: AdminMobileApp()));
    await tester.pump();
    expect(find.byType(AdminMobileApp), findsOneWidget);
  });
}
