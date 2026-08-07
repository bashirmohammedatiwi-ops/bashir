import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:crop_your_image/crop_your_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/image_process.dart';

enum ImageEditMode { crop, whiteFrame }

class ProductImageEditorResult {
  const ProductImageEditorResult({required this.bytes});
  final Uint8List bytes;
}

/// Advanced product image editor: interactive crop OR shrink-on-white-frame.
Future<ProductImageEditorResult?> openProductImageEditor(
  BuildContext context, {
  String? imageUrl,
  Uint8List? imageBytes,
  String title = 'تعديل الصورة',
}) {
  assert(imageUrl != null || imageBytes != null, 'imageUrl or imageBytes required');
  return Navigator.of(context).push<ProductImageEditorResult>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => ProductImageEditorScreen(
        imageUrl: imageUrl,
        imageBytes: imageBytes,
        title: title,
      ),
    ),
  );
}

class ProductImageEditorScreen extends StatefulWidget {
  const ProductImageEditorScreen({
    super.key,
    this.imageUrl,
    this.imageBytes,
    this.title = 'تعديل الصورة',
  });

  final String? imageUrl;
  final Uint8List? imageBytes;
  final String title;

  @override
  State<ProductImageEditorScreen> createState() => _ProductImageEditorScreenState();
}

class _ProductImageEditorScreenState extends State<ProductImageEditorScreen> {
  final _cropController = CropController();
  ImageEditMode _mode = ImageEditMode.whiteFrame;
  Uint8List? _source;
  String? _error;
  bool _loading = true;
  bool _busy = false;
  double _padding = 0.10;
  double? _aspect = 1.0;
  double _sourceAspect = 1.0;
  Completer<Uint8List>? _pendingCrop;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (widget.imageBytes != null && widget.imageBytes!.isNotEmpty) {
        _source = widget.imageBytes;
      } else {
        final url = widget.imageUrl?.trim() ?? '';
        if (url.isEmpty) throw Exception('لا يوجد رابط صورة');
        _source = await _download(url);
      }
      if (_source == null || _source!.length < 32) {
        throw Exception('تعذّر تحميل الصورة');
      }
      final codec = await ui.instantiateImageCodec(_source!);
      final frame = await codec.getNextFrame();
      final w = frame.image.width;
      final h = frame.image.height;
      if (w > 0 && h > 0) _sourceAspect = w / h;
      frame.image.dispose();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<Uint8List> _download(String url) async {
    final dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 25),
        receiveTimeout: const Duration(seconds: 60),
        responseType: ResponseType.bytes,
        headers: {
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent':
              'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        },
      ),
    );
    final resp = await dio.get<List<int>>(url);
    if (resp.statusCode != 200 || resp.data == null) {
      throw Exception('فشل تنزيل الصورة');
    }
    return Uint8List.fromList(resp.data!);
  }

  Future<void> _apply() async {
    if (_source == null || _busy) return;
    setState(() => _busy = true);
    try {
      late Uint8List out;
      if (_mode == ImageEditMode.crop) {
        final completer = Completer<Uint8List>();
        _pendingCrop = completer;
        _cropController.crop();
        final cropped = await completer.future.timeout(const Duration(seconds: 20));
        out = await optimizeEditedJpeg(cropped, maxSide: 1600, quality: 90);
      } else {
        final size = _canvasSizeForAspect(_aspect ?? _sourceAspect);
        out = await fitOnWhiteFrame(
          WhiteFrameParams(
            bytes: _source!,
            canvasWidth: size.$1,
            canvasHeight: size.$2,
            paddingRatio: _padding,
            quality: 90,
          ),
        );
      }
      if (!mounted) return;
      Navigator.pop(context, ProductImageEditorResult(bytes: out));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      _pendingCrop = null;
      if (mounted) setState(() => _busy = false);
    }
  }

  (int, int) _canvasSizeForAspect(double aspect) {
    const long = 1400;
    if (aspect >= 1) {
      return (long, (long / aspect).round().clamp(400, 2000));
    }
    return ((long * aspect).round().clamp(400, 2000), long);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1520),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1520),
        foregroundColor: Colors.white,
        title: Text(widget.title),
        actions: [
          TextButton(
            onPressed: _busy || _loading || _source == null ? null : _apply,
            child: _busy
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('تطبيق', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, style: const TextStyle(color: Colors.white70), textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: _load, child: const Text('إعادة المحاولة')),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    Expanded(child: _buildWorkspace()),
                    _buildControls(),
                  ],
                ),
    );
  }

  Widget _buildWorkspace() {
    if (_source == null) return const SizedBox.shrink();

    if (_mode == ImageEditMode.crop) {
      return Padding(
        padding: const EdgeInsets.all(12),
        child: Crop(
          image: _source!,
          controller: _cropController,
          aspectRatio: _aspect,
          baseColor: const Color(0xFF1A1520),
          maskColor: Colors.black.withValues(alpha: 0.55),
          onCropped: (result) {
            final pending = _pendingCrop;
            if (pending == null || pending.isCompleted) return;
            switch (result) {
              case CropSuccess(:final croppedImage):
                pending.complete(croppedImage);
              case CropFailure():
                pending.completeError(Exception('فشل القص'));
            }
          },
        ),
      );
    }

    final previewAspect = _aspect ?? _sourceAspect;
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 8)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: AspectRatio(
        aspectRatio: previewAspect <= 0 ? 1 : previewAspect,
        child: Padding(
          padding: EdgeInsets.all(12 + _padding * 80),
          child: Image.memory(
            _source!,
            fit: BoxFit.contain,
            filterQuality: FilterQuality.high,
            gaplessPlayback: true,
          ),
        ),
      ),
    );
  }

  Widget _buildControls() {
    return Material(
      color: Colors.white,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SegmentedButton<ImageEditMode>(
                segments: const [
                  ButtonSegment(
                    value: ImageEditMode.whiteFrame,
                    icon: Icon(Icons.crop_square_outlined, size: 18),
                    label: Text('إطار أبيض'),
                  ),
                  ButtonSegment(
                    value: ImageEditMode.crop,
                    icon: Icon(Icons.crop, size: 18),
                    label: Text('قص'),
                  ),
                ],
                selected: {_mode},
                onSelectionChanged: (s) => setState(() => _mode = s.first),
              ),
              const SizedBox(height: 12),
              Text('الأبعاد', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.grey.shade800)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _AspectChip(label: 'مربع 1:1', selected: _aspect == 1.0, onTap: () => setState(() => _aspect = 1.0)),
                  _AspectChip(label: 'عمودي 4:5', selected: _aspect == 0.8, onTap: () => setState(() => _aspect = 0.8)),
                  _AspectChip(label: 'أفقي 5:4', selected: _aspect == 1.25, onTap: () => setState(() => _aspect = 1.25)),
                  _AspectChip(label: 'حر', selected: _aspect == null, onTap: () => setState(() => _aspect = null)),
                ],
              ),
              if (_mode == ImageEditMode.whiteFrame) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('تصغير', style: TextStyle(fontWeight: FontWeight.w700)),
                    Expanded(
                      child: Slider(
                        value: _padding,
                        min: 0.02,
                        max: 0.28,
                        divisions: 13,
                        label: '${(_padding * 100).round()}%',
                        onChanged: (v) => setState(() => _padding = v),
                      ),
                    ),
                    const Text('إطار', style: TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
                Text(
                  'كلّما زدت الإطار صغرت صورة المنتج داخل خلفية بيضاء نظيفة — مثالي للمتجر.',
                  style: TextStyle(fontSize: 12.5, color: Colors.grey.shade700, height: 1.35),
                ),
              ] else
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    'حرّك إطار القص ثم اضغط تطبيق. النتيجة تُحفظ بجودة عالية.',
                    style: TextStyle(fontSize: 12.5, color: Colors.grey.shade700, height: 1.35),
                  ),
                ),
              const SizedBox(height: 8),
              FilledButton.icon(
                onPressed: _busy || _source == null ? null : _apply,
                icon: const Icon(Icons.check_rounded),
                label: Text(_mode == ImageEditMode.whiteFrame ? 'تطبيق الإطار الأبيض' : 'تطبيق القص'),
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AspectChip extends StatelessWidget {
  const _AspectChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppTheme.primary.withValues(alpha: 0.16),
      checkmarkColor: AppTheme.primary,
    );
  }
}
