"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Form, Input, Typography } from "antd";
import { api, setAuthToken } from "@/lib/api";
import { VPS_ORIGIN } from "@/lib/config";
import { appNavigate } from "@/lib/navigate";
import { mutations } from "@/lib/queries";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const accessToken = useAuth((s) => s.accessToken);
  const setSession = useAuth((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuth.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuth.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated && accessToken) {
      appNavigate(router, "/dashboard");
    }
  }, [hydrated, accessToken, router]);

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true);
    try {
      const tokens = await mutations.login(values.email, values.password);
      setAuthToken(tokens.accessToken);
      const meRes = await api.get("/auth/me");
      const user = meRes.data?.data ?? meRes.data;
      if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(user.role)) {
        setAuthToken(null);
        message.error("هذا الحساب ليس حساب إدارة — استخدم حساب الأدمن");
        return;
      }
      setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
      message.success("تم تسجيل الدخول");
      appNavigate(router, "/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message;
      if (!err?.response) {
        message.error(`تعذر الاتصال بالسيرفر (${VPS_ORIGIN}) — تحقق من الإنترنت`);
      } else if (status === 401) {
        message.error(
          apiMsg === "Invalid credentials"
            ? "البريد أو كلمة المرور غير صحيحة"
            : (apiMsg ?? "بيانات الدخول غير صحيحة"),
        );
      } else {
        message.error(apiMsg ?? `خطأ من السيرفر (${status})`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return <div className="alhayaa-login-screen">جاري التحميل...</div>;
  }

  return (
    <div className="alhayaa-login-screen">
      <Card className="alhayaa-login-card" bordered={false}>
        <div className="alhayaa-login-brand">
          <span className="alhayaa-login-logo">الحياة</span>
          <Typography.Text type="secondary">لوحة تحكم المتجر</Typography.Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[{ required: true, message: "أدخل البريد" }, { type: "email" }]}
          >
            <Input autoComplete="username" placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="كلمة المرور"
            rules={[{ required: true, message: "أدخل كلمة المرور" }]}
          >
            <Input.Password autoComplete="current-password" placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            دخول
          </Button>
        </Form>

        <p className="alhayaa-login-hint">السيرفر: {VPS_ORIGIN}</p>
      </Card>
    </div>
  );
}
