import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
import { TeamProvider } from "@/context/TeamContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
      <body
        className="bg-zinc-950 text-zinc-100 flex h-screen overflow-hidden antialiased"
      >
        <TeamProvider>
          <AuthGuard>
            <Header />
            <Sidebar />
            <main className="flex-1 overflow-auto p-4 md:p-6 pt-16 md:pt-6 pb-8 md:pb-6">
              {children}
            </main>
          </AuthGuard>
          <Toaster />
        </TeamProvider>
      </body>
    </html>
  );
}
