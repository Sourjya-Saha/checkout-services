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
    <html lang="en">
      <body className="min-h-screen bg-[#f5f5f5] text-[#292524] antialiased selection:bg-[#292524] selection:text-white">
        {children}
      </body>
    </html>
  );
}
