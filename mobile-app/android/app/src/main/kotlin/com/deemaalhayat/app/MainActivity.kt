package com.deemaalhayat.app

import android.app.ActivityManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var qiPayment: QiPaymentBridge? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        qiPayment = QiPaymentBridge(this, flutterEngine.dartExecutor.binaryMessenger)
        // قدرة الجهاز (الذاكرة والإصدار) — يقرّر التطبيق منها مستوى المؤثرات والذاكرة المؤقتة.
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "deema/device").setMethodCallHandler { call, result ->
            if (call.method != "info") return@setMethodCallHandler result.notImplemented()
            val am = getSystemService(ACTIVITY_SERVICE) as ActivityManager
            val mem = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
            result.success(
                mapOf(
                    "totalMem" to mem.totalMem,
                    "lowRam" to am.isLowRamDevice,
                    "sdk" to Build.VERSION.SDK_INT,
                    "cores" to Runtime.getRuntime().availableProcessors(),
                ),
            )
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        ensureNotificationChannel()
        QiPaymentScreenPolish.install(application)
        super.onCreate(savedInstanceState)
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java) ?: return
        val id = "alhayaa_notifications"
        if (manager.getNotificationChannel(id) != null) return
        val channel = NotificationChannel(
            id,
            "إشعارات ديما الحياة",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "عروض وطلبات وتنبيهات المتجر"
            enableVibration(true)
        }
        manager.createNotificationChannel(channel)
    }
}
