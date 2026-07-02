import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

const _welcomeVideo = 'assets/videos/welcome.mp4';

/// لون خلفية شاشة الترحيب أثناء التحميل (مطابق لشاشة الإقلاع).
const _videoBackdrop = Colors.white;

/// شاشة ترحيب — فيدio يملأ الشاشة من الأعلى للأسفل.
class WelcomeScreen extends StatefulWidget {
  final VoidCallback? onAnimationComplete;
  const WelcomeScreen({super.key, this.onAnimationComplete});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  VideoPlayerController? _controller;
  bool _done = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: _videoBackdrop,
      systemNavigationBarIconBrightness: Brightness.dark,
    ));
    _initVideo();
  }

  Future<void> _initVideo() async {
    final controller = VideoPlayerController.asset(_welcomeVideo);
    _controller = controller;

    try {
      await controller.initialize();
      if (!mounted) return;

      controller
        ..setLooping(false)
        ..setVolume(0)
        ..addListener(_onVideoTick);

      setState(() {});
      await controller.play();
    } catch (_) {
      if (!mounted) return;
      setState(() => _failed = true);
      _finish();
    }
  }

  void _onVideoTick() {
    final c = _controller;
    if (c == null || !c.value.isInitialized || _done) return;

    final pos = c.value.position;
    final dur = c.value.duration;
    if (dur.inMilliseconds > 0 && pos.inMilliseconds >= dur.inMilliseconds - 80) {
      _finish();
    }
  }

  void _finish() {
    if (_done) return;
    _done = true;
    widget.onAnimationComplete?.call();
  }

  @override
  void dispose() {
    _controller?.removeListener(_onVideoTick);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: _videoBackdrop,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: _videoBackdrop,
        body: c != null && c.value.isInitialized
            ? SizedBox.expand(
                child: FittedBox(
                  fit: BoxFit.cover,
                  alignment: Alignment.center,
                  child: SizedBox(
                    width: c.value.size.width,
                    height: c.value.size.height,
                    child: VideoPlayer(c),
                  ),
                ),
              )
            : Center(
                child: _failed
                    ? const Icon(Icons.movie_outlined, color: Colors.black38, size: 48)
                    : Image.asset(
                        'assets/images/app_icon_source.png',
                        width: 120,
                        height: 120,
                      ),
              ),
      ),
    );
  }
}
