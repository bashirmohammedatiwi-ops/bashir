import 'package:flutter/material.dart';
import '../../core/utils/media_url.dart';
import '../models/address_model.dart';
import '../models/banner_model.dart';
import '../models/brand_model.dart';
import '../models/cart_item_model.dart';
import '../models/category_model.dart';
import '../models/coupon_model.dart';
import '../models/loyalty_model.dart';
import '../models/notification_model.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';
import '../models/product_package_model.dart';
import '../models/review_model.dart';
import '../models/user_model.dart';
import 'product_remote_mapper.dart';

class RemoteMappers {
  static CategoryModel category(Map<String, dynamic> json) {
    final children = (json['children'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(
          (c) => SubcategoryModel(
            id: c['id'] as String,
            name: (c['name'] as String?) ?? '',
            productCount: (c['_count']?['products'] as num?)?.toInt() ?? 0,
            categoryId: (c['parentId'] as String?) ?? json['id'] as String,
          ),
        )
        .toList();
    return CategoryModel(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? '',
      icon: (json['icon'] as String?) ?? '✦',
      subcategories: children,
    );
  }

  static BrandModel brand(Map<String, dynamic> json) {
    return BrandModel(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? '',
      productCount: (json['_count']?['products'] as num?)?.toInt() ?? 0,
      isFeatured: json['isFeatured'] as bool? ?? false,
      logoUrl: resolveMediaUrl(json['logo']),
    );
  }

  static BannerModel banner(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id'] as String,
      title: (json['title'] as String?) ?? '',
      subtitle: (json['subtitle'] as String?) ?? '',
      imageUrl: resolveMediaUrl(json['image']),
      actionRoute: json['linkUrl'] as String?,
    );
  }

  static ProductPackageModel package(Map<String, dynamic> json) {
    final items = (json['items'] as List? ?? const []);
    final productIds = items
        .map((e) => (e as Map<String, dynamic>)['productId'] as String? ?? e['product']?['id'] as String?)
        .whereType<String>()
        .toList();
    return ProductPackageModel(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? '',
      subtitle: (json['subtitle'] as String?) ?? (json['description'] as String?) ?? '',
      productIds: productIds,
      price: (json['price'] as num?)?.toInt() ?? 0,
      originalPrice: (json['originalPrice'] as num?)?.toInt() ?? 0,
      coverImageUrl: resolveMediaUrl(json['coverImage']),
      badge: json['badge'] as String?,
      isFeatured: json['isFeatured'] as bool? ?? false,
    );
  }

  static UserModel user(Map<String, dynamic> json) {
    final tierName = (json['tier'] as String?) ?? 'normal';
    return UserModel(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? '',
      phone: (json['phone'] as String?) ?? '',
      email: json['email'] as String?,
      birthday: json['birthday'] != null ? DateTime.tryParse(json['birthday'].toString()) : null,
      avatarUrl: json['avatarUrl'] as String?,
      points: (json['loyaltyPoints'] as num?)?.toInt() ?? (json['points'] as num?)?.toInt() ?? 0,
      tier: LoyaltyTier.values.firstWhere(
        (e) => e.name == tierName,
        orElse: () => LoyaltyTier.normal,
      ),
      orderCount: (json['orderCount'] as num?)?.toInt() ?? (json['_count']?['orders'] as num?)?.toInt() ?? 0,
    );
  }

  static CouponModel coupon(Map<String, dynamic> json) {
    final rawType = (json['type'] as String?)?.toUpperCase() ?? 'PERCENT';
    final type = rawType.contains('FREE')
        ? CouponType.freeShipping
        : rawType.contains('FIRST')
            ? CouponType.firstOrder
            : CouponType.percent;
    return CouponModel(
      code: (json['code'] as String?) ?? '',
      type: type,
      value: (json['value'] as num?)?.toInt() ?? 0,
      description: (json['description'] as String?) ?? '',
      minOrder: (json['minOrder'] as num?)?.toInt() ?? 0,
    );
  }

  static ReviewModel review(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'] as String,
      productId: (json['productId'] as String?) ?? '',
      userName: (json['user']?['name'] as String?) ?? (json['userName'] as String?) ?? 'عميل',
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      comment: (json['comment'] as String?) ?? '',
      date: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      userAvatar: json['user']?['avatarUrl'] as String?,
    );
  }

  static NotificationType _notificationType(String? raw) {
    switch ((raw ?? '').toLowerCase()) {
      case 'order':
        return NotificationType.order;
      case 'new_arrival':
      case 'product':
        return NotificationType.newArrival;
      case 'reminder':
        return NotificationType.reminder;
      default:
        return NotificationType.offer;
    }
  }

  static NotificationModel notification(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String,
      type: _notificationType(json['type'] as String?),
      title: (json['title'] as String?) ?? '',
      body: (json['body'] as String?) ?? (json['message'] as String?) ?? '',
      time: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      isRead: json['isRead'] as bool? ?? false,
    );
  }

  static OrderStatus _orderStatus(String? raw) {
    switch ((raw ?? '').toUpperCase()) {
      case 'CONFIRMED':
      case 'PROCESSING':
        return OrderStatus.processing;
      case 'SHIPPED':
        return OrderStatus.shipped;
      case 'DELIVERED':
        return OrderStatus.delivered;
      case 'CANCELLED':
      case 'REFUNDED':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }

  static OrderModel orderSummary(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as String,
      orderNumber: (json['orderNumber'] as String?) ?? json['id'] as String,
      items: const [],
      address: AddressModel.fromJson(json['address'] as Map<String, dynamic>? ?? {
        'id': '',
        'fullName': '',
        'phone': '',
        'city': '',
      }),
      status: _orderStatus(json['status'] as String?),
      subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
      discount: (json['discountTotal'] as num?)?.toInt() ?? 0,
      shipping: (json['shippingFee'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      pointsEarned: (json['pointsEarned'] as num?)?.toInt() ?? 0,
    );
  }

  static OrderModel orderDetail(Map<String, dynamic> json) {
    final items = (json['items'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map((it) {
          final productJson = it['product'] as Map<String, dynamic>?;
          final product = productJson != null
              ? ProductRemoteMapper.fromJson(productJson)
              : ProductModel(
                  id: it['productId'] as String,
                  name: (it['productName'] as String?) ?? '',
                  brand: '',
                  brandId: '',
                  categoryId: '',
                  subcategoryId: '',
                  price: (it['unitPrice'] as num?)?.toInt() ?? 0,
                  originalPrice: (it['unitPrice'] as num?)?.toInt() ?? 0,
                  images: const [],
                  rating: 0,
                  reviewCount: 0,
                  soldCount: 0,
                  description: '',
                  ingredients: '',
                  howToUse: '',
                  stock: 0,
                  discountPercent: 0,
                  pointsEarned: 0,
                  createdAt: DateTime.now(),
                );
          return CartItemModel(
            product: product,
            quantity: (it['quantity'] as num?)?.toInt() ?? 1,
          );
        })
        .toList();
    return orderSummary(json).copyWithItems(items);
  }
}

extension OrderModelCopy on OrderModel {
  OrderModel copyWithItems(List<CartItemModel> items) => OrderModel(
        id: id,
        orderNumber: orderNumber,
        items: items,
        address: address,
        status: status,
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        total: total,
        createdAt: createdAt,
        pointsEarned: pointsEarned,
        deliveryDate: deliveryDate,
      );
}
