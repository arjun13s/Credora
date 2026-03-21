import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credora",
  description:
    "Consent-based housing trust infrastructure for thin-file applicants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
