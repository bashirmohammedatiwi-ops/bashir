import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/loyalty_model.dart';
import '../../../data/remote/app_remote_data_source.dart';

class LoyaltyNotifier extends StateNotifier<AsyncValue<LoyaltyState>> {
  LoyaltyNotifier(this._ref) : super(const AsyncValue.loading()) {
    refresh();
  }

  final Ref _ref;

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final raw = await _ref.read(appRemoteDataSourceProvider).loyaltySummary();
      final points = (raw['points'] as num?)?.toInt() ?? 0;
      final tierName = (raw['tier'] as String?) ?? 'normal';
      final tier = LoyaltyTier.values.firstWhere(
        (e) => e.name == tierName,
        orElse: () => LoyaltyTier.normal,
      );
      final history = (raw['history'] as List? ?? const [])
          .cast<Map<String, dynamic>>()
          .map(
            (h) => LoyaltyHistoryEntry(
              id: h['id'] as String,
              title: (h['title'] as String?) ?? '',
              points: (h['points'] as num?)?.toInt() ?? 0,
              date: DateTime.tryParse(h['date']?.toString() ?? '') ?? DateTime.now(),
              isEarned: h['isEarned'] as bool? ?? true,
            ),
          )
          .toList();
      state = AsyncValue.data(
        LoyaltyState(points: points, tier: tier, history: history),
      );
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class LoyaltyState {
  const LoyaltyState({
    required this.points,
    required this.tier,
    this.history = const [],
    this.pointsApplied = 0,
  });

  final int points;
  final LoyaltyTier tier;
  final List<LoyaltyHistoryEntry> history;
  final int pointsApplied;

  int get discountValue => (pointsApplied ~/ 100) * 1000;

  LoyaltyState copyWith({
    int? points,
    LoyaltyTier? tier,
    List<LoyaltyHistoryEntry>? history,
    int? pointsApplied,
  }) =>
      LoyaltyState(
        points: points ?? this.points,
        tier: tier ?? this.tier,
        history: history ?? this.history,
        pointsApplied: pointsApplied ?? this.pointsApplied,
      );
}

final loyaltyProvider =
    StateNotifierProvider<LoyaltyNotifier, AsyncValue<LoyaltyState>>((ref) {
  return LoyaltyNotifier(ref);
});
