package com.deemaalhayat.app

import android.app.Activity
import android.app.Application
import android.graphics.Rect
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText

/**
 * تحسينات تجربة الكتابة في شاشة الدفع الأصلية من كي كارد (لا نملك تصميمها):
 * - لمس أي مكان خارج الحقول يغلق لوحة المفاتيح ويزيل التركيز.
 * - لمس حقل آخر ينقل التركيز إليه مباشرة دون إغلاق/فتح متكرر للوحة.
 * - زر "التالي" ينتقل بين الحقول، وآخر حقل يغلق اللوحة بزر "تم".
 */
object QiPaymentScreenPolish : Application.ActivityLifecycleCallbacks {
    private const val PAYMENT_ACTIVITY = "tech.finon.payment.ui"
    private var registered = false

    fun install(app: Application) {
        if (registered) return
        registered = true
        app.registerActivityLifecycleCallbacks(this)
    }

    private fun isPaymentScreen(a: Activity) = a.javaClass.name.startsWith(PAYMENT_ACTIVITY)

    override fun onActivityResumed(activity: Activity) {
        if (!isPaymentScreen(activity)) return
        val window = activity.window ?: return
        val current = window.callback
        if (current !is DismissKeyboardCallback) {
            window.callback = DismissKeyboardCallback(activity, current)
        }
        // الحقول قد تُبنى داخل Fragments بعد الظهور — نضبطها بعد أول إطار.
        window.decorView.post { tuneImeActions(window.decorView) }
    }

    /** يضبط أزرار لوحة المفاتيح فقط إن لم تحددها الحزمة بنفسها. */
    private fun tuneImeActions(root: View) {
        val fields = mutableListOf<EditText>()
        collect(root, fields)
        val visible = fields.filter { it.isShown && it.isEnabled }
        visible.forEachIndexed { i, f ->
            val action = f.imeOptions and EditorInfo.IME_MASK_ACTION
            if (action == EditorInfo.IME_ACTION_UNSPECIFIED || action == EditorInfo.IME_ACTION_NONE) {
                f.imeOptions = (f.imeOptions and EditorInfo.IME_MASK_ACTION.inv()) or
                    if (i == visible.lastIndex) EditorInfo.IME_ACTION_DONE else EditorInfo.IME_ACTION_NEXT
            }
        }
    }

    private fun collect(v: View, out: MutableList<EditText>) {
        if (v is EditText) out += v
        if (v is ViewGroup) for (i in 0 until v.childCount) collect(v.getChildAt(i), out)
    }

    private class DismissKeyboardCallback(
        private val activity: Activity,
        private val base: Window.Callback,
    ) : Window.Callback by base {
        private val rect = Rect()

        override fun dispatchTouchEvent(event: MotionEvent): Boolean {
            if (event.actionMasked == MotionEvent.ACTION_DOWN) {
                val focused = activity.currentFocus
                if (focused is EditText && !touchesAnyField(event)) {
                    val consumed = base.dispatchTouchEvent(event)
                    // إن لم ينقل اللمس التركيز إلى حقل آخر: نغلق اللوحة بهدوء.
                    val now = activity.currentFocus
                    if (now !is EditText || now === focused) hideKeyboard(focused)
                    return consumed
                }
            }
            return base.dispatchTouchEvent(event)
        }

        private fun touchesAnyField(event: MotionEvent): Boolean {
            val root = activity.window?.decorView ?: return false
            val fields = mutableListOf<EditText>()
            collect(root, fields)
            val x = event.rawX.toInt()
            val y = event.rawY.toInt()
            val slop = (12 * activity.resources.displayMetrics.density).toInt()
            return fields.any { f ->
                if (!f.isShown || !f.getGlobalVisibleRect(rect)) return@any false
                // نوسّع منطقة الحقل قليلاً لتشمل إطاره المرسوم حوله.
                rect.inset(-slop, -slop)
                rect.contains(x, y)
            }
        }

        private fun hideKeyboard(view: View) {
            val imm = activity.getSystemService(InputMethodManager::class.java)
            imm?.hideSoftInputFromWindow(view.windowToken, 0)
            view.clearFocus()
            // نعطي التركيز لجذر الشاشة حتى لا يقفز لحقل آخر ويفتح اللوحة من جديد.
            (activity.window?.decorView as? ViewGroup)?.apply {
                isFocusableInTouchMode = true
                requestFocus()
            }
        }
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityStarted(activity: Activity) {}
    override fun onActivityPaused(activity: Activity) {}
    override fun onActivityStopped(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
    override fun onActivityDestroyed(activity: Activity) {}
}
