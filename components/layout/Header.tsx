"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Users, Gamepad2, History, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/context/TeamContext";

const navItems = [
  { name: "Team Builder", href: "/", icon: Gamepad2 },
  { name: "History", href: "/history", icon: History },
  { name: "Members", href: "/dashboard", icon: Users },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useTeam();

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 h-14">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="font-semibold text-white">LoL Team Builder</span>
          </div>

          {/* Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-in Menu */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 z-50 transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Logo in menu */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    L
                  </div>
                  <span className="font-semibold text-white">
                    LoL Team Builder
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 flex flex-col">
                <div className="space-y-2 flex-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                          isActive
                            ? "text-white bg-zinc-800"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        )}
                      >
                        <item.icon size={20} strokeWidth={1.5} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition-all duration-200"
                  >
                    <LogOut size={20} strokeWidth={1.5} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
