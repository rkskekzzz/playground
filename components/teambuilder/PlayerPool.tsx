
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Member } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

interface PlayerPoolProps {
  selectedIds: string[]
  onToggle: (member: Member) => void
}

export function PlayerPool({ selectedIds, onToggle }: PlayerPoolProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .order('nickname', { ascending: true })
      if (data) setMembers(data)
    }
    fetchMembers()
  }, [])

  const filteredMembers = members.filter(m =>
    m.nickname.toLowerCase().includes(search.toLowerCase()) ||
    m.lol_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-zinc-800 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200">Player Pool</h3>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
            {selectedIds.length} / 10 Selected
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search players..."
            className="pl-8 bg-zinc-950/50 border-zinc-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 w-full min-h-0">
        <div className="p-2 grid grid-cols-1 gap-1">
          {filteredMembers.map(member => {
            const isSelected = selectedIds.includes(member.id)
            return (
              <div
                key={member.id}
                onClick={() => onToggle(member)}
                className={`
                  flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : 'hover:bg-zinc-800/50 border border-transparent'}
                `}
              >
                <div className="flex flex-col">
                  <span className={`font-medium ${isSelected ? 'text-blue-400' : 'text-zinc-300'}`}>
                    {member.nickname}
                  </span>
                  <span className="text-xs text-zinc-500">{member.lol_id}</span>
                </div>
                <Checkbox
                  checked={isSelected}
                  className={isSelected ? 'border-blue-500 data-[state=checked]:bg-blue-500' : 'border-zinc-700'}
                />
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
