import '../../core/utils/json.dart';

class Paginated<T> {
  final List<T> items;
  final int total;
  final int page;
  final int totalPages;
  final bool hasNext;

  const Paginated({
    required this.items,
    this.total = 0,
    this.page = 1,
    this.totalPages = 1,
    this.hasNext = false,
  });

  factory Paginated.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) parse,
  ) {
    final meta = asMap(json['meta']);
    return Paginated(
      items: asList(json['data']).map(parse).toList(),
      total: asInt(meta['total']),
      page: asInt(meta['page'], 1),
      totalPages: asInt(meta['totalPages'], 1),
      hasNext: asBool(meta['hasNext']),
    );
  }

  static Paginated<T> empty<T>() => Paginated<T>(items: const []);
}
