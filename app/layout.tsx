import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WISE Analytics — Project Tracker",
  description: "Internal project tracker for WISE Analytics service lines.",
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
