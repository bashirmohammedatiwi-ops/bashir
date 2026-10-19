import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/json.dart';
import '../../data/models/beauty.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../beauty/beauty_providers.dart';
import 'advisor_models.dart';
import 'advisor_profile.dart';
import 'advisor_strings.dart';

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
  /// تقييمها لكل رد (بمعرّف [BotEntry.id]): true أعجبها، false لا.
  final Map<int, bool> rated;
  /// ردود أضافت منها «الروتين كاملاً» أو «الأفضل من كل نوع» — لا يُعرض الزر مجدداً فتتكرر الإضافة.
  final Set<int> added;

  const AdvisorSession({
    this.entries = const [],
    this.thinking = false,
    this.state,
    this.prompts = const [],
    this.error,
    this.comparing = const [],
    this.notice,
    this.rated = const {},
    this.added = const {},
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
    Map<int, bool>? rated,
    Set<int>? added,
  }) =>
      AdvisorSession(
        entries: entries ?? this.entries,
        thinking: thinking ?? this.thinking,
        state: state ?? this.state,
        prompts: prompts ?? this.prompts,
        error: clearError ? null : (error ?? this.error),
        comparing: comparing ?? this.comparing,
        notice: notice ?? this.notice,
        rated: rated ?? this.rated,
        added: added ?? this.added,
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
  /// بعد 6 ساعات بلا نشاط تبدأ «ديما» محادثة جديدة (بتحية الوقت) بدل إكمال القديمة —
  /// مثل المتجر على الويب. المحادثة مربوطة بالحساب فلا تطول لغير صاحبتها.
  static const _keepFor = Duration(hours: 6);
  DateTime _lastActive = DateTime.now();
  static const _maxStored = 40;

  ApiService get _api => _ref.read(apiServiceProvider);
  String get _lang => _ref.read(languageCodeProvider);
  AppStrings get _s => AppStrings(_lang);

  String? get _firstName {
    final name = _ref.read(authProvider).user?.name.trim() ?? '';
    return name.isEmpty ? null : name.split(RegExp(r'\s+')).first;
  }

  /// ملفها كما تعرفه «ديما»؛ وإن لم تحدد نوع بشرتها فيه نأخذه من اختبار البشرة.
  /// الاتجاه واحد فقط: ما تتعلمه «ديما» لا يُكتب في نتيجة الاختبار (لها تاريخ وتُبنى عليها الباقات).
  Map<String, dynamic> get _profile {
    final j = _ref.read(advisorProfileProvider).toJson();
    final quiz = _ref.read(skinProfileProvider);
    if (j['skinType'] == null && quiz != null) j['skinType'] = quiz.skinType.key;
    return j;
  }

  bool _restoredOnce = false;

  /// معرّف الرد التالي — يُحفظ مع المحادثة كي يبقى ثابتاً بعد الاستعادة.
  int _nextId = 1;
  int _newId() => _nextId++;

  /// الطلب الجاري (ترحيب، رد، بحث باركود) — يُنتظر بدل إسقاط ما يأتي بعده.
  Future<void>? _inflight;

  /// رسالة وصلت والرد السابق لم يكتمل بعد — تُرسل فور انتهائه.
  String? _queued;

  /// فُتحت على منتج والترحيب فشل: نحفظ الطلب حتى يعيده «حاولي مجدداً».
  ({String productId, String? ask})? _pendingStart;

  /// باركود فشل البحث عنه بسبب الشبكة — يعيده «إعادة».
  String? _pendingScan;

  static const _askLabels = {
    'fit': '🎯 هل يناسبني؟',
    'dupe': '💸 بديل أرخص منه',
    'complement': '🧩 شنو يكمّله؟',
    'howto': '📖 شلون أستخدمه؟',
    'similar': '🔁 شي يشبهه',
  };

  /// يفتح الجلسة: يستعيد المحادثة المحفوظة إن كانت حديثة، وإلا يرحّب.
  Future<void> start({String? productId, String? ask}) async {
    // طلب سابق ما زال جارياً (شاشة أُغلقت قبل وصول ردها): ننتظره بدل إسقاط هذا الطلب.
    await _settle();
    if (!mounted) return;
    // الجلسة بالذاكرة قديمة (التطبيق بقي مفتوحاً بالخلفية): نبدأ من جديد.
    if (state.entries.isNotEmpty && DateTime.now().difference(_lastActive) > _keepFor) {
      _dropSession();
      await _clearStored();
    }
    _lastActive = DateTime.now();
    if (state.entries.isEmpty && !_restoredOnce) {
      _restoredOnce = true;
      await _restore();
    }
    if (state.entries.isEmpty) await _welcome();
    if (productId == null || productId.isEmpty) return;
    if (state.entries.isEmpty) {
      // فشل الترحيب: لا نعرض سؤال المنتج كأنه ترحيب — نحفظه لـ«حاولي مجدداً».
      _pendingStart = (productId: productId, ask: ask);
      return;
    }
    _pendingStart = null;
    final label = _askLabels[ask];
    if (label != null) {
      await _turn(UserEntry(label), action: 'set:focus=$productId;act:$ask');
    } else {
      await askAbout(productId);
    }
  }

  /// يرسل الرسالة بعد انتهاء أي طلب جارٍ (روابط ?q= وفتح الشاشة من جديد).
  Future<void> sendWhenReady(String text) async {
    await _settle();
    if (!mounted) return;
    return send(text);
  }

  Future<void> _settle() async {
    // الطلب المنتظَر قد يتبعه آخر (رسالة مؤجلة) — ننتظر حتى يهدأ، بحد معقول.
    for (var i = 0; i < 3; i++) {
      final f = _inflight;
      if (f == null) return;
      try {
        await f;
      } catch (_) {}
    }
  }

  /// يشغّل الطلب ويسجله كطلب جارٍ حتى ينتهي.
  Future<void> _run(Future<void> Function() body) async {
    final f = body();
    _inflight = f;
    try {
      await f;
    } finally {
      if (identical(_inflight, f)) _inflight = null;
    }
  }

  Future<void> _welcome() => _run(_doWelcome);

  Future<void> _doWelcome() async {
    state = state.copyWith(thinking: true, clearError: true);
    final gen = _gen;
    try {
      final j = await _api.advisorWelcome(name: _firstName);
      final reply = AdvisorReply.fromJson(j);
      if (gen != _gen || !mounted) return;
      state = state.copyWith(
        entries: [BotEntry(reply, id: _newId(), welcome: true)],
        thinking: false,
        prompts: reply.prompts,
      );
      _persist();
    } catch (e) {
      if (gen != _gen || !mounted) return;
      state = state.copyWith(thinking: false, error: friendlyError(e, lang: _lang));
    }
    _flushQueued();
  }

  Future<void> send(String text) async {
    final t = text.trim();
    if (t.isEmpty) return;
    if (state.thinking) {
      // لا نُسقط رسالتها: تُرسل حين ينتهي الرد الحالي.
      _queued = t;
      return;
    }
    await _turn(UserEntry(t), message: t);
  }

  void _flushQueued() {
    final q = _queued;
    _queued = null;
    if (q != null && mounted && !state.thinking) unawaited(send(q));
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

  /// غيّرت نوع بشرتها من «ملفكِ الجمالي» أثناء المحادثة: نعيد الترشيح الحالي به.
  /// يعيد false إن لم يكن هناك ترشيح يُعاد (فتعتمده «ديما» بطلبها القادم).
  bool applySkinType(String? skinType) {
    if (state.thinking || state.entries.length < 2) return false;
    final last = state.lastReply;
    if (last == null || (last.products.isEmpty && last.groups.isEmpty && last.routine == null)) return false;
    final label = ProfileOptions.label(ProfileOptions.skinTypes, skinType);
    final act = last.routine != null ? 'act:routine' : 'act:recommend';
    unawaited(_turn(
      UserEntry(skinType == null || label == null ? 'بدون نوع البشرة' : 'بشرتي $label'),
      action: skinType == null ? 'unset:skinType;$act' : 'set:skinType=$skinType;$act',
    ));
    return true;
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

  static const _scanLabel = '📷 مسحت منتجاً — هل يناسبني؟';

  /// مسحت باركود منتج داخل «ديما»: «هل يناسبني؟» عنه مباشرة.
  Future<void> askScanned(String code) async {
    if (state.thinking) return;
    final normalized = normalizeBarcode(code);
    final lookup = normalized.isNotEmpty ? normalized : code.trim();
    if (lookup.isEmpty) return;
    _pending = null;
    _pendingScan = null;
    // فقاعتها ومؤشر الكتابة فوراً — البحث قد يأخذ لحظات.
    state = state.copyWith(entries: [...state.entries, const UserEntry(_scanLabel)], thinking: true, clearError: true);
    await _run(() => _doScan(lookup));
  }

  Future<void> _doScan(String lookup) async {
    final gen = _gen;
    String? productId;
    try {
      productId = (await _api.lookupProductByBarcode(lookup))?.productId;
    } catch (e) {
      // انقطاع أو خطأ خادم — ليس «غير موجود»: نعرض الخطأ ونترك «إعادة» تبحث مجدداً.
      if (gen != _gen || !mounted) return;
      _pendingScan = lookup;
      state = state.copyWith(thinking: false, error: friendlyError(e, lang: _lang));
      return;
    }
    if (gen != _gen || !mounted) return;
    if (productId != null && productId.isNotEmpty) {
      await _doTurn(null, action: 'set:focus=$productId;act:fit');
      return;
    }
    // غير موجود بالمتجر: نقولها بصراحة ونقترح البحث عن بديله.
    const text = 'ما لكيت هذا المنتج بمتجرنا 🙈 اكتبيلي اسمه أو نوعه، وأدورلكِ عليه أو على أقرب بديل له.';
    state = state.copyWith(
      thinking: false,
      entries: [
        ...state.entries,
        BotEntry(
          const AdvisorReply(
            messages: [text],
            chips: [
              AdvisorChip(label: 'بديل لعطر مشهور', value: 'بديل لعطر مشهور', emoji: '🔎'),
              AdvisorChip(label: 'منتج لبشرتي', value: 'act:quiz', emoji: '🌸'),
            ],
            raw: {
              'messages': [text],
              'chips': [
                {'label': 'بديل لعطر مشهور', 'value': 'بديل لعطر مشهور', 'emoji': '🔎'},
                {'label': 'منتج لبشرتي', 'value': 'act:quiz', 'emoji': '🌸'},
              ],
            },
          ),
          id: _newId(),
        ),
      ],
    );
    _persist();
    _flushQueued();
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

  /// تقييم رد (مرة واحدة لكل رد): يُرسل إشارة لأبرز ما فيه — المنتجات والمجموعات
  /// وخطوات الروتين التي لا تملكها والاقتراحات الشخصية.
  void rate(int entryId, AdvisorReply reply, bool liked) {
    if (state.rated.containsKey(entryId)) return;
    markRated(entryId, liked);
    final all = <AdvisorProduct>[
      ...reply.products,
      ...reply.groups.expand((g) => g.products),
      ...?reply.routine?.steps.where((s) => !s.owned).map((s) => s.product),
      ...reply.personal.expand((x) => x.products),
    ];
    final seen = <String>{};
    final ids = all.map((p) => p.id).where((id) => id.isNotEmpty && seen.add(id)).take(liked ? 4 : 2);
    for (final id in ids) {
      track(liked ? 'like' : 'dislike', productId: id, sig: reply.signature);
    }
  }

  void markRated(int entryId, bool liked) {
    state = state.copyWith(rated: {...state.rated, entryId: liked});
    _persist();
  }

  void markAdded(int entryId) {
    if (state.added.contains(entryId)) return;
    state = state.copyWith(added: {...state.added, entryId});
    _persist();
  }

  /// المحادثة قبل «محادثة جديدة» — لزر «تراجع».
  AdvisorSession? _beforeReset;

  /// يُهمل كل ما يخص الجلسة الحالية (ردود متأخرة، طلبات معلّقة) ويفرغها.
  void _dropSession() {
    _gen++;
    _pending = null;
    _pendingStart = null;
    _pendingScan = null;
    _queued = null;
    _beforeReset = null;
    state = const AdvisorSession();
  }

  void reset() {
    final before = state.entries.length > 1 ? state.copyWith(thinking: false) : null;
    _dropSession();
    _beforeReset = before;
    _clearStored();
    _welcome();
  }

  /// تبدّل الحساب (دخول، خروج، حساب آخر): محادثة الحساب السابق لا تُعرض لغيره.
  /// تبدأ «ديما» من جديد عند فتحها التالي.
  void onAuthChanged() {
    _dropSession();
    _restoredOnce = true;
    _saveTimer?.cancel();
    _clearStored();
  }

  String? get _uid => _ref.read(authProvider).user?.id;

  void undoReset() {
    final prev = _beforeReset;
    if (prev == null) return;
    _gen++;
    _beforeReset = null;
    state = prev;
    _persist();
  }

  /// هل لدى «إعادة» ما تعيده؟ (طلب مرفوض لطوله مثلاً لا يُعاد كما هو).
  bool get canRetry => _pendingScan != null || _pending != null || state.entries.isEmpty;

  /// إعادة آخر طلب فشل (دون تكرار فقاعة الزبونة).
  Future<void> retry() async {
    if (state.thinking) return;
    final scan = _pendingScan;
    if (scan != null) {
      _pendingScan = null;
      final e = state.entries;
      // askScanned يضيف فقاعتها من جديد.
      if (e.isNotEmpty && e.last is UserEntry) state = state.copyWith(entries: e.sublist(0, e.length - 1));
      return askScanned(scan);
    }
    if (state.entries.isEmpty) {
      await _welcome();
      final start = _pendingStart;
      if (start != null && state.entries.isNotEmpty) {
        _pendingStart = null;
        return this.start(productId: start.productId, ask: start.ask);
      }
      return;
    }
    final p = _pending;
    if (p == null) return;
    await _turn(null, message: p.message, action: p.action);
  }

  ({String? message, String? action})? _pending;

  /// يتغيّر مع «محادثة جديدة» — فيُهمل أي رد متأخر من الجلسة السابقة.
  int _gen = 0;
  int _noticeId = 0;

  Future<void> _turn(UserEntry? user, {String? message, String? action}) =>
      _run(() => _doTurn(user, message: message, action: action));

  Future<void> _doTurn(UserEntry? user, {String? message, String? action}) async {
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
      state = state.copyWith(
        entries: [...state.entries, BotEntry(reply, id: _newId())],
        thinking: false,
        state: reply.state,
        notice: notice,
      );
      _persist();
    } catch (e) {
      if (gen != _gen || !mounted) return;
      if (e is ApiException && e.status == 400) {
        // السيرفر رفض الطلب نفسه (أطول من 600 حرف مثلاً): إعادته كما هو لن تنجح.
        _pending = null;
        state = state.copyWith(
          thinking: false,
          error: message != null ? _s.advisorMessageTooLong : friendlyError(e, lang: _lang),
        );
      } else {
        state = state.copyWith(thinking: false, error: friendlyError(e, lang: _lang));
      }
    }
    _flushQueued();
  }

  static String _short(String name) {
    final parts = name.split(RegExp(r'\s[-–—]\s'));
    final s = parts.length > 1 ? parts.sublist(1).join(' ') : name;
    return s.length > 36 ? '${s.substring(0, 34)}…' : s;
  }

  // ── الحفظ على الجهاز

  Timer? _saveTimer;

  void _persist() {
    _lastActive = DateTime.now();
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 400), () async {
      try {
        final all = state.entries;
        final tail = all.length > _maxStored ? all.sublist(all.length - _maxStored) : all;
        // الترحيب أول عنصر دائماً حتى تبقى الواجهة الافتتاحية.
        final keep = [if (all.isNotEmpty && tail.first != all.first) all.first, ...tail];
        final ids = {for (final e in keep) if (e is BotEntry) e.id};
        final data = {
          'at': DateTime.now().millisecondsSinceEpoch,
          // صاحبة المحادثة — لا تُستعاد لحساب آخر على الجهاز نفسه.
          'uid': _uid,
          'nextId': _nextId,
          'state': state.state,
          'prompts': state.prompts,
          'rated': {for (final r in state.rated.entries) if (ids.contains(r.key)) '${r.key}': r.value},
          'added': [for (final id in state.added) if (ids.contains(id)) id],
          'entries': [
            for (final e in keep)
              switch (e) {
                UserEntry(:final text) => {'t': 'u', 'text': text},
                BotEntry(:final reply, :final id, :final welcome) => {
                    't': welcome ? 'w' : 'b',
                    'id': id,
                    'raw': Map<String, dynamic>.of(reply.raw)..remove('state'),
                  },
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
      if (j['uid']?.toString() != _uid && _ref.read(authProvider).status == AuthStatus.unknown) {
        // الحساب لم يُعرف بعد: لا نحكم على المحادثة الآن — نحاول عند الفتح التالي.
        _restoredOnce = false;
        return;
      }
      if (DateTime.now().difference(at) > _keepFor || j['uid']?.toString() != _uid) {
        await prefs.remove(_storeKey);
        return;
      }
      final entries = <AdvisorEntry>[];
      var maxId = 0;
      final list = asList(j['entries']);
      for (var i = 0; i < list.length; i++) {
        final e = list[i];
        final t = e['t'];
        if (t == 'u') entries.add(UserEntry(asString(e['text'])));
        if (t == 'b' || t == 'w') {
          // محادثات محفوظة قبل المعرّفات: نرقّمها، وأولها كان الترحيب دائماً.
          final legacy = e['id'] == null;
          final id = legacy ? ++maxId : asInt(e['id']);
          if (id > maxId) maxId = id;
          entries.add(BotEntry(
            AdvisorReply.fromJson(asMap(e['raw'])),
            id: id,
            welcome: t == 'w' || (legacy && i == 0),
          ));
        }
      }
      // محادثة فيها الترحيب فقط لا تستحق الاستعادة — نرحّب من جديد بتحية الوقت.
      if (entries.length < 2) return;
      _nextId = [_nextId, maxId + 1, asInt(j['nextId'])].reduce((a, b) => a > b ? a : b);
      final rated = <int, bool>{};
      final r = j['rated'];
      if (r is Map) {
        for (final x in r.entries) {
          final id = int.tryParse(x.key.toString());
          if (id != null && x.value is bool) rated[id] = x.value as bool;
        }
      }
      state = state.copyWith(
        entries: entries,
        state: j['state'] is Map ? asMap(j['state']) : null,
        prompts: asStringList(j['prompts']),
        rated: rated,
        added: {for (final x in asList(j['added'])) asInt(x)},
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

final advisorProvider = StateNotifierProvider<AdvisorController, AdvisorSession>((ref) {
  final ctl = AdvisorController(ref);
  ref.listen<AuthState>(authProvider, (prev, next) {
    // أول معرفة بالجلسة (من «غير معروف») ليست تبديلاً للحساب.
    if (prev == null || prev.status == AuthStatus.unknown) return;
    if (prev.user?.id != next.user?.id) ctl.onAuthChanged();
  });
  return ctl;
});

// ───────────────────────────────────────────── «روتيناتي»

/// روتين حفظته من المحادثة — يبقى بعد انتهاء الجلسة لتعود إليه.
class SavedRoutine {
  final AdvisorRoutine routine;
  final DateTime savedAt;
  const SavedRoutine({required this.routine, required this.savedAt});

  /// بصمة الروتين: عنوانه ومنتجات خطواته — لمنع حفظه مرتين.
  String get key => keyOf(routine);

  static String keyOf(AdvisorRoutine r) => [r.title, ...r.steps.map((s) => s.product.id)].join('|');
}

/// «روتيناتي»: حتى 5 روتينات محفوظة على الجهاز (الأحدث أولاً).
class SavedRoutinesNotifier extends StateNotifier<List<SavedRoutine>> {
  SavedRoutinesNotifier() : super(const []) {
    _ready = _load();
  }

  static const _key = 'advisor_routines_v1';
  static const max = 5;
  late final Future<void> _ready;

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return;
      final list = <SavedRoutine>[];
      for (final e in asList(jsonDecode(raw))) {
        final r = AdvisorRoutine.fromJson(asMap(e['routine']));
        if (r.steps.isEmpty) continue;
        list.add(SavedRoutine(routine: r, savedAt: DateTime.fromMillisecondsSinceEpoch(asInt(e['at']))));
      }
      if (mounted) state = list.take(max).toList();
    } catch (_) {}
  }

  Future<void> _save() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (state.isEmpty) {
        await prefs.remove(_key);
      } else {
        await prefs.setString(
          _key,
          jsonEncode([
            for (final s in state) {'at': s.savedAt.millisecondsSinceEpoch, 'routine': s.routine.raw},
          ]),
        );
      }
    } catch (_) {}
  }

  bool contains(AdvisorRoutine r) {
    final k = SavedRoutine.keyOf(r);
    return state.any((s) => s.key == k);
  }

  /// يحفظ الروتين في أول القائمة (ويزيح الأقدم بعد 5).
  Future<void> save(AdvisorRoutine r) async {
    if (r.raw.isEmpty) return;
    await _ready;
    final k = SavedRoutine.keyOf(r);
    state = [
      SavedRoutine(routine: r, savedAt: DateTime.now()),
      ...state.where((s) => s.key != k),
    ].take(max).toList();
    await _save();
  }

  Future<void> remove(AdvisorRoutine r) async {
    await _ready;
    final k = SavedRoutine.keyOf(r);
    state = state.where((s) => s.key != k).toList();
    await _save();
  }

  Future<void> clear() async {
    await _ready;
    state = const [];
    await _save();
  }
}

final savedRoutinesProvider = StateNotifierProvider<SavedRoutinesNotifier, List<SavedRoutine>>((ref) {
  final n = SavedRoutinesNotifier();
  // خروج حسابٍ أو تبديله: روتيناتها لا تبقى لغيرها على الجهاز.
  ref.listen<AuthState>(authProvider, (prev, next) {
    if (prev == null || prev.status == AuthStatus.unknown) return;
    final was = prev.user?.id;
    if (was != null && was != next.user?.id) n.clear();
  });
  return n;
});
