import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/notification.dart';
import '../../features/home/home_link.dart';
import '../utils/support_links.dart';

/// يفتح وجهة الإشعار حسب نوع الرابط.
void openNotificationLink(BuildContext context, AppNotification notification) {
  final linkType = (notification.linkType ?? '').toUpperCase();
  final linkId = notification.linkId?.trim() ?? '';
  final linkSlug = notification.linkSlug?.trim() ?? '';
  final externalUrl = notification.externalUrl?.trim() ?? '';

  if (linkType == 'EXTERNAL_URL' && externalUrl.isNotEmpty) {
    openExternalUrl(externalUrl);
    return;
  }

  if (linkType == 'PRODUCT') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) context.push('/product/$target');
    return;
  }

  if (linkType == 'CATEGORY' && linkId.isNotEmpty) {
    context.push('/products?categoryId=$linkId&title=التصنيف');
    return;
  }

  if (linkType == 'BRAND' && linkId.isNotEmpty) {
    context.push('/products?brandId=$linkId&title=العلامة');
    return;
  }

  if (linkType == 'PACKAGE') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) context.push('/package/$target');
    return;
  }

  // إشعارات الطلبات — النوع ORDER مع معرف الطلب
  if (notification.type.toUpperCase() == 'ORDER' && linkId.isNotEmpty) {
    context.push('/orders/$linkId');
    return;
  }

  // توافق مع إصدارات قديمة
  if (linkType == 'OFFER' || linkType == 'PROMO') {
    openSectionLink(context, linkType: 'offers');
    return;
  }
}

/// من بيانات FCM.
void openPushPayload(BuildContext context, Map<String, dynamic> data) {
  openNotificationLink(
    context,
    AppNotification(
      id: '',
      type: data['type']?.toString() ?? '',
      linkType: data['linkType']?.toString(),
      linkId: data['linkId']?.toString(),
      linkSlug: data['linkSlug']?.toString(),
      externalUrl: data['externalUrl']?.toString(),
    ),
  );
}
