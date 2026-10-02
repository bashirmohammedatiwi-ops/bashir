import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/shell/main_shell.dart';
import '../../features/shell/nav_tabs.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

/// يفتح تبويباً في الشريط السفلي مع العودة للرئيسية.
void openMainTab(BuildContext context, ProviderContainer container, int index) {
  container.read(navIndexProvider.notifier).state = index;
  final router = GoRouter.of(context);
  if (router.state.uri.path != '/') {
    context.go('/');
  }
}

void openCartTab(BuildContext context, ProviderContainer container) =>
    openMainTab(context, container, NavTabs.cart);

void openOffersTab(BuildContext context, ProviderContainer container) =>
    openMainTab(context, container, NavTabs.offers);

void openCategoriesTab(BuildContext context, ProviderContainer container) =>
    openMainTab(context, container, NavTabs.categories);

void openAssistantTab(BuildContext context, ProviderContainer container) =>
    openHomeTab(context, container);

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

void openAssistantFromContainer(ProviderContainer container) =>
    openMainTabFromContainer(container, NavTabs.home);
