import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/home_image_precache.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/nice_one_header.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_providers.dart';
import 'home_section_renderer.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scroll = ScrollController();
  String? _precachedFor;
  bool _compactHeader = false;
  bool _solidHeader = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scroll.hasClients || !mounted) return;
    final offset = _scroll.offset;
    final compact = offset > 72;
    final solid = offset > 8;
    if (compact != _compactHeader || solid != _solidHeader) {
      setState(() {
        _compactHeader = compact;
        _solidHeader = solid;
      });
    }
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(homeFeedProvider);
    final topPad = MediaQuery.paddingOf(context).top;
    final headerH = topPad + (_compactHeader ? 54.0 : 118.0);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: _solidHeader
          ? SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent)
          : SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          fit: StackFit.expand,
          children: [
            feed.when(
              loading: () => const _HomeLoading(),
              error: (e, _) => ErrorView(
                message: e.toString(),
                onRetry: () async {
                  await ref.read(apiCacheProvider).remove('home_v1');
                  ref.invalidate(homeFeedProvider);
                },
              ),
              data: (data) {
                if (_precachedFor != data.hashCode.toString()) {
                  _precachedFor = data.hashCode.toString();
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) precacheHomeFeedImages(context, data);
                  });
                }
                final sections = buildHomeSections(data);
                return RefreshIndicator(
                  color: AppColors.primary,
                  edgeOffset: headerH,
                  onRefresh: () async {
                    await ref.read(apiCacheProvider).remove('home_v1');
                    ref.invalidate(homeFeedProvider);
                    await ref.read(homeFeedProvider.future);
                  },
                  child: CustomScrollView(
                    controller: _scroll,
                    cacheExtent: 800,
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    slivers: [
                      for (final section in sections)
                        SliverToBoxAdapter(child: section),
                    ],
                  ),
                );
              },
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Material(
                color: _solidHeader ? Colors.white : Colors.transparent,
                elevation: _solidHeader ? 2 : 0,
                shadowColor: Colors.black26,
                child: Padding(
                  padding: EdgeInsets.only(top: topPad),
                  child: NiceOneHeader(
                    compact: _compactHeader,
                    onLightBackground: _solidHeader,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeLoading extends StatelessWidget {
  const _HomeLoading();
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: const [
        ShimmerBox(height: 380, radius: 0),
        SizedBox(height: 16),
        HorizontalProductsSkeleton(),
        SizedBox(height: 16),
        HorizontalProductsSkeleton(),
      ],
    );
  }
}
