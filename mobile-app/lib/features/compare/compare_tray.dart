import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/motion/app_motion.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/product.dart';
import '../worlds/world_theme.dart';
import 'compare_provider.dart';
import 'compare_screen.dart';
import 'compare_strings.dart';

/// شريط المقارنة العائم فوق شريط التنقل: صور مصغّرة، العدد، و«قارني الآن».
/// يظهر من منتجين فأكثر، وتخفيه «×» حتى تتغيّر القائمة.
///
/// [allowed]: الـ shell يطفئه حيث يزاحم أزرار الصفحة (السلة، حسابي، بطاقة التحديث).
class CompareTray extends ConsumerWidget {
  final bool allowed;
  const CompareTray({super.key, required this.allowed});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(compareProvider);
    final visible = allowed && state.canCompare && !state.trayDismissed;
    final still = MotionPrefs.reduced(context);
    // يبقى آخر محتوى ظاهراً أثناء الاختفاء، فلا يتقلّص الشريط فارغاً وهو ينزلق.
    return IgnorePointer(
      ignoring: !visible,
      child: AnimatedSlide(
        duration: still ? Duration.zero : MotionDurations.base,
        curve: visible ? MotionCurves.standard : MotionCurves.exit,
        offset: visible ? Offset.zero : const Offset(0, 0.5),
        child: AnimatedOpacity(
          duration: still ? Duration.zero : MotionDurations.fast,
          opacity: visible ? 1 : 0,
          child: ExcludeSemantics(
            excluding: !visible,
            child: state.items.isEmpty ? const SizedBox.shrink() : _TrayPill(items: state.items),
          ),
        ),
      ),
    );
  }
}

class _TrayPill extends ConsumerWidget {
  final List<Product> items;
  const _TrayPill({required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    // الظل خلف السطح لا فوقه — الظل المرسوم داخل Material يعتّم لونه.
    return DecoratedBox(
      decoration: ShapeDecoration(shape: const StadiumBorder(), shadows: AppShadows.floating(t)),
      child: Material(
        color: t.surface,
        shape: StadiumBorder(side: BorderSide(color: t.hairline.withValues(alpha: 0.8))),
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(6, 5, 4, 5),
          child: Row(
            children: [
              Expanded(
                child: Semantics(
                  button: true,
                  label: '${s.compareCount(items.length)}${s.isAr ? '، ' : ', '}${s.compareNow}',
                  excludeSemantics: true,
                  child: InkWell(
                    customBorder: const StadiumBorder(),
                    onTap: () => openCompare(context),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: kMinTapTarget),
                      // شاشة ضيقة مع خط مكبّر: الزر يصغر قليلاً بدل أن يفيض، ويبقى للعدد مكانه.
                      child: LayoutBuilder(
                        builder: (context, box) => Row(
                          children: [
                            _Thumbs(items: items),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                s.compareCountShort(items.length),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.label.copyWith(color: t.ink),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ConstrainedBox(
                              constraints: BoxConstraints(
                                maxWidth: (box.maxWidth - _Thumbs.widthFor(items.length) - 18 - 48).clamp(
                                  64.0,
                                  double.infinity,
                                ),
                              ),
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Container(
                                  constraints: const BoxConstraints(minHeight: 38),
                                  padding: const EdgeInsets.symmetric(horizontal: 14),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: t.buttonFill,
                                    borderRadius: BorderRadius.circular(AppCorners.pill),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.compare_arrows_rounded, size: 17, color: t.onAccent),
                                      const SizedBox(width: 5),
                                      Text(s.compareNow, style: AppText.label.copyWith(color: t.onAccent)),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Tooltip(
                message: s.compareHideTray,
                child: InkResponse(
                  onTap: () {
                    AppHaptics.select();
                    ref.read(compareProvider.notifier).dismissTray();
                  },
                  radius: 22,
                  child: SizedBox.square(
                    dimension: kMinTapTarget,
                    child: Icon(Icons.close_rounded, size: 18, color: t.inkMuted),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// صور المنتجات متراكبة قليلاً — دوائر بيضاء بإطار رفيع.
class _Thumbs extends StatelessWidget {
  final List<Product> items;
  const _Thumbs({required this.items});

  static const double _size = 34;
  static const double _step = 17;

  static double widthFor(int count) => _size + _step * (count.clamp(1, kCompareMax) - 1);

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final n = items.length.clamp(1, kCompareMax);
    return SizedBox(
      width: widthFor(n),
      height: _size,
      child: Stack(
        children: [
          for (var i = n - 1; i >= 0; i--)
            PositionedDirectional(
              start: _step * i,
              top: 0,
              child: Container(
                width: _size,
                height: _size,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: ProductCoverImage.wellColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: t.surface, width: 2),
                  boxShadow: [BoxShadow(color: t.ink.withValues(alpha: 0.08), blurRadius: 4)],
                ),
                child: ClipOval(
                  child: ProductCoverImage(url: items[i].coverUrl, fit: BoxFit.contain),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
