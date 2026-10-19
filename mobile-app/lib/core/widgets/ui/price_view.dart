import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/worlds/world_theme.dart';
import '../../l10n/app_strings.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_shadows.dart';
import '../../theme/app_text.dart';
import '../../utils/formatters.dart';
import '../ds_strings.dart';

/// شارة نصية صغيرة ممتلئة اللون («جديد»، «عرض») — نفس شكل شارة الخصم.
class LabelBadge extends StatelessWidget {
  final String label;
  final Color color;
  final bool large;

  /// مقاس البطاقات المزدحمة (حشوة 8×4 ونص 10.5).
  final bool small;

  const LabelBadge({
    super.key,
    required this.label,
    required this.color,
    this.large = false,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final padding = large
        ? const EdgeInsets.symmetric(horizontal: 10, vertical: 4)
        : small
            ? const EdgeInsets.symmetric(horizontal: 8, vertical: 4)
            : const EdgeInsets.symmetric(horizontal: 7, vertical: 3);
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppCorners.pill),
        boxShadow: AppShadows.floating(context.worldTheme, tint: color),
      ),
      child: Text(
        label,
        maxLines: 1,
        style: AppText.micro.copyWith(
          color: Colors.white,
          fontSize: large ? 12.5 : (small ? 10.5 : 11),
          height: small ? 1 : null,
        ),
      ),
    );
  }
}

/// شارة الخصم الموحّدة "-25%".
class DiscountBadge extends StatelessWidget {
  final num percent;
  final bool large;

  /// مقاس البطاقات المزدحمة (حشوة 8×4 ونص 10.5).
  final bool small;

  const DiscountBadge({
    super.key,
    required this.percent,
    this.large = false,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    if (percent <= 0) return const SizedBox.shrink();
    return LabelBadge(
      label: formatDiscount(percent),
      color: AppColors.sale,
      large: large,
      small: small,
    );
  }
}

/// السعر الحالي + السعر قبل الخصم — نفس الترتيب والألوان في كل البطاقات.
class PriceView extends StatelessWidget {
  final num price;
  final num? oldPrice;
  final bool large;
  final bool stacked;

  /// سطر واحد يصغر ليتّسع (البطاقات الضيقة) — القديم صغيراً بجانب الحالي على نفس خط القاعدة.
  final bool compact;

  /// يعرض «وفّري 5,000 د.ع» تحت السعر (أو بجانبه في [compact]) عند وجود خصم.
  final bool showSaving;

  const PriceView({
    super.key,
    required this.price,
    this.oldPrice,
    this.large = false,
    this.stacked = false,
    this.showSaving = false,
  }) : compact = false;

  const PriceView.compact({
    super.key,
    required this.price,
    this.oldPrice,
    this.showSaving = false,
  })  : large = false,
        stacked = false,
        compact = true;

  bool get _onSale => oldPrice != null && oldPrice! > price;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final current = Text(
      formatPrice(price),
      maxLines: 1,
      style: (large ? AppText.priceLarge : AppText.price).copyWith(
        color: _onSale ? AppColors.sale : t.ink,
      ),
    );
    if (!_onSale) return compact ? _fit(current) : current;

    final old = Text(
      formatPrice(oldPrice),
      maxLines: 1,
      style: AppText.caption.copyWith(
        fontSize: compact ? 10.5 : (large ? 14 : 11.5),
        height: compact ? 1.1 : null,
        color: t.inkMuted,
        decoration: TextDecoration.lineThrough,
        decorationColor: t.inkMuted,
      ),
    );
    final saving = showSaving ? _Saving(amount: oldPrice! - price, small: compact) : null;

    if (compact) {
      return _fit(
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            current,
            const SizedBox(width: 5),
            old,
            if (saving != null) ...[const SizedBox(width: 6), saving],
          ],
        ),
      );
    }
    if (stacked) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          current,
          const SizedBox(height: 1),
          old,
          if (saving != null) ...[const SizedBox(height: 4), saving],
        ],
      );
    }
    final row = Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      children: [current, old],
    );
    if (saving == null) return row;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [row, const SizedBox(height: 4), saving],
    );
  }

  /// سطر واحد لا يلتف أبداً — يصغر بدل أن يقصّ أو ينزل لسطر ثانٍ.
  static Widget _fit(Widget child) => FittedBox(
        fit: BoxFit.scaleDown,
        alignment: AlignmentDirectional.centerStart,
        child: child,
      );
}

/// «وفّري 5,000 د.ع» بلون الخصم — النص من لغة الواجهة الحالية.
class _Saving extends ConsumerWidget {
  final num amount;
  final bool small;

  const _Saving({required this.amount, required this.small});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Text(
      ref.s.dsYouSave(formatPrice(amount)),
      maxLines: 1,
      style: AppText.micro.copyWith(
        color: AppColors.sale,
        fontSize: small ? 10.5 : 11.5,
      ),
    );
  }
}
