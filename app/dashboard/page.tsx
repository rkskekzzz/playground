
'use client'

import { useState } from 'react'
import { AddMemberForm } from '@/components/members/AddMemberForm'
import { MemberList } from '@/components/members/MemberList'
import { GameHistory } from '@/components/game/GameHistory'

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleMemberAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Member Management</h1>
        <p className="text-zinc-400">Add and manage your scrim members here.</p>
      </div>

      <AddMemberForm onMemberAdded={handleMemberAdded} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Member List</h2>
        <MemberList refreshTrigger={refreshTrigger} />
      </div>

      <div className="space-y-4 pt-8 border-t border-zinc-800">
        <h2 className="text-xl font-semibold">Recent Games</h2>
        <GameHistory />
      </div>
    </div>
  )
}
