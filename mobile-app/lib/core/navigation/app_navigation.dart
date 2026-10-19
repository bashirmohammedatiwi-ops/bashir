import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/shell/main_shell.dart';
import '../../features/shell/nav_tabs.dart';
import '../../features/worlds/worlds_provider.dart';
import 'deep_link_redirect.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

/// طلب بحث جاهز لدليل البراندات — يضبطه رابط «/brands?q=…» قبل فتح التبويب،
/// وشاشة البراندات تطبّقه ثم تعيده null.
final brandsSearchRequestProvider = StateProvider<String?>((_) => null);

/// يفتح تبويباً في الشريط السفلي مع العودة للرئيسية.
void openMainTab(BuildContext context, ProviderContainer container, int index) {
  container.read(navIndexProvider.notifier).state = index;
  final router = GoRouter.of(context);
  if (router.state.uri.path != '/') {
    context.go('/');
  }
}

/// مسارات تبويبات الشريط السفلي (/cart، /offers، /brands…) تبدّل التبويب بدل
/// دفع نسخة ثانية من الـ shell فوق الأولى (كان الرجوع يبدو معطّلاً).
/// يعيد true إن تولّى المسار، وإلا يتركه للمستدعي ليدفعه كالمعتاد.
bool openTabPath(BuildContext context, String path) {
  final uri = Uri.tryParse(path.trim());
  // روابط كاملة (https://…) ليست مسارات داخلية — لمستدعيها قرارها.
  if (uri == null || uri.hasScheme || uri.hasAuthority) return false;
  var p = uri.path;
  if (p.length > 1 && p.endsWith('/')) p = p.substring(0, p.length - 1);

  final container = ProviderScope.containerOf(context, listen: false);
  final int tab;
  switch (p) {
    case '/':
      final world = worldSlugOf(uri);
      if (world != null) container.read(selectedWorldSlugProvider.notifier).state = world;
      tab = NavTabs.home;
    case '/cart':
      tab = NavTabs.cart;
    case '/offers':
      tab = NavTabs.offers;
    case '/categories':
    case '/categories-tab':
      tab = NavTabs.categories;
    case '/brands':
      final q = uri.queryParameters['q']?.trim();
      if (q != null && q.isNotEmpty) {
        container.read(brandsSearchRequestProvider.notifier).state = q;
      }
      tab = NavTabs.brands;
    case '/account':
      tab = NavTabs.account;
    default:
      return false;
  }
  openMainTab(context, container, tab);
  return true;
}

void openCartTab(BuildContext context, ProviderContainer container) =>
    openMainTab(context, container, NavTabs.cart);

void openOffersTab(BuildContext context, ProviderContainer container) =>
    openMainTab(context, container, NavTabs.offers);

void openCategoriesTab(BuildContext context, ProviderContainer container) =>
    openMainTab(context, container, NavTabs.categories);

/// يفتح «ديما» — المستشارة الشخصية.
void openAssistantTab(BuildContext context, ProviderContainer container) =>
    context.push('/advisor');

void openHomeTab(BuildContext context, ProviderContainer container) =>
    openMainTab(context, container, NavTabs.home);

/// للاستخدام بدون BuildContext (مثل الإشعارات الفورية).
void openMainTabFromContainer(ProviderContainer container, int index) {
  container.read(navIndexProvider.notifier).state = index;
  final ctx = rootNavigatorKey.currentContext;
  if (ctx == null || !ctx.mounted) return;
  if (GoRouter.of(ctx).state.uri.path != '/') {
    ctx.go('/');
  }
}

void openCartFromContainer(ProviderContainer container) =>
    openMainTabFromContainer(container, NavTabs.cart);

void openOffersFromContainer(ProviderContainer container) =>
    openMainTabFromContainer(container, NavTabs.offers);

void openAssistantFromContainer(ProviderContainer container) {
  final ctx = rootNavigatorKey.currentContext;
  if (ctx == null || !ctx.mounted) return;
  GoRouter.of(ctx).push('/advisor');
}
