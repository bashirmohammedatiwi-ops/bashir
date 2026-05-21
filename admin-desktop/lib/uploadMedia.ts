import { api } from "./api";
import { mediaThumb } from "./mediaUrl";

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
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);

  try {
    const res = await api.post("/media/upload", form, {
      timeout: 120_000,
    });

    const media = res.data?.data ?? res.data;
    return { ...media, previewUrl: mediaThumb(media) };
  } catch (error: unknown) {
    throw new Error(uploadErrorMessage(error));
  }
}
