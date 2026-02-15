'use client'

import { useState } from 'react'
import { Player } from '@/lib/teamLogic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface PreMadeGroupsProps {
  selectedPlayers: Player[]
  groups: { [key: string]: string[] }
  onCreateGroup: (memberIds: string[]) => void
  onDeleteGroup: (groupId: string) => void
}

export function PreMadeGroups({
  selectedPlayers,
  groups,
  onCreateGroup,
  onDeleteGroup
}: PreMadeGroupsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [groupSelection, setGroupSelection] = useState<string[]>([])

  const groupedPlayerIds = Object.values(groups).flat()
  const availableForGroup = selectedPlayers.filter(
    (player) => !groupedPlayerIds.includes(player.id)
  )

  const handleCreateGroup = () => {
    if (groupSelection.length < 2) {
      toast.error("Select at least 2 players for a group")
      return
    }
    if (groupSelection.length > 5) {
      toast.error("Max 5 players per group")
      return
    }

    onCreateGroup(groupSelection)
    setGroupSelection([])
    setIsDialogOpen(false)
  }

  const toggleGroupSelection = (id: string) => {
    setGroupSelection((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  return (
    <Card className="bg-zinc-900/30 border-zinc-800">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-zinc-200">Pre-made Groups</CardTitle>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Plus className="w-3 h-3 mr-2" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-zinc-400 mb-4">
                Select players who must be on the same team (2-5 players).
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableForGroup.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">No available players to group.</p>
                ) : (
                  availableForGroup.map((player) => (
                    <div
                      key={player.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border cursor-pointer
                        ${groupSelection.includes(player.id) ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:bg-zinc-800'}
                      `}
                      onClick={() => toggleGroupSelection(player.id)}
                    >
                      <span className="text-zinc-200">{player.nickname}</span>
                      <Checkbox checked={groupSelection.includes(player.id)} />
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGroup} disabled={groupSelection.length < 2}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3">
        {Object.entries(groups).map(([groupId, memberIds]) => (
          <div key={groupId} className="bg-blue-950/20 border border-blue-500/20 p-3 rounded-lg relative group">
            <button
              onClick={() => onDeleteGroup(groupId)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete group"
            >
              <X size={14} />
            </button>
            <div className="flex flex-wrap gap-2">
              {memberIds.map((id) => {
                const player = selectedPlayers.find((selectedPlayer) => selectedPlayer.id === id)
                return player ? (
                  <Badge key={id} variant="secondary" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">
                    {player.nickname}
                  </Badge>
                ) : null
              })}
            </div>
          </div>
        ))}
        {Object.keys(groups).length === 0 && (
          <p className="text-sm text-zinc-500">No groups created.</p>
        )}
      </CardContent>
    </Card>
  )
}
