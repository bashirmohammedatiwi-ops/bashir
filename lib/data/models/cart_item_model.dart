import 'product_model.dart';

class CartItemModel {
  const CartItemModel({
    required this.product,
    required this.quantity,
    this.selectedShade,
    this.selectedSize,
  });

  final ProductModel product;
  final int quantity;
  final String? selectedShade;
  final String? selectedSize;

  int get totalPrice => product.price * quantity;

  String get key =>
      '${product.id}_${selectedShade ?? ''}_${selectedSize ?? ''}';

  CartItemModel copyWith({int? quantity}) => CartItemModel(
        product: product,
        quantity: quantity ?? this.quantity,
        selectedShade: selectedShade,
        selectedSize: selectedSize,
      );

  Map<String, dynamic> toJson() => {
        'productId': product.id,
        'quantity': quantity,
        'selectedShade': selectedShade,
        'selectedSize': selectedSize,
      };
}
