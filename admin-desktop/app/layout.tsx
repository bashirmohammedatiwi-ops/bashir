import "./globals.css";
import React from "react";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "Alhayaa Admin",
  description: "لوحة تحكم متجر الحياة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
