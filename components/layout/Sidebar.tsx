
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Gamepad2, Settings, History } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Team Builder', href: '/', icon: Gamepad2 },
  { name: 'History', href: '/history', icon: History },
  { name: 'Members', href: '/dashboard', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen w-16 bg-zinc-900 border-r border-zinc-800 items-center py-4">
      <div className="mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          L
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-4 w-full items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "text-white bg-zinc-800"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
              title={item.name}
            >
              <item.icon size={24} strokeWidth={1.5} />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto">
        <button className="p-3 text-zinc-400 hover:text-white transition-colors">
          <Settings size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
