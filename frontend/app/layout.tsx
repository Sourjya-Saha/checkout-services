import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelOps Checkout Service Demo",
  description: "E-Commerce checkout demo app with incident simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
