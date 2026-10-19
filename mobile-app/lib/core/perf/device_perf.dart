import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';

import '../bootstrap/app_storage.dart';

/// مستوى قدرة الجهاز: يحدّد كم مؤثراً بصرياً (ظلال، ضبابية، حركة دائمة)
/// وكم ذاكرة مؤقتة نستعمل — حتى يبقى التطبيق سلساً على الهواتف البسيطة.
enum PerfTier { low, mid, high }

abstract final class DevicePerf {
  static PerfTier _tier = PerfTier.mid;
  static int _totalMemMb = 0;

  static PerfTier get tier => _tier;
  static bool get isLow => _tier == PerfTier.low;
  static bool get isHigh => _tier == PerfTier.high;
  static int get totalMemMb => _totalMemMb;

  /// القيمة بحسب المستوى: [low] للبسيطة، [mid] للمتوسطة، [high] للقوية (افتراضياً = mid).
  static T pick<T>({required T low, required T mid, T? high}) => switch (_tier) {
        PerfTier.low => low,
        PerfTier.mid => mid,
        PerfTier.high => high ?? mid,
      };

  static const _channel = MethodChannel('deema/device');
  static const _downgradeKey = 'perf_tier_downgraded_v1';

  /// تُستدعى مرة قبل runApp (سريعة: قراءة واحدة من النظام، مهلة 300ms).
  static Future<void> init() async {
    try {
      final info = await _channel.invokeMapMethod<String, Object?>('info').timeout(const Duration(milliseconds: 300));
      final total = (info?['totalMem'] as num?)?.toInt() ?? 0;
      final lowRam = info?['lowRam'] == true;
      final sdk = (info?['sdk'] as num?)?.toInt() ?? 99;
      _totalMemMb = total ~/ (1024 * 1024);
      final gb = total / (1024 * 1024 * 1024);
      if (lowRam || (total > 0 && gb < 3.2) || sdk < 26) {
        _tier = PerfTier.low;
      } else if (total > 0 && gb < 5.5) {
        _tier = PerfTier.mid;
      } else if (total > 0) {
        _tier = PerfTier.high;
      }
    } catch (_) {
      // قناة غير متوفرة (اختبارات/منصة أخرى): نبقى على المتوسط.
    }
    // جهاز ثبت أنه يتقطّع سابقاً يبقى على المستوى الأدنى.
    if (appSharedPreferences.getBool(_downgradeKey) == true && _tier != PerfTier.low) {
      _tier = _tier == PerfTier.high ? PerfTier.mid : PerfTier.low;
    }
    if (kDebugMode) debugPrint('DevicePerf: tier=$_tier mem=${_totalMemMb}MB');
  }

  /// مراقبة أول ~12 ثانية من الإطارات: إن تقطّع أكثر من 15% منها
  /// يُخفَّض المستوى درجة ويُحفظ للتشغيلات القادمة (بدون إزعاج الزبونة).
  static void watchFrames() {
    if (kIsWeb || _tier == PerfTier.low) return;
    var total = 0;
    var slow = 0;
    final started = DateTime.now();
    late final TimingsCallback cb;
    cb = (timings) {
      for (final t in timings) {
        total++;
        if (t.rasterDuration.inMicroseconds > 17000 || t.buildDuration.inMicroseconds > 17000) slow++;
      }
      if (DateTime.now().difference(started) < const Duration(seconds: 12)) return;
      SchedulerBinding.instance.removeTimingsCallback(cb);
      if (total >= 120 && slow / total > 0.15) {
        appSharedPreferences.setBool(_downgradeKey, true);
      }
    };
    SchedulerBinding.instance.addTimingsCallback(cb);
  }
}
