import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PostHogPageview } from "@/components/PostHogPageview";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GestiOS - Gestion operativa para negocios",
  description: "Plataforma SaaS para inventario, ventas, compras, proveedores, pagos y operacion administrativa.",
  icons: {
    icon: [{ url: "/brand/gestios-mark.svg", sizes: "any", type: "image/svg+xml" }],
    apple: [{ url: "/brand/gestios-icon-on-dark-512.png", sizes: "512x512", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${manrope.variable} dark`}
    >
      <body className="font-sans text-gray-200 antialiased bg-brand-background">
        <PostHogProvider>
          <Suspense>
            <PostHogPageview />
          </Suspense>
          {children}
          <Toaster position="top-right" richColors theme="dark" />
        </PostHogProvider>
      </body>
    </html>
  );
}
