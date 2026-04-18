import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
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
  title: "GestiOS — Gestión Completa para tu Tienda",
  description: "Plataforma SaaS para gestión de inventario, ventas, pedidos y clientes. Para cualquier tipo de tienda.",
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
        {children}
      </body>
    </html>
  );
}
