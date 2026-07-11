class AdminUser {
  const AdminUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
  });

  final String id;
  final String email;
  final String name;
  final String role;

  bool get isStaff {
    const allowed = {'SUPER_ADMIN', 'ADMIN', 'STAFF'};
    return allowed.contains(role.toUpperCase());
  }

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      role: json['role']?.toString() ?? 'CUSTOMER',
    );
  }
}
