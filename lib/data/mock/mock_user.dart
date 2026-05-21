import '../models/loyalty_model.dart';
import '../models/user_model.dart';

abstract final class MockUser {
  static const UserModel defaultUser = UserModel(
    id: 'user_1',
    name: 'سارة أحمد',
    phone: '+9647701234567',
    email: 'sara@example.com',
    points: 120,
    tier: LoyaltyTier.silver,
    orderCount: 3,
  );
}
