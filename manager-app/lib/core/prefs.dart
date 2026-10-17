import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RecentScan {
  RecentScan({required this.code, required this.at, this.name, this.productId, this.found = false, this.thumb});
  final String code;
  final DateTime at;
  final String? name;
  final String? productId;
  final bool found;
  final String? thumb;

  Map<String, dynamic> toJson() => {
    'code': code,
    'at': at.toIso8601String(),
    'name': name,
    'productId': productId,
    'found': found,
    'thumb': thumb,
  };
  factory RecentScan.fromJson(Map<String, dynamic> j) => RecentScan(
    code: j['code'] as String,
    at: DateTime.tryParse(j['at'] as String? ?? '') ?? DateTime.now(),
    name: j['name'] as String?,
    productId: j['productId'] as String?,
    found: j['found'] == true,
    thumb: j['thumb'] as String?,
  );
}

/// إعدادات محلية بسيطة + سجل آخر عمليات المسح.
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

  bool get continuous => _p.getBool('continuous') ?? false;
  set continuous(bool v) => _p.setBool('continuous', v);

  /// المجموعة الافتراضية لحفظ الباركودات الناقصة.
  String? get lastGroupId => _p.getString('lastGroupId');
  set lastGroupId(String? v) => v == null ? _p.remove('lastGroupId') : _p.setString('lastGroupId', v);

  List<RecentScan> get recent {
    final raw = _p.getStringList('recentScans') ?? const [];
    return raw
        .map((s) {
          try {
            return RecentScan.fromJson(jsonDecode(s) as Map<String, dynamic>);
          } catch (_) {
            return null;
          }
        })
        .whereType<RecentScan>()
        .toList();
  }

  /// يتغير مع كل مسح جديد أو مسح للسجل — الرئيسية تعيد الرسم.
  final recentVersion = ValueNotifier<int>(0);

  void addRecent(RecentScan s) {
    final list = recent.where((r) => r.code != s.code).toList()..insert(0, s);
    _p.setStringList('recentScans', list.take(40).map((r) => jsonEncode(r.toJson())).toList());
    recentVersion.value++;
  }

  void clearRecent() {
    _p.remove('recentScans');
    recentVersion.value++;
  }

  /// صوت + اهتزاز عند كل قراءة ناجحة.
  void feedback({bool error = false}) {
    if (vibrate) error ? HapticFeedback.heavyImpact() : HapticFeedback.mediumImpact();
    if (sound) SystemSound.play(error ? SystemSoundType.alert : SystemSoundType.click);
  }
}
