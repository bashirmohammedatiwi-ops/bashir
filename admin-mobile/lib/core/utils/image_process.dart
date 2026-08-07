import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;

class WhiteFrameParams {
  const WhiteFrameParams({
    required this.bytes,
    required this.canvasWidth,
    required this.canvasHeight,
    required this.paddingRatio,
    this.quality = 90,
  });

  final Uint8List bytes;
  final int canvasWidth;
  final int canvasHeight;
  final double paddingRatio;
  final int quality;
}

class CropEncodeParams {
  const CropEncodeParams({
    required this.bytes,
    required this.left,
    required this.top,
    required this.width,
    required this.height,
    this.maxSide = 1600,
    this.quality = 90,
  });

  final Uint8List bytes;
  final int left;
  final int top;
  final int width;
  final int height;
  final int maxSide;
  final int quality;
}

/// Place the image centered on a white canvas (marketplace-style).
Future<Uint8List> fitOnWhiteFrame(WhiteFrameParams params) {
  return compute(_fitOnWhiteFrameIsolate, params);
}

Uint8List _fitOnWhiteFrameIsolate(WhiteFrameParams p) {
  final decoded = img.decodeImage(p.bytes);
  if (decoded == null) throw StateError('تعذّر قراءة الصورة');

  final canvasW = p.canvasWidth.clamp(400, 2000);
  final canvasH = p.canvasHeight.clamp(400, 2000);
  final pad = (p.paddingRatio.clamp(0.0, 0.35) * (canvasW < canvasH ? canvasW : canvasH)).round();
  final innerW = (canvasW - pad * 2).clamp(1, canvasW);
  final innerH = (canvasH - pad * 2).clamp(1, canvasH);

  final scaleW = innerW / decoded.width;
  final scaleH = innerH / decoded.height;
  final scale = scaleW < scaleH ? scaleW : scaleH;
  final targetW = (decoded.width * scale).round().clamp(1, innerW);
  final targetH = (decoded.height * scale).round().clamp(1, innerH);

  final fitted = img.copyResize(
    decoded,
    width: targetW,
    height: targetH,
    interpolation: img.Interpolation.cubic,
  );

  final canvas = img.Image(width: canvasW, height: canvasH);
  img.fill(canvas, color: img.ColorRgb8(255, 255, 255));

  final dx = ((canvasW - fitted.width) / 2).round();
  final dy = ((canvasH - fitted.height) / 2).round();
  img.compositeImage(canvas, fitted, dstX: dx, dstY: dy);

  return Uint8List.fromList(img.encodeJpg(canvas, quality: p.quality));
}

/// Encode crop result (already cropped bytes from cropper) as optimized JPEG.
Future<Uint8List> optimizeEditedJpeg(Uint8List bytes, {int maxSide = 1600, int quality = 90}) {
  return compute(_optimizeIsolate, (bytes, maxSide, quality));
}

Uint8List _optimizeIsolate((Uint8List, int, int) args) {
  final (bytes, maxSide, quality) = args;
  final decoded = img.decodeImage(bytes);
  if (decoded == null) throw StateError('تعذّر قراءة الصورة');

  img.Image out = decoded;
  final longest = out.width > out.height ? out.width : out.height;
  if (longest > maxSide) {
    final scale = maxSide / longest;
    out = img.copyResize(
      out,
      width: (out.width * scale).round().clamp(1, maxSide),
      height: (out.height * scale).round().clamp(1, maxSide),
      interpolation: img.Interpolation.cubic,
    );
  }
  return Uint8List.fromList(img.encodeJpg(out, quality: quality));
}

/// Decode network/memory image to RGBA bytes for crop_your_image.
Future<ui.Image> decodeUiImage(Uint8List bytes) async {
  final codec = await ui.instantiateImageCodec(bytes);
  final frame = await codec.getNextFrame();
  return frame.image;
}
