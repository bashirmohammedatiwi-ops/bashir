import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/models/loyalty_model.dart';

class LoyaltyNotifier extends StateNotifier<LoyaltyState> {
  LoyaltyNotifier(this._ref)
      : super(const LoyaltyState(points: 120, tier: LoyaltyTier.silver)) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    final prefs = _ref.read(prefsProvider);
    final points = prefs.loyaltyPoints;
    state = LoyaltyState(
      points: points,
      tier: LoyaltyTierX.fromPoints(points),
      history: _defaultHistory,
    );
  }

  static final List<LoyaltyHistoryEntry> _defaultHistory = [
    LoyaltyHistoryEntry(
      id: 'h1',
      title: 'شراء منتجات',
      points: 25,
      date: DateTime.now().subtract(const Duration(days: 2)),
      isEarned: true,
    ),
    LoyaltyHistoryEntry(
      id: 'h2',
      title: 'استخدام نقاط',
      points: -100,
      date: DateTime.now().subtract(const Duration(days: 5)),
      isEarned: false,
    ),
    LoyaltyHistoryEntry(
      id: 'h3',
      title: 'أول طلب',
      points: 50,
      date: DateTime.now().subtract(const Duration(days: 10)),
      isEarned: true,
    ),
  ];

  Future<void> addPoints(int points, String reason) async {
    final newPoints = state.points + points;
    state = state.copyWith(
      points: newPoints,
      tier: LoyaltyTierX.fromPoints(newPoints),
      history: [
        LoyaltyHistoryEntry(
          id: 'h_${DateTime.now().millisecondsSinceEpoch}',
          title: reason,
          points: points,
          date: DateTime.now(),
          isEarned: points > 0,
        ),
        ...state.history,
      ],
    );
    final prefs = _ref.read(prefsProvider);
    await prefs.setLoyaltyPoints(newPoints);
    await prefs.setLoyaltyTier(state.tier.name);
  }

  Future<void> redeemPoints(int points) async {
    await addPoints(-points, 'استخدام نقاط');
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
