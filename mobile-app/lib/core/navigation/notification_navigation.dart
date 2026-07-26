import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../data/models/notification.dart';
import '../../features/home/home_link.dart';
import '../navigation/app_navigation.dart';
import '../utils/support_links.dart';

/// يفتح وجهة الإشعار حسب نوع الرابط.
void openNotificationLink(BuildContext context, AppNotification notification) {
  final linkType = (notification.linkType ?? '').toUpperCase();
  final linkId = notification.linkId?.trim() ?? '';
  final linkSlug = notification.linkSlug?.trim() ?? '';
  final externalUrl = notification.externalUrl?.trim() ?? '';
  final s = ProviderScope.containerOf(context).read(stringsProvider);

  if (linkType == 'EXTERNAL_URL' && externalUrl.isNotEmpty) {
    openExternalUrl(externalUrl);
    return;
  }

  if (linkType == 'OFFERS' || linkSlug == 'offers') {
    openOffersTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }

  if (linkType == 'ORDER' && linkId.isNotEmpty) {
    context.push('/orders/$linkId');
    return;
  }

  if (linkType == 'PRODUCT') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) context.push('/product/$target');
    return;
  }

  if (linkType == 'CATEGORY') {
    if (linkSlug.isNotEmpty) {
      context.push('/category/$linkSlug');
      return;
    }
    if (linkId.isNotEmpty) {
      context.push('/products?categoryId=$linkId&title=${Uri.encodeComponent(s.categoriesTitle)}');
    }
    return;
  }

  if (linkType == 'BRAND') {
    if (linkSlug.isNotEmpty) {
      context.push('/brand/$linkSlug');
      return;
    }
    if (linkId.isNotEmpty) {
      context.push('/products?brandId=$linkId&title=${Uri.encodeComponent(s.brands)}');
    }
    return;
  }

  if (linkType == 'PACKAGE') {
    final target = linkSlug.isNotEmpty ? linkSlug : linkId;
    if (target.isNotEmpty) context.push('/package/$target');
    return;
  }

  if (notification.type.toUpperCase() == 'ORDER' && linkId.isNotEmpty) {
    context.push('/orders/$linkId');
    return;
  }

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
      id: data['notificationId']?.toString() ?? '',
      type: data['type']?.toString() ?? '',
      title: data['title']?.toString() ?? '',
      body: data['body']?.toString() ?? '',
      imageUrl: data['imageUrl']?.toString(),
      linkType: data['linkType']?.toString(),
      linkId: data['linkId']?.toString(),
      linkSlug: data['linkSlug']?.toString(),
      linkLabel: data['linkLabel']?.toString(),
      externalUrl: data['externalUrl']?.toString(),
    ),
  );
}
