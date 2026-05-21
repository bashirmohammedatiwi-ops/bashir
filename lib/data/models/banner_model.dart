class BannerModel {
  const BannerModel({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    this.actionRoute,
  });

  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String? actionRoute;
}
