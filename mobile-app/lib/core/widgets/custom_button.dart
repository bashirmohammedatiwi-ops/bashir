import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../constants/app_colors.dart';
import '../constants/app_sizes.dart';
import '../theme/text_styles.dart';

class CustomButton extends StatefulWidget {
  const CustomButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.width,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? width;

  @override
  State<CustomButton> createState() => _CustomButtonState();
}

class _CustomButtonState extends State<CustomButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.isLoading ? null : widget.onPressed,
      child: AnimatedScale(
        scale: _pressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          width: widget.width ?? double.infinity,
          height: AppSizes.buttonHeight,
          decoration: BoxDecoration(
            gradient: widget.onPressed == null
                ? null
                : AppColors.primaryGradient,
            color: widget.onPressed == null ? AppColors.textSecondary : null,
            borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
            boxShadow: widget.onPressed == null
                ? null
                : [AppColors.cardShadow],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.isLoading ? null : widget.onPressed,
              borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
              child: Center(
                child: widget.isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (widget.icon != null) ...[
                            Icon(widget.icon, color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            widget.label,
                            style: AppTextStyles.title(color: Colors.white),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class CustomOutlineButton extends StatelessWidget {
  const CustomOutlineButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, AppSizes.buttonHeight),
        side: const BorderSide(color: AppColors.primary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) Icon(icon, color: AppColors.primary),
          if (icon != null) const SizedBox(width: 8),
          Text(label, style: AppTextStyles.title(color: AppColors.primary)),
        ],
      ),
    );
  }
}
