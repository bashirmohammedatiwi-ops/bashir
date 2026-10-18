import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = { title: "المفضلة", robots: { index: false } };

export default function L({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
