class ProductShade {
  const ProductShade({required this.name, required this.colorHex});

  final String name;
  final String colorHex;

  Map<String, dynamic> toJson() => {'name': name, 'colorHex': colorHex};

  factory ProductShade.fromJson(Map<String, dynamic> json) => ProductShade(
        name: json['name'] as String,
        colorHex: json['colorHex'] as String,
      );
}
