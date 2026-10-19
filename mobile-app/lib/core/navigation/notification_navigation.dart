import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../data/models/notification.dart';
import '../../data/services/api_service.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/home/home_link.dart';
import '../../features/profile/profile_providers.dart';
import '../navigation/app_navigation.dart';
import '../navigation/deep_link_redirect.dart';
import '../utils/support_links.dart';

/// يفتح وجهة الإشعار حسب نوع الرابط (من القائمة أو من Push).
void openNotificationLink(BuildContext context, AppNotification notification) {
  final linkType = (notification.linkType ?? '').trim().toUpperCase();
  final linkId = notification.linkId?.trim() ?? '';
  final linkSlug = notification.linkSlug?.trim() ?? '';
  final externalUrl = notification.externalUrl?.trim() ?? '';
  final container = ProviderScope.containerOf(context, listen: false);
  final s = container.read(stringsProvider);
  final router = GoRouter.of(context);

  void goPath(String path) {
    // مسارات التبويبات تبدّل التبويب — دفعها كان يكدّس نسخة ثانية من الـ shell.
    if (openTabPath(context, path)) return;
    router.push(path);
  }

  if (linkType == 'EXTERNAL_URL' && externalUrl.isNotEmpty) {
    // رابط لموقعنا نفسه يُفتح داخل التطبيق مباشرة بدل المرور بالمتصفح.
    final inApp = resolveStoreUrl(externalUrl);
    if (inApp != null) {
      goPath(inApp);
    } else {
      openExternalUrl(externalUrl);
    }
    return;
  }

  if (linkType == 'OFFERS' || linkSlug == 'offers') {
    openOffersTab(context, container);
    return;
  }

  if (linkType == 'ORDER' && linkId.isNotEmpty) {
    goPath('/orders/$linkId');
    return;
  }

  if (linkType == 'PRODUCT') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) {
      goPath('/product/$target');
      return;
    }
  }

  if (linkType == 'CATEGORY') {
    if (linkSlug.isNotEmpty) {
      goPath('/category/$linkSlug');
      return;
    }
    if (linkId.isNotEmpty) {
      final q = {
        'categoryId': linkId,
        'title': s.categoriesTitle,
      };
      goPath(Uri(path: '/products', queryParameters: q).toString());
      return;
    }
  }

  if (linkType == 'BRAND') {
    // brandId أكثر ثباتاً من الـ slug عند فتح الإشعار.
    if (linkId.isNotEmpty) {
      final title = (notification.linkLabel?.trim().isNotEmpty == true)
          ? notification.linkLabel!.trim()
          : s.brands;
      goPath(
        Uri(
          path: '/products',
          queryParameters: {'brandId': linkId, 'title': title},
        ).toString(),
      );
      return;
    }
    if (linkSlug.isNotEmpty) {
      goPath('/brand/$linkSlug');
      return;
    }
  }

  if (linkType == 'PACKAGE') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) {
      goPath('/package/$target');
      return;
    }
  }

  if (notification.type.toUpperCase() == 'ORDER' && linkId.isNotEmpty) {
    goPath('/orders/$linkId');
    return;
  }

  if (linkType == 'OFFER' || linkType == 'PROMO') {
    openSectionLink(context, linkType: 'offers');
    return;
  }

  // بلا وجهة (NONE أو نوع غير معروف أو رابط ناقص): صفحة الإشعارات تعرض نصّه
  // كاملاً بدل فتح التطبيق بلا سياق. لا نكرّرها إن كانت هي المفتوحة أصلاً.
  if (container.read(authProvider).isAuthenticated &&
      router.state.uri.path != '/notifications') {
    router.push('/notifications');
  }
}

/// من بيانات FCM — يوحّد المفاتيح المحتملة من Android/iOS.
void openPushPayload(BuildContext context, Map<String, dynamic> data) {
  String? pick(List<String> keys) {
    for (final key in keys) {
      final v = data[key]?.toString().trim();
      if (v != null && v.isNotEmpty) return v;
    }
    return null;
  }

  final id = pick(['notificationId', 'notification_id', 'id']) ?? '';
  final c = ProviderScope.containerOf(context, listen: false);
  // لمس الإشعار يعني قراءته: يُعلَّم مقروءاً ثم يتحدّث عدّاد الجرس في الواجهات.
  if (id.isNotEmpty && c.read(authProvider).isAuthenticated) {
    unawaited(
      c.read(apiServiceProvider).markNotificationRead(id).whenComplete(() => c.invalidate(notificationsProvider)),
    );
  }

  openNotificationLink(
    context,
    AppNotification(
      id: id,
      type: pick(['type']) ?? '',
      title: pick(['title']) ?? '',
      body: pick(['body']) ?? '',
      imageUrl: pick(['imageUrl', 'image_url', 'image']),
      linkType: pick(['linkType', 'link_type']),
      linkId: pick(['linkId', 'link_id']),
      linkSlug: pick(['linkSlug', 'link_slug']),
      linkLabel: pick(['linkLabel', 'link_label']),
      externalUrl: pick(['externalUrl', 'external_url', 'url']),
    ),
  );
}
