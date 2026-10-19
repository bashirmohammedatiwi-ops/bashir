import 'package:flutter/material.dart' show DateUtils;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/json.dart';
import '../auth/auth_provider.dart';
import '../profile/profile_providers.dart';

/// مدة التوصيل لمحافظة: من لوحة التحكم (أيام من–إلى).
class DeliveryWindow {
  final String? governorate;
  final int minDays;
  final int maxDays;
  const DeliveryWindow({this.governorate, required this.minDays, required this.maxDays});

  static DeliveryWindow? fromZone(Map<String, dynamic> z) {
    if (z['deliveryDaysMin'] == null && z['deliveryDaysMax'] == null) return null;
    final a = asInt(z['deliveryDaysMin'], 1);
    final b = asInt(z['deliveryDaysMax'], a);
    return DeliveryWindow(governorate: asString(z['governorate']), minDays: a, maxDays: b < a ? a : b);
  }

  /// يوم العمل بعد n أيام — الجمعة عطلة التوصيل غالباً فتُتخطّى.
  static DateTime _addWorkDays(DateTime from, int n) {
    var d = from;
    var left = n;
    while (left > 0) {
      d = d.add(const Duration(days: 1));
      if (d.weekday != DateTime.friday) left--;
    }
    return d;
  }

  static const _days = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

  String _dayName(DateTime d, DateTime now) {
    final diff = DateTime(d.year, d.month, d.day).difference(DateTime(now.year, now.month, now.day)).inDays;
    if (diff == 0) return 'اليوم';
    if (diff == 1) return 'غداً';
    return _days[d.weekday - 1];
  }

  /// «يصلكِ إلى البصرة بين السبت والاثنين» / «Arrives in Basra tomorrow» — بلغة الواجهة.
  String labelFor(AppStrings s, {bool withPlace = true}) {
    final now = DateTime.now();
    final from = _addWorkDays(now, minDays);
    final to = _addWorkDays(now, maxDays);
    final place = withPlace && (governorate?.isNotEmpty ?? false) ? governorate : null;
    final weekday = DateFormat.EEEE(s.lang);
    if (DateUtils.isSameDay(from, to)) {
      final diff = DateTime(from.year, from.month, from.day).difference(DateTime(now.year, now.month, now.day)).inDays;
      final day = diff == 0 ? s.today : diff == 1 ? s.tomorrow : weekday.format(from);
      return s.deliveryArrives(place, day, null);
    }
    return s.deliveryArrives(place, weekday.format(from), weekday.format(to));
  }

  /// النسخة العربية القديمة — للواجهة استخدمي [labelFor].
  String label({bool withPlace = true}) {
    final now = DateTime.now();
    final from = _addWorkDays(now, minDays);
    final to = _addWorkDays(now, maxDays);
    final place = withPlace && (governorate?.isNotEmpty ?? false) ? ' إلى $governorate' : '';
    // يوم واحد: «غداً»/«اليوم»؛ مدى: بأسماء الأيام («بين الاثنين والثلاثاء»).
    if (DateUtils.isSameDay(from, to)) return 'يصلكِ$place ${_dayName(from, now)}';
    return 'يصلكِ$place بين ${_days[from.weekday - 1]} و${_days[to.weekday - 1]}';
  }
}

DeliveryWindow? windowFor(List<Map<String, dynamic>> zones, String? governorate) {
  if (governorate == null || governorate.isEmpty) return null;
  for (final z in zones) {
    if (asString(z['governorate']) == governorate) return DeliveryWindow.fromZone(z);
  }
  return null;
}

/// لصفحة المنتج: محافظة العنوان الافتراضي إن وُجد، وإلا أسرع–أبطأ محافظة.
final deliveryHintProvider = Provider.autoDispose<DeliveryWindow?>((ref) {
  final zones = ref.watch(shippingZonesProvider).valueOrNull;
  if (zones == null || zones.isEmpty) return null;
  if (ref.watch(authProvider).isAuthenticated) {
    final addresses = ref.watch(addressesProvider).valueOrNull ?? const [];
    final main = addresses.where((a) => a.isDefault).firstOrNull ?? addresses.firstOrNull;
    final w = windowFor(zones, main?.governorate);
    if (w != null) return w;
  }
  final all = zones.map(DeliveryWindow.fromZone).whereType<DeliveryWindow>().toList();
  if (all.isEmpty) return null;
  return DeliveryWindow(
    minDays: all.map((w) => w.minDays).reduce((a, b) => a < b ? a : b),
    maxDays: all.map((w) => w.maxDays).reduce((a, b) => a > b ? a : b),
  );
});
