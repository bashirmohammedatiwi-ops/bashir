import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../data/models/notification.dart';
import '../../features/home/home_link.dart';
import '../navigation/app_navigation.dart';
import '../utils/support_links.dart';

/// يفتح وجهة الإشعار حسب نوع الرابط (من القائمة أو من Push).
void openNotificationLink(BuildContext context, AppNotification notification) {
  final linkType = (notification.linkType ?? '').trim().toUpperCase();
  final linkId = notification.linkId?.trim() ?? '';
  final linkSlug = notification.linkSlug?.trim() ?? '';
  final externalUrl = notification.externalUrl?.trim() ?? '';
  final s = ProviderScope.containerOf(context).read(stringsProvider);
  final router = GoRouter.of(context);

  void goPath(String path) {
    router.push(path);
  }

  if (linkType == 'EXTERNAL_URL' && externalUrl.isNotEmpty) {
    openExternalUrl(externalUrl);
    return;
  }

  if (linkType == 'OFFERS' || linkSlug == 'offers') {
    openOffersTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }

  if (linkType == 'ORDER' && linkId.isNotEmpty) {
    goPath('/orders/$linkId');
    return;
  }

  if (linkType == 'PRODUCT') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) goPath('/product/$target');
    return;
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
    }
    return;
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
    }
    return;
  }

  if (linkType == 'PACKAGE') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) goPath('/package/$target');
    return;
  }

  if (notification.type.toUpperCase() == 'ORDER' && linkId.isNotEmpty) {
    goPath('/orders/$linkId');
    return;
  }

  if (linkType == 'OFFER' || linkType == 'PROMO') {
    openSectionLink(context, linkType: 'offers');
    return;
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

  openNotificationLink(
    context,
    AppNotification(
      id: pick(['notificationId', 'notification_id', 'id']) ?? '',
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
