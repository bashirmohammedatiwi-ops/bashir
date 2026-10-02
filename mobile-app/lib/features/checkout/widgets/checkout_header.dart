import 'package:flutter/material.dart';

import '../../../core/l10n/app_strings.dart';
import 'checkout_theme.dart';

class CheckoutHeader extends StatelessWidget {
  final AppStrings s;
  final int itemCount;
  final VoidCallback onBack;

  const CheckoutHeader({
    super.key,
    required this.s,
    required this.itemCount,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: CheckoutTheme.headerDecoration(),
      padding: EdgeInsets.fromLTRB(8, MediaQuery.paddingOf(context).top + 4, 16, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: onBack,
                icon: const Icon(Icons.arrow_forward_rounded, color: CheckoutTheme.charcoal),
              ),
              Expanded(
                child: Text(
                  s.checkout,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: CheckoutTheme.charcoal,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: CheckoutTheme.brandSoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  s.itemCountLabel(itemCount),
                  style: const TextStyle(
                    color: CheckoutTheme.brandDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}


