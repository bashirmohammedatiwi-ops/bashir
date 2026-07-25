import 'package:flutter/material.dart';

import '../utils/responsive.dart';

/// غلاف عام يطبّق قيود التكيّف على كل الشاشات.
class ResponsiveApp extends StatelessWidget {
  final Widget child;

  const ResponsiveApp({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return MediaQuery(
      data: mq.copyWith(
        textScaler: Responsive.clampTextScaler(context),
      ),
      child: child,
    );
  }
}
