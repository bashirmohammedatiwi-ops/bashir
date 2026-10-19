import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';

import '../network/api_exception.dart';

/// نصوص انقطاع الاتصال: وصف Dio/ApiService التقني («Connection error»…) والرسائل الودّية
/// التي سبق عرضها بالعربي أو الإنجليزي — حتى يُعرف الانقطاع من نص محفوظ أيضاً.
final _connectionText = RegExp(
  r'socketexception|handshakeexception|timeoutexception|connection (?:error|timeout|refused|closed)'
  r'|failed host lookup|network is unreachable|could not connect'
  r'|تحققي من اتصالك|تعذّر الاتصال|تعذر الاتصال',
  caseSensitive: false,
);

/// هل فشل الطلب لأن الجهاز لم يصل للخادم (لا إنترنت أو انتهت المهلة) — لا لأن الخادم رفضه؟
///
/// يقبل الخطأ الخام ([DioException]، [SocketException]…)، أو [ApiException] الذي يلفّ به
/// ApiService أخطاء Dio (بلا رمز HTTP)، أو نصاً جاهزاً من `friendlyError`.
/// مطابق لما يعرضه `friendlyError` كرسالة «تعذّر الاتصال»، فالأيقونة والعنوان يوافقان النص.
bool isConnectionError(Object? error) {
  if (error == null) return false;
  if (error is SocketException || error is HandshakeException || error is TimeoutException) {
    return true;
  }
  if (error is DioException) {
    return switch (error.type) {
      DioExceptionType.connectionError ||
      DioExceptionType.connectionTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.sendTimeout =>
        true,
      // انقطاع أثناء الطلب يصل كـ unknown ومعه SocketException.
      DioExceptionType.unknown => error.response == null && error.error is SocketException,
      _ => false,
    };
  }
  if (error is ApiException) {
    // ردّ من الخادم (بأي رمز) ليس انقطاعاً حتى لو ذكر نصه الاتصال.
    return error.status == null && _connectionText.hasMatch(error.message);
  }
  // نص محفوظ، أو استثناء آخر يلفّ خطأ الشبكة («Exception: SocketException…»).
  return _connectionText.hasMatch(error is String ? error : error.toString());
}
