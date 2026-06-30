import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Assisted TVA Review",
  description: "Decision support dashboard for AI-assisted TVA review workflows."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
