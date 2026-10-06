import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Work Logger",
  description: "A tiny private daily work log",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
