/// Local transparent PNG product cutouts — backgrounds come from [ProductShowcase].
abstract final class MockProductImages {
  static const List<String> paths = [
    'assets/products/lipstick_1.png',
    'assets/products/lipstick_2.png',
    'assets/products/lipstick_3.png',
    'assets/products/mascara_1.png',
    'assets/products/mascara_2.png',
    'assets/products/mascara_3.png',
    'assets/products/nail_polish_1.png',
    'assets/products/nail_polish_2.png',
    'assets/products/shampoo_1.png',
    'assets/products/shampoo_2.png',
    'assets/products/face_powder_1.png',
    'assets/products/face_powder_2.png',
    'assets/products/soap_1.png',
    'assets/products/soap_2.png',
    'assets/products/deodorant_1.png',
  ];

  static String at(int productIndex, int imageIndex) =>
      paths[(productIndex + imageIndex) % paths.length];
}
