import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/product_card.dart';
import '../../../data/models/product_model.dart';

class FlashSaleSection extends StatefulWidget {
  const FlashSaleSection({required this.products, this.endsAt, super.key});

  final List<ProductModel> products;
  final String? endsAt;

  @override
  State<FlashSaleSection> createState() => _FlashSaleSectionState();
}

class _FlashSaleSectionState extends State<FlashSaleSection> {
  Duration _remaining = const Duration(hours: 5, minutes: 30, seconds: 45);
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _syncTimer();
  }

  void _syncTimer() {
    _timer?.cancel();
    if (widget.endsAt != null) {
      final end = DateTime.tryParse(widget.endsAt!);
      if (end != null) {
        _remaining = end.difference(DateTime.now());
        if (_remaining.isNegative) _remaining = Duration.zero;
      }
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_remaining.inSeconds > 0) {
        setState(() => _remaining -= const Duration(seconds: 1));
      }
    });
  }

  @override
  void didUpdateWidget(covariant FlashSaleSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.endsAt != widget.endsAt) _syncTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final products = widget.products;
    if (products.isEmpty) return const SizedBox.shrink();

    final h = _remaining.inHours.remainder(24).toString().padLeft(2, '0');
    final m = _remaining.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = _remaining.inSeconds.remainder(60).toString().padLeft(2, '0');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSizes.xl,
            AppSizes.lg,
            AppSizes.xl,
            AppSizes.sm,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppStrings.flashSale,
                      style: AppTextStyles.title(size: 17).copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: 28,
                      height: 2,
                      decoration: BoxDecoration(
                        color: AppColors.gold,
                        borderRadius: BorderRadius.circular(1),
                      ),
                    ),
                  ],
                ),
              ),
              _TimeBox(value: h),
              const Text(' : ', style: TextStyle(color: AppColors.textMuted)),
              _TimeBox(value: m),
              const Text(' : ', style: TextStyle(color: AppColors.textMuted)),
              _TimeBox(value: s),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 278,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final p = products[index];
              return Container(
                width: 160,
                margin: const EdgeInsets.only(left: 10),
                child: ProductCard(product: p, index: index),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _TimeBox extends StatelessWidget {
  const _TimeBox({required this.value});
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
      ),
      child: Text(
        value,
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}
