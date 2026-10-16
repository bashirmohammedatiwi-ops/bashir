import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/utils/friendly_error.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import 'advisor_models.dart';

class AdvisorSession {
  final List<AdvisorEntry> entries;
  final bool thinking;
  final Map<String, dynamic>? state;
  final List<String> prompts;
  final String? error;

  const AdvisorSession({
    this.entries = const [],
    this.thinking = false,
    this.state,
    this.prompts = const [],
    this.error,
  });

  AdvisorSession copyWith({
    List<AdvisorEntry>? entries,
    bool? thinking,
    Map<String, dynamic>? state,
    List<String>? prompts,
    String? error,
    bool clearError = false,
  }) =>
      AdvisorSession(
        entries: entries ?? this.entries,
        thinking: thinking ?? this.thinking,
        state: state ?? this.state,
        prompts: prompts ?? this.prompts,
        error: clearError ? null : (error ?? this.error),
      );

  /// آخر رد من المستشارة (لشرائح «ما فهمته» والاقتراحات الحالية).
  AdvisorReply? get lastReply {
    for (final e in entries.reversed) {
      if (e is BotEntry) return e.reply;
    }
    return null;
  }
}

/// جلسة «ديما» — تبقى أثناء التنقل في التطبيق، والحالة يحملها التطبيق للخادم.
class AdvisorController extends StateNotifier<AdvisorSession> {
  final Ref _ref;
  AdvisorController(this._ref) : super(const AdvisorSession());

  ApiService get _api => _ref.read(apiServiceProvider);

  String? get _firstName {
    final name = _ref.read(authProvider).user?.name.trim() ?? '';
    return name.isEmpty ? null : name.split(RegExp(r'\s+')).first;
  }

  Future<void> start() async {
    if (state.entries.isNotEmpty || state.thinking) return;
    state = state.copyWith(thinking: true, clearError: true);
    final gen = _gen;
    try {
      final j = await _api.advisorWelcome(name: _firstName);
      final reply = AdvisorReply.fromJson(j);
      if (gen != _gen || !mounted) return;
      state = state.copyWith(entries: [BotEntry(reply)], thinking: false, prompts: reply.prompts);
    } catch (e) {
      if (gen != _gen || !mounted) return;
      state = state.copyWith(thinking: false, error: friendlyError(e));
    }
  }

  Future<void> send(String text) async {
    final t = text.trim();
    if (t.isEmpty || state.thinking) return;
    await _turn(UserEntry(t), message: t);
  }

  /// زر اقتراح: نعرض نصه كرسالة من الزبونة ونرسل فعله.
  Future<void> tap(AdvisorChip chip) async {
    if (state.thinking) return;
    final label = [if (chip.emoji != null) chip.emoji, chip.label].join(' ');
    if (chip.isAction) {
      await _turn(UserEntry(label), action: chip.value);
    } else {
      await _turn(UserEntry(label), message: chip.value);
    }
  }

  /// إجابة اختبار (قد تكون متعددة الاختيار).
  Future<void> answerQuiz(List<AdvisorChip> picked) async {
    if (picked.isEmpty || state.thinking) return;
    final label = picked.map((c) => [if (c.emoji != null) c.emoji, c.label].join(' ')).join('، ');
    final action = 'quiz:ans=${picked.map((c) => c.value).join(';')}';
    await _turn(UserEntry(label), action: action);
  }

  /// إزالة شيء فهمته (مثل الميزانية) وإعادة الترشيح.
  Future<void> removeUnderstood(AdvisorUnderstood u) async {
    if (state.thinking) return;
    await _turn(UserEntry('بدون ${u.label.replaceAll(RegExp(r'^[^\p{L}\d]+', unicode: true), '')}'), action: '${u.key};act:recommend');
  }

  void reset() {
    _gen++;
    _pending = null;
    state = const AdvisorSession();
    start();
  }

  /// إعادة آخر طلب فشل (دون تكرار فقاعة الزبونة).
  Future<void> retry() async {
    if (state.thinking) return;
    if (state.entries.isEmpty) return start();
    final p = _pending;
    if (p == null) return;
    await _turn(null, message: p.message, action: p.action);
  }

  ({String? message, String? action})? _pending;

  /// يتغيّر مع «محادثة جديدة» — فيُهمل أي رد متأخر من الجلسة السابقة.
  int _gen = 0;

  Future<void> _turn(UserEntry? user, {String? message, String? action}) async {
    _pending = (message: message, action: action);
    state = state.copyWith(entries: [...state.entries, if (user != null) user], thinking: true, clearError: true);
    final started = DateTime.now();
    final gen = _gen;
    try {
      final j = await _api.advisorChat(message: message, action: action, state: state.state, firstName: _firstName);
      final reply = AdvisorReply.fromJson(j);
      // مهلة قصيرة للتفكير — تمنح الحركة وقتاً لتُرى بدل ظهور مفاجئ.
      final elapsed = DateTime.now().difference(started);
      const minThink = Duration(milliseconds: 650);
      if (elapsed < minThink) await Future<void>.delayed(minThink - elapsed);
      if (gen != _gen || !mounted) return;
      _pending = null;
      state = state.copyWith(entries: [...state.entries, BotEntry(reply)], thinking: false, state: reply.state);
    } catch (e) {
      if (gen != _gen || !mounted) return;
      state = state.copyWith(thinking: false, error: friendlyError(e));
    }
  }
}

final advisorProvider = StateNotifierProvider<AdvisorController, AdvisorSession>(
  (ref) => AdvisorController(ref),
);
