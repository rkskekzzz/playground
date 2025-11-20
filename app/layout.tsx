
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LoL Team Builder",
  description: "Internal scrim team building system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
