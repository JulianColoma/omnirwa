import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Contracts } from "@/components/Contracts";
import { Nav } from "@/components/Nav";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniRWA",
  description: "Fracciones de activos reales, con renta y voto.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <Providers>
          <div className="page">
            <Nav />
            <main>{children}</main>
            <Contracts />
          </div>
        </Providers>
      </body>
    </html>
  );
}
