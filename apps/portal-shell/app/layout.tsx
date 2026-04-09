import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

// NOTE: do NOT set `runtime = "edge"` in the root layout.
// It forces ALL child routes to edge runtime in dev mode, causing
// RSC manifest errors with pnpm. Individual pages/routes that need
// edge (for Cloudflare Pages) declare their own `runtime = "edge"`.

export const metadata: Metadata = {
  title: "Sócios do Agro",
  description: "Plataforma integrada Safras & Cifras",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
