import { api, setAuthToken } from "./api";
import { mediaThumb } from "./mediaUrl";
import { ADMIN_EMAIL, ADMIN_PASSWORD, DEFAULT_ADMIN_USER, useAuth } from "@/store/auth";

let authPromise: Promise<void> | null = null;

async function loginToBackend() {
  const res = await api.post("/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const tokens = res.data?.data ?? res.data;
  useAuth.getState().setSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: DEFAULT_ADMIN_USER,
  });
}

async function ensureBackendAuth(force = false) {
  const token = useAuth.getState().accessToken;
  if (!force && token && token !== "local-dev-token") return;

  if (force) {
    await loginToBackend();
    return;
  }

  if (!authPromise) {
    authPromise = (async () => {
      try {
        await loginToBackend();
      } catch {
        throw new Error("تعذر الاتصال بالباك اند. شغّل الخادم على http://localhost:3000");
      } finally {
        authPromise = null;
      }
    })();
  }

  await authPromise;
}

function uploadErrorMessage(error: unknown): string {
  const e = error as any;
  return (
    e?.response?.data?.error?.message ??
    e?.response?.data?.message ??
    e?.message ??
    "فشل رفع الصورة"
  );
}

/** Fast multipart upload — avoids base64 bloat and timeouts. */
export async function uploadMediaFile(file: File, purpose = "GENERAL") {
  await ensureBackendAuth();

  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);

  try {
    const res = await api.post("/media/upload", form, {
      timeout: 120_000,
    });

    const media = res.data?.data ?? res.data;
    return { ...media, previewUrl: mediaThumb(media) };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      setAuthToken(null);
      await ensureBackendAuth(true);

      const res = await api.post("/media/upload", form, {
        timeout: 120_000,
      });
      const media = res.data?.data ?? res.data;
      return { ...media, previewUrl: mediaThumb(media) };
    }

    throw new Error(uploadErrorMessage(error));
  }
}
