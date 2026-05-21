/// Unwraps `{ data, meta }` envelope returned by NestJS backend.
class ApiEnvelope<T> {
  ApiEnvelope({required this.data, this.meta});
  final T data;
  final Map<String, dynamic>? meta;
}

T unwrap<T>(dynamic response) {
  if (response is Map<String, dynamic>) {
    if (response.containsKey('data')) return response['data'] as T;
    return response as T;
  }
  return response as T;
}

Map<String, dynamic> unwrapData(dynamic response) =>
    unwrap<Map<String, dynamic>>(response);

List<Map<String, dynamic>> unwrapList(dynamic response) {
  if (response is List) {
    return response.cast<Map<String, dynamic>>();
  }
  if (response is Map<String, dynamic>) {
    final data = response['data'];
    if (data is List) return data.cast<Map<String, dynamic>>();
  }
  return const [];
}
