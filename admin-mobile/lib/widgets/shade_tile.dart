import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/utils/helpers.dart';
import '../models/catalog.dart';
import '../models/inventory.dart';
import 'inventory_meta.dart';

class ShadeTile extends StatelessWidget {
  const ShadeTile({
    super.key,
    required this.shade,
    required this.index,
    required this.lookup,
    required this.formatIqd,
    this.expanded = false,
    this.onToggle,
    this.selected,
    this.onSelected,
  });

  final CatalogImportShade shade;
  final int index;
  final BarcodeInventoryLookup? lookup;
  final String Function(num) formatIqd;
  final bool expanded;
  final VoidCallback? onToggle;
  final bool? selected;
  final ValueChanged<bool>? onSelected;

  Color get _swatchColor {
    final hex = shade.colorHex?.replaceAll('#', '');
    if (hex != null && hex.length >= 6) {
      try {
        return Color(int.parse('FF$hex', radix: 16));
      } catch (_) {}
    }
    return Colors.grey.shade300;
  }

  @override
  Widget build(BuildContext context) {
    final name = (shade.nameAr ?? shade.nameEn ?? shade.name).trim();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onToggle,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  if (onSelected != null)
                    Checkbox(
                      value: selected ?? true,
                      onChanged: (v) => onSelected?.call(v ?? false),
                      visualDensity: VisualDensity.compact,
                    ),
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: _swatchColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.grey.shade400),
                    ),
                  ),
                  const SizedBox(width: 10),
                  if (shade.imageUrl != null && shade.imageUrl!.isNotEmpty)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl: shade.imageUrl!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => _imgPlaceholder(),
                      ),
                    )
                  else
                    _imgPlaceholder(),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name.isEmpty ? 'درجة ${index + 1}' : name,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                          maxLines: expanded ? null : 2,
                          overflow: expanded ? null : TextOverflow.ellipsis,
                        ),
                        if (shade.barcode != null && shade.barcode!.isNotEmpty)
                          Text(
                            shade.barcode!,
                            textDirection: TextDirection.ltr,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                          ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (shade.price != null && shade.price!.isNotEmpty)
                        Text('${shade.price} د.ع', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      Icon(expanded ? Icons.expand_less : Icons.expand_more, color: Colors.grey),
                    ],
                  ),
                ],
              ),
              if (expanded) ...[
                const SizedBox(height: 10),
                InventoryMeta(lookup: lookup, formatIqd: formatIqd, compact: true),
                if (shade.sku != null && shade.sku!.isNotEmpty)
                  _detailRow('SKU', shade.sku!),
                if (shade.miswagId != null && shade.miswagId!.isNotEmpty && shade.miswagId != shade.sku)
                  _detailRow('معرّف', shade.miswagId!),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _imgPlaceholder() => Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(8)),
        child: const Icon(Icons.palette_outlined, color: Colors.grey),
      );

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Text('$label: ', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          Expanded(child: Text(value, textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 12))),
        ],
      ),
    );
  }
}

BarcodeInventoryLookup? lookupBarcode(Map<String, BarcodeInventoryLookup> map, String? raw) {
  if (raw == null || isMiswagInternalId(raw)) return null;
  for (final c in posBarcodeLookupKeys(raw)) {
    final hit = map[c];
    if (hit != null) return hit;
  }
  return null;
}
