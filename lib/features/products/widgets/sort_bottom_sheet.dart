import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../providers/filter_provider.dart';

class SortBottomSheet extends ConsumerWidget {
  const SortBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(filterProvider).sort;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('ترتيب حسب', style: AppTextStyles.headline()),
          const SizedBox(height: 16),
          ...SortOption.values.map((option) {
            final label = switch (option) {
              SortOption.newest => AppStrings.sortNewest,
              SortOption.bestSelling => AppStrings.sortBestSelling,
              SortOption.priceAsc => AppStrings.sortPriceAsc,
              SortOption.priceDesc => AppStrings.sortPriceDesc,
              SortOption.rating => AppStrings.sortRating,
            };
            return RadioListTile<SortOption>(
              value: option,
              groupValue: current,
              title: Text(label),
              onChanged: (v) {
                if (v != null) {
                  ref.read(filterProvider.notifier).update(
                      ref.read(filterProvider).copyWith(sort: v));
                  Navigator.pop(context);
                }
              },
            );
          }),
        ],
      ),
    );
  }
}
