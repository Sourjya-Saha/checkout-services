import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelOps | Autonomous SRE Engine & E-Commerce Platform",
  description: "Autonomous SRE orchestration engine and resilient e-commerce storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#060a0a]">
      <body className="min-h-screen bg-[#060a0a] text-white antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
