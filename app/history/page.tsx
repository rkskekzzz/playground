
'use client'

import { GameList } from '@/components/history/GameList'

export default function HistoryPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Game History</h1>
        <p className="text-zinc-400">View past match results and team compositions.</p>
      </div>

      <div className="flex-1 min-h-0">
        <GameList />
      </div>
    </div>
  )
}
