package com.deemaalhayat.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.neovisionaries.i18n.LanguageCode
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import tech.finon.payment.PaymentSDK
import tech.finon.payment.config.AliPaySettings
import tech.finon.payment.config.AvailablePaymentMethods
import tech.finon.payment.config.ConnectionSettings
import tech.finon.payment.config.Merchant
import tech.finon.payment.config.PaymentMethodChoice
import tech.finon.payment.config.PaymentTypeAliPay
import tech.finon.payment.config.SDKLanguage
import tech.finon.payment.config.Theme
import tech.finon.payment.config.WritingDirection
import tech.finon.payment.config.v2.PaymentSDKConfiguration
import tech.finon.payment.config.v2.PaymentSDKLocalization
import tech.finon.payment.domain.models.CustomerInfo
import tech.finon.payment.domain.models.PaymentDetails
import tech.finon.payment.domain.models.PaymentMethod
import tech.finon.payment.domain.models.PaymentTokenType
import tech.finon.payment.domain.models.PaymentType
import java.util.Currency

/**
 * جسر واجهة الدفع الأصلية من كي كارد (QiCard Payment SDK 2.0.4).
 *
 * لا يحمل أي بيانات دخول: الاتصال بالبوابة يتم برقم الطرفية والمفتاح العام فقط،
 * وعملية الدفع نفسها يُنشئها السيرفر ويؤكدها من البوابة مباشرة.
 */
class QiPaymentBridge(private val activity: Activity, messenger: BinaryMessenger) {
    private val channel = MethodChannel(messenger, CHANNEL)
    private val main = Handler(Looper.getMainLooper())
    private var initializedFor: String? = null
    private var pending: MethodChannel.Result? = null

    init {
        channel.setMethodCallHandler { call, result ->
            when (call.method) {
                "initialize" -> initialize(call, result)
                "pay" -> pay(call, result)
                else -> result.notImplemented()
            }
        }
    }

    private fun initialize(call: MethodCall, result: MethodChannel.Result) {
        try {
            val baseUrl = call.argument<String>("baseUrl").orEmpty().trimEnd('/') + "/"
            val publicKey = call.argument<String>("publicKey").orEmpty()
            val terminalId = call.argument<String>("terminalId").orEmpty()
            val arabic = call.argument<String>("language") != "en"
            if (baseUrl == "/" || publicKey.isEmpty() || terminalId.isEmpty()) {
                result.error("CONFIG", "Missing payment configuration", null)
                return
            }
            val key = "$baseUrl|$terminalId|$arabic|${publicKey.hashCode()}"
            if (initializedFor == key) {
                result.success(true)
                return
            }

            val connection = ConnectionSettings(
                baseUrl = baseUrl,
                headers = mapOf("X-Terminal-Id" to terminalId),
                publicKey = publicKey,
                certificates = emptyMap(),
                timeoutRequest = 90,
            )
            val localization = PaymentSDKLocalization(
                availableLanguages = setOf(
                    SDKLanguage(LanguageCode.ar, "العربية"),
                    SDKLanguage(LanguageCode.en, "English"),
                ),
                selectedLanguageCode = if (arabic) LanguageCode.ar else LanguageCode.en,
                writingDirection = if (arabic) WritingDirection.RIGHT_TO_LEFT else WritingDirection.LEFT_TO_RIGHT,
            )
            val config = PaymentSDKConfiguration.Builder()
                .setConnectionSettings(connection)
                .setMerchant(
                    Merchant(
                        call.argument<String>("merchantName") ?: "Deema Alhayat",
                        call.argument<String>("merchantLogoUrl").orEmpty(),
                        call.argument<String>("merchantLogoUrl").orEmpty(),
                    ),
                )
                .setLocalization(localization)
                .setTheme(Theme.LIGHT)
                .setAvailablePaymentMethods(setOf(AvailablePaymentMethods.CARD))
                .setPaymentMethodChoice(PaymentMethodChoice.ON_APP)
                .setAliPaySettings(AliPaySettings(PaymentTypeAliPay.QR, true, true))
                .build()

            val onExit: ((Context, () -> Unit) -> Unit) = { ctx, exit ->
                main.post { confirmExit(ctx, exit, arabic) }
            }
            try {
                PaymentSDK.initialize(activity, config, onExit)
            } catch (e: Exception) {
                // إعادة التهيئة بإعدادات جديدة: نحدّث ما يمكن تحديثه دون إسقاط الطلب.
                if (e.message?.contains("already", ignoreCase = true) != true) throw e
            }
            PaymentSDK.setPaymentGatewayBaseUrl(baseUrl)
            initializedFor = key
            result.success(true)
        } catch (e: Exception) {
            Log.e(TAG, "initialize failed", e)
            result.error("INIT", e.message ?: "init failed", null)
        }
    }

    private fun pay(call: MethodCall, result: MethodChannel.Result) {
        if (initializedFor == null) {
            result.error("NOT_INITIALIZED", "Payment SDK is not initialized", null)
            return
        }
        if (pending != null) {
            result.error("BUSY", "A payment is already in progress", null)
            return
        }
        try {
            val paymentId = call.argument<String>("paymentId").orEmpty()
            val requestId = call.argument<String>("requestId").orEmpty()
            val accountId = call.argument<String>("accountId").orEmpty()
            val amount = (call.argument<Number>("amount") ?: 0).toDouble()
            val currency = call.argument<String>("currency") ?: "IQD"
            if (paymentId.isEmpty() || requestId.isEmpty() || accountId.isEmpty()) {
                result.error("ARGS", "Missing payment details", null)
                return
            }
            val details = PaymentDetails(
                paymentId = paymentId,
                requestId = requestId,
                customerInfo = CustomerInfo(
                    accountId = accountId,
                    embossingName = call.argument<String>("holderName") ?: "",
                ),
                amount = amount.toBigDecimal(),
                currency = Currency.getInstance(currency),
                paymentMethod = PaymentMethod(PaymentType.CARD, ""),
                nonPaymentOperation = false,
                withoutAuthenticate = false,
                needPaymentToken = false,
                tokenType = PaymentTokenType.AUTH,
            )
            pending = result
            PaymentSDK.processPayment(
                details,
                { finish(mapOf("status" to "success")) },
                { message -> finish(mapOf("status" to "error", "message" to message)) },
            )
        } catch (e: Exception) {
            Log.e(TAG, "pay failed", e)
            finish(mapOf("status" to "error", "message" to (e.message ?: "payment failed")))
            if (pending === result) pending = null
        }
    }

    /** يرد على Flutter مرة واحدة فقط مهما تعددت نداءات الحزمة. */
    private fun finish(payload: Map<String, Any?>) {
        main.post {
            val r = pending ?: return@post
            pending = null
            r.success(payload)
        }
    }

    private fun confirmExit(ctx: Context, exit: () -> Unit, arabic: Boolean) {
        AlertDialog.Builder(ctx)
            .setTitle(if (arabic) "إلغاء الدفع؟" else "Cancel payment?")
            .setMessage(
                if (arabic) "لن يُخصم أي مبلغ، ويمكنك إكمال الدفع لاحقاً من صفحة الطلب."
                else "Nothing will be charged. You can complete the payment later from your order.",
            )
            .setPositiveButton(if (arabic) "نعم، إلغاء" else "Yes, cancel") { _, _ ->
                exit.invoke()
                finish(mapOf("status" to "cancelled"))
            }
            .setNegativeButton(if (arabic) "متابعة الدفع" else "Continue") { d, _ -> d.dismiss() }
            .setCancelable(true)
            .show()
    }

    companion object {
        const val CHANNEL = "deema/qi_payment"
        private const val TAG = "QiPayment"
    }
}
