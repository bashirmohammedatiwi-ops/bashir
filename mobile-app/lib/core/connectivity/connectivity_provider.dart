import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// هل الجهاز متصل بشبكة؟ (`true` = متصل).
///
/// القيمة الأولى من فحص فوري عند الفتح، ثم كل تغيّر يُعتمد بعد ثانية من ثباته:
/// التنقّل بين الواي فاي وبيانات الهاتف لا يُظهر شريط «لا يوجد اتصال» ويخفيه.
/// الشبكة لا تعني دائماً إنترنت فعلياً (بوابة فندق مثلاً)، لكن غيابها يعني
/// يقيناً أن الطلبات ستفشل.
final connectivityProvider = StreamProvider<bool>((ref) {
  final connectivity = Connectivity();
  final controller = StreamController<bool>();
  Timer? settle;
  bool? last;

  void publish(bool online) {
    if (online == last || controller.isClosed) return;
    last = online;
    controller.add(online);
  }

  connectivity.checkConnectivity().then(
    (results) {
      if (last == null) publish(_isOnline(results));
    },
    onError: (Object e) {
      debugPrint('[connectivity] initial check failed: $e');
      if (last == null) publish(true);
    },
  );

  final sub = connectivity.onConnectivityChanged.listen(
    (results) {
      final online = _isOnline(results);
      settle?.cancel();
      settle = Timer(const Duration(seconds: 1), () => publish(online));
    },
    onError: (Object e) =>
        debugPrint('[connectivity] change stream failed: $e'),
  );

  ref.onDispose(() {
    settle?.cancel();
    sub.cancel();
    controller.close();
  });
  return controller.stream;
});

bool _isOnline(List<ConnectivityResult> results) =>
    results.any((r) => r != ConnectivityResult.none);
