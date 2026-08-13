import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

const kBarcodeFormats = <BarcodeFormat>[
  BarcodeFormat.ean13,
  BarcodeFormat.ean8,
  BarcodeFormat.upcA,
  BarcodeFormat.upcE,
  BarcodeFormat.code128,
  BarcodeFormat.code39,
  BarcodeFormat.code93,
  BarcodeFormat.itf14,
  BarcodeFormat.codabar,
];

/// Camera barcode scanner with serialized start/stop to avoid
/// "MobileScannerController is already running".
class BarcodeLiveScanner extends StatefulWidget {
  const BarcodeLiveScanner({
    super.key,
    required this.onDetect,
    this.formats = kBarcodeFormats,
    this.detectionSpeed = DetectionSpeed.normal,
  });

  final void Function(BarcodeCapture capture) onDetect;
  final List<BarcodeFormat> formats;
  final DetectionSpeed detectionSpeed;

  @override
  State<BarcodeLiveScanner> createState() => BarcodeLiveScannerState();
}

class BarcodeLiveScannerState extends State<BarcodeLiveScanner> {
  late final MobileScannerController _controller;
  Future<void> _queue = Future.value();
  bool _disposed = false;
  bool _startScheduled = false;
  bool _autoHealAttempted = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      autoStart: false,
      detectionSpeed: widget.detectionSpeed,
      facing: CameraFacing.back,
      formats: widget.formats,
    );
  }

  /// Serialize camera operations so start/stop never overlap.
  Future<T> _enqueue<T>(Future<T> Function() action) {
    final next = _queue.then((_) async {
      if (_disposed) {
        throw StateError('scanner disposed');
      }
      return action();
    });
    _queue = next.then((_) {}, onError: (_) {});
    return next;
  }

  Future<void> pause() {
    return _enqueue(() async {
      try {
        await _controller.stop();
      } catch (_) {}
    });
  }

  Future<void> resume() {
    return _enqueue(() async {
      if (!mounted || _disposed) return;
      if (_controller.value.isRunning) return;
      try {
        await _controller.start();
        _autoHealAttempted = false;
      } on MobileScannerException catch (e) {
        if (e.errorCode == MobileScannerErrorCode.controllerAlreadyInitialized) {
          return;
        }
        if (e.errorCode == MobileScannerErrorCode.controllerInitializing) {
          await Future<void>.delayed(const Duration(milliseconds: 400));
          return;
        }
        // Not attached yet / transient — brief wait then one retry.
        await Future<void>.delayed(const Duration(milliseconds: 300));
        if (!mounted || _disposed) return;
        if (_controller.value.isRunning) return;
        try {
          await _controller.start();
          _autoHealAttempted = false;
        } on MobileScannerException catch (e2) {
          if (e2.errorCode == MobileScannerErrorCode.controllerAlreadyInitialized) {
            return;
          }
          // Leave error UI; user can tap restart.
        }
      }
    });
  }

  /// Force stop then start — used by the error-screen button.
  Future<void> restart() {
    return _enqueue(() async {
      try {
        await _controller.stop();
      } catch (_) {}
      await Future<void>.delayed(const Duration(milliseconds: 450));
      if (!mounted || _disposed) return;
      try {
        await _controller.start();
        _autoHealAttempted = false;
        if (mounted) setState(() {});
      } on MobileScannerException catch (e) {
        if (e.errorCode == MobileScannerErrorCode.controllerAlreadyInitialized) {
          return;
        }
        rethrow;
      }
    });
  }

  @override
  void dispose() {
    _disposed = true;
    try {
      _controller.dispose();
    } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Start only after MobileScanner is in the tree (avoids controllerUninitialized / not attached).
    if (!_startScheduled) {
      _startScheduled = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !_disposed) unawaited(resume());
      });
    }

    return MobileScanner(
      controller: _controller,
      onDetect: widget.onDetect,
      errorBuilder: (context, error) {
        final msg = error.errorDetails?.message ?? error.errorCode.message;
        final already =
            error.errorCode == MobileScannerErrorCode.controllerAlreadyInitialized ||
            msg.toLowerCase().contains('already running');

        if (already && !_autoHealAttempted) {
          _autoHealAttempted = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted && !_disposed) unawaited(restart());
          });
        }

        return ColoredBox(
          color: Colors.black,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.videocam_off_outlined, color: Colors.white, size: 48),
                  const SizedBox(height: 12),
                  Text(
                    already ? 'جاري إعادة تشغيل الكاميرا…' : msg,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => unawaited(restart()),
                    child: const Text('إعادة تشغيل الكاميرا'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
