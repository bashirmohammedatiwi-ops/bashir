import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/product_card.dart';
import '../../../data/models/product_model.dart';

class FlashSaleSection extends StatefulWidget {
  const FlashSaleSection({
    super.key,
    required this.products,
    this.endsAt,
  });

  final List<ProductModel> products;
  final DateTime? endsAt;

  @override
  State<FlashSaleSection> createState() => _FlashSaleSectionState();
}

class _FlashSaleSectionState extends State<FlashSaleSection> {
  late Duration _remaining;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remaining = _initialRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_remaining.inSeconds > 0) {
        setState(() => _remaining -= const Duration(seconds: 1));
      }
    });
  }

  Duration _initialRemaining() {
    if (widget.endsAt != null) {
      final diff = widget.endsAt!.difference(DateTime.now());
      if (diff.inSeconds > 0) return diff;
    }
    return const Duration(hours: 5, minutes: 30, seconds: 45);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.products.isEmpty) {
      return const SizedBox.shrink();
    }

    final products = widget.products;
    final h = _remaining.inHours.remainder(24).toString().padLeft(2, '0');
    final m = _remaining.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = _remaining.inSeconds.remainder(60).toString().padLeft(2, '0');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSizes.xl,
            AppSizes.md,
            AppSizes.xl,
            AppSizes.sm,
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.flash_on_rounded,
                          color: AppColors.gold,
                          size: 17,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          AppStrings.flashSale,
                          style: AppTextStyles.title(size: 16).copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Luxe.goldenRule(width: 50),
                  ],
                ),
              ),
              _Countdown(digits: '$h:$m:$s'),
            ],
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 296,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
            itemCount: products.length,
            itemBuilder: (context, index) {
              return SizedBox(
                width: 168,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  child: ProductCard(
                    product: products[index],
                    index: index,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _Countdown extends StatelessWidget {
  const _Countdown({required this.digits});
  final String digits;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
        boxShadow: const [
          BoxShadow(
            color: Color(0x224A2466),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: digits.split('').map((c) {
          if (c == ':') {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Text(
                ':',
                style: AppTextStyles.serif(
                  color: AppColors.gold,
                  size: 13,
                  weight: FontWeight.w500,
                ),
              ),
            );
          }
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 1),
            child: Text(
              CurrencyFormatter.toArabicDigits(c),
              style: AppTextStyles.serif(
                color: Colors.white,
                size: 14,
                weight: FontWeight.w500,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
