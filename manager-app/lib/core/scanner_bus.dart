import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'format.dart';

/// مصدر القراءة — لعرض الأيقونة المناسبة وسجل المسح.
enum ScanSource { camera, hardware, typed }

class ScanEvent {
  ScanEvent(this.code, this.source);
  final String code;
  final ScanSource source;
}

/// قارئ باركود خارجي (بلوتوث أو USB/OTG) يعمل كلوحة مفاتيح: يرسل الأرقام بسرعة ثم Enter.
/// نلتقطه من أي شاشة دون الحاجة لحقل نص — ما دام لا يوجد حقل كتابة مفعّل.
class ScannerBus {
  ScannerBus._();
  static final instance = ScannerBus._();

  final _events = StreamController<ScanEvent>.broadcast();
  Stream<ScanEvent> get events => _events.stream;

  final _buffer = StringBuffer();
  DateTime _last = DateTime.fromMillisecondsSinceEpoch(0);
  DateTime? lastHardwareAt;
  bool _attached = false;

  /// القارئ يكتب الحرف كل ~5–30ms؛ الإنسان أبطأ بكثير.
  static const _maxGap = Duration(milliseconds: 90);

  void attach() {
    if (_attached) return;
    _attached = true;
    HardwareKeyboard.instance.addHandler(_onKey);
  }

  /// معالجات القراءة: الأعلى (آخر شاشة مفتوحة تطلبها) يأخذ القراءة أولاً.
  final _handlers = <bool Function(ScanEvent)>[];
  void push(bool Function(ScanEvent) handler) => _handlers.add(handler);
  void pop(bool Function(ScanEvent) handler) => _handlers.remove(handler);

  void emit(String raw, ScanSource source) {
    final code = normalizeCode(raw);
    if (code.length < 3) return;
    if (source == ScanSource.hardware) lastHardwareAt = DateTime.now();
    final event = ScanEvent(code, source);
    _events.add(event);
    for (final h in _handlers.reversed.toList()) {
      if (h(event)) return;
    }
  }

  bool get _textFieldFocused {
    final ctx = FocusManager.instance.primaryFocus?.context;
    if (ctx == null) return false;
    return ctx.widget is EditableText || ctx.findAncestorWidgetOfExactType<EditableText>() != null;
  }

  bool _onKey(KeyEvent event) {
    if (event is! KeyDownEvent) return false;
    // حقل نص مفعّل: القارئ يكتب فيه مباشرة والحقل يتعامل مع Enter بنفسه.
    if (_textFieldFocused) return false;
    final now = DateTime.now();
    if (now.difference(_last) > _maxGap) _buffer.clear();
    _last = now;

    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.enter || key == LogicalKeyboardKey.numpadEnter || key == LogicalKeyboardKey.tab) {
      final code = _buffer.toString();
      _buffer.clear();
      if (code.length >= 4) {
        emit(code, ScanSource.hardware);
        return true;
      }
      return false;
    }
    final ch = event.character;
    if (ch != null && ch.length == 1 && ch.codeUnitAt(0) > 0x20) {
      _buffer.write(ch);
    }
    return false;
  }
}
