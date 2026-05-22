import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsCentral",
  description: "Data Intelligence Platform (beta)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
