import 'package:shared_preferences/shared_preferences.dart';

abstract final class PrefsKeys {
  static const onboardingDone = 'onboarding_done';
  static const isLoggedIn = 'is_logged_in';
  static const isGuest = 'is_guest';
  static const cartJson = 'cart_json';
  static const wishlistIds = 'wishlist_ids';
  static const loyaltyPoints = 'loyalty_points';
  static const loyaltyTier = 'loyalty_tier';
  static const recentSearches = 'recent_searches';
  static const userProfile = 'user_profile';
  static const addresses = 'addresses';
  static const notificationsEnabled = 'notifications_enabled';
  static const firstOrderDone = 'first_order_done';
}

class PrefsService {
  PrefsService(this._prefs);
  final SharedPreferences _prefs;

  static Future<PrefsService> init() async {
    return PrefsService(await SharedPreferences.getInstance());
  }

  bool get onboardingDone => _prefs.getBool(PrefsKeys.onboardingDone) ?? false;
  Future<void> setOnboardingDone(bool v) =>
      _prefs.setBool(PrefsKeys.onboardingDone, v);

  bool get isLoggedIn => _prefs.getBool(PrefsKeys.isLoggedIn) ?? false;
  Future<void> setLoggedIn(bool v) => _prefs.setBool(PrefsKeys.isLoggedIn, v);

  bool get isGuest => _prefs.getBool(PrefsKeys.isGuest) ?? false;
  Future<void> setGuest(bool v) => _prefs.setBool(PrefsKeys.isGuest, v);

  int get loyaltyPoints => _prefs.getInt(PrefsKeys.loyaltyPoints) ?? 120;
  Future<void> setLoyaltyPoints(int v) =>
      _prefs.setInt(PrefsKeys.loyaltyPoints, v);

  String get loyaltyTier => _prefs.getString(PrefsKeys.loyaltyTier) ?? 'silver';
  Future<void> setLoyaltyTier(String v) =>
      _prefs.setString(PrefsKeys.loyaltyTier, v);

  List<String> get wishlistIds =>
      _prefs.getStringList(PrefsKeys.wishlistIds) ?? [];
  Future<void> setWishlistIds(List<String> ids) =>
      _prefs.setStringList(PrefsKeys.wishlistIds, ids);

  List<String> get recentSearches =>
      _prefs.getStringList(PrefsKeys.recentSearches) ?? [];
  Future<void> setRecentSearches(List<String> s) =>
      _prefs.setStringList(PrefsKeys.recentSearches, s);

  String? get cartJson => _prefs.getString(PrefsKeys.cartJson);
  Future<void> setCartJson(String? json) {
    if (json == null) return _prefs.remove(PrefsKeys.cartJson);
    return _prefs.setString(PrefsKeys.cartJson, json);
  }

  bool get firstOrderDone => _prefs.getBool(PrefsKeys.firstOrderDone) ?? false;
  Future<void> setFirstOrderDone(bool v) =>
      _prefs.setBool(PrefsKeys.firstOrderDone, v);

  bool get notificationsEnabled =>
      _prefs.getBool(PrefsKeys.notificationsEnabled) ?? true;
  Future<void> setNotificationsEnabled(bool v) =>
      _prefs.setBool(PrefsKeys.notificationsEnabled, v);
}
