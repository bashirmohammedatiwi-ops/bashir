import Flutter
import UIKit
import payment_sdk
import TdsSdkIos

/// جسر واجهة الدفع الأصلية من كي كارد (QiCard Payment SDK 2.0.4).
/// لا يحمل أي بيانات دخول — رقم الطرفية والمفتاح العام فقط؛ السيرفر ينشئ الدفعة ويؤكدها.
final class QiPaymentBridge: NSObject {
  static let channelName = "deema/qi_payment"

  private let channel: FlutterMethodChannel
  private var sdk: PaymentSDK?
  private var initializedFor: String?
  private var pending: FlutterResult?
  private var arabic = true

  init(messenger: FlutterBinaryMessenger) {
    channel = FlutterMethodChannel(name: Self.channelName, binaryMessenger: messenger)
    super.init()
    channel.setMethodCallHandler { [weak self] call, result in
      guard let self else { return }
      switch call.method {
      case "initialize": self.initialize(call, result)
      case "pay": self.pay(call, result)
      default: result(FlutterMethodNotImplemented)
      }
    }
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(onSdkBack),
      name: NSNotification.Name("finon_pay_sdk_on_back_click"),
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  private func initialize(_ call: FlutterMethodCall, _ result: @escaping FlutterResult) {
    guard let args = call.arguments as? [String: Any] else {
      result(FlutterError(code: "ARGS", message: "Invalid arguments", details: nil))
      return
    }
    var baseUrl = args["baseUrl"] as? String ?? ""
    while baseUrl.hasSuffix("/") { baseUrl.removeLast() }
    let publicKey = args["publicKey"] as? String ?? ""
    let terminalId = args["terminalId"] as? String ?? ""
    arabic = (args["language"] as? String) != "en"
    guard !baseUrl.isEmpty, !publicKey.isEmpty, !terminalId.isEmpty else {
      result(FlutterError(code: "CONFIG", message: "Missing payment configuration", details: nil))
      return
    }
    let key = "\(baseUrl)|\(terminalId)|\(arabic)|\(publicKey.hashValue)"
    if initializedFor == key, sdk != nil {
      result(true)
      return
    }

    let connection = ConnectionSettings(
      baseUrl: baseUrl,
      publicKey: publicKey,
      certificates: [],
      xTerminalId: terminalId,
      timeoutRequest: 90
    )
    let localization = PaymentSDKLocalization(
      availableLanguages: [
        SdkLanguage(code: "ar", name: "العربية"),
        SdkLanguage(code: "en", name: "English"),
      ],
      selectedLanguageCode: arabic ? "ar" : "en",
      writingDirection: arabic ? .rightToLeft : .leftToRight
    )
    let config = PaymentSDKConfiguration(
      localization: localization,
      theme: .light,
      skipResultScreen: false,
      connectionSettings: connection,
      paymentMethodChoice: .onApp,
      availablePaymentMethods: [.CARD],
      tdsSettings: TDSSettings(authFirst: .SDK, authFallback: true, tdssUICustomization: UiCustomization()),
      aliPaySettings: AliPaySettings(showFirst: .QR, qrToDeepLinkFallback: true, deepLinkToQrFallback: true)
    )
    sdk = PaymentSDK(with: config)
    // تهيئة التخزين المحلي للحزمة قبل أول دفعة.
    _ = try? sdk?.setCustomerInfo(accountId: "__init__", embossingName: "Init", email: nil, accountNumber: nil)
    initializedFor = key
    result(true)
  }

  private func pay(_ call: FlutterMethodCall, _ result: @escaping FlutterResult) {
    guard let sdk else {
      result(FlutterError(code: "NOT_INITIALIZED", message: "Payment SDK is not initialized", details: nil))
      return
    }
    guard pending == nil else {
      result(FlutterError(code: "BUSY", message: "A payment is already in progress", details: nil))
      return
    }
    guard let args = call.arguments as? [String: Any],
          let paymentId = args["paymentId"] as? String, !paymentId.isEmpty,
          let requestId = args["requestId"] as? String, !requestId.isEmpty,
          let accountId = args["accountId"] as? String, !accountId.isEmpty
    else {
      result(FlutterError(code: "ARGS", message: "Missing payment details", details: nil))
      return
    }
    let amount = (args["amount"] as? NSNumber)?.doubleValue ?? 0
    let currencyCode = args["currency"] as? String ?? "IQD"
    let holder = (args["holderName"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Customer"

    let customer: CustomerInfo
    do {
      if let existing = try sdk.getCustomerInfo(accountId: accountId) {
        customer = existing
      } else if let created = try sdk.setCustomerInfo(
        accountId: accountId, embossingName: holder, email: nil, accountNumber: nil
      ) {
        customer = created
      } else {
        result(["status": "error", "message": "Customer storage unavailable"])
        return
      }
    } catch {
      result(["status": "error", "message": error.localizedDescription])
      return
    }

    var details = PaymentDetails(
      paymentId: paymentId,
      requestId: requestId,
      customerInfo: customer,
      amount: Decimal(amount),
      currency: Currency(currencyCode: currencyCode),
      paymentMethod: PaymentMethod(.CARD, paymentToken: ""),
      nonPaymentOperation: false,
      withoutAuthenticate: false,
      needPaymentToken: false,
      tokenType: .AUTH
    )
    details.setPaymentID(paymentId)
    pending = result
    installKeyboardDismiss()

    Task { @MainActor [weak self] in
      do {
        try await sdk.processPayment(
          paymentDetails: details,
          onSuccess: { self?.finish(["status": "success"]) },
          onError: { message in self?.finish(["status": "error", "message": message]) }
        )
      } catch {
        self?.finish(["status": "error", "message": error.localizedDescription])
      }
    }
  }

  /// يرد على Flutter مرة واحدة فقط.
  private func finish(_ payload: [String: Any]) {
    DispatchQueue.main.async { [weak self] in
      guard let self, let r = self.pending else { return }
      self.pending = nil
      self.removeKeyboardDismiss()
      r(payload)
    }
  }

  // MARK: - لوحة المفاتيح في شاشة البطاقة
  // لمس أي مكان خارج الحقول يغلق لوحة المفاتيح؛ لمس حقل آخر ينقل التركيز طبيعياً.

  private var dismissTap: UITapGestureRecognizer?

  private func installKeyboardDismiss() {
    guard dismissTap == nil, let window = Self.keyWindow() else { return }
    let tap = UITapGestureRecognizer(target: self, action: #selector(onBackgroundTap(_:)))
    tap.cancelsTouchesInView = false
    tap.delegate = self
    window.addGestureRecognizer(tap)
    dismissTap = tap
  }

  private func removeKeyboardDismiss() {
    if let tap = dismissTap { tap.view?.removeGestureRecognizer(tap) }
    dismissTap = nil
  }

  @objc private func onBackgroundTap(_ g: UITapGestureRecognizer) {
    g.view?.endEditing(true)
  }

  private static func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.windows.first { $0.isKeyWindow } }
      .first
  }

  @objc private func onSdkBack() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let ar = self.arabic
      let alert = UIAlertController(
        title: ar ? "إلغاء الدفع؟" : "Cancel payment?",
        message: ar
          ? "لن يُخصم أي مبلغ، ويمكنك إكمال الدفع لاحقاً من صفحة الطلب."
          : "Nothing will be charged. You can complete the payment later from your order.",
        preferredStyle: .alert
      )
      alert.addAction(UIAlertAction(title: ar ? "متابعة الدفع" : "Continue", style: .cancel))
      alert.addAction(UIAlertAction(title: ar ? "نعم، إلغاء" : "Yes, cancel", style: .destructive) { [weak self] _ in
        self?.sdk?.cancel()
        self?.finish(["status": "cancelled"])
      })
      Self.topController()?.present(alert, animated: true)
    }
  }

  private static func topController() -> UIViewController? {
    var top = keyWindow()?.rootViewController
    while let presented = top?.presentedViewController { top = presented }
    return top
  }
}

extension QiPaymentBridge: UIGestureRecognizerDelegate {
  /// لا نغلق اللوحة إن كان اللمس على حقل نص (أو داخله) — ليتنقّل التركيز بين الحقول.
  func gestureRecognizer(_ g: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
    var v: UIView? = touch.view
    while let cur = v {
      if cur is UITextField || cur is UITextView { return false }
      v = cur.superview
    }
    return true
  }

  func gestureRecognizer(
    _ g: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
  ) -> Bool { true }
}
