"use client";

import Link from "next/link";
import { useState } from "react";

import { useStore } from "@/components/StoreProvider";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/products/", label: "المنتجات" },
  { href: "/categories/", label: "الأقسام" },
  { href: "/brands/", label: "البراندات" },
  { href: "/offers/", label: "العروض" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { storeName } = useStore();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt={storeName} className="brand-logo" />
          <span className="brand-name">{storeName}</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="القائمة"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${open ? "is-open" : ""}`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <a
          href="https://play.google.com/store/apps/details?id=com.deemaalhayat.app"
          className="app-badge"
          target="_blank"
          rel="noopener noreferrer"
        >
          حمّلي التطبيق
        </a>
      </div>
    </header>
  );
}
