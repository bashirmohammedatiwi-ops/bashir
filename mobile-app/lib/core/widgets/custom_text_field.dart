import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

class CustomTextField extends StatelessWidget {
  const CustomTextField({
    super.key,
    required this.controller,
    this.label,
    this.hint,
    this.obscureText = false,
    this.keyboardType,
    this.prefix,
    this.suffix,
    this.validator,
    this.maxLines = 1,
    this.inputFormatters,
    this.readOnly = false,
    this.onTap,
  });

  final TextEditingController controller;
  final String? label;
  final String? hint;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? prefix;
  final Widget? suffix;
  final String? Function(String?)? validator;
  final int maxLines;
  final List<TextInputFormatter>? inputFormatters;
  final bool readOnly;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(label!),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          maxLines: maxLines,
          inputFormatters: inputFormatters,
          readOnly: readOnly,
          onTap: onTap,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: prefix,
            suffixIcon: suffix,
          ),
        ),
      ],
    );
  }
}
