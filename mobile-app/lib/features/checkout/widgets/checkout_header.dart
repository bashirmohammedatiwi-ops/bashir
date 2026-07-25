import 'package:flutter/material.dart';

import 'checkout_theme.dart';

class CheckoutHeader extends StatelessWidget {
  final int itemCount;
  final VoidCallback onBack;

  const CheckoutHeader({
    super.key,
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
              const Expanded(
                child: Text(
                  'إتمام الطلب',
                  style: TextStyle(
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
                  '$itemCount منتج',
                  style: const TextStyle(
                    color: CheckoutTheme.brandDark,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _StepDot(active: true, label: 'التوصيل'),
              _StepLine(active: true),
              _StepDot(active: true, label: 'الدفع'),
              _StepLine(active: false),
              _StepDot(active: false, label: 'تأكيد'),
            ],
          ),
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  final bool active;
  final String label;

  const _StepDot({required this.active, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: active ? CheckoutTheme.brand : CheckoutTheme.brandSoft,
              border: Border.all(
                color: active ? CheckoutTheme.brandDark : CheckoutTheme.brand.withValues(alpha: 0.3),
                width: 2,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: active ? CheckoutTheme.brandDark : CheckoutTheme.charcoal.withValues(alpha: 0.45),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepLine extends StatelessWidget {
  final bool active;
  const _StepLine({required this.active});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 22),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(2),
          color: active ? CheckoutTheme.brand : CheckoutTheme.brandSoft,
        ),
      ),
    );
  }
}
