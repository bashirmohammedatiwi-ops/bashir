import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/utils/barcode_util.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/json.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import 'advisor_models.dart';
import 'advisor_profile.dart';

class AdvisorSession {
  final List<AdvisorEntry> entries;
  final bool thinking;
  final Map<String, dynamic>? state;
  final List<String> prompts;
  final String? error;
  /// منتجات اختارتها للمقارنة (حتى 3).
  final List<AdvisorProduct> comparing;
  /// إشعار عابر («حفظت في ملفكِ: …») — يتغير رقمه مع كل إشعار جديد.
  final ({int id, String text})? notice;

  const AdvisorSession({
    this.entries = const [],
    this.thinking = false,
    this.state,
    this.prompts = const [],
    this.error,
    this.comparing = const [],
    this.notice,
  });

  AdvisorSession copyWith({
    List<AdvisorEntry>? entries,
    bool? thinking,
    Map<String, dynamic>? state,
    List<String>? prompts,
    String? error,
    bool clearError = false,
    List<AdvisorProduct>? comparing,
    ({int id, String text})? notice,
  }) =>
      AdvisorSession(
        entries: entries ?? this.entries,
        thinking: thinking ?? this.thinking,
        state: state ?? this.state,
        prompts: prompts ?? this.prompts,
        error: clearError ? null : (error ?? this.error),
        comparing: comparing ?? this.comparing,
        notice: notice ?? this.notice,
      );

  /// آخر رد من المستشارة (لشرائح «ما فهمته» والاقتراحات الحالية).
  AdvisorReply? get lastReply {
    for (final e in entries.reversed) {
      if (e is BotEntry) return e.reply;
    }
    return null;
  }
}

/// جلسة «ديما» — تبقى أثناء التنقل، وتُحفظ على الجهاز لتكملي من حيث توقفتِ.
class AdvisorController extends StateNotifier<AdvisorSession> {
  final Ref _ref;
  AdvisorController(this._ref) : super(const AdvisorSession());

  static const _storeKey = 'advisor_session_v2';
  static const _keepFor = Duration(days: 3);
  static const _maxStored = 24;

  ApiService get _api => _ref.read(apiServiceProvider);

  String? get _firstName {
    final name = _ref.read(authProvider).user?.name.trim() ?? '';
    return name.isEmpty ? null : name.split(RegExp(r'\s+')).first;
  }

  Map<String, dynamic> get _profile => _ref.read(advisorProfileProvider).toJson();

  bool _restoredOnce = false;

  /// يفتح الجلسة: يستعيد المحادثة المحفوظة إن كانت حديثة، وإلا يرحّب.
  static const _askLabels = {
    'fit': '🎯 هل يناسبني؟',
    'dupe': '💸 بديل أرخص منه',
    'complement': '🧩 شنو يكمّله؟',
    'howto': '📖 شلون أستخدمه؟',
    'similar': '🔁 شي يشبهه',
  };

  Future<void> start({String? productId, String? ask}) async {
    if (state.thinking) return;
    if (state.entries.isEmpty && !_restoredOnce) {
      _restoredOnce = true;
      await _restore();
    }
    if (state.entries.isEmpty) await _welcome();
    if (productId == null || productId.isEmpty) return;
    final label = _askLabels[ask];
    if (label != null) {
      await _turn(UserEntry(label), action: 'set:focus=$productId;act:$ask');
    } else {
      await askAbout(productId);
    }
  }

  Future<void> _welcome() async {
    state = state.copyWith(thinking: true, clearError: true);
    final gen = _gen;
    try {
      final j = await _api.advisorWelcome(name: _firstName);
      final reply = AdvisorReply.fromJson(j);
      if (gen != _gen || !mounted) return;
      state = state.copyWith(entries: [BotEntry(reply)], thinking: false, prompts: reply.prompts);
      _persist();
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

  /// فُتحت من صفحة منتج: الحديث عنه مباشرة (بلا فقاعة من الزبونة).
  Future<void> askAbout(String productId) async {
    if (state.thinking) return;
    await _turn(null, action: 'set:focus=$productId;act:focus');
  }

  /// «اسألي عنه» من بطاقة في المحادثة.
  Future<void> focusOn(AdvisorProduct p) async {
    if (state.thinking) return;
    await _turn(UserEntry('أريد أعرف أكثر عن «${_short(p.name)}»'), action: 'set:focus=${p.id};act:focus');
  }

  /// مسحت باركود منتج داخل «ديما»: «هل يناسبني؟» عنه مباشرة.
  Future<void> askScanned(String code) async {
    if (state.thinking) return;
    final normalized = normalizeBarcode(code);
    final lookup = normalized.isNotEmpty ? normalized : code.trim();
    if (lookup.isEmpty) return;
    String? productId;
    try {
      productId = (await _api.lookupProductByBarcode(lookup))?.productId;
    } catch (_) {}
    if (!mounted) return;
    if (productId != null && productId.isNotEmpty) {
      await _turn(const UserEntry('📷 مسحت منتجاً — هل يناسبني؟'), action: 'set:focus=$productId;act:fit');
      return;
    }
    // غير موجود بالمتجر: نقولها بصراحة ونقترح البحث عن بديله.
    state = state.copyWith(entries: [
      ...state.entries,
      const UserEntry('📷 مسحت منتجاً'),
      const BotEntry(AdvisorReply(
        messages: ['ما لكيت هذا المنتج بمتجرنا 🙈 اكتبيلي اسمه أو نوعه، وأدورلكِ عليه أو على أقرب بديل له.'],
        chips: [
          AdvisorChip(label: 'بديل لعطر مشهور', value: 'بديل لعطر مشهور', emoji: '🔎'),
          AdvisorChip(label: 'منتج لبشرتي', value: 'act:quiz', emoji: '🌸'),
        ],
        raw: {
          'messages': ['ما لكيت هذا المنتج بمتجرنا 🙈 اكتبيلي اسمه أو نوعه، وأدورلكِ عليه أو على أقرب بديل له.'],
        },
      )),
    ]);
    _persist();
  }

  /// سؤال سريع عن منتج بعينه (يناسبني؟ بديل أرخص…).
  Future<void> askOn(AdvisorProduct p, String act, String label) async {
    if (state.thinking) return;
    await _turn(UserEntry(label), action: 'set:focus=${p.id};act:$act');
  }

  // ── المقارنة

  /// يضيف/يزيل منتجاً من سلة المقارنة. يعيد false إن امتلأت.
  bool toggleCompare(AdvisorProduct p) {
    final list = [...state.comparing];
    final i = list.indexWhere((x) => x.id == p.id);
    if (i >= 0) {
      list.removeAt(i);
    } else {
      if (list.length >= 3) return false;
      list.add(p);
    }
    state = state.copyWith(comparing: list);
    return true;
  }

  void clearCompare() => state = state.copyWith(comparing: const []);

  Future<void> compareNow() async {
    final ids = state.comparing.map((p) => p.id).toList();
    if (ids.length < 2 || state.thinking) return;
    state = state.copyWith(comparing: const []);
    await _turn(const UserEntry('قارني بينهم ⚖️'), action: 'set:compare=${ids.join(',')};act:compare');
  }

  // ── التعلّم

  /// إشارة مجهولة: فتحت منتجاً، أضافته، أعجبها الرد…
  void track(String type, {String? productId, String? sig}) {
    unawaited(_api.advisorFeedback(type: type, productId: productId, sig: sig));
  }

  void rate(AdvisorReply reply, bool liked) {
    final ids = [...reply.products, ...reply.groups.expand((g) => g.products)].map((p) => p.id).take(liked ? 3 : 2);
    for (final id in ids) {
      track(liked ? 'like' : 'dislike', productId: id, sig: reply.signature);
    }
  }

  /// المحادثة قبل «محادثة جديدة» — لزر «تراجع».
  AdvisorSession? _beforeReset;

  void reset() {
    _gen++;
    _pending = null;
    _beforeReset = state.entries.length > 1 ? state.copyWith(thinking: false) : null;
    state = const AdvisorSession();
    _clearStored();
    _welcome();
  }

  void undoReset() {
    final prev = _beforeReset;
    if (prev == null) return;
    _gen++;
    _beforeReset = null;
    state = prev;
    _persist();
  }

  /// إعادة آخر طلب فشل (دون تكرار فقاعة الزبونة).
  Future<void> retry() async {
    if (state.thinking) return;
    if (state.entries.isEmpty) return _welcome();
    final p = _pending;
    if (p == null) return;
    await _turn(null, message: p.message, action: p.action);
  }

  ({String? message, String? action})? _pending;

  /// يتغيّر مع «محادثة جديدة» — فيُهمل أي رد متأخر من الجلسة السابقة.
  int _gen = 0;
  int _noticeId = 0;

  Future<void> _turn(UserEntry? user, {String? message, String? action}) async {
    _pending = (message: message, action: action);
    state = state.copyWith(entries: [...state.entries, if (user != null) user], thinking: true, clearError: true);
    final started = DateTime.now();
    final gen = _gen;
    try {
      final j = await _api.advisorChat(
        message: message,
        action: action,
        state: state.state,
        firstName: _firstName,
        profile: _profile,
      );
      final reply = AdvisorReply.fromJson(j);
      // مهلة قصيرة للتفكير — تمنح الحركة وقتاً لتُرى بدل ظهور مفاجئ.
      final elapsed = DateTime.now().difference(started);
      const minThink = Duration(milliseconds: 650);
      if (elapsed < minThink) await Future<void>.delayed(minThink - elapsed);
      if (gen != _gen || !mounted) return;
      _pending = null;
      ({int id, String text})? notice;
      final upd = reply.profileUpdate;
      if (upd != null && upd.isNotEmpty) {
        final note = _ref.read(advisorProfileProvider.notifier).learn(upd);
        if (note != null) notice = (id: ++_noticeId, text: 'حفظت في ملفكِ: $note');
      }
      state = state.copyWith(entries: [...state.entries, BotEntry(reply)], thinking: false, state: reply.state, notice: notice);
      _persist();
    } catch (e) {
      if (gen != _gen || !mounted) return;
      state = state.copyWith(thinking: false, error: friendlyError(e));
    }
  }

  static String _short(String name) {
    final parts = name.split(RegExp(r'\s[-–—]\s'));
    final s = parts.length > 1 ? parts.sublist(1).join(' ') : name;
    return s.length > 36 ? '${s.substring(0, 34)}…' : s;
  }

  // ── الحفظ على الجهاز

  Timer? _saveTimer;

  void _persist() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 400), () async {
      try {
        final all = state.entries;
        final tail = all.length > _maxStored ? all.sublist(all.length - _maxStored) : all;
        // الترحيب أول عنصر دائماً حتى تبقى الواجهة الافتتاحية.
        final keep = [if (all.isNotEmpty && tail.first != all.first) all.first, ...tail];
        final data = {
          'at': DateTime.now().millisecondsSinceEpoch,
          'state': state.state,
          'prompts': state.prompts,
          'entries': [
            for (final e in keep)
              switch (e) {
                UserEntry(:final text) => {'t': 'u', 'text': text},
                BotEntry(:final reply) => {'t': 'b', 'raw': Map<String, dynamic>.of(reply.raw)..remove('state')},
              },
          ],
        };
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_storeKey, jsonEncode(data));
      } catch (_) {}
    });
  }

  Future<void> _restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storeKey);
      if (raw == null) return;
      final j = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      final at = DateTime.fromMillisecondsSinceEpoch(asInt(j['at']));
      if (DateTime.now().difference(at) > _keepFor) {
        await prefs.remove(_storeKey);
        return;
      }
      final entries = <AdvisorEntry>[];
      for (final e in asList(j['entries'])) {
        if (e['t'] == 'u') entries.add(UserEntry(asString(e['text'])));
        if (e['t'] == 'b') entries.add(BotEntry(AdvisorReply.fromJson(asMap(e['raw']))));
      }
      // محادثة فيها الترحيب فقط لا تستحق الاستعادة — نرحّب من جديد بتحية الوقت.
      if (entries.length < 2) return;
      state = state.copyWith(
        entries: entries,
        state: j['state'] is Map ? asMap(j['state']) : null,
        prompts: asStringList(j['prompts']),
      );
    } catch (_) {}
  }

  Future<void> _clearStored() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storeKey);
    } catch (_) {}
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    super.dispose();
  }
}

final advisorProvider = StateNotifierProvider<AdvisorController, AdvisorSession>(
  (ref) => AdvisorController(ref),
);
