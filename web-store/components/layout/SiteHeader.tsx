import Link from "next/link";

import { displayStoreName } from "@/lib/config";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/products/", label: "المنتجات" },
  { href: "/categories/", label: "الأقسام" },
  { href: "/brands/", label: "البراندات" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <img src="/logo.png" alt={displayStoreName("ar")} className="brand-logo" />
          <span className="brand-name">{displayStoreName("ar")}</span>
        </Link>
        <nav className="nav">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href="https://play.google.com/store"
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
