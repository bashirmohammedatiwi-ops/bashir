class BrandEntity {
  const BrandEntity({
    required this.id,
    this.name,
    this.nameAr,
    this.nameEn,
    this.slug,
    this.logoUrl,
  });

  final String id;
  final String? name;
  final String? nameAr;
  final String? nameEn;
  final String? slug;
  final String? logoUrl;

  String get displayName {
    if (nameAr?.trim().isNotEmpty == true) return nameAr!.trim();
    if (nameEn?.trim().isNotEmpty == true) return nameEn!.trim();
    if (name?.trim().isNotEmpty == true) return name!.trim();
    return id;
  }

  List<String> get searchTokens => [displayName, nameAr, nameEn, name, slug]
      .whereType<String>()
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .toList();

  factory BrandEntity.fromJson(Map<String, dynamic> json) {
    return BrandEntity(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString(),
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      slug: json['slug']?.toString(),
      logoUrl: json['logoUrl']?.toString() ?? json['logo']?['url']?.toString(),
    );
  }
}
