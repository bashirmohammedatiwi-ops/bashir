import 'package:flutter/material.dart';

/// Listenable for GoRouter — auth updates wired in [routerProvider].
class RouterRefresh extends ChangeNotifier {
  void refresh() => notifyListeners();
}
