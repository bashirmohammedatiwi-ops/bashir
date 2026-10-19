import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:alhayaa/core/network/api_client.dart';
import 'package:alhayaa/data/models/address.dart';
import 'package:alhayaa/data/models/store_settings.dart';
import 'package:alhayaa/features/profile/profile_providers.dart';
import 'package:alhayaa/features/profile/widgets/address_form.dart';
import 'package:alhayaa/features/settings/help_screen.dart';
import 'package:alhayaa/features/worlds/worlds_provider.dart';

class _Settings extends StoreSettingsNotifier {
  @override
  StoreSettings? build() => StoreSettings.fromJson({
        'storeName': 'x',
        'freeShippingThreshold': 50000,
        'whatsapp': '9647700000000',
        'supportPhone': '+9647700000001',
      });
}

final _zones = [
  {
    'governorate': 'بغداد',
    'standardFee': 5000,
    'deliveryDaysMin': 1,
    'deliveryDaysMax': 2,
    'areas': [
      {'name': 'المنصور'},
      {'name': 'الكرادة'},
    ],
  },
  {'governorate': 'البصرة', 'standardFee': 7000, 'areas': []},
];

Future<List<Override>> _overrides() async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  return [
    sharedPreferencesProvider.overrideWithValue(prefs),
    storeSettingsProvider.overrideWith(_Settings.new),
    shippingZonesProvider.overrideWith((ref) async => _zones),
  ];
}

void main() {
  testWidgets('help screen renders and expands', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: await _overrides(),
      child: const MaterialApp(home: HelpScreen()),
    ));
    await tester.pumpAndSettle();
    expect(find.byType(ExpansionTile), findsWidgets);
    await tester.tap(find.byType(ExpansionTile).first);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.drag(find.byType(ListView), const Offset(0, -3000));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('address form keeps sheet open on failure', (tester) async {
    await tester.binding.setSurfaceSize(const Size(400, 900));
    var calls = 0;
    Address? result;
    await tester.pumpWidget(ProviderScope(
      overrides: await _overrides(),
      child: MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: TextButton(
                onPressed: () async {
                  result = await showAddressForm(
                    context,
                    initial: const Address(
                      id: 'a1',
                      fullName: 'Sara',
                      phone: '+9647701234567',
                      city: 'المنصور',
                      governorate: 'بغداد',
                      area: 'المنصور',
                      notes: 'old',
                    ),
                    onSubmit: (a) async {
                      calls++;
                      if (calls == 1) throw Exception('Connection error');
                    },
                  );
                },
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(find.text('07701234567'), findsOneWidget);
    // تعديل → رجوع النظام يسأل قبل الإغلاق.
    await tester.enterText(find.widgetWithText(TextFormField, 'old'), '');
    await tester.pump();
    final nav = tester.state<NavigatorState>(find.byType(Navigator).first);
    await nav.maybePop();
    await tester.pumpAndSettle();
    expect(find.byType(AlertDialog), findsOneWidget);
    await tester.tap(find.byType(TextButton).at(0).hitTestable().first);
    await tester.pumpAndSettle();
    // الحفظ يفشل أولاً: الورقة باقية مع رسالة.
    final save = find.byIcon(Icons.check_rounded);
    await tester.tap(save);
    await tester.pumpAndSettle();
    expect(calls, 1);
    expect(result, isNull);
    expect(find.byIcon(Icons.error_outline_rounded), findsOneWidget);
    await tester.tap(save);
    await tester.pumpAndSettle();
    expect(calls, 2);
    expect(result?.notes, isNull);
    expect(result?.phone, '+9647701234567');
    expect(tester.takeException(), isNull);
  });
}
