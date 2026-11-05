import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// طلب جُهّز محلياً — لحساب إحصائيات أداء الموظف على هذا الجهاز.
class PreparedEntry {
  PreparedEntry({required this.at, required this.seconds, this.orderNumber});
  final DateTime at;

  /// زمن التجهيز بالثواني (من فتح الطلب إلى اعتماده جاهزاً).
  final int seconds;
  final String? orderNumber;

  Map<String, dynamic> toJson() => {'at': at.toIso8601String(), 'secs': seconds, 'no': orderNumber};
  factory PreparedEntry.fromJson(Map<String, dynamic> j) => PreparedEntry(
    at: DateTime.tryParse('${j['at']}') ?? DateTime.now(),
    seconds: (j['secs'] as num?)?.toInt() ?? 0,
    orderNumber: j['no'] as String?,
  );
}

/// إعدادات محلية بسيطة + سجل أداء التجهيز.
class Prefs {
  Prefs._(this._p);
  static late Prefs instance;
  final SharedPreferences _p;

  static Future<void> init() async => instance = Prefs._(await SharedPreferences.getInstance());

  bool get vibrate => _p.getBool('vibrate') ?? true;
  set vibrate(bool v) => _p.setBool('vibrate', v);
  bool get sound => _p.getBool('sound') ?? true;
  set sound(bool v) => _p.setBool('sound', v);

  /// تنبيه الطلبات الجديدة والتطبيق مغلق (يقرأه الفحص في الخلفية أيضاً).
  bool get backgroundOrders => _p.getBool('bgOrders') ?? true;
  set backgroundOrders(bool v) => _p.setBool('bgOrders', v);

  /// صوت + اهتزاز عند كل قراءة/حدث مهم.
  void feedback({bool error = false}) {
    if (vibrate) error ? HapticFeedback.heavyImpact() : HapticFeedback.mediumImpact();
    if (sound) SystemSound.play(error ? SystemSoundType.alert : SystemSoundType.click);
  }

  // ---------------- إحصائيات الأداء (محلية على الجهاز)
  /// يزداد بعد تسجيل طلب مجهّز — شاشة «أدائي» تعيد الرسم.
  final statsVersion = ValueNotifier<int>(0);

  List<PreparedEntry> get prepared {
    final raw = _p.getStringList('preparedLog') ?? const [];
    return raw
        .map((s) {
          try {
            return PreparedEntry.fromJson(jsonDecode(s) as Map<String, dynamic>);
          } catch (_) {
            return null;
          }
        })
        .whereType<PreparedEntry>()
        .toList();
  }

  void recordPrepared({required int seconds, String? orderNumber}) {
    final list = prepared..insert(0, PreparedEntry(at: DateTime.now(), seconds: seconds, orderNumber: orderNumber));
    // نحتفظ بآخر 400 عملية — كافٍ لإحصائيات اليوم والأسبوع.
    _p.setStringList('preparedLog', list.take(400).map((e) => jsonEncode(e.toJson())).toList());
    statsVersion.value++;
  }

  void clearStats() {
    _p.remove('preparedLog');
    statsVersion.value++;
  }
}
