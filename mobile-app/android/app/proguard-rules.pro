# تقليص كود أندرويد (R8) — مع إبقاء حزمة الدفع من كي كارد ومكتباتها كما هي،
# لأنها تعتمد على الانعكاس (Jackson/Gson/Retrofit/Room) والتشفير (BouncyCastle/Nimbus) في 3DS.

# حزمة كي كارد وبروتوكول 3DS
-keep class tech.finon.** { *; }
-keep interface tech.finon.** { *; }
-keep class com.emvco3ds.** { *; }
-dontwarn tech.finon.**
-dontwarn com.emvco3ds.**

# مكتبات تعتمد عليها الحزمة
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**
-keep class com.nimbusds.** { *; }
-dontwarn com.nimbusds.**
-keep class net.minidev.** { *; }
-dontwarn net.minidev.**
-keep class com.fasterxml.jackson.** { *; }
-dontwarn com.fasterxml.jackson.**
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod, Exceptions
-keep class com.google.gson.** { *; }
-keep class * extends com.google.gson.TypeAdapter
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * { @retrofit2.http.* <methods>; }
-dontwarn retrofit2.**
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep class org.tinylog.** { *; }
-dontwarn org.tinylog.**
-keep class com.scottyab.rootbeer.** { *; }
-keep class com.neovisionaries.i18n.** { *; }
-keep class com.airbnb.lottie.** { *; }
-keep class jp.wasabeef.blurry.** { *; }
-keep class com.chuckerteam.chucker.** { *; }
-dontwarn com.chuckerteam.chucker.**

# جسر الدفع في التطبيق
-keep class com.deemaalhayat.app.** { *; }

# Flutter يحتاجها أحياناً عند التقليص
-dontwarn com.google.android.play.core.**
