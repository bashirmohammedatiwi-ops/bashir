import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/models/loyalty_model.dart';
import '../../../data/remote/store_api.dart';
import '../../auth/providers/auth_provider.dart';

class LoyaltyNotifier extends StateNotifier<LoyaltyState> {
  LoyaltyNotifier(this._ref)
      : super(const LoyaltyState(points: 0, tier: LoyaltyTier.normal)) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    if (_ref.read(isLoggedInProvider)) {
      await refreshFromApi();
      return;
    }
    state = const LoyaltyState(points: 0, tier: LoyaltyTier.normal);
  }

  Future<void> refreshFromApi() async {
    if (!_ref.read(isLoggedInProvider)) return;
    try {
      final data = await _ref.read(storeApiProvider).loyalty();
      final points = (data['points'] as num?)?.toInt() ??
          (data['balance'] as num?)?.toInt() ??
          0;
      final tierName = data['tier'] as String?;
      state = LoyaltyState(
        points: points,
        tier: tierName != null
            ? LoyaltyTier.values.firstWhere(
                (e) => e.name == tierName,
                orElse: () => LoyaltyTierX.fromPoints(points),
              )
            : LoyaltyTierX.fromPoints(points),
        history: const [],
      );
      final prefs = _ref.read(prefsProvider);
      await prefs.setLoyaltyPoints(points);
      await prefs.setLoyaltyTier(state.tier.name);
    } catch (_) {}
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
    StateNotifierProvider<LoyaltyNotifier, LoyaltyState>((ref) {
  return LoyaltyNotifier(ref);
});
