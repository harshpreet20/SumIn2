import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "./app-shell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "HealthCamp - Prescription Management",
  description: "Offline-first prescription management system for healthcare camps",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AppShell>{children}</AppShell>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
