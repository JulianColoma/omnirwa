"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/activos", label: "Activos" },
  { href: "/crear", label: "Crear activo" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra superior: marca, secciones y wallet. */
export function Nav() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <Link href="/" className="wordmark">
        OmniRWA
      </Link>
      <nav className="nav" aria-label="Secciones">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={isActive(pathname, href) ? "nav-link active" : "nav-link"}
            aria-current={isActive(pathname, href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <ConnectButton />
    </header>
  );
}
