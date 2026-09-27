package com.deemaalhayat.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        ensureNotificationChannel()
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
