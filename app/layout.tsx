import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Link Share",
  description: "Share links from mobile to PC via QR code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
