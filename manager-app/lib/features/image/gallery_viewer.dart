import 'package:flutter/material.dart';

import '../../data/models.dart';
import '../../widgets/common.dart';

/// عرض الصور بالحجم الكامل مع التكبير بالإصبعين.
void openGallery(BuildContext context, List<MediaImage> images, int index) {
  Navigator.of(context).push(
    PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black,
      pageBuilder: (_, _, _) => _GalleryViewer(images: images, index: index),
      transitionsBuilder: (_, a, _, child) => FadeTransition(opacity: a, child: child),
    ),
  );
}

class _GalleryViewer extends StatefulWidget {
  const _GalleryViewer({required this.images, required this.index});
  final List<MediaImage> images;
  final int index;
  @override
  State<_GalleryViewer> createState() => _GalleryViewerState();
}

class _GalleryViewerState extends State<_GalleryViewer> {
  late final _ctrl = PageController(initialPage: widget.index);
  late int _i = widget.index;

  @override
  Widget build(BuildContext context) {
    final img = widget.images[_i];
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(
          '${_i + 1} / ${widget.images.length}',
          style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
        ),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                img.sizeLabel,
                textDirection: TextDirection.ltr,
                style: const TextStyle(color: Colors.white60),
              ),
            ),
          ),
        ],
      ),
      body: PageView.builder(
        controller: _ctrl,
        itemCount: widget.images.length,
        onPageChanged: (i) => setState(() => _i = i),
        itemBuilder: (_, i) => InteractiveViewer(
          maxScale: 6,
          child: Center(child: NetImg(widget.images[i].url ?? widget.images[i].best, radius: 0, fit: BoxFit.contain)),
        ),
      ),
    );
  }
}
